---
name: GCSE Study Desk
description: "Trailhead — the revision-trail design system for AQA GCSE Maths and English. Built for 15–20 year olds: colourful, kind, curiosity-first. Fraunces headlines, pebble-soft surfaces, one honest subject hue at a time, light and dark."
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

# GCSE Study Desk — Trailhead

*The design system for people doing (or re-sitting) their GCSEs.*

## The big idea

Imagine opening an app and, instead of a wall of graphs, one card says:

> **Retry the 3 mistakes that come back today.**
> Sorting them now is worth more than anything else you could revise.

That's the product. Everything else — the colours, the type, the animation — exists to make that moment feel good and keep it coming.

Revision is a trail, not a to-do list. You set off from a trailhead, you can always see how far you've come, the next step is always marked, and when you stumble there's a worked method waiting — not a red cross and a sigh. Then the trail quietly brings that topic back in a few days so you can prove the fix stuck. When it does, you *feel* it. That's mastery, and it's the best feeling in the app.

The whole design has one job: make you want to take the next step.

## Who we're building for

You. Or someone like you: 15 to 20, doing GCSEs for the first time or coming back for a resit, revising on your phone between other things, probably not exactly thrilled about it.

You're not a kid, so no bouncy mascots and no talking down. You're not a corporate buyer, so no dashboards that look like they were designed for an accountant. You're someone who wants to feel *capable* — and who can smell fake enthusiasm from a mile off.

Five seconds. That's how long any screen gets to answer "what do I do now?" If it can't, the screen is wrong, not you.

## What we believe

These aren't wall decorations. When a design decision is unclear, these settle it.

**Learning beats points.** XP, streaks and levels are scaffolding, not the building. A learner who understands a topic but has a modest streak is winning. We never design for the metric at the expense of the understanding.

**Every mistake is a map.** Getting something wrong shows you exactly where to dig. We mark every miss with a worked method, a reason you can pick yourself (misread? method? timing?), and a return date. Mistakes are the product, not the failure.

**Honesty is the vibe.** Readiness is built from your marked work, never a "predicted grade". AI feedback says it's guidance. We say "AQA-style", never endorsed. People revise better with something they can trust.

**Small steps, real ones.** A ten-minute session that genuinely teaches beats an hour of staring. We chunk everything: one lesson, five questions, one paper at a time.

**Rest is part of the plan.** Rest days are drawn into the week. Streaks pause, they never shatter. Guilt is not a revision technique.

**Curiosity is contagious.** Where we can, we show the interesting bit — the graph, the pattern, the "oh, *that's* why". A learner who gets curious doesn't need reminding to come back.

## Colour: loud enough to love, calm enough to think in

Warm paper everywhere, deep ink for the actual reading, and then — the fun part — colour that *means something*. Screens should never feel beige and they should never feel like a sweet shop. The trick is spending colour where it teaches.

### The three subject hues

Each subject owns one colour, the way each of your exercise books had its own cover:

- **Trail Indigo** `#4338CA` — Maths Foundation. Bold, dependable.
- **Pine** `#0F766E` — Maths Higher. Deep and steady, a step up the mountain.
- **Ember** `#B45309` — English Language. Warm, manuscript-y.

In dark mode each one brightens into its night version (indigo → `#A5B4FC`, pine → `#5EEAD4`, ember → `#FBBF24`) so the app still feels alive after 11pm revision — just gentler.

Every hue brings two friends: a **tint** (the pale wash that fills active things) and an **ink** (the dark text that sits on that tint). They travel together. Always.

### Where colour gets to be loud

- **The mastery path.** The colourful heart of the app. Each strand is a card with a stage pill in its full colour — New (quiet grey), Learning (red wash), Developing (amber wash), Secure and Mastered (green wash). Scanning your path should feel like checking a scoreboard you *earned*.
- **Correct answers bloom.** Get it right and the question card washes green with a little pop. You did that. Notice it.
- **Countdowns warm up.** Exam countdown pills start neutral and shift amber, then red as the date closes in. Colour as urgency, honestly used.
- **Subject entry points.** The launchpad cards lead with their hue — Foundation gets a solid indigo "Open MathsMate" button, Higher pine, English ember. Choosing a subject should feel like picking your colour.

### Where colour stays quiet

Body text is ink. Backgrounds are paper. Borders are hairlines. The calm parts make the loud parts mean something.

### The two laws of colour

1. **One hue per surface.** Indigo and pine never share a card. A surface belongs to a subject or it belongs to no one.
2. **Wash + words.** Every state is a pale wash, a matching border, *and a written word* — "Secure", "Due", "Developing". Delete every colour from the app and it should still make complete sense. That's also how colour-blind learners use it every day, so this isn't a nice-to-have.

### The full palette

All values, light and dark, live in the frontmatter above and in `v3.css`. The everyday cast: **Good** green `#15803D`, **Warn** amber `#92400E`, **Bad** red `#B91C1C`, **Info** blue `#1D4ED8` — each with a wash for fills. Neutrals: paper `#F7F4EC`, card white `#FFFFFF`, muted sand `#EFEAD9`, ink `#191C17`, quiet grey-green `#5B6055`, lines `#D9D3C0` and `#8A8471`. Dark mode re-inks all of it on `#131511` — it's a different mood, not a dimmer switch.

## Type: three voices

Think of a great textbook: serious headlines, friendly prose, tidy labels.

- **Fraunces** is the headline voice — a warm serif with real character. Page titles, big numbers, the login screen. When Fraunces shows up, the thing it says matters. (It's also the single biggest personality lever we have. If the app feels generic, check the headings aren't falling back to system font.)
- **Inter** does the working prose — buttons, questions, explanations. 16px, 1.6 line height, never more than 68 characters to a line. Reading tired after school should still be easy.
- **IBM Plex Mono** is the trail-marker voice — little uppercase labels like `02 · UP NEXT` and `DEVELOPING`. Mono never writes sentences you have to *read*; it stamps and files.

Numbers get tabular figures everywhere they tick — timers, scores, stats — so nothing jitters as it counts.

Fonts load from Google Fonts with `display=swap` and system fallbacks, so the app never sits there blank waiting for a typeface.

## Shape: pebbles, not boxes

Corners are rounded like river stones because square corners feel like paperwork:

- **18px pebbles** — panels, cards, dialogs.
- **14px controls** — buttons, inputs, nav items, trail cards.
- **10px tiles** — small inner bits.
- **Full pills** — chips, stage labels, countdowns.
- **Circles** — the level seal and the readiness ring.

Every pebble keeps a real border (1px line) so nothing floats off ambiguously. Shadows are a soft lift — `0 1px 2px` at rest, `0 8px 24px` on hover, `0 18px 48px` for dialogs. Nothing glows. Glow is what fluorescent lighting does, and nobody has ever called that beautiful.

## Space and rhythm

Spacing walks a 4-point scale: 4, 8, 12, 16, 20, 24, 32, 48, 64. Content tops out at 1160px wide with generous gutters. When two things belong together they sit 8–12px apart; when they're different ideas, give them 32–48px of air. Air is kindness — a stressed brain can't parse a cramped screen.

## Motion: the app should feel alive, not caffeinated

Animation says three things here: *you did something*, *something changed*, *here's where you are*.

- Pages rise gently into place (250ms).
- Correct answers pop with a small spring; wrong answers give one brief shake — feedback, not a earthquake of shame.
- Meters fill over 450ms so progress feels *travelled*, not teleported.
- Level-ups and mastery moments get the springiest thing we have: a reward card that stamps in like a seal on a certificate.
- Hovering lifts a card 2px, like picking it up to look closer.

Everything collapses gracefully under `prefers-reduced-motion` — the app must be fully usable with animation off. Motion is seasoning, never the meal.

## The pieces

All of this lives in `website/clients/shared/v3.css` (the app) and `website/selector/v3-launchpad.css` (public pages), loaded after the legacy base so V3 always wins. Use the tokens — never hardcode a hex.

- **The Next-Step hero.** The star of the app. A pebble card with a subject-colour gradient rule across the top, a readiness ring, one big primary button, three fact tiles (streak · readiness · exams) and the weakest topics with honest stage labels. One screen, one decision, done.
- **Trail cards.** One per topic strand, weakest first: name, stage pill, a progress track, and the evidence line underneath ("62% · 50 answered"). Each card stands alone — never nested inside another list.
- **Stage pills.** The mastery language learners learn to read: New → Learning → Developing → Secure → Mastered, plus Needs revision. Word + colour + wash, always together.
- **Stat cards.** Big Fraunces number, mono label, and — the important bit — the *so-what* caption underneath. Four per screen, maximum. A number without a "so what" is decoration, and decoration gets deleted.
- **Buttons.** 46px tall minimum (50px on mobile — thumbs are real). Primary wears the subject hue and lifts on hover; secondary is calm card-on-paper. Pressing squishes to 98% because physical things respond.
- **Inputs.** Near-white wells, 46px tall, 16px text (so phones don't zoom on focus). Focus rings are 3px and obvious.
- **Navigation.** Desktop gets a 264px paper rail grouped into Journey / Practise / Review, with a due-mistakes badge on Notebook. Tablet gets a slim icon rail. Mobile gets a sticky top bar and a thumb-friendly bottom tab bar that respects the gesture area.
- **Dialogs and celebrations.** Ink scrim, pebble card, spring entrance, focus trapped and returned. The reward moment (level up, first completion) is the one place the app gets genuinely celebratory — earned confetti, not random confetti.

## The screens

Every subject follows the same path, numbered like trail markers:

1. **Your trail so far** — the four honest numbers, each with its so-what.
2. **Up next** — the hero. One step. Everything else can wait.
3. **Today** — your mission, readiness, the 7-day trail with rest days drawn in.
4. **Mastery path** — the colourful scoreboard of what's secure and what isn't.
5. **Sit a timed paper** — real AQA-style papers, real timings.
6. **Evidence** — your level, your memory work (MemRi), milestones worth showing a parent or teacher.

Mobile isn't a shrunken desktop — it's the primary experience. Linear, single column, big targets, bottom-reachable everything. Desktop earns its extra space with the full rail and roomier grids.

## How we talk

Like the good older sibling who did their GCSEs recently: encouraging because it's true, specific because vagueness is useless, honest because trust is the whole product.

**We say / we don't say:**

- "Paused — rest is part of the plan" — not "Streak lost!"
- "Fresh start" — not "0 day streak"
- "Every miss gets a worked method" — not "You failed 3 questions"
- "Exams May 2027 — plenty of runway" — not "26,549 days to go"
- "Needs attention · weakest first" — not "Your weak subjects"
- "Your trail starts here" — not "No data"

Encouragement is always *specific and true*: "you've answered 50 Algebra questions", never "amazing work!!!". No exclamation-mark enthusiasm. No patronising. UK English throughout — Maths, revision, colour.

## Everyone gets to learn

Accessibility is a feature of the product, not a compliance checkbox. Concretely:

- 3px focus rings on everything keyboard-navigable; skip links on every page.
- 44px touch targets, enforced by tests.
- Never colour alone (see the second law of colour).
- 68-character reading lines, 1.6 line height, 16px inputs — because tired eyes are normal eyes.
- Screen-reader landmarks, live announcements for marking and progress, a keyboard-first question runner and ⌘K palette.
- Light and dark are both first-class citizens, each contrast-checked on its own terms.
- `prefers-reduced-motion` and `prefers-contrast: more` are supported and tested.

A learner with dyslexia, a learner on a cracked phone at 10pm, a learner re-sitting after a hard year — the app should be *better* for them, not merely usable.

## What we don't do

- No punishment. Ever. Paused, not broken.
- No dark patterns, streak guilt, or fake urgency.
- No gradient blobs, glass panels, sparkles or glow-for-glow's-sake.
- No mixing subject hues, no colour where a word works better.
- No talking down, no clip art, no "Hey superstar!"
- No claims we can't back: no predicted grades, no AQA endorsement, no invented testimonials.

## Where things live

- `website/clients/shared/v3.css` — the system itself: tokens, base, shell, components, motion, responsive rules, accessibility.
- `website/selector/v3-launchpad.css` — the public launchpad and course guides.
- `docs/design/v3/` — the research, the decision log, and what changed.
- `PRODUCT.md` — what the product *is*. This file — what it *feels like*.
