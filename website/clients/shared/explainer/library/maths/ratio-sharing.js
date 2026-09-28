// Explainer: Sharing in a ratio (Foundation · Ratio · ratio)
// Idea: a ratio is a count of equal parts — find one part, then scale.
export default {
  id: 'ratio-sharing',
  topics: ['ratio'],
  title: 'Sharing in a ratio',
  summary: 'Share an amount in a ratio with a bar model: total the parts, find one part, then build each share.',
  hue: 'amber',
  board: 'night',
  scenes: [
    {
      id: 'parts',
      title: 'Count the parts',
      beats: [
        {
          say: 'Sam and Alex share forty pounds in the ratio two to three. Who gets what?',
          add: [
            { id: 'q', type: 'text', x: 480, y: 84, text: '£40 in the ratio 2 : 3', size: 50, anim: 'write', in: 1 },
            { id: 'pip', type: 'pip', x: 870, y: 452, size: 100, mood: 'think', anim: 'pop' },
          ],
        },
        {
          say: 'A ratio of two to three means Sam gets two equal parts, and Alex gets three of the same parts.',
          add: [
            { id: 'bar', type: 'bar', x: 150, y: 215, w: 640, h: 84, parts: 5, fill: 5, total: 40, label: '£40', fillColors: ['blue', 'blue', 'amber', 'amber', 'amber'], anim: 'slide' },
            { id: 'sam', type: 'chip', x: 278, y: 350, text: 'Sam · 2 parts', color: 'blue', anim: 'pop', delay: 0.8 },
            { id: 'alex', type: 'chip', x: 598, y: 350, text: 'Alex · 3 parts', color: 'amber', anim: 'pop', delay: 1.1 },
          ],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'How many equal parts is the £40 split into?',
            options: ['2', '3', '5', '6'],
            answer: '5',
            hint: 'Add the numbers in the ratio.',
            explain: '2 + 3 = 5 parts.',
          },
        },
      ],
    },
    {
      id: 'one-part',
      title: 'One part',
      beats: [
        {
          say: 'Five parts altogether. So one part is forty divided by five.',
          add: [{ id: 'step', type: 'text', x: 480, y: 430, text: '£40 ÷ 5 = £8 per part', size: 36, fontKey: 'mono', color: 'volt', anim: 'write' }],
        },
        {
          ask: { kind: 'number', prompt: 'How much is one part worth, in pounds?', answer: 8, hint: '£40 shared into 5 equal parts.', explain: '40 ÷ 5 = £8.' },
        },
        {
          say: 'Eight pounds per part. Now every block can be labelled.',
          set: [{ id: 'bar', each: true }],
        },
        {
          ask: { kind: 'number', prompt: 'Sam has 2 parts. How much does Sam get, in pounds?', answer: 16, hint: '2 parts × £8.', explain: '2 × 8 = £16.' },
        },
        {
          say: 'Sam gets sixteen pounds, and Alex gets three parts: twenty-four pounds. Check: sixteen plus twenty-four is forty.',
          set: [
            { id: 'sam', text: 'Sam · £16' },
            { id: 'alex', text: 'Alex · £24' },
            { id: 'step', text: '16 + 24 = 40 ✓' },
            { id: 'pip', mood: 'cheer' },
          ],
        },
      ],
    },
    {
      id: 'again',
      title: 'Your turn',
      beats: [
        {
          say: 'Try this one: share sixty pounds in the ratio three to one.',
          set: [
            { id: 'q', text: '£60 in the ratio 3 : 1' },
            { id: 'bar', parts: 4, total: 60, label: '£60', fill: 4, fillColors: ['coral', 'coral', 'coral', 'cyan'], tween: 1 },
            { id: 'sam', text: '3 parts', x: 390 },
            { id: 'alex', text: '1 part', x: 710 },
            { id: 'step', text: '£60 ÷ 4 = ?' },
            { id: 'pip', mood: 'think' },
          ],
        },
        {
          ask: { kind: 'number', prompt: 'What is the bigger share, in pounds?', answer: 45, hint: 'One part is £60 ÷ 4 = £15.', explain: '3 parts × £15 = £45 (and the smaller share is £15).' },
        },
        {
          say: 'Forty-five pounds and fifteen pounds. Add the ratio, divide to find one part, then multiply.',
          set: [{ id: 'step', text: '£15 per part → £45 : £15' }, { id: 'sam', text: '£45' }, { id: 'alex', text: '£15' }, { id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
