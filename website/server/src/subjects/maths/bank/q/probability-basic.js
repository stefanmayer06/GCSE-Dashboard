import { makeRand, ri, pick, shuffle, fracStr } from '../../util.js';

function mcq(r, correct, wrongs) {
  const uniqWrongs = [...new Set(wrongs.map(String))].filter((w) => w !== String(correct));
  while (uniqWrongs.length < 3) uniqWrongs.push('None of these');
  const options = shuffle(r, [{ text: String(correct), ok: true }, ...uniqWrongs.slice(0, 3).map((w) => ({ text: w, ok: false }))]);
  return {
    input: { type: 'mcq', choices: options.map((o, i) => ({ label: String.fromCharCode(65 + i), text: o.text })) },
    answer: String.fromCharCode(65 + options.findIndex((o) => o.ok)),
    answerText: String(correct),
  };
}

export default function gen(v) {
  const r = makeRand('probability-basic', v);
  const t = v % 8;
  const p = Math.floor(v / 8);
  if (p >= 8) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const cases = [
      { red: 3, blue: 7, want: 'red' }, { red: 4, blue: 8, want: 'blue' },
      { red: 5, blue: 3, want: 'red' }, { red: 2, blue: 9, want: 'blue' },
      { red: 6, blue: 4, want: 'red' }, { red: 1, blue: 11, want: 'blue' },
      { red: 7, blue: 5, want: 'red' }, { red: 3, blue: 12, want: 'blue' },
    ];
    const c = cases[p % 8];
    const total = c.red + c.blue;
    const a = c.want === 'red' ? fracStr(c.red, total) : fracStr(c.blue, total);
    text = `A bag contains ${c.red} red counters and ${c.blue} blue counters.\nA counter is taken at random.\nWhat is the probability it is ${c.want}? Give your answer as a fraction in its simplest form.`;
    const num = c.want === 'red' ? c.red : c.blue;
    const other = total - num;
    m = mcq(r, a, [fracStr(num, total), fracStr(num, other), fracStr(other, total)].filter((x) => x !== a));
    input = m.input;
    sol = [[`P(${c.want}) = ${c.want} counters ÷ total counters.`, `${num} ÷ ${total} = ${a}`]];
    hint = 'Probability = number of ways it can happen ÷ total outcomes.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: a, solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { red: 3, blue: 7, not: 'red' }, { red: 4, blue: 8, not: 'blue' },
      { red: 5, blue: 3, not: 'red' }, { red: 2, blue: 9, not: 'blue' },
      { red: 6, blue: 4, not: 'red' }, { red: 1, blue: 11, not: 'blue' },
      { red: 7, blue: 5, not: 'red' }, { red: 3, blue: 12, not: 'blue' },
    ];
    const c = cases[p % 8];
    const total = c.red + c.blue;
    const num = c.not === 'red' ? c.blue : c.red;
    const a = fracStr(num, total);
    text = `A bag contains ${c.red} red counters and ${c.blue} blue counters.\nA counter is taken at random.\nWhat is the probability it is NOT ${c.not}? Give your answer as a fraction in its simplest form.`;
    m = mcq(r, a, [fracStr(total - num, total), fracStr(num, num + 2), fracStr(num + 1, total)].filter((x) => x !== a));
    input = m.input;
    sol = [[`P(not ${c.not}) = 1 − P(${c.not}) or count the other colour.`, `${num} of the ${total} counters are not ${c.not} → ${a}`]];
    hint = 'P(not A) = 1 − P(A). Or just count the other colour.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: a, solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { p: 0.35, n: 240 }, { p: 0.5, n: 300 }, { p: 0.25, n: 400 },
      { p: 0.7, n: 150 }, { p: 0.4, n: 250 }, { p: 0.9, n: 200 },
      { p: 0.15, n: 500 }, { p: 0.55, n: 320 },
    ];
    const c = cases[p % 8];
    ans = Math.round(c.p * c.n);
    text = `The probability a light bulb is faulty is ${c.p}.\nA shop sells ${c.n} bulbs.\nHow many bulbs would you EXPECT to be faulty?`;
    input = { type: 'number' };
    sol = [[`Expected number = probability × number of trials.`, `${c.p} × ${c.n} = ${ans}`]];
    hint = 'Expected number = probability × how many there are.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { ask: 'a prime number', a: '1/2', s: 'Primes on a die: 2, 3, 5 → 3 out of 6.' },
      { ask: 'an even number', a: '1/2', s: 'Evens: 2, 4, 6 → 3 out of 6.' },
      { ask: 'a number more than 4', a: '1/3', s: '5 and 6 → 2 out of 6.' },
      { ask: 'an odd number', a: '1/2', s: 'Odds: 1, 3, 5 → 3 out of 6.' },
      { ask: 'a multiple of 3', a: '1/3', s: '3 and 6 → 2 out of 6.' },
      { ask: 'a factor of 6', a: '2/3', s: '1, 2, 3, 6 → 4 out of 6.' },
      { ask: 'a square number', a: '1/3', s: '1 and 4 → 2 out of 6.' },
      { ask: 'a number less than 5', a: '2/3', s: '1, 2, 3, 4 → 4 out of 6.' },
    ];
    const c = cases[p % 8];
    text = `A fair six-sided dice is rolled.\nWhat is the probability of rolling ${c.ask}?`;
    m = mcq(r, c.a, ['1/6', '1/3', '1/2', '2/3', '5/6'].filter((x) => x !== c.a));
    input = m.input;
    sol = [[c.s]];
    hint = 'List all 6 outcomes and count how many match.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { A: 0.4, B: 0.45 }, { A: 0.3, B: 0.55 }, { A: 0.6, B: 0.15 },
      { A: 0.25, B: 0.35 }, { A: 0.7, B: 0.2 }, { A: 0.5, B: 0.3 },
      { A: 0.45, B: 0.25 }, { A: 0.35, B: 0.4 },
    ];
    const c = cases[p % 8];
    const a = round1(c.A + c.B);
    text = `P(rain) = ${c.A} and P(snow) = ${c.B} tomorrow.\nRain and snow cannot happen together.\nWhat is P(rain or snow)?`;
    m = mcq(r, String(a), [String(round1(c.A + c.B + 0.1)), String(round1(Math.abs(c.A - c.B))), String(round1(1 - c.A))].filter((x) => x !== String(a)));
    input = m.input;
    sol = [[`Mutually exclusive → ADD the probabilities.`, `${c.A} + ${c.B} = ${a}`]];
    hint = 'If two things cannot BOTH happen, add their probabilities.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: String(a), solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { boys: 12, girls: 18, ask: 'girl', by: 'walk to school' },
      { boys: 15, girls: 10, ask: 'boy', by: 'take the bus' },
      { boys: 8, girls: 16, ask: 'girl', by: 'cycle' },
      { boys: 21, girls: 14, ask: 'boy', by: 'get a lift' },
      { boys: 16, girls: 24, ask: 'girl', by: 'walk to school' },
      { boys: 20, girls: 30, ask: 'boy', by: 'take the bus' },
      { boys: 9, girls: 21, ask: 'girl', by: 'cycle' },
      { boys: 28, girls: 12, ask: 'boy', by: 'get a lift' },
    ];
    const c = cases[p % 8];
    const total = c.boys + c.girls;
    const num = c.ask === 'girl' ? c.girls : c.boys;
    const a = fracStr(num, total);
    text = `There are ${c.boys} boys and ${c.girls} girls in a year group.\nOne student is chosen at random.\nWhat is the probability the student is a ${c.ask}? Give your answer as a fraction in its simplest form.`;
    m = mcq(r, a, [fracStr(total - num, total), fracStr(num, total - num), fracStr(num + 1, total)].filter((x) => x !== a));
    input = m.input;
    sol = [[`Total students = ${c.boys} + ${c.girls} = ${total}.`, `P(${c.ask}) = ${num}/${total} = ${a}`]];
    hint = 'Total first, then wanted ÷ total.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: a, solution: sol, hint };
  }

  if (t === 6) {
    const cases = [
      { ev: 'The sun will rise tomorrow', a: 'certain (1)', w: ['unlikely (close to 0)', 'evens (1/2)', 'impossible (0)'] },
      { ev: 'You will win the lottery', a: 'unlikely (close to 0)', w: ['certain (1)', 'evens (1/2)', 'likely (close to 1)'] },
      { ev: 'A coin lands on heads', a: 'evens (1/2)', w: ['certain (1)', 'unlikely (close to 0)', 'impossible (0)'] },
      { ev: 'A dice shows a 7', a: 'impossible (0)', w: ['evens (1/2)', 'certain (1)', 'unlikely (close to 0)'] },
      { ev: 'A random card is red', a: 'evens (1/2)', w: ['certain (1)', 'likely (close to 1)', 'impossible (0)'] },
      { ev: 'It will rain somewhere in the UK today', a: 'likely (close to 1)', w: ['impossible (0)', 'evens (1/2)', 'unlikely (close to 0)'] },
      { ev: 'You roll an odd number on a dice', a: 'evens (1/2)', w: ['certain (1)', 'likely (close to 1)', 'unlikely (close to 0)'] },
      { ev: 'A pig flies past your window', a: 'impossible (0)', w: ['unlikely (close to 0)', 'evens (1/2)', 'certain (1)'] },
    ];
    const c = cases[p % 8];
    text = `"${c.ev}"\nWhere does this sit on the probability scale?`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`0 = impossible, 1 = certain, 1/2 = evens.`, `"${c.ev}" is ${c.a.split(' (')[0]}.`]];
    hint = '0 = impossible, 1 = certain, and 1/2 is a 50-50.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  {
    const cases = [
      { n: 45, N: 120 }, { n: 30, N: 80 }, { n: 56, N: 160 },
      { n: 21, N: 60 }, { n: 72, N: 180 }, { n: 36, N: 90 },
      { n: 63, N: 140 }, { n: 18, N: 50 },
    ];
    const c = cases[p % 8];
    const a = fracStr(c.n, c.N);
    text = `A spinner is spun ${c.N} times and lands on red ${c.n} times.\nWhat is the relative frequency of red? Give your answer as a fraction in its simplest form.`;
    m = mcq(r, a, [fracStr(c.N - c.n, c.N), fracStr(c.n, c.N - c.n), fracStr(c.n + 3, c.N)].filter((x) => x !== a));
    input = m.input;
    sol = [[`Relative frequency = times it happened ÷ total trials.`, `${c.n} ÷ ${c.N} = ${a}`]];
    hint = 'Relative frequency = number of successes ÷ total trials.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: a, solution: sol, hint };
  }
}

function round1(x) {
  return Math.round(x * 100) / 100;
}