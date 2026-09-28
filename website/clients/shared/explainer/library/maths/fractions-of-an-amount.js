// Explainer: Fractions of an amount (Foundation · Number · fractions)
// Idea: the bar model makes "divide by the bottom, times by the top" visible.
export default {
  id: 'fractions-of-an-amount',
  topics: ['fractions'],
  title: 'Fractions of an amount',
  summary: 'Why “divide by the bottom, times by the top” works — shown with a bar you can cut up yourself.',
  hue: 'blue',
  board: 'night',
  scenes: [
    {
      id: 'question',
      title: 'What it asks',
      beats: [
        {
          say: 'What is three quarters of twenty-eight? Before any rules, let’s see what that question is really asking.',
          add: [
            { id: 'q', type: 'text', x: 480, y: 92, text: '¾ of 28', size: 64, anim: 'write', in: 1.2 },
            { id: 'pip', type: 'pip', x: 870, y: 450, size: 110, mood: 'think', anim: 'pop' },
          ],
        },
        {
          say: 'Picture twenty-eight as one long bar. That bar is the whole amount.',
          add: [{ id: 'bar', type: 'bar', x: 150, y: 225, w: 640, h: 84, parts: 1, fill: 0, total: 28, label: '28', color: 'blue', anim: 'slide' }],
        },
        {
          say: 'The bottom number, four, is the denominator. It tells us how many equal parts to cut the whole into.',
          set: [{ id: 'bar', parts: 4, tween: 1.6 }],
          add: [{ id: 'den', type: 'chip', x: 470, y: 390, text: 'denominator 4 → 4 equal parts', color: 'blue', anim: 'pop', delay: 0.8 }],
          pulse: ['q'],
        },
      ],
    },
    {
      id: 'share',
      title: 'Share it out',
      beats: [
        {
          ask: {
            kind: 'choice',
            prompt: 'How much goes into each of the 4 parts?',
            options: ['4', '7', '12', '21'],
            answer: '7',
            hint: 'Share 28 equally between 4 parts.',
            explain: '28 ÷ 4 = 7 — divide by the bottom.',
          },
        },
        {
          say: 'Each part is worth seven, because twenty-eight divided by four is seven.',
          set: [{ id: 'bar', each: true }],
          remove: ['den'],
          add: [{ id: 'step1', type: 'text', x: 470, y: 392, text: '28 ÷ 4 = 7', size: 40, fontKey: 'mono', color: 'cyan', anim: 'write' }],
        },
        {
          say: 'The top number, three, is the numerator. It says how many of those parts we take.',
          set: [{ id: 'bar', fill: 3, tween: 1.6 }],
          add: [{ id: 'num', type: 'chip', x: 470, y: 466, text: 'numerator 3 → take 3 parts', color: 'amber', anim: 'pop', delay: 0.4 }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'So what is ¾ of 28?',
            answer: 21,
            hint: 'You took 3 parts, and each part is 7.',
            explain: '3 × 7 = 21.',
          },
        },
        {
          say: 'Three parts of seven make twenty-one. Divide by the bottom, then times by the top.',
          remove: ['num'],
          add: [{ id: 'step2', type: 'text', x: 470, y: 466, text: '7 × 3 = 21', size: 40, fontKey: 'mono', color: 'amber', anim: 'write' }],
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
    {
      id: 'any',
      title: 'Any fraction',
      play: [
        { label: 'Parts (bottom)', id: 'bar', prop: 'parts', min: 1, max: 8, step: 1, value: 4 },
        { label: 'Taken (top)', id: 'bar', prop: 'fill', min: 0, max: 8, step: 1, value: 3 },
      ],
      beats: [
        {
          say: 'This works for any fraction of any amount. Pause here and play with the bar: change the number of parts, and how many you take.',
          remove: ['step1', 'step2'],
          add: [{ id: 'rule', type: 'text', x: 470, y: 420, text: 'amount ÷ bottom × top', size: 38, color: 'volt', anim: 'write' }],
          set: [{ id: 'pip', mood: 'happy' }],
        },
        {
          say: 'Let’s try a new one: two fifths of forty.',
          set: [
            { id: 'q', text: '⅖ of 40' },
            { id: 'bar', parts: 5, total: 40, fill: 0, label: '40', tween: 1.2 },
          ],
          remove: ['rule'],
        },
        {
          ask: {
            kind: 'slider',
            prompt: 'Drag to shade two fifths of the bar.',
            bind: { id: 'bar', prop: 'fill' },
            min: 0,
            max: 5,
            step: 1,
            start: 0,
            answer: 2,
            format: '{v} of 5 parts',
            hint: 'The top number says how many parts to shade.',
            explain: 'Two fifths means 2 of the 5 equal parts.',
          },
        },
        {
          say: 'Two parts shaded. Each fifth of forty is eight.',
          set: [{ id: 'bar', fill: 2, tween: 0.4 }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'So what is ⅖ of 40?',
            answer: 16,
            hint: '40 ÷ 5 = 8, then take 2 parts.',
            explain: '40 ÷ 5 × 2 = 16.',
          },
        },
        {
          say: 'Sixteen. Divide by the bottom, times by the top — and the bar shows you why.',
          add: [{ id: 'rule2', type: 'text', x: 470, y: 420, text: '40 ÷ 5 × 2 = 16', size: 40, fontKey: 'mono', color: 'volt', anim: 'write' }],
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
