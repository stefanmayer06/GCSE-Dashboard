// Explainer: Basic probability (Foundation · Probability · probability-basic)
// Idea: probability = ways it can happen ÷ total outcomes, placed on a 0–1 scale.
export default {
  id: 'probability-scale',
  topics: ['probability-basic'],
  title: 'Probability from 0 to 1',
  summary: 'Spin a spinner, count the outcomes, and drag events onto the probability scale.',
  hue: 'cyan',
  board: 'night',
  scenes: [
    {
      id: 'spinner',
      title: 'Count the outcomes',
      beats: [
        {
          say: 'Here is a spinner with four equal sections: three blue and one amber.',
          add: [
            { id: 'spin', type: 'pie', x: 300, y: 215, r: 150, needle: 0, sectors: [{ v: 1, color: 'blue', label: 'B' }, { v: 1, color: 'blue', label: 'B' }, { v: 1, color: 'blue', label: 'B' }, { v: 1, color: 'amber', label: 'A' }], anim: 'fade' },
            { id: 'pip', type: 'pip', x: 860, y: 140, size: 96, mood: 'wow', anim: 'pop' },
          ],
        },
        {
          say: 'Probability is the number of ways something can happen, divided by the total number of equally likely outcomes.',
          set: [{ id: 'spin', needle: 1035, tween: 3, easing: 'out' }],
          add: [{ id: 'rule', type: 'text', x: 670, y: 290, text: 'P = ways ÷ total', size: 36, fontKey: 'mono', color: 'cyan', anim: 'write' }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'What is the probability the spinner lands on amber?',
            options: ['1/4', '1/3', '3/4', '1'],
            answer: '1/4',
            hint: 'How many amber sections, out of how many sections?',
            explain: '1 amber section out of 4 equal sections: 1/4.',
          },
        },
        {
          say: 'One out of four. And blue? Three ways out of four: three quarters.',
          set: [{ id: 'rule', text: 'P(blue) = 3/4' }],
        },
      ],
    },
    {
      id: 'scale',
      title: 'The scale',
      beats: [
        {
          say: 'Every probability lives on a scale from zero, impossible, to one, certain.',
          add: [
            {
              id: 'nl',
              type: 'numberline',
              x: 120,
              y: 450,
              w: 720,
              min: 0,
              max: 1,
              step: 0.1,
              labelEvery: 5,
              format: 'decimal1',
              marks: [{ v: 0, label: 'impossible', color: 'coral' }, { v: 1, label: 'certain', color: 'green' }],
              anim: 'draw',
              in: 1.2,
            },
          ],
        },
        {
          say: 'An even chance, like a fair coin landing heads, sits exactly halfway: one half.',
          set: [{ id: 'nl', marks: [{ v: 0, label: 'impossible', color: 'coral' }, { v: 0.5, label: '½ even', color: 'amber' }, { v: 1, label: 'certain', color: 'green' }] }],
        },
        {
          ask: {
            kind: 'slider',
            prompt: 'Drag the marker to where “rolling a 6 on a fair dice” belongs.',
            bind: { id: 'nl', prop: 'point' },
            min: 0,
            max: 1,
            step: 0.05,
            start: 0.5,
            answer: 1 / 6,
            tolerance: 0.06,
            format: '{v}',
            answerText: 'about 0.17 (1/6)',
            hint: 'There is 1 six out of 6 equally likely numbers.',
            explain: '1/6 ≈ 0.17 — unlikely, but possible.',
          },
        },
        {
          say: 'One sixth is about nought point one seven. Unlikely, but not impossible.',
          set: [{ id: 'nl', point: 0.17, pointLabel: '1/6', pointColor: 'volt' }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'So what is the probability of NOT rolling a 6?',
            options: ['1/6', '5/6', '6/6', '0'],
            answer: '5/6',
            hint: 'All the probabilities add up to 1.',
            explain: '1 − 1/6 = 5/6.',
          },
        },
        {
          say: 'Five sixths. Something happening and not happening always add up to one.',
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
