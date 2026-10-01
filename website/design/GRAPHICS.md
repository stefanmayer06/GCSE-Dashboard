# Circuit graphics guide

Every graphic in the product is custom, hand-built SVG in React. There are no
stock illustrations, no icon fonts and no emoji. This guide explains how each
family is built so new ones match. Check your work in the live graphics lab
at `/<subject>/lab` (signed in, not in the nav) in both themes.

All source lives in `clients/shared/circuit/`.

## Shared rules

1. **Colour comes from hue keys, never hex.** Use `hueVar('blue')`
   (→ `var(--hue-blue)`) so art follows the theme. Hue keys are listed in
   `HUES` in `palette.js` and mirrored as `--hue-*` in `tokens.css`.
2. **Outlines use `var(--emblem-line)`.** It is the night ink in light mode
   and near-black in dark mode, which gives graphics their "sticker" edge.
3. **Shade by mixing, not by new colours.** Isometric sides use
   `shadeOf(color, 74)` (left face) and `shadeOf(color, 54)` (right face)
   from `iso.js`. That mixes the hue with `--tile-shade`, so shading follows
   the theme.
4. **Decorative by default.** Components render `aria-hidden` unless you
   pass `title`, which turns them into `role="img"`.
5. **Unique ids.** When a graphic needs a gradient or clip id, use React's
   `useId()` (see `IsoTile.jsx`). The static exporters pass an
   `identifierPrefix` so ids never collide on one page.
6. **Animation in CSS, geometry in attributes.** Position with an outer
   `<g transform>` and animate an inner `<g className>`. A CSS transform
   on the same element replaces its SVG `transform` attribute. Every
   animation needs a `prefers-reduced-motion` fallback (see the graphics
   section of `base.css`).

## Palette and shape grammar (`palette.js`)

This file answers "what colour and shape is this subject, strand or topic?"

- `SUBJECTS`: id, name, short name, hue, glyph and illustration per subject.
- `STRANDS`: per strand or section, a signature `hue`, an `alt` hue, a
  `shapes` vocabulary and a `scene` key. The first shape is the signature
  and appears most often.
- `emblemLayers(topicId, strandId)`: four layers of four quadrants each,
  derived from an FNV-1a hash of the topic id, so a topic always draws the
  same emblem. Layer 0 is the identity. Layer 3 mixes in volt as the crown.
  Odd seeds mirror opposite quadrants so emblems stay legible at 24px.
- `layersForStage(stage)`: new → 0 (blueprint), learning → 1,
  developing → 2, secure → 3, mastered → 4.
- `starsFor(accuracy, answered)`: 1 star at 40%, 2 at 70%, 3 at 90% with 5+
  answers. This matches `masteryStage()` on the server.

### Quadrant shapes (Shapez grammar)

A layer is four quadrants in Shapez order: top-right, bottom-right,
bottom-left, top-left. Each is one of:

| Code | Shape | Feel |
| --- | --- | --- |
| `C` | Circle quarter | Soft, continuous: number, reading |
| `R` | Square corner | Solid, structural: geometry, statistics |
| `S` | Star point | Sharp, surprising: probability, geometry |
| `W` | Windmill blade | Dynamic, turning: algebra, writing |

`quadrantPath(shape, r)` in `Emblem.jsx` draws one quadrant in the top-right
position; the layer rotates it by 90° for each index.

## Emblem (`Emblem.jsx`)

```jsx
<Emblem topicId="fractions" strand="number" stage="secure" size={48} />
<Emblem topicId="x" strand="algebra" layers={2} ring={false} />   // explicit layer count
<StrandBadge strand="reading" size={26} />                          // strand's signature, 2 layers
```

Props: `topicId`, `strand`, `stage` or `layers`, `size`, `ring` (defaults on
at 4 layers), `title`, `spin`. Layers scale 1 → 0.72 → 0.48 → 0.28 and stack
from the centre. New topics show a dashed blueprint on a ghost disc
(`--emblem-ghost`). Mastered adds the rotating dashed volt ring.

## Level tile (`IsoTile.jsx`)

The Brilliant-style path node: a 2:1 rhombus slab (viewBox `0 0 120 112`, top
face centre `(60,44)`, half-width 46, half-height 23, depth 16) with the
topic emblem projected onto the top face by
`matrix(0.3 0.15 -0.3 0.15 60 44)`.

```jsx
<IsoTile topicId="fractions" strand="number" hue="blue" state="started" stage="developing" size={136} />
```

| `state` | Look |
| --- | --- |
| `new` | Neutral slab (`--tile-new-top`), blueprint emblem. Never locked. |
| `current` | Subject hue plus a light beam. The recommended step. |
| `started` | Subject hue, emblem layers from `stage` |
| `done` | Lesson complete: tick medallion (`glyph="check"`) |
| `mastered` | Volt top face and crown ring |
| `boss` | Timed paper: darker slab, crown glyph |

`glyph` can force `check`, `crown` or `play`. To add a face glyph, add a
branch to `FaceGlyph`. Draw it in the flat, unprojected square space, centred
on 0,0 and about ±34 units, and wrap it in `<g transform={PROJECT}>`.

## Isometric kit (`iso.js`) and scenes (`Scenes.jsx`)

```js
const iso = makeIso({ ox: 110, oy: 40, u: 13 }); // origin in px, u = px per world unit
iso.P(x, y, z)                  // world → screen [x, y]
iso.box(x, y, z, w, d, h)       // { top, left, right } polygon point strings
iso.topMatrix(x0, y0, z)        // draw flat 2D art onto a top face
iso.leftMatrix / rightMatrix    // … onto the side faces
```

World axes: +X runs right and down, +Y runs left and down, +Z is up. Inside
`Scenes.jsx`, `Box` renders a shaded box, `Island` renders the floating
ground slab (`--scene-ground`, `--scene-ground-inset`) and `FaceText` writes
on a face.

Three scene families exist:

- `SubjectScene({ subject })`, viewBox 400×290: the Foundation number
  factory, the Higher parabola wall and wedge, and the English open book with
  quote bubbles. Used on selector cards, login and dashboard.
- `StrandScene({ strand })`, viewBox 220×150: one small island per strand
  (`number`, `algebra`, `ratio`, `geometry`, `probability`, `statistics`,
  `reading`, `writing`). Used on map world banners and the public course
  pages. The `scene` key in `STRANDS` picks the `case` in `StrandArt`.
- `CircuitHero`, viewBox 500×330: the landing and login island with four
  rising tiles, a belt trace and floating quadrant shapes.

### Drawing a new strand scene

1. Add a `case '<scene>':` to `StrandArt`. Start from `base` (an 8×6
   island) and keep objects inside x 1–7 and y 1–5 so nothing overhangs.
2. Use the strand's `main` and `alt` hues. Metal, paper and glass come from
   `--scene-metal`, `--scene-paper` and `--scene-glass`.
3. Make one big readable object and one or two small props. It must read at
   110px wide on a phone.
4. Stroke everything with `LINE` at 1.2–1.6 and use round joins.
5. Check the scene in the lab in both themes, then run `npm run art:export`
   if the public pages use it.

## Icons (`Icon.jsx`)

A 24px grid, 2px round strokes in `currentColor` and exactly one filled
accent shape per icon (`className="i-accent"`), which picks up
`--icon-accent`. Add an icon as a new key in `ICONS`:

```jsx
flag: (
  <>
    <path d="M6 21V4" />
    <path className="i-accent" d="M6 4h11l-2.5 4L17 12H6z" />
  </>
),
```

`ICON_NAMES` updates automatically, and the lab and design doc list every
icon. An unknown name falls back to `sparkle`.

## Pip (`Pip.jsx`)

The guide: a round volt body with a quadrant belt buckle and a star
antenna. Moods are `happy`, `think`, `cheer`, `wow` and `calm`. Only the eyes
and mouth change, so Pip reads at 24px. Pass `bob` for the idle float.

Use Pip at checkpoints, empty states, the tutor and celebrations. Never put
Pip on dense working screens such as the exam hall. Pip colours come from
`--pip-*` tokens.

## Study creatures (`Critter.jsx`)

Milestones are eight original, collectible creatures. Each is fed by one
evidence track and evolves through four ranks. The evidence rules live in
`clients/shared/critters.js`; this component only draws.

```jsx
<Critter id="ember" tier={2} size={96} />                 // standalone, 120×120 art box
<Critter id="quill" tier={0} progress={0.7} />             // tier 0 = egg; cracks at 30/60/90%
<Critter id="tock" tier={3} silhouette />                   // locked form: "who's that?"
<Critter id="redo" tier={2} mood="joy" />                   // happy face when petted
<CritterBadge id="prismo" tier={3} toNext={0.4} size={120} /> // rank badge (Credly-style)
```

| Creature | Evidence | Hues |
| --- | --- | --- |
| Ember (fox) | Day streak | amber / tangerine |
| Quillby (hedgehog) | Marked answers | blue / cyan |
| Tock (owl) | Timed papers | purple / blue |
| Rexam (dinosaur) | Paper average | coral / amber |
| Tortile (tortoise) | Topics explored | green / cyan |
| Prismo (crystal beetle) | 3-star topics | cyan / purple |
| Redo (phoenix chick) | Notebook mistakes fixed | rose / tangerine |
| Memmoth (mammoth) | Memory checks passed | slate / cyan |

- **Hues** come from `CRITTER_HUES` in `palette.js` and reach the art as
  `--cr-main` / `--cr-alt`. `critters.css` derives `--cr-light` (belly),
  `--cr-deep` and `--cr-side` (shading, mixed with `--tile-shade`) and
  `--cr-wash` (badge ground), so both themes follow.
- **Evolutions add parts, never replace the body.** Tier 1 is small
  (`CRITTER_SCALE`), each tier adds one readable feature (ears, quills,
  wings, spikes, tiles, gems), and Legend (tier 4) adds volt accents,
  a crown or halo and orbiting sparkles. Volt is reserved for Legend.
- **Badges** are a hexagon medal whose frame grows with rank: Bronze plain,
  Silver rivets, Gold wings, Legend crown and a spinning volt halo. Metals
  are the `--rank-*` tokens. The ribbon shows one star per rank. Tier 0 is
  a dashed nest with the egg and a volt hatch ring.
- **Motion:** breathing body, blinking eyes, wagging tails, rocking eggs
  (faster when close to hatching). All in `critters.css`, all off under
  `prefers-reduced-motion`.
- **Adding a creature:** add its hues to `CRITTER_HUES`, a draw function to
  `ART` in `Critter.jsx` (keep the ground at y≈106 and faces reading at
  44px), and its evidence row to `CRITTERS` in `critters.js`. Check it in
  the lab at every tier, as a silhouette and as a badge, in both themes.

## Small bits (`bits.jsx`) and `Mark.jsx`

`Stars`, `HudChip`, `ProgressRing`, `SegmentBar`, `Confetti` (quadrant
shapes in hue keys), `WeekStrip` (day states `done`, `rest` and
`open`) and `Mark` (tick or cross with a text label, replacing ✓/✗ emoji).

## Public pages (no React)

The selector, subjects, course and legal pages in `selector/` ship without
React. `npm run art:export` renders the graphics listed in
`scripts/art/entry.jsx` to `selector/art.js`, which fills every
`<span data-art="name">` placeholder. It also writes
`selector/circuit-public.css` (fonts, `tokens.css` and the `@public` section
of `base.css`). To use a new graphic on a public page:

1. Add it to `ART` in `scripts/art/entry.jsx`.
2. Put `<span data-art="your-name" aria-hidden="true"></span>` in the HTML.
3. Run `npm run art:export` and commit both generated files.

## Checklist for a new graphic

- [ ] Colours from hue keys or tokens only. Outline `--emblem-line`.
- [ ] Looks right in light and dark themes (`/lab`, toggle in the rail).
- [ ] Reads at its smallest size on a 390px phone.
- [ ] `aria-hidden` unless it carries meaning, then `title`.
- [ ] Motion is in CSS with a reduced-motion fallback.
- [ ] Added to the lab (`GraphicsLab.jsx`) and, if public, `art:export`.
- [ ] `npm run design:doc` still builds (it renders every family).
