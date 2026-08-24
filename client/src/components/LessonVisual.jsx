import MathsVisual from './MathsVisual.jsx';

const LESSON_VISUALS = {
  inequalities: {
    title: 'Read a number line',
    prompt: 'Filled endpoints are included; open endpoints are not.',
    stimulus: { type: 'number-line', min: -4, max: 8, lower: -1, upper: 5, lowerClosed: false, upperClosed: true, alt: 'Number line showing negative one less than x and x less than or equal to five.' },
  },
  graphs: {
    title: 'Inspect rise and run',
    prompt: 'Select either point to inspect its coordinates. The gradient is rise divided by run.',
    stimulus: { type: 'coordinate', points: [{ x: 1, y: 2, label: 'A (1, 2)' }, { x: 5, y: 6, label: 'B (5, 6)' }], segments: [[{ x: 1, y: 2 }, { x: 5, y: 6 }]], alt: 'Coordinate graph of a straight line through A at one two and B at five six.' },
  },
  sequences: {
    title: 'See how a pattern grows',
    prompt: 'Each new cross adds four dots, so the nth term starts with 4n.',
    stimulus: { type: 'dot-pattern', patterns: [1, 2, 3], alt: 'The first three growing cross patterns with five, nine and thirteen dots.' },
  },
  scale: {
    title: 'Match corresponding sides',
    prompt: 'The same multiplier must connect every pair of matching lengths.',
    stimulus: { type: 'shape', kind: 'similar-triangles', labels: [{ text: '4 cm', x: 105, y: 220 }, { text: '12 cm', x: 305, y: 220 }, { text: '5 cm', x: 78, y: 145 }, { text: '?', x: 340, y: 145 }], alt: 'Two similar triangles with corresponding sides four and twelve centimetres.' },
  },
  angles: {
    title: 'Track the angle total',
    prompt: 'The three interior angles of every triangle total 180 degrees.',
    stimulus: { type: 'shape', kind: 'triangle', labels: [{ text: '48°', x: 105, y: 210 }, { text: '67°', x: 315, y: 210 }, { text: '?°', x: 215, y: 78 }], alt: 'Triangle with angles forty-eight degrees, sixty-seven degrees and one unknown.' },
  },
  'area-perimeter': {
    title: 'Separate parallel sides and height',
    prompt: 'The perpendicular height is not the sloping side.',
    stimulus: { type: 'shape', kind: 'trapezium', labels: [{ text: '5 cm', x: 210, y: 62 }, { text: '9 cm', x: 210, y: 225 }, { text: '4 cm', x: 125, y: 140 }], alt: 'Trapezium with parallel sides five and nine centimetres and perpendicular height four centimetres.' },
  },
  circles: {
    title: 'Radius or diameter?',
    prompt: 'The diameter crosses the whole circle through its centre; the radius is half of it.',
    stimulus: { type: 'shape', kind: 'circle', labels: [{ text: 'diameter = 10 cm', x: 210, y: 142 }], alt: 'Circle with a diameter of ten centimetres.' },
  },
  'volume-surface': {
    title: 'See all three dimensions',
    prompt: 'Volume multiplies length, width and height. Surface area counts every face.',
    stimulus: { type: 'shape', kind: 'cuboid', labels: [{ text: '5 cm', x: 270, y: 220 }, { text: '4 cm', x: 345, y: 170 }, { text: '3 cm', x: 115, y: 130 }], alt: 'Cuboid measuring five by four by three centimetres.' },
  },
  pythagoras: {
    title: 'Find the hypotenuse first',
    prompt: 'It is opposite the right angle and is always the longest side.',
    stimulus: { type: 'shape', kind: 'right-triangle', labels: [{ text: '6 cm', x: 120, y: 140 }, { text: '8 cm', x: 210, y: 225 }, { text: '? cm', x: 270, y: 120 }], alt: 'Right-angled triangle with shorter sides six and eight centimetres and unknown hypotenuse.' },
  },
  trigonometry: {
    title: 'Label O, A and H',
    prompt: 'Choose the ratio containing the known side and the side you need.',
    stimulus: { type: 'shape', kind: 'right-triangle', labels: [{ text: 'O', x: 115, y: 140 }, { text: 'A', x: 220, y: 225 }, { text: 'H', x: 270, y: 120 }, { text: '35°', x: 295, y: 200 }], alt: 'Right-angled triangle labelled opposite, adjacent and hypotenuse relative to a thirty-five degree angle.' },
  },
  transformations: {
    title: 'Move from the original point',
    prompt: 'Select the point to inspect it. A vector changes x first and y second.',
    stimulus: { type: 'coordinate', points: [{ x: 1, y: 2, label: 'Original (1, 2)' }], vector: { x: 4, y: 3 }, operation: 'translation', alt: 'Coordinate grid with an original point and a translation vector four right and three up.' },
  },
  'probability-basic': {
    title: 'Use the whole probability scale',
    prompt: 'Every probability lies from 0, impossible, to 1, certain.',
    stimulus: { type: 'probability-scale', alt: 'Probability scale from zero to one.' },
  },
  'probability-combined': {
    title: 'Follow one route at a time',
    prompt: 'Multiply along a route through a tree; add separate successful routes.',
    stimulus: { type: 'tree', stages: [['H  1/2', 'T  1/2'], ['H  1/2', 'T  1/2']], alt: 'Two-stage probability tree for two fair coin flips.' },
  },
  charts: {
    title: 'Compare from a shared scale',
    prompt: 'Select a bar to inspect its exact frequency.',
    stimulus: { type: 'bar', data: [{ label: 'Mon', value: 23 }, { label: 'Tue', value: 17 }, { label: 'Wed', value: 29 }], alt: 'Bar chart with frequencies twenty-three, seventeen and twenty-nine.' },
  },
  averages: {
    title: 'Read value and frequency separately',
    prompt: 'A frequency tells you how many times its value occurs. Do not average the frequency column.',
    stimulus: { type: 'table', headings: ['Number of pets', 'Frequency'], rows: [[1, 4], [2, 3], [3, 5]], alt: 'Frequency table for numbers of pets.' },
  },
  scatter: {
    title: 'Read the overall trend',
    prompt: 'Select any point to inspect it. Correlation describes the pattern, not one point.',
    stimulus: { type: 'scatter', points: [{ x: 1, y: 2 }, { x: 2, y: 2.7 }, { x: 3, y: 4 }, { x: 4, y: 3.6 }, { x: 5, y: 5.8 }, { x: 6, y: 6.3 }], alt: 'Scatter graph with positive correlation.' },
  },
};

export default function LessonVisual({ topicId }) {
  const visual = LESSON_VISUALS[topicId];
  if (!visual) return null;
  return (
    <div className="lesson-visual">
      <div className="lesson-visual-copy">
        <span>Interactive model</span>
        <h3>{visual.title}</h3>
        <p>{visual.prompt}</p>
      </div>
      <MathsVisual stimulus={visual.stimulus} compact />
    </div>
  );
}
