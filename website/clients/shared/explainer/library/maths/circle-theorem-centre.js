// Explainer: Circle theorems (Higher · Geometry · circle-theorems)
// Idea: the angle at the centre is twice the angle at the circumference.
const O = { x: 470, y: 290 };
const R = 185;
const at = (deg) => ({ x: Math.round(O.x + R * Math.cos((deg * Math.PI) / 180)), y: Math.round(O.y + R * Math.sin((deg * Math.PI) / 180)) });
const A = at(150);
const B = at(30);
const C = at(270);

export default {
  id: 'angle-at-centre',
  topics: ['circle-theorems'],
  title: 'Angle at the centre',
  summary: 'Two angles stand on the same arc — one at the centre, one on the edge. See why one is always double the other.',
  hue: 'green',
  board: 'night',
  scenes: [
    {
      id: 'setup',
      title: 'Same arc, two angles',
      beats: [
        {
          say: 'Here is a circle with centre O, and three points on its edge: A, B and C.',
          add: [
            { id: 'circle', type: 'circle', x: O.x, y: O.y, r: R, stroke: 'ink', sw: 4, anim: 'draw', in: 1.2 },
            { id: 'O', type: 'point', x: O.x, y: O.y, color: 'volt', label: 'O', labelDx: -26, labelDy: -8 },
            { id: 'A', type: 'point', x: A.x, y: A.y, color: 'cyan', label: 'A', labelDx: -34, labelDy: 10 },
            { id: 'B', type: 'point', x: B.x, y: B.y, color: 'cyan', label: 'B', labelDx: 18, labelDy: 10 },
            { id: 'C', type: 'point', x: C.x, y: C.y, color: 'coral', label: 'C', labelDx: 16, labelDy: -18 },
          ],
        },
        {
          say: 'Join A and B to the centre. That makes the angle at the centre.',
          add: [
            { id: 'OA', type: 'line', x1: O.x, y1: O.y, x2: A.x, y2: A.y, color: 'cyan', sw: 4, anim: 'draw' },
            { id: 'OB', type: 'line', x1: O.x, y1: O.y, x2: B.x, y2: B.y, color: 'cyan', sw: 4, anim: 'draw' },
            { id: 'angO', type: 'arc', cx: O.x, cy: O.y, r: 46, a0: 30, a1: 150, color: 'cyan', label: '120°', labelR: 76, anim: 'draw', delay: 0.6 },
          ],
        },
        {
          say: 'Now join A and B to the point C on the circumference. Both angles stand on the same arc, A to B.',
          add: [
            { id: 'CA', type: 'line', x1: C.x, y1: C.y, x2: A.x, y2: A.y, color: 'coral', sw: 4, anim: 'draw' },
            { id: 'CB', type: 'line', x1: C.x, y1: C.y, x2: B.x, y2: B.y, color: 'coral', sw: 4, anim: 'draw' },
            { id: 'angC', type: 'arc', cx: C.x, cy: C.y, r: 52, a0: 60, a1: 120, color: 'coral', label: '?', labelR: 82, anim: 'draw', delay: 0.6 },
            { id: 'pip', type: 'pip', x: 860, y: 450, size: 96, mood: 'think', anim: 'pop' },
          ],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'The angle at the centre is 120°. What do you predict the angle at C is?',
            options: ['30°', '60°', '120°', '240°'],
            answer: '60°',
            hint: 'The angle at the edge is smaller — exactly half.',
            explain: 'Angle at the circumference = 120° ÷ 2 = 60°.',
          },
        },
      ],
    },
    {
      id: 'theorem',
      title: 'Double it',
      beats: [
        {
          say: 'Sixty degrees. The angle at the centre is always twice the angle at the circumference, when both stand on the same arc.',
          set: [{ id: 'angC', label: '60°' }, { id: 'pip', mood: 'cheer' }],
          add: [{ id: 'rule', type: 'text', x: 60, y: 500, text: 'centre = 2 × circumference', size: 32, color: 'volt', anchor: 'start', anim: 'write' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'If the angle at the centre were 140°, what would the angle at the circumference be?',
            answer: 70,
            unit: '°',
            hint: 'Halve the angle at the centre.',
            explain: '140° ÷ 2 = 70°.',
          },
        },
        {
          say: 'Seventy. And it works backwards too: double the edge angle to find the centre.',
          set: [{ id: 'angO', label: '2x' }, { id: 'angC', label: 'x' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'The angle at the circumference is 38°. Find the angle at the centre.',
            answer: 76,
            unit: '°',
            hint: 'Double it.',
            explain: '2 × 38° = 76°.',
          },
        },
        {
          say: 'Seventy-six degrees. In an exam, name the theorem as your reason: the angle at the centre is twice the angle at the circumference.',
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
