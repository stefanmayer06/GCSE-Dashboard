// Explainer: Pythagoras (Foundation · Geometry · pythagoras)
// Idea: build squares on the sides — the two small areas make the big one.
export default {
  id: 'pythagoras-squares',
  topics: ['pythagoras'],
  title: 'Pythagoras: squares on the sides',
  summary: 'Build a square on every side of a right-angled triangle and watch a² + b² = c² appear.',
  hue: 'green',
  board: 'night',
  scenes: [
    {
      id: 'triangle',
      title: 'The longest side',
      beats: [
        {
          say: 'A right-angled triangle with shorter sides of six and eight centimetres. How long is the slanted side?',
          add: [
            { id: 'tri', type: 'tri', x: 380, y: 300, a: 160, b: 120, color: 'green', labels: { a: '8 cm', b: '6 cm', c: '?' }, anim: 'draw', in: 1.4 },
            { id: 'pip', type: 'pip', x: 860, y: 450, size: 100, mood: 'think', anim: 'pop', delay: 0.6 },
          ],
        },
        {
          say: 'That side is the hypotenuse. It is opposite the right angle, and it is always the longest side.',
          add: [{ id: 'hyp', type: 'callout', x: 700, y: 170, text: 'hypotenuse', tx: 478, ty: 232, color: 'volt' }],
          pulse: ['tri'],
        },
        {
          say: 'Here’s the big idea. Build a square on every side.',
          remove: ['hyp'],
          set: [{ id: 'tri', squares: 1, areas: { a: '64', b: '36', c: '?' }, tween: 1.6 }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'The two smaller squares have areas 36 cm² and 64 cm². What is their total?',
            answer: 100,
            unit: 'cm²',
            hint: '6 × 6 = 36 and 8 × 8 = 64.',
            explain: '36 + 64 = 100.',
          },
        },
      ],
    },
    {
      id: 'rule',
      title: 'a² + b² = c²',
      beats: [
        {
          say: 'Pythagoras’ theorem says the two smaller squares always add up to the big one. So the big square is one hundred.',
          set: [{ id: 'tri', areas: { a: '64', b: '36', c: '100' } }],
          add: [{ id: 'rule', type: 'text', x: 50, y: 70, text: 'a² + b² = c²', size: 38, color: 'volt', anim: 'write', anchor: 'start' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'The square on the hypotenuse is 100 cm². How long is the hypotenuse?',
            answer: 10,
            unit: 'cm',
            hint: 'Which number times itself makes 100?',
            explain: '√100 = 10 cm.',
          },
        },
        {
          say: 'Its side is the square root: ten centimetres. Square, add, then square root.',
          set: [{ id: 'tri', labels: { a: '8 cm', b: '6 cm', c: '10 cm' } }, { id: 'pip', mood: 'cheer' }],
        },
      ],
    },
    {
      id: 'shorter',
      title: 'A shorter side',
      beats: [
        {
          say: 'To find a shorter side, subtract instead: the big square take away the small one, then square root.',
          set: [{ id: 'rule', text: 'b² = c² − a²' }, { id: 'pip', mood: 'think' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'The hypotenuse is 13 cm and one side is 5 cm. How long is the other side?',
            answer: 12,
            unit: 'cm',
            hint: '13² − 5² = 169 − 25.',
            explain: '169 − 25 = 144, and √144 = 12 cm.',
          },
        },
        {
          say: 'Twelve centimetres. Longest side? Add the squares. Shorter side? Subtract them.',
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
