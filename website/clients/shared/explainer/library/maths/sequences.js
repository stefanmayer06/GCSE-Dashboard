// Explainer: nth term of a linear sequence (Foundation · Algebra · sequences)
// Idea: the difference gives the times table; the shift gives the rest.
export default {
  id: 'nth-term',
  topics: ['sequences'],
  title: 'Finding the nth term',
  summary: 'Jump along a number line to find the difference, compare with a times table, and write the rule.',
  hue: 'purple',
  board: 'night',
  scenes: [
    {
      id: 'jumps',
      title: 'Find the jump',
      beats: [
        {
          say: 'Here is a sequence: five, nine, thirteen, seventeen. What is the rule?',
          add: [
            { id: 'seq', type: 'text', x: 480, y: 84, text: '5, 9, 13, 17, …', size: 54, anim: 'write', in: 1 },
            { id: 'nl', type: 'numberline', x: 90, y: 300, w: 780, min: 0, max: 20, step: 1, labelEvery: 5, marks: [{ v: 5, label: '5', color: 'purple' }, { v: 9, label: '9', color: 'purple' }, { v: 13, label: '13', color: 'purple' }, { v: 17, label: '17', color: 'purple' }], anim: 'draw', in: 1.2 },
            { id: 'pip', type: 'pip', x: 880, y: 450, size: 96, mood: 'think', anim: 'pop' },
          ],
        },
        {
          say: 'Watch the jumps between the terms.',
          set: [{ id: 'nl', jumps: [{ from: 5, to: 9, label: '+4' }, { from: 9, to: 13, label: '+4' }, { from: 13, to: 17, label: '+4' }] }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'What is the common difference?',
            options: ['+3', '+4', '+5', '×2'],
            answer: '+4',
            hint: 'How far is each jump?',
            explain: 'Each term is 4 more than the last.',
          },
        },
      ],
    },
    {
      id: 'table',
      title: 'Compare to 4n',
      beats: [
        {
          say: 'A difference of four means the sequence is linked to the four times table: four n.',
          add: [
            { id: 'rowN', type: 'text', x: 150, y: 400, text: 'n:', size: 30, fontKey: 'mono', color: 'muted', anchor: 'start' },
            { id: 'row4', type: 'text', x: 150, y: 450, text: '4n:', size: 30, fontKey: 'mono', color: 'cyan', anchor: 'start' },
            { id: 'rowS', type: 'text', x: 150, y: 500, text: 'term:', size: 30, fontKey: 'mono', color: 'purple', anchor: 'start' },
            { id: 'valsN', type: 'text', x: 300, y: 400, text: '1    2    3    4', size: 30, fontKey: 'mono', color: 'muted', anchor: 'start', anim: 'write' },
            { id: 'vals4', type: 'text', x: 300, y: 450, text: '4    8    12   16', size: 30, fontKey: 'mono', color: 'cyan', anchor: 'start', anim: 'write', delay: 0.6 },
            { id: 'valsS', type: 'text', x: 300, y: 500, text: '5    9    13   17', size: 30, fontKey: 'mono', color: 'purple', anchor: 'start', anim: 'write', delay: 1.2 },
          ],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'How do you get from 4n to each term?',
            options: ['Add 1', 'Add 4', 'Double it', 'Take away 1'],
            answer: 'Add 1',
            hint: 'Compare 4 with 5, and 8 with 9.',
            explain: 'Every term is one more than the 4 times table.',
          },
        },
        {
          say: 'Every term is one more than four n. So the nth term is four n plus one.',
          add: [{ id: 'rule', type: 'chip', x: 640, y: 450, text: 'nth term = 4n + 1', color: 'volt', size: 28, anim: 'pop' }],
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
    {
      id: 'use',
      title: 'Use the rule',
      beats: [
        {
          ask: {
            kind: 'number',
            prompt: 'Use 4n + 1 to find the 10th term.',
            answer: 41,
            hint: 'Put n = 10 into 4n + 1.',
            explain: '4 × 10 + 1 = 41.',
          },
        },
        {
          say: 'Forty-one. With the rule you can jump straight to any term — even the hundredth.',
          set: [{ id: 'seq', text: '10th term = 4 × 10 + 1 = 41' }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'What is the nth term of 3, 8, 13, 18, …?',
            options: ['5n − 2', '5n + 3', '3n + 5', 'n + 5'],
            answer: '5n − 2',
            hint: 'The difference is +5. Compare with 5, 10, 15, 20.',
            explain: 'Each term is 2 less than 5n: 5n − 2.',
          },
        },
        {
          say: 'Five n minus two. Difference first, then compare with the times table.',
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
