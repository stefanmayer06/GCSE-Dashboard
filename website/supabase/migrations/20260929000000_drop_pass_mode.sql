-- Pass mode was removed from the app and website; planning no longer reads it.
alter table public.subject_preferences drop column if exists pass_mode;
