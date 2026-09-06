---
name: GCSE Study Desk
description: "Trailhead — the warm, characterful revision-trail design system for AQA GCSE Maths and English: Fraunces headlines, pebble-soft surfaces, one honest subject hue at a time, kind streaks, light and dark."
colors:
  paper: "#f7f4ec"
  paper-dark: "#131511"
  card: "#ffffff"
  card-dark: "#1c1f1a"
  card-muted: "#efead9"
  card-muted-dark: "#262a22"
  ink: "#191c17"
  ink-dark: "#f1ede1"
  quiet: "#5b6055"
  quiet-dark: "#b3ac99"
  line: "#d9d3c0"
  line-dark: "#363b31"
  line-strong: "#8a8471"
  line-strong-dark: "#6b6555"
  trail-indigo: "#4338ca"
  trail-indigo-dark: "#a5b4fc"
  trail-indigo-ink: "#232058"
  trail-indigo-ink-dark: "#e0e7ff"
  trail-indigo-tint: "#e4e1ff"
  trail-indigo-tint-dark: "rgba(99, 102, 241, 0.2)"
  pine: "#0f766e"
  pine-dark: "#5eead4"
  pine-ink: "#123b36"
  pine-ink-dark: "#ccfbf1"
  pine-tint: "#d3eee7"
  pine-tint-dark: "rgba(20, 120, 110, 0.24)"
  ember: "#b45309"
  ember-dark: "#fbbf24"
  ember-ink: "#452a0b"
  ember-ink-dark: "#fef3c7"
  ember-tint: "#f7e5c6"
  ember-tint-dark: "rgba(180, 83, 9, 0.28)"
  good: "#15803d"
  good-dark: "#4ade80"
  good-wash: "#dcf0e3"
  good-wash-dark: "rgba(74, 222, 128, 0.16)"
  warn: "#92400e"
  warn-dark: "#fbbf24"
  warn-wash: "#f6e7c8"
  warn-wash-dark: "rgba(251, 191, 36, 0.16)"
  bad: "#b91c1c"
  bad-dark: "#f87171"
  bad-wash: "#f6dcdc"
  bad-wash-dark: "rgba(248, 113, 113, 0.16)"
  info: "#1d4ed8"
  info-dark: "#93c5fd"
  info-wash: "#dfe8fb"
  info-wash-dark: "rgba(147, 197, 253, 0.16)"
  on-accent: "#ffffff"
  on-accent-dark: "#131511"
typography:
  display:
    fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(32px, 4vw, 50px)"
    fontWeight: 560
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "'Fraunces', Georgia, serif"
    fontSize: "clamp(22px, 2vw, 29px)"
    fontWeight: 560
    lineHeight: 1.15
  body:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.08em"
  numeric:
    fontFamily: "'Fraunces', Georgia, serif"
    fontSize: "34px"
    fontWeight: 560
    fontFeature: "tnum"
rounded:
  tile: "10px"
  control: "14px"
  pebble: "18px"
  pill: "999px"
  seal: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  "3xl": "32px"
  "4xl": "48px"
  page: "40px"
  gutter: "48px"
components:
  button-primary:
    backgroundColor: "{colors.trail-indigo}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    minHeight: "46px"
    padding: "12px 20px"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    minHeight: "46px"
    padding: "12px 20px"
    typography: "{typography.body}"
  input:
    backgroundColor: "#fffdf7"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    minHeight: "46px"
    typography: "{typography.body}"
  nav-item-active:
    backgroundColor: "{colors.trail-indigo-tint}"
    textColor: "{colors.trail-indigo-ink}"
    rounded: "{rounded.control}"
    minHeight: "46px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
    typography: "{typography.label}"
  panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pebble}"
    padding: "26px"
  trail-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px 18px"
  stat-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pebble}"
    padding: "18px"
---

# Design System: GCSE Study Desk — Trailhead (V3)

## Overview

**Creative North Star: "The Trailhead"**

Revision shouldn't feel like homework. It should feel like setting off on a trail you've already walked part of the way up — you can see how far you've come, you know what the next step is, and someone's left the path marked for you. That's the whole design in one picture.

So Study Desk looks like a beautifully printed walking guide: warm paper under everything, deep ink you can actually read, one honest subject colour per surface, and progress drawn as a path with steps — not a spreadsheet with percentages. The feeling we're aiming for is *calm confidence*: "I know what today looks like, and I can do it."

Who this is for: a 15-year-old, usually on their phone, usually a bit unsure where to start. They are bright and busy and allergic to being patronised. Every screen should answer **"what do I do next?"** in under five seconds, then get out of the way. If a screen needs explaining, the screen is wrong.

**What makes it feel like us:**
- Fraunces serif headlines — warm, a bit bookish, quietly sure of themselves.
- Pebble-soft surfaces (18px corners) on warm paper — friendly, not toy-like.
- One subject hue at a time: Trail Indigo for Foundation Maths, Pine for Higher, Ember for English.
- Progress you can *see travelling* — a readiness ring, a mastery path, a trail of done days.
- Kind mechanics everywhere: streaks pause, they never punish. Rest days are part of the plan.
- Mono trail-markers (01, 02, 03…) that make the app feel like a well-organised notebook.

**What we are not:** childish (no mascots, no bubble fonts), corporate (no navy SaaS dashboards, no gradient blobs), sterile (no wall of grey cards), or punishing (no shame copy, ever).

## Voice: how we talk

We speak like a good older sibling who's done their GCSEs recently — encouraging, honest, never fake-cheerful, never lecturing. UK English throughout ("Maths", "revision", "colour").

**Say this, not that:**

| Say | Not |
| --- | --- |
| "Paused — rest is part of the plan" | "Streak lost! 🔥💀" |
| "Fresh start" (streak 0) | "0 day streak" |
| "Every miss gets a worked method" | "You failed 3 questions" |
| "Exams May 2099 — plenty of runway, build the habit now" | "26,549 days to go" |
| "Needs attention · weakest first" | "Your weak subjects" |
| "Readiness: Building" | "Readiness: 0%" |
| "Your trail starts here" | "No mastery data" |

**Named rules of voice:**
- **The Paused, Not Broken Rule.** Missing a day is a pause, never a loss. Streak copy never implies punishment; freezes are named and visible.
- **The So-What Rule.** Every number on screen carries a caption that says what to do with it. A stat without a "so what" gets deleted.
- **The Show-the-Method Rule.** Feedback explains the method before it judges the answer. "Here's how" before "here's your score".
- **No Fake Hype.** Encouragement is specific and true ("you've answered 50 Algebra questions") — never generic confetti-speak, never invented praise.

## Colors

Warm paper first, deep ink for reading, and colour spent like fuel — one subject's worth at a time. Every colour pair is contrast-checked for WCAG AA in both themes; dark mode is its own warm night-walk, not a dimmed copy of the day version.

### Subject hues (one per surface, never mixed)
- **Trail Indigo** `#4338CA` (dark `#A5B4FC`) — Maths Foundation. Buttons, active nav, selected choices, progress fills, focus rings on Foundation surfaces.
- **Pine** `#0F766E` (dark `#5EEAD4`) — Maths Higher. Same roles, calmer, deeper.
- **Ember** `#B45309` (dark `#FBBF24`) — English Language. Warm, manuscript-flavoured.

Each hue has an **ink** (for text on its tint) and a **tint** (the pale wash for active states). The tint and ink travel together like a pen and its matching highlighter.

### State colours (always with words)
- **Good** `#15803D` / wash `#DCF0E3` — correct, mastered, done. Always paired with a ✓ or a word.
- **Warn** `#92400E` / wash `#F6E7C8` — pending, "Developing", gentle urgency.
- **Bad** `#B91C1C` / wash `#F6DCDC` — wrong answers, due retries, exam-close. Red is information, not scolding.
- **Info** `#1D4ED8` / wash `#DFE8FB` — notices, tutor messages, links that need trust.

### Neutrals
- **Paper** `#F7F4EC` (dark `#131511`) — the ground everything walks on.
- **Card** `#FFFFFF` (dark `#1C1F1A`) — raised surfaces, with a whisper of shadow.
- **Card Muted** `#EFEAD9` (dark `#262A22`) — wells, tracks, quiet fills.
- **Ink** `#191C17` (dark `#F1EDE1`) — all primary text.
- **Quiet** `#5B6055` (dark `#B3AC99`) — secondary text, captions, the "so what" line.
- **Line** `#D9D3C0` / **Line Strong** `#8A8471` (dark counterparts) — hairlines and component borders.

### Named rules
**The One Hue Per Surface Rule.** Each surface carries exactly one subject hue. Accents never mix, and a subject's tint never decorates another subject's screen.

**The Wash + Words Rule.** State is a pale wash, a same-hue border, *and a word* — "Secure", "Developing", "Due". If you removed every colour from the app, everything would still be understandable. That's the test.

## Typography

Three voices, like a good textbook: a warm serif for the things that matter, a clear sans for the working prose, a mono for the labels that keep the trail marked.

- **Display — Fraunces** (400–600, -0.015em tracking): page titles, panel headings, big numerals, the login headline. Fraunces is the personality of the product; if the app feels flat, check whether Fraunces is actually being used.
- **Body — Inter** (400–700, 16px/1.6): working text, buttons, navigation. Never wider than 68 characters per line.
- **Labels — IBM Plex Mono** (700, 11px, 0.08em, uppercase): eyebrows, chips, section numbers, table heads. Mono labels the trail; it never sets sentences a learner has to read as prose.
- **Numerals — tabular everywhere** stats, timers, scores and answer inputs align. `font-variant-numeric: tabular-nums` is non-negotiable in anything that ticks.

Fonts load from Google with `display=swap` and honest system fallbacks (Georgia / system sans / system mono) — first paint never waits for a typeface.

**Named rule:** **The Serif Matters Rule.** Headlines and numbers in Fraunces; if a screenshot could be mistaken for generic admin software, the type is wrong, not the layout.

## Shape: pebbles and paths

- **Pebble (18px):** panels, cards, dialogs, the login sheet. Friendly, rounded like river stones.
- **Control (14px):** buttons, inputs, nav items, trail cards. Soft enough to feel touchable, square enough to feel dependable.
- **Tile (10px):** small inner elements — nav icon chips, tiny tags.
- **Pill (999px):** chips, badges, stage labels, countdowns, the section numbers.
- **Seal (50%):** the level seal, the readiness ring.

Borders are always present (1px Line or Line Strong) so pebbles never float ambiguously. Shadows are a soft lift, not a glow: `0 1px 2px rgba(25,28,23,.08)` at rest, `0 8px 24px rgba(25,28,23,.10)` on hover or heroes, `0 18px 48px rgba(25,28,23,.14)` for dialogs. Dark mode deepens the shadows instead of brightening them.

## Spacing & rhythm

4-point base: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64. Pages max out at 1160px with 48px gutters (16px on mobile). Sections breathe at 32–48px; things that belong together sit 8–12px apart. When in doubt, more air — a calm screen is a screen a stressed teenager can think on.

## Elevation & depth

Depth is gentle and layered, like sheets of paper on a desk — not glass, not neon. Cards rest with a whisper of shadow and lift 2px on hover with a slightly deeper shadow; heroes (the Today card, dialogs) carry the strongest shadow in the system. Overlays are an ink scrim (`rgba(25,28,23,.5)`; black 62% in dark) with a 6px blur. Nothing pulses, nothing glows, nothing begs for attention — the next step earns attention by being first.

## Motion: purposeful, springy, skippable

Motion exists to say three things: *you did something*, *something changed*, *here's where you are*.

- **Timing tokens:** 150ms (hover, press), 250ms (page entry, cards), 450ms (meters, celebrations). Easing: `cubic-bezier(0.22, 0.61, 0.36, 1)` for travel, `cubic-bezier(0.34, 1.56, 0.64, 1)` for the little celebratory bounce.
- **The vocabulary:** pages rise 10px into place; correct answers pop gently; wrong answers shake *once*, briefly — feedback, not punishment; meters fill with a 450ms ease so progress feels travelled; the reward dialog springs in like a stamp coming down.
- **The golden rule:** `prefers-reduced-motion: reduce` collapses everything to near-zero and the app must remain completely usable. If an animation carries meaning the UI can't show statically, the UI is wrong.

## Components

The system lives in `website/clients/shared/v3.css` (app) and `website/selector/v3-launchpad.css` (public pages), loaded after the legacy base so every tie resolves to V3. Consume the tokens; never hardcode a hex.

- **Buttons.** Pebble controls at 46px minimum (50px on mobile). Primary wears the subject hue with a same-family border and lifts 1px on hover; secondary is Card-on-paper with a Line Strong border. Press = scale 0.98. Disabled = 48% opacity, no tap action.
- **Inputs.** Near-white wells (`#FFFDF7`), 14px corners, 46px tall, 16px text (no iOS zoom). Focus moves the border to the subject hue with a 3px offset ring — visible, unmissable.
- **The Next-Step hero.** The most important component in the product. A pebble card with a 6px subject gradient rule on top, a readiness ring (labelled, evidence-based, never "a predicted grade"), the single next action as a primary button, three fact tiles (streak · readiness · exams), and the weakest topics with stage labels. Everything readable, everything labelled, one CTA.
- **Trail cards (mastery path).** One card per strand, weakest first: name, stage pill (New → Learning → Developing → Secure → Mastered), a labelled track, and the evidence line ("62% · 50 answered"). Each card is a self-contained step — never nested inside another list.
- **Stage pills.** Mono uppercase in a pill with a same-hue border: quiet for New, warn wash for Learning/Developing, good wash for Secure/Mastered, bad wash for Needs revision. The word always travels with the colour.
- **Stat cards.** Fraunces numerals, mono label, and the "so what" caption in Quiet. Four maximum per screen.
- **Nav.** Desktop: a 264px paper rail grouped Journey / Practise / Review, with glyph chips and the due-mistake badge on Notebook. Tablet: 76px icon rail. Mobile: sticky top bar (identity + account) and a fixed bottom tab bar with safe-area padding — thumbs first.
- **Countdowns.** Exam countdowns are pills that get warmer as the date approaches. Far-future dates speak in months, never absurd day counts.
- **Dialogs.** Ink scrim, pebble card, spring entrance, focus trapped, Escape closes, focus restored on exit.

## Layout

One hierarchy everywhere, numbered like trail markers:

1. **Your trail so far** — the four honest numbers.
2. **Up next** — the hero. One step. Everything else can wait.
3. **Today** — mission, readiness, the 7-day trail with rest days drawn in.
4. **Mastery path** — weakest first, labelled stages.
5. **Sit a timed paper** — the exam dockets.
6. **Evidence** — levels, memory (MemRi), milestones worth sharing.

Mobile (≤760px) is linear and single-column with 16px gutters and 78px+ bottom clearance above the tab bar. Tablet (761–1100px) keeps a collapsed icon rail. Desktop adds the full rail and richer grids. Layouts genuinely change between device classes — mobile is designed for thumbs, not shrunken desktop.

## Accessibility: non-negotiable

Target WCAG 2.2 AA everywhere, and treat these as features, not chores:

- 3px focus rings with offset on every interactive element; skip links at the top of every page.
- 44px minimum touch targets (Playwright-enforced).
- Never colour alone — the Wash + Words Rule is the law.
- Tabular numerals for anything that ticks; 16px inputs; 68ch reading measure; 1.6 line-height.
- Landmarks, heading order, live regions for marking/progress/palette results, keyboard-first question runner and ⌘K palette.
- Light and dark are both first-class; dark mode is re-inked, not dimmed, and contrast-checked on its own terms.
- `prefers-reduced-motion` and `prefers-contrast: more` are supported and tested.

## Do's and Don'ts

### Do
- **Do** open every screen with the next step. Momentum is the product.
- **Do** use the tokens from `v3.css` — new UI never hardcodes a colour.
- **Do** write copy in the product's voice: warm, specific, honest, a bit wry. Read it aloud; if it sounds like a corporate intranet or a worried teacher, rewrite it.
- **Do** celebrate real mastery (a stage change, a personal best, a level) with the spring motion — and only real mastery.
- **Do** keep dark mode a separate, equally-loved design.

### Don't
- **Don't** punish. No shame copy, no alarm-red walls, no streak guilt. Paused, not broken.
- **Don't** decorate with gradients, glass, sparkles or glow. If it doesn't mark the trail, it doesn't ship.
- **Don't** mix subject hues, and don't spend colour where words will do.
- **Don't** patronise. No exclamation-mark enthusiasm, no clip art, no "Hey superstar!". Respect beats hype.
- **Don't** show a number without its "so what".
- **Don't** claim grades, endorsement or certainty we don't have — readiness is evidence, not a prediction.

## Where things live

- `website/clients/shared/v3.css` — the system (tokens, base, shell, components, motion, responsive, a11y).
- `website/selector/v3-launchpad.css` — public launchpad and course guides.
- `docs/design/v3/` — research (`RESEARCH.md`), decision log (`DECISIONS.md`), change notes (`CHANGES.md`), this system in brief (`README.md`).
- Product truth lives in `PRODUCT.md`; this file owns how it looks, feels and speaks.
