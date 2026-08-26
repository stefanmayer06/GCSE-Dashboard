create function public.finalize_study_session_operation(
  p_id uuid,
  p_user_id uuid,
  p_subject text,
  p_kind text,
  p_operation jsonb,
  p_response jsonb
)
returns jsonb
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  session public.study_sessions;
  mutation jsonb;
  canonical_result jsonb;
begin
  select * into session from public.study_sessions where id = p_id for update;
  if session.id is null then return jsonb_build_object('status', 'not_found'); end if;
  if session.user_id <> p_user_id then return jsonb_build_object('status', 'forbidden'); end if;
  if session.subject <> p_subject or session.kind <> p_kind then
    return jsonb_build_object('status', 'mismatch');
  end if;
  if session.status = 'completed' then
    return jsonb_build_object('status', 'completed', 'result', session.result, 'replayed', true,
      'session', public.study_session_json(session));
  end if;
  if session.expires_at <= timezone('utc', now()) then
    update public.study_sessions set status = 'expired' where id = session.id returning * into session;
    return jsonb_build_object('status', 'expired', 'session', public.study_session_json(session));
  end if;

  if p_operation ? 'testResult' then
    perform public.mutate_subject_progress(
      p_user_id, p_subject,
      jsonb_build_object('type', 'test', 'testResult', p_operation -> 'testResult')
    );
  end if;
  if p_operation ? 'practiceRecords' then
    perform public.mutate_subject_progress(
      p_user_id, p_subject,
      jsonb_build_object('type', 'practice', 'records', p_operation -> 'practiceRecords')
    );
  end if;
  mutation := public.mutate_subject_progress(
    p_user_id, p_subject,
    jsonb_build_object(
      'type', 'reward',
      'scoreXp', p_operation -> 'scoreXp',
      'lessonId', p_operation -> 'lessonId'
    )
  );
  canonical_result := (coalesce(p_response, '{}'::jsonb) - 'reward' - 'progress')
    || jsonb_build_object('reward', mutation -> 'reward', 'progress', mutation -> 'progress');

  update public.study_sessions
  set status = 'completed',
      result = canonical_result,
      lease_until = null,
      finalized_at = timezone('utc', now())
  where id = session.id
  returning * into session;

  return jsonb_build_object(
    'status', 'completed',
    'result', session.result,
    'replayed', false,
    'session', public.study_session_json(session)
  );
end;
$$;

revoke all on function public.finalize_study_session_operation(uuid, uuid, text, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.finalize_study_session_operation(uuid, uuid, text, text, jsonb, jsonb)
  to service_role;
