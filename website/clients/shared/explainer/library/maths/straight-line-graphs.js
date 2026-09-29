// Explainer: Straight line graphs (Foundation · Algebra · graphs)
// Idea: in y = mx + c, m tilts the line (rise ÷ run) and c slides it.
export default {
  id: 'gradient-rise-over-run',
  topics: ['graphs'],
  title: 'Gradient: rise over run',
  summary: 'Read m and c straight off y = mx + c, measure a gradient from a graph, then drag the sliders to feel them.',
  hue: 'purple',
  board: 'night',
  scenes: [
    {
      id: 'mc',
      title: 'Meet m and c',
      beats: [
        {
          say: 'Every straight line can be written as y equals m x plus c. Here is y equals two x plus one.',
          add: [
            { id: 'ax', type: 'axes', x: 250, y: 24, w: 460, h: 440, xmin: -5, xmax: 5, ymin: -5, ymax: 5, m: 2, c: 1, equation: 'line', anim: 'fade', in: 0.8 },
          ],
        },
        {
          say: 'c is where the line crosses the y-axis: the y-intercept. Here it crosses at plus one.',
          set: [{ id: 'ax', showIntercept: true }],
          pulse: ['ax'],
        },
        {
          say: 'm is the gradient: how steep the line is. For every one step right, this line climbs two steps up.',
          set: [{ id: 'ax', riseRun: true, runFrom: 0, run: 1 }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'What is the gradient of y = 2x + 1?',
            options: ['1', '2', '3', '½'],
            answer: '2',
            hint: 'The gradient is the number in front of x.',
            explain: 'm = 2: up 2 for every 1 across.',
          },
        },
      ],
    },
    {
      id: 'rise-run',
      title: 'Rise ÷ run',
      beats: [
        {
          say: 'To find a gradient from a graph, pick two points on the line, then divide the rise by the run. Here: up four, across two.',
          set: [{ id: 'ax', run: 2, tween: 0.8 }],
          add: [{ id: 'rr', type: 'text', x: 480, y: 505, text: 'gradient = rise ÷ run = 4 ÷ 2 = 2', size: 30, fontKey: 'mono', color: 'coral', anim: 'write' }],
        },
        {
          say: 'Now a different line. Watch which way it goes.',
          set: [{ id: 'ax', m: -0.5, c: 3, tween: 1.4 }],
          remove: ['rr'],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'This line falls 1 for every 2 across. What is its gradient?',
            options: ['2', '−2', '½', '−½'],
            answer: '−½',
            hint: 'Going down means the rise is negative.',
            explain: 'Rise −1 ÷ run 2 = −½.',
          },
        },
      ],
    },
    {
      id: 'play',
      title: 'Play with it',
      play: [
        { label: 'Gradient m', id: 'ax', prop: 'm', min: -3, max: 3, step: 0.5, value: -0.5 },
        { label: 'Intercept c', id: 'ax', prop: 'c', min: -4, max: 4, step: 1, value: 3 },
      ],
      beats: [
        {
          say: 'Pause now and drag the sliders. Watch how m tilts the line, while c just slides it up and down.',
          add: [{ id: 'tip', type: 'callout', x: 150, y: 110, text: 'pause & drag!', tx: 240, ty: 160, color: 'volt', size: 26 }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'Which line is steeper?',
            options: ['y = 3x − 1', 'y = x + 5'],
            answer: 'y = 3x − 1',
            hint: 'Steepness only depends on m.',
            explain: '3 is bigger than 1. The c value only moves a line up or down.',
          },
        },
        {
          say: 'Lines with the same gradient never meet: they are parallel. Only c is different.',
          remove: ['tip'],
          set: [{ id: 'ax', m: 1, c: -2, lines: [{ m: 1, c: 2, color: 'cyan' }], tween: 1.2 }],
        },
      ],
    },
  ],
};
