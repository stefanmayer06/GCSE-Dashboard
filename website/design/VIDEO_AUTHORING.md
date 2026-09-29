# Authoring interactive explainers

Explainers are the "short videos" on every lesson's Watch stage. They take
Khan Academy's narrated chalkboard and make it interactive: the board is live
SVG rendered from a script, so learners can pause and play with it, and the
story stops at checkpoints until they answer.

Explainers ship no video or audio files. A script is plain data, so it stays
editable, reviewable in a diff, captioned and narrated by construction.

- Engine: `clients/shared/explainer/engine.js` (compile, `frameAt`, answer
  checking)
- Board primitives: `clients/shared/explainer/primitives.jsx`
- Player UI: `clients/shared/explainer/Player.jsx` (styles in
  `circuit/video.css`)
- Narration: `clients/shared/explainer/narration.js` (browser speech)
- Fallback for unscripted topics: `clients/shared/explainer/autoscript.js`
- Library: `clients/shared/explainer/library/<subject>/*.js`

## How a lesson picks its explainer

`pages/Topic.jsx` calls `explainerForTopic(topicId)` from the subject's
library index. The first script whose `topics` array contains the id wins.
If none matches, `LessonExplainer` builds an automatic talk-through from the
topic's notes (`autoScript`), so every topic has something to watch. An
authored script always beats the fallback, so write one for the topics where
seeing it move really helps.

## Script shape

```js
// clients/shared/explainer/library/maths/fractions-of-an-amount.js
export default {
  id: 'fractions-of-an-amount',   // unique across all libraries
  topics: ['fractions'],          // topic ids this teaches (server topic ids)
  title: 'Fractions of an amount',
  summary: 'One sentence for the poster.',
  hue: 'blue',                    // hue key for accents
  board: 'night',                 // 'night' (chalkboard) or 'paper' (whiteboard)
  scenes: [
    {
      id: 'question',
      title: 'What it asks',      // chapter name in the scrubber
      play: [ /* optional sandbox controls, see below */ ],
      beats: [
        { say: 'Picture twenty-eight as one long bar.',
          add: [{ id: 'bar', type: 'bar', x: 150, y: 225, w: 640, h: 84, parts: 1, total: 28, anim: 'slide' }] },
        { say: 'The bottom number tells us how many equal parts.',
          set: [{ id: 'bar', parts: 4, tween: 1.6 }] },
        { ask: { kind: 'choice', prompt: 'How much goes into each part?', options: ['4', '7', '12'], answer: '7',
                 hint: 'Share 28 into 4 equal parts.', explain: '28 ÷ 4 = 7.' } },
        { say: 'Seven in each part.', set: [{ id: 'bar', each: true }], pulse: ['bar'] },
      ],
    },
  ],
};
```

Then add the import to `library/<subject>/index.js` and run
`npm run explainers:check`.

## Beats

A beat is one narrated step. Its duration is `dur`, or it is estimated from
`say` at about 2.5 words a second, with a 2.2 second minimum.

| Field | Meaning |
| --- | --- |
| `say` | Narration and caption text. Write it to be heard: "twenty-eight", not "28/". |
| `caption` | Optional different caption (defaults to `say`) |
| `dur` | Seconds. Required if there is no `say`. |
| `wait` | Seconds of stillness before the beat starts |
| `add` | Elements to place: `{ id, type, ...props, anim?, delay?, in? }` |
| `set` | Tween props on live elements: `{ id, ...props, tween?, delay?, easing? }` |
| `remove` | Element ids to fade out |
| `pulse` | Element ids to pulse once, to draw the eye |
| `camera` | `{ x, y, w, h }`, `{ zoom, cx, cy }` or `'reset'`. `cameraDur` sets the move time. |

- **Enter animations** (`anim`): `fade` (default), `pop`, `slide`, `drop`,
  `draw` (strokes draw on: lines, paths, rects, circles, arcs, triangles,
  number lines), `write` (text types out) and `none`. `in` sets the enter
  time (0.6s default) and `delay` offsets within the beat.
- **Tweens**: numbers tween, equal-length numeric arrays tween element-wise
  and anything else switches halfway. `easing` is `inOut` (default), `out`,
  `linear` or `spring`. The default `tween` is 0.8s.
- Evaluation is a pure function of time, so scrubbing, replay and reduced
  motion all work with no extra code. Never rely on state outside the script.

## Checkpoints

A beat with `ask` stops the clock until the learner answers. The next beat
starts 0.05s later so its changes (often the answer) never show while the
question is open. A second wrong try reveals the answer, and "Skip" (before
trying) or "Show me" (after one try) reveals it early. Every checkpoint
takes `prompt`, `hint` (shown after a wrong try), `explain` (shown after a
right answer or a reveal) and optional `right` (praise, default "Yes!").

| `kind` | Extra fields | Notes |
| --- | --- | --- |
| `choice` | `options`, `answer` (string or array) | `answer` must be one of `options` |
| `number` | `answer`, `tolerance?`, `unit?`, `placeholder?` | Ignores `£`, `%`, commas and spaces |
| `tap` | `targets`, `answer`, `answerText?` | Targets are element ids (`chip`, `card`) or `'<wordsId>:<wordIndex>'` for single words |
| `slider` | `bind: { id, prop }`, `min`, `max`, `step`, `start`, `answer`, `tolerance?`, `format?` | Drives a live prop while the learner drags. `format` uses `{v}`. |
| `reflect` | none | "Try it first": an optional, unsaved attempt box, then "Reveal the method". No marking. |

Word indices come from splitting the passage on whitespace, starting at 0.
Keep a comment listing them at the top of English scripts, as in
`zoom-into-a-word.js`. Tap prompts sit below the board, so they never cover
a target.

## Sandbox (`play`)

Give a scene `play` controls and, while the learner is paused in that scene,
sliders appear under the board that drive element props live:

```js
play: [
  { label: 'Gradient m', id: 'ax', prop: 'm', min: -3, max: 3, step: 0.5, value: -0.5 },
  { label: 'Blocks shaded', id: 'bar', prop: 'fill', min: 0, max: 12, step: 0.5, value: 3.5, format: '{v} × 10%' },
],
```

Invite it in the narration ("Pause here and drag the sliders…"). Primitives
with shorthand props make good sandboxes: `axes` (`m`, `c`, `qa`, `qb`,
`qc`), `bar` (`parts`, `fill`), `balance` (`tilt`) and `pie` (`needle`).

## Board and colours

The stage is 960×540 user units. Keep text 40 units clear of the edges,
because Pip usually sits bottom-right around (820–860, 420–450).

Colour props take board names (`ink`, `muted`, `bg`, `panel`, `good`, `bad`),
any hue key (`blue`, `volt`…) or a literal CSS colour. Board names resolve to
`--b-*` tokens in `video.css`, which differ between the `night` and `paper`
boards. Font keys: `display`, `ui`, `mono`, `hand` (Kalam annotations) and
`read` (Literata passages).

House style:

- Maths uses the `night` board: chalk-like ink, volt for the answer, `hand`
  for working.
- English uses the `paper` board: Literata passages, hue highlights on
  words, chips for connotations.
- Show one idea per beat. Beats of 6–12 seconds read best.
- Ask something at least every 30–40 seconds. Aim for 2–4 checkpoints and a
  total of 40–70 seconds of narration.
- Prefer original example sentences and numbers. Never copy past-paper text.

## Primitives

All positions are stage units. Common optional props: `opacity`, `color`.

| Type | Key props |
| --- | --- |
| `text` | `x, y, text, size=40, fontKey='display', color, anchor, weight, italic, lh`. Use `\n` for lines. `anim:'write'` types it. |
| `frac` | `x, y, n, d, size=48, color` |
| `rect` | `x, y, w, h, r=14, fill='panel', stroke='ink', sw=3, dash` |
| `circle` | `x, y, r, fill='none', stroke='ink', sw, dash` |
| `line` / `arrow` | `x1, y1, x2, y2, color, sw=4, dash, label, labelDx, labelDy`. `arrow` adds a head, or set `head: true` on a line. |
| `path` | `d, color, sw, fill, dash` |
| `point` | `x, y, r=8, color='volt', label, labelDx, labelDy, anchor` |
| `arc` | `cx, cy, r, a0, a1 (degrees), color='volt', sw, label, labelR, fill` |
| `bar` | `x, y, w, h, parts, fill, color, total, each, labels[], fillColors[], label`. A bar model. `each:true` labels parts with total ÷ parts. |
| `numberline` | `x, y, w, min, max, step, labelEvery, marks[{v,label,color}], jumps[{from,to,label,color}], point, pointLabel, format` |
| `axes` | `x, y, w, h, xmin..ymax, step, grid, lines[{m,c,color}], curves[{a,b,c,color}], points[]`, or shorthand `m, c` / `qa, qb, qc`, plus `equation:'line'|'quad'`, `showRoots`, `showIntercept`, `riseRun` |
| `tri` | `x, y, a, b, color='green', labels{}, squares, areas{}, right` (right-angled triangle, optional squares on sides) |
| `dots` | `x, y, rows, cols, gap, r, color, alt, highlight, groupEvery` |
| `grid` | `x, y, cols, rows, cell, fill, color` (area and percentage grids) |
| `words` | `x, y, w, text, size=32, fontKey='read', lh, highlights[{from,to,color}], underline[], dim`. Measured word-wrap. Words are tap targets. |
| `chip` | `x, y, text, color, size, solid`. Centred pill. Can be a tap target. |
| `callout` | `x, y, text, tx, ty, color='volt', size` (label with a leader line to tx, ty) |
| `pie` | `x, y, r, sectors[{v,color,label}], needle` (degrees) |
| `balance` | `x, y, width, left[], right[], tilt, color` (two-pan equation balance) |
| `emblem` | `x, y, size, topic, strand, layers` |
| `pip` | `x, y, size, mood` (`happy`, `think`, `cheer`, `wow`, `calm`) |
| `card` | `x, y, w, h, title, body, color, size, fontKey='mono'`. Framed note. Can be a tap target. |

Adding a primitive:

1. Write a pure renderer in `primitives.jsx`:
   `({ id, props, enter, exit, anim, tap }) => <g>…</g>`.
2. Register it in `RENDERERS`.
3. Add its name to `ELEMENT_TYPES` in `engine.js`, so the validator and the
   design doc know it.
4. Add a row to the table above.

## Narration and captions

`narration.js` reads each beat with the device's speech engine and prefers
British voices. `spokenText` makes maths readable ("3/4" becomes "3 over 4",
"x²" becomes "x squared"). The clock waits for a beat's speech to finish only
if the voice actually started, so devices without voices fall back to
caption timing. Captions are on by default and sit in a strip under the
board. The transcript panel lists every beat. Rate, captions and voice
preferences are stored under the `gcse-explainer-prefs` localStorage key (a
UI preference only).

Keyboard: space or K plays and pauses, ←/→ seek 5s, J/L seek 10s, C toggles
captions and M toggles the voice.

## Checking your work

1. `npm run explainers:check` validates every script without a browser. It
   catches unknown types, `set`/`remove`/`pulse` on missing ids, duplicate
   ids, checkpoints without answers, choice answers not in `options`, tap
   targets that don't exist or run past the passage, and slider binds to
   missing elements.
2. Open `/<subject>/lab`, pick the script and play it in both themes and at
   390px. Scrub every chapter and answer every checkpoint wrong once.
3. Open the real lesson (`/<subject>/learn/<topicId>`) to see it in context.
4. If it is one of the scripts shown in `design:shots`, recapture the shots.
