# GCSE Study Desk

One revision dashboard for AQA GCSE Maths Foundation, Maths Higher and English Language. A clean subject selector opens three complete study routes while one Express application handles sign-in, APIs, deployment and persistent per-user progress. Local and Docker runs use JSON storage; Vercel production uses Neon PostgreSQL.

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
- The PostgreSQL schema is applied automatically on first startup. Users, auth sessions, OAuth states, subject progress and active study sessions are stored in Neon tables rather than process memory.
- The deployment excludes local JSON data, environment files and generated agent files through `.vercelignore`; local data must be migrated explicitly when moving to production.

## Supabase Migration

Supabase is currently an opt-in migration driver. Neon remains the production
database until the migration has been rehearsed, reconciled and approved.

- `STORAGE_DRIVER=supabase` uses Supabase Auth email/password sessions and bearer JWTs.
- Browser configuration uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- The server uses `SUPABASE_URL` and `SUPABASE_SECRET_KEY`; never expose the secret key through `VITE_*` variables.
- The public schema contains `profiles`, compact `subject_progress` aggregates and temporary `study_sessions`.
- Legacy users and migration-only data live in the private `migration_private` schema. Password hashes are never copied to public tables or logs.
- Tutor chat and paper history are not persisted by the Supabase driver. The dashboards use retained topic aggregates for current focus.
- The hosted migration rehearsal uses Supabase's default email service with email confirmations enabled and MFA disabled; custom SMTP can be configured later if needed. The local `supabase/config.toml` remains configured for localhost development.

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

The migration is dry-run by default. A write requires both `--write` and
`SUPABASE_MIGRATION_CONFIRM=YES`:

```bash
npm run migrate:supabase
SUPABASE_MIGRATION_CONFIRM=YES npm run migrate:supabase -- --write
npm run verify:supabase
```

Set `SUPABASE_DB_URL` for the migration scripts. They stage only legacy
identity metadata and compact aggregates; they do not copy auth sessions,
OAuth state, active papers, chat or history.

After the stability window and explicit sign-off, private staging can be
purged only when no legacy account remains pending:

```bash
SUPABASE_MIGRATION_PURGE=YES npm run purge:supabase-staging -- --write
```

## Vercel + Neon

The Vercel project root must be the repository root (`.`). Vercel uses the same
Express API through `api/index.js` and assembles the three client bundles under
`public/` with `npm run build:vercel`.

1. Install **Neon** from the Vercel Marketplace and connect it to this project.
   The Vercel-native integration can create a Neon project for you or link an
   existing Neon account, then sync its connection variables to the selected
   Vercel environments.
2. Confirm that the integration has supplied `DATABASE_URL`. This application
   uses `@neondatabase/serverless` and does not use Supabase's client/API layer.
   Supabase would require a different PostgreSQL driver and storage configuration.
3. Add these application variables to the Production environment:

- `STORAGE_DRIVER=postgres`
- `APP_URL` with the canonical HTTPS URL, for example `https://gcse-dashboard-server.vercel.app`
- `ADMIN_PASSWORD` for first-run admin seeding
- `SESSION_SECRET` with a random value of at least 32 characters

The free `*.vercel.app` hostname is sufficient; a custom domain is optional.
Do not set `DATA_DIR` on Vercel. Existing JSON accounts, progress, auth
sessions, OAuth states and study sessions can be copied idempotently with:

```bash
npm run migrate:postgres -- --data-dir server/data
```

Run the migration with the production `DATABASE_URL` available in the shell,
before relying on the new deployment. Use `--dry-run` to inspect the source data
without a database connection. Local and Docker deployments continue to use the
JSON driver by default.

## Development

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
| `/maths/*` | MathsMate client (sign-in gated) |
| `/maths-higher/*` | MathsMate Higher client (sign-in gated) |
| `/english/*` | EnglishMate client (sign-in gated) |
| `/api/auth/*` | Sign-in, session and OAuth endpoints |
| `/api/maths/*` | Maths API (session required; health is public) |
| `/api/maths-higher/*` | Higher Maths API (session required; health is public) |
| `/api/english/*` | English API (session required; health is public) |

With the JSON driver, user progress is stored locally at
`${DATA_DIR}/users/<userId>/maths.json`,
`${DATA_DIR}/users/<userId>/maths-higher.json` and
`${DATA_DIR}/users/<userId>/english.json`. Docker persists everything beneath
`/app/data`. With the PostgreSQL drivers, the equivalent records live in the
`subject_progress` table and are scoped by user and subject. Supabase stores
only compact aggregates there; paper history and tutor chat are not persisted
by that driver.
