import { makeRand, ri, pick, shuffle } from '../../util.js';

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
  const r = makeRand('sequences', v);
  const t = v % 8;
  const p = Math.floor(v / 8);
  if (p >= 8) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const a = ri(r, 2, 12);
    const d = ri(r, 2, 9);
    const next = a + 4 * d;
    ans = next;
    text = `Here is a sequence:\n${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}, …\nWork out the next term.`;
    input = { type: 'number' };
    sol = [[`The sequence goes up in ${d}s (common difference).`, `Next term = ${a + 3 * d} + ${d} = ${ans}`]];
    hint = 'Work out the common difference, then keep going.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { s: '3, 7, 11, 15, …', a: '4n − 1', w: ['n + 3', '4n + 3', '4n + 1'] },
      { s: '2, 5, 8, 11, …', a: '3n − 1', w: ['n + 3', '3n + 2', '3n + 1'] },
      { s: '5, 9, 13, 17, …', a: '4n + 1', w: ['n + 4', '4n + 5', '4n − 1'] },
      { s: '7, 12, 17, 22, …', a: '5n + 2', w: ['n + 5', '5n + 7', '5n − 2'] },
      { s: '4, 7, 10, 13, …', a: '3n + 1', w: ['n + 3', '3n + 4', '3n − 1'] },
      { s: '1, 6, 11, 16, …', a: '5n − 4', w: ['n + 5', '5n + 1', '5n + 4'] },
      { s: '6, 10, 14, 18, …', a: '4n + 2', w: ['n + 4', '4n + 6', '4n − 2'] },
      { s: '8, 13, 18, 23, …', a: '5n + 3', w: ['n + 5', '5n + 8', '5n − 3'] },
    ];
    const c = cases[p % 8];
    text = `Here is a sequence:\n${c.s}\nWhat is the nth term?`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Common difference d = the number in front of n.`, `nth term = dn + (first term − d).`, `nth term = ${c.a}`]];
    hint = 'nth term = dn + (first term − d).';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { f: '4n − 1', n: 15 }, { f: '3n + 2', n: 20 }, { f: '5n − 3', n: 9 },
      { f: '2n + 7', n: 30 }, { f: '6n − 5', n: 12 }, { f: '7n + 1', n: 8 },
      { f: '3n − 4', n: 25 }, { f: '2n + 1', n: 50 },
    ];
    const c = cases[p % 8];
    const m_ = c.f.match(/(\d+)n\s*([+\u2212-])\s*(\d+)/);
    ans = m_[2] === '+' ? parseInt(m_[1], 10) * c.n + parseInt(m_[3], 10) : parseInt(m_[1], 10) * c.n - parseInt(m_[3], 10);
    text = `The nth term of a sequence is  ${c.f}.\nWork out the ${c.n}th term.`;
    input = { type: 'number' };
    sol = [[`Substitute n = ${c.n}: ${c.f.replace('n', `(${c.n})`)} = ${ans}`]];
    hint = 'Replace n with the position number and work it out with BIDMAS.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 3) {
    const a = ri(r, 40, 90);
    const d = [2, 3, 4, 5][p % 4];
    const last = a - 3 * d;
    ans = last - d;
    text = `Here is a sequence:\n${a}, ${a - d}, ${a - 2 * d}, ${last}, …\nWork out the next term.`;
    input = { type: 'number' };
    sol = [[`The sequence goes DOWN in ${d}s.`, `Next term = ${last} − ${d} = ${ans}`]];
    hint = 'The difference is negative — the sequence is counting down.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { f: '2n + 3', eq: 21 }, { f: '3n − 1', eq: 29 }, { f: '4n + 5', eq: 41 },
      { f: '5n + 2', eq: 47 }, { f: '6n − 3', eq: 57 }, { f: '3n + 7', eq: 34 },
      { f: '7n − 4', eq: 66 }, { f: '2n + 9', eq: 39 },
    ];
    const c = cases[p % 8];
    const m_ = c.f.match(/(\d+)n\s*([+\u2212-])\s*(\d+)/);
    ans = m_[2] === '+' ? (c.eq - parseInt(m_[3], 10)) / parseInt(m_[1], 10) : (c.eq + parseInt(m_[3], 10)) / parseInt(m_[1], 10);
    text = `The nth term of a sequence is  ${c.f}.\nWhich term of the sequence is equal to ${c.eq}?`;
    input = { type: 'number' };
    sol = [[`Solve ${c.f} = ${c.eq}.`, `n = ${ans}`]];
    hint = 'Put the nth term equal to the number and solve for n.';
    return { marks: 3, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `term ${ans}`, solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { s: '1, 4, 9, 16, 25, …', a: '36', w: ['49', '35', '30'], n: 'Next square number', why: 'square numbers (1², 2², 3²…): 6² = 36' },
      { s: '1, 8, 27, 64, …', a: '125', w: ['100', '81', '216'], n: 'Next cube number', why: 'cube numbers (1³, 2³, 3³…): 5³ = 125' },
      { s: '2, 4, 8, 16, 32, …', a: '64', w: ['48', '40', '63'], n: 'Next power of 2', why: 'doubling each time: 32 × 2 = 64' },
      { s: '1, 4, 9, 16, …', a: '25', w: ['20', '36', '24'], n: 'Next square number', why: 'square numbers: 5² = 25' },
      { s: '3, 6, 12, 24, 48, …', a: '96', w: ['72', '84', '56'], n: 'Next term', why: 'doubling each time: 48 × 2 = 96' },
      { s: '100, 50, 25, 12.5, …', a: '6.25', w: ['6', '10', '5.25'], n: 'Next term', why: 'halving each time: 12.5 ÷ 2 = 6.25' },
      { s: '1, 16, 81, 256, …', a: '625', w: ['400', '324', '576'], n: 'Next term', why: 'powers of 4: 5⁴ = 625' },
      { s: '2, 6, 18, 54, …', a: '162', w: ['108', '72', '160'], n: 'Next term', why: 'multiplying by 3 each time: 54 × 3 = 162' },
    ];
    const c = cases[p % 8];
    text = `Here is a sequence:\n${c.s}\n${c.n} = ?`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`This sequence is not going up by a constant amount.`, `It is ${c.why}.`]];
    hint = 'Not all sequences go up by the same amount — look for squares, cubes or doubling.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 6) {
    const cases = [
      { s: '1, 3, 6, 10, 15, …', a: 21, why: 'triangle numbers: 1, 1+2, 1+2+3…' },
      { s: '5, 10, 20, 40, …', a: 80, why: 'doubling each time' },
      { s: '30, 25, 20, 15, …', a: 10, why: 'counting down in 5s' },
      { s: '1, 1, 2, 3, 5, 8, …', a: 13, why: 'each term is the sum of the previous two' },
      { s: '2, 3, 5, 8, 12, …', a: 17, why: 'the gaps grow by 1 each time (+1, +2, +3…)' },
      { s: '60, 30, 15, 7.5, …', a: 3.75, why: 'halving each time' },
      { s: '1, 10, 100, 1000, …', a: 10000, why: 'multiplying by 10' },
      { s: '0, 3, 8, 15, 24, …', a: 35, why: 'one less than squares: 1²−1, 2²−1, 3²−1…' },
    ];
    const c = cases[p % 8];
    ans = c.a;
    text = `Here is a sequence:\n${c.s}\nWork out the next term.`;
    input = { type: 'number', tolerance: 1e-9 };
    sol = [[`Look for the pattern: ${c.why}.`, `Next term = ${c.a}`]];
    hint = 'Look past the first few numbers — some sequences have clever patterns.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  {
    text = `Dots are arranged in square patterns.\nPattern 1 has 5 dots, Pattern 2 has 9 dots, Pattern 3 has 13 dots.\nThe nth term is  4n + 1.\nHow many dots does Pattern ${10 + p} have?`;
    ans = 4 * (10 + p) + 1;
    input = { type: 'number' };
    sol = [[`Substitute n = ${10 + p} into 4n + 1:`, `4 × ${10 + p} + 1 = ${4 * (10 + p)} + 1 = ${ans}`]];
    hint = 'Substitute the pattern number for n in the nth term formula.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }
}