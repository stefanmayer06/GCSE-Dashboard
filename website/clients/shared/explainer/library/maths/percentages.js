// Explainer: Percentages (Foundation · Number · percentages)
// Idea: 100% is the whole bar; 10% blocks build any percentage; the
// multiplier is the fast calculator version of the same picture.
export default {
  id: 'percentages-with-a-bar',
  topics: ['percentages'],
  title: 'Percentages: build them from 10%',
  summary: 'See 100% as a bar, build any percentage from 10% blocks, then turn it into a one-step multiplier.',
  hue: 'blue',
  board: 'night',
  scenes: [
    {
      id: 'whole',
      title: '100% is the whole',
      beats: [
        {
          say: 'Per cent means out of a hundred. Let’s find thirty-five percent of eighty.',
          add: [
            { id: 'q', type: 'text', x: 480, y: 88, text: '35% of 80', size: 60, anim: 'write', in: 1 },
            { id: 'pip', type: 'pip', x: 872, y: 452, size: 104, mood: 'think', anim: 'pop' },
          ],
        },
        {
          say: 'Think of eighty as the whole bar. The whole is always one hundred percent.',
          add: [
            { id: 'bar', type: 'bar', x: 150, y: 215, w: 640, h: 84, parts: 1, total: 80, label: '80 = 100%', color: 'blue', anim: 'slide' },
          ],
        },
        {
          say: 'Cut the bar into ten equal blocks. Each block is ten percent: eighty divided by ten is eight.',
          set: [{ id: 'bar', parts: 10, each: true, tween: 1.6 }],
          add: [{ id: 'ten', type: 'chip', x: 470, y: 385, text: '10% = 80 ÷ 10 = 8', color: 'cyan', anim: 'pop', delay: 1 }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'If 10% of 80 is 8, what is 5% of 80?',
            options: ['4', '5', '8', '16'],
            answer: '4',
            hint: '5% is half of 10%.',
            explain: 'Half of 8 is 4.',
          },
        },
      ],
    },
    {
      id: 'build',
      title: 'Build 35%',
      beats: [
        {
          say: 'Thirty-five percent is three blocks of ten percent, plus a half block for five percent.',
          set: [{ id: 'bar', fill: 3.5, tween: 1.8 }],
          remove: ['ten'],
          add: [{ id: 'sum', type: 'text', x: 470, y: 392, text: '8 + 8 + 8 + 4', size: 40, fontKey: 'mono', color: 'cyan', anim: 'write' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'So what is 35% of 80?',
            answer: 28,
            hint: 'Add up the shaded blocks: 8 + 8 + 8 + 4.',
            explain: '8 + 8 + 8 + 4 = 28.',
          },
        },
        {
          say: 'Twenty-eight. You can build any percentage this way, with no calculator at all.',
          set: [{ id: 'sum', text: '8 + 8 + 8 + 4 = 28' }, { id: 'pip', mood: 'cheer' }],
        },
      ],
    },
    {
      id: 'multiplier',
      title: 'The multiplier',
      play: [{ label: 'Blocks shaded', id: 'bar', prop: 'fill', min: 0, max: 12, step: 0.5, value: 3.5, format: '{v} × 10%' }],
      beats: [
        {
          say: 'With a calculator it’s one step. Thirty-five percent is nought point three five, so multiply by nought point three five.',
          remove: ['sum'],
          add: [{ id: 'mult', type: 'text', x: 470, y: 392, text: '80 × 0.35 = 28', size: 42, fontKey: 'mono', color: 'volt', anim: 'write' }],
          set: [{ id: 'pip', mood: 'happy' }],
        },
        {
          say: 'For an increase, keep the whole bar and add more. A twenty percent increase gives one hundred and twenty percent: multiply by one point two.',
          set: [
            { id: 'bar', w: 768, parts: 12, fill: 12, total: 96, label: '120% = 96', tween: 1.4 },
            { id: 'mult', text: '80 × 1.2 = 96' },
            { id: 'q', text: '80 + 20%' },
          ],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'A £50 jacket goes up by 20%. Which calculation gives the new price?',
            options: ['50 × 0.2', '50 × 1.2', '50 + 20', '50 × 0.8'],
            answer: '50 × 1.2',
            hint: 'Increase means keep 100% and add 20%.',
            explain: '100% + 20% = 120% = 1.2, so 50 × 1.2 = £60.',
          },
        },
        {
          say: 'A decrease takes blocks away. Twenty percent off leaves eighty percent, so multiply by nought point eight.',
          set: [
            { id: 'bar', w: 640, parts: 10, fill: 8, total: 80, label: '80 = 100%', tween: 1.4 },
            { id: 'mult', text: '80 × 0.8 = 64' },
            { id: 'q', text: '80 − 20%' },
          ],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'A £60 game has 25% off. What is the sale price, in pounds?',
            answer: 45,
            hint: '100% − 25% = 75%, so multiply by 0.75.',
            explain: '60 × 0.75 = £45.',
          },
        },
        {
          say: 'Forty-five pounds. Pause here and drag the slider to shade any percentage you like.',
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
