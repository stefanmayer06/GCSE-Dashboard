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
    or requested_username !~ '^[a-z0-9_.-]{3,32}$' then
    requested_username := fallback_username;
  end if;

  insert into public.profiles (id, username)
  values (new.id, requested_username)
  on conflict (id) do nothing;
  return new;
end;
$$;
