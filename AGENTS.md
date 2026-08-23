# GCSE Study Desk: Agent Guide

## Product Goal

GCSE Study Desk helps teenagers prepare confidently for their AQA GCSE exams. It combines MathsMate for AQA GCSE Mathematics (8300, Foundation tier) and EnglishMate for AQA GCSE English Language (8700) in one focused revision product.

The app should help a learner answer three questions quickly:

1. What should I revise next?
2. Can I practise it in the same format as the real exam?
3. Can I understand what went wrong and improve the next attempt?

Teaching quality matters more than novelty. Explanations should be clear, encouraging and age-appropriate. Practice should reflect AQA paper structure, marks and timing. The AI tutors should guide students through a method before revealing an answer.

## Application Shape

This is one repository and one deployable Express process with two intentionally isolated React clients:

- `/` serves the subject selector in `selector/`.
- `/maths/*` serves the MathsMate React client from `clients/maths/`.
- `/english/*` serves the EnglishMate React client from `clients/english/`.
- `/api/maths/*` mounts the Maths API router.
- `/api/english/*` mounts the English API router.

The clients remain separate because their question formats, grading logic and global visual themes differ. Do not combine their CSS into one bundle without first scoping every global rule.

## Source Map

- `server/src/index.js`: combined host server, auth wiring, API mounts and static routing.
- `server/src/auth.js`: user accounts, sessions and OAuth2 sign-in; seeds the local admin account.
- `server/src/db.js`: per-user, per-subject JSON store factory.
- `server/src/subjects/maths/`: generated question bank, exact marking, grades, progress and Maths tutor.
- `server/src/subjects/english/`: source texts, question assembly, rubric marking, grades, progress and English tutor.
- `clients/maths/src/pages/`: Maths dashboard, papers, results, topic lessons and tutor.
- `clients/english/src/pages/`: English dashboard, papers, results, lessons, text library and tutor.
- `clients/shared/login.jsx`: shared sign-in gate used by both clients.
- `selector/`: dependency-free root subject selector.
- `ui-tests/`: Playwright route, responsive and browser-error checks.

## Accounts And Sign-In

Every request to `/api/maths/*` and `/api/english/*` requires a valid session except the two public health endpoints. The selector uses those health endpoints, so it can show availability before sign-in.

- `POST /api/auth/login` accepts a username and password.
- `POST /api/auth/signup` creates a new local account (3-32 character username, 8+ character password) and signs it in.
- `GET /api/auth/me` returns the signed-in user.
- `POST /api/auth/logout` ends the session.
- `GET /api/auth/config` reports whether OAuth is configured.

The local `admin` account (username `admin`, password `admin`) is seeded automatically on first boot when `users.json` does not already contain it. It is always recreated if missing. Passwords are stored as `scrypt` hashes, never in plain text.

OAuth2 is optional and configured entirely by environment variables. When `OAUTH_CLIENT_ID`,
`OAUTH_CLIENT_SECRET`, `OAUTH_AUTHORIZE_URL`, `OAUTH_TOKEN_URL` and `OAUTH_USERINFO_URL` are all set,
the sign-in screens show "Continue with <provider>" and the server runs the authorization-code flow.
A provider identity maps to a username (email or preferred_username), created on first sign-in.

## Data And Progress

Each user has separate stores per subject. Progress is never mixed between users or subjects.

- `${DATA_DIR}/users/<userId>/maths.json`
- `${DATA_DIR}/users/<userId>/english.json`

Accounts live in `${DATA_DIR}/users.json`, sessions in `${DATA_DIR}/sessions.json`.
`DATA_DIR` is a single environment variable; Docker sets it to `/app/data`, which is persisted in
the `gcse-data` volume and survives container recreation and redeploys.

On startup, legacy single-file progress from `${DATA_DIR}/maths/db.json` and
`${DATA_DIR}/english/db.json` is migrated into the `admin` account when no user store exists yet,
so upgrading to logins never loses existing progress.

Each store tracks XP, streak, paper history, topic accuracy and tutor chat for its own subject.

Active paper and practice sessions are held in memory. Restarting the server expires an active
session, so a user may need to start a paper again after a restart.

## Subject Rules

### Maths

- Course: AQA GCSE Mathematics 8300, Foundation tier, grades 1-5.
- Preserve all three papers and calculator rules.
- Automatic marking must use the existing generated question metadata.
- Higher-tier-only techniques should not be presented as Foundation requirements.

### English

- Course: AQA GCSE English Language 8700, grades 1-9; it has no tiers.
- Preserve both papers, source displays, marks and timing.
- List and true/false questions are marked deterministically.
- Extended responses use AQA-style rubric prompts through OpenRouter when configured.
- Without an API key, learners must still receive rubrics and model answers for self-marking.
- Paper 1 Q5 description tasks show a free image from Wikimedia Commons (`q5Image` on each text in `server/src/subjects/english/texts/p1.js`; URLs are resolved via `Special:FilePath`). Images must stay appropriate for 14+ students, and the client hides them gracefully if a URL ever fails.

## AI Configuration

`OPENROUTER_API_KEY` enables both tutors and English extended-answer marking. `OPENROUTER_MODEL` defaults to `google/gemma-4-26b-a4b` (Google Gemma 4 26B A4B, free tier). Never commit keys or log them. Both subjects must retain useful offline behavior when no key is configured.

## Development

```bash
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
- Keep `BrowserRouter` basenames and Vite bases aligned with `/maths` and `/english`.
- Preserve direct refreshes on nested routes such as `/maths/learn/fractions` and `/english/texts/p1-great-expectations`.
- Test desktop and 390px mobile layouts for the selector and both dashboards.
- Do not claim official AQA endorsement. AQA course structures can be represented accurately, but the product is an independent revision tool.
- Prefer small, testable changes over cross-subject abstractions that obscure exam-specific behavior.
- Subject data is always scoped to the signed-in user. Never write progress, chat or history to a shared file.
- New sign-in-facing API routes belong under `/api/auth`; new subject routes stay namespaced under `/api/maths` and `/api/english` and must keep working with the session gate.
- The `admin` account (admin / admin) must always exist after a fresh start, and users/sessions must persist under `DATA_DIR`.
- Themes (light and dark) are driven by the shared design tokens in `clients/shared/study-desk.css` and each subject's `theme.css`. The `data-theme` attribute is set on `<html>` and persisted under the `gcse-theme` localStorage key so the choice survives across the selector and both subjects. New UI should consume these tokens rather than hardcoding colors.
- Every colour, border and surface should stay legible in both themes. Dark mode is not a shadow of the light design; it uses its own warm ink, muted text and brighter semantic colours on the same grid and typography.
