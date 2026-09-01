# GCSE Study Desk Mobile: Agent Guide

## Application Shape

The mobile application is self-contained in `app/`. Treat this directory as the
Expo application root and run its npm, Expo and EAS commands here. It is an Expo
Router application for iOS and Android using React Native, TypeScript, Supabase
Auth and the subject APIs hosted by the sibling `website/` Express application.

The mobile client is not an independent backend. Supabase Auth establishes the
user session, while learning content, progress, active sessions and personal
data travel through the authenticated `/api/<subject>/*` routes. Never expose a
Supabase secret/service-role key through an `EXPO_PUBLIC_*` variable.

## Runtime Architecture

- `app/_layout.tsx`: root providers, session-aware redirects, stack navigation and the top-level error boundary.
- `app/(tabs)/`: Today, Learn, Practice and Tutor tab routes.
- `app/auth/`: sign-in, signup, email confirmation, password recovery and legacy-account claim routes.
- `app/practice/[id].tsx`, `app/lesson/[id].tsx`, `app/text/[id].tsx`: active learning and marking flows.
- `app/results/[id].tsx`: recent-result presentation and retry actions.
- `app/notebook.tsx`, `app/weekly-summary.tsx`, `app/settings.tsx`: account-level study tools and settings.
- `src/providers.tsx`: Supabase session state, subject/appearance preferences, network state and TanStack Query lifecycle.
- `src/supabase.ts`: public Supabase client with SecureStore-backed session persistence and token refresh.
- `src/api.ts`: bearer-authenticated API client, one retry after token refresh and account API helpers.
- `src/personal.ts`: server-authoritative personal-data hydration and one-time AsyncStorage migration.
- `src/planning.ts`: pure planning, mission rollover, completion and readiness helpers.
- `src/notebook.ts`: canonical mistake rows, spaced-review dates, parsing and merge helpers.
- `src/theme.ts` and `src/components.tsx`: theme tokens and shared native UI primitives.

Expo Router route files should coordinate data and presentation. Put reusable
normalization, marking-state and planning logic in `src/` so it can be tested
without rendering a route.

## Authentication

The app signs users in directly with Supabase Auth. The Supabase client uses
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; these must
identify the same project used by the server. Auth sessions are persisted in
chunked Expo SecureStore storage, auto-refreshed while the app is active and
validated during bootstrap before protected routes render.

Every API request obtains the current access token and sends it as a bearer JWT.
On a `401`, `ApiClient` attempts one Supabase token refresh, retries once and
clears a rejected local session. Clear the TanStack Query cache whenever the
authenticated user changes or signs out so one account cannot see another
account's cached data.

## Data Flow And Ownership

Supabase is the single production source of truth. The expected flow is:

1. A route calls `ApiClient` for the selected subject.
2. The Express API validates the Supabase JWT and scopes storage by user and subject.
3. The server reads or writes Supabase through its server-only storage driver.
4. The confirmed response updates route/provider state and any disposable cache.

Authoritative domains include subject progress, active study sessions, planning
preferences, saved seven-day plans, mission results and mistake notebook rows.
The personal-data endpoints are `GET /personal`, `PUT /personal/preferences`,
`PUT /personal/plan` and `PUT /personal/mistakes` under each subject namespace.

`src/personal.ts` performs a one-time, idempotent migration from old
AsyncStorage planning/notebook keys. It uploads only domains that are empty on
the server, writes a per-user/per-subject completion flag and removes the
migrated keys. Preserve this behavior until all shipped legacy clients have had
a reasonable migration window.

## Local Storage Boundaries

Local device storage is never authoritative for account study data.

- SecureStore: Supabase auth session only.
- AsyncStorage `subject` and `appearance`: device UI preferences.
- AsyncStorage practice, lesson, text, tutor and recent-result entries: active drafts or disposable caches only.
- AsyncStorage `personal-imported:v1:*` and old planning/notebook keys: migration bookkeeping and cleanup only.
- TanStack Query: in-memory learning-content cache; clear on identity changes.

Do not add new authoritative AsyncStorage stores for progress, preferences,
plans, missions or notebook rows. Add the server/Supabase domain first, expose
it through `ApiClient`, then hydrate the UI from the confirmed server response.

## Subjects And Sessions

`Subject` is one of `maths`, `maths-higher` or `english`. Keep API paths, query
keys, drafts, progress and personal data scoped to the selected subject. Maths
Foundation and Higher share UI where practical but must never share progress or
paper state. English retains its separate question/rubric behavior.

Practice, paper and adhoc sessions are created by the server and identified by
server session IDs. Local route state may preserve an in-flight draft, but the
server session lifecycle controls submission, expiry, resumption and rewards.
Never award XP or mark a mission complete solely from local calculations; use
the accepted submission response, then persist the resulting plan/notebook
state through the personal API.

## Environment And Releases

- `EXPO_PUBLIC_API_URL`: deployed web/API origin without `/api`.
- `EXPO_PUBLIC_WEBSITE_URL`: public privacy, support and deletion-page origin.
- `EXPO_PUBLIC_SUPABASE_URL`: shared Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: public client key only.

The app scheme is `gcsestudydesk://`; password recovery resolves to
`gcsestudydesk://auth/recover`. App identifiers are
`com.gcsestudydesk.app`. EAS profiles are defined in `eas.json`; production
builds require real EAS environment values, signing setup and physical-device
QA. Do not commit local `.env` files, service-role keys or placeholder Expo
owner/project IDs.

## Development And Verification

Run from `app/`:

```bash
npm install
npm start
npm run ios
npm run android
npm run lint
npm run typecheck
npm test
npm run doctor
```

For behavior changes, test pure helpers in `src/*.test.ts`, then exercise the
affected route on both iOS and Android when feasible. Validate offline/loading,
empty, error and expired-session states as well as the success path.

## Change Invariants

- Keep Supabase service-role credentials on the server; the app receives only public configuration.
- Keep all authoritative writes authenticated, user-scoped and subject-scoped through the API.
- Preserve SecureStore session persistence and query-cache clearing across identity changes.
- Keep AsyncStorage limited to device preferences, drafts, disposable caches and legacy migration state.
- Preserve route recovery for `gcsestudydesk://auth/recover` and auth redirects in `app/_layout.tsx`.
- Preserve today-only mission behavior: a completed day remains completed and a future task is not promoted into today.
- Keep future plan days locked and retain marks, score and XP evidence on completed days.
- Keep Foundation, Higher and English progress isolated even when UI components are shared.
- Retain useful non-AI behavior when `OPENROUTER_API_KEY` is unavailable on the server.
- Do not claim official AQA endorsement.
