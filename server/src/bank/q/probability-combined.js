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
  const r = makeRand('probability-combined', v);
  const t = v % 6;
  const p = Math.floor(v / 6);
  if (p >= 10) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const cases = [
      { a: 'heads and heads', pa: '1/2', pb: '1/2', a2: '1/4' },
      { a: 'a head and a tail (in that order)', pa: '1/2', pb: '1/2', a2: '1/4' },
      { a: 'two tails', pa: '1/2', pb: '1/2', a2: '1/4' },
    ];
    const c = cases[p % 3];
    text = `A fair coin is flipped twice.\nWhat is the probability of ${c.a}?`;
    m = mcq(r, c.a2, ['1/2', '1/8', '1/3'].filter((x) => x !== c.a2));
    input = m.input;
    sol = [[`Independent events → MULTIPLY: P(A) × P(B).`, `P = ${c.pa} × ${c.pb} = ${c.a2}`]];
    hint = 'Two events both happening = multiply the probabilities.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a2, solution: sol, hint };
  }

  if (t === 1) {
    text = `Two fair six-sided dice are rolled.\nThere are 36 possible outcomes.\nWhat is the probability the scores add up to 7?`;
    m = mcq(r, '1/6', ['1/12', '7/36', '1/36']);
    input = m.input;
    sol = [[`Ways to make 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) → 6 ways.`, `P = 6/36 = 1/6`]];
    hint = 'List the pairs that add to 7 — there are 6 of them out of 36.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: '1/6', solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { red: 5, blue: 3, ask: 'both red', a: '25/64', w: ['5/8', '25/56', '10/64'] },
      { red: 4, blue: 6, ask: 'both blue', a: '9/25', w: ['3/5', '6/10', '9/20'] },
      { red: 6, blue: 4, ask: 'both red', a: '9/25', w: ['3/5', '9/20', '6/25'] },
      { red: 3, blue: 7, ask: 'both red', a: '9/100', w: ['3/10', '3/20', '6/100'] },
      { red: 7, blue: 5, ask: 'both blue', a: '25/144', w: ['5/12', '5/24', '25/132'] },
      { red: 8, blue: 4, ask: 'both red', a: '4/9', w: ['2/3', '16/24', '1/2'] },
      { red: 2, blue: 8, ask: 'both blue', a: '16/25', w: ['4/5', '8/25', '18/25'] },
      { red: 5, blue: 5, ask: 'both red', a: '1/4', w: ['1/2', '1/5', '25/90'] },
    ];
    const c = cases[p % 8];
    const total = c.red + c.blue;
    text = `A bag has ${c.red} red and ${c.blue} blue marbles.\nA marble is taken, then PUT BACK, then another marble is taken.\nWhat is the probability both marbles are ${c.ask === 'both red' ? 'red' : 'blue'}?`;
    m = mcq(r, c.a, c.w.filter((x) => x !== c.a));
    input = m.input;
    const want = c.ask === 'both red' ? c.red : c.blue;
    sol = [[`"Put back" means the probabilities stay the same (independent).`, `P = ${want}/${total} × ${want}/${total} = ${c.a}`]];
    hint = 'With replacement, multiply the SAME probability by itself.';
    return { marks: 3, difficulty: 3, stretch: true, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { A: 0.2, B: 0.3 }, { A: 0.4, B: 0.25 }, { A: 0.15, B: 0.35 },
      { A: 0.5, B: 0.2 }, { A: 0.3, B: 0.45 }, { A: 0.25, B: 0.55 },
      { A: 0.1, B: 0.6 }, { A: 0.35, B: 0.15 },
    ];
    const c = cases[p % 8];
    const a = String(Math.round((c.A + c.B) * 100) / 100);
    text = `P(winning a goldfish) = ${c.A} and P(winning a teddy) = ${c.B} at the fair.\nYou cannot win BOTH.\nWhat is the probability of winning either a goldfish or a teddy?`;
    m = mcq(r, a, [String(Math.round((c.A + c.B + 0.15) * 100) / 100), String(Math.round((c.A * c.B) * 100) / 100), String(Math.round((1 - c.A) * 100) / 100)].filter((x) => x !== a));
    input = m.input;
    sol = [[`Cannot both happen → mutually exclusive → ADD.`, `${c.A} + ${c.B} = ${a}`]];
    hint = '"OR" with events that cannot both happen = ADD the probabilities.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: a, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { a: '1/3', b: '1/2', t: 300, a2: 50, ctx: 'P(sunny) = 1/3 and P(market open) = 1/2. They are independent.' },
      { a: '1/4', b: '2/5', t: 200, a2: 20, ctx: 'P(goal in a match) = 1/4 and P(team wins) = 2/5. They are independent.' },
      { a: '1/5', b: '1/2', t: 500, a2: 50, ctx: 'P(bus late) = 1/5 and P(rain) = 1/2. They are independent.' },
      { a: '1/3', b: '3/4', t: 240, a2: 60, ctx: 'P(homework done) = 1/3 and P(games night) = 3/4. They are independent.' },
      { a: '2/5', b: '1/2', t: 350, a2: 70, ctx: 'P(wins raffle) = 2/5 and P(wins quiz) = 1/2. They are independent.' },
      { a: '1/6', b: '1/2', t: 480, a2: 40, ctx: 'P(rolls a six) = 1/6 and P(flips heads) = 1/2. They are independent.' },
      { a: '3/4', b: '1/3', t: 400, a2: 100, ctx: 'P(passes theory) = 3/4 and P(passes practical) = 1/3. They are independent.' },
      { a: '1/4', b: '1/2', t: 600, a2: 75, ctx: 'P(no queue) = 1/4 and P(sunny) = 1/2. They are independent.' },
    ];
    const c = cases[p % 8];
    ans = c.a2;
    text = `${c.ctx}\nHow many times out of ${c.t} would you EXPECT both things to happen?`;
    input = { type: 'number' };
    sol = [[`P(both) = ${c.a} × ${c.b} = ${fracStr(1, 1) === '1' ? '' : ''}${mulFrac(c.a, c.b)}.`, `Expected = ${mulFrac(c.a, c.b)} × ${c.t} = ${ans}`]];
    hint = 'Multiply the probabilities, then multiply by the number of trials.';
    return { marks: 3, difficulty: 3, stretch: true, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  {
    const cases = [
      { n1: 4, n2: 6, want: 'both are blue', a: '1/3', w: ['2/9', '1/5', '1/2'] },
      { n1: 3, n2: 7, want: 'both are red', a: '1/15', w: ['3/20', '1/5', '9/100'] },
      { n1: 5, n2: 5, want: 'both are blue', a: '2/9', w: ['1/4', '4/25', '2/15'] },
      { n1: 6, n2: 4, want: 'both are red', a: '1/3', w: ['9/25', '3/5', '1/2'] },
      { n1: 7, n2: 3, want: 'both are red', a: '7/15', w: ['49/100', '7/10', '1/3'] },
      { n1: 2, n2: 8, want: 'both are red', a: '1/45', w: ['1/25', '1/5', '2/45'] },
      { n1: 8, n2: 2, want: 'both are blue', a: '1/45', w: ['1/25', '1/5', '2/45'] },
      { n1: 5, n2: 4, want: 'both are blue', a: '1/6', w: ['16/81', '2/9', '1/4'] },
    ];
    const c = cases[p % 8];
    const want1 = c.want === 'both are red' ? c.n1 : c.n2;
    const total = c.n1 + c.n2;
    text = `A bag has ${c.n1} red and ${c.n2} blue marbles.\nA marble is taken and NOT replaced, then another marble is taken.\nWhat is the probability ${c.want}?`;
    m = mcq(r, c.a, c.w.filter((x) => x !== c.a));
    input = m.input;
    sol = [[`NOT replaced → the second probability changes.`, `P = ${want1}/${total} × ${want1 - 1}/${total - 1} = ${c.a}`]];
    hint = 'Without replacement the second fraction has one fewer marble AND one fewer of that colour.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }
}

function mulFrac(f1, f2) {
  const [a, b] = f1.split('/').map(Number);
  const [c, d] = f2.split('/').map(Number);
  return fracStr(a * c, b * d);
}
