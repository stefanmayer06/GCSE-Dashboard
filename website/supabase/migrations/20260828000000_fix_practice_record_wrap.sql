create or replace function public.mutate_subject_progress(
  p_user_id uuid,
  p_subject text,
  p_operation jsonb
)
returns jsonb
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  saved public.subject_progress;
  operation text := coalesce(p_operation ->> 'type', '');
  record_value jsonb;
  records jsonb;
  topic_id text;
  topic_value jsonb;
  correct integer;
  total integer;
  amount integer;
  score_xp integer := 0;
  completion_xp integer := 0;
  first_completion boolean := false;
  lesson_id text := nullif(trim(p_operation ->> 'lessonId'), '');
  level_before integer;
  reward jsonb;
  today date := timezone('utc', now())::date;
  yesterday date := (timezone('utc', now()) - interval '1 day')::date;
begin
  if p_subject not in ('maths', 'maths-higher', 'english') then
    raise exception 'Invalid subject' using errcode = '22023';
  end if;
  if operation not in ('activity', 'add_xp', 'reward', 'test', 'practice',
    'test_and_reward', 'practice_and_reward') then
    raise exception 'Invalid progress operation' using errcode = '22023';
  end if;

  insert into public.subject_progress (user_id, subject)
  values (p_user_id, p_subject)
  on conflict (user_id, subject) do nothing;

  select * into saved
  from public.subject_progress
  where user_id = p_user_id and subject = p_subject
  for update;

  if operation in ('activity', 'reward', 'test_and_reward', 'practice_and_reward') then
    if saved.last_active_date is distinct from today then
      saved.streak := case when saved.last_active_date = yesterday then saved.streak + 1 else 1 end;
      saved.last_active_date := today;
    end if;
  end if;

  if operation in ('add_xp', 'reward', 'test_and_reward', 'practice_and_reward') then
    amount := greatest(0, floor(coalesce((p_operation ->> 'scoreXp')::numeric, 0)))::integer;
    if operation = 'add_xp' then amount := greatest(0, floor(coalesce((p_operation ->> 'amount')::numeric, 0)))::integer; end if;
    score_xp := amount;
    level_before := public.level_for_xp(saved.xp);
    if lesson_id is not null and not (saved.completed_lessons ? lesson_id) then
      first_completion := true;
      completion_xp := 20;
      saved.completed_lessons := saved.completed_lessons || jsonb_build_array(lesson_id);
    end if;
    saved.xp := saved.xp + score_xp + completion_xp;
  end if;

  if operation in ('test', 'test_and_reward') then
    total := greatest(0, floor(coalesce((p_operation -> 'testResult' ->> 'totalMarks')::numeric, 0)))::integer;
    correct := greatest(0, floor(coalesce((p_operation -> 'testResult' ->> 'correctMarks')::numeric, 0)))::integer;
    if correct > total then raise exception 'Test correct marks exceed total marks' using errcode = '22023'; end if;
    saved.tests_taken := saved.tests_taken + 1;
    saved.total_test_marks := saved.total_test_marks + total;
    saved.total_test_correct := saved.total_test_correct + correct;
  end if;

  if operation in ('practice', 'practice_and_reward') then
    records := p_operation -> 'records';
    if jsonb_typeof(records) <> 'array' then records := jsonb_build_array(records); end if;
    for record_value in select value from jsonb_array_elements(records) loop
      topic_id := nullif(trim(record_value ->> 'topicId'), '');
      total := greatest(0, floor(coalesce((record_value ->> 'total')::numeric, 0)))::integer;
      correct := greatest(0, floor(coalesce((record_value ->> 'correct')::numeric, 0)))::integer;
      if topic_id is null or correct > total then raise exception 'Invalid practice record' using errcode = '22023'; end if;
      topic_value := coalesce(saved.topic_stats -> topic_id, '{"correct":0,"total":0}'::jsonb);
      saved.topic_stats := jsonb_set(
        saved.topic_stats,
        array[topic_id],
        jsonb_build_object(
          'correct', (topic_value ->> 'correct')::integer + correct,
          'total', (topic_value ->> 'total')::integer + total
        ),
        true
      );
      saved.practice_answered := saved.practice_answered + total;
    end loop;
  end if;

  update public.subject_progress
  set xp = saved.xp,
      streak = saved.streak,
      last_active_date = saved.last_active_date,
      tests_taken = saved.tests_taken,
      practice_answered = saved.practice_answered,
      total_test_marks = saved.total_test_marks,
      total_test_correct = saved.total_test_correct,
      topic_stats = saved.topic_stats,
      completed_lessons = saved.completed_lessons
  where user_id = p_user_id and subject = p_subject
  returning * into saved;

  if operation in ('reward', 'test_and_reward', 'practice_and_reward') then
    reward := jsonb_build_object(
      'scoreXp', score_xp,
      'completionXp', completion_xp,
      'xpAwarded', score_xp + completion_xp,
      'firstCompletion', first_completion,
      'levelBefore', level_before,
      'levelAfter', public.level_for_xp(saved.xp),
      'progress', public.progress_summary(
        saved.xp, saved.streak, saved.tests_taken, saved.practice_answered,
        saved.total_test_marks, saved.total_test_correct,
        saved.topic_stats, saved.completed_lessons
      )
    );
  end if;

  return jsonb_build_object(
    'state', public.subject_progress_json(saved),
    'progress', public.progress_summary(
      saved.xp, saved.streak, saved.tests_taken, saved.practice_answered,
      saved.total_test_marks, saved.total_test_correct,
      saved.topic_stats, saved.completed_lessons
    ),
    'reward', reward
  );
end;
$$;

revoke all on function public.mutate_subject_progress(uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.mutate_subject_progress(uuid, text, jsonb)
  to service_role;