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
| `mistake_retry` | server (notebook diff) and client (retry button) | A scheduled retry was completed; client retries carry the recall `grade` (again/hard/good/easy) |
| `mistake_mastered` | server (notebook diff) | A mistake reached review 4/4 |
| `mistake_corrected` | client (notebook correction box) | Learner wrote their own correction for a mistake |
| `fixup_start` | client (Fix-Up 5 entry) | A targeted 5-question repair set started, with weak topics/skills |
| `fixup_complete` | client (Fix-Up 5 scoring) | A targeted repair set scored, with marks |
| `memri_start` | client (memory-check entry) | A mastered-item resurrection set started |
| `memri_complete` | client (memory-check scoring) | A resurrection set scored, with re-proofed count |
| `milestone_shared` | client (creature collection) | A hatched or evolved study creature was shared or copied (`milestone`: `<creature>-<tier>`, e.g. `ember-2`) |
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

This is computed by `GET /api/events/summary` (`activated: true|false`) using each
event's timestamp relative to the learner's first recorded event. Merely completing
both milestones eventually does not count as first-week activation.

## Retention measurement

The summary endpoint also reports `counts` (per event name over the retention window), `firstSeen`
and `lastSeen`. For private operator review, `npm run acquisition:report -- 90` aggregates
signups by their recorded `src` source, diagnostics, marked sessions and activation
within seven days of signup. It also reports day-7 return: any event on days 7–13
after signup, among learners old enough to have completed that observation window.
The command outputs counts only, never account identifiers or event content. Sources
are small labels such as `home-foundation` or `parent-group`, never a free-text URL.
Run the command with production Supabase credentials only in a private operator
environment. A blank report means no signup events were recorded in the selected
window, not proof that nobody visited the site. Counts can lag when event writes
fail or when a learner completes work on an untracked platform.

## Beta feedback report

The public feedback form (`selector/feedback.html`) stores optional design
answers (a 1–5 clarity rating and a short note) and optional pricing answers
(who would pay, preferred payment model and four Van Westendorp prices in pounds
per month) in `beta_feedback`. `npm run feedback:report -- 90` aggregates them
by role and source: response counts, average ratings, price medians and the
four price-curve crossings. It uses only complete answer sets whose prices
do not decrease. Like the acquisition report, it outputs no messages, notes,
emails or identifiers. Treat price points from fewer than about 30 complete
answers as directional.

## Non-goals

- Events are not learning evidence. XP, streaks and readiness stay subject-scoped aggregates.
- Events never contain tutor conversations, prompts, responses or self-marked drafts.
- There is no public cross-user analytics route. The private operator command reads
  the same server-side event store and outputs aggregate counts only.
