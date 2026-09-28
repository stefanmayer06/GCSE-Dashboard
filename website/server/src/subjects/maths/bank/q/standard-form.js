import { makeRand, shuffle } from '../../util.js';

const cases = [
  [3.2, 4], [7.5, 3], [1.08, 5], [6.4, 2], [9.3, 6],
  [4.6, -3], [2.8, -4], [8.1, -2], [5.7, -5], [1.25, -3],
];

const products = [
  [2, 3, 2, 4], [4, 3, 3, 2], [1.5, 4, 2, 3], [3, 3, 2, 4], [2.5, 4, 3, 2],
  [1.2, 5, 4, 3], [5, 3, -2, 4], [2, 6, -3, -2], [4, 2, -2, -3], [7, 2, 3, -4],
];

const standard = (coefficient, exponent) => `${Number(coefficient.toFixed(5))} × 10^${exponent}`;
const ordinary = (value) => value.toLocaleString('en-GB', { maximumFractionDigits: 8 });

function mcq(rng, correct, wrongs) {
  const options = shuffle(rng, [correct, ...wrongs]);
  return {
    input: {
      type: 'mcq',
      choices: options.map((text, i) => ({ label: String.fromCharCode(65 + i), text })),
    },
    answer: String.fromCharCode(65 + options.indexOf(correct)),
    answerText: correct,
  };
}

export default function gen(v) {
  if (v >= 60) return null;
  const rng = makeRand('standard-form', v);
  const family = v % 6;
  const index = Math.floor(v / 6);
  const [coefficient, exponent] = cases[index];
  const correct = standard(coefficient, exponent);

  if (family === 0) {
    const value = coefficient * 10 ** exponent;
    return {
      marks: 2, difficulty: 2, stretch: false,
      text: `Write ${ordinary(value)} in standard form.`,
      ...mcq(rng, correct, [standard(coefficient, exponent - 1), standard(coefficient, exponent + 1), standard(coefficient * 10, exponent - 1)]),
      solution: [`Move the decimal point until the first number is at least 1 and less than 10.`, `${ordinary(value)} = ${correct}.`],
      hint: 'The coefficient must be at least 1 and less than 10.',
    };
  }

  if (family === 1) {
    const value = coefficient * 10 ** exponent;
    return {
      marks: 2, difficulty: 2, stretch: false,
      text: `Write ${correct} as an ordinary decimal number.`,
      input: { type: 'number', tolerance: 1e-10 },
      answer: value,
      answerText: ordinary(value),
      solution: [`A ${exponent < 0 ? 'negative' : 'positive'} power of 10 moves the decimal point ${Math.abs(exponent)} places ${exponent < 0 ? 'left' : 'right'}.`, `${correct} = ${ordinary(value)}.`],
      hint: 'Move the decimal point by the number of places shown in the power of 10.',
    };
  }

  if (family === 2) {
    return {
      marks: 1, difficulty: 1, stretch: false,
      text: 'Which expression is written correctly in standard form?',
      ...mcq(rng, correct, [
        standard(coefficient * 10, exponent - 1),
        standard(coefficient / 10, exponent + 1),
        standard(coefficient + 10, exponent),
      ]),
      solution: [`In standard form, the first number must satisfy 1 ≤ a < 10.`, `${correct} has a valid coefficient.`],
      hint: 'Check the size of the number before × 10.',
    };
  }

  if (family === 3) {
    const [a, b, firstPower, secondPower] = products[index];
    let product = a * b;
    let power = firstPower + secondPower;
    while (product >= 10) {
      product /= 10;
      power += 1;
    }
    const result = standard(product, power);
    return {
      marks: 3, difficulty: 3, stretch: true,
      text: `Work out (${standard(a, firstPower)}) × (${standard(b, secondPower)}). Give your answer in standard form.`,
      ...mcq(rng, result, [standard(product, power - 1), standard(product, power + 1), standard(product * 10, power - 1)]),
      solution: [`Multiply the coefficients: ${a} × ${b} = ${a * b}. Add the powers: ${firstPower} + (${secondPower}) = ${firstPower + secondPower}.`, `Adjust the coefficient to be between 1 and 10: ${result}.`],
      hint: 'Multiply the first numbers, add the powers of 10, then normalise.',
    };
  }

  if (family === 4) {
    const power = exponent;
    const options = index % 2 === 0
      ? [standard(6 + index / 10, power), standard(2 + index / 10, power), standard(9, power - 1), standard(1.2, power - 1)]
      : [standard(1.1, power + 1), standard(9.2, power), standard(5.5, power), standard(1.5, power)];
    return {
      marks: 2, difficulty: 2, stretch: false,
      text: 'Which number has the greatest value?',
      ...mcq(rng, options[0], options.slice(1)),
      solution: [`Compare the powers of 10 first. If the powers match, compare the coefficients.`, `${options[0]} is greatest.`],
      hint: 'A larger power of 10 usually decides; for equal powers, compare the first numbers.',
    };
  }

  return {
    marks: 1, difficulty: 2, stretch: false,
    text: `A calculator displays ${coefficient}E${exponent >= 0 ? '+' : ''}${exponent}. Which is the same value in standard form?`,
    ...mcq(rng, correct, [standard(coefficient, exponent - 1), standard(coefficient, exponent + 1), standard(coefficient * 10, exponent - 1)]),
    solution: [`On a calculator, E${exponent >= 0 ? '+' : ''}${exponent} means × 10^${exponent}.`, `So the display means ${correct}.`],
    hint: 'Read E as “times ten to the power of”.',
  };
}
