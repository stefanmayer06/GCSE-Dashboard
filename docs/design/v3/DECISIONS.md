# V3 decision log

Source branch: `version-2.1` (the 2.1 line; no branch literally named `2.1`
exists). V3 created as `v3` from `1402467`. `version-2.1` untouched.

## D1 — Reject Claymorphism (ui-ux-pro-max), evolve an editorial system
- Problem: skill `--design-system` returned Claymorphism + Baloo 2 / Comic Neue
  (twice) for education queries.
- Options: (a) accept, (b) reject and synthesise from verified domain hits.
- Decision: (b). PRODUCT.md forbids children's-software look; DESIGN.md's
  notebook is ratified but mission forbids a repaint. Clay's toy-like bubbly
  language contradicts Year 10/11 premium-encouraging brief.
- Rationale: query contract requires verifying fit; both hits fail it.
- Consequence: new Trailhead system (Fraunces + Inter + Plex Mono, pebble
  geometry, calm premium). Documented in README §4.

## D2 — Keep hue families, change everything else
- Problem: returning users rely on violet/green/ochre wayfinding.
- Options: (a) wholly new hues, (b) keep families, recalibrate values/usage.
- Decision: (b) — Foundation indigo `#4338CA`, Higher pine `#0F766E`,
  English ember `#B45309` (dark variants brightened). New tints, washes,
  surfaces, type, shape, motion.
- Consequence: continuity without a repaint; contrast re-verified both themes.

## D3 — Keep DOM contract, revolutionise visuals
- Problem: Playwright asserts `.sidebar`, `.subject-switch`, `.sign-out`,
  `.nav-item` (6, exact aria-labels), `#page-title`, `.maths-card`,
  `.english-card`, `.exam-bar`, `.q-card`, `.notes`, `.chat-box`, etc.
- Decision: keep every asserted selector and route; restyle via `v3.css`
  loaded after `study-desk.css`; restructure composition inside the contract.
- Consequence: no regressions; tests keep passing; legacy neon `:root` stays
  as structural base but loses every visual tie.

## D4 — Mastery scale over binary done
- Problem: completed/incomplete hides learning state; colour-alone meters.
- Decision: New (<any evidence) / Learning (<40) / Developing (40–69) /
  Secure (70–89) / Mastered (≥90, n≥5; small-n capped at Developing) +
  Needs-revision flag. Every meter shows `% + label`.
- Consequence: `strengthLabel` extended (back-compat tones kept), path UI
  ranks weakest-first, retry evidence explicit.

## D5 — Kind gamification
- Problem: streak/XP punishment (research) vs motivation need.
- Decision: keep XP/levels/streaks/readiness; copy never shames ("paused",
  "rest is part of the plan"); freezes visible; weekly goal (3 missions);
  celebrate mastery/personal-best; no leagues/leaderboards.
- Consequence: `ExpertisePath` + summary copy rewritten; streak dot kept.

## D6 — Today, not stats wall
- Problem: dashboards opened on meaningless metrics.
- Decision: subject `/` becomes Today: hero next-step → mission + 7-day trail
  → mastery path → timed papers → evidence. Max 4 stats, each with "so what".
- Consequence: `DashboardHome` recomposed; `NextStepCard` hero with ring.

## D7 — One accent per surface, state as wash+border+label
- Kept from notebook (it works for colour-blindness) and re-expressed in V3
  tokens. Never colour-alone.

## D8 — Fonts via Google with system fallback, display=swap
- Fraunces/Inter/Plex Mono loaded non-blocking; Georgia/system fallbacks keep
  first paint and offline usable. No font npm dep (keeps bundle fast).

## D9 — No new runtime deps for V3 visuals
- All V3 motion/illustration is CSS + inline SVG. No animation lib, no icon
  lib, no chart lib (meters are CSS). Performance budget protected.

## D10 — Backend untouched
- No schema/API/auth/marking changes. V3 is presentation + composition +
  mastery labelling. Personal/model contracts preserved.

## D11 — Deprecations (documented, not deleted silently)
- Squared-paper background pattern → retired (kept in `theme.css` var only
  for back-compat; V3 sets flat paper).
- 0-radius doctrine → retired; pebble radii are the system.
- Neon legacy `:root` (dark navy + glows) → already retired; V3 explicitly
  overrides every value it set.
- "Completed/incomplete" language → replaced by mastery scale in UI copy
  (data model unchanged).
