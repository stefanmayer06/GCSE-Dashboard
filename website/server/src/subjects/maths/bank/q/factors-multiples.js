import { makeRand, shuffle } from '../../util.js';

const factorCases = [
  [24, 6], [30, 5], [36, 9], [40, 8], [42, 7],
  [48, 12], [54, 9], [60, 15], [72, 18], [84, 14],
];
const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21];
const factorisationCases = [
  [2, 2, 3], [2, 3, 3], [2, 2, 5], [2, 2, 2, 3], [2, 3, 5],
  [2, 2, 3, 3], [2, 2, 2, 5], [3, 3, 5], [2, 2, 3, 5], [2, 2, 2, 3, 3],
];
const hcfCases = [
  [18, 24], [24, 36], [30, 45], [36, 48], [42, 56],
  [28, 35], [40, 60], [54, 72], [48, 80], [63, 84],
];
const lcmCases = [
  [4, 6], [6, 8], [9, 12], [10, 15], [12, 18],
  [8, 14], [14, 21], [16, 20], [18, 24], [15, 25],
];

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

function primeFactors(n) {
  const factors = [];
  for (let divisor = 2; divisor * divisor <= n; divisor++) {
    while (n % divisor === 0) {
      factors.push(divisor);
      n /= divisor;
    }
  }
  if (n > 1) factors.push(n);
  return factors;
}

function multiplesTo(number, limit) {
  return Array.from({ length: limit / number }, (_, index) => number * (index + 1)).join(', ');
}

function productNotation(factors) {
  const superscript = { 2: '²', 3: '³', 4: '⁴' };
  return [...new Set(factors)].map((prime) => {
    const count = factors.filter((factor) => factor === prime).length;
    return `${prime}${count > 1 ? superscript[count] || `^${count}` : ''}`;
  }).join(' × ');
}

function mcq(rng, correct, wrongs) {
  const options = shuffle(rng, [correct, ...wrongs]);
  return {
    input: {
      type: 'mcq',
      choices: options.map((text, i) => ({ label: String.fromCharCode(65 + i), text: String(text) })),
    },
    answer: String.fromCharCode(65 + options.indexOf(correct)),
    answerText: String(correct),
  };
}

export default function gen(v) {
  if (v >= 60) return null;
  const rng = makeRand('factors-multiples', v);
  const family = v % 6;
  const index = Math.floor(v / 6);

  if (family === 0) {
    const [number, factor] = factorCases[index];
    const wrongs = [];
    for (let candidate = factor + 1; wrongs.length < 3; candidate++) {
      if (number % candidate !== 0) wrongs.push(candidate);
    }
    return {
      marks: 1, difficulty: 1, stretch: false,
      text: `Which number is a factor of ${number}?`,
      ...mcq(rng, factor, wrongs),
      solution: [`${number} ÷ ${factor} = ${number / factor}, a whole number, so ${factor} is a factor.`],
      hint: 'A factor divides the number with no remainder.',
    };
  }

  if (family === 1) {
    const prime = primes[index];
    const wrongs = composites.slice(index, index + 3);
    return {
      marks: 1, difficulty: 1, stretch: false,
      text: 'Which number is prime?',
      ...mcq(rng, prime, wrongs),
      solution: [`${prime} has exactly two positive factors: 1 and ${prime}.`, 'The other choices have factors besides 1 and themselves.'],
      hint: 'A prime number has exactly two positive factors.',
    };
  }

  if (family === 2) {
    const factors = factorisationCases[index];
    const number = factors.reduce((product, factor) => product * factor, 1);
    const correct = productNotation(factors);
    const wrongs = [
      productNotation(factors.slice(0, -1)),
      productNotation([...factors, 2]),
      productNotation([...factors.slice(0, -1), 7]),
    ];
    return {
      marks: 2, difficulty: 2, stretch: false,
      text: `Which is the prime factorisation of ${number}, written using indices where possible?`,
      ...mcq(rng, correct, wrongs),
      solution: [`Split ${number} into prime factors: ${number} = ${factors.join(' × ')}.`, `Collect repeated primes: ${number} = ${correct}.`],
      hint: 'Divide by small primes repeatedly, then collect equal factors into powers.',
    };
  }

  if (family === 3) {
    const [a, b] = hcfCases[index];
    const common = primeFactors(a);
    const remaining = primeFactors(b);
    const shared = common.filter((prime) => {
      const position = remaining.indexOf(prime);
      if (position < 0) return false;
      remaining.splice(position, 1);
      return true;
    });
    const answer = gcd(a, b);
    return {
      marks: 2, difficulty: 2, stretch: false,
      text: `Find the highest common factor (HCF) of ${a} and ${b}.`,
      input: { type: 'number' }, answer, answerText: String(answer),
      solution: [`${a} = ${primeFactors(a).join(' × ')} and ${b} = ${primeFactors(b).join(' × ')}.`, `The common prime factors are ${shared.join(' × ')}, so HCF = ${answer}.`],
      hint: 'Write both numbers as products of primes. Multiply only the shared factors.',
    };
  }

  if (family === 4) {
    const [a, b] = lcmCases[index];
    const answer = (a * b) / gcd(a, b);
    return {
      marks: 2, difficulty: 2, stretch: false,
      text: `Find the lowest common multiple (LCM) of ${a} and ${b}.`,
      input: { type: 'number' }, answer, answerText: String(answer),
      solution: [`Multiples of ${a}: ${multiplesTo(a, answer)}. Multiples of ${b}: ${multiplesTo(b, answer)}.`, `The first number in both lists is ${answer}, so LCM = ${answer}.`],
      hint: 'A common multiple appears in both times tables. Choose the smallest positive one.',
    };
  }

  if (index % 2 === 0) {
    const [a, b] = lcmCases[index];
    const answer = (a * b) / gcd(a, b);
    return {
      marks: 3, difficulty: 2, stretch: false,
      text: `Two lights flash together now. One flashes every ${a} seconds and the other every ${b} seconds. After how many seconds will they next flash together?`,
      input: { type: 'number' }, answer, answerText: `${answer} seconds`,
      solution: [`Flash times: ${multiplesTo(a, answer)} seconds and ${multiplesTo(b, answer)} seconds.`, `The first shared time is LCM(${a}, ${b}) = ${answer} seconds.`],
      hint: 'List the flash times for each light and find the first common time.',
    };
  }

  const [a, b] = hcfCases[index];
  const answer = gcd(a, b);
  return {
    marks: 3, difficulty: 2, stretch: false,
    text: `Two ribbons are ${a} cm and ${b} cm long. They are cut into equal pieces with no waste. What is the greatest possible whole-number length of each piece?`,
    input: { type: 'number' }, answer, answerText: `${answer} cm`,
    solution: [`The piece length must divide both ${a} and ${b} exactly.`, `The highest common factor is ${answer}, so each piece can be ${answer} cm long.`],
    hint: 'Find the largest factor shared by both ribbon lengths.',
  };
}
