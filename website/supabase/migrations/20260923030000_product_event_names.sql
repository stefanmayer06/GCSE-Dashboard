-- Match the API event taxonomy. NOT VALID preserves any legacy rows with
-- unknown names while preventing new direct client inserts from adding more.
alter table public.product_events
  add constraint product_events_known_name
  check (name in (
    'signup',
    'diagnostic_start',
    'diagnostic_complete',
    'mission_start',
    'mission_complete',
    'session_marked',
    'mistake_saved',
    'mistake_retry',
    'mistake_mastered',
    'mistake_corrected',
    'fixup_start',
    'fixup_complete',
    'memri_start',
    'memri_complete',
    'milestone_shared',
    'onboarding_complete',
    'week_return',
    'evidence_report'
  )) not valid;
