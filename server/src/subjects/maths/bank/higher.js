import { gcd, makeRand, pick, shuffle, ri, round } from '../util.js';
import { STRANDS, TOPICS } from './topics.js';
import { loadBank, questionsFor } from './index.js';
import higherGraph from './q/higher-graphs.js';

/*
 * Original AQA 8300H-aligned questions. These are not copies of AQA past
 * papers: each generator creates fresh values, while the worked solution is
 * the mark scheme shown to the learner after submission.
 */

const q = (topicId, fields) => ({
  topicId,
  marks: fields.marks,
  difficulty: fields.difficulty ?? 2,
  stretch: fields.difficulty === 3,
  exceptional: !!fields.exceptional,
  specRefs: fields.specRefs || [],
  ao: fields.ao || ['AO1'],
  calculator: fields.calculator || 'either',
  familyId: fields.familyId || topicId,
  text: fields.text,
  input: { type: 'number', ...(fields.input || {}) },
  answer: fields.answer,
  answerText: fields.answerText ?? String(fields.answer),
  solution: fields.solution,
  hint: fields.hint,
  stimulus: fields.stimulus || null,
});

function simplifySurd(value) {
  let square = 1;
  let remainder = value;
  for (let factor = 2; factor * factor <= remainder; factor++) {
    while (remainder % (factor * factor) === 0) {
      square *= factor;
      remainder /= factor * factor;
    }
  }
  return { coefficient: square, radicand: remainder };
}

function surdText({ coefficient, radicand }, denominator = 1) {
  const numerator = radicand === 1 ? String(coefficient) : `${coefficient === 1 ? '' : coefficient}√${radicand}`;
  return denominator === 1 ? numerator : `${numerator}/${denominator}`;
}

function signedTerm(value, suffix = '') {
  if (value === 0) return '';
  return `${value < 0 ? ' − ' : ' + '}${Math.abs(value)}${suffix}`;
}

const higherMeta = [
  { id: 'standard-form-higher', strand: 'number', name: 'Standard Form & Index Laws', blurb: 'Standard form calculations, negative and fractional indices.', examWeight: 7 },
  { id: 'surds', strand: 'number', name: 'Surds & Exact Values', blurb: 'Simplifying, rationalising and using exact surd forms.', examWeight: 5 },
  { id: 'bounds', strand: 'number', name: 'Bounds & Error Intervals', blurb: 'Upper and lower bounds, limits of accuracy and error.', examWeight: 5 },
  { id: 'algebraic-fractions', strand: 'algebra', name: 'Algebraic Fractions', blurb: 'Simplify, solve and combine algebraic fractions.', examWeight: 5 },
  { id: 'quadratics-higher', strand: 'algebra', name: 'Quadratics & Algebraic Methods', blurb: 'Factorising, formulae, completing the square and iteration.', examWeight: 9 },
  { id: 'simultaneous-higher', strand: 'algebra', name: 'Simultaneous Equations', blurb: 'Linear systems and linear/quadratic simultaneous equations.', examWeight: 7 },
  { id: 'functions-higher', strand: 'algebra', name: 'Functions', blurb: 'Function notation, substitution and inverse operations.', examWeight: 8 },
  { id: 'graphs-higher', strand: 'algebra', name: 'Graphs & Graphical Methods', blurb: 'Interpret straight lines, quadratics, histograms and cumulative frequency graphs.', examWeight: 8 },
  { id: 'ratio-growth-higher', strand: 'ratio', name: 'Growth, Decay & Proportion', blurb: 'Compound change, direct/inverse proportion and compound measures.', examWeight: 8 },
  { id: 'similarity-vectors', strand: 'geometry', name: 'Similarity & Vectors', blurb: 'Length scale factors and vector operations.', examWeight: 7 },
  { id: 'circle-theorems', strand: 'geometry', name: 'Circle Theorems & Measures', blurb: 'Circle theorems, sectors, tangents and exact geometry.', examWeight: 7 },
  { id: 'trigonometry-higher', strand: 'geometry', name: 'Advanced Trigonometry', blurb: 'Cosine rule and the area formula for non-right-angled triangles.', examWeight: 9 },
  { id: 'probability-conditional', strand: 'probability', name: 'Conditional Probability', blurb: 'Tree diagrams, conditional probability and distributions.', examWeight: 7 },
  { id: 'statistics-higher', strand: 'statistics', name: 'Higher Statistics', blurb: 'Histograms, cumulative frequency, box plots and sampling.', examWeight: 8 },
  { id: 'proof', strand: 'algebra', name: 'Mathematical Proof', blurb: 'Proof by deduction and systematic reasoning.', examWeight: 4 },
];

const generators = {
  'graphs-higher': higherGraph,
  'standard-form-higher': (v) => {
    const r = makeRand('higher-standard-form', v);
    const t = v % 8;
    const a = [3.2, 4.5, 6.4, 7.2, 8.1, 2.4, 5.6, 9.3][Math.floor(v / 8) % 8];
    const b = [2.5, 3, 1.5, 4, 2, 5, 3.5, 1.2][Math.floor(v / 64) % 8];
    if (t < 4) {
      const answer = t % 2 === 0 ? a * 10 ** (4 + t) * b * 10 ** (t + 2) : (a * 10 ** (5 + t)) / (b * 10 ** (t + 1));
      const rounded = round(answer, 8);
      return q('standard-form-higher', {
        marks: 3, difficulty: 2, answer: rounded, answerText: rounded.toExponential().replace('e+', ' × 10^'),
        specRefs: ['N9'], ao: ['AO1'], familyId: 'standard-form-calculation',
        input: { type: 'math', accepted: [rounded.toExponential(), rounded.toExponential().replace('e+', 'x10^')] },
        text: t % 2 === 0 ? `Work out ${a} × 10^${4 + t} × ${b} × 10^${t + 2}. Give your answer in standard form.` : `Work out (${a} × 10^${5 + t}) ÷ (${b} × 10^${t + 1}). Give your answer in standard form.`,
        solution: [['Multiply or divide the numbers and use the index laws for powers of 10.', `The value is ${rounded}; in standard form this is ${rounded.toExponential().replace('e+', ' × 10^')}.`]],
        hint: 'Deal with the coefficients and powers of 10 separately. The coefficient must be between 1 and 10.',
      });
    }
    const bases = [4, 9, 16, 25, 8, 27, 32, 81];
    const n = bases[Math.floor(v / 8) % bases.length];
    const exponent = t === 4 ? 0.5 : t === 5 ? 1 / 3 : t === 6 ? -1 : -2;
    const answer = round(n ** exponent, 3);
    return q('standard-form-higher', {
      marks: 2, difficulty: 3, answer, answerText: String(answer),
      specRefs: ['N7'], ao: ['AO1'], familyId: 'fractional-negative-indices',
      input: { tolerance: 0.0005 },
      text: `Work out ${n}^${exponent === 0.5 ? '1/2' : exponent === 1 / 3 ? '1/3' : exponent}. Give your answer to 3 decimal places where necessary.`,
      solution: [[`Use a fractional or negative index: ${n}^${exponent} = ${answer}.`, `Answer = ${answer}.`]],
      hint: 'A power of 1/2 means square root. A negative power means the reciprocal.',
    });
  },
  surds: (v) => {
    const t = v % 8;
    const n = [8, 12, 18, 20, 24, 27, 32, 45][Math.floor(v / 8) % 8];
    if (t < 4) {
      const factor = [4, 3, 2, 5][t];
      const exact = simplifySurd(n * factor);
      const exactText = surdText(exact);
      const answer = round(Math.sqrt(n * factor), 6);
      return q('surds', {
        marks: 2, difficulty: 2, answer, answerText: exactText,
        specRefs: ['N8'], ao: ['AO1'], familyId: 'simplify-surds',
        input: { type: 'math', accepted: [exactText, exactText.replace('√', 'sqrt')] },
        text: `Simplify √${n} × √${factor}. Give your answer as a single surd.`,
        solution: [[`Multiply inside the square root: √${n} × √${factor} = √${n * factor}.`, `Take out square factors: exact answer = ${exactText}.`]],
        hint: 'Use √a × √b = √(ab), then look for square factors.',
      });
    }
    const a = [3, 5, 7, 2][t - 4];
    const b = [2, 3, 4, 5][t - 4];
    const divisor = gcd(a, 2 * b);
    const numerator = a / divisor;
    const denominator = (2 * b) / divisor;
    const answer = round((numerator * Math.sqrt(2)) / denominator, 6);
    const exactText = `${numerator === 1 ? '' : numerator}√2/${denominator}`;
    return q('surds', {
      marks: 3, difficulty: 3, answer, answerText: exactText,
      specRefs: ['N8'], ao: ['AO1', 'AO2'], familyId: 'rationalise-surds',
      input: { type: 'math', accepted: [exactText, exactText.replace('√', 'sqrt')] },
      text: `Rationalise the denominator of ${a}/(${b}√2). Give an exact answer.`,
      solution: [[`Multiply top and bottom by √2: ${a}/(${b}√2) = ${a}√2/(${b} × 2).`, `Simplify to ${exactText}.`]],
      hint: 'Multiply numerator and denominator by the surd in the denominator.',
    });
  },
  bounds: (v) => {
    const t = v % 8;
    const unitIndex = Math.floor(v / 8) % 8;
    const unit = t % 2 === 0 ? 0.1 : 1;
    const x = unit === 1 ? [3, 7, 13, 9, 45, 120, 28, 19][unitIndex] : [3.4, 7.2, 12.5, 0.9, 4.5, 12, 2.8, 18.6][unitIndex];
    const lower = x - unit / 2;
    const upper = x + unit / 2;
    const answer = round((upper - lower) / 2, 6);
    return q('bounds', {
      marks: 2, difficulty: t > 4 ? 3 : 2, answer, answerText: `${answer}`,
      specRefs: ['N15'], ao: ['AO1'], familyId: 'error-intervals',
      text: `A length is recorded as ${x}${unit === 1 ? ' cm to the nearest centimetre' : ' cm to the nearest millimetre'}. What is the maximum possible error in the recorded length?`,
      solution: [[`The error interval is ${lower} ≤ length < ${upper}.`, `Maximum error = half the unit = ${answer} cm.`]],
      hint: 'The maximum error is half the unit used for rounding.',
    });
  },
  'algebraic-fractions': (v) => {
    const t = v % 8;
    const a = [2, 3, 4, 5, 6, 7, 8, 9][Math.floor(v / 8) % 8];
    const b = a + 2;
    if (t < 4) {
      const x = [2, 3, 4, 5][t];
      const coefficient = 2 * x;
      const numerator = 2 * (x + 1);
      const answer = x;
      return q('algebraic-fractions', {
        marks: 3, difficulty: 2, answer, answerText: `x = ${answer}`,
        specRefs: ['A4', 'A18'], ao: ['AO1'], familyId: 'solve-algebraic-fractions',
        text: `Solve  ${coefficient}/x = ${numerator}/(x + 1).`,
        solution: [[`Cross multiply: ${coefficient}(x + 1) = ${numerator}x.`, `Rearrange to ${coefficient} = 2x, so x = ${answer}.`]],
        hint: 'Cross multiply, then simplify before solving.',
      });
    }
    const answer = round((a + b) / (a * b), 6);
    return q('algebraic-fractions', {
      marks: 3, difficulty: 3, answer, answerText: `1/${a} + 1/${b} = ${answer}`,
      specRefs: ['A4'], ao: ['AO1'], familyId: 'add-algebraic-fractions',
      input: { tolerance: 0.0005 },
      text: `Work out  1/${a} + 1/${b}  as a decimal to 3 decimal places.`,
      solution: [[`Use the common denominator ${a * b}: 1/${a} + 1/${b} = ${b + a}/${a * b}.`, `Decimal answer = ${answer}.`]],
      hint: 'Use the product of the denominators as a common denominator, then simplify.',
    });
  },
  'quadratics-higher': (v) => {
    const t = v % 8;
    const roots = [[2, 5], [1, 6], [-2, 4], [-3, 2], [3, 7], [-4, 1], [2, 8], [-1, 5]][Math.floor(v / 8) % 8];
    if (t < 4) {
      const [a, b] = roots;
      const sum = a + b;
      const product = a * b;
      const answer = a;
      return q('quadratics-higher', {
        marks: 3, difficulty: 2, answer, answerText: `x = ${a} or x = ${b}`,
        specRefs: ['A18'], ao: ['AO1'], familyId: 'factorise-quadratic',
        text: `Solve  x²${signedTerm(-sum, 'x')}${signedTerm(product)} = 0. Give the smaller solution.`,
        solution: [[`Factorise: (x − ${a})(x − ${b}) = 0.`, `So x = ${a} or x = ${b}; the smaller solution is ${answer}.`]],
        hint: 'Find two numbers with product equal to the constant and sum equal to the coefficient of x.',
      });
    }
    const p = [1, 2, 3, 4][t - 4];
    const answer = round((-p + Math.sqrt(p * p + 24)) / 2, 3);
    return q('quadratics-higher', {
      marks: 4, difficulty: 3, answer, answerText: `x ≈ ${answer}`,
      specRefs: ['A18'], ao: ['AO1', 'AO2'], calculator: 'required', familyId: 'quadratic-formula',
      input: { tolerance: 0.0005 },
      text: `Solve  x² + ${p}x − 6 = 0. Give the positive solution to 3 decimal places.`,
      solution: [[`Use the quadratic formula with a = 1, b = ${p}, c = −6.`, `x = (−${p} + √(${p}² + 24)) / 2 = ${answer}.`]],
      hint: 'If it does not factorise, use the quadratic formula and choose the positive root.',
    });
  },
  'simultaneous-higher': (v) => {
    const t = v % 8;
    const x = [2, 3, 4, 5, 6, 7, 8, 9][Math.floor(v / 8) % 8];
    const y = [3, 5, 2, 4, 6, 1, 7, 8][Math.floor(v / 64) % 8];
    if (t < 4) {
      const a = x + y;
      const b = x - y;
      return q('simultaneous-higher', {
        marks: 3, difficulty: 2, answer: x, answerText: `x = ${x}, y = ${y}`,
        specRefs: ['A19'], ao: ['AO1'], familyId: 'linear-simultaneous',
        text: `Solve simultaneously: x + y = ${a}; x − y = ${b}. Give the value of x.`,
        solution: [[`Add the equations: 2x = ${a + b}.`, `x = ${x}; substituting gives y = ${y}.`]],
        hint: 'Add the equations to eliminate y.',
      });
    }
    const gradient = 2;
    const intercept = -y;
    const curveX = gradient - x - y;
    const curveConstant = intercept + x * y;
    const answer = y;
    return q('simultaneous-higher', {
      marks: 4, difficulty: 3, answer, answerText: `x = ${answer}`,
      specRefs: ['A19'], ao: ['AO1', 'AO3'], calculator: 'either', familyId: 'linear-quadratic-simultaneous', exceptional: true,
      text: `The line y = ${gradient}x ${signedTerm(intercept)} intersects the curve y = x²${signedTerm(curveX, 'x')}${signedTerm(curveConstant)}. One x-coordinate is ${x}. Find the other x-coordinate.`,
      solution: [[`Set the equations equal. This simplifies to x² − ${x + y}x + ${x * y} = 0.`, `Factorise as (x − ${x})(x − ${y}) = 0. The other x-coordinate is ${y}.`]],
      hint: 'At an intersection, the two expressions for y are equal. Substitute and solve the resulting quadratic.',
    });
  },
  'functions-higher': (v) => {
    const t = v % 8;
    const a = [2, 3, 4, 5, 2, 3, 4, 5][Math.floor(v / 8) % 8];
    const c = [1, 2, -1, 3, 4, -2, 5, 1][Math.floor(v / 64) % 8];
    if (t < 4) {
      const x = 3 + t;
      const answer = a * x + c;
      return q('functions-higher', {
        marks: 2, difficulty: 2, answer, answerText: `f(${x}) = ${answer}`,
        specRefs: ['A7'], ao: ['AO1'], familyId: 'function-substitution',
        text: `f(x) = ${a}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}. Work out f(${x}).`,
        solution: [[`Substitute x = ${x}: f(${x}) = ${a}(${x}) ${c < 0 ? '−' : '+'} ${Math.abs(c)}.`, `f(${x}) = ${answer}.`]],
        hint: 'Replace every x with the given value, using brackets if needed.',
      });
    }
    const x = [2, 3, 4, 5][t - 4];
    const answer = round((x - c) / a, 3);
    return q('functions-higher', {
      marks: 3, difficulty: 3, answer, answerText: `x = ${answer}`,
      specRefs: ['A7'], ao: ['AO1', 'AO2'], familyId: 'inverse-function-value',
      input: { tolerance: 0.0005 },
      text: `f(x) = ${a}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}. f(x) = ${x}. Work out x to 3 decimal places where necessary.`,
      solution: [[`Set ${a}x ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${x}.`, `Rearrange and divide by ${a}: x = ${answer}.`]],
      hint: 'Treat f(x) as the whole expression and solve the resulting linear equation.',
    });
  },
  'ratio-growth-higher': (v) => {
    const t = v % 8;
    const start = [800, 1200, 2500, 640, 1500, 3000, 450, 2200][Math.floor(v / 8) % 8];
    const percent = [5, 8, -8, 12, -15, 4, 15, -10][Math.floor(v / 8) % 8];
    const rate = 1 + percent / 100;
    if (t < 4) {
      const years = t + 2;
      const answer = round(start * rate ** years, 2);
      return q('ratio-growth-higher', {
        marks: 3, difficulty: 2, answer, answerText: `${answer}`,
        specRefs: ['R16'], ao: ['AO1', 'AO3'], calculator: 'required', familyId: 'compound-growth',
        input: { placeholder: '£', tolerance: 0.005 },
        text: `An investment of £${start} ${percent < 0 ? 'decreases' : 'increases'} by ${Math.abs(percent)}% each year. Work out its value after ${years} years, to the nearest penny.`,
        solution: [[`Use the multiplier ${rate}: value = ${start} × ${rate}^${years}.`, `Value = £${answer}.`]],
        hint: 'Repeated percentage change uses a multiplier raised to the number of changes.',
        input: { placeholder: '£' },
      });
    }
    const baseX = t + 2;
    const baseY = 4 * (Math.floor(v / 8) % 8 + 2);
    const answer = 2 * baseX;
    return q('ratio-growth-higher', {
      marks: 4, difficulty: 3, answer, answerText: `${answer}`,
      specRefs: ['R13'], ao: ['AO1', 'AO3'], familyId: 'inverse-square-proportion',
      text: `y is inversely proportional to x² and x > 0. When x = ${baseX}, y = ${baseY}. Find x when y = ${baseY / 4}.`,
      solution: [[`For inverse proportion, y = k/x². A quarter of y requires x² to be four times as large.`, `x is doubled: x = ${answer}.`]],
      hint: 'For inverse proportion to x², scaling x by a factor changes y by the square of that factor.',
    });
  },
  'similarity-vectors': (v) => {
    const t = v % 8;
    const scale = [2, 3, 4, 1.25, 1.5, 2.5, 3.5, 1.75][Math.floor(v / 8) % 8];
    if (t < 4) {
      const length = [6, 8, 10, 12][t];
      const answer = round((length / 2) * scale, 6);
      return q('similarity-vectors', {
        marks: 2, difficulty: 2, answer, answerText: `${answer} cm`,
        specRefs: ['G19'], ao: ['AO1'], familyId: 'similar-lengths',
        text: `Two similar shapes have a scale factor of ${scale}. The smaller shape has a side of ${length / 2} cm. Find the corresponding side on the larger shape.`,
        solution: [[`The scale factor is ${scale}.`, `Corresponding length = ${length / 2} × ${scale} = ${answer} cm.`]],
        hint: 'Find the scale factor from a pair of corresponding sides, then multiply.',
      });
    }
    const a = t - 3;
    const b = t - 1;
    const answer = a + b;
    return q('similarity-vectors', {
      marks: 3, difficulty: 3, answer, answerText: String(answer),
      specRefs: ['G25'], ao: ['AO1', 'AO2'], familyId: 'vector-addition',
      text: `Vector a has x-component ${a}. Vector b has x-component ${b}. Work out the x-component of a + b.`,
      solution: [[`Add corresponding vector components.`, `x-component = ${a} + ${b} = ${answer}.`]],
      hint: 'Vectors are added component by component.',
    });
  },
  'circle-theorems': (v) => {
    const t = v % 8;
    const angle = [34, 42, 56, 68, 27, 38, 49, 72][Math.floor(v / 8) % 8];
    if (t < 4) {
      const answer = angle * 2;
      return q('circle-theorems', {
        marks: 2, difficulty: 2, answer, answerText: `${answer}°`,
        specRefs: ['G10'], ao: ['AO1', 'AO2'], familyId: 'angle-at-centre',
        text: `An angle at the circumference standing on the minor arc AB is ${angle}°. Find the smaller angle at the centre standing on the same arc AB.`,
        solution: [[`The angle at the centre is twice the angle at the circumference.`, `Centre angle = 2 × ${angle} = ${answer}°.`]],
        hint: 'The angle at the centre is twice the angle at the circumference standing on the same arc.',
        input: { placeholder: '°' },
      });
    }
    const radius = [4, 5, 6, 7][t - 4];
    const answer = round((angle / 360) * Math.PI * radius * radius, 2);
    return q('circle-theorems', {
      marks: 3, difficulty: 3, answer, answerText: `${answer} cm²`,
      specRefs: ['G17'], ao: ['AO1'], calculator: 'required', familyId: 'sector-area',
      input: { tolerance: 0.005 },
      text: `A sector has radius ${radius} cm and angle ${angle}°. Work out its area to 2 decimal places.`,
      solution: [[`Area of a sector = angle/360 × πr².`, `Area = ${angle}/360 × π × ${radius}² = ${answer} cm².`]],
      hint: 'Use angle/360 × πr² for the area of a sector.',
    });
  },
  'trigonometry-higher': (v) => {
    const t = v % 8;
    const side = [7, 9, 11, 13, 8, 10, 12, 14][Math.floor(v / 8) % 8];
    if (t < 4) {
      const angle = [30, 45, 60, 30][t];
      const answer = round(0.5 * side * side * Math.sin(angle * Math.PI / 180), 3);
      return q('trigonometry-higher', {
        marks: 3, difficulty: 2, answer, answerText: `${answer}`,
        specRefs: ['G23'], ao: ['AO1', 'AO2'], calculator: angle === 30 ? 'either' : 'required', familyId: 'triangle-area-sine',
        input: { tolerance: 0.0005 },
        text: `A triangle has two sides of ${side} cm with an included angle of ${angle}°. Work out its area to 3 decimal places.`,
        solution: [[`Use area = 1/2 ab sin C.`, `Area = 1/2 × ${side} × ${side} × sin ${angle}° = ${answer} cm².`]],
        hint: 'The non-right-angled triangle area formula is 1/2ab sin C.',
      });
    }
    const a = [6, 8, 10, 12][t - 4];
    const b = [8, 10, 12, 14][t - 4];
    const angle = [60, 90, 120, 60][t - 4];
    const answer = round(Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(angle * Math.PI / 180)), 3);
    return q('trigonometry-higher', {
      marks: 4, difficulty: 3, answer, answerText: `${answer} cm`,
      specRefs: ['G23'], ao: ['AO1', 'AO3'], calculator: angle === 90 ? 'either' : 'required', familyId: 'cosine-rule-side',
      input: { tolerance: 0.0005 },
      text: `Two sides of a triangle are ${a} cm and ${b} cm. The angle between them is ${angle}°. Work out the third side to 3 decimal places.`,
      solution: [[`Use the cosine rule: c² = a² + b² − 2ab cos C.`, `c = √(${a}² + ${b}² − 2 × ${a} × ${b} × cos ${angle}°) = ${answer} cm.`]],
      hint: 'Use the cosine rule when you know two sides and the included angle.',
    });
  },
  'probability-conditional': (v) => {
    const t = v % 8;
    const red = 2 + (Math.floor(v / 8) % 4);
    const blue = 3 + (Math.floor(v / 64) % 4);
    const total = red + blue;
    if (t < 4) {
      const answer = round((red / total) * ((red - 1) / (total - 1)), 3);
      return q('probability-conditional', {
        marks: 3, difficulty: 2, answer, answerText: `${answer}`,
        specRefs: ['P8'], ao: ['AO1', 'AO2'], familyId: 'without-replacement',
        input: { tolerance: 0.0005 },
        text: `A bag contains ${red} red counters and ${blue} blue counters. Two counters are taken without replacement. Find the probability that both are red. Give your answer to 3 decimal places.`,
        solution: [[`P(first red) = ${red}/${total}; after a red, P(second red) = ${red - 1}/${total - 1}.`, `Multiply: ${red}/${total} × ${red - 1}/${total - 1} = ${answer}.`]],
        hint: 'Without replacement, the total and the number of red counters change after the first draw.',
      });
    }
    const p = [0.2, 0.3, 0.4, 0.25][t - 4];
    const answer = round(p * (1 - p), 6);
    return q('probability-conditional', {
      marks: 3, difficulty: 3, answer, answerText: `${answer}`,
      specRefs: ['P8'], ao: ['AO1', 'AO2'], familyId: 'independent-complements',
      text: `Events A and B are independent. P(A) = ${p} and P(B) = ${1 - p}. Work out P(A and not B).`,
      solution: [[`P(not B) = 1 − ${1 - p} = ${p}.`, `Independent events multiply: P(A and not B) = ${p} × ${p} = ${answer}.`]],
      hint: 'Find the complement first, then multiply probabilities for independent events.',
    });
  },
  'statistics-higher': (v) => {
    const t = v % 8;
    const freq = [4, 6, 8, 10, 12, 15, 18, 20][Math.floor(v / 8) % 8];
    if (t < 4) {
      const width = [5, 10, 20, 25][t];
      const density = round(freq / width, 6);
      return q('statistics-higher', {
        marks: 2, difficulty: 2, answer: density, answerText: `${density}`,
        specRefs: ['S3'], ao: ['AO1'], familyId: 'frequency-density',
        text: `A histogram class has class width ${width} and frequency ${freq}. Work out the frequency density.`,
        solution: [[`Frequency density = frequency ÷ class width.`, `Density = ${freq} ÷ ${width} = ${density}.`]],
        hint: 'Frequency density is frequency divided by class width.',
      });
    }
    const lowerQuartile = [12, 18, 24, 30][t - 4];
    const upperQuartile = lowerQuartile + [10, 12, 16, 20][t - 4];
    const answer = upperQuartile - lowerQuartile;
    return q('statistics-higher', {
      marks: 3, difficulty: 3, answer, answerText: String(answer),
      specRefs: ['S4'], ao: ['AO1', 'AO2'], familyId: 'interquartile-range',
      text: `A box plot has lower quartile ${lowerQuartile} and upper quartile ${upperQuartile}. Work out the interquartile range.`,
      solution: [[`Interquartile range = upper quartile − lower quartile.`, `IQR = ${upperQuartile} − ${lowerQuartile} = ${answer}.`]],
      hint: 'Subtract the lower quartile from the upper quartile.',
    });
  },
  proof: (v) => {
    const t = v % 8;
    const n = [3, 5, 7, 9, 11, 13, 15, 17][Math.floor(v / 8) % 8];
    if (t < 4) {
      const answer = 'B';
      return q('proof', {
        marks: 2, difficulty: 3, answer, answerText: 'B: one of two consecutive integers is even',
        specRefs: ['A6'], ao: ['AO2'], familyId: 'consecutive-integer-proof',
        input: { type: 'mcq', choices: [
          { label: 'A', text: 'Both consecutive integers are always even' },
          { label: 'B', text: 'One of two consecutive integers is even' },
          { label: 'C', text: 'Two odd numbers always have an even product' },
          { label: 'D', text: 'Their sum is always even' },
        ] },
        text: 'Which statement completes a proof that the product of two consecutive integers is always even?',
        solution: [['One of any two consecutive integers is even.', 'Therefore their product always contains a factor of 2 and is divisible by 2.']],
        hint: 'Consecutive integers alternate odd/even. A product containing an even factor is even.',
      });
    }
    const answer = n + 1;
    const total = 3 * answer;
    return q('proof', {
      marks: 3, difficulty: 3, answer, answerText: `n = ${answer}`,
      specRefs: ['A6', 'A17'], ao: ['AO1', 'AO2'], familyId: 'consecutive-integers',
      text: `The sum of three consecutive integers is ${total}. Find the middle integer.`,
      solution: [[`Let the integers be n − 1, n and n + 1. Their sum is 3n.`, `3n = ${total}, so n = ${answer}.`]],
      hint: 'Represent three consecutive integers as n−1, n and n+1, then simplify their sum.',
    });
  },
};

const higherCache = new Map();

export async function loadHigherBank() {
  if (higherCache.size) return higherCache;
  await loadBank();
  for (const meta of higherMeta) {
    const generator = generators[meta.id];
    const set = [];
    for (let v = 0; v < 64; v++) {
      const item = generator(v);
      if (!item) break;
      set.push({ ...item, id: `higher-${meta.id}-${v}`, topic: meta.name, strand: meta.strand, strandName: STRANDS[meta.strand].name, tier: 'higher' });
    }
    higherCache.set(meta.id, set);
  }
  // Foundation topics still have useful entry-level practice inside Higher.
  for (const topic of TOPICS) {
    const set = (questionsFor(topic.id) || []).map((item) => ({
      ...item,
      id: `higher-${item.id}`,
      tier: 'higher',
      difficulty: item.difficulty,
      stretch: item.difficulty === 3,
      exceptional: false,
      calculator: 'either',
      familyId: `${topic.id}-${item.text.split('\n')[0]}`,
      specRefs: [],
      ao: item.difficulty === 1 ? ['AO1'] : item.difficulty === 2 ? ['AO1', 'AO2'] : ['AO2', 'AO3'],
    }));
    higherCache.set(topic.id, set);
  }
  return higherCache;
}

export function higherBankSize() {
  if (!higherCache.size) return null;
  return [...higherCache.values()].reduce((n, set) => n + set.length, 0);
}

export function higherQuestionsFor(topicId) {
  return higherCache.get(topicId) || [];
}

export function higherTopics() {
  return [
    ...TOPICS.map((t) => ({ ...t, tier: 'both' })),
    ...higherMeta.map((t) => ({
      ...t,
      tier: 'higher',
      notes: [
        { t: 'p', text: `${t.name} is a Higher-tier focus in AQA 8300H. Work symbolically first, then use a calculator only when the method requires it.` },
        { t: 'b', items: ['Write a clear method before substituting values.', 'Keep exact forms until the final line where the question asks for a decimal.', 'Check units, sensible size and the wording of the answer.'] },
        { t: 'f', title: 'Exam habit', text: 'Method marks are available: show the formula, substitution and an accurate final answer.' },
      ],
      resources: [
        { label: 'Corbettmaths', url: `https://corbettmaths.com/?s=${encodeURIComponent(t.name)}`, why: 'Free videos and practice.' },
        { label: 'Maths Genie', url: 'https://www.mathsgenie.co.uk/gcse-revision.html', why: 'Free GCSE Higher revision resources.' },
      ],
    })),
  ];
}

export const HIGHER_PAPERS = {
  1: {
    id: 1, code: '8300/1H', name: 'Paper 1', calculator: false, spec: 'Non-calculator',
    blurb: 'Non-calculator. Any 8300H topic may appear, using exact and non-calculator-friendly values.',
    strands: { number: 15, algebra: 30, ratio: 20, geometry: 20, probability: 8, statistics: 7 },
  },
  2: {
    id: 2, code: '8300/2H', name: 'Paper 2', calculator: true, spec: 'Calculator',
    blurb: 'Calculator. Any 8300H topic may appear, including numerical and graphical methods.',
    strands: { number: 15, algebra: 30, ratio: 20, geometry: 20, probability: 8, statistics: 7 },
  },
  3: {
    id: 3, code: '8300/3H', name: 'Paper 3', calculator: true, spec: 'Calculator',
    blurb: 'Calculator. Any 8300H topic may appear, with reasoning and multi-step problem solving.',
    strands: { number: 15, algebra: 30, ratio: 20, geometry: 20, probability: 8, statistics: 7 },
  },
};

export function higherPaperList() {
  return Object.values(HIGHER_PAPERS).map((p) => ({
    ...p,
    strands: Object.entries(p.strands).map(([id, percent]) => ({ id, name: STRANDS[id].name, color: STRANDS[id].color, percent })),
    marks: { full: 80, short: 40 },
    minutes: { full: 90, short: 45 },
    tier: 'higher',
  }));
}

function strandPool(strand, exclude = new Set()) {
  const high = [];
  const foundation = [];
  for (const set of higherCache.values()) {
    for (const item of set) {
      if (item.strand !== strand || exclude.has(item.id)) continue;
      if (higherMeta.some((meta) => item.topicId === meta.id)) high.push(item);
      else foundation.push(item);
    }
  }
  return [...high, ...foundation];
}

function chooseForMarks(rng, pool, marks, { calculator, allowExceptional = false } = {}) {
  const chosen = [];
  let left = marks;
  const high = pool.filter((item) => higherMeta.some((meta) => item.topicId === meta.id));
  const foundation = pool.filter((item) => !higherMeta.some((meta) => item.topicId === meta.id));
  const compatible = (item) => (calculator || item.calculator !== 'required') && (allowExceptional || !item.exceptional);
  const remaining = [...shuffle(rng, high.filter(compatible)), ...shuffle(rng, foundation.filter(compatible))];
  while (left > 0) {
    const exact = remaining.filter((item) => item.marks === left);
    const candidates = exact.length ? exact : remaining.filter((item) => item.marks <= left);
    if (!candidates.length) return null;
    const item = pick(rng, candidates.slice(0, Math.min(candidates.length, 20)));
    chosen.push(item);
    left -= item.marks;
    const index = remaining.indexOf(item);
    if (index >= 0) remaining.splice(index, 1);
  }
  return chosen;
}

function sanitize(item, { withHint = false } = {}) {
  const out = {
    id: item.id, topicId: item.topicId, topic: item.topic, strand: item.strand, strandName: item.strandName,
    marks: item.marks, difficulty: item.difficulty, stretch: !!item.stretch, exceptional: !!item.exceptional,
    specRefs: item.specRefs || [], ao: item.ao || [], text: item.text, input: item.input, stimulus: item.stimulus || null,
  };
  if (withHint) out.hint = item.hint;
  return out;
}

export function buildHigherPaper(type = 'full', paperId = 1) {
  const paper = HIGHER_PAPERS[paperId] || HIGHER_PAPERS[1];
  const total = type === 'full' ? 80 : 40;
  const budgets = total === 80
    ? { number: 12, algebra: 24, ratio: 16, geometry: 16, probability: 6, statistics: 6 }
    : { number: 6, algebra: 12, ratio: 8, geometry: 8, probability: 3, statistics: 3 };
  const rng = makeRand('higher-paper', Math.floor(Math.random() * 2 ** 31));
  for (let attempt = 0; attempt < 1000; attempt++) {
    const remainingBudgets = { ...budgets };
    const graphPool = higherQuestionsFor('graphs-higher').filter((item) => (paper.calculator || item.calculator !== 'required'));
    const graph = pick(rng, graphPool);
    const picked = [graph];
    const used = new Set();
    used.add(graph.id);
    remainingBudgets[graph.strand] -= graph.marks;

    if (!graph.exceptional) {
      const challengePool = [...higherCache.values()].flat().filter((item) => item.exceptional && !used.has(item.id) && (paper.calculator || item.calculator !== 'required') && item.marks <= remainingBudgets[item.strand]);
      const challenge = pick(rng, challengePool);
      if (challenge) {
        picked.push(challenge);
        used.add(challenge.id);
        remainingBudgets[challenge.strand] -= challenge.marks;
      }
    }

    let failed = false;
    for (const strand of shuffle(rng, Object.keys(remainingBudgets))) {
      const selection = chooseForMarks(rng, strandPool(strand, used), remainingBudgets[strand], { calculator: paper.calculator });
      if (!selection) { failed = true; break; }
      selection.forEach((item) => { picked.push(item); used.add(item.id); });
    }
    const exceptionalCount = picked.filter((item) => item.exceptional).length;
    if (failed || exceptionalCount !== 1 || !picked.some((item) => item.stimulus) || picked.reduce((sum, item) => sum + item.marks, 0) !== total || picked.length < (total === 80 ? 24 : 12) || picked.length > (total === 80 ? 38 : 22)) continue;
    const orderRng = makeRand('higher-paper-order', attempt * 97 + picked.length);
    const ramp = shuffle(orderRng, picked)
      .map((item) => ({ item, score: item.difficulty + orderRng() * 1.15 }))
      .sort((a, b) => a.score - b.score)
      .map(({ item }) => item);
    return {
      tier: 'higher', paperId: paper.id, paperCode: paper.code, paperName: paper.name, calculator: paper.calculator,
      questions: ramp.map((item, index) => ({ ...sanitize(item), qn: index + 1 })), totalMarks: total,
      minutes: total === 80 ? 90 : 45, stretchCount: ramp.filter((item) => item.difficulty === 3).length,
      exceptionalCount,
      strandCoverage: Object.keys(paper.strands).map((id) => STRANDS[id].name),
    };
  }
  throw new Error(`Unable to assemble a valid ${paper.code} paper`);
}

export function buildHigherPractice(topicId, count = 8) {
  const set = higherQuestionsFor(topicId);
  if (!set.length) return [];
  return shuffle(makeRand('higher-practice', Date.now()), [...set]).slice(0, count).map((item, index) => ({ ...sanitize(item, { withHint: true }), qn: index + 1 }));
}

export function buildHigherAdhoc(count = 15, paperIds = [1, 2, 3]) {
  const ids = paperIds.filter((id) => HIGHER_PAPERS[id]);
  const strands = [...new Set(ids.flatMap((id) => Object.keys(HIGHER_PAPERS[id].strands)))];
  const pool = strands.flatMap((strand) => strandPool(strand));
  const rng = makeRand('higher-adhoc', Date.now());
  const picked = shuffle(rng, pool).slice(0, count);
  return { questions: picked.map((item, index) => ({ ...sanitize(item, { withHint: true }), qn: index + 1 })), papersIncluded: ids.map((id) => HIGHER_PAPERS[id].code), tier: 'higher' };
}

function mark(item, value) {
  if (value === null || value === undefined || value === '') return false;
  if (item.input.type === 'mcq') return String(value).trim().toUpperCase() === item.answer;
  const normalized = String(value).trim().toLowerCase().replace(/\s+/g, '').replace(/×/g, 'x').replace(/sqrt\(?([0-9]+)\)?/g, '√$1');
  if (item.input.accepted?.some((accepted) => normalized === String(accepted).toLowerCase().replace(/\s+/g, '').replace(/×/g, 'x').replace(/sqrt\(?([0-9]+)\)?/g, '√$1'))) return true;
  if (item.input.type === 'math') return false;
  const cleaned = String(value).trim().replace(/[£$,%\s]/g, '');
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(cleaned)) return false;
  const answer = Number(cleaned);
  if (Number.isNaN(answer)) return false;
  return Math.abs(answer - item.answer) <= (item.input.tolerance ?? 1e-5);
}

export function higherMarkAnswers(pool, pairs) {
  const results = { perQ: [], correctMarks: 0, totalMarks: 0 };
  for (const { qid, value } of pairs) {
    const item = pool.find((candidate) => candidate.id === qid);
    if (!item) continue;
    const correct = mark(item, value);
    results.totalMarks += item.marks;
    if (correct) results.correctMarks += item.marks;
    results.perQ.push({ qid, qn: null, marks: item.marks, correct, value: value ?? null, answerText: item.answerText, solution: item.solution, text: item.text, stimulus: item.stimulus || null, stretch: !!item.stretch, topicId: item.topicId, topic: item.topic });
  }
  return results;
}

export function higherCheckAnswer(qid, value) {
  for (const set of higherCache.values()) {
    const item = set.find((candidate) => candidate.id === qid);
    if (item) return { correct: mark(item, value), answerText: item.answerText, solution: item.solution };
  }
  return { correct: false, answerText: null, solution: ['Question not found.'] };
}

export function higherQuestionById(id) {
  for (const set of higherCache.values()) {
    const item = set.find((candidate) => candidate.id === id);
    if (item) return item;
  }
  return null;
}
