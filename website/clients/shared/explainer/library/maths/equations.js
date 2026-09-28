// Explainer: Solving equations (Foundation · Algebra · equations)
// Idea: an equation is a balance — do the same to both sides.
export default {
  id: 'equations-balance',
  topics: ['equations'],
  title: 'Solving equations on a balance',
  summary: 'Why “do the same to both sides” works — tip a real balance and bring it back level.',
  hue: 'purple',
  board: 'night',
  scenes: [
    {
      id: 'balance',
      title: 'It’s a balance',
      beats: [
        {
          say: 'An equation is a balance. Both sides weigh exactly the same. Here is three x plus five equals twenty.',
          add: [
            { id: 'eq', type: 'text', x: 480, y: 76, text: '3x + 5 = 20', size: 56, anim: 'write', in: 1 },
            { id: 'bal', type: 'balance', x: 480, y: 215, width: 600, left: ['x', 'x', 'x', '5'], right: ['20'], tilt: 0, color: 'purple', anim: 'fade' },
          ],
        },
        {
          say: 'Each purple block is the unknown, x. Our goal is one x on its own.',
          pulse: ['bal'],
          add: [{ id: 'pip', type: 'pip', x: 880, y: 440, size: 96, mood: 'think', anim: 'pop' }],
        },
        {
          say: 'First, the five has to go. But watch what happens if we only take it off one side.',
          set: [{ id: 'bal', left: ['x', 'x', 'x'], tilt: 9, tween: 1 }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'The balance has tipped. What must we do to the right-hand side?',
            options: ['Add 5', 'Subtract 5', 'Multiply by 5', 'Nothing'],
            answer: 'Subtract 5',
            hint: 'Whatever you do to one side, do to the other.',
            explain: '20 − 5 = 15, and the balance is level again.',
          },
        },
        {
          say: 'Subtract five from both sides. Twenty take away five is fifteen, and we are level again.',
          set: [
            { id: 'bal', right: ['15'], tilt: 0, tween: 1 },
            { id: 'eq', text: '3x = 15' },
          ],
        },
      ],
    },
    {
      id: 'share',
      title: 'Share it out',
      beats: [
        {
          say: 'Now three x’s balance fifteen. Split both sides into three equal groups.',
          add: [{ id: 'hint', type: 'chip', x: 480, y: 440, text: 'divide both sides by 3', color: 'purple', anim: 'pop' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'So what is x?',
            answer: 5,
            hint: 'Share 15 equally between 3.',
            explain: '15 ÷ 3 = 5.',
          },
        },
        {
          say: 'One x balances five. x equals five.',
          remove: ['hint'],
          set: [
            { id: 'bal', left: ['x'], right: ['5'], tween: 0.8 },
            { id: 'eq', text: 'x = 5' },
            { id: 'pip', mood: 'cheer' },
          ],
        },
        {
          say: 'Always check by substituting back in: three fives are fifteen, plus five is twenty. It balances.',
          add: [{ id: 'check', type: 'text', x: 480, y: 450, text: '3 × 5 + 5 = 20 ✓', size: 36, fontKey: 'mono', color: 'volt', anim: 'write' }],
        },
      ],
    },
    {
      id: 'your-turn',
      title: 'Your turn',
      beats: [
        {
          say: 'Try one more: two x minus three equals eleven.',
          remove: ['check'],
          set: [
            { id: 'eq', text: '2x − 3 = 11' },
            { id: 'bal', left: ['x', 'x', '−3'], right: ['11'], tween: 0.8 },
            { id: 'pip', mood: 'think' },
          ],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'What is the best first move?',
            options: ['Add 3 to both sides', 'Subtract 3 from both sides', 'Divide both sides by 2 first'],
            answer: 'Add 3 to both sides',
            hint: 'Undo the “− 3” with its opposite.',
            explain: 'Adding 3 undoes − 3: 2x = 14.',
          },
        },
        {
          say: 'Add three to both sides: two x equals fourteen.',
          set: [{ id: 'eq', text: '2x = 14' }, { id: 'bal', left: ['x', 'x'], right: ['14'], tween: 0.8 }],
        },
        {
          ask: { kind: 'number', prompt: 'And x = ?', answer: 7, hint: '14 shared between 2.', explain: '14 ÷ 2 = 7.' },
        },
        {
          say: 'x equals seven. Undo the operations in reverse order, and always do the same to both sides.',
          set: [{ id: 'eq', text: 'x = 7' }, { id: 'bal', left: ['x'], right: ['7'], tween: 0.8 }, { id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
