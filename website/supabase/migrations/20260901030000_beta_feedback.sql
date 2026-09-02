-- Beta feedback: structured submissions from the public /feedback form used by
-- early testers. Rows are written by the study server with the service role.
create table public.beta_feedback (
  id uuid primary key default extensions.gen_random_uuid(),
  role text not null check (role in ('student', 'parent', 'teacher', 'other')),
  subject text not null check (subject in ('maths', 'maths-higher', 'english', 'multiple')),
  rating integer not null check (rating between 1 and 5),
  heard text,
  message text not null,
  email text,
  source text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index beta_feedback_created_idx
  on public.beta_feedback (created_at desc);

-- RLS is enabled with no policies: client auth roles can neither read nor write
-- feedback rows; only the server's service-role key touches this table.
alter table public.beta_feedback enable row level security;
