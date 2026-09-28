// Explainer: Decoding 19th-century texts (English · Reading · reading-19c)
// Khan-style vocabulary lab: break a word into parts, meet it in a
// sentence, and work out meaning (and stance) from context.
const SENTENCE = 'The old soldier met every insult with silent resistance, his countenance as calm as winter stone.';
// Word indices: 7 silent · 8 resistance, · 10 countenance · 12 calm · 15 stone.

export default {
  id: 'word-lab',
  topics: ['reading-19c'],
  title: 'Word lab: meaning from parts and context',
  summary: 'Crack unfamiliar older words by splitting them into parts and reading the clues around them.',
  hue: 'amber',
  board: 'paper',
  scenes: [
    {
      id: 'parts',
      title: 'Split the word',
      beats: [
        {
          say: 'Older texts are full of long words. Here’s one: resistance. Don’t panic. Split it into parts.',
          add: [
            { id: 'word', type: 'text', x: 480, y: 120, text: 'resistance', size: 78, fontKey: 'read', anim: 'write', in: 1.2 },
            { id: 'pip', type: 'pip', x: 860, y: 450, size: 100, mood: 'think', anim: 'pop' },
          ],
        },
        {
          say: 'Re means against, or back. Sist comes from the Latin for stand. And ance turns it into a noun, a thing.',
          add: [
            { id: 'm1', type: 'chip', x: 240, y: 250, text: 're- · against', color: 'amber', size: 24, anim: 'pop' },
            { id: 'm2', type: 'chip', x: 480, y: 250, text: 'sist · stand', color: 'tangerine', size: 24, anim: 'pop', delay: 0.6 },
            { id: 'm3', type: 'chip', x: 725, y: 250, text: '-ance · a thing', color: 'rose', size: 24, anim: 'pop', delay: 1.2 },
          ],
        },
        {
          say: 'Put together: resistance is the act of standing against something.',
          add: [{ id: 'def', type: 'text', x: 480, y: 340, text: 'standing against something', size: 34, fontKey: 'hand', color: 'tangerine', anim: 'write' }],
        },
      ],
    },
    {
      id: 'context',
      title: 'Read the clues',
      beats: [
        {
          say: 'Now meet it in a sentence, the way you will in the exam.',
          remove: ['word', 'm1', 'm2', 'm3', 'def'],
          add: [{ id: 's', type: 'words', x: 90, y: 150, w: 780, text: SENTENCE, size: 38, fontKey: 'read', highlights: [{ from: 8, to: 8, color: 'amber' }], anim: 'fade' }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'In this sentence, “silent resistance” most likely means…',
            options: ['refusing to give in, without saying a word', 'running away from the insults', 'shouting insults back'],
            answer: 'refusing to give in, without saying a word',
            hint: 'Standing against + silent.',
            explain: 'He stands firm against every insult, but quietly.',
          },
        },
        {
          say: 'Next word: countenance. You may never have seen it. Look at the clues around it: it is calm, like stone.',
          set: [{ id: 's', highlights: [{ from: 10, to: 10, color: 'tangerine' }, { from: 12, to: 12, color: 'volt' }, { from: 15, to: 15, color: 'volt' }] }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: '“His countenance as calm as winter stone” — countenance most likely means…',
            options: ['his face and expression', 'his voice', 'his uniform'],
            answer: 'his face and expression',
            hint: 'What part of a person could look calm, like stone?',
            explain: 'Countenance means face or expression — something you can see looking calm.',
          },
        },
      ],
    },
    {
      id: 'stance',
      title: 'Find the stance',
      beats: [
        {
          say: 'You don’t need every word. Get the gist, then ask: how does the writer feel about this person?',
          set: [{ id: 's', highlights: [] }, { id: 'pip', mood: 'happy' }],
          add: [{ id: 'tip', type: 'card', x: 90, y: 330, w: 700, h: 150, title: 'FIRST-READ STRATEGY', body: 'Skim first and last lines → read once for gist\n→ find the writer’s stance → then hunt evidence', color: 'amber', size: 22, fontKey: 'ui', anim: 'slide' }],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'What is the writer’s stance towards the old soldier?',
            options: ['Admiring', 'Mocking', 'Bored'],
            answer: 'Admiring',
            hint: 'Is “calm as winter stone” in the face of insults a compliment?',
            explain: 'Staying calm and firm under insults is presented as strength: the writer admires him.',
          },
        },
        {
          say: 'Admiring. Split the word, read the clues, find the stance — and older texts start to open up.',
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
