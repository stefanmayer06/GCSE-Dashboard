// Explainer: Writing to argue (English · Writing · argument-writing)
// Idea: an argument is a build — hook, claim, evidence, concede + rebut,
// call to action. Original practice lines.
const HOOK = 'How many of us have scrolled past midnight, promising ourselves just one more video?';
// Word indices: 3 us · 5 scrolled · 7 midnight, · 9 ourselves · 13 video?
const STEPS = [
  { id: 'b1', label: 'HOOK', body: 'a question that pulls the reader in', color: 'rose' },
  { id: 'b2', label: 'CLAIM', body: 'phones should stay out of bedrooms at night', color: 'tangerine' },
  { id: 'b3', label: 'EVIDENCE', body: 'sleep, focus, a real example', color: 'amber' },
  { id: 'b4', label: 'CONCEDE + REBUT', body: '“Some say… However…”', color: 'purple' },
  { id: 'b5', label: 'CALL TO ACTION', body: 'a memorable final line', color: 'green' },
];

export default {
  id: 'build-an-argument',
  topics: ['argument-writing'],
  title: 'Build an argument',
  summary: 'Stack an argument block by block — hook, claim, evidence, rebuttal, call to action — and spot the devices that persuade.',
  hue: 'rose',
  board: 'paper',
  scenes: [
    {
      id: 'hook',
      title: 'The hook',
      beats: [
        {
          say: 'Paper two, question five: write a speech arguing that phones should stay out of bedrooms at night. Start with a hook, never with “in this speech I will”.',
          add: [
            { id: 'h', type: 'words', x: 90, y: 140, w: 780, text: HOOK, size: 40, fontKey: 'read', anim: 'fade', in: 1 },
            { id: 'pip', type: 'pip', x: 860, y: 450, size: 96, mood: 'happy', anim: 'pop' },
          ],
        },
        {
          ask: {
            kind: 'tap',
            prompt: 'Tap a word that directly includes the audience.',
            targets: ['h:3', 'h:5', 'h:7', 'h:9', 'h:13'],
            answer: ['h:3', 'h:9'],
            answerText: '“us” or “ourselves”',
            hint: 'Look for an inclusive pronoun.',
            explain: '“us” and “ourselves” put the speaker and audience in the same boat — direct, inclusive address.',
          },
        },
        {
          say: 'Us and ourselves: inclusive pronouns make the audience part of the problem. And it’s a rhetorical question — they answer it in their heads.',
          set: [{ id: 'h', highlights: [{ from: 3, to: 3, color: 'rose' }, { from: 9, to: 9, color: 'rose' }] }],
        },
      ],
    },
    {
      id: 'build',
      title: 'Stack the blocks',
      beats: [
        {
          say: 'Then build the argument, one block per paragraph.',
          remove: ['h'],
          add: STEPS.map((step, index) => ({
            id: step.id,
            type: 'card',
            x: 150,
            y: 30 + index * 98,
            w: 640,
            h: 84,
            title: step.label,
            body: step.body,
            color: step.color,
            size: 20,
            fontKey: 'ui',
            anim: 'drop',
            delay: index * 0.45,
          })),
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'Which sentence is a concede-and-rebut?',
            options: [
              'Some say phones help us revise. However, every ping at midnight steals the sleep that revision needs.',
              'Phones are bad and everyone knows it.',
              'In this speech I will talk about phones.',
            ],
            answer: 'Some say phones help us revise. However, every ping at midnight steals the sleep that revision needs.',
            hint: 'Look for “Some say…” followed by “However…”.',
            explain: 'It admits the other side, then turns it round — you sound fair and persuasive.',
          },
        },
        {
          say: 'Conceding first makes you sound fair; the rebuttal then lands harder.',
          pulse: ['b4'],
        },
      ],
    },
    {
      id: 'finish',
      title: 'Finish strong',
      beats: [
        {
          ask: {
            kind: 'choice',
            prompt: 'Pick the strongest final line.',
            options: [
              'Tonight, leave it in the kitchen — and see who wakes up first.',
              'That is the end of my speech about phones.',
              'Phones have good and bad points.',
            ],
            answer: 'Tonight, leave it in the kitchen — and see who wakes up first.',
            hint: 'A call to action tells the audience what to do next.',
            explain: 'A direct, concrete call to action with a sharp twist is memorable.',
          },
        },
        {
          say: 'A call to action they can do tonight. Hook, claim, evidence, rebut, act: that’s the build.',
          pulse: ['b5'],
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
