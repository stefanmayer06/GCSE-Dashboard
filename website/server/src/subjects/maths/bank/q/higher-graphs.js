import { makeRand, ri, round } from '../../util.js';

const linePoints = (m, c, xMin, xMax) => {
  const points = [];
  for (let x = xMin; x <= xMax; x++) points.push([x, m * x + c]);
  return points;
};

const curvePoints = (fn, xMin, xMax, step = 0.25) => {
  const points = [];
  for (let x = xMin; x <= xMax + 1e-9; x += step) points.push([round(x, 3), round(fn(x), 3)]);
  return points;
};

export default function higherGraph(v) {
  const rng = makeRand('higher-graphs', v);
  const type = v % 4;
  const familyId = `higher-graph-${type}`;

  if (type === 0) {
    const gradient = ri(rng, 1, 4);
    const intercept = ri(rng, -3, 3);
    return {
      topicId: 'graphs-higher', marks: 2, difficulty: 2, stretch: false, exceptional: false,
      specRefs: ['A9'], ao: ['AO1', 'AO2'], calculator: 'either', familyId,
      text: 'The straight line is shown on the coordinate grid. Work out its gradient.',
      input: { type: 'number' }, answer: gradient, answerText: String(gradient),
      solution: [[`Choose two grid points on the line. The change in y is ${gradient} times the change in x.`, `Gradient = change in y ÷ change in x = ${gradient}.`]],
      hint: 'Use two clear points and calculate rise ÷ run.',
      stimulus: {
        type: 'cartesian', title: 'Straight-line graph', xMin: -4, xMax: 4, yMin: -8, yMax: 8,
        series: [{ kind: 'line', label: `y = ${gradient}x ${intercept < 0 ? '−' : '+'} ${Math.abs(intercept)}`, points: linePoints(gradient, intercept, -4, 4) }],
      },
    };
  }

  if (type === 1) {
    const leftRoot = -ri(rng, 1, 4);
    const rightRoot = ri(rng, 1, 4);
    const fn = (x) => (x - leftRoot) * (x - rightRoot);
    return {
      topicId: 'graphs-higher', marks: 2, difficulty: 2, stretch: false, exceptional: false,
      specRefs: ['A11', 'A12'], ao: ['AO1', 'AO2'], calculator: 'either', familyId,
      text: 'The graph of a quadratic function is shown. Write down the positive solution of f(x) = 0.',
      input: { type: 'number' }, answer: rightRoot, answerText: `x = ${rightRoot}`,
      solution: [[`Solutions of f(x) = 0 are the x-coordinates where the curve crosses the x-axis.`, `The positive crossing is x = ${rightRoot}.`]],
      hint: 'Read the positive x-intercept from the graph.',
      stimulus: {
        type: 'cartesian', title: 'Quadratic graph', xMin: -5, xMax: 5, yMin: -8, yMax: 12,
        series: [{ kind: 'curve', label: 'y = f(x)', points: curvePoints(fn, -5, 5) }],
      },
    };
  }

  if (type === 2) {
    const widths = [5, 10, 5, 10];
    const densities = [1.2, 0.8, 1.6, 0.6].map((density) => round(density + (v % 3) * 0.2, 1));
    const bars = [];
    let from = 0;
    for (let i = 0; i < widths.length; i++) {
      bars.push({ from, to: from + widths[i], height: densities[i] });
      from += widths[i];
    }
    const target = 2;
    const answer = round(widths[target] * densities[target], 2);
    return {
      topicId: 'graphs-higher', marks: 3, difficulty: 2, stretch: false, exceptional: false,
      specRefs: ['S3'], ao: ['AO1', 'AO2'], calculator: 'either', familyId,
      text: `The histogram shows grouped data. Work out the frequency in the class ${bars[target].from} < x ≤ ${bars[target].to}.`,
      input: { type: 'number' }, answer, answerText: String(answer),
      solution: [[`Class width = ${widths[target]} and frequency density = ${densities[target]}.`, `Frequency = class width × frequency density = ${widths[target]} × ${densities[target]} = ${answer}.`]],
      hint: 'For a histogram, bar area represents frequency.',
      stimulus: { type: 'histogram', title: 'Histogram', xLabel: 'Value', yLabel: 'Frequency density', bars },
    };
  }

  const total = 40 + 8 * (v % 4);
  const points = [[0, 0], [10, total * 0.1], [20, total * 0.3], [30, total * 0.5], [40, total * 0.8], [50, total]];
  return {
    topicId: 'graphs-higher', marks: 3, difficulty: 3, stretch: true, exceptional: true,
    specRefs: ['S3', 'S4'], ao: ['AO2', 'AO3'], calculator: 'either', familyId,
    text: 'The cumulative frequency graph shows the times, in minutes, taken by a group. Estimate the median time.',
    input: { type: 'number', tolerance: 0.5, placeholder: 'minutes' }, answer: 30, answerText: 'approximately 30 minutes',
    solution: [[`There are ${total} values, so the median is at cumulative frequency ${total / 2}.`, 'Read across from half the total and then down to the time axis: approximately 30 minutes.']],
    hint: 'Find half the total frequency, read across to the curve, then down to the horizontal axis.',
    stimulus: {
      type: 'cartesian', title: 'Cumulative frequency', xMin: 0, xMax: 50, yMin: 0, yMax: total,
      xLabel: 'Time (minutes)', yLabel: 'Cumulative frequency',
      series: [{ kind: 'curve', label: 'Cumulative frequency', points }],
    },
  };
}
