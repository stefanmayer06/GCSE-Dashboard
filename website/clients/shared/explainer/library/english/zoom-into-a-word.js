// Explainer: Analysing language (English · Reading · language)
// Idea: zoom into one word, unpack its connotations, then build the
// quote → technique → effect → link paragraph. Original practice sentence.
const SENTENCE = 'The wind clawed at the shutters, and the old house groaned as if it remembered every storm.';
// Word indices (split on spaces): 2 clawed · 8 old · 9 house · 10 groaned · 14 remembered

export default {
  id: 'zoom-into-a-word',
  topics: ['language'],
  title: 'Zoom into a word',
  summary: 'Find the word doing the most work, unpack its connotations, and turn it into an exam-ready paragraph.',
  hue: 'tangerine',
  board: 'paper',
  scenes: [
    {
      id: 'find',
      title: 'Find the word',
      beats: [
        {
          say: 'Here is a sentence from a story. Writers choose every word on purpose. Let’s find the one doing the most work.',
          add: [
            { id: 'p', type: 'words', x: 90, y: 150, w: 780, text: SENTENCE, size: 40, fontKey: 'read', anim: 'fade', in: 1 },
            { id: 'pip', type: 'pip', x: 860, y: 450, size: 100, mood: 'think', anim: 'pop' },
          ],
        },
        {
          ask: {
            kind: 'tap',
            prompt: 'Tap the verb that makes the wind sound like a wild animal.',
            targets: ['p:1', 'p:2', 'p:9', 'p:10', 'p:14'],
            answer: 'p:2',
            answerText: '“clawed”',
            hint: 'Which action needs claws?',
            explain: 'Animals claw. The verb gives the wind an animal’s violence.',
          },
        },
        {
          say: 'Clawed. Let’s zoom right in on it.',
          camera: { zoom: 2.2, cx: 330, cy: 175 },
          set: [{ id: 'p', highlights: [{ from: 2, to: 2, color: 'tangerine' }], dim: true }],
        },
      ],
    },
    {
      id: 'connotations',
      title: 'Connotations',
      beats: [
        {
          say: 'Every word carries connotations: the ideas and feelings that come with it. Clawed suggests claws, an attack, pain, something wild.',
          add: [
            { id: 'k1', type: 'chip', x: 200, y: 96, text: 'claws', color: 'tangerine', size: 13, anim: 'pop' },
            { id: 'k2', type: 'chip', x: 460, y: 96, text: 'an attack', color: 'rose', size: 13, anim: 'pop', delay: 0.4 },
            { id: 'k3', type: 'chip', x: 210, y: 262, text: 'pain', color: 'amber', size: 13, anim: 'pop', delay: 0.8 },
            { id: 'k4', type: 'chip', x: 455, y: 262, text: 'something wild', color: 'purple', size: 13, anim: 'pop', delay: 1.2 },
          ],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'So what is the effect of “clawed” on the reader?',
            options: ['The wind seems violent, so the setting feels threatening', 'The wind seems gentle and calming', 'It tells us what time of day it is'],
            answer: 'The wind seems violent, so the setting feels threatening',
            hint: 'Think about those connotations: attack, pain, wild.',
            explain: 'Personifying the wind as a clawing animal makes the storm feel dangerous — as if it wants to get in.',
          },
        },
        {
          say: 'That’s personification: the wind is given an animal’s violence, so the setting feels dangerous, as if the storm is trying to get in.',
          camera: 'reset',
          remove: ['k1', 'k2', 'k3', 'k4'],
        },
      ],
    },
    {
      id: 'paragraph',
      title: 'Write it up',
      beats: [
        {
          say: 'Now build the paragraph: quote, technique, effect, then link back to the question.',
          add: [
            {
              id: 'frame',
              type: 'card',
              x: 90,
              y: 300,
              w: 700,
              h: 200,
              title: 'THE PARAGRAPH FRAME',
              body: 'Quote     “clawed at the shutters”\nTechnique personification (verb)\nEffect    violent, animal-like wind\nLink      the setting feels unsafe',
              color: 'tangerine',
              size: 22,
              fontKey: 'ui',
              anim: 'slide',
            },
          ],
          set: [{ id: 'p', dim: false }],
        },
        {
          ask: {
            kind: 'tap',
            prompt: 'Your turn: tap the verb that gives the house a human SOUND.',
            targets: ['p:8', 'p:9', 'p:10', 'p:14'],
            answer: 'p:10',
            answerText: '“groaned”',
            hint: 'Which word is a noise a person makes?',
            explain: '“Groaned” makes the house sound as if it is in pain.',
          },
        },
        {
          say: 'Groaned. And remembered works the same way: the house seems to have lived through every storm. Two words, one pattern — that is a strong, developed point.',
          set: [{ id: 'p', highlights: [{ from: 2, to: 2, color: 'tangerine' }, { from: 10, to: 10, color: 'rose' }, { from: 14, to: 14, color: 'amber' }] }, { id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
