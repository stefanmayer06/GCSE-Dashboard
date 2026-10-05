# Circuit design system (v6)

Circuit is the visual and interaction language for the selector, MathsMate
(Foundation and Higher) and EnglishMate. The HTML design doc
(`design/design-doc.html`, rebuilt with `npm run design:doc`) shows every
token, graphic, component and screen. This file explains the rules behind
them so the next change fits.

Companion guides:

- [GRAPHICS.md](GRAPHICS.md): emblems, level tiles, scenes, icons and Pip.
- [VIDEO_AUTHORING.md](VIDEO_AUTHORING.md): interactive explainer scripts.
- [NEW_SUBJECT.md](NEW_SUBJECT.md): the checklist for adding a subject.
- [brand/BRAND.md](brand/BRAND.md): the proposed Revisaurus name, logo and
  brand kit (not adopted yet).

## The idea

Revision works like a circuit you build. Each topic is a component (a
layered Shapez-style shape), the course map is the board, and practice is
the current running through it. Each reference contributed one idea:

| Reference | What we took | Where it lives |
| --- | --- | --- |
| Brilliant | Isometric level path, bold geometric headlines, navy night surface with one lime reward colour | `CourseMap.jsx`, `IsoTile.jsx`, landing hero |
| Khan Academy | Narrated chalkboard videos you can pause and question | `explainer/` (night board, Kalam annotations, checkpoints) |
| Mimo | Streak, pressable 3D buttons, visible progress, one question at a time | Header streak chip, `.btn-go`, lesson step bar, combo meter |
| Shapez | Shapes built from four quadrants, stacked in layers, carried on belts | `Emblem.jsx`, mastery layers, animated traces |
| Polly | A friendly guide that makes a chat feel like company | `Pip.jsx` (tutor avatar, checkpoints, empty states) |
| Duolingo · Credly · Pokémon | One app with five tabs; collectible companions that grow with real work | The app shell (Today, Learn, Practice, Creatures, Me) and the study creatures (`Critter.jsx`), which hatch and evolve Bronze → Silver → Gold → Legend |
| Coursera | Units, lessons and a sense of place in a course | Units as worlds; lesson stages Watch → Learn → Practise → Master |
| Substack | Calm long-form reading in a serif | Literata for English sources and notes |

## Subjects

| Subject | `data-subject` | Hue | Strands or sections | Board |
| --- | --- | --- | --- | --- |
| Maths Foundation | `maths` | blue | number, algebra, ratio, geometry, probability, statistics | night |
| Maths Higher | `maths-higher` | purple | Same as Foundation | night |
| English Language | `english` | tangerine | reading, writing | paper |

Adding one? Follow [NEW_SUBJECT.md](NEW_SUBJECT.md).

## Principles

1. **Earned, never faked.** Stars, emblem layers and readiness come only from
   marked answers on the server (`starsFor`, `layersForStage` in
   `circuit/palette.js`). Opening a page earns nothing.
2. **One next step.** Every screen answers "what now?" with one volt
   (`.btn-go`) button. Everything else is quieter.
3. **Ask before telling.** Explainers and worked examples make the learner
   commit to an answer before the method appears.
4. **Nothing is locked.** Revision is free-roam. The map recommends a tile
   (light beam + "Start" bubble) but never blocks one.
5. **Never colour alone.** Right and wrong carry a tick or a cross
   (`Mark.jsx`), stages carry words, and tiles carry glyphs.
6. **Calm streaks.** Rest days pause a streak and freezes protect it. Copy
   never shames a learner for a day off.
7. **Creatures are the progression.** There are no points, levels or badge
   names. Every kind of real work feeds one creature (`critters.js`), and
   finishing a lesson, round or paper shows what it fed
   (`CreatureGains`). Evolutions play once, on whichever screen you are.
8. **One thing at a time on a phone.** Today has one card with one button;
   lessons show one step and practice shows one question; everything else
   is one tap away on its own tab.

## Tokens

All tokens live in `clients/shared/circuit/tokens.css`. Consume them; never
hardcode a colour in a component.

- Surfaces: `--c-bg`, `--c-surface`, `--c-surface-2`, `--c-surface-3`,
  `--c-line`, `--c-line-strong`.
- Ink: `--c-ink`, `--c-ink-2`, `--c-muted`, `--c-faint`.
- Night stage (rail, heroes, explainer player, celebrations; the same in both
  themes): `--c-night`, `--c-night-2`, `--c-night-3`, `--c-night-ink`,
  `--c-night-muted`.
- Semantic: `--c-good`, `--c-bad`, `--c-warn`, `--c-focus`, `--c-primary`.
- Hue keys: `--hue-blue`, `-cyan`, `-purple`, `-amber`, `-green`, `-coral`,
  `-tangerine`, `-rose`, `-volt`, `-slate`. They mirror `HUES` in
  `circuit/palette.js`; change both together.
- Subject identity: `--subject`, `--subject-alt` plus derived
  `--subject-strong` and `--subject-wash`, set by `<html data-subject>`.
- Graphics: `--emblem-line`, `--emblem-ghost`, `--tile-*`, `--scene-*`.
- Creature ranks: `--rank-bronze`, `--rank-silver`, `--rank-gold`,
  `--rank-legend` (volt) for milestone badge frames.
- Radii `--r-sm` to `--r-xl`, shadows `--sh-1` to `--sh-3`, motion
  `--ease-out` and `--ease-spring`.

**Volt (`--hue-volt`) means "go" or "reward" only.** Use it for the primary
button, earned stars, mastered tiles and progress fills. Using it elsewhere
dilutes the signal.

### Themes

`<html data-theme="dark">` switches every token. The choice is stored under
the `gcse-theme` localStorage key and set before first paint by the inline
script in each `index.html`. Dark is its own palette (brighter hues, deep
night surfaces), not an inversion. Check every new surface in both themes.

The old `study-desk.css` and `theme.css` variables (`--bg`, `--card`,
`--accent` and so on) are remapped to Circuit tokens at the bottom of
`tokens.css`, so legacy structural rules still follow the theme. New code
should use `--c-*` and `--hue-*` directly.

## Type

Every face is self-hosted: `circuit/fonts.js` imports them through
@fontsource in the apps, and `selector/fonts/` vendors latin subsets for the
public pages. Do not add Inter, Roboto, Poppins, system-ui-only stacks or any
other default face.

| Token | Face | Job |
| --- | --- | --- |
| `--font-display` | Unbounded | Page titles, level names, the brand. Large and sparing. |
| `--font-ui` | Atkinson Hyperlegible Next | UI, body text and every numeral |
| `--font-num` | Atkinson Hyperlegible Next | Numbers in HUD chips, stats and rings. Unbounded's 0 reads as O. |
| `--font-mono` | Atkinson Hyperlegible Mono | Labels, answers, formulae, timers, eyebrows |
| `--font-read` | Literata | English sources, notes and passages on the board |
| `--font-hand` | Kalam | Hand annotation inside explainers and revealed methods only |

Scale tokens: `--t-hero`, `--t-h1`, `--t-h2`, `--t-h3`, `--t-body`,
`--t-small`, `--t-micro`. Eyebrows are mono, uppercase, 0.72rem and
letter-spaced 0.08em.

## CSS architecture

`clients/shared/circuit/circuit.css` is imported last in each client's
`main.jsx`, after `study-desk.css` and the subject `theme.css`:

| File | Owns |
| --- | --- |
| `tokens.css` | Every variable, both themes, subject identities, legacy bridge |
| `base.css` | Reset, buttons, chips, cards, graphics primitives and motion (the `@public` section is exported to the selector) |
| `shell.css` | Night rail (desktop), icon rail (tablet), floating five-tab bar (phone), focus mode |
| `overlays.css` | Celebrations, confetti, toasts, dialogs |
| `critters.css` | Study creature art, eggs and rank badges (graphics only) |
| `video.css` | Explainer player: board themes (`--b-*`), controls, checkpoints, captions |
| `learn.css` | Course map worlds, level tiles, lesson HUD, notes deck, mastery panel |
| `home.css` | Dashboard bento board, next-step card, streak week, creature collection |
| `pages.css` | Login, exam hall, results, notebook, chat, texts, choice tiles |
| `app.css` | Sheets, the subject switcher, tab headers, Today, welcome, Creatures, Me, Ask Pip, the Learn units and creature growth pieces |
| `focus.css` | Focus screens: the lesson stepper, one-at-a-time questions and feedback, the Practice hub, rounds, retries and the exam runner on phones |

The two clients stay separate bundles. Scope new global rules to a page
class, and keep `study-desk.css` for structure only; it no longer styles the
shell.

## Components

- **Buttons:** `.btn` (neutral), `.btn-primary` (night ink), `.btn-go`
  (volt, one per screen) and `.btn-small`. `.btn-go` has a 4px bottom shadow
  that collapses on `:active`, so it feels pressable.
- **Header chips:** the subject pill (opens the subject sheet), the streak
  chip and the partner avatar (`AppHeader` in `AppShell.jsx`). `HudChip` in
  `circuit/bits.jsx` remains for night surfaces.
- **Progress:** `Stars`, `ProgressRing`, `SegmentBar`, `WeekStrip`,
  `Confetti` in `circuit/bits.jsx`.
- **Answer tiles:** `.option-card` (Maths), `.mcq4-item` and `.tf-btn`
  (English) in `pages.css`. Selected uses `--subject` or `--c-focus`, correct
  uses `--c-good` plus a tick, wrong uses `--c-bad` plus a cross.
- **App shell** (`clients/shared/AppShell.jsx`): five tabs (Today, Learn,
  Practice, Creatures, Me), `AppHeader`, `useFocusMode()` for screens that
  take the whole display, and the providers for creatures and Ask Pip.
- **Sheets** (`Sheet.jsx`): bottom sheet on phones, centred panel on wider
  screens; traps focus and closes on Escape. Used by the subject switcher
  (`SubjectSheet.jsx`), Ask Pip and confirmations.
- **Today** (`TodayHome.jsx`): one "up next" card with the creature its
  button feeds, the week strip with today's task, and Ask Pip. A first visit
  shows the welcome (exam date, first egg); day one points at the
  10-question check.
- **Lesson kit** (`LessonKit.jsx`): `LessonFlow` (focus mode, four steps in
  the URL hash, Ask Pip with the question as context), `QuizStart`,
  `QuizProgress`, `QuizFeedback`, `WhyChips`, `QuizDone`, `NotesDeck`,
  `LessonExplainer`, `MasteryPanel` (stars, and Prismo for three-star
  topics), `PipPromo`, `EditorialNote`.
- **Practice kit** (`PracticeKit.jsx`): `RoundBar`, `RetryCard`,
  `Segmented`, `ConfirmSheet`, `PracticeLinks`, `RetryFlow` (notebook
  retries one at a time; Maths re-marks the real question) and `FoldPanel`
  (a panel that folds away: paper results show the score, what it fed and
  "What to work on next" first, with the question review, topics, strands
  and past papers folded; the notebook folds "Coming up" and "Mastered" and
  previews five due rows). On phones fold panels start closed; from 761px
  the main one opens.
- **Course map** (`CourseMap.jsx`): units that fold (the suggested unit
  opens), topic search, an "up next" card, the zigzag tile path and
  `recommendTile(groups)`. English shows Skills | Texts tabs.
- **Creatures** (`creatures.jsx`, `CreaturesPage.jsx`, `Milestones.jsx`):
  the provider recomputes tiers from evidence (`critters.js`), plays
  evolutions app-wide (held while another celebration is open), and keeps
  the partner choice. `CreatureGains` and `GrowthMeter` show growth. The
  only browser storage is the partner choice and a per-user "last tiers
  shown" cache that decides whether to play an evolution.
- **Ask Pip** (`PipChat.jsx`): `PipChat`, `PipProvider`/`usePip` (opens the
  sheet anywhere) and `AskPipButton`. Never shown in timed papers.
- **Me** (`MePage.jsx`): numbers, install card, exam date and plan
  settings, dark mode, help and sign out.

## Layout

- Desktop: a night rail (`--rail-w`, 252px) on the left and content up to
  about 1180px.
- Tablet (761–1100px): the rail collapses to 92px of icons.
- Phone (≤ 760px): a floating five-tab bar at the bottom, and each tab draws
  its own header (subject pill, streak, partner). Screens fit in one or two
  phone heights: Today shows one card, Learn shows one unit open.
- Focus mode (lessons, rounds, retries, papers, Ask Pip page): no tab bar or
  rail; a close button and progress sit in a sticky top bar, and the next
  action sticks to the bottom on phones.
- Installable: `selector/manifest.webmanifest`, `selector/icons/` and
  `selector/sw.js` (network-first pages, cached hashed assets, never `/api`).
  The home-screen app opens on the last subject used.
- Touch targets are at least 44px. Always test at 390px wide.

## Motion

- Durations: 140ms (press), 240ms (hover and state), 420ms (enter), 700ms
  (celebration). UI uses `--ease-out`; rewards use `--ease-spring`.
- One celebratory moment per success: emblem tiers spring in and the
  quadrant confetti bursts once.
- Circuit traces animate like belts only between started tiles.
- `prefers-reduced-motion: reduce` collapses animations to their end frame,
  explainer tweens snap (`frameAt(..., { reducedMotion: true })`) and
  confetti is hidden.

## Accessibility

- Atkinson Hyperlegible for all UI text and numbers.
- Decorative SVGs are `aria-hidden`; pass `title` to make one an image.
- Explainers have captions on by default, a full transcript, keyboard
  shortcuts (space, ←/→, J/L, C, M) and tap targets reachable with Tab and
  Enter.
- Visible focus rings in both themes. The rail keeps its accessible names
  when collapsed.

## Regenerating the design doc

```bash
npm run build && npm start                          # terminal 1 (JSON driver)
CHROMIUM_PATH=/opt/pw-browsers/chromium npm run design:shots   # optional env
npm run design:doc                                  # writes design/design-doc.html
```

`design:shots` signs up a throwaway local learner, seeds some marked
practice and captures the 13 screens in `design/shots/`. `design:doc`
renders every graphic straight from the React components, so the doc can't
drift from the code. It also writes `design-doc.fragment.html` (no
`<html>` wrapper) for hosts that add their own.
