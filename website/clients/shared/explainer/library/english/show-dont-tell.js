// Explainer: Creative writing (English · Writing · creative-writing)
// Idea: replace a telling sentence with sensory, showing detail.
const SHOW = 'My hands would not stop shaking. Somewhere behind me, a floorboard creaked, and the air tasted of dust and old smoke.';
// Word indices: 1 hands · 5 shaking. · 10 floorboard · 11 creaked, · 15 tasted · 17 dust

export default {
  id: 'show-dont-tell',
  topics: ['creative-writing'],
  title: 'Show, don’t tell',
  summary: 'Turn a flat “telling” sentence into sensory detail the examiner can feel — then spot the senses yourself.',
  hue: 'rose',
  board: 'paper',
  scenes: [
    {
      id: 'tell',
      title: 'Telling',
      beats: [
        {
          say: 'Here’s a telling sentence: I was scared. It’s true, but the reader feels nothing.',
          add: [
            { id: 'tell', type: 'text', x: 480, y: 130, text: '“I was scared.”', size: 60, fontKey: 'read', anim: 'write' },
            { id: 'pip', type: 'pip', x: 860, y: 450, size: 96, mood: 'calm', anim: 'pop' },
          ],
        },
        {
          say: 'Showing means giving the evidence of the feeling, through the senses, and letting the reader work it out.',
          add: [
            { id: 'see', type: 'chip', x: 210, y: 260, text: 'sight', color: 'blue', anim: 'pop' },
            { id: 'hear', type: 'chip', x: 360, y: 260, text: 'sound', color: 'purple', anim: 'pop', delay: 0.2 },
            { id: 'touch', type: 'chip', x: 510, y: 260, text: 'touch', color: 'rose', anim: 'pop', delay: 0.4 },
            { id: 'taste', type: 'chip', x: 700, y: 260, text: 'taste · smell', color: 'amber', anim: 'pop', delay: 0.6 },
          ],
        },
      ],
    },
    {
      id: 'show',
      title: 'Showing',
      beats: [
        {
          say: 'Now the same moment, shown.',
          remove: ['tell', 'see', 'hear', 'touch', 'taste'],
          add: [{ id: 's', type: 'words', x: 90, y: 150, w: 780, text: SHOW, size: 38, fontKey: 'read', anim: 'fade', in: 1 }],
          set: [{ id: 'pip', mood: 'wow' }],
        },
        {
          ask: {
            kind: 'tap',
            prompt: 'Tap the word that uses the sense of SOUND.',
            targets: ['s:1', 's:5', 's:11', 's:15', 's:17'],
            answer: 's:11',
            answerText: '“creaked”',
            hint: 'Which word is a noise?',
            explain: '“Creaked” is a sound — and a sound behind you is frightening.',
          },
        },
        {
          ask: {
            kind: 'tap',
            prompt: 'Now tap the word that appeals to TASTE.',
            targets: ['s:1', 's:5', 's:11', 's:15', 's:17'],
            answer: 's:15',
            answerText: '“tasted”',
            hint: 'Which verb is about your mouth?',
            explain: '“Tasted of dust and old smoke” — the reader can almost taste the fear.',
          },
        },
        {
          say: 'Shaking hands, a creak behind you, air that tastes of smoke. The word scared never appears, but the reader feels it.',
          set: [{ id: 's', highlights: [{ from: 5, to: 5, color: 'rose' }, { from: 11, to: 11, color: 'purple' }, { from: 15, to: 15, color: 'amber' }] }, { id: 'pip', mood: 'cheer' }],
        },
      ],
    },
    {
      id: 'openings',
      title: 'Open with intention',
      beats: [
        {
          say: 'The same trick transforms opening lines. Examiners notice a first sentence that shows.',
          remove: ['s'],
          add: [
            { id: 'w', type: 'card', x: 100, y: 90, w: 760, h: 110, title: 'WEAK', body: '“It was raining and I felt scared.”', color: 'coral', size: 24, fontKey: 'read', anim: 'slide' },
            { id: 'st', type: 'card', x: 100, y: 240, w: 760, h: 150, title: 'STRONG', body: '“The rain had been practising all night,\nand by morning the lane had learned to swim.”', color: 'green', size: 24, fontKey: 'read', anim: 'slide', delay: 0.6 },
          ],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'Why is the strong line better?',
            options: ['It personifies the rain and shows the flood instead of telling us', 'It is longer', 'It uses the word “scared”'],
            answer: 'It personifies the rain and shows the flood instead of telling us',
            hint: 'What is the rain doing in the strong line?',
            explain: 'The rain “practising” and the lane “learning to swim” shows the flooding with a playful, precise image.',
          },
        },
        {
          say: 'Exactly. Pick one mood, then let every sense you choose pull in that direction.',
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
