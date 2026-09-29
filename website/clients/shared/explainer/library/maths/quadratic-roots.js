// Explainer: Quadratics (Higher · Algebra · quadratics-higher)
// Idea: roots are where the curve meets y = 0; factorising finds them.
export default {
  id: 'quadratic-roots',
  topics: ['quadratics-higher'],
  title: 'Quadratics: roots you can see',
  summary: 'Watch a parabola cross the x-axis, factorise to find those roots, then reshape the curve yourself.',
  hue: 'purple',
  board: 'night',
  scenes: [
    {
      id: 'curve',
      title: 'Where it crosses',
      beats: [
        {
          say: 'Here is the graph of y equals x squared minus x minus six. It’s a parabola: a smooth U shape.',
          add: [
            { id: 'ax', type: 'axes', x: 330, y: 20, w: 460, h: 460, xmin: -5, xmax: 5, ymin: -8, ymax: 8, step: 1, qa: 1, qb: -1, qc: -6, equation: 'quad', labels: false, anim: 'fade', in: 0.8 },
            { id: 'pip', type: 'pip', x: 150, y: 440, size: 100, mood: 'think', anim: 'pop' },
          ],
        },
        {
          say: 'The roots are where the curve crosses the x-axis, where y equals zero.',
          set: [{ id: 'ax', showRoots: true }],
          pulse: ['ax'],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'Reading the graph, what are the roots?',
            options: ['x = −3 and x = 2', 'x = 3 and x = −2', 'x = 6 and x = −1', 'x = −6 only'],
            answer: 'x = 3 and x = −2',
            hint: 'Look where the curve touches the x-axis.',
            explain: 'It crosses at x = −2 and x = 3.',
          },
        },
      ],
    },
    {
      id: 'factorise',
      title: 'Factorise',
      beats: [
        {
          say: 'We can find those roots without a graph. Factorise: find two numbers that multiply to minus six and add to minus one.',
          add: [{ id: 'f', type: 'text', x: 60, y: 90, text: 'x² − x − 6 = 0', size: 34, fontKey: 'mono', color: 'ink', anchor: 'start', anim: 'write' }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'Which pair multiplies to −6 and adds to −1?',
            options: ['−3 and 2', '3 and −2', '−6 and 1', '−2 and −3'],
            answer: '−3 and 2',
            hint: 'Try the factor pairs of 6 with one negative.',
            explain: '−3 × 2 = −6 and −3 + 2 = −1.',
          },
        },
        {
          say: 'Minus three and plus two. So the quadratic factorises to x minus three, times x plus two.',
          add: [{ id: 'f2', type: 'text', x: 60, y: 140, text: '(x − 3)(x + 2) = 0', size: 34, fontKey: 'mono', color: 'volt', anchor: 'start', anim: 'write' }],
        },
        {
          say: 'If two brackets multiply to zero, one of them must be zero. So x equals three, or x equals minus two — exactly where the curve crosses.',
          add: [{ id: 'f3', type: 'text', x: 60, y: 190, text: 'x = 3  or  x = −2', size: 34, fontKey: 'mono', color: 'cyan', anchor: 'start', anim: 'write' }],
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
    {
      id: 'reshape',
      title: 'Reshape it',
      play: [
        { label: 'b (x term)', id: 'ax', prop: 'qb', min: -4, max: 4, step: 1, value: -1 },
        { label: 'c (constant)', id: 'ax', prop: 'qc', min: -8, max: 4, step: 1, value: -6 },
      ],
      beats: [
        {
          say: 'The constant term c is where the curve crosses the y-axis. Pause and drag the sliders: watch the roots move, and even disappear.',
          remove: ['f', 'f2', 'f3'],
          set: [{ id: 'pip', mood: 'wow' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'Where does y = x² − x − 6 cross the y-axis? (the value of y)',
            answer: -6,
            hint: 'Put x = 0 into the equation.',
            explain: '0² − 0 − 6 = −6, so the y-intercept is (0, −6).',
          },
        },
        {
          say: 'Minus six. When the whole curve sits above the x-axis, there are no real roots — the equation has no solutions to find.',
          set: [{ id: 'ax', qb: 0, qc: 2, tween: 1.6 }, { id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
