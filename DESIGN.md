---
name: GCSE Study Desk
description: "The Ruled Notebook — a stationery-warm, ledger-precise revision desk for AQA GCSE Maths and English, printed in light and dark ink."
colors:
  desk-paper: "#f3f0e8"
  desk-paper-raised: "#fbfaf6"
  desk-paper-muted: "#e9e6dc"
  india-ink: "#161713"
  graphite: "#65675f"
  ledger-rule: "#cbc8bd"
  ledger-rule-strong: "#8d8e85"
  blotting-paper: "#fffefa"
  desk-paper-dark: "#16140f"
  desk-paper-raised-dark: "#1d1a14"
  desk-paper-muted-dark: "#262119"
  india-ink-dark: "#ece6df"
  graphite-dark: "#a79e8e"
  ledger-rule-dark: "#2e2921"
  ledger-rule-strong-dark: "#5f574c"
  blotting-paper-dark: "#221e18"
  exam-violet: "#6849e8"
  exam-violet-strong: "#4d34bd"
  exam-violet-wash: "#ece8ff"
  exam-violet-tint: "#e2dcff"
  exam-violet-ink: "#201a3d"
  exam-violet-dark: "#8c5cf0"
  exam-violet-strong-dark: "#c4b2ff"
  exam-violet-ink-dark: "#c4b2ff"
  higher-green: "#287c68"
  higher-green-strong: "#1b5b4b"
  higher-green-wash: "#d8eee7"
  higher-green-tint: "#d0e9df"
  higher-green-ink: "#173b35"
  higher-green-dark: "#76c9b2"
  manuscript-ochre: "#ad7621"
  ochre-strong: "#835713"
  ochre-wash: "#f3e8ce"
  ochre-tint: "#ebddbd"
  ochre-ink: "#3e2911"
  manuscript-ochre-dark: "#b06b21"
  ochre-strong-dark: "#e9a85a"
  ochre-ink-dark: "#e3bf7e"
  marker-green: "#237b55"
  marker-green-dark: "#55c193"
  marker-green-wash: "#dcebe3"
  marking-red: "#a33d3d"
  marking-red-dark: "#e2685f"
  marking-red-wash: "#f1dddd"
  ledger-amber: "#98670f"
  ledger-amber-dark: "#d9a441"
  ledger-amber-wash: "#f0e5c5"
  examiner-blue: "#38678c"
  examiner-blue-dark: "#6fa8d8"
  examiner-blue-wash: "#dfe9f1"
  manuscript-cream: "#fffaf0"
  manuscript-ink: "#34291d"
  manuscript-rule: "#9d8a68"
  manuscript-cream-dark: "#241d14"
  manuscript-ink-dark: "#f4e7d0"
  manuscript-rule-dark: "#6a4a35"
  on-accent: "#ffffff"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(42px, 5vw, 70px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "27px"
    fontWeight: 400
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "10px"
    fontWeight: 800
    letterSpacing: "0.07em"
  numeric:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "38px"
    fontWeight: 400
    lineHeight: 0.9
    fontFeature: "tnum"
rounded:
  none: "0"
  pill: "999px"
  circle: "50%"
  mobile-nav: "6px"
  native-field: "13px"
  native-control: "14px"
  native-surface: "16px"
  native-card: "18px"
  native-panel: "20px"
  native-chrome: "22px"
  native-seal: "56px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  "3xl": "28px"
  page: "42px"
  gutter: "48px"
components:
  button-primary:
    backgroundColor: "{colors.exam-violet}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.none}"
    padding: "10px 18px"
    height: "42px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.exam-violet}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.none}"
  button-secondary:
    backgroundColor: "{colors.desk-paper-raised}"
    textColor: "{colors.india-ink}"
    rounded: "{rounded.none}"
    padding: "10px 18px"
    height: "42px"
    typography: "{typography.body}"
  button-secondary-hover:
    backgroundColor: "{colors.desk-paper-muted}"
    textColor: "{colors.india-ink}"
    rounded: "{rounded.none}"
  input:
    backgroundColor: "{colors.blotting-paper}"
    textColor: "{colors.india-ink}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
    height: "46px"
    typography: "{typography.body}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    rounded: "{rounded.none}"
    padding: "9px 10px"
    height: "44px"
    typography: "{typography.body}"
  nav-item-active:
    backgroundColor: "{colors.exam-violet-tint}"
    textColor: "{colors.exam-violet-ink}"
    rounded: "{rounded.none}"
    height: "44px"
  chip:
    backgroundColor: "{colors.desk-paper-raised}"
    textColor: "{colors.india-ink}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
    typography: "{typography.label}"
  chip-selected:
    backgroundColor: "{colors.exam-violet-tint}"
    textColor: "{colors.exam-violet-ink}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
  panel:
    backgroundColor: "{colors.desk-paper-raised}"
    textColor: "{colors.india-ink}"
    rounded: "{rounded.none}"
    padding: "28px"
  stat-card:
    backgroundColor: "{colors.desk-paper-raised}"
    textColor: "{colors.exam-violet-ink}"
    rounded: "{rounded.none}"
    padding: "18px 20px"
    height: "112px"
  docket:
    backgroundColor: "{colors.desk-paper-raised}"
    textColor: "{colors.exam-violet-ink}"
    rounded: "{rounded.native-card}"
    padding: "18px"
---

# Design System: GCSE Study Desk

## Overview

**Creative North Star: "The Ruled Notebook"**

GCSE Study Desk looks like a well-kept student's desk: warm paper under ink-black rules, metadata stamped in monospace, and one honest subject accent at a time. Every surface reads as a printed working form — squared exam papers, ruled notebooks, marked scripts — rather than a floating app card. The character is warm, precise, trustworthy: stationery-warm, ledger-precise, quietly confident, exam-authentic. Density is generous but ruled; hairlines and ink borders do the separating so type can stay calm.

One identity adapts to each platform on purpose. On the web, surfaces are sharp ruled forms — radius 0 panels, buttons and inputs — with hover as a first-class state: borders darken to ink and rows lift 1–2px. On native, everyday surfaces take a rounded desk character (13–22px), while exam-critical surfaces stay sharp and square; touch uses pressed scale feedback, safe areas and a rounded native tab bar. It is one identity with intentional adaptation, not two designs.

The confirmed anti-reference is neon SaaS/dashboard styling: no glows on dark navy panels, no radial purple-and-pink gradients, no glassy floating cards. The retired legacy theme that used exactly that look remains in the codebase as residue; it is not the design system. Depth is printed, not projected — tonal washes and rule weights carry hierarchy, and shadows exist only on native chrome and exceptional overlays.

**Key Characteristics:**
- Warm paper first: Desk Paper (#f3f0e8) with a 24px squared-paper pattern under every web screen; native repeats the same ruled texture as hairline rows.
- Borders are elevation: hairlines, stronger edges, ink rules and tonal washes create hierarchy; web surfaces are flat (`box-shadow: none`).
- One accent per subject: Exam Violet (Maths Foundation), Higher Green (Maths Higher), Manuscript Ochre (English Language) — never mixed within a surface.
- State washes: pale same-hue washes behind matching ink for Marker Green, Ledger Amber, Marking Red and Examiner Blue.
- Mono metadata: uppercase monospace labels at 8–11px with 0.07–0.09em tracking.
- Georgia serif display at weight 400 with tight negative tracking, over a system sans body.
- Dark mode is a separate warm ink on dark paper, not a dimmed copy of light mode.

## Colors

The palette is stationery, not dashboard: warm papers, near-black inks, olive-grey rules, and saturated accents spent sparingly like a single ink pen per subject. Values below are the light theme; every token has a dark-theme counterpart set by `data-theme="dark"` (frontmatter keys suffixed `-dark`), and dark mode is not a shadow of the light design — it re-inks the same grid with its own warm paper and brighter accents.

### Primary (Subject Accents)
- **Exam Violet** (#6849e8, dark #8c5cf0): The Maths Foundation accent. Primary buttons, active navigation, selected choices, question-card top rules, paper-picker strips, progress fills and the 3px focus outline.
- **Exam Violet, pressed** (Exam Violet Deep #4d34bd, dark #c4b2ff): Links, "go" affordances and pressed/strong variants of violet (`.link`, `.topic-go`, `--accent-strong`).
- **Exam Violet Ink** (#201a3d, dark #c4b2ff): The near-black violet used as text on Violet Tint (#e2dcff) for active states, and as wash text in the Violet Wash (#ece8ff).

### Secondary (Subject Accents, by course)
- **Higher Green** (#287c68, dark #76c9b2): Maths Higher's accent family (deep teal-green), same roles as Exam Violet with its own Tint (#d0e9df) and Ink (#173b35).
- **Manuscript Ochre** (#ad7621, dark #b06b21): The English Language accent: primary buttons, source tab selection, mark chips and rubric emphasis, with Ochre Ink (#3e2911) on Ochre Tint (#ebddbd).

### Semantic (Marking Colours)
- **Marker Green** (#237b55, dark #55c193): Correct marks, done states, passing grades, "Finish" button; always with its wash (#dcebe3).
- **Marking Red** (#a33d3d, dark #e2685f): Errors, wrong answers, submit/discord actions, weak-topic edges and overdue chips, with its wash (#f1dddd).
- **Ledger Amber** (#98670f, dark #d9a441): Warnings, pending marking, accuracy "mid" pills and progressive hints, with its wash (#f0e5c5).
- **Examiner Blue** (#38678c, dark #6fa8d8): Informational notices, server-check feedback and editorial links, with its wash (#dfe9f1).

### Neutral
- **Desk Paper** (#f3f0e8, dark #16140f): The page itself — the only large background, with the squared-paper pattern printed on it.
- **Raised Paper** (#fbfaf6, dark #1d1a14): Panels, cards, buttons, nav hover — a sheet lifted onto the desk.
- **Shaded Paper** (#e9e6dc, dark #262119): Wells, tracks, letter tiles and quiet fills beneath raised paper.
- **India Ink** (#161713, dark #ece6df): All primary text, and the strongest structural rules (page-head underline, sidebar edge, exam bar).
- **Graphite** (#65675f, dark #a79e8e): Secondary text, mono labels, quiet metadata.
- **Ledger Rule** (#cbc8bd, dark #2e2921): Hairline borders, table rules, dividers.
- **Heavy Rule** (#8d8e85, dark #5f574c): The standard component border — panels, buttons, inputs, chips.
- **Blotting Paper** (#fffefa, dark #221e18): Input and answer-field backgrounds, a shade brighter than Raised Paper.
- **On Accent** (#ffffff): Text and icons on accent fills.

### Native Token Divergence (intentional, not normalized)
The Expo app is not "corrected" to the web hexes; it keeps its own slightly warmer token set on purpose. Native neutrals: paper #f5f3ed (dark #15140f), raised #fffefa (dark #211f18), shaded #ebe8df (dark #2a271f), ink #171813 (dark #f1ece4), quiet #66685f (dark #aaa293), line #d8d4c9 (dark #37332a), strong #aaa69b (dark #686055). Native semantic fills match the web in light mode (#237b55 / #98670f / #a33d3d / #38678c) but carry their own washes (#e0f0e7 / #f6eac8 / #f5e1df / #e2edf5) and brighter dark accents (#e0ac4c, #e8756c, #78adde). Native subject accents drift too: Maths Foundation #6c50d9 (tint #ebe6ff), Maths Higher #21805a (tint #dff3e9), English Language #b86612 (tint #fae8cf). Consume each platform's tokens in place and never mix the two sets on one screen.

### Named Rules
**The One Accent, One Surface Rule.** Each course owns exactly one accent — Exam Violet, Higher Green or Manuscript Ochre — spent on borders, fills and primary buttons. Accents never mix within a surface, and accent washes are never used outside their subject.

**The Wash Rule.** State never shouts. Semantic colour appears as a pale wash behind ink of the same hue, always paired with a border of the same colour and a text or position cue, so no state relies on colour alone.

## Typography

**Display Font:** Georgia (with "Times New Roman", serif)
**Body Font:** System sans (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif)
**Label/Mono Font:** System monospace (ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)

**Character:** A quiet serif carries the voice — headlines, big numbers and English source texts — while a plain system sans does the working prose and a stamped monospace does the labelling. The pairing reads like a well-set exam paper: serif authority, sans utility, mono bookkeeping.

### Hierarchy
- **Display** (Georgia 400, clamp(42px, 5vw, 70px), line-height 0.98, letter-spacing -0.05em): Page titles and the sign-in headline. Web only; the selector's marketing pages scale larger (clamp(48px, 7.4vw, 94px)).
- **Headline** (Georgia 400, 27px, -0.025em): Panel titles and section heads (h2, 21–46px by context).
- **Title** (Georgia 400, ~21px, 1.2): Card titles, docket titles, stat numbers at 38px with tabular numerals.
- **Body** (system sans 400, 15px, line-height 1.5–1.65): Working text, 13–15px in dense UI, 16–17px in editorial prose; serif body at line-height 1.78 for English source texts.
- **Label** (system mono 700–800, 8–11px, letter-spacing 0.07–0.09em, uppercase): Tags, chips, eyebrows, table headers, paper metadata.
- **Numeric** (Georgia 400, 38px, tabular-nums): Stat numbers, timer values, scores; maths answer inputs and timers force tabular figures.

**Native adaptation.** iOS and Android keep the mono labels and serif numerics, but display type is the system sans at weight 900 (h1 38px, line-height 43px, letter-spacing -1.2) with platform serif ("serif") reserved for scores and source text. This is intentional: web speaks in printed serif, native in confident system weight.

### Named Rules
**The Mono Label Rule.** Metadata is set in uppercase monospace at 8–11px with 0.07–0.09em tracking; mono never sets the sentences a learner must read as prose.

## Layout

The web app is a ruled desk: a 244px paper sidebar (72px collapsed between 761–900px) beside a content column padded 42px top / 48px sides / 70px bottom, with pages capped at 1260px. Panels breathe at 28px padding; stat grids auto-fit at minmax(176px, 1fr) with 10px gaps. The selector and course pages are editorial: a min(1180px, 100% − 48px) desk, two-column subject cards sharing 1px ink borders, and 1px-rule stat strips that split with border-left instead of gaps. English exams split question and source columns (0.8fr/1.35fr) until 1100px.

Mobile web (≤760px) collapses to a sticky top bar plus a fixed bottom tab bar with safe-area padding and blurred paper chrome; content padding drops to 20px/16px with 78px+ bottom clearance. Native screens are single-column at 20px padding with 18–20px gaps and 108px bottom clearance above the tab bar; the practice body caps at 760px width. Spacing steps in use: 4, 8, 10, 12, 14, 16, 18, 20, 24, 28, 34, 42, 48px — the frontmatter scale is the anchor set (4/8/12/16/20/24/28/42/48) and intermediate values exist where the grid demands.

## Elevation & Depth

**Borders are elevation.** Hierarchy is drawn, not cast: hairlines (Ledger Rule), stronger component edges (Heavy Rule), ink rules for structural breaks, tonal washes for state, and accent border-left rules for selection — every web surface sets `box-shadow: none` explicitly. The one glow is a status halo: the live dot sits in a 3px soft ring of Marker Green at 12% (18% in dark). Overlays are ink scrims (rgba(22, 23, 19, 0.48) light; pure black 55% dark) behind modals and reward dialogs, and sidebar/tab chrome floats on a blurred paper wash (backdrop-filter blur 12–14px, saturate 150%) rather than a shadow.

Native keeps the flat surface language but allows structural shadows on chrome only: dockets, mission heroes and the tab bar carry a soft 14px black shadow at 8–10% opacity (Android elevation 3–8). Nothing on the web casts a shadow.

### Shadow Vocabulary
- **Status halo** (`box-shadow: 0 0 0 3px rgba(35,123,85,0.12)`): Live-availability dots only; not a surface shadow.
- **Native chrome lift** (iOS shadow `rgba(0,0,0,0.08)`, radius 14, offset 0/6; Android elevation 3): Native dockets, hero cards and notices.
- **Native tab bar lift** (iOS shadow 10% radius 14 offset 0/-4; Android elevation 8): The rounded bottom tab bar only.
- **Ink scrim** (`rgba(22,23,19,0.48)` light, `rgba(0,0,0,0.55)` dark): Modal and reward backdrops.

### Named Rules
**The Borders Are Elevation Rule.** Hairlines, stronger edges, ink rules and tonal washes create hierarchy; shadows are reserved for native chrome and exceptional overlays, never for ordinary web surfaces.

## Shapes

Web working surfaces are square: 0 radius on panels, buttons, inputs, nav items, timers and modals — printed forms, not bubbles. Two exceptions are deliberate: 999px pills for chips, badges and status marks, and circles for seals and subject medallions (78px subject letters, 82px expertise seals). A 2px `--radius` token exists in the shared stylesheet as a bridge for legacy elements; it is not the working radius — new web surfaces are square. Native everyday surfaces round to 13–22px (fields 13px, buttons 14px, notices 16px, dockets 18px, heroes 20px, tab bar corners 22px), while native exam surfaces (source tabs, question map, segment controls) stay sharp and square like their web counterparts.

Edges do the structural work: 1px hairlines for tables and lists, the Heavy Rule border for standard containers, and solid India Ink rules for page-level seams (page-head underline, sidebar border, subject-grid top/bottom). Accent shows up as ink rules, not glow: 4px question-card top rules, 3–7px border-left dockets and plan rows, 5px paper-picker strips.

## Components

### Buttons
- **Shape:** Square on web (0 radius); rounded 14px native. Minimum heights: 42px web, 50px native.
- **Primary:** Subject accent fill, On Accent text, 1px border in the accent's subject ink, padding 10px 18px; disabled drops to 48% opacity.
- **Hover / Focus:** Hover lifts 1px with the ink edge unchanged; focus is a 3px accent outline with 3px offset, never a glow.
- **Secondary:** Raised Paper surface, Heavy Rule border, ink text; hover moves the border to India Ink and the background to Shaded Paper.
- **Destructive / Submit:** Marking Red variants — filled green is reserved for finishing papers (Marker Green), submit-style actions use the red wash with red ink.

### Chips
- **Style:** 999px pill, 1px Heavy Rule border, Raised Paper background, mono uppercase text; selected state uses subject Tint with subject Ink text and border.
- **State:** Unselected chips sit quiet; hover adds the accent wash; selected chips trade in tint plus ink.

### Cards / Containers
- **Corner Style:** 0 on web; 18–20px on native everyday surfaces.
- **Background:** Raised Paper over the paper pattern; state cards use semantic washes.
- **Shadow Strategy:** `box-shadow: none` on web (see Elevation & Depth); native chrome lift only.
- **Border:** 1px Heavy Rule; selected/active cards take the ink or subject-ink border.
- **Internal Padding:** 28px panels, 18–20px cards, 28px panel headers.

### Inputs / Fields
- **Style:** Blotting Paper background, 1px Heavy Rule border, 0 radius web / 13px native, mono uppercase label above.
- **Focus:** Border moves to the accent with a 3px accent outline offset 3px — visible, inked, unmissable.
- **Error / Disabled:** Errors render as Marking Red text on red wash with a red border; disabled controls drop to 48% opacity.

### Navigation
- **Style:** Flat list items on transparent paper; mono two-letter icon codes; 44px minimum rows.
- **Active:** Subject Tint background with subject Ink text and a 1px subject-ink border — drawn, not glowing.
- **Hover:** Border appears in Ledger Rule over Raised Paper.
- **Mobile / Native:** Bottom tab bars — fixed web bar with blurred paper background and safe-area padding; native tab bar rounds its top corners (22px) with the only structural shadow.

### Paper Docket (signature)
The printed working form: a Raised Paper card with a 1px Heavy Rule border, a 5–7px accent border-left strip (violet, green or ochre by subject; amber for warnings), a mono uppercase paper label, a serif title and quiet detail. Web pick-cards print the strip inside the left edge; native dockets round to 18px and carry the chrome shadow. State washes mark results: Marker Green wash for correct/complete, red wash for wrong or due, amber for pending.

### Progress Meters
Ruled tracks, not glossy bars: a Shaded Paper track (5–10px tall; the expertise track adds a 1px Heavy Rule border) with an accent fill, mono labels above, and tabular percentages. Native adds a 7–8px rounded track in the subject accent; fills animate width over 500ms ease.

## Do's and Don'ts

### Do:
- **Do** consume the shared tokens (`--paper`, `--ink`, `--accent`, `--subject-tint`, washes) from `study-desk.css` and each subject's `theme.css`; new UI never hardcodes colours.
- **Do** keep every colour legible in both themes: dark mode re-inks with its own warm paper and brighter accents, it is not a shadow of light mode.
- **Do** set state as wash + same-hue border + same-hue text, with a non-colour cue alongside (label, position, mark).
- **Do** use tabular numerals (`font-variant-numeric: tabular-nums`) for stats, timers, scores and answer inputs.
- **Do** keep hover printed: border darkens toward India Ink with a 1–2px lift and no shadow on web.
- **Do** respect `prefers-reduced-motion`: transitions and animations collapse to none.

### Don't:
- **Don't** use neon SaaS/dashboard styling: no glows on dark navy panels, no radial purple/pink gradients, no glassy floating cards — that is the retired legacy theme and the confirmed anti-reference.
- **Don't** shadow web surfaces: `box-shadow: none` is the normative web state; shadows belong to native chrome and exceptional overlays only.
- **Don't** round web working surfaces: 0 radius for panels, buttons, inputs and modals; reserve 999px pills for chips and badges.
- **Don't** mix subject accents within one surface, and don't use an accent's tint as a generic decoration outside its course.
- **Don't** rely on colour alone to communicate subject, state, correctness, readiness or progress.
