create or replace function public.lookup_legacy_user_for_claim(p_username text)
returns jsonb
security definer
set search_path = public, migration_private, extensions
language plpgsql
as $$
declare
  legacy migration_private.legacy_users;
begin
  select * into legacy
  from migration_private.legacy_users
  where username = lower(trim(p_username));
  if legacy.legacy_user_id is null or legacy.claim_status <> 'pending' then
    return jsonb_build_object('status', 'unavailable');
  end if;
  return jsonb_build_object(
    'status', 'ready',
    'legacyUserId', legacy.legacy_user_id,
    'username', legacy.username,
    'passwordHash', legacy.password_hash,
    'role', legacy.role
  );
end;
$$;

create or replace function public.start_account_claim(
  p_legacy_user_id text,
  p_email text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns jsonb
security definer
set search_path = public, migration_private, extensions
language plpgsql
as $$
declare
  claim_id uuid;
begin
  if not exists (
    select 1 from migration_private.legacy_users
    where legacy_user_id = p_legacy_user_id and claim_status = 'pending'
  ) then
    return jsonb_build_object('status', 'unavailable');
  end if;

  delete from migration_private.account_claims
  where legacy_user_id = p_legacy_user_id
    and claimed_at is null;

  insert into migration_private.account_claims
    (legacy_user_id, email, claim_token_hash, expires_at)
  values
    (p_legacy_user_id, lower(trim(p_email)), p_token_hash, p_expires_at)
  returning id into claim_id;
  return jsonb_build_object('status', 'started', 'claimId', claim_id);
end;
$$;

create or replace function public.complete_account_claim(
  p_token_hash text,
  p_target_user_id uuid
)
returns jsonb
security definer
set search_path = public, migration_private, extensions
language plpgsql
as $$
declare
  claim migration_private.account_claims;
  legacy migration_private.legacy_users;
  migrated integer := 0;
begin
  select * into claim
  from migration_private.account_claims
  where claim_token_hash = p_token_hash
  for update;
  if claim.id is null or claim.claimed_at is not null or claim.expires_at <= timezone('utc', now()) then
    return jsonb_build_object('status', 'expired');
  end if;

  select * into legacy
  from migration_private.legacy_users
  where legacy_user_id = claim.legacy_user_id
  for update;
  if legacy.legacy_user_id is null or legacy.claim_status <> 'pending' then
    return jsonb_build_object('status', 'unavailable');
  end if;
  if not exists (select 1 from public.profiles where id = p_target_user_id) then
    return jsonb_build_object('status', 'target_missing');
  end if;

  update public.profiles
  set legacy_user_id = legacy.legacy_user_id,
      role = legacy.role
  where id = p_target_user_id;

  insert into public.subject_progress (
    user_id, subject, xp, streak, last_active_date,
    tests_taken, practice_answered, total_test_marks, total_test_correct,
    topic_stats, completed_lessons
  )
  select
    p_target_user_id, subject, xp, streak, last_active_date,
    tests_taken, practice_answered, total_test_marks, total_test_correct,
    topic_stats, completed_lessons
  from migration_private.legacy_subject_progress
  where legacy_user_id = legacy.legacy_user_id
  on conflict (user_id, subject) do nothing;
  get diagnostics migrated = row_count;

  update migration_private.legacy_users
  set claim_status = 'claimed', claimed_by = p_target_user_id,
      claimed_at = timezone('utc', now())
  where legacy_user_id = legacy.legacy_user_id;
  update migration_private.account_claims
  set target_user_id = p_target_user_id, claimed_at = timezone('utc', now())
  where id = claim.id;

  return jsonb_build_object(
    'status', 'completed',
    'legacyUserId', legacy.legacy_user_id,
    'subjectsMigrated', migrated
  );
end;
$$;

revoke all on function public.lookup_legacy_user_for_claim(text) from public, anon, authenticated;
revoke all on function public.start_account_claim(text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.complete_account_claim(text, uuid) from public, anon, authenticated;
grant execute on function public.lookup_legacy_user_for_claim(text) to service_role;
grant execute on function public.start_account_claim(text, text, text, timestamptz) to service_role;
grant execute on function public.complete_account_claim(text, uuid) to service_role;
