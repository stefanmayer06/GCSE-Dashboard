# Adding a subject to Circuit

This is the design-side checklist for a new subject (say AQA GCSE Biology or
English Literature). The server, routing and storage rules for a new
subject are in `website/AGENTS.md`. Follow those too: namespaced API routes,
per-user and per-subject storage, and a separate client bundle when marking
or visuals differ.

The existing three subjects are the worked examples:

| Subject | Hue | Strands or sections | Subject scene | Board |
| --- | --- | --- | --- | --- |
| Maths Foundation (`maths`) | blue | number, algebra, ratio, geometry, probability, statistics | Number factory | night |
| Maths Higher (`maths-higher`) | purple | Same strands as Foundation | Parabola wall and wedge | night |
| English Language (`english`) | tangerine | reading, writing | Open book and quotes | paper |

## 1. Identity: hue, glyph, strands

Choose a subject hue that is not already a subject's. Unused hue keys are
green, cyan, coral, rose and amber, but some of those are strand hues, so
pick one that stays distinct on the map. If you need a new hue:

1. Add it to `HUES` in `clients/shared/circuit/palette.js` with light and
   dark values. Dark values are lighter and a little less saturated.
2. Add `--hue-<name>` to both theme blocks in `circuit/tokens.css`: `:root`,
   the `prefers-color-scheme: dark` block and `:root[data-theme='dark']`.
3. Check contrast: white text must be legible on the hue in light mode, and
   the hue must be legible on `--c-night` in dark mode.

Then in `palette.js`:

```js
// SUBJECTS
biology: { id: 'biology', name: 'Biology', short: 'Biology', hue: 'green', glyph: 'B', illustration: 'biology' },

// STRANDS: one row per strand or section id the server returns
cells:     { hue: 'green', alt: 'cyan',  shapes: ['C', 'C', 'S'], scene: 'cells',     name: 'Cell biology' },
ecology:   { hue: 'amber', alt: 'green', shapes: ['W', 'C', 'W'], scene: 'ecology',   name: 'Ecology' },
```

- **Strand ids are global.** `STRANDS` is shared by every subject, so a new
  id must not collide with an existing one (`number`, `reading` and so on).
  Prefix if needed, for example `lit-poetry`.
- **Shapes carry character.** Circles feel soft and organic, squares
  structural, stars sharp and windmills dynamic. The first shape is the
  signature. Give each strand in a subject a different signature so their
  emblems look different at a glance.
- Update `subjectFromPath()` for the new URL prefix.

In `circuit/tokens.css`, add the identity block next to the others:

```css
:root[data-subject='biology'],
.app.biology-tier { --subject: var(--hue-green); --subject-alt: var(--hue-cyan); }
```

In the client's `index.html`, set `data-subject` in the pre-paint script
(copy `clients/english/index.html`) and draw the favicon from the subject
emblem's quadrants in its hues.

## 2. Graphics

All in `clients/shared/circuit/`. Rules are in [GRAPHICS.md](GRAPHICS.md).

- **Subject scene:** add a `<Subject>Scene()` to `Scenes.jsx` (viewBox
  400×290, one floating island, one hero object that says the subject, two
  or three props) and a branch in `SubjectScene`. Biology might use a
  microscope and a cell slide, and Literature an open anthology with
  character cards.
- **Strand scenes:** add a `case` to `StrandArt` for each new `scene` key
  (viewBox 220×150, 8×6 island).
- **Icons:** add any subject-specific nav icons to `Icon.jsx` (24px grid,
  2px strokes, one accent shape).
- **Emblems and tiles** need no work. They derive from `STRANDS`
  automatically.
- Add the new scenes to the graphics lab (`clients/shared/GraphicsLab.jsx`)
  and check both themes at `/<subject>/lab`.

## 3. Map and lessons

The map and lesson kit are shared components. Reuse them:

- **Learn page:** fetch the topic catalogue grouped by strand or section and
  render
  `<CourseMap groups={groups} recommendedId={recommendTile(groups)} />`.
  Each group needs `id` (a key in `STRANDS`), `name`, an optional `blurb`,
  and `topics[]` with `id`, `name`, `accuracy`, `answered` and `completed`.
  Stage and stars are derived from `accuracy` and `answered`.
  See `clients/english/src/pages/Learn.jsx`.
- **Topic page:** compose `LessonHeader`, `StageSection` (Watch, Learn,
  Practise, Master), `LessonExplainer`, `NotesDeck` and `MasteryPanel` from
  `clients/shared/LessonKit.jsx`. See either subject's `pages/Topic.jsx`.
- **Notes grammar:** topic notes use `{ t: 'p', text }`,
  `{ t: 'b', items }`, `{ t: 'f', title, text }` and
  `{ t: 'e', q, a }`. The automatic talk-through reads exactly this grammar,
  so a subject with notes gets a narrated explainer on every topic for free.
- **Shell:** `AppShell.jsx` takes `brand`, `nav` and `tierClass` props.
  Keep the HUD chips (streak, XP, level) and one volt action per screen.

## 4. Explainers

Details are in [VIDEO_AUTHORING.md](VIDEO_AUTHORING.md).

1. Create `clients/shared/explainer/library/<subject>/index.js` exporting
   `<SUBJECT>_EXPLAINERS` and `explainerForTopic` (copy the English index).
2. Register the library in three places so tooling sees it:
   `scripts/validate-explainers.mjs` (`libraries`), `GraphicsLab.jsx`
   (`ALL_EXPLAINERS`) and `scripts/art/doc-entry.jsx` (`library`).
3. Choose a board: `night` for procedural, chalk-style subjects and `paper`
   for reading-heavy ones.
4. Author the highest-value topics first: where a moving picture beats text,
   or where students commonly go wrong. Use two to four checkpoints each.
5. If the subject needs a new visual (a cell diagram, a timeline), add a
   primitive rather than drawing it with dozens of `path` elements. See
   "Adding a primitive" in VIDEO_AUTHORING.md.
6. Run `npm run explainers:check`.

## 5. Public pages

- Add a card to `selector/index.html` and a row to `selector/subjects.html`,
  using `data-art` slots for the art.
- Add the subject scene and mark to `ART` in `scripts/art/entry.jsx`, then
  run `npm run art:export`.
- Add a course guide page if the others have one, using `selector/course.css`.
  Set `--course-hue` for the subject like the existing
  `body:has(...)` rules.
- Never claim AQA endorsement. Keep the independent-tool note.

## 6. Verify and document

```bash
npm run build
npm test
npm run explainers:check
npm start              # then, in another terminal:
npm run test:ui        # plus new route checks for the subject in ui-tests/
```

- Test desktop and 390px for the selector and the new subject's dashboard,
  map, lesson, explainer and practice screens, in both themes.
- Add the subject's screens to `scripts/capture-design-shots.mjs`, run
  `npm run design:shots` and `npm run design:doc`, and commit the refreshed
  `design/` files.
- Update the subject tables in [DESIGN.md](DESIGN.md) and at the top of
  this file.
