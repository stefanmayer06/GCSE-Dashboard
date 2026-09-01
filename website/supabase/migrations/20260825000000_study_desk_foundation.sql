create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists migration_private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique,
  role text not null default 'student' check (role in ('student', 'admin')),
  legacy_user_id text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.subject_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (subject in ('maths', 'maths-higher', 'english')),
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  last_active_date date,
  tests_taken integer not null default 0 check (tests_taken >= 0),
  practice_answered integer not null default 0 check (practice_answered >= 0),
  total_test_marks integer not null default 0 check (total_test_marks >= 0),
  total_test_correct integer not null default 0 check (total_test_correct >= 0),
  topic_stats jsonb not null default '{}'::jsonb,
  completed_lessons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, subject),
  constraint subject_progress_topic_stats_object
    check (jsonb_typeof(topic_stats) = 'object'),
  constraint subject_progress_completed_lessons_array
    check (jsonb_typeof(completed_lessons) = 'array')
);

create table public.study_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (subject in ('maths', 'maths-higher', 'english')),
  kind text not null check (kind in ('paper', 'practice', 'adhoc')),
  status text not null default 'active' check (status in ('active', 'claimed', 'completed', 'expired')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null,
  lease_until timestamptz,
  finalized_at timestamptz
);

create index study_sessions_user_lifecycle_idx
  on public.study_sessions (user_id, subject, status, expires_at);

create table migration_private.legacy_users (
  legacy_user_id text primary key,
  username extensions.citext not null unique,
  email extensions.citext,
  password_hash text,
  role text not null default 'student' check (role in ('student', 'admin')),
  oauth_provider text,
  oauth_subject text,
  raw_record jsonb not null default '{}'::jsonb,
  claim_status text not null default 'pending'
    check (claim_status in ('pending', 'claimed', 'skipped')),
  claimed_by uuid references auth.users (id) on delete set null,
  imported_at timestamptz not null default timezone('utc', now()),
  claimed_at timestamptz
);

create table migration_private.legacy_subject_progress (
  legacy_user_id text not null references migration_private.legacy_users (legacy_user_id) on delete cascade,
  subject text not null check (subject in ('maths', 'maths-higher', 'english')),
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  last_active_date date,
  tests_taken integer not null default 0 check (tests_taken >= 0),
  practice_answered integer not null default 0 check (practice_answered >= 0),
  total_test_marks integer not null default 0 check (total_test_marks >= 0),
  total_test_correct integer not null default 0 check (total_test_correct >= 0),
  topic_stats jsonb not null default '{}'::jsonb,
  completed_lessons jsonb not null default '[]'::jsonb,
  source_hash text not null,
  source_updated_at timestamptz,
  imported_at timestamptz not null default timezone('utc', now()),
  primary key (legacy_user_id, subject),
  constraint legacy_progress_topic_stats_object
    check (jsonb_typeof(topic_stats) = 'object'),
  constraint legacy_progress_completed_lessons_array
    check (jsonb_typeof(completed_lessons) = 'array')
);

create table migration_private.account_claims (
  id uuid primary key default extensions.gen_random_uuid(),
  legacy_user_id text not null references migration_private.legacy_users (legacy_user_id) on delete cascade,
  email extensions.citext not null,
  claim_token_hash text not null unique,
  target_user_id uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null,
  claimed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table migration_private.migration_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  source text not null,
  source_fingerprint text not null,
  status text not null check (status in ('started', 'completed', 'failed', 'reconciled')),
  users_seen integer not null default 0,
  progress_seen integer not null default 0,
  users_migrated integer not null default 0,
  progress_migrated integer not null default 0,
  mismatches integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger subject_progress_set_updated_at
before update on public.subject_progress
for each row execute function public.set_updated_at();

create trigger study_sessions_set_updated_at
before update on public.study_sessions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  requested_username text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  fallback_username text := 'user_' || replace(substr(new.id::text, 1, 8), '-', '');
begin
  if requested_username is null
    or requested_username !~ '^[A-Za-z0-9_]{3,32}$' then
    requested_username := fallback_username;
  end if;

  insert into public.profiles (id, username)
  values (new.id, requested_username)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id then
    if new.role is distinct from old.role
      or new.legacy_user_id is distinct from old.legacy_user_id then
      raise exception 'Only the server may change profile role or migration fields'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
before update on public.profiles
for each row execute function public.protect_profile_fields();

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
    or coalesce((p_value ->> 'testsTaken')::integer, 0) < 0
    or coalesce((p_value ->> 'practiceAnswered')::integer, 0) < 0
    or coalesce((p_value ->> 'totalTestMarks')::integer, 0) < 0
    or coalesce((p_value ->> 'totalTestCorrect')::integer, 0) < 0 then
    return false;
  end if;

  for item in
    select entries.entry_value
    from jsonb_each(coalesce(p_value -> 'topicStats', '{}'::jsonb)) as entries(entry_key, entry_value)
  loop
    if jsonb_typeof(item) <> 'object' then
      return false;
    end if;
    begin
      correct := coalesce((item ->> 'correct')::integer, 0);
      total := coalesce((item ->> 'total')::integer, 0);
    exception when others then
      return false;
    end;
    if correct < 0 or total < 0 or correct > total then
      return false;
    end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

create or replace function public.level_for_xp(value integer)
returns integer
immutable
language sql
as $$
  select floor(sqrt(greatest(value, 0)::numeric / 50))::integer + 1;
$$;

create or replace function public.progress_state(
  p_xp integer,
  p_streak integer,
  p_last_active_date date,
  p_tests_taken integer,
  p_practice_answered integer,
  p_total_test_marks integer,
  p_total_test_correct integer,
  p_topic_stats jsonb,
  p_completed_lessons jsonb
)
returns jsonb
immutable
language sql
as $$
  select jsonb_build_object(
    'xp', p_xp,
    'streak', p_streak,
    'lastActiveDate', p_last_active_date,
    'testsTaken', p_tests_taken,
    'practiceAnswered', p_practice_answered,
    'totalTestMarks', p_total_test_marks,
    'totalTestCorrect', p_total_test_correct,
    'topicStats', p_topic_stats,
    'completedLessons', p_completed_lessons
  );
$$;

create or replace function public.progress_summary(
  p_xp integer,
  p_streak integer,
  p_tests_taken integer,
  p_practice_answered integer,
  p_total_test_marks integer,
  p_total_test_correct integer,
  p_topic_stats jsonb,
  p_completed_lessons jsonb
)
returns jsonb
immutable
language sql
as $$
  with levels as (
    select public.level_for_xp(p_xp) as level
  )
  select jsonb_build_object(
    'xp', p_xp,
    'level', levels.level,
    'xpInto', p_xp - ((levels.level - 1) ^ 2 * 50),
    'xpNeeded', ((levels.level ^ 2) - ((levels.level - 1) ^ 2)) * 50,
    'streak', p_streak,
    'testsTaken', p_tests_taken,
    'practiceAnswered', p_practice_answered,
    'overallPercent', case
      when p_total_test_marks > 0
      then round((100.0 * p_total_test_correct) / p_total_test_marks)::integer
      else null
    end,
    'topicStats', p_topic_stats,
    'completedLessonIds', p_completed_lessons,
    'lessonsCompleted', jsonb_array_length(p_completed_lessons)
  )
  from levels;
$$;

create or replace function public.subject_progress_json(p_row public.subject_progress)
returns jsonb
stable
language sql
as $$
  select public.progress_state(
    p_row.xp,
    p_row.streak,
    p_row.last_active_date,
    p_row.tests_taken,
    p_row.practice_answered,
    p_row.total_test_marks,
    p_row.total_test_correct,
    p_row.topic_stats,
    p_row.completed_lessons
  );
$$;

create or replace function public.study_session_json(p_row public.study_sessions)
returns jsonb
stable
language sql
as $$
  select jsonb_build_object(
    'id', p_row.id,
    'userId', p_row.user_id,
    'subject', p_row.subject,
    'kind', p_row.kind,
    'status', p_row.status,
    'payload', p_row.payload,
    'result', p_row.result,
    'createdAt', p_row.created_at,
    'updatedAt', p_row.updated_at,
    'expiresAt', p_row.expires_at,
    'leaseUntil', p_row.lease_until
  );
$$;

create or replace function public.create_study_session(
  p_id uuid,
  p_user_id uuid,
  p_subject text,
  p_kind text,
  p_payload jsonb,
  p_created_at timestamptz default timezone('utc', now()),
  p_expires_at timestamptz default timezone('utc', now()) + interval '24 hours'
)
returns jsonb
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  saved public.study_sessions;
begin
  insert into public.study_sessions (
    id, user_id, subject, kind, payload, created_at, expires_at
  )
  values (p_id, p_user_id, p_subject, p_kind, coalesce(p_payload, '{}'::jsonb), p_created_at, p_expires_at)
  on conflict (id) do nothing
  returning * into saved;

  if saved.id is null then
    return jsonb_build_object('status', 'conflict');
  end if;
  return jsonb_build_object('status', 'created', 'session', public.study_session_json(saved));
end;
$$;

create or replace function public.get_study_session(
  p_id uuid,
  p_user_id uuid,
  p_subject text,
  p_kind text
)
returns jsonb
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  saved public.study_sessions;
begin
  select * into saved from public.study_sessions where id = p_id;
  if saved.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;
  if saved.user_id <> p_user_id then
    return jsonb_build_object('status', 'forbidden');
  end if;
  if saved.subject <> p_subject or saved.kind <> p_kind then
    return jsonb_build_object('status', 'mismatch');
  end if;
  if saved.status = 'completed' then
    return jsonb_build_object(
      'status', 'completed',
      'result', saved.result,
      'replayed', true,
      'session', public.study_session_json(saved)
    );
  end if;
  if saved.expires_at <= timezone('utc', now()) then
    update public.study_sessions
    set status = 'expired'
    where id = saved.id and status <> 'completed';
    return jsonb_build_object('status', 'expired', 'session', public.study_session_json(saved));
  end if;
  return jsonb_build_object('status', 'ok', 'session', public.study_session_json(saved));
end;
$$;

create or replace function public.claim_study_session(
  p_id uuid,
  p_user_id uuid,
  p_subject text,
  p_kind text,
  p_lease_until timestamptz default timezone('utc', now()) + interval '30 seconds'
)
returns jsonb
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  saved public.study_sessions;
  lease timestamptz := coalesce(p_lease_until, timezone('utc', now()) + interval '30 seconds');
begin
  select * into saved from public.study_sessions where id = p_id for update;
  if saved.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;
  if saved.user_id <> p_user_id then
    return jsonb_build_object('status', 'forbidden');
  end if;
  if saved.subject <> p_subject or saved.kind <> p_kind then
    return jsonb_build_object('status', 'mismatch');
  end if;
  if saved.status = 'completed' then
    return jsonb_build_object(
      'status', 'completed',
      'result', saved.result,
      'replayed', true,
      'session', public.study_session_json(saved)
    );
  end if;
  if saved.expires_at <= timezone('utc', now()) then
    update public.study_sessions set status = 'expired' where id = saved.id;
    return jsonb_build_object('status', 'expired', 'session', public.study_session_json(saved));
  end if;
  if saved.status = 'claimed'
    and saved.lease_until is not null
    and saved.lease_until > timezone('utc', now()) then
    return jsonb_build_object('status', 'busy', 'leaseUntil', saved.lease_until);
  end if;
  if lease <= timezone('utc', now()) then
    raise exception 'lease_until must be in the future' using errcode = '22023';
  end if;

  update public.study_sessions
  set status = 'claimed', lease_until = lease
  where id = saved.id
  returning * into saved;
  return jsonb_build_object('status', 'claimed', 'session', public.study_session_json(saved));
end;
$$;

create or replace function public.release_study_session(
  p_id uuid,
  p_user_id uuid,
  p_subject text,
  p_kind text
)
returns jsonb
security definer
set search_path = public, extensions
language plpgsql
as $$
declare
  saved public.study_sessions;
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
  if saved.status = 'active' then
    return jsonb_build_object('status', 'active', 'session', public.study_session_json(saved));
  end if;
  update public.study_sessions
  set status = 'active', lease_until = null
  where id = saved.id
  returning * into saved;
  return jsonb_build_object('status', 'released', 'session', public.study_session_json(saved));
end;
$$;

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
  update public.study_sessions
  set payload = coalesce(p_payload, '{}'::jsonb)
  where id = saved.id
  returning * into saved;
  return jsonb_build_object('status', 'updated', 'session', public.study_session_json(saved));
end;
$$;

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

create or replace function public.cleanup_expired_study_sessions()
returns integer
security definer
set search_path = public, extensions
language sql
as $$
  with deleted as (
    delete from public.study_sessions
    where expires_at < timezone('utc', now()) - interval '24 hours'
    returning id
  )
  select count(*)::integer from deleted;
$$;

alter table public.profiles enable row level security;
alter table public.subject_progress enable row level security;
alter table public.study_sessions enable row level security;

create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own_username
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy subject_progress_select_own
  on public.subject_progress for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on schema migration_private from public, anon, authenticated;
revoke all on all tables in schema migration_private from public, anon, authenticated;
revoke all on all sequences in schema migration_private from public, anon, authenticated;
revoke all on all functions in schema migration_private from public, anon, authenticated;

revoke all on public.study_sessions from anon, authenticated;
revoke all on function public.create_study_session(uuid, uuid, text, text, jsonb, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.get_study_session(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.claim_study_session(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.release_study_session(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.update_study_session(uuid, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.mutate_subject_progress(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.finalize_study_session(uuid, uuid, text, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.cleanup_expired_study_sessions() from public, anon, authenticated;

grant usage on schema public to authenticated, service_role;
grant select on public.profiles, public.subject_progress to authenticated;
grant update (username) on public.profiles to authenticated;
grant all on public.profiles, public.subject_progress, public.study_sessions to service_role;
grant execute on function public.create_study_session(uuid, uuid, text, text, jsonb, timestamptz, timestamptz) to service_role;
grant execute on function public.get_study_session(uuid, uuid, text, text) to service_role;
grant execute on function public.claim_study_session(uuid, uuid, text, text, timestamptz) to service_role;
grant execute on function public.release_study_session(uuid, uuid, text, text) to service_role;
grant execute on function public.update_study_session(uuid, uuid, text, text, jsonb) to service_role;
grant execute on function public.mutate_subject_progress(uuid, text, jsonb) to service_role;
grant execute on function public.finalize_study_session(uuid, uuid, text, text, jsonb, jsonb) to service_role;
grant execute on function public.cleanup_expired_study_sessions() to service_role;
