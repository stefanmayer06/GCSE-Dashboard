# Product Analytics: Event Model, Activation and Retention

This document defines the product event trail, the activation definition and the retention
policy for the new data domains introduced in
`supabase/migrations/20260902000000_mastery_loop_analytics.sql`.

## Domains

| Domain | Table / file | Purpose | Retention |
| --- | --- | --- | --- |
| Product events | `product_events` (Supabase), `events.json` (JSON driver) | Activation and retention funnel | 540 days, pruned via `prune_product_events` |
| Paper attempts | `paper_attempts` (Supabase), `attempts-<subject>.json` (JSON driver) | Durable, replayable paper history with question-level responses | Most recent 50 attempts per user and subject |
| Mistake notebook | `mistake_notebook` (+ new columns) | Mistake classification, warm-up and retry evidence | Kept while the account is active; deleted with the account |

All three domains are user-scoped, protected by RLS (`user_id = auth.uid()`) and written by the
server through the service role. Nothing here is shared between users.

## Event taxonomy

Events are appended through `POST /api/events` (authenticated) or derived server-side. Names are
validated against an allow-list in `server/src/personal-model.js`; unknown names are rejected.

| Event | Recorded by | Meaning |
| --- | --- | --- |
| `signup` | server (`/api/auth/signup`) | Account creation, with acquisition `source` metadata |
| `diagnostic_start` | client (maths diagnostic flow) | Learner started the 10-question diagnostic |
| `diagnostic_complete` | client (maths diagnostic flow) | Diagnostic submitted with a score |
| `mission_start` | client (lesson mission start) | Learner opened a planned mission |
| `mission_complete` | client (lesson mission completion) | Planned mission scored |
| `session_marked` | server (paper submit; practice/adhoc derived server-side via notebook diff) | A session finished with marks — the "first marked session" signal |
| `mistake_saved` | server (`PUT /personal/mistakes` diff) | A new mistake entered the notebook |
| `mistake_retry` | server (notebook diff) and client (retry button) | A scheduled retry was completed |
| `mistake_mastered` | server (notebook diff) | A mistake reached review 4/4 |
| `onboarding_complete` | client (onboarding wizard) | New learner set exam date and target |
| `week_return` | client (returning within 7 days of first event) | Week-one retention signal |
| `evidence_report` | client (evidence report printed/exported) | Learner shared evidence with a teacher/parent |

Event payloads carry a subject (`maths`, `maths-higher`, `english`) and small scalar metadata
(max 20 keys, 300 characters each). No free text, no personal content and no question prompts
are stored in events — question-level detail lives in `paper_attempts`.

## Activation definition

A learner counts as **activated** when, within their first seven days:

1. they complete a diagnostic (`diagnostic_complete`), **and**
2. they finish one marked study session (`session_marked`).

This is computed by `GET /api/events/summary` (`activated: true|false`) and mirrors the roadmap
definition "completing a diagnostic and one marked study session within seven days".

## Retention measurement

The summary endpoint also reports `counts` (per event name over the retention window), `firstSeen`
and `lastSeen`. Cohort reporting (D1/D7/D30 and exam-season cohorts) is derived from these events
by `firstSeen` week; no extra identifiers are added.

## Non-goals

- Events are not learning evidence. XP, streaks and readiness stay subject-scoped aggregates.
- Events never contain tutor conversations, prompts, responses or self-marked drafts.
- There is no cross-user analytics join: product-level funnels are computed offline from the
  same table by aggregating per-user counts, without exposing other users' rows.
