// Explainer: Averages and range (Foundation · Statistics · averages)
// Idea: sort the data first; then median, mode, mean and range each
// answer a different question.
const DATA = [7, 3, 9, 7, 2, 8, 6];
const SORTED = [2, 3, 6, 7, 7, 8, 9];
const xFor = (index) => 186 + index * 98;

const cards = DATA.map((value, index) => ({
  id: `n${index}`,
  type: 'chip',
  x: xFor(index),
  y: 200,
  text: String(value),
  color: 'cyan',
  size: 34,
  fontKey: 'display',
  anim: 'pop',
  delay: index * 0.12,
}));

// Where each original card ends up once sorted (stable for the two 7s).
const used = new Set();
const sortedX = DATA.map((value) => {
  const index = SORTED.findIndex((item, i) => item === value && !used.has(i));
  used.add(index);
  return xFor(index);
});

export default {
  id: 'averages-sorted',
  topics: ['averages'],
  title: 'Mean, median, mode and range',
  summary: 'Sort a data set live, then find each average — and see which question each one answers.',
  hue: 'coral',
  board: 'night',
  scenes: [
    {
      id: 'sort',
      title: 'Sort it first',
      beats: [
        {
          say: 'Seven friends’ quiz scores: seven, three, nine, seven, two, eight and six.',
          add: [...cards, { id: 'pip', type: 'pip', x: 880, y: 450, size: 96, mood: 'think', anim: 'pop' }],
        },
        {
          say: 'Almost every average is easier once the data is in order, smallest to biggest.',
          set: DATA.map((_, index) => ({ id: `n${index}`, x: sortedX[index], tween: 1.4, delay: index * 0.08 })),
          add: [{ id: 'label', type: 'text', x: 480, y: 110, text: 'sorted', size: 30, fontKey: 'hand', color: 'volt', anim: 'write' }],
        },
      ],
    },
    {
      id: 'median-mode',
      title: 'Median & mode',
      beats: [
        {
          ask: {
            kind: 'number',
            prompt: 'The median is the middle value once sorted. What is it?',
            answer: 7,
            hint: 'There are 7 values, so the middle is the 4th.',
            explain: '2, 3, 6, 7, 7, 8, 9 → the 4th value is 7.',
          },
        },
        {
          say: 'The median is seven: the middle of the sorted list.',
          set: [{ id: 'label', text: 'median = 7' }],
          pulse: ['n0'],
        },
        {
          ask: {
            kind: 'choice',
            prompt: 'The mode is the most common value. What is the mode?',
            options: ['2', '6', '7', '9'],
            answer: '7',
            hint: 'Which number appears more than once?',
            explain: '7 appears twice; every other score appears once.',
          },
        },
      ],
    },
    {
      id: 'mean-range',
      title: 'Mean & range',
      beats: [
        {
          say: 'The mean shares the total out equally. Add all seven scores together.',
          set: [{ id: 'label', text: '2 + 3 + 6 + 7 + 7 + 8 + 9 = 42' }],
        },
        {
          ask: {
            kind: 'number',
            prompt: 'The total is 42, shared between 7 people. What is the mean?',
            answer: 6,
            hint: '42 ÷ 7.',
            explain: '42 ÷ 7 = 6.',
          },
        },
        {
          say: 'The mean is six. Finally, the range measures the spread: biggest take away smallest.',
          set: [{ id: 'label', text: 'mean = 42 ÷ 7 = 6' }],
          add: [{ id: 'span', type: 'arrow', x1: xFor(0), y1: 290, x2: xFor(6), y2: 290, color: 'coral', sw: 5, label: 'range', labelDy: 26, anim: 'draw' }],
        },
        {
          ask: { kind: 'number', prompt: 'What is the range?', answer: 7, hint: '9 − 2.', explain: '9 − 2 = 7.' },
        },
        {
          say: 'The range is seven. Median: the middle. Mode: the most common. Mean: share the total. Range: the spread.',
          add: [
            { id: 'sum1', type: 'chip', x: 250, y: 400, text: 'median 7', color: 'cyan', anim: 'pop' },
            { id: 'sum2', type: 'chip', x: 410, y: 400, text: 'mode 7', color: 'blue', anim: 'pop', delay: 0.2 },
            { id: 'sum3', type: 'chip', x: 560, y: 400, text: 'mean 6', color: 'amber', anim: 'pop', delay: 0.4 },
            { id: 'sum4', type: 'chip', x: 710, y: 400, text: 'range 7', color: 'coral', anim: 'pop', delay: 0.6 },
          ],
          set: [{ id: 'pip', mood: 'cheer' }],
        },
      ],
    },
  ],
};
