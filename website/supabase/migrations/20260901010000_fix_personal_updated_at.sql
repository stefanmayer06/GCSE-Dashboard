-- The shared set_updated_at trigger expects every target table to expose an
-- updated_at column. These two columns were omitted when their triggers were
-- introduced, so updates to plan days and notebook rows failed at runtime.
alter table public.study_plan_days
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.mistake_notebook
  add column if not exists updated_at timestamptz not null default timezone('utc', now());
