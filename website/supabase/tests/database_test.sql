begin;

select plan(35);

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

select has_column('public', 'study_plan_days', 'updated_at', 'plan days support the shared update trigger');
select has_column('public', 'mistake_notebook', 'updated_at', 'mistake rows support the shared update trigger');
select lives_ok(
  $test$select public.save_study_plan(
    '10000000-0000-0000-0000-000000000001', 'maths', '2026-09-01', null,
    '[{"date":"2026-09-01","label":"Today","task":"Fractions","minutes":15,"topicId":"fractions","status":"todo"}]'::jsonb
  )$test$,
  'a study plan day can be inserted'
);
select lives_ok(
  $test$select public.save_study_plan(
    '10000000-0000-0000-0000-000000000001', 'maths', '2026-09-01', null,
    '[{"date":"2026-09-01","label":"Today","task":"Fractions","minutes":15,"topicId":"fractions","status":"done","result":{"percent":80,"completedAt":"2026-09-01T10:00:00.000Z"}}]'::jsonb
  )$test$,
  'an existing study plan day can be marked done'
);
select is(
  (select status from public.study_plan_days where day_date = '2026-09-01'),
  'done',
  'the completed plan-day status is persisted'
);
select lives_ok(
  $test$select public.replace_mistakes(
    '10000000-0000-0000-0000-000000000001', 'maths',
    '[{"id":"mistake-1","qid":"q1","topicName":"Fractions","prompt":"Find a half","answer":2,"dueDates":[],"reviewIndex":0,"capturedAt":"2026-09-01T10:00:00.000Z"}]'::jsonb
  )$test$,
  'a mistake-notebook row can be inserted'
);
select lives_ok(
  $test$select public.replace_mistakes(
    '10000000-0000-0000-0000-000000000001', 'maths',
    '[{"id":"mistake-1","qid":"q1","topicName":"Fractions","prompt":"Find a half","answer":2,"dueDates":[],"reviewIndex":1,"capturedAt":"2026-09-01T10:00:00.000Z"}]'::jsonb
  )$test$,
  'an existing mistake-notebook row can be updated'
);
select is(
  (select review_index from public.mistake_notebook where legacy_id = 'mistake-1'),
  1,
  'the updated mistake review index is persisted'
);

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
