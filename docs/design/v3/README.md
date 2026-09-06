# V3 — Trailhead: the revision trail

Branch: `v3` (from `version-2.1`, the 2.1 line). Source commit `1402467`.

## 1. Vision

V3 answers one question in under five seconds: **"What should I do next?"**

The product is a **revision trail**, not a dashboard of numbers. Every session is a step
along a visible path: `exam date → diagnostic → today's step → timed attempt →
transparent marking → mistake reason → scheduled retry → mastery`.

The feeling to optimise for: *"I actually want to continue"* — curiosity, momentum,
competence. Not homework compliance.

## 2. Product principles (from PRODUCT.md, kept)

1. Close the loop: every meaningful mistake leads to explanation, classification,
   scheduled retry, and mastery evidence.
2. Make the next useful action obvious.
3. Earn trust through transparency (how marking works, AI guidance vs grades, no
   invented claims, UK English, "Maths", AQA-style not AQA-endorsed).
4. Respect subject reality (board/tier/paper/topic boundaries, separate progress).
5. Support independent progress (no parent/teacher gate, free beta framing kept).

## 3. Who it is for

Primary: independent Year 10/11 learners (13+) preparing for AQA GCSE Maths
Foundation (8300), Maths Higher (8300H), English Language (8700). They revise in
short sessions, often on phones, often uncertain what to do next.

Secondary (evaluation only): parents/teachers. V3 does NOT add class management,
billing, or parent dashboards — it adds exportable evidence (print/share summary)
so a learner can show work without a second account.

## 4. ui-ux-pro-max verdict (recorded)

- Query 1: `"GCSE revision learning teen education motivation" --design-system`
  → Claymorphism + Baloo 2 / Comic Neue. **Rejected**: toy-like, kids'-app,
  thick borders + double shadows contradict WCAG-conscious calm study and
  PRODUCT.md's "must not look like children's software".
- Query 2: `"exam study productivity focused teen dashboard" --design-system`
  → Claymorphism + Nunito / DM Sans. **Rejected** for the same reason.
- Adopted instead (verified domain hits):
  - `typography "editorial serif readable study"` → News Editorial
    (Newsreader + Roboto) and triple-stack mono-label pattern. V3 uses
    **Fraunces (display serif) + Inter (UI/body) + IBM Plex Mono (labels)** —
    same editorial logic, fresher voice than Georgia/system stack.
  - `color "focused study calm premium"` → Study purple + correct green,
    Premium black + gold, Study Together blue. V3 keeps one-subject-hue
    wayfinding but recalibrates for contrast on both themes.
  - `ux "dashboard progress mastery learning"` → step indicators / progress
    feedback. V3 makes every meter a labelled journey step, never colour-alone.

No verified match was kept verbatim; the above are clearly-labelled general
guidance synthesised into an original system (see DECISIONS.md).

## 5. Visual identity: Trailhead

**North star:** a calm editorial field guide with a visible trail. Warm paper,
deep ink, one subject hue per surface, soft pebble geometry, tabular numerals,
mono trail markers. Recognisable in a screenshot: Fraunces headlines, pill
statuses, ring + path meters, trail-node mastery.

- Not childish (no bubbly clay, no Comic Neue, no mascots).
- Not corporate (no navy SaaS, no gradient blobs, no glassmorphism).
- Not the Ruled Notebook (no squared-paper grid, no 0-radius forms, no Georgia).
  Hue families are intentionally related (violet/pine/ember) so returning users
  keep wayfinding; everything else is new.

### Colour (light / dark, all pairs ≥ 4.5:1 body, ≥ 3:1 non-text)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--v3-paper` | `#F7F4EC` | `#131511` | page |
| `--v3-surface` | `#FFFFFF` | `#1C1F1A` | cards |
| `--v3-surface-2` | `#EFEAD9` | `#262A22` | wells, tracks |
| `--v3-ink` | `#191C17` | `#F1EDE1` | text |
| `--v3-muted` | `#5B6055` | `#B3AC99` | secondary |
| `--v3-line` | `#D9D3C0` | `#363B31` | hairlines |
| `--v3-line-strong` | `#8A8471` | `#6B6555` | component borders |
| `--v3-foundation` | `#4338CA` | `#A5B4FC` | Maths Foundation |
| `--v3-foundation-ink` | `#232058` | `#E0E7FF` | on tint |
| `--v3-foundation-tint` | `#E4E1FF` | `rgba(99,102,241,.18)` | washes |
| `--v3-higher` | `#0F766E` | `#5EEAD4` | Maths Higher |
| `--v3-higher-ink` | `#123B36` | `#CCFBF1` | on tint |
| `--v3-higher-tint` | `#D3EEE7` | `rgba(20,120,110,.22)` | washes |
| `--v3-english` | `#B45309` | `#FBBF24` | English |
| `--v3-english-ink` | `#452A0B` | `#FEF3C7` | on tint |
| `--v3-english-tint` | `#F7E5C6` | `rgba(180,83,9,.25)` | washes |
| `--v3-good` | `#15803D` | `#4ADE80` | correct/mastered |
| `--v3-warn` | `#92400E` | `#FBBF24` | pending/mid |
| `--v3-bad` | `#B91C1C` | `#F87171` | wrong/overdue |
| `--v3-info` | `#1D4ED8` | `#93C5FD` | notices |

Rules: one subject hue per surface; state = wash + same-hue border + text label
(never colour-alone); dark is re-inked, not dimmed.

### Typography

- Display: **Fraunces** 400–600, tight tracking (`-0.02em`), `clamp(2.4rem,5vw,4.2rem)`.
  Page titles, hero, big numerals. Serif authority, editorial warmth.
- Body/UI: **Inter** 400–700, `15–16px/1.6`. Working prose, buttons, nav.
- Labels: **IBM Plex Mono** 600–700, `11px`, `0.08em` uppercase. Eyebrows, chips,
  trail markers, table heads. Never body copy.
- Numerals: Fraunces or Inter with `font-variant-numeric: tabular-nums` for
  stats, timers, scores, inputs.
- Loading: Google Fonts with `display=swap`; system fallbacks
  (Georgia / system sans / system mono) so content never blocks.

### Shape: pebble + trail

- Cards/panels `18px`, buttons/inputs `14px`, pills `999px`, seals `50%`.
- Trail nodes `12px` dots on a 3px track; progress fills pill-capped.
- Touch targets ≥ 44px; mobile CTA bar sticky with safe-area padding.

### Spacing (4pt base)

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64`. Page max `1160px`, gutters
`48px` desktop / `16px` mobile. Section rhythm `32/48`.

### Elevation

Soft layered depth, not hairlines-only:
`--v3-shadow-sm: 0 1px 2px rgba(25,28,23,.08)`,
`--v3-shadow-md: 0 8px 24px rgba(25,28,23,.10)`.
Borders stay (1px line / strong); shadows lift heroes, sheets, dialogs only.

### Icons / illustration

Inline SVG (stroke 1.8, round caps), no emoji as icons. Bespoke trail art only:
journey path, summit flag, retry loop. No stock, no sparkles-for-novelty.

## 6. Information architecture (kept routes, new hierarchy)

Kept (no regressions): `/`, `/subjects`, `/gcse-*` guides, `/maths/*`,
`/maths-higher/*`, `/english/*` with `dashboard / practice / results / learn /
learn/:topic / notebook / summary / chat` (+ English `texts`, `texts/:id`).

New hierarchy inside the same routes:

- `/` **Launchpad** (was selector): promise → subjects → trail → trust → FAQ.
- Subject `/` **Today** (was stats wall): 01 Up next → 02 Today mission +
  7-day trail → 03 Mastery path → 04 Timed papers → 05 Evidence.
- Shell nav kept (Playwright contract: Dashboard, Practice, Learn, Notebook,
  Summary, AI Tutor) but visually grouped: Journey (Today, Learn) · Practise
  (Practice) · Review (Notebook, Summary, Tutor). Due badge on Notebook.
- `⌘K` quick jump kept, now reachable on mobile via header button.

## 7. Learning experience

- Mastery scale (replaces binary done): **New → Learning → Developing →
  Secure → Mastered**, plus **Needs revision** flag for regressed/due rows.
  Mapping: `null → New`, `<40 → Learning`, `40–69 → Developing`,
  `70–89 → Secure`, `≥90 → Mastered` (≥5 answered; small samples capped at
  Developing). Every meter shows `% + label`.
- Next-step engine kept (`due → mission → weak → untouched → diagnostic →
  paper`), surfaced as a hero with readiness ring, streak, exam countdown,
  weakest-3 with labels, secondary retry CTA.
- Question feedback: immediate, animated, explains method before answer;
  hint → attempt → worked solution → error-type → retry scheduled (1·3·7·21,
  FSRS-lite ease). English: AO + band + evidence + rewrite task.
- Micro-practice around each mistake before the scheduled retry.
- Weekly "mistakes mastered" outcome alongside XP; streaks are kind
  (freezes banked, rest days, no punishment copy, missed day = "paused").

## 8. Gamification (kind, from research)

Keep XP/levels/streaks/readiness; remove punishment. Streak copy never shames;
freezes explicit; weekly goal (3 missions) over daily grind; mastery and
"personal best" celebrated with motion + type, trivial actions not. No leagues,
no dark patterns, no ads.

## 9. Motion

Tokens: `--v3-ease-out`, `--v3-ease-spring`, `--v3-dur-1:150ms`,
`--v3-dur-2:250ms`, `--v3-dur-3:450ms`. Page rise, card stagger, ring count,
meter fill, answer pop, celebration sheet. All gated by
`prefers-reduced-motion: reduce` (collapse to none) and safe for keyboard/SR.

## 10. Responsive

- Mobile (≤760px): linear Today, sticky top bar + bottom tabs, 16px gutters,
  78px bottom clearance, large tap targets, portrait-first question runner.
- Tablet (761–1100px): collapsed rail (72px) + 2-col grids.
- Desktop (1100px+): 244px rail + content, contextual 2-col (question/source),
  max 1160px. Layouts change, not just collapse.

## 11. Accessibility (WCAG 2.2 AA target)

Skip links, landmarks, heading order, visible 3px focus rings, 44px targets,
live regions for marking/progress/palette, non-colour cues everywhere,
dyslexia-aware measure (≤68ch, 1.6 line-height), scalable text, keyboard-first
runner + palette, reduced-motion parity, light/dark parity.

## 12. Files

- `website/clients/shared/v3.css` — the V3 system (tokens, base, shell,
  components, pages, motion, responsive, a11y). Loaded after `study-desk.css`.
- `website/selector/v3-launchpad.css` — launchpad + guides theme.
- `website/clients/shared/AppShell.jsx` — V3 shell (same DOM contract).
- `website/clients/shared/DashboardHome.jsx` + `NextStep.jsx` + `next-step.js`
  — Today hero, mastery path, kind copy.
- `website/selector/index.html` — Launchpad content (same selectors).
