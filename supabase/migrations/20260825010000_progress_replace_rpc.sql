create or replace function public.replace_subject_progress(
  p_user_id uuid,
  p_subject text,
  p_next_state jsonb
)
returns jsonb
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  saved public.subject_progress;
begin
  if p_subject not in ('maths', 'maths-higher', 'english') then
    raise exception 'Invalid subject' using errcode = '22023';
  end if;
  if not public.valid_compact_progress(p_next_state) then
    raise exception 'Progress must be compact and valid' using errcode = '22023';
  end if;

  insert into public.subject_progress (user_id, subject)
  values (p_user_id, p_subject)
  on conflict (user_id, subject) do nothing;

  update public.subject_progress
  set xp = greatest(0, coalesce((p_next_state ->> 'xp')::integer, 0)),
      streak = greatest(0, coalesce((p_next_state ->> 'streak')::integer, 0)),
      last_active_date = nullif(p_next_state ->> 'lastActiveDate', '')::date,
      tests_taken = greatest(0, coalesce((p_next_state ->> 'testsTaken')::integer, 0)),
      practice_answered = greatest(0, coalesce((p_next_state ->> 'practiceAnswered')::integer, 0)),
      total_test_marks = greatest(0, coalesce((p_next_state ->> 'totalTestMarks')::integer, 0)),
      total_test_correct = greatest(0, coalesce((p_next_state ->> 'totalTestCorrect')::integer, 0)),
      topic_stats = coalesce(p_next_state -> 'topicStats', '{}'::jsonb),
      completed_lessons = coalesce(p_next_state -> 'completedLessons', '[]'::jsonb)
  where user_id = p_user_id and subject = p_subject
  returning * into saved;

  return jsonb_build_object(
    'state', public.subject_progress_json(saved),
    'progress', public.progress_summary(
      saved.xp, saved.streak, saved.tests_taken, saved.practice_answered,
      saved.total_test_marks, saved.total_test_correct,
      saved.topic_stats, saved.completed_lessons
    )
  );
end;
$$;

revoke all on function public.replace_subject_progress(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.replace_subject_progress(uuid, text, jsonb) to service_role;
