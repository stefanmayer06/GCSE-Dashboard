// Explainer: Angles in a triangle (Foundation · Geometry · angles)
// Idea: tear off the three corners — they fit on a straight line (180°).
const A = { x: 290, y: 440 };
const B = { x: 670, y: 440 };
const C = { x: 555, y: 124 };

export default {
  id: 'triangle-180',
  topics: ['angles'],
  title: 'Why a triangle makes 180°',
  summary: 'Tear the corners off a triangle, line them up, and see exactly why the angles total 180°.',
  hue: 'green',
  board: 'night',
  scenes: [
    {
      id: 'corners',
      title: 'Three corners',
      beats: [
        {
          say: 'Here is a triangle. Its three angles are fifty, seventy and sixty degrees.',
          add: [
            { id: 'tri', type: 'path', d: `M${A.x} ${A.y} L${B.x} ${B.y} L${C.x} ${C.y} Z`, color: 'green', sw: 5, fill: 'green', opacity: 0.2, anim: 'draw', in: 1.4 },
            { id: 'aA', type: 'arc', cx: A.x, cy: A.y, r: 52, a0: -50, a1: 0, color: 'coral', label: '50°', anim: 'draw', delay: 1 },
            { id: 'aB', type: 'arc', cx: B.x, cy: B.y, r: 52, a0: 180, a1: 250, color: 'amber', label: '70°', anim: 'draw', delay: 1.3 },
            { id: 'aC', type: 'arc', cx: C.x, cy: C.y, r: 52, a0: 70, a1: 130, color: 'cyan', label: '60°', anim: 'draw', delay: 1.6 },
          ],
        },
        {
          say: 'Now imagine tearing off all three corners...',
          set: [{ id: 'tri', opacity: 0.06 }],
          add: [{ id: 'pip', type: 'pip', x: 120, y: 150, size: 96, mood: 'wow', anim: 'pop' }],
        },
        {
          say: '...and fitting them together, point to point, along a straight line.',
          add: [{ id: 'line', type: 'line', x1: 220, y1: 380, x2: 740, y2: 380, color: 'ink', sw: 4, anim: 'draw' }],
          remove: ['tri'],
          set: [
            { id: 'aA', cx: 480, cy: 380, a0: 180, a1: 230, r: 90, tween: 1.8 },
            { id: 'aC', cx: 480, cy: 380, a0: 230, a1: 290, r: 90, tween: 1.8, delay: 0.3 },
            { id: 'aB', cx: 480, cy: 380, a0: 290, a1: 360, r: 90, tween: 1.8, delay: 0.6 },
          ],
        },
      ],
    },
    {
      id: 'line',
      title: 'A straight line',
      beats: [
        {
          ask: {
            kind: 'number',
            prompt: 'The three corners make a straight line. How many degrees is that?',
            answer: 180,
            unit: '°',
            hint: 'Angles on a straight line…',
            explain: 'A straight line is a half turn: 180°.',
          },
        },
        {
          say: 'They fill a straight line exactly. Angles on a straight line add to one hundred and eighty degrees, so every triangle’s angles do too.',
          add: [{ id: 'rule', type: 'text', x: 480, y: 470, text: '50° + 60° + 70° = 180°', size: 36, fontKey: 'mono', color: 'volt', anim: 'write' }],
          set: [{ id: 'pip', mood: 'cheer' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'A triangle has angles of 48° and 67°. What is the third angle?',
            answer: 65,
            unit: '°',
            hint: '180 − 48 − 67.',
            explain: '48 + 67 = 115, and 180 − 115 = 65°.',
          },
        },
        {
          say: 'Sixty-five degrees. One more: an isosceles triangle has two equal base angles.',
          set: [{ id: 'rule', text: 'isosceles: top 40°, base angles equal' }, { id: 'pip', mood: 'think' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'The top angle is 40°. What is each base angle?',
            answer: 70,
            unit: '°',
            hint: '180 − 40, then share between the two equal angles.',
            explain: '180 − 40 = 140, and 140 ÷ 2 = 70°.',
          },
        },
        {
          say: 'Seventy degrees each. Subtract from one hundred and eighty, then share if the angles are equal.',
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
