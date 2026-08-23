# GCSE Study Desk

One revision dashboard for AQA GCSE Maths Foundation, Maths Higher and English Language. A clean subject selector opens three complete study routes while one Express server handles sign-in, APIs, deployment and persistent per-user progress.

## Sign In

- Open Maths or English. Sign in with the local `admin` account (auto-created on first run), or create your own account from the sign-in screen:
  - **Username:** `admin` / **Password:** `admin` (built-in)
  - **New users:** choose "New here? Create an account" — usernames are 3-32 characters, passwords 8+.
- Progress, streaks, paper history and tutor chat are stored per user and survive server restarts and Docker redeploys (they live in the `gcse-data` volume).
- Optional OAuth2 sign-in: set the `OAUTH_*` variables in `.env` (see `.env.example`) to enable "Continue with {provider}" on the sign-in screens. OAuth identities create their own account on first sign-in.

## Subjects

- **MathsMate Foundation**: AQA Mathematics 8300 Foundation, three papers, 1,730 generated questions, topic lessons, progress tracking and an AI tutor.
- **MathsMate Higher**: AQA Mathematics 8300H, three 80-mark papers, 896 original Higher generators plus supporting topic practice, deterministic mark schemes, grades 4-9 and a Higher-aware AI tutor.
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
npm run build
npm start
npm run test:ui
```

See `AGENTS.md` for architecture, educational goals and change invariants.

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

User progress is stored locally at `${DATA_DIR}/users/<userId>/maths.json` and
`${DATA_DIR}/users/<userId>/maths-higher.json` and
`${DATA_DIR}/users/<userId>/english.json`. Docker persists everything beneath `/app/data`.
