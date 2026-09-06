---
name: GCSE Study Desk 2
description: A calm learning studio for purposeful GCSE revision.
colors:
  paper: "#f5f6f2"
  raised: "#ffffff"
  muted: "#e9eeea"
  ink: "#183c37"
  quiet: "#52665f"
  line: "#cdd8d1"
  strong: "#81998c"
  positive: "#216342"
  positiveWash: "#e2f0e5"
  warning: "#815613"
  warningWash: "#fbefd5"
  negative: "#a33538"
  negativeWash: "#f9e5e5"
  info: "#315f86"
  infoWash: "#e5edf6"
  paper-dark: "#112b29"
  raised-dark: "#183633"
  muted-dark: "#21443e"
  ink-dark: "#eff5ed"
  quiet-dark: "#b4c9bf"
  line-dark: "#395b50"
  strong-dark: "#77978a"
  positive-dark: "#96dbad"
  positiveWash-dark: "#234939"
  warning-dark: "#f0cc83"
  warningWash-dark: "#4d4026"
  negative-dark: "#ffaaa6"
  negativeWash-dark: "#513232"
  info-dark: "#a7c9ee"
  infoWash-dark: "#253d52"
  primary: "#176557"
  primary-dark: "#92d9bb"
  primary-strong: "#104e43"
  on-primary: "#ffffff"
typography:
  display:
    fontFamily: "Fraunces, Georgia, Times New Roman, serif"
    fontSize: "clamp(32px, 3.4vw, 50px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "DMSans, Avenir Next, Avenir, Segoe UI, sans-serif"
    fontSize: "23px"
    fontWeight: 650
    lineHeight: 1.3
  body:
    fontFamily: "DMSans, Avenir Next, Avenir, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "DMSans, Avenir Next, Avenir, Segoe UI, sans-serif"
    fontSize: "13px"
rounded:
  control: "8px"
  surface: "14px"
spacing:
  step-4: "4px"
  step-8: "8px"
  step-12: "12px"
  step-16: "16px"
  step-20: "20px"
  step-24: "24px"
  step-32: "32px"
  step-48: "48px"
  step-64: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
  panel:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "24px"
---
# Design System: GCSE Study Desk 2

## Overview

**Creative North Star: “Learning studio”**

A clear working surface helps independent GCSE learners move from understanding to practice, recall, feedback and stronger evidence. The identity pairs a readable humanist sans with expressive serif invitations, quiet green neutrals and purposeful controls. Learning tasks receive space; statistics support a decision rather than dominate the screen.

This document records the implemented V2 system and replaces the V1 ruled-paper design. It is grounded in `docs/v2/direction.md`, `design-tokens/studio.json`, `website/clients/shared/v2/studio.css`, and `app/src/theme.ts` / `components.tsx`. The token JSON is the source for shared semantic colours; run `node scripts/sync-studio-tokens.mjs` after changing it. That generates web `tokens.css` and native `studio-tokens.ts`. The frontmatter is an extracted reference, not a separate runtime token source.

**Key characteristics:**

- Open sections and grouped topic rows, with contained surfaces for independent tasks.
- One clear next learning action, with supporting evidence close by.
- Shared light/dark neutrals across web and native.
- Readable metadata, sentence-case controls and non-colour state labels.
- Flat surfaces, restrained borders and minimal motion.

## Colors

The shared palette uses green-tinted paper, deep green ink and neutral rules. `paper`, `raised` and `muted` distinguish page, independent surface and inset areas. `ink` carries primary text; `quiet` supports secondary explanations; `line` and `strong` separate regions and controls. Each has an explicitly authored dark counterpart in the frontmatter and token JSON.

### Primary

Web actions use teal `primary`, with `primary-strong` for hover and `primary-dark` in dark mode. Dark filled actions use dark ink (`--on-accent: #12392b`), not white. Use the semantic CSS variables rather than literal values when implementing components.

### Subject identity

Native retains explicit subject accents: Foundation plum (#625187; dark #cfbfea), Higher teal (#176557; dark #92d9bb), English clay (#9b4936; dark #f1b9a4). Subject tints are defined beside them in `app/src/theme.ts`. Native primary buttons consume the selected subject accent. Web's shared primary action remains teal across courses. Subject names and tier labels carry identity independently of colour; do not imply these two platform choices are currently identical.

### Feedback

`positive`, `warning`, `negative` and `info` each pair with their corresponding `Wash` token. Correctness, pending marking, errors and information must also have meaningful words or icons. Never infer mastery from colour or present readiness as a predicted grade.

### Compatibility

Web tokens retain V1 names (`--paper-raised`, `--paper-muted`, `--line-strong`, `--subject-tint`, `--subject-ink`, and state washes) so existing exam and result components continue to work. Shared V2 CSS is loaded after the legacy theme. The retired squared-paper pattern, monospace metadata doctrine and mandatory square controls are not V2 guidance. Public and retained specialist screens still have local styling; consult the actual cascade before changing them.

## Typography

**Display:** Fraunces, with Georgia and serif fallbacks. **Body and controls:** DM Sans, registered as `DMSans`, with platform sans fallbacks. Font assets are local and include their licences; web uses `font-display: swap`. Native loads Fraunces and DM Sans through Expo, while some native body/heading components still use system typography.

- Web page titles: 400 weight, `clamp(32px, 3.4vw, 50px)`, 1.12 line-height, −0.025em tracking. The mobile learning-home invitation is 44px.
- Web section headings: 23px, 650 weight, 1.3 line-height. Smaller headings are 18px.
- Web body: 16px, 1.55 line-height; paragraphs use 1.6. Supporting introductions use 15px / 1.65 and a 700px maximum width.
- Metadata: readable sans, normally 13px, with no blanket uppercase transformation or letter spacing.
- Native shared page heading: Fraunces 36px / 43px, weight 400. Shared section heading is 24px; metadata is DM Sans 13px; fields are 16px and button text 15px.

Reserve the serif for invitations, expressive headings and suitable long-form content. Controls and essential instructions need the directness of sans. Retain tabular numerals where exam timers and marks already use them. Font scaling must remain enabled; a single screenshot is not proof that every large-text layout works.

## Layout

Desktop web has a 98px top context header, a 208px navigation rail and an open content canvas. Pages cap at 1280px with 42px top padding, responsive 22–64px side padding and 72px bottom padding. At 1500px the rail expands to 240px. At 1100px it contracts to 166px and contextual grids tighten.

At 760px and below, subject selection occupies a full header row, the five destinations become a fixed bottom navigation bar, and content loses the sidebar offset. Page padding becomes 28px 20px 110px, with safe-area clearance in the navigation. Topic groups and mission/context layouts reorganise into focused sequences rather than retaining desktop panes.

Native uses safe-area containers, scrollable focused tasks, five bottom tabs and full-screen lesson/practice routes. Shared scroll content has 20px padding and 18px gaps; route-specific tab clearance supplements it where required. Controls should meet the shared target policy: 44px web and 48px native; the common native button and input are 50px minimum. These are design targets, not a claim that every retained control has passed a device audit.

The shared spacing anchors are 4, 8, 12, 16, 20, 24, 32, 48 and 64. Existing component-specific values remain where content or platform constraints warrant them. Do not introduce a card solely to create spacing.

## Elevation & Depth

Ordinary V2 panels and controls are flat (`box-shadow: none`). Tonal surfaces, whitespace and a single border establish grouping. The native shared shadow style has zero opacity and zero Android elevation. Existing overlay and tab implementations may retain local treatments; do not extend those into routine content.

Motion tokens are 120ms quick and 180ms standard. They express the intended state-transition vocabulary, not an animation system applied universally to legacy screens. The web reduced-motion media query removes animations and transitions. Essential feedback must remain understandable without movement.

## Shapes

The shared anchors are an 8px control radius and 14px surface radius. Web panels use a 1px neutral border and 24px padding. Open topic rows and section dividers remain square. Small chips may use local radii without turning every item into a pill.

Native buttons and dockets use the shared 8px/14px anchors; existing fields use 13px and notices 16px. These are current compatibility values, not a second contradictory design system. Preserve content-specific exam structures where changing geometry could impair question reading or navigation.

## Components

### Navigation and search

Today, Learn, Practice, Reflect and Tutor are the shared conceptual destinations. Account and subject context stay separate from learning navigation. Desktop navigation uses labelled rows; mobile uses labelled bottom tabs. Web search is accessible through its button or Ctrl/Cmd+K. Search indexes the implemented subject content and tools; it is not a promise of full-text search across all historic chats and attempts.

### Buttons and fields

Primary web buttons use accent fill and on-accent text, an 8px radius, 10px 18px padding and 44px minimum height. Secondary buttons are transparent with a stronger border. Focus uses a 3px accent outline with 4px offset. Disabled states retain their native semantics; native buttons explicitly expose disabled accessibility state and use pressed opacity feedback.

Every field needs a visible label and useful validation near the action. Account study preferences use explicit save actions and error feedback; do not claim a successful save until the server confirms it. Native fields expose accessibility labels.

### Learning home and topic evidence

The home foregrounds a practical next session; a learner without evidence is invited to take a diagnostic. Personalisation and the week plan can be expanded without crowding out learning. Topic search and evidence filters reveal available learning paths. “Not practised”, “Needs attention” and “Strong” are evidence descriptions; lesson completion remains separate from answer accuracy. Explain thresholds and evidence counts rather than displaying unsupported mastery percentages.

### Lesson journey and reflection

Lesson journeys connect understanding, retrieval, practice and revisiting material. Retrieval prompts precede passive rereading; contextual tutor prompts can ask for another explanation. Reflect groups mistake review, saved paper results, weekly reflection and detailed evidence. Preserve original answers, worked solutions, review dates and error types in the notebook.

### Progress and feedback

Progress indicators need a name, a numerical or verbal interpretation, and an explanation of what changes them. Correctness and retry evidence must not collapse into a generic success colour. AI feedback is guidance; keep deterministic marking and rubric/self-marking alternatives available.

### Loading, empty, error and offline states

Use short, task-specific notices and a clear next action. Native shared `Notice` supports loading, error, offline, empty and success variants, with an alert role for errors; `Skeleton` supplies quiet placeholders. Web retained loaders and status components consume the shared palette. Errors should keep recoverable user work and offer retry where supported. Offline copy must describe cached availability honestly, not imply offline submission support.

### Focus, dialogs and announcements

Web focus mode reduces surrounding navigation and supports Escape to leave. Dialogs, notifications and retained confirmation flows must preserve focus management and dismissal semantics. Tutor output uses a polite live log. V2 targets WCAG 2.2 AA, but automated checks and limited simulator review are not certification or a substitute for keyboard, screen-reader and large-text testing across all workflows.

## Do's and Don'ts

### Do

- **Do** derive shared semantic colour changes from `design-tokens/studio.json` and regenerate both platform outputs.
- **Do** make one useful learning action obvious before showing optional setup or reward details.
- **Do** use clear UK English and preserve subject, tier, paper and account boundaries.
- **Do** pair colour with labels and expose the evidence behind learning claims.
- **Do** verify light/dark, empty/error, narrow-screen, keyboard and enlarged-text states when a component changes.
- **Do** reuse existing subject-specific marking and session logic behind the shared presentation.

### Don't

- **Don't** restore the V1 paper grid, tiny uppercase monospace metadata or heavy decorative side strips as a global motif.
- **Don't** make a statistics wall, generic SaaS card grid, gradient-heavy AI wrapper or copied gamification interface.
- **Don't** present readiness as a grade, accuracy as mastery, or AI advice as official AQA marking.
- **Don't** claim cross-device draft synchronisation, offline submission, exhaustive search or full accessibility compliance without implementation and verification.
- **Don't** force desktop and native into identical layouts or erase useful subject-specific learning tools.
