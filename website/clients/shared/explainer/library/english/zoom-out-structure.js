// Explainer: Analysing structure (English · Reading · structure)
// Idea: language is the zoomed-in view; structure is the zoomed-out view
// of where the writer points your attention. Original practice outline.
const X = 250;
const W = 600;
const H = 96;
const Y = [36, 156, 276, 396];

export default {
  id: 'zoom-out-structure',
  topics: ['structure'],
  title: 'Zoom out: the shape of a text',
  summary: 'Pull the camera back from a single paragraph to see how a writer moves your focus and builds tension.',
  hue: 'tangerine',
  board: 'paper',
  scenes: [
    {
      id: 'close',
      title: 'Zoomed in',
      beats: [
        {
          say: 'When you analyse language, you’re zoomed right in on words. This paragraph describes a harbour at dawn.',
          camera: { zoom: 2, cx: X + W / 2, cy: Y[0] + H / 2 },
          cameraDur: 0,
          add: [
            { id: 'c1', type: 'card', x: X, y: Y[0], w: W, h: H, body: 'Dawn. Gulls wheel above the nets;\nthe whole harbour is calm and wide.', color: 'amber', size: 22, fontKey: 'read', anim: 'fade' },
            { id: 'c2', type: 'card', x: X, y: Y[1], w: W, h: H, body: 'One small boat. Mara unties the rope,\nher breath quick in the cold.', color: 'tangerine', size: 22, fontKey: 'read', anim: 'fade' },
            { id: 'c3', type: 'card', x: X, y: Y[2], w: W, h: H, body: 'Out past the wall, the sky bruises.\nThe engine coughs. Then nothing.', color: 'rose', size: 22, fontKey: 'read', anim: 'fade' },
            { id: 'c4', type: 'card', x: X, y: Y[3], w: W, h: H, body: 'The harbour again: the same nets,\nthe same gulls. One mooring empty.', color: 'purple', size: 22, fontKey: 'read', anim: 'fade' },
          ],
        },
        {
          say: 'Structure is the zoomed-out view. Pull back and look at the whole text: where does the writer take your attention?',
          camera: 'reset',
          cameraDur: 2,
          add: [{ id: 'pip', type: 'pip', x: 900, y: 440, size: 90, mood: 'wow', anim: 'pop', delay: 1.6 }],
        },
      ],
    },
    {
      id: 'focus',
      title: 'Follow the focus',
      beats: [
        {
          say: 'It opens wide, on the whole harbour. Then something changes.',
          add: [{ id: 'l1', type: 'chip', x: 132, y: Y[0] + H / 2, text: 'wide opening', color: 'amber', size: 18, anim: 'pop' }],
          pulse: ['c1'],
        },
        {
          ask: {
            kind: 'tap',
            prompt: 'Tap the paragraph where the focus narrows to one character.',
            targets: ['c1', 'c2', 'c3', 'c4'],
            answer: 'c2',
            answerText: 'the second paragraph',
            hint: 'Where do we zoom in from the whole harbour to a single person?',
            explain: 'Paragraph 2 narrows from the harbour to Mara and her boat — a close-up.',
          },
        },
        {
          say: 'The focus narrows to Mara. Then the third paragraph shifts: the weather turns and the engine fails. That’s where tension peaks.',
          add: [
            { id: 'l2', type: 'chip', x: 132, y: Y[1] + H / 2, text: 'focus narrows', color: 'tangerine', size: 18, anim: 'pop' },
            { id: 'l3', type: 'chip', x: 132, y: Y[2] + H / 2, text: 'shift → tension', color: 'rose', size: 18, anim: 'pop', delay: 0.8 },
          ],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'The ending returns to the harbour from the opening — but one mooring is empty. What is this structural feature?',
            options: ['A cyclical ending', 'A flashback', 'A time jump forward'],
            answer: 'A cyclical ending',
            hint: 'The text comes back round to where it began.',
            explain: 'It is cyclical: the return makes the change — the missing boat — hit harder.',
          },
        },
      ],
    },
    {
      id: 'write',
      title: 'Write about it',
      beats: [
        {
          say: 'A cyclical ending. Returning to the calm opening makes the single empty mooring feel shocking, so the tension lingers after the text ends.',
          add: [{ id: 'l4', type: 'chip', x: 132, y: Y[3] + H / 2, text: 'cyclical return', color: 'purple', size: 18, anim: 'pop' }],
          set: [{ id: 'pip', mood: 'cheer' }],
        },
        {
          say: 'In the exam, name the feature, say where it happens, and explain its effect on the focus you are asked about — like tension. Never just say it starts, then, next.',
          add: [{ id: 'rule', type: 'text', x: 560, y: 520, text: 'feature → where → effect on tension', size: 24, fontKey: 'hand', color: 'tangerine', anim: 'write' }],
        },
      ],
    },
  ],
};
