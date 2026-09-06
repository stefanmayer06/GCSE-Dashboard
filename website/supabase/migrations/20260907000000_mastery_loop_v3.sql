-- Mastery loop v3: streak freezes, adaptive retries, correction ritual,
-- flexible planning and memory-check resurrections.
--
-- 1. subject_progress gains streak_freezes (earned weekly, capped, spent
--    automatically to survive a single missed day).
-- 2. subject_preferences gains rest_days (weekday numbers 0-6) and
--    minutes_per_day (null = subject default).
-- 3. mistake_notebook gains ease (FSRS-lite stability factor), last_grade
--    (again/hard/good/easy), correction (learner-written fix) and
--    resurrected_count (memory-check evidence).
-- 4. study_plan_days gains is_rest so rest days persist explicitly.

alter table public.subject_progress
  add column streak_freezes integer not null default 1 check (streak_freezes between 0 and 5);

alter table public.subject_preferences
  add column rest_days jsonb not null default '[]'::jsonb,
  add column minutes_per_day integer check (minutes_per_day is null or (minutes_per_day between 5 and 120)),
  add constraint subject_preferences_rest_days_array check (jsonb_typeof(rest_days) = 'array');

alter table public.mistake_notebook
  add column ease double precision not null default 2.5 check (ease between 1.3 and 3.0),
  add column last_grade text check (last_grade in ('again', 'hard', 'good', 'easy')),
  add column correction text check (correction is null or char_length(correction) between 1 and 500),
  add column resurrected_count integer not null default 0 check (resurrected_count between 0 and 99);

alter table public.study_plan_days
  add column is_rest boolean not null default false;

-- Compact-progress validation accepts the freeze count.
create or replace function public.valid_compact_progress(p_value jsonb)
returns boolean
immutable
language plpgsql
as $$
declare
  item jsonb;
  correct integer;
  total integer;
begin
  if p_value is null or jsonb_typeof(p_value) <> 'object'
    or p_value ? 'history' or p_value ? 'chat'
    or jsonb_typeof(coalesce(p_value -> 'topicStats', '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_value -> 'completedLessons', '[]'::jsonb)) <> 'array' then
    return false;
  end if;

  if coalesce((p_value ->> 'xp')::integer, 0) < 0
    or coalesce((p_value ->> 'streak')::integer, 0) < 0
    or coalesce((p_value ->> 'streakFreezes')::integer, 0) < 0
    or coalesce((p_value ->> 'testsTaken')::integer, 0) < 0
    or coalesce((p_value ->> 'practiceAnswered')::integer, 0) < 0
    or coalesce((p_value ->> 'totalTestMarks')::integer, 0) < 0
    or coalesce((p_value ->> 'totalTestCorrect')::integer, 0) < 0 then
    return false;
  end if;

  for item in select value from jsonb_each(coalesce(p_value -> 'topicStats', '{}'::jsonb)) loop
    correct := coalesce((item ->> 'correct')::integer, 0);
    total := coalesce((item ->> 'total')::integer, 0);
    if correct < 0 or total < 0 or correct > total then return false; end if;
  end loop;

  return true;
end;
$$;

-- Replace path persists the freeze count and echoes it back.
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
      streak_freezes = greatest(0, least(5, coalesce((p_next_state ->> 'streakFreezes')::integer, 1))),
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
    'state', public.subject_progress_json(saved) || jsonb_build_object('streakFreezes', saved.streak_freezes),
    'progress', public.progress_summary(
      saved.xp, saved.streak, saved.tests_taken, saved.practice_answered,
      saved.total_test_marks, saved.total_test_correct,
      saved.topic_stats, saved.completed_lessons
    ) || jsonb_build_object('streakFreezes', saved.streak_freezes)
  );
end;
$$;

-- Mutation path: freeze spend on a single missed day, freeze earn on every
-- 7-day streak milestone (capped at 2 banked). The reward/state payloads
-- echo streakFreezes plus streakFreezeUsed for the clients.
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
  freeze_used boolean := false;
  today date := timezone('utc', now())::date;
  yesterday date := (timezone('utc', now()) - interval '1 day')::date;
  day_before date := (timezone('utc', now()) - interval '2 days')::date;
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
      if saved.last_active_date = yesterday then
        saved.streak := saved.streak + 1;
        if saved.streak % 7 = 0 then
          saved.streak_freezes := least(2, saved.streak_freezes + 1);
        end if;
      elsif saved.last_active_date = day_before and saved.streak_freezes > 0 and saved.streak > 0 then
        saved.streak_freezes := saved.streak_freezes - 1;
        freeze_used := true;
      else
        saved.streak := 1;
      end if;
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
      streak_freezes = saved.streak_freezes,
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
      'streakFreezeUsed', freeze_used,
      'progress', public.progress_summary(
        saved.xp, saved.streak, saved.tests_taken, saved.practice_answered,
        saved.total_test_marks, saved.total_test_correct,
        saved.topic_stats, saved.completed_lessons
      ) || jsonb_build_object('streakFreezes', saved.streak_freezes, 'streakFreezeUsed', freeze_used)
    );
  end if;

  return jsonb_build_object(
    'state', public.subject_progress_json(saved) || jsonb_build_object('streakFreezes', saved.streak_freezes, 'streakFreezeUsed', freeze_used),
    'progress', public.progress_summary(
      saved.xp, saved.streak, saved.tests_taken, saved.practice_answered,
      saved.total_test_marks, saved.total_test_correct,
      saved.topic_stats, saved.completed_lessons
    ) || jsonb_build_object('streakFreezes', saved.streak_freezes, 'streakFreezeUsed', freeze_used),
    'reward', reward
  );
end;
$$;

-- Atomic mistake-notebook replacement: extended with ease, last grade,
-- learner correction and resurrection evidence.
create or replace function public.replace_mistakes(
  p_user_id uuid,
  p_subject text,
  p_rows jsonb default '[]'::jsonb
)
returns integer
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  kept integer := 0;
begin
  if p_subject not in ('maths', 'maths-higher', 'english') then
    raise exception 'Invalid subject' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_rows, '[]'::jsonb)) <> 'array' then
    raise exception 'Mistake rows must be an array' using errcode = '22023';
  end if;

  delete from public.mistake_notebook
  where user_id = p_user_id
    and subject = p_subject
    and legacy_id <> all (
      select nullif(trim(value ->> 'id'), '')
      from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb))
      where nullif(trim(value ->> 'id'), '') is not null
    );

  with rows as (
    select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as item
    where nullif(trim(item.value ->> 'id'), '') is not null
  ),
  upserted as (
    insert into public.mistake_notebook (
      user_id, subject, legacy_id, session_id, question_id, topic_id, topic_name,
      prompt, answer, marks, max_marks, due_dates, review_index, status, captured_at, mastered_at,
      error_type, warmup_count, last_reviewed_at, correct_answer, worked_solution,
      ease, last_grade, correction, resurrected_count
    )
    select
      p_user_id,
      p_subject,
      nullif(trim(row.value ->> 'id'), ''),
      nullif(trim(row.value ->> 'sessionId'), ''),
      nullif(trim(row.value ->> 'qid'), ''),
      nullif(trim(row.value ->> 'topicId'), ''),
      coalesce(nullif(trim(row.value ->> 'topicName'), ''), 'Unassigned topic'),
      coalesce(nullif(trim(row.value ->> 'prompt'), ''), ''),
      case when row.value ? 'answer' then row.value -> 'answer' else null end,
      nullif(coalesce((row.value ->> 'marks')::integer, (row.value ->> 'got')::integer), null),
      nullif(coalesce((row.value ->> 'maxMarks')::integer, (row.value ->> 'max')::integer), null),
      coalesce(row.value -> 'dueDates', row.value -> 'due', '[]'::jsonb),
      greatest(0, least(4, coalesce((row.value ->> 'reviewIndex')::integer, 0))),
      case when (row.value ->> 'mastered')::boolean is true then 'mastered' else 'active' end,
      coalesce(nullif(trim(row.value ->> 'capturedAt'), ''), timezone('utc', now())),
      case when (row.value ->> 'reviewIndex')::integer >= 4 then timezone('utc', now()) else null end,
      case
        when row.value ->> 'errorType' in ('knowledge', 'method', 'misread', 'arithmetic', 'timing', 'incomplete')
        then row.value ->> 'errorType'
        else null
      end,
      greatest(0, least(99, coalesce((row.value ->> 'warmupCount')::integer, 0))),
      nullif(trim(row.value ->> 'lastReviewedAt'), '')::timestamptz,
      case when row.value ? 'correctAnswer' then row.value -> 'correctAnswer' else null end,
      case
        when row.value ? 'workedSolution' and jsonb_typeof(row.value -> 'workedSolution') = 'array'
        then row.value -> 'workedSolution'
        else null
      end,
      greatest(1.3, least(3.0, coalesce((row.value ->> 'ease')::double precision, 2.5))),
      case
        when row.value ->> 'lastGrade' in ('again', 'hard', 'good', 'easy')
        then row.value ->> 'lastGrade'
        else null
      end,
      nullif(trim(coalesce(row.value ->> 'correction', '')), ''),
      greatest(0, least(99, coalesce((row.value ->> 'resurrectedCount')::integer, 0)))
    from rows row
    on conflict (user_id, subject, legacy_id) do update
    set session_id = excluded.session_id,
        question_id = excluded.question_id,
        topic_id = excluded.topic_id,
        topic_name = excluded.topic_name,
        prompt = excluded.prompt,
        answer = excluded.answer,
        marks = excluded.marks,
        max_marks = excluded.max_marks,
        due_dates = excluded.due_dates,
        review_index = excluded.review_index,
        status = excluded.status,
        captured_at = excluded.captured_at,
        mastered_at = excluded.mastered_at,
        error_type = excluded.error_type,
        warmup_count = excluded.warmup_count,
        last_reviewed_at = excluded.last_reviewed_at,
        correct_answer = excluded.correct_answer,
        worked_solution = excluded.worked_solution,
        ease = excluded.ease,
        last_grade = excluded.last_grade,
        correction = excluded.correction,
        resurrected_count = excluded.resurrected_count
    returning 1
  )
  select count(*) into kept from upserted;

  return kept;
end;
$$;

-- Legacy finalize path keeps the freeze column in step (the live server
-- finalizes through mutate_subject_progress, which handles freezes above).
create or replace function public.finalize_study_session(
  p_id uuid,
  p_user_id uuid,
  p_subject text,
  p_kind text,
  p_next_state jsonb,
  p_result jsonb
)
returns jsonb
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  session public.study_sessions;
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
    update public.study_sessions set status = 'expired' where id = session.id;
    return jsonb_build_object('status', 'expired', 'session', public.study_session_json(session));
  end if;
  if not public.valid_compact_progress(p_next_state) then
    raise exception 'Finalized progress must be compact and valid' using errcode = '22023';
  end if;

  insert into public.subject_progress (user_id, subject)
  values (p_user_id, p_subject)
  on conflict (user_id, subject) do nothing;
  perform 1
  from public.subject_progress
  where user_id = p_user_id and subject = p_subject
  for update;

  update public.subject_progress
  set xp = greatest(0, coalesce((p_next_state ->> 'xp')::integer, 0)),
      streak = greatest(0, coalesce((p_next_state ->> 'streak')::integer, 0)),
      streak_freezes = greatest(0, least(5, coalesce((p_next_state ->> 'streakFreezes')::integer, 1))),
      last_active_date = nullif(p_next_state ->> 'lastActiveDate', '')::date,
      tests_taken = greatest(0, coalesce((p_next_state ->> 'testsTaken')::integer, 0)),
      practice_answered = greatest(0, coalesce((p_next_state ->> 'practiceAnswered')::integer, 0)),
      total_test_marks = greatest(0, coalesce((p_next_state ->> 'totalTestMarks')::integer, 0)),
      total_test_correct = greatest(0, coalesce((p_next_state ->> 'totalTestCorrect')::integer, 0)),
      topic_stats = coalesce(p_next_state -> 'topicStats', '{}'::jsonb),
      completed_lessons = coalesce(p_next_state -> 'completedLessons', '[]'::jsonb)
  where user_id = p_user_id and subject = p_subject;

  update public.study_sessions
  set status = 'completed',
      result = coalesce(p_result, '{}'::jsonb),
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
-- Plan persistence carries the rest flag through insert, update and read.
create or replace function public.save_study_plan(
  p_user_id uuid,
  p_subject text,
  p_from_date date,
  p_intent jsonb default null,
  p_days jsonb default '[]'::jsonb
)
returns public.study_plans
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  saved public.study_plans;
  day_count integer := 0;
begin
  if p_subject not in ('maths', 'maths-higher', 'english') then
    raise exception 'Invalid subject' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_days, '[]'::jsonb)) <> 'array' then
    raise exception 'Plan days must be an array' using errcode = '22023';
  end if;
  select count(*) into day_count from jsonb_array_elements(coalesce(p_days, '[]'::jsonb));
  if day_count = 0 or day_count > 14 then
    raise exception 'A study plan must hold between 1 and 14 days' using errcode = '22023';
  end if;
  if p_intent is not null and jsonb_typeof(p_intent) <> 'object' then
    raise exception 'Plan intent must be an object' using errcode = '22023';
  end if;

  insert into public.study_plans (user_id, subject, from_date, intent_date, intent_topic_id)
  values (
    p_user_id,
    p_subject,
    p_from_date,
    nullif(trim(coalesce(p_intent ->> 'date', '')), '')::date,
    nullif(trim(coalesce(p_intent ->> 'topicId', '')), '')
  )
  on conflict (user_id, subject, from_date) do update
  set intent_date = excluded.intent_date,
      intent_topic_id = excluded.intent_topic_id
  returning * into saved;

  delete from public.study_plan_days
  where plan_id = saved.id
    and day_date <> all (
      select (value ->> 'date')::date
      from jsonb_array_elements(coalesce(p_days, '[]'::jsonb))
      where value ->> 'date' is not null
    );

  insert into public.study_plan_days
    (plan_id, day_date, label, task, minutes, topic_id, status, result, is_rest)
  select
    saved.id,
    (value ->> 'date')::date,
    coalesce(nullif(trim(value ->> 'label'), ''), 'Today'),
    coalesce(nullif(trim(value ->> 'task'), ''), 'Study session'),
    greatest(1, least(120, coalesce((value ->> 'minutes')::integer, 15))),
    nullif(trim(value ->> 'topicId'), ''),
    case when value ->> 'status' = 'done' then 'done' else 'todo' end,
    case when value ? 'result' and jsonb_typeof(value -> 'result') = 'object'
      then value -> 'result' else null end,
    coalesce((value ->> 'rest')::boolean, false)
  from jsonb_array_elements(coalesce(p_days, '[]'::jsonb))
  where value ->> 'date' is not null
  on conflict (plan_id, day_date) do update
  set label = excluded.label,
      task = excluded.task,
      minutes = excluded.minutes,
      topic_id = excluded.topic_id,
      status = excluded.status,
      result = excluded.result,
      is_rest = excluded.is_rest;

  return saved;
end;
$$;

create or replace function public.plan_json(p_plan public.study_plans)
returns jsonb
stable
language sql
as $$
  select jsonb_build_object(
    'from', p_plan.from_date,
    'days', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', day.day_date,
          'label', day.label,
          'task', day.task,
          'minutes', day.minutes,
          'topicId', day.topic_id,
          'status', day.status,
          'result', day.result,
          'rest', day.is_rest
        ) order by day.day_date
      )
      from public.study_plan_days day
      where day.plan_id = p_plan.id
    ), '[]'::jsonb),
    'intent', case
      when p_plan.intent_date is null then 'null'::jsonb
      else jsonb_build_object(
        'date', p_plan.intent_date,
        'topicId', p_plan.intent_topic_id
      )
    end
  );
$$;
