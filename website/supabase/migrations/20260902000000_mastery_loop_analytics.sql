-- Mistake-to-mastery loop, durable paper attempts and the product event trail.
--
-- 1. mistake_notebook gains error classification, warm-up/retry evidence and the
--    correct answer / worked solution captured at marking time.
-- 2. paper_attempts durably stores finalized full and quick papers (with
--    question-level responses) so paper history survives serverless restarts.
-- 3. product_events records the activation/retention funnel
--    (signup, diagnostic, first mission, first marked session, mistake saved,
--    retry, mastered, returns) with a documented retention window.

alter table public.mistake_notebook
  add column error_type text check (
    error_type in ('knowledge', 'method', 'misread', 'arithmetic', 'timing', 'incomplete')
  ),
  add column warmup_count integer not null default 0 check (warmup_count between 0 and 99),
  add column last_reviewed_at timestamptz,
  add column correct_answer jsonb,
  add column worked_solution jsonb,
  add constraint mistake_row_worked_solution_array check (
    worked_solution is null or jsonb_typeof(worked_solution) = 'array'
  );

-- Durable paper attempts: one row per finalized paper session.
create table public.paper_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (subject in ('maths', 'maths-higher', 'english')),
  session_id text not null,
  paper_code text,
  paper_name text,
  type text not null default 'full' check (type in ('full', 'short')),
  tier text,
  total_marks integer not null default 0 check (total_marks >= 0),
  correct_marks numeric not null default 0 check (correct_marks >= 0),
  percent integer check (percent between 0 and 100),
  grade integer,
  duration_sec integer check (duration_sec is null or duration_sec >= 0),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint paper_attempts_result_object check (jsonb_typeof(result) = 'object'),
  constraint paper_attempts_unique_session unique (user_id, subject, session_id)
);

create index paper_attempts_user_lookup_idx
  on public.paper_attempts (user_id, subject, created_at desc);

create table public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (name ~ '^[a-z][a-z0-9_]{2,63}$'),
  subject text check (subject in ('maths', 'maths-higher', 'english')),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  constraint product_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index product_events_user_time_idx on public.product_events (user_id, occurred_at);
create index product_events_name_time_idx on public.product_events (name, occurred_at);

-- Retention: product events are funnel data, not study evidence. The server
-- prunes anything older than the documented window on deployment boots.
create or replace function public.prune_product_events(p_keep_days integer default 540)
returns integer
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  removed integer;
begin
  if p_keep_days < 30 then
    raise exception 'Retention window must be at least 30 days' using errcode = '22023';
  end if;
  delete from public.product_events
  where occurred_at < timezone('utc', now()) - make_interval(days => p_keep_days);
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- Updated-at bookkeeping for the new table.
create trigger paper_attempts_set_updated_at
before update on public.paper_attempts
for each row execute function public.set_updated_at();

-- Atomic mistake-notebook replacement: extended with classification, warm-up and
-- retry-evidence fields. Upserts supplied rows and removes rows that are no
-- longer part of the client state. Running it twice is a no-op.
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
      error_type, warmup_count, last_reviewed_at, correct_answer, worked_solution
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
      end
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
        worked_solution = excluded.worked_solution
    returning 1
  )
  select count(*) into kept from upserted;

  return kept;
end;
$$;

-- Durable attempt writer used by the server on paper finalization. Keeps the
-- most recent 50 attempts per user and subject (documented retention policy).
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
    coalesce(nullif(trim(p_attempt ->> 'completedAt'), ''), timezone('utc', now()))
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

-- Row-level security: every user-owned table requires auth.uid() ownership.
alter table public.paper_attempts enable row level security;
alter table public.product_events enable row level security;

create policy paper_attempts_select_own on public.paper_attempts
  for select to authenticated using (user_id = (select auth.uid()));
create policy paper_attempts_insert_own on public.paper_attempts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy paper_attempts_delete_own on public.paper_attempts
  for delete to authenticated using (user_id = (select auth.uid()));

create policy product_events_select_own on public.product_events
  for select to authenticated using (user_id = (select auth.uid()));
create policy product_events_insert_own on public.product_events
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Mutations stay server-driven: these functions require the service role.
revoke all on function public.prune_product_events(integer) from public, anon, authenticated;
revoke all on function public.save_paper_attempt(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.prune_product_events(integer) to service_role;
grant execute on function public.save_paper_attempt(uuid, text, text, jsonb) to service_role;

grant select, insert, delete on public.paper_attempts to authenticated;
grant select, insert on public.product_events to authenticated;
grant all on public.paper_attempts, public.product_events to service_role;
