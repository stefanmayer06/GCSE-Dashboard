# GCSE Study Desk: Agent Guide

## Product Goal

GCSE Study Desk helps teenagers prepare confidently for their AQA GCSE exams. It combines MathsMate for AQA GCSE Mathematics (8300 Foundation and 8300H Higher tiers) and EnglishMate for AQA GCSE English Language (8700) in one focused revision product.

The app should help a learner answer three questions quickly:

1. What should I revise next?
2. Can I practise it in the same format as the real exam?
3. Can I understand what went wrong and improve the next attempt?

Teaching quality matters more than novelty. Explanations should be clear, encouraging and age-appropriate. Practice should reflect AQA paper structure, marks and timing. The AI tutors should guide students through a method before revealing an answer.

## Application Shape

The website is self-contained in the repository's `website/` directory. Treat
that directory as the application root and run all npm, Docker, Supabase, and
test commands from it. It contains one Express application and two intentionally
isolated React clients. Local and Docker runs use the combined process; Vercel
runs the same API through a serverless entrypoint and serves the built clients
as static output:

- `/` serves the subject selector in `selector/`.
- `/maths/*` serves the MathsMate React client from `clients/maths/`.
- `/maths-higher/*` serves the same MathsMate client in Higher-tier mode.
- `/english/*` serves the EnglishMate React client from `clients/english/`.
- `/api/maths/*` mounts the Maths API router.
- `/api/maths-higher/*` mounts the same API in Higher-tier mode with separate progress storage.
- `/api/english/*` mounts the English API router.

- `api/index.js` wraps the Express API for Vercel.
- `public/` is assembled by `npm run build:vercel` for the Vercel deployment.

The clients remain separate because their question formats, grading logic and global visual themes differ. Do not combine their CSS into one bundle without first scoping every global rule.

## Source Map

- `server/src/index.js`: combined host server, auth wiring, API mounts and static routing.
- `server/src/auth.js`: user accounts, sessions and OAuth2 sign-in; seeds the local admin account.
- `server/src/db.js`: per-user, per-subject progress and reward logic over the configured async storage driver.
- `server/src/storage/`: Supabase (production), JSON (local/Docker) storage drivers plus shared data-model helpers.
- `server/src/storage/supabase.js`: Supabase Auth/PostgreSQL driver. It is the application's single source of truth in production.
- `server/src/personal-model.js`: normalization/validation for account personal data (preferences, study plans, mistake notebook).
- `server/src/personal.js`: per-subject `/personal` routes backing preferences, the saved 7-day plan and the mistake notebook.
- `server/src/supabase/`: Supabase server client configuration and secret-key handling.
- `supabase/`: SQL migrations (tables, RLS policies, RPCs), private legacy staging tables and database tests.
- `server/src/subjects/maths/`: generated question bank, exact marking, grades, progress and Maths tutor.
- `server/src/subjects/english/`: source texts, question assembly, rubric marking, grades, progress and English tutor.
- `clients/maths/src/pages/`: Maths dashboard, papers, results, topic lessons and tutor.
- `clients/english/src/pages/`: English dashboard, papers, results, lessons, text library and tutor.
- `clients/shared/login.jsx`: shared sign-in gate used by both clients.
- `selector/`: dependency-free root subject selector.
- `ui-tests/`: Playwright route, responsive and browser-error checks.

## Accounts And Sign-In

Every request to `/api/maths/*`, `/api/maths-higher/*` and `/api/english/*` requires a valid session except the three public health endpoints. The selector uses those health endpoints, so it can show availability before sign-in.

- `POST /api/auth/login` accepts a username and password.
- `POST /api/auth/signup` creates a new local account (3-32 character username, 8+ character password) and signs it in.
- `GET /api/auth/me` returns the signed-in user.
- `POST /api/auth/logout` ends the session.
- `POST /api/auth/claim` verifies a legacy scrypt password, creates a Supabase Auth email account and copies compact progress once during migration.
- `GET /api/auth/config` reports whether OAuth is configured.

The local `admin` account (username `admin`, password `admin`) is seeded automatically on first boot when `users.json` does not already contain it. In production, `ADMIN_PASSWORD` must be set before the missing admin account can be seeded. It is always recreated if missing. Passwords are stored as `scrypt` hashes, never in plain text. Never use the local default password in production.

OAuth2 is optional and configured entirely by environment variables. When `OAUTH_CLIENT_ID`,
`OAUTH_CLIENT_SECRET`, `OAUTH_AUTHORIZE_URL`, `OAUTH_TOKEN_URL` and `OAUTH_USERINFO_URL` are all set,
the sign-in screens show "Continue with <provider>" and the server runs the authorization-code flow.
A provider identity maps to a username (email or preferred_username), created on first sign-in.

On the Supabase driver (required on Vercel), the sign-in screen uses email/password and bearer JWTs. Supabase Auth
accounts are separate from the legacy custom accounts; old auth sessions are not migrated. Legacy accounts move over through the one-time claim flow.

## Data And Progress

Each user has separate stores per subject. Progress is never mixed between users or subjects. The configured storage driver is JSON for local/Docker runs and Supabase for Vercel production. Supabase is the application's single source of truth for persistent data.

- `${DATA_DIR}/users/<userId>/maths.json`
- `${DATA_DIR}/users/<userId>/maths-higher.json`
- `${DATA_DIR}/users/<userId>/english.json`
- `${DATA_DIR}/users/<userId>/personal-<subject>.json` (JSON driver only)

With the JSON driver, accounts live in `${DATA_DIR}/users.json`, sessions in
`${DATA_DIR}/sessions.json`, and subject progress lives beneath
`${DATA_DIR}/users/<userId>/`. `DATA_DIR` is a single environment variable;
Docker sets it to `/app/data`, which is persisted in the `gcse-data` volume and
survives container recreation and redeploys.

With the Supabase driver, users, subject progress and active study sessions live
in the `profiles`, `subject_progress` and `study_sessions` tables, and account
personal data lives in `subject_preferences`, `study_plans`, `study_plan_days`
and `mistake_notebook`. The schema is versioned under `supabase/migrations` and
applied with `supabase db push`. Vercel supplies `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`; do not set `DATA_DIR` there.

## Personal data (preferences, plan, notebook)

Every subject router mounts `/personal` routes served from `server/src/personal.js`:
`GET /personal`, `PUT /personal/preferences`, `PUT /personal/plan` and
`PUT /personal/mistakes`. Clients consume them through `study-personal.js` (web)
and `src/personal.ts` (app). On first load, legacy localStorage/AsyncStorage data
is uploaded once (only into empty domains), a completion flag is recorded, and the
legacy keys are removed. Direct authenticated table access is allowed by RLS
(`user_id = auth.uid()`), while mutations through the server use the service role.
Client drafts and short-lived result caches may stay local, but they are never
treated as authoritative.

On startup, legacy single-file progress from `${DATA_DIR}/maths/db.json` and
`${DATA_DIR}/english/db.json` is migrated into the `admin` account when no user store exists yet,
so upgrading to logins never loses existing progress.

Each legacy store tracks XP, streak, paper history, topic accuracy and tutor chat for its own subject. The opt-in Supabase driver deliberately stores only XP, streak, counters, topic accuracy and completed lessons. Paper history and tutor chat are not written to Supabase. Legacy users and compact progress are staged in the private `migration_private` schema, and custom scrypt hashes are never imported into `auth.users`.

Supabase Auth accounts are created through the one-time `POST /api/auth/claim` flow, which verifies the legacy password, requires an email and new password, and copies only compact subject aggregates.

Active paper, practice and adhoc sessions are persisted through the configured
storage driver. Supabase deployments can resume them across serverless
invocations and restarts; expired sessions are rejected by the session lifecycle
checks.

## Subject Rules

### Maths Foundation

- Course: AQA GCSE Mathematics 8300, Foundation tier, grades 1-5.
- Preserve all three papers and calculator rules.
- Automatic marking must use the existing generated question metadata.
- Higher-tier-only techniques should not be presented as Foundation requirements.

### Maths Higher

- Course: AQA GCSE Mathematics 8300H, grades 4-9, three 80-mark papers.
- Paper 1 is non-calculator; Papers 2 and 3 allow calculators; all papers are 90 minutes.
- Higher questions are original AQA 8300H-aligned generators, not copied past-paper text.
- Keep Higher-only practice and grade predictions separate from Foundation progress.
- Every generated question must include an exact answer, worked solution and deterministic marking metadata.
- Every generated Higher paper must contain at least one accessible graph stimulus, no calculator-required items on 8300/1H, and exactly one item marked as an exceptional synoptic challenge.
- AQA content weightings apply approximately across the qualification, not as fixed per-paper allocations; any specification topic may appear on any Higher paper.

### English

- Course: AQA GCSE English Language 8700, grades 1-9; it has no tiers.
- Preserve both papers, source displays, marks and timing.
- List and true/false questions are marked deterministically.
- Extended responses use AQA-style rubric prompts through OpenRouter when configured.
- Without an API key, learners must still receive rubrics and model answers for self-marking.
- Paper 1 Q5 description tasks show a free image from Wikimedia Commons (`q5Image` on each text in `server/src/subjects/english/texts/p1.js`; URLs are resolved via `Special:FilePath`). Images must stay appropriate for 14+ students, and the client hides them gracefully if a URL ever fails.

## AI Configuration

`OPENROUTER_API_KEY` enables both tutors and English extended-answer marking. `OPENROUTER_MODEL` defaults to `qwen/qwen3.7-flash`. Never commit keys or log them. Both subjects must retain useful offline behavior when no key is configured.

## Development

From the repository root, enter `website/` before running these commands. Set
the Vercel project **Root Directory** to `website`.

```bash
cd website
npm install
npm run dev       # server :3000, Maths Vite :5173, English Vite :5174
npm run build     # builds both subject clients
npm start         # serves selector and built clients on :3000
npm run test:ui   # requires the built app running on :3000
docker compose up --build
```

## Change Invariants

- Keep API routes namespaced by subject.
- Keep subject databases and browser storage keys separate.
- Keep `BrowserRouter` basenames and Vite bases aligned with `/maths`, `/maths-higher` and `/english`.
- Preserve direct refreshes on nested routes such as `/maths/learn/fractions` and `/english/texts/p1-great-expectations`.
- Test desktop and 390px mobile layouts for the selector and all three subject routes.
- Do not claim official AQA endorsement. AQA course structures can be represented accurately, but the product is an independent revision tool.
- Prefer small, testable changes over cross-subject abstractions that obscure exam-specific behavior.
- Subject data is always scoped to the signed-in user. Never write progress, chat or history to a shared file.
- New sign-in-facing API routes belong under `/api/auth`; new subject routes stay namespaced under `/api/maths`, `/api/maths-higher` and `/api/english` and must keep working with the session gate.
- The local/Docker default admin account is `admin` / `admin`; production must use `ADMIN_PASSWORD` and must never depend on that default.
- User data, auth sessions, progress, chat and study sessions must use the configured storage driver: JSON beneath `DATA_DIR` locally, Supabase tables on Vercel.
- Supabase is the application database. Keep service-role keys server-side, keep RLS enabled on user-owned tables (`user_id = auth.uid()`), and version every schema change as a migration under `supabase/migrations`. Never merge development users, progress, sessions, chat or submissions into production.
- Themes (light and dark) are driven by the shared design tokens in `clients/shared/study-desk.css` and each subject's `theme.css`. The `data-theme` attribute is set on `<html>` and persisted under the `gcse-theme` localStorage key so the choice survives across the selector and both subjects. New UI should consume these tokens rather than hardcoding colors.
- Every colour, border and surface should stay legible in both themes. Dark mode is not a shadow of the light design; it uses its own warm ink, muted text and brighter semantic colours on the same grid and typography.
