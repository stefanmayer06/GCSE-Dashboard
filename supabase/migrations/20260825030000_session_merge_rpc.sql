create or replace function public.update_study_session(
  p_id uuid,
  p_user_id uuid,
  p_subject text,
  p_kind text,
  p_payload jsonb
)
returns jsonb
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  saved public.study_sessions;
  merged_payload jsonb;
begin
  select * into saved from public.study_sessions where id = p_id for update;
  if saved.id is null then return jsonb_build_object('status', 'not_found'); end if;
  if saved.user_id <> p_user_id then return jsonb_build_object('status', 'forbidden'); end if;
  if saved.subject <> p_subject or saved.kind <> p_kind then
    return jsonb_build_object('status', 'mismatch');
  end if;
  if saved.status = 'completed' then
    return jsonb_build_object('status', 'completed', 'result', saved.result, 'replayed', true,
      'session', public.study_session_json(saved));
  end if;
  if saved.expires_at <= timezone('utc', now()) then
    update public.study_sessions set status = 'expired' where id = saved.id;
    return jsonb_build_object('status', 'expired', 'session', public.study_session_json(saved));
  end if;
  if saved.status = 'claimed' then
    return jsonb_build_object('status', 'busy', 'leaseUntil', saved.lease_until);
  end if;

  merged_payload := coalesce(p_payload, '{}'::jsonb);
  if merged_payload ? 'aiMarks' then
    merged_payload := saved.payload || merged_payload;
    merged_payload := jsonb_set(
      merged_payload,
      '{aiMarks}',
      coalesce(saved.payload -> 'aiMarks', '{}'::jsonb)
        || coalesce(p_payload -> 'aiMarks', '{}'::jsonb),
      true
    );
  end if;

  update public.study_sessions
  set payload = merged_payload
  where id = saved.id
  returning * into saved;
  return jsonb_build_object('status', 'updated', 'session', public.study_session_json(saved));
end;
$$;

revoke all on function public.update_study_session(uuid, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.update_study_session(uuid, uuid, text, text, jsonb) to service_role;
