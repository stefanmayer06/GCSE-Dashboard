// Explainer: Conditional probability (Higher · Probability · probability-conditional)
// Idea: without replacement, the second branch changes — build the tree.
const L = 170; // tree root x
const M = 410; // first-branch x
const R = 650; // second-branch x

export default {
  id: 'without-replacement',
  topics: ['probability-conditional'],
  title: 'Without replacement',
  summary: 'Take sweets from a bag without putting them back and watch the tree diagram’s second branches change.',
  hue: 'cyan',
  board: 'night',
  scenes: [
    {
      id: 'bag',
      title: 'The first pick',
      beats: [
        {
          say: 'A bag has five red sweets and four blue ones. You take one, eat it, then take another.',
          add: [
            { id: 'bag', type: 'dots', x: 90, y: 110, rows: 3, cols: 3, gap: 44, r: 16, color: 'coral', alt: 'blue', highlight: 5, anim: 'fade', in: 1 },
            { id: 'bagLabel', type: 'text', x: 134, y: 250, text: '5 red · 4 blue', size: 22, fontKey: 'mono', color: 'muted', anim: 'write' },
            { id: 'pip', type: 'pip', x: 870, y: 450, size: 96, mood: 'think', anim: 'pop' },
          ],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'What is the probability the FIRST sweet is red?',
            options: ['5/9', '4/9', '5/8', '1/2'],
            answer: '5/9',
            hint: '5 red out of 9 sweets in total.',
            explain: 'P(red first) = 5/9.',
          },
        },
        {
          say: 'Five ninths. Let’s start the tree diagram: red or blue on the first pick.',
          remove: ['bag', 'bagLabel'],
          add: [
            { id: 't1', type: 'line', x1: L, y1: 270, x2: M, y2: 160, color: 'coral', sw: 4, label: '5/9', labelDy: -24, anim: 'draw' },
            { id: 't2', type: 'line', x1: L, y1: 270, x2: M, y2: 380, color: 'blue', sw: 4, label: '4/9', labelDy: 24, anim: 'draw', delay: 0.3 },
            { id: 'r1', type: 'chip', x: M + 26, y: 160, text: 'R', color: 'coral', anim: 'pop', delay: 0.6 },
            { id: 'b1', type: 'chip', x: M + 26, y: 380, text: 'B', color: 'blue', anim: 'pop', delay: 0.8 },
          ],
        },
      ],
    },
    {
      id: 'second',
      title: 'The second pick',
      beats: [
        {
          say: 'Now the tricky part. If the first sweet was red, it’s gone. The bag has changed.',
          add: [{ id: 'note', type: 'callout', x: 250, y: 470, text: 'one sweet fewer!', tx: M + 20, ty: 190, color: 'volt' }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'Given the first was red, what is P(second is red)?',
            options: ['5/9', '4/9', '4/8', '5/8'],
            answer: '4/8',
            hint: 'After eating a red one: how many red are left, out of how many sweets?',
            explain: '4 red left out of 8 sweets: 4/8.',
          },
        },
        {
          say: 'Four eighths: four reds left out of eight sweets. The second branches depend on the first.',
          remove: ['note'],
          add: [
            { id: 't3', type: 'line', x1: M + 50, y1: 160, x2: R, y2: 90, color: 'coral', sw: 4, label: '4/8', labelDy: -22, anim: 'draw' },
            { id: 't4', type: 'line', x1: M + 50, y1: 160, x2: R, y2: 220, color: 'blue', sw: 4, label: '4/8', labelDy: 22, anim: 'draw', delay: 0.2 },
            { id: 't5', type: 'line', x1: M + 50, y1: 380, x2: R, y2: 320, color: 'coral', sw: 4, label: '5/8', labelDy: -22, anim: 'draw', delay: 0.4 },
            { id: 't6', type: 'line', x1: M + 50, y1: 380, x2: R, y2: 450, color: 'blue', sw: 4, label: '3/8', labelDy: 22, anim: 'draw', delay: 0.6 },
            { id: 'rr', type: 'chip', x: R + 26, y: 90, text: 'RR', color: 'coral', size: 20, anim: 'pop', delay: 0.8 },
          ],
        },
      ],
    },
    {
      id: 'multiply',
      title: 'Multiply along',
      beats: [
        {
          say: 'For red then red, multiply along the branches: five ninths times four eighths.',
          add: [{ id: 'calc', type: 'text', x: 800, y: 160, text: '5/9 × 4/8', size: 30, fontKey: 'mono', color: 'volt', anim: 'write' }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'What is P(red, then red)?',
            options: ['20/72 = 5/18', '9/17', '20/81', '1/4'],
            answer: '20/72 = 5/18',
            hint: 'Multiply the tops, multiply the bottoms, then simplify.',
            explain: '5 × 4 = 20 and 9 × 8 = 72; 20/72 = 5/18.',
          },
        },
        {
          say: 'Twenty seventy-seconds, which simplifies to five eighteenths. Multiply along a route; add different routes together.',
          set: [{ id: 'calc', text: '= 5/18' }, { id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
