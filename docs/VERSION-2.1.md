# Version 2.1 — Learn-first refactor (branch `version-2.1`, based on `develop`)

## Why 2.1 exists

The develop baseline was a capable revision engine with a fragmented
front door: the home selector listed two of three live subjects, both
dashboards opened on a wall of statistics, and the two subject clients
duplicated their entire app shell. Learners had to dig before doing
useful work, and the answer to "What should I study next?" was buried
below the fold — or on another page entirely.

2.1 keeps everything that works (Express + Supabase persistence,
mistake-to-mastery loop, deterministic maths marking, English rubrics,
all routes, all API contracts) and redesigns presentation, hierarchy
and discoverability around one question: **"What should I study next?"**

## ui-ux-pro-max verification (recorded decision)

Running the skill's `--design-system` search for an education revision
product returned **Claymorphism + Baloo 2 / Comic Neue** (playful,
toy-like, kids'-app palette). Per the skill's own query contract
("verify the returned domain/category … and whether its guidance fits
the user's product"), this was **rejected**:

- PRODUCT.md serves Year 10/11 learners preparing for AQA GCSEs and
  explicitly forbids a children's-learning look.
- DESIGN.md's "Ruled Notebook" (warm paper, ink rules, Georgia serif +
  system sans + mono labels, one subject accent per surface) is the
  ratified identity with full light/dark parity.
- Claymorphism's thick borders, double shadows and bubbly rounding
  directly contradict the "borders are elevation, no web shadows,
  square working surfaces" rules.

2.1 therefore **evolves the Ruled Notebook** instead of reskinning.
Targeted skill guidance that *was* adopted: 44pt touch targets,
visible focus rings, reduced-motion handling, non-colour state cues.

## What changed

1. **Home selector lists all three subjects.** `/` omitted Higher Maths
   (live at `/maths-higher/`, present in `/subjects`). Added the Higher
   card with its green manuscript identity, live health check and bank
   count; grid is now 3-up desktop → 1-up mobile. Existing
   `.maths-card` / `.english-card` / `#page-title` selectors untouched.
2. **Shared `AppShell`** (`website/clients/shared/AppShell.jsx`).
   Maths + English shells were ~230 duplicated lines each. One
   component now owns the DOM contract (class names frozen for
   Playwright and the responsive stylesheet), adding: skip link,
   `aria-label`/`aria-current` navigation, `streak-dot` status halo
   replacing the 🔥 emoji, and a Quick-jump slot. No route or auth
   behaviour changed.
3. **`computeNextStep` engine** (`shared/next-step.js`, pure + testable).
   Priority: due mistakes → today's mission → weakest practised topic
   (<70%) → diagnostic (cold start) → untouched topic → timed paper.
   Everything links to a real route with real material.
4. **`NextStepCard`** (`shared/NextStep.jsx`) on both dashboards,
   above the planner: the recommendation, streak/readiness/exam
   countdown facts, weakest-topics list with Secure/Developing/Focus
   text labels (never colour-alone), and a due-mistakes shortcut.
5. **Command palette** (`shared/CommandPalette.jsx`, Ctrl/⌘+K):
   routes + up to 60 cached lesson entries per subject, keyboard
   navigable, result counts announced, hidden on ≤900px where bottom
   tabs are the faster pattern.
6. **A11y + touch pass** (append-only block in `study-desk.css`):
   `--focus-ring`, `--touch-min: 44px`, skip-link, palette + nextstep
   styles, responsive collapse, reduced-motion quieting.

## What was deliberately NOT changed

- Backend, schema, RLS, API routes, auth flows, marking, tutors.
- All Playwright-asserted selectors and the mobile shell DOM.
- DESIGN.md tokens (consumed, not forked); web maths/english theme
  files untouched.
- Mastery rows keep their logic; percentages already accompany colour.

## Verification

- `npm test -w server` (storage, banks, personal model).
- `npm run build` (both Vite clients) + `npm run build:vercel`.
- `npm run test:ui` against local `:3000` (route, responsive,
  browser-error checks).
- Manual: `/`, `/subjects`, `/maths/`, `/maths-higher/`,
  `/english/` at 1440/768/390px, light + dark, keyboard-only,
  reduced-motion.
