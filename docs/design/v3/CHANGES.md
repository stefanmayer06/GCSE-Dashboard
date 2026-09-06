# V3 changes (branch `v3` from `version-2.1`)

## Architecture (frontend only — backend untouched)

- No API, schema, RLS, migration, auth, marking, tutor, or analytics change.
  All `/api/*` contracts, storage drivers, and event taxonomy preserved.
- New visual layer: `clients/shared/v3.css` (Trailhead tokens, shell,
  components, pages, motion, responsive, a11y) loaded **after**
  `study-desk.css` + subject `theme.css` in both clients, so every visual tie
  resolves to V3 while the legacy structural base keeps old routes working.
- New launchpad layer: `selector/v3-launchpad.css` loaded after
  `selector.css`; copied to `public/` automatically by `build-vercel.mjs`.
- No new runtime dependencies. Motion + illustration are CSS + inline SVG
  (performance budget protected; save-data prefetch behaviour unchanged).

## New / improved

- **Today hero** (`NextStepCard`): readiness ring, kind streak states
  ("Fresh start", "Paused"), far-future exam dates render as months
  ("Exams May 2099") instead of absurd day counts, weakest-3 with mastery
  stages, secondary retry CTA.
- **Mastery scale**: New → Learning → Developing → Secure → Mastered +
  Needs-revision flag (`masteryStage()` in `next-step.js`; `strengthLabel`
  kept back-compat). Dashboard path renders labelled trail nodes
  weakest-first; legacy rows retained hidden for selector back-compat.
- **Today composition** (`DashboardHome`): trail numbers → up next → mission
  + 7-day trail → mastery path → timed papers → evidence. Every stat carries
  a "so what" caption; readiness always "evidence, not a predicted grade".
- **Shell** (`AppShell`): Journey / Practise / Review groups, glyph icons
  mapped from legacy codes (NAV data untouched), kind streak copy with
  freezes, mobile ⌘K reachability. Same DOM contract + aria-labels + order.
- **Launchpad** (`selector/index.html`): promise grid (the 4 questions),
  trail card, trust note (no endorsement, no predicted grades, free beta),
  rounded continue banner. Same selectors (`#page-title`, `.maths-card`,
  `.english-card`, statuses, links).
- **Kind gamification copy**: "Paused" not "Missed" for past plan days,
  "rest is part of the plan", freezes surfaced, weekly framing over grind.
- **English tier class**: `english-tier` now passed to the shell so the ember
  accent applies consistently (was `""`).
- **Exam-date refresh fix**: `useResource` now returns `refresh`
  (pre-existing working-tree fix, kept); the brittle exam-preferences UI test
  now picks a date different from the saved one so it is state-independent
  across reruns (filling an identical controlled value fires no change event
  by design).

## Removed / merged / retired

- Squared-paper background → flat warm paper (var kept for back-compat).
- 0-radius doctrine → pebble radii (18/14/pill/seal).
- Neon legacy `:root` values → overridden by V3 tokens (file kept as base).
- "Completed/incomplete" UI language → mastery stages (data model unchanged).
- "Missed" shaming copy → "Paused".
- Claymorphism direction from ui-ux-pro-max → formally rejected (see
  DECISIONS.md D1); Georgia/system type → Fraunces/Inter/Plex Mono.

## Accessibility

- 3px focus rings with offset everywhere; skip links; landmarks intact.
- 44px targets incl. mobile top-bar controls (Playwright-enforced).
- All meters/flags carry text labels (never colour-alone); tabular numerals.
- `prefers-reduced-motion` collapses animation; `prefers-contrast: more`
  thickens borders; 68ch measure; live regions for marking/progress/palette.
- Light/dark re-inked palettes, both contrast-checked pairs.

## Responsive

- Mobile (≤760): sticky top bar (identity + account controls) + fixed bottom
  tabs with safe-area padding; linear Today; 16px gutters; 50px CTAs.
- Tablet (761–1100): 76px collapsed icon rail.
- Desktop: 264px rail + 1160px content; contextual grids.
- Playwright responsive + overflow + touch-target + collapsed-sidebar tests
  all pass; screenshots reviewed at 1440/390 light + 1440 dark.

## Verification

- `npm test -w server`: 66 pass.
- `npm run build` + `build:vercel`: both clients pass.
- `npx playwright test`: **68/68 pass** (incl. updated theme + de-flaked
  preferences tests).
- Screenshot review: launchpad, maths/english Today, Learn, Practice at
  1440/390 + dark; fixed: mobile backdrop-filter containment bug, rail query
  leaking into mobile, section badges, trail overlap, masthead pills,
  far-future countdowns.

## Future opportunities (not built)

- Interactive manipulatives per topic (Brilliant-style) starting with
  fractions/angles/graphs; needs content + marking design per objective.
- Socratic tutor hints (method-before-answer) already partially present;
  confidence-aware adaptation needs an event model first (see ANALYTICS.md).
- Search across topics/lessons/questions beyond ⌘K palette (needs index).
- Parent/teacher evidence sharing beyond printable summary (needs consent +
  privacy design; explicitly out of scope).
- AQA Combined Science only after activation/retention gates (see
  MARKET_COMPARISON.md).
