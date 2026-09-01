# GCSE Study Desk

One revision dashboard for AQA GCSE Maths Foundation, Maths Higher and English Language. A clean subject selector opens three complete study routes while one Express application handles sign-in, APIs, deployment and persistent per-user progress. Local and Docker runs use JSON storage; Vercel production uses Supabase as the application's single source of truth.

The website is self-contained in this directory. Run all commands below from
the repository's `website/` directory.

## Sign In

- Open Maths or English. Sign in with the local `admin` account (auto-created on first run), or create your own account from the sign-in screen:
  - **Username:** `admin` / **Password:** `admin` (built-in)
  - **New users:** choose "New here? Create an account" — usernames are 3-32 characters, passwords 8+.
- Progress, streaks, paper history and tutor chat are stored per user and survive server restarts and Docker redeploys (they live in the `gcse-data` volume).
- Optional OAuth2 sign-in: set the `OAUTH_*` variables in `.env` (see `.env.example`) to enable "Continue with {provider}" on the sign-in screens. OAuth identities create their own account on first sign-in.

## Subjects

- **MathsMate Foundation**: AQA Mathematics 8300 Foundation, three papers, 1,730 generated questions, interactive diagrams and lesson models, topic lessons, progress tracking and an AI tutor. Any Foundation topic may appear on any paper; Paper 1 remains non-calculator safe.
- **MathsMate Higher**: AQA Mathematics 8300H, three 80-mark papers, original Higher generators plus supporting topic practice, accessible graph questions, deterministic mark schemes, grades 4-9 and a Higher-aware AI tutor.
- **EnglishMate**: AQA English Language 8700, both papers, source-text library, skill lessons, AQA-style AI marking, progress tracking and an AI tutor.

Open `http://localhost:3000`, choose Foundation Maths, Higher Maths or English, then sign in. Your light or dark theme choice is remembered across the whole site.

## Quick Start

```bash
docker compose up --build
```

To enable AI tutoring, English extended-answer marking and optional OAuth:

```bash
cp .env.example .env
# Add OPENROUTER_API_KEY and optionally the OAUTH_* variables to .env
docker compose up --build
```

Both apps retain offline support when no key is configured.

## Runtime Design

- Local and Docker runs start the combined Express server from `server/src/index.js`. The JSON driver stores accounts, sessions, progress and study sessions beneath `DATA_DIR`; Docker persists that directory in the `gcse-data` volume.
- Vercel runs `api/index.js` as the serverless API entrypoint and builds the selector and three subject bundles into `public/` with `npm run build:vercel`.
- All storage drivers expose the same async storage interface, so authentication, progress, rewards and subject routers do not depend on a specific database.
- The Supabase schema is versioned under `supabase/migrations` and applied with `supabase db push`. Users, subject progress, active study sessions, preferences, study plans and the mistake notebook live in Supabase tables, never in process memory or browser storage.
- The deployment excludes local JSON data, environment files and generated agent files through `.vercelignore`; local data must be migrated explicitly when moving to production.

## Supabase

Supabase is the application database. `STORAGE_DRIVER=supabase` is required on
Vercel and optional locally; the JSON driver remains available for local and
Docker development.

- `STORAGE_DRIVER=supabase` uses Supabase Auth email/password sessions and bearer JWTs.
- Browser configuration uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- The server requires `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`. The publishable key is used only for user Auth operations; the secret key is used for privileged storage/admin operations and must never be exposed through `VITE_*` or `EXPO_PUBLIC_*` variables.
- The public schema contains `profiles`, compact `subject_progress` aggregates, temporary `study_sessions`, plus account personal data: `subject_preferences`, `study_plans`, `study_plan_days` and `mistake_notebook`. All user-owned tables are protected by RLS (`user_id = auth.uid()`).
- Browser/device preferences, plans and notebook mistakes load through the per-subject `/personal` API and follow the account across devices. Legacy localStorage/AsyncStorage data is uploaded once into empty domains and then cleared.
- Legacy users and migration-only data live in the private `migration_private` schema. Password hashes are never copied to public tables or logs.
- Tutor chat is not persisted by the Supabase driver. Finalized paper attempts are durable (`paper_attempts`, most recent 50 per user and subject) and replayable from the results page; the dashboards use retained topic aggregates for current focus.
- Mobile `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values must identify this same project. Disable **Confirm email** for immediate post-signup API access; if it is enabled, users must confirm their address before Supabase returns a session.

Start Local Supabase with Docker, then configure the server and browser URLs:

```bash
npx supabase start
cp .env.example .env.supabase.local
# Set STORAGE_DRIVER=supabase, the local Supabase keys, and VITE_* values.
npm run dev
```

For Docker, the browser should use `http://localhost:54321`, while the
container reaches the host service through `http://host.docker.internal:54321`:

```bash
STORAGE_DRIVER=supabase \
SUPABASE_CONTAINER_URL=http://host.docker.internal:54321 \
VITE_SUPABASE_URL=http://localhost:54321 \
docker compose up --build
```

Apply tracked schema changes to the linked Supabase project:

```bash
npm run db:migrations:list
npm run db:migrations:push
```

## Vercel + Supabase

Set the Vercel project **Root Directory** to `website`. Vercel uses the same
Express API through `api/index.js` and assembles the three client bundles under
`public/` with `npm run build:vercel`.

1. Create or select the linked Supabase project and apply the tracked
   migrations: `npm run db:migrations:push`.
2. Confirm the Supabase project has `profiles`, `subject_progress`,
   `study_sessions` and the personal-data tables; clients read personal data
   through the `/personal` API.
3. Add these application variables to the Production environment:

- `STORAGE_DRIVER=supabase`
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the browser bundles
- `APP_URL` with the canonical HTTPS URL, for example `https://gcse-dashboard-server.vercel.app`

The free `*.vercel.app` hostname is sufficient; a custom domain is optional.
Do not set `DATA_DIR` on Vercel. Local and Docker deployments continue to use
the JSON driver by default.

## Development

From the repository root, first enter the website directory:

```bash
cd website
```

```bash
npm install
npm run dev
```

- Combined server and production app: `http://localhost:3000`
- Maths Vite client: `http://localhost:5173/maths/`
- English Vite client: `http://localhost:5174/english/`

Build and verify:

```bash
npm test
npm run build
npm run build:vercel
npm start
npm run test:ui
```

See `FOUNDATION_AUDIT.md` for the Foundation bank review and remaining content backlog. See
`AGENTS.md` for architecture, educational goals and change invariants.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Subject selector |
| `/subjects` | Subject directory (catalogue of available subjects) |
| `/feedback` | Public beta-tester feedback form (stores to the `beta_feedback` table / local `feedback.json`) |
| `/maths/*` | MathsMate client (sign-in gated) |
| `/maths-higher/*` | MathsMate Higher client (sign-in gated) |
| `/english/*` | EnglishMate client (sign-in gated) |
| `/api/auth/*` | Sign-in, session and OAuth endpoints |
| `/api/events` | Authenticated product-event append (see `ANALYTICS.md`) |
| `/api/events/summary` | Activation and funnel summary for the signed-in learner |
| `/api/feedback` | Public beta feedback submissions (rate limited) |
| `/api/maths/*` | Maths API (session required; health is public) |
| `/api/maths-higher/*` | Higher Maths API (session required; health is public) |
| `/api/english/*` | English API (session required; health is public) |

With the JSON driver, user progress is stored locally at
`${DATA_DIR}/users/<userId>/maths.json`,
`${DATA_DIR}/users/<userId>/maths-higher.json` and
`${DATA_DIR}/users/<userId>/english.json`; account personal data lives in
`${DATA_DIR}/users/<userId>/personal-<subject>.json`, finalized paper attempts in
`${DATA_DIR}/users/<userId>/attempts-<subject>.json` and product events in
`${DATA_DIR}/events.json`. Docker persists everything beneath
`/app/data`. With the Supabase driver, the equivalent records live in the
`subject_progress`, `subject_preferences`, `study_plans`, `study_plan_days`,
`mistake_notebook`, `paper_attempts` and `product_events` tables, scoped by user
and subject. Supabase stores only compact aggregates in `subject_progress`;
tutor chat is not persisted by that driver.

See `ANALYTICS.md` for the product event taxonomy, activation definition and
retention windows. See `FOUNDATION_AUDIT.md`, `HIGHER_AUDIT.md` and
`ENGLISH_AUDIT.md` for the per-qualification coverage audits and remaining
content backlog. See `AGENTS.md` for architecture, educational goals and change
invariants.
