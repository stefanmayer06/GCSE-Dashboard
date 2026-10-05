# GCSE Study Desk: Agent Guide

## Product Goal

GCSE Study Desk helps teenagers prepare confidently for their AQA GCSE exams. It combines MathsMate for AQA GCSE Mathematics (8300 Foundation and 8300H Higher tiers) and EnglishMate for AQA GCSE English Language (8700) in one focused revision product.

The app should help a learner answer three questions quickly:

1. What should I revise next?
2. Can I practise it in the same format as the real exam?
3. Can I understand what went wrong and improve the next attempt?

Teaching quality matters more than novelty. Explanations should be clear, encouraging and age-appropriate. Practice should reflect AQA paper structure, marks and timing. The AI tutors should guide students through a method before revealing an answer.

## Web Application Shape

The web application is self-contained in the repository's `website/` directory.
Treat that directory as the web application root and run its npm, Docker,
Supabase, and test commands from it. The separate Expo application lives in
`../app/` and has its own `AGENTS.md`. The web application contains one Express
API and two intentionally isolated React clients. Local and Docker runs use the
combined process; Vercel runs the same API through a serverless entrypoint and
serves the built clients as static output:

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
- `server/src/personal-model.js`: normalization/validation for account personal data (preferences, study plans, mistake notebook, paper attempts, product events).
- `server/src/personal.js`: per-subject `/personal` routes backing preferences, the saved 7-day plan, the mistake notebook and durable paper attempts.
- `server/src/analytics.js`: authenticated `POST /api/events` append route and `GET /api/events/summary` activation/funnel summary, backed by the storage driver (`events.json` locally, `product_events` on Supabase). See `ANALYTICS.md` for the event taxonomy, activation definition and retention policy.
- `server/src/feedback.js`: public, rate-limited `POST /api/feedback` route storing beta-tester feedback through the storage driver (`feedback.json` locally, `beta_feedback` table on Supabase).
- `server/src/feedback-report.js`: aggregate-only beta feedback report (design ratings, payer and payment-model counts, Van Westendorp price summary) behind `npm run feedback:report`. See `BETA_RECRUITMENT.md`.
- `server/src/support.js`: public, rate-limited `POST /api/support` route storing help and privacy requests privately (`support-requests.json` locally, `support_requests` on Supabase).
- `clients/shared/study-personal.js`: web personal-data repository, hydration and one-time legacy localStorage import.
- `server/src/supabase/`: Supabase server client configuration and secret-key handling.
- `supabase/`: SQL migrations (tables, RLS policies, RPCs), private legacy staging tables and database tests.
- `server/src/subjects/maths/`: generated question bank, exact marking, grades, progress and Maths tutor.
- `server/src/subjects/english/`: source texts, question assembly, rubric marking, progress and English tutor. English practice scores do not issue a predicted grade.
- `clients/maths/src/pages/`: Maths dashboard, papers, results, topic lessons and tutor.
- `clients/english/src/pages/`: English dashboard, papers, results, lessons, text library and tutor.
- `clients/shared/login.jsx`: shared sign-in gate used by both clients.
- `clients/shared/circuit/`: the Circuit design system. Tokens and CSS
  (`tokens.css`, `circuit.css` and its parts), the palette and shape grammar
  (`palette.js`), and every custom graphic (`Emblem`, `IsoTile`, `Scenes`,
  `Icon`, `Pip`, `bits`).
- `clients/shared/explainer/`: interactive explainer engine, board
  primitives, player, narration, the notes-to-video fallback (`autoscript.js`)
  and the authored script library (`library/maths`, `library/english`).
- `clients/shared/AppShell.jsx`, `TodayHome.jsx`, `CourseMap.jsx`,
  `LessonKit.jsx`, `PracticeKit.jsx`, `CreaturesPage.jsx`, `MePage.jsx`,
  `PipChat.jsx`, `Sheet.jsx`, `SubjectSheet.jsx`, `rewards.jsx`: the shared
  five-tab app (Today, Learn, Practice, Creatures, Me), the lesson stepper,
  one-at-a-time practice and retries, Ask Pip and the lesson-complete
  celebration used by both clients. `pwa.js` registers the service worker
  (`selector/sw.js`) and offers the install prompt.
- `clients/shared/creatures.jsx`, `Milestones.jsx` and `critters.js`: the
  study creatures, which are the only progression the learner sees (no XP,
  levels or badge names in the UI). Each creature's tier is recomputed from one
  evidence track (progress or the mistake notebook); art is
  `circuit/Critter.jsx`.
- `clients/shared/GraphicsLab.jsx`: the `/<subject>/lab` catalogue of every
  graphic and explainer (signed in, not linked in the nav).
- `design/`: the Circuit design doc (`design-doc.html`) and handoff guides:
  `DESIGN.md`, `GRAPHICS.md`, `VIDEO_AUTHORING.md` and `NEW_SUBJECT.md`.
  `design/social/` holds the Instagram and Reddit adverts and their alt text.
- `scripts/validate-explainers.mjs`, `scripts/export-art.mjs`,
  `scripts/capture-design-shots.mjs`, `scripts/build-design-doc.mjs`,
  `scripts/build-social.mjs`: the `explainers:check`, `art:export`,
  `design:shots`, `design:doc` and `social:build` scripts. The adverts
  themselves are `scripts/social/posts.jsx`.
- `selector/`: dependency-free root subject selector. `art.js` and
  `circuit-public.css` are generated by `npm run art:export`.
- `ui-tests/`: Playwright route, responsive and browser-error checks.

## Accounts And Sign-In

Every request to `/api/maths/*`, `/api/maths-higher/*` and `/api/english/*` requires a valid session except the three public health endpoints. The selector uses those health endpoints to enrich content counts; a failed health request does not mean a course is unavailable.

- `POST /api/auth/login` accepts a username and password.
- `POST /api/auth/signup` creates a new local account (3-32 character username, 8+ character password) and signs it in.
- `GET /api/auth/me` returns the signed-in user.
- `POST /api/auth/logout` ends the session.
- `GET /api/auth/config` reports whether OAuth is configured.

The local `admin` account (username `admin`, password `admin`) is seeded automatically on first boot when `users.json` does not already contain it. In production, `ADMIN_PASSWORD` must be set before the missing admin account can be seeded. It is always recreated if missing. Passwords are stored as `scrypt` hashes, never in plain text. Never use the local default password in production.

OAuth2 is optional and configured entirely by environment variables. When `OAUTH_CLIENT_ID`,
`OAUTH_CLIENT_SECRET`, `OAUTH_AUTHORIZE_URL`, `OAUTH_TOKEN_URL` and `OAUTH_USERINFO_URL` are all set,
the sign-in screens show "Continue with <provider>" and the server runs the authorization-code flow.
A provider identity maps to a username (email or preferred_username), created on first sign-in.

On the Supabase driver (required on Vercel), the sign-in screen uses email/password and bearer JWTs. Supabase Auth
accounts are separate from the local JSON-driver accounts; there is no account migration between them.

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

## Personal Data (Preferences, Plan, Notebook)

Every subject router mounts `/personal` routes served from `server/src/personal.js`:
`GET /personal`, `PUT /personal/preferences`, `PUT /personal/plan` and
`PUT /personal/mistakes`. The web clients consume them through
`clients/shared/study-personal.js`; the Expo app uses its own `src/personal.ts`
repository. On first load, legacy localStorage/AsyncStorage data is uploaded once
(only into empty domains), a completion flag is recorded, and the legacy keys are
removed. Direct authenticated table access is protected by RLS
(`user_id = auth.uid()`), while API mutations use the server-only service role.
Client drafts and short-lived result caches may stay local, but they are never
treated as authoritative.

On startup, legacy single-file progress from `${DATA_DIR}/maths/db.json` and
`${DATA_DIR}/english/db.json` is migrated into the `admin` account when no user store exists yet,
so upgrading to logins never loses existing progress.

Each legacy store tracks XP, streak, paper history, topic accuracy and tutor chat
for its own subject. The production Supabase driver stores compact progress (XP,
streak, counters, topic accuracy and completed lessons), active study sessions,
preferences, plans and notebook mistakes. Finalized paper attempts are now
durable too: every marked paper is written to `paper_attempts` (question-level
responses included, most recent 50 per user and subject, 1 year review window)
and can be listed through `GET /personal/attempts`. Tutor chat remains a
non-durable domain; clients may retain it only as a disposable cache.

## Mistake-To-Mastery Loop And Product Events

The product promise is the evidence trail
`exam date -> diagnostic -> daily mission -> authentic timed attempt -> transparent marking -> mistake reason -> scheduled retry -> later mastery`.
Features should strengthen that trail, not replace it.

- Every mistake row can carry a learner-chosen `errorType` (`knowledge`, `method`,
  `misread`, `arithmetic`, `timing`, `incomplete`), the `correctAnswer`, a
  `workedSolution`, warm-up count and `lastReviewedAt` retry evidence. Retries are
  graded `again`/`hard`/`good`/`easy` (FSRS-lite: the grade moves the next review
  via the row `ease` factor), each row can hold a learner-written `correction`,
  and mastered rows collect `resurrectedCount` memory-check evidence. The
  notebook UI shows the original answer, the marked issue, the corrected method
  and the next review together.
- Re-capturing a mistake (e.g. reopening an old results page) refreshes the
  evidence but never resets review progress, classification or mastery.
- Durable attempts, the event taxonomy, the activation definition and the
  retention windows are documented in `ANALYTICS.md`. Keep event payloads
  scalar-only and free of learner content.
- Topic pages publish editorial metadata (spec section/assessment objectives,
  reviewer, last review month, issue-reporting route). Never invent
  statement-level spec references; the coverage audits
  (`FOUNDATION_AUDIT.md`, `HIGHER_AUDIT.md`, `ENGLISH_AUDIT.md`) document what
  is verified.

Supabase Auth accounts are created only through sign-up (`POST /api/auth/signup` or the Supabase client). The one-time legacy account move was retired; do not reintroduce a claim route or the `migration_private` staging schema.

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
- Topic `examWeight` fields are internal relative planning priorities. Do not display them as per-topic exam percentages or mark allocations.

### English

- Course: AQA GCSE English Language 8700, grades 1-9; it has no tiers.
- Preserve both papers, source displays, marks and timing.
- Current Paper 1 multiple-choice and Paper 2 choose-four questions are marked deterministically; legacy list and true/false sessions keep their marking routes until expiry.
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
npm run explainers:check  # validates every explainer script
npm run art:export        # re-renders graphics for the public selector pages
npm run design:shots      # recaptures design/shots (built app running on :3000)
npm run design:doc        # rebuilds design/design-doc.html
npm run social:build      # renders the adverts in design/social
docker compose up --build
```

## Change Invariants

- Keep API routes namespaced by subject.
- Keep user and subject scopes explicit in API paths, database keys and any disposable browser cache keys.
- Keep `BrowserRouter` basenames and Vite bases aligned with `/maths`, `/maths-higher` and `/english`.
- Preserve direct refreshes on nested routes such as `/maths/learn/fractions` and `/english/texts/p1-great-expectations`.
- Test desktop and 390px mobile layouts for the selector and all three subject routes.
- Do not claim official AQA endorsement. AQA course structures can be represented accurately, but the product is an independent revision tool.
- Prefer small, testable changes over cross-subject abstractions that obscure exam-specific behavior.
- Subject data is always scoped to the signed-in user. Never write progress, drafts, chat or history to a shared file.
- New sign-in-facing API routes belong under `/api/auth`; new subject routes stay namespaced under `/api/maths`, `/api/maths-higher` and `/api/english` and must keep working with the session gate.
- `/api/feedback` and `/api/support` are the only public write endpoints besides auth. Keep them anonymous and rate limited; never expose stored messages through any client-facing route. Feedback and support may accept an optional reply email, and privacy support requests require one.
- The local/Docker default admin account is `admin` / `admin`; production must use `ADMIN_PASSWORD` and must never depend on that default.
- Authoritative user data, progress and study sessions must use the configured storage driver: JSON beneath `DATA_DIR` locally and Supabase tables on Vercel. Browser storage is limited to theme and other display preferences (such as explainer playback settings), auth-library session persistence, active drafts, disposable result/history caches and one-time migration flags.
- Supabase is the application database. Keep service-role keys server-side, keep RLS enabled on user-owned tables (`user_id = auth.uid()`), and version every schema change as a migration under `supabase/migrations`. Never merge development users, progress, sessions, chat or submissions into production.
- Themes (light and dark) are driven by the Circuit tokens in `clients/shared/circuit/tokens.css` (`--c-*`, `--hue-*`, `--subject`). Legacy `study-desk.css` and `theme.css` variables are remapped onto them. The `data-theme` attribute is set on `<html>` and persisted under the `gcse-theme` localStorage key so the choice survives across the selector and both subjects. New UI should consume these tokens rather than hardcoding colors; see `design/DESIGN.md`.
- Every colour, border and surface should stay legible in both themes. Dark mode is not a shadow of the light design; it uses its own night surfaces, muted text and brighter hues on the same grid and typography.
- Graphics are custom SVG components in `clients/shared/circuit/`. Do not add icon fonts, emoji or stock illustrations, and do not add default system or "AI" typefaces; the self-hosted stack is Unbounded, Atkinson Hyperlegible Next and Mono, Literata and Kalam. Follow `design/GRAPHICS.md`.
- Stars, emblem layers, mastery and creature tiers come only from server-marked evidence (`starsFor`, `layersForStage`, the server's `masteryStage` and `critterCollection`). Never award them for viewing a page, and never lock a topic behind another.
- Explainer scripts are pure data. Run `npm run explainers:check` after adding or changing one, and follow `design/VIDEO_AUTHORING.md`. Explainer voice, caption and speed settings live under the `gcse-explainer-prefs` localStorage key as a UI preference only.
- After changing a graphic used on the public pages, run `npm run art:export` and commit `selector/art.js` and `selector/circuit-public.css`. Never edit those two files by hand.
- The adverts in `design/social/` are generated. Change `scripts/social/posts.jsx`, run `npm run social:build` and commit the PNGs with `alt-text.md`; rebuild after changing a graphic they use or a count they show. Their copy follows the same claim rules as the product.
