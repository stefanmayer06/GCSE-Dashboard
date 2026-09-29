-- Reject malformed worked methods before replacing a learner's notebook.
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
  if exists (
    select 1 from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as item
    where item.value ? 'workedSolution'
      and jsonb_typeof(item.value -> 'workedSolution') <> 'array'
  ) then
    raise exception 'Worked solutions must be arrays' using errcode = '23514';
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
      coalesce(nullif(trim(row.value ->> 'capturedAt'), '')::timestamptz, now()),
      case when (row.value ->> 'reviewIndex')::integer >= 4 then now() else null end,
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

-- Paper finalization needs a timestamptz on both COALESCE branches.
create or replace function public.save_paper_attempt(
  p_user_id uuid,
  p_subject text,
  p_session_id text,
  p_attempt jsonb
)
returns uuid
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  saved public.paper_attempts;
begin
  if p_subject not in ('maths', 'maths-higher', 'english') then
    raise exception 'Invalid subject' using errcode = '22023';
  end if;
  if nullif(trim(p_session_id), '') is null then
    raise exception 'A paper attempt needs a session id' using errcode = '23502';
  end if;
  if p_attempt is null or jsonb_typeof(p_attempt) <> 'object' then
    raise exception 'Paper attempt payload must be an object' using errcode = '22023';
  end if;

  insert into public.paper_attempts (
    user_id, subject, session_id, paper_code, paper_name, type, tier,
    total_marks, correct_marks, percent, grade, duration_sec, result, created_at
  )
  values (
    p_user_id,
    p_subject,
    trim(p_session_id),
    nullif(trim(coalesce(p_attempt ->> 'paperCode', '')), ''),
    nullif(trim(coalesce(p_attempt ->> 'paperName', '')), ''),
    case when p_attempt ->> 'type' = 'short' then 'short' else 'full' end,
    nullif(trim(coalesce(p_attempt ->> 'tier', '')), ''),
    greatest(0, coalesce((p_attempt ->> 'totalMarks')::integer, 0)),
    greatest(0, coalesce((p_attempt ->> 'correctMarks')::numeric, 0)),
    case
      when (p_attempt ->> 'percent')::integer between 0 and 100
      then (p_attempt ->> 'percent')::integer
      else null
    end,
    (p_attempt ->> 'grade')::integer,
    case when (p_attempt ->> 'durationSec')::integer >= 0 then (p_attempt ->> 'durationSec')::integer else null end,
    coalesce(p_attempt -> 'result', '{}'::jsonb),
    coalesce(nullif(trim(p_attempt ->> 'completedAt'), '')::timestamptz, now())
  )
  on conflict (user_id, subject, session_id) do update
  set paper_code = excluded.paper_code,
      paper_name = excluded.paper_name,
      type = excluded.type,
      tier = excluded.tier,
      total_marks = excluded.total_marks,
      correct_marks = excluded.correct_marks,
      percent = excluded.percent,
      grade = excluded.grade,
      duration_sec = excluded.duration_sec,
      result = excluded.result,
      created_at = excluded.created_at
  returning id into saved;

  delete from public.paper_attempts
  where id in (
    select id from public.paper_attempts
    where user_id = p_user_id
      and subject = p_subject
    order by created_at desc
    offset 50
  );

  return saved.id;
end;
$$;
