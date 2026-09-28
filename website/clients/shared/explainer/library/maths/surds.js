// Explainer: Surds (Higher · Number · surds)
// Idea: √ undoes squaring; pull out the biggest square factor.
export default {
  id: 'simplify-surds',
  topics: ['surds'],
  title: 'Simplifying surds',
  summary: 'Use square tiles to see what a square root really is, then pull square factors out of a surd.',
  hue: 'blue',
  board: 'night',
  scenes: [
    {
      id: 'squares',
      title: 'Roots of squares',
      beats: [
        {
          say: 'A square root asks: which side length makes this area? Twenty-five tiles make a five by five square.',
          add: [
            { id: 'grid', type: 'grid', x: 140, y: 110, cols: 5, rows: 5, cell: 52, fill: 25, color: 'blue', anim: 'fade' },
            { id: 'lab', type: 'text', x: 270, y: 430, text: '√25 = 5', size: 44, fontKey: 'mono', color: 'volt', anim: 'write' },
            { id: 'pip', type: 'pip', x: 860, y: 450, size: 96, mood: 'think', anim: 'pop' },
          ],
        },
        {
          say: 'But fifty tiles can’t make a whole-number square. The square root of fifty isn’t a whole number: it’s a surd.',
          set: [{ id: 'lab', text: '√50 = ?' }],
        },
        {
          say: 'Here’s the trick: fifty is twenty-five times two. And twenty-five is a square number.',
          add: [
            { id: 'grid2', type: 'grid', x: 440, y: 110, cols: 5, rows: 5, cell: 52, fill: 25, color: 'cyan', anim: 'pop' },
            { id: 'x2', type: 'text', x: 740, y: 240, text: '× 2', size: 48, color: 'cyan', anim: 'write' },
          ],
          set: [{ id: 'lab', text: '50 = 25 × 2' }],
        },
      ],
    },
    {
      id: 'pull-out',
      title: 'Pull it out',
      beats: [
        {
          say: 'Split the root: root fifty equals root twenty-five times root two. Root twenty-five is five.',
          set: [{ id: 'lab', text: '√50 = √25 × √2 = 5√2', x: 480, size: 40 }],
          remove: ['x2'],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'Simplify √72.',
            options: ['2√18', '6√2', '8√9', '36√2'],
            answer: '6√2',
            hint: 'Find the BIGGEST square factor of 72.',
            explain: '72 = 36 × 2, so √72 = √36 × √2 = 6√2.',
          },
        },
        {
          say: 'Six root two. Always use the biggest square factor: nine goes into seventy-two too, but thirty-six gets you there in one step.',
          set: [{ id: 'lab', text: '√72 = √36 × √2 = 6√2' }, { id: 'pip', mood: 'cheer' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: '√12 = k√3. What is k?',
            answer: 2,
            hint: '12 = 4 × 3.',
            explain: '√12 = √4 × √3 = 2√3, so k = 2.',
          },
        },
        {
          say: 'Two. Spot the square factor, split the root, and simplify.',
          set: [{ id: 'lab', text: '√12 = √4 × √3 = 2√3' }],
        },
      ],
    },
  ],
};
