-- The one-time legacy account move ("Move an existing account") was removed
-- from the website, app and API. Drop its RPCs, the private staging schema
-- (legacy users and password hashes, their progress snapshots, claim tokens
-- and migration audit rows) and the profile column that linked to it.

drop function if exists public.complete_account_claim(text, uuid);
drop function if exists public.start_account_claim(text, text, text, timestamptz);
drop function if exists public.lookup_legacy_user_for_claim(text);

drop schema if exists migration_private cascade;

-- Replace the profile guard before dropping the column it used to read.
create or replace function public.protect_profile_fields()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  if auth.uid() = old.id and new.role is distinct from old.role then
    raise exception 'Only the server may change profile role'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

alter table public.profiles drop column if exists legacy_user_id;
