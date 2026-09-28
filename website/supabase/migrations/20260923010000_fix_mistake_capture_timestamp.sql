-- Preserve the client's captured-at timestamp while making the fallback a
-- timestamptz. The previous mixed text/timestamp COALESCE failed on every save.
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
