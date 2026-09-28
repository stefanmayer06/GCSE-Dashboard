-- Public support form submissions are written only through the server. There
-- are no client policies: learners cannot query another person's message.
create table public.support_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  topic text not null check (topic in ('account', 'study', 'content', 'privacy', 'other')),
  message text not null check (char_length(message) between 1 and 2000),
  email text check (email is null or char_length(email) <= 200),
  created_at timestamptz not null default timezone('utc', now())
);

create index support_requests_created_idx
  on public.support_requests (created_at desc);

alter table public.support_requests enable row level security;

revoke all on public.support_requests from anon, authenticated;
grant select, insert, delete on public.support_requests to service_role;
