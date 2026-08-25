begin;

select plan(15);

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

select * from finish();
rollback;
