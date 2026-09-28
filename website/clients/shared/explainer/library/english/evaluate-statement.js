// Explainer: Evaluating a statement (English · Reading · evaluation)
// Idea: sort evidence into "supports" and "complicates", take a position,
// and weigh it — a critic, not a narrator.
const chips = [
  { id: 'e1', text: 'mud “deep and greedy”', x: 250, y: 230, color: 'tangerine' },
  { id: 'e2', text: 'path like “a fraying ribbon”', x: 690, y: 240, color: 'rose' },
  { id: 'e3', text: 'a heron lifts calmly', x: 290, y: 330, color: 'cyan' },
  { id: 'e4', text: 'the light is going', x: 660, y: 340, color: 'amber' },
];

export default {
  id: 'evaluate-statement',
  topics: ['evaluation'],
  title: 'How far do you agree?',
  summary: 'Sort the evidence, take a clear position, and weigh the statement like a critic instead of retelling the story.',
  hue: 'tangerine',
  board: 'paper',
  scenes: [
    {
      id: 'statement',
      title: 'The statement',
      beats: [
        {
          say: 'Question four gives you a statement to judge. Here’s one: in this part, the writer makes the marsh feel threatening.',
          add: [
            { id: 'stmt', type: 'card', x: 110, y: 40, w: 740, h: 110, title: 'THE STATEMENT', body: '“The writer makes the marsh feel threatening.”', color: 'tangerine', size: 26, fontKey: 'read', anim: 'slide' },
            { id: 'pip', type: 'pip', x: 900, y: 300, size: 84, mood: 'think', anim: 'pop' },
          ],
        },
        {
          say: 'Collect your evidence first. Imagine the extract gives us these four details.',
          add: chips.map((chip, index) => ({ id: chip.id, type: 'chip', x: chip.x, y: chip.y, text: chip.text, color: chip.color, size: 20, anim: 'pop', delay: index * 0.3 })),
        },
        {
          ask: {
            kind: 'tap',
            prompt: 'Tap the detail that COMPLICATES the statement — one that isn’t threatening.',
            targets: ['e1', 'e2', 'e3', 'e4'],
            answer: 'e3',
            answerText: 'the calm heron',
            hint: 'Which detail feels peaceful?',
            explain: 'The calm heron is a moment of peace — it complicates the statement.',
          },
        },
      ],
    },
    {
      id: 'sort',
      title: 'Sort and weigh',
      beats: [
        {
          say: 'Sort it. Three details support the statement. One complicates it. That’s already an argument taking shape.',
          add: [
            { id: 'h1', type: 'text', x: 300, y: 205, text: 'supports', size: 26, fontKey: 'hand', color: 'good', anim: 'write' },
            { id: 'h2', type: 'text', x: 700, y: 205, text: 'complicates', size: 26, fontKey: 'hand', color: 'coral', anim: 'write' },
          ],
          set: [
            { id: 'e1', x: 300, y: 260, tween: 1.2 },
            { id: 'e2', x: 300, y: 320, tween: 1.2, delay: 0.15 },
            { id: 'e4', x: 300, y: 380, tween: 1.2, delay: 0.3 },
            { id: 'e3', x: 700, y: 260, tween: 1.2, delay: 0.45 },
          ],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'Which is the strongest opening for your answer?',
            options: [
              'I mostly agree: the marsh is hungry and shifting, although brief calm makes the danger feel sudden.',
              'The writer uses lots of different language techniques in this extract.',
              'The extract is about a girl called Nia crossing a marsh at night.',
            ],
            answer: 'I mostly agree: the marsh is hungry and shifting, although brief calm makes the danger feel sudden.',
            hint: 'Which one takes a position AND weighs it?',
            explain: 'It states a clear position (“mostly agree”) and signals the “however” at once.',
          },
        },
      ],
    },
    {
      id: 'critic',
      title: 'Be the critic',
      beats: [
        {
          say: 'Now write like a critic. Each paragraph: point, evidence, evaluation, link back to the statement. Use evaluative words: effective, deliberate, unsettling.',
          add: [{ id: 'bank', type: 'card', x: 110, y: 420, w: 740, h: 100, title: 'EVALUATIVE BANK', body: 'effective · deliberately · unsettling · convincing · ironic', color: 'amber', size: 22, fontKey: 'ui', anim: 'slide' }],
          set: [{ id: 'pip', mood: 'happy' }],
        },
        {
          say: 'And never retell the story. Every sentence should weigh the statement: how far, and why.',
          set: [{ id: 'pip', mood: 'cheer' }],
          pulse: ['stmt'],
        },
      ],
    },
  ],
};
