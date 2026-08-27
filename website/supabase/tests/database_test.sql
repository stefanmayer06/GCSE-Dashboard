begin;

select plan(28);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'subject_progress', 'subject_progress table exists');
select has_table('public', 'study_sessions', 'study_sessions table exists');
select has_table('migration_private', 'legacy_users', 'legacy user staging table exists');
select has_table('migration_private', 'legacy_subject_progress', 'legacy progress staging table exists');
select has_table('migration_private', 'account_claims', 'one-time account claim table exists');
select has_table('migration_private', 'migration_runs', 'migration audit table exists');
select hasnt_column('public', 'subject_progress', 'history', 'progress history is not persisted');
select hasnt_column('public', 'subject_progress', 'chat', 'tutor chat is not persisted');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.subject_progress'::regclass),
  'subject_progress has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.study_sessions'::regclass),
  'study_sessions has RLS enabled'
);

select ok(
  public.valid_compact_progress('{"xp":10,"streak":1,"topicStats":{"fractions":{"correct":2,"total":3}},"completedLessons":[]}'::jsonb),
  'compact progress accepts aggregate state'
);
select ok(
  not public.valid_compact_progress('{"history":[],"chat":[]}'::jsonb),
  'compact progress rejects history and chat'
);
select ok(
  public.level_for_xp(0) = 1 and public.level_for_xp(200) = 3,
  'XP levels use the dashboard curve'
);

select ok(
  (select prosecdef from pg_proc where oid = 'public.handle_new_user()'::regprocedure),
  'new-user profile handler remains security definer'
);
select ok(
  (select proconfig @> array['search_path=public, extensions']
   from pg_proc where oid = 'public.handle_new_user()'::regprocedure),
  'new-user profile handler keeps its restricted search path'
);
select ok(
  position('^[a-z0-9_.-]{3,32}$' in pg_get_functiondef('public.handle_new_user()'::regprocedure)) > 0
  and position('^[A-Za-z0-9_]{3,32}$' in pg_get_functiondef('public.handle_new_user()'::regprocedure)) = 0,
  'new-user profile handler matches the API lowercase username contract'
);

select has_function(
  'public',
  'finalize_study_session_operation',
  array['uuid', 'uuid', 'text', 'text', 'jsonb', 'jsonb'],
  'atomic session finalizer exists'
);
select ok(
  not has_function_privilege('anon', 'public.finalize_study_session_operation(uuid,uuid,text,text,jsonb,jsonb)', 'execute'),
  'anon cannot finalize sessions directly'
);
select ok(
  not has_function_privilege('authenticated', 'public.finalize_study_session_operation(uuid,uuid,text,text,jsonb,jsonb)', 'execute'),
  'authenticated users cannot finalize sessions directly'
);
select ok(
  has_function_privilege('service_role', 'public.finalize_study_session_operation(uuid,uuid,text,text,jsonb,jsonb)', 'execute'),
  'service role can finalize sessions'
);

insert into auth.users (id, email) values ('10000000-0000-0000-0000-000000000001', 'atomic@example.test');
insert into public.study_sessions (id, user_id, subject, kind, payload, expires_at)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'maths', 'paper', '{}'::jsonb, timezone('utc', now()) + interval '1 hour'
);

select public.mutate_subject_progress(
  '10000000-0000-0000-0000-000000000001', 'maths',
  '{"type":"add_xp","amount":7}'::jsonb
);
create temporary table first_finalization as
select public.finalize_study_session_operation(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'maths', 'paper',
  '{"testResult":{"totalMarks":5,"correctMarks":4},"practiceRecords":[{"topicId":"fractions","correct":2,"total":3}],"scoreXp":8,"lessonId":"fractions"}'::jsonb,
  '{"correctMarks":4,"reward":{"xpAwarded":999},"progress":{"xp":999}}'::jsonb
) as value;

select is((select xp from public.subject_progress where user_id = '10000000-0000-0000-0000-000000000001'), 35,
  'finalization applies its reward to the latest stored progress');
select is((select (value -> 'result' -> 'reward' ->> 'xpAwarded')::integer from first_finalization), 28,
  'stored reward is canonical rather than response supplied');
select is((select (value -> 'result' -> 'progress' ->> 'xp')::integer from first_finalization), 35,
  'stored response contains canonical progress');
select is((select practice_answered from public.subject_progress where user_id = '10000000-0000-0000-0000-000000000001'), 3,
  'finalization applies submitted practice records with the test');

select is(
  (public.finalize_study_session_operation(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'maths', 'paper',
    '{"testResult":{"totalMarks":100,"correctMarks":100},"scoreXp":100}'::jsonb,
    '{"changed":true}'::jsonb
  ) ->> 'replayed')::boolean,
  true,
  'completed finalization replays without applying a second mutation'
);
select is((select tests_taken from public.subject_progress where user_id = '10000000-0000-0000-0000-000000000001'), 1,
  'replay leaves progress unchanged');

select * from finish();
rollback;
