// Explainer: Trigonometry (Foundation · Geometry · trigonometry)
// Idea: label O, A, H from the angle, then pick the ratio with the two
// sides you have/need. Uses tap checkpoints on the board.
const X = 300;
const Y = 440;
const A_LEN = 360; // adjacent (base)
const B_LEN = 252; // opposite (vertical) → angle at the right ≈ 35°

export default {
  id: 'sohcahtoa',
  topics: ['trigonometry'],
  title: 'Trigonometry: label, choose, solve',
  summary: 'Tap to label the opposite, adjacent and hypotenuse, pick SOH, CAH or TOA, then solve for a side.',
  hue: 'green',
  board: 'night',
  scenes: [
    {
      id: 'label',
      title: 'Label the sides',
      beats: [
        {
          say: 'Here is a right-angled triangle with an angle of thirty-five degrees. Trigonometry starts by labelling the sides from that angle.',
          add: [
            { id: 'tri', type: 'tri', x: X, y: Y, a: A_LEN, b: B_LEN, color: 'green', anim: 'draw', in: 1.2 },
            { id: 'ang', type: 'arc', cx: X + A_LEN, cy: Y, r: 70, a0: 180, a1: 215, color: 'volt', label: '35°', labelR: 104, anim: 'draw', delay: 0.8 },
            { id: 'pip', type: 'pip', x: 110, y: 130, size: 90, mood: 'think', anim: 'pop' },
          ],
        },
        {
          say: 'Three sides, three names. Opposite, adjacent and hypotenuse.',
          add: [
            { id: 'sOpp', type: 'chip', x: X - 64, y: Y - B_LEN / 2, text: 'side 1', color: 'cyan', solid: false, anim: 'pop' },
            { id: 'sAdj', type: 'chip', x: X + A_LEN / 2, y: Y + 42, text: 'side 2', color: 'cyan', solid: false, anim: 'pop', delay: 0.2 },
            { id: 'sHyp', type: 'chip', x: X + A_LEN / 2 + 70, y: Y - B_LEN / 2 - 60, text: 'side 3', color: 'cyan', solid: false, anim: 'pop', delay: 0.4 },
          ],
        },
        {
          ask: {
            kind: 'tap',
            prompt: 'Tap the side that is OPPOSITE the 35° angle.',
            targets: ['sOpp', 'sAdj', 'sHyp'],
            answer: 'sOpp',
            hint: 'Opposite means across from the angle — it doesn’t touch it.',
            explain: 'The vertical side is across from the 35° angle.',
          },
        },
        {
          say: 'The opposite side is across from the angle. The hypotenuse is the longest, facing the right angle. The adjacent is the one left, next to the angle.',
          set: [
            { id: 'sOpp', text: 'O · opposite', solid: true, color: 'coral' },
            { id: 'sAdj', text: 'A · adjacent', solid: true, color: 'amber' },
            { id: 'sHyp', text: 'H · hypotenuse', solid: true, color: 'purple' },
          ],
        },
      ],
    },
    {
      id: 'choose',
      title: 'Choose the ratio',
      beats: [
        {
          say: 'Now remember SOH CAH TOA. Sine is opposite over hypotenuse, cosine is adjacent over hypotenuse, tangent is opposite over adjacent.',
          add: [{ id: 'soh', type: 'text', x: 700, y: 64, text: 'SOH  CAH  TOA', size: 40, color: 'volt', anim: 'write' }],
        },
        {
          say: 'Suppose the hypotenuse is ten centimetres and we want the opposite side.',
          set: [{ id: 'sHyp', text: 'H = 10 cm' }, { id: 'sOpp', text: 'O = ?' }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'We know H and want O. Which ratio uses both?',
            options: ['sin (SOH)', 'cos (CAH)', 'tan (TOA)'],
            answer: 'sin (SOH)',
            hint: 'Find the letters O and H together.',
            explain: 'SOH: sin 35° = O ÷ H.',
          },
        },
      ],
    },
    {
      id: 'solve',
      title: 'Solve it',
      beats: [
        {
          say: 'So sine thirty-five equals O over ten. Multiply both sides by ten.',
          set: [{ id: 'soh', text: 'O = 10 × sin 35°' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'Use a calculator: 10 × sin 35° = ? (2 decimal places)',
            answer: 5.74,
            tolerance: 0.01,
            unit: 'cm',
            hint: 'Check your calculator is in degrees mode.',
            explain: '10 × 0.5736 = 5.74 cm (2 d.p.).',
          },
        },
        {
          say: 'Five point seven four centimetres. Label the sides, choose the ratio, then rearrange and solve.',
          set: [{ id: 'sOpp', text: 'O = 5.74 cm' }, { id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
