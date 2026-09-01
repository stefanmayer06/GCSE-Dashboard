-- Study Desk personal data: preferences, 7-day study plans and the mistake notebook.
-- These domains previously lived in browser localStorage / device AsyncStorage and
-- are now authoritative in Supabase. Client queries are served through the study
-- server (service role), but RLS still protects direct authenticated reads/writes.

create table public.subject_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (subject in ('maths', 'maths-higher', 'english')),
  exam_date date,
  target_grade text check (target_grade is null or target_grade ~ '^[1-9]$'),
  pass_mode text not null default 'balanced' check (pass_mode in ('balanced', 'foundation-pass')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, subject)
);

create table public.study_plans (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (subject in ('maths', 'maths-higher', 'english')),
  from_date date not null,
  intent_date date,
  intent_topic_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint study_plans_single_active_week unique (user_id, subject, from_date)
);

create index study_plans_user_lookup_idx
  on public.study_plans (user_id, subject, from_date desc);

create table public.study_plan_days (
  id uuid primary key default extensions.gen_random_uuid(),
  plan_id uuid not null references public.study_plans (id) on delete cascade,
  day_date date not null,
  label text not null,
  task text not null,
  minutes integer not null default 15 check (minutes > 0 and minutes <= 120),
  topic_id text,
  status text not null default 'todo' check (status in ('todo', 'done')),
  result jsonb,
  constraint days_result_shape check (result is null or jsonb_typeof(result) = 'object'),
  constraint study_plan_days_single_date unique (plan_id, day_date)
);

create index study_plan_days_plan_idx
  on public.study_plan_days (plan_id, day_date);

create table public.mistake_notebook (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (subject in ('maths', 'maths-higher', 'english')),
  legacy_id text not null,
  session_id text,
  question_id text,
  topic_id text,
  topic_name text not null default 'Unassigned topic',
  prompt text not null default '',
  answer jsonb,
  marks integer,
  max_marks integer,
  due_dates jsonb not null default '[]'::jsonb,
  review_index integer not null default 0 check (review_index between 0 and 4),
  status text not null default 'active' check (status in ('active', 'mastered')),
  captured_at timestamptz not null default timezone('utc', now()),
  mastered_at timestamptz,
  constraint mistake_row_due_dates_array check (jsonb_typeof(due_dates) = 'array'),
  constraint mistake_row_answer_object check (answer is null or jsonb_typeof(answer) <> 'number'),
  constraint mistake_notebook_single_legacy_row unique (user_id, subject, legacy_id)
);

create index mistake_notebook_user_lookup_idx
  on public.mistake_notebook (user_id, subject, status, captured_at desc);

-- Updated-at bookkeeping for the four new tables.
create trigger subject_preferences_set_updated_at
before update on public.subject_preferences
for each row execute function public.set_updated_at();

create trigger study_plans_set_updated_at
before update on public.study_plans
for each row execute function public.set_updated_at();

create trigger study_plan_days_set_updated_at
before update on public.study_plan_days
for each row execute function public.set_updated_at();

create trigger mistake_notebook_set_updated_at
before update on public.mistake_notebook
for each row execute function public.set_updated_at();

-- Atomic plan replacement: upserts the plan header and its seven day rows,
-- prunes removed days, and returns the hydrated plan for the caller.
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
    (plan_id, day_date, label, task, minutes, topic_id, status, result)
  select
    saved.id,
    (value ->> 'date')::date,
    coalesce(nullif(trim(value ->> 'label'), ''), 'Today'),
    coalesce(nullif(trim(value ->> 'task'), ''), 'Study session'),
    greatest(1, least(120, coalesce((value ->> 'minutes')::integer, 15))),
    nullif(trim(value ->> 'topicId'), ''),
    case when value ->> 'status' = 'done' then 'done' else 'todo' end,
    case when value ? 'result' and jsonb_typeof(value -> 'result') = 'object'
      then value -> 'result' else null end
  from jsonb_array_elements(coalesce(p_days, '[]'::jsonb))
  where value ->> 'date' is not null
  on conflict (plan_id, day_date) do update
  set label = excluded.label,
      task = excluded.task,
      minutes = excluded.minutes,
      topic_id = excluded.topic_id,
      status = excluded.status,
      result = excluded.result;

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
          'result', day.result
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

-- Atomic mistake-notebook replacement: upserts supplied rows and removes rows that
-- are no longer part of the client state. Running it twice is a no-op.
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
      prompt, answer, marks, max_marks, due_dates, review_index, status, captured_at, mastered_at
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
      case when (row.value ->> 'reviewIndex')::integer >= 4 then timezone('utc', now()) else null end
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
        mastered_at = excluded.mastered_at
    returning 1
  )
  select count(*) into kept from upserted;

  return kept;
end;
$$;

-- Row-level security: every user-owned personal table requires auth.uid() ownership.
alter table public.subject_preferences enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_plan_days enable row level security;
alter table public.mistake_notebook enable row level security;

create policy subject_preferences_select_own on public.subject_preferences
  for select to authenticated using (user_id = (select auth.uid()));
create policy subject_preferences_insert_own on public.subject_preferences
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy subject_preferences_update_own on public.subject_preferences
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy subject_preferences_delete_own on public.subject_preferences
  for delete to authenticated using (user_id = (select auth.uid()));

create policy study_plans_select_own on public.study_plans
  for select to authenticated using (user_id = (select auth.uid()));
create policy study_plans_insert_own on public.study_plans
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy study_plans_update_own on public.study_plans
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy study_plans_delete_own on public.study_plans
  for delete to authenticated using (user_id = (select auth.uid()));

create policy study_plan_days_select_own on public.study_plan_days
  for select to authenticated using (
    exists (
      select 1 from public.study_plans plan
      where plan.id = study_plan_days.plan_id and plan.user_id = (select auth.uid())
    )
  );
create policy study_plan_days_insert_own on public.study_plan_days
  for insert to authenticated with check (
    exists (
      select 1 from public.study_plans plan
      where plan.id = study_plan_days.plan_id and plan.user_id = (select auth.uid())
    )
  );
create policy study_plan_days_update_own on public.study_plan_days
  for update to authenticated using (
    exists (
      select 1 from public.study_plans plan
      where plan.id = study_plan_days.plan_id and plan.user_id = (select auth.uid())
    )
  );
create policy study_plan_days_delete_own on public.study_plan_days
  for delete to authenticated using (
    exists (
      select 1 from public.study_plans plan
      where plan.id = study_plan_days.plan_id and plan.user_id = (select auth.uid())
    )
  );

create policy mistake_notebook_select_own on public.mistake_notebook
  for select to authenticated using (user_id = (select auth.uid()));
create policy mistake_notebook_insert_own on public.mistake_notebook
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy mistake_notebook_update_own on public.mistake_notebook
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy mistake_notebook_delete_own on public.mistake_notebook
  for delete to authenticated using (user_id = (select auth.uid()));

-- Mutations stay server-driven: these functions require the service role.
revoke all on function public.save_study_plan(uuid, text, date, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.replace_mistakes(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.save_study_plan(uuid, text, date, jsonb, jsonb) to service_role;
grant execute on function public.replace_mistakes(uuid, text, jsonb) to service_role;

grant select, insert, update, delete on public.subject_preferences to authenticated;
grant select, insert, update, delete on public.study_plans to authenticated;
grant select, insert, update, delete on public.study_plan_days to authenticated;
grant select, insert, update, delete on public.mistake_notebook to authenticated;
grant all on public.subject_preferences, public.study_plans, public.study_plan_days, public.mistake_notebook to service_role;