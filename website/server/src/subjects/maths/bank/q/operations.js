import { makeRand, ri, pick, shuffle, money } from '../../util.js';

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
  const r = makeRand('operations', v);
  const t = v % 10;
  const p = Math.floor(v / 10);
  if (p >= 6) return null;
  let ans, text, input, sol, hint;

  if (t === 0) {
    const a = ri(r, 12, 99);
    const b = [2, 3, 4, 5, 6, 8][p % 6];
    ans = a * b;
    text = `Work out  ${a} × ${b}`;
    input = { type: 'number' };
    sol = [`Use the grid method or partition: ${a} × ${b} = ${a} × ${b}.`, `${a} × ${b} = ${ans}`];
    hint = 'Split into tens and units: 37 × 6 = (30 × 6) + (7 × 6).';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 1) {
    const d = [2, 3, 4, 5, 6, 8][p % 6];
    const q = ri(r, 11, 99);
    const n = d * q;
    ans = q;
    text = `Work out  ${n} ÷ ${d}`;
    input = { type: 'number' };
    sol = [`Long (or short) division: how many ${d}s fit into ${n}?`, `${d} × ${q} = ${n}, so ${n} ÷ ${d} = ${q}`];
    hint = 'Think "how many times does the divisor go in" — or use chunking.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 2) {
    const div = [3, 5, 6, 8][p % 4];
    const per = (ri(r, 15, 90) * div) / 10;
    ans = Math.round(per * 100) / 100;
    text = `${div} friends share ${money(per * div)} equally between them.\nHow much does each friend get?`;
    input = { type: 'number', placeholder: '£', tolerance: 0.005 };
    sol = [`Divide the money by ${div}: ${money(per * div)} ÷ ${div}.`, `Each friend gets ${money(ans)}.`];
    hint = 'Work in pounds, or convert to pence first, e.g. £7.65 = 765p.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: money(ans), solution: sol, hint };
  }

  if (t === 3) {
    const a = ri(r, 2, 9);
    const b = ri(r, 2, 9);
    const c = ri(r, 2, 9);
    ans = a + b * c;
    text = `Work out  ${a} + ${b} × ${c}`;
    input = { type: 'number' };
    sol = [`BIDMAS: multiplication before addition.`, `${b} × ${c} = ${b * c}, then ${a} + ${b * c} = ${ans}`];
    hint = 'BIDMAS: Multiplication comes before Addition.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 4) {
    const a = ri(r, 2, 8);
    const b = ri(r, 2, 8);
    const c = ri(r, 2, 8);
    ans = (a + b) * c;
    text = `Work out  (${a} + ${b}) × ${c}`;
    input = { type: 'number' };
    sol = [`Brackets first: ${a} + ${b} = ${a + b}.`, `Then ${a + b} × ${c} = ${ans}`];
    hint = 'BIDMAS: Brackets always come first.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 5) {
    const a = ri(r, 2, 9);
    const b = [2, 3, 4, 5, 6, 8][p % 6];
    const n = a * b;
    ans = n % 10 === 0 ? null : n;
    if (ans === null) {
      text = `Work out  ${n * 2} ÷ ${b} × 2`;
      ans = 4 * a;
      input = { type: 'number' };
      sol = [`Division and multiplication have equal priority — work left to right.`, `${n * 2} ÷ ${b} = ${2 * a}, then × 2 = ${ans}`];
      hint = 'Left to right: ÷ and × are equal, do whatever comes first.';
      return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
    }
    text = `Work out  ${n} ÷ ${b} × ${b}`;
    ans = n;
    input = { type: 'number' };
    sol = [`Division and multiplication have equal priority — work left to right.`, `${n} ÷ ${b} = ${a}, then ${a} × ${b} = ${n}`];
    hint = 'Left to right: ÷ and × are equal, do whatever comes first.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 6) {
    const d = [2, 4, 5, 8][p % 4];
    const a = ri(r, 11, 99) / 10;
    const multiplier = d === 5 ? 1000 : 100;
    ans = a * multiplier;
    text = `Work out  ${a} × ${multiplier}`;
    sol = [`Each zero moves the decimal point one place to the right.`, `${a} × ${multiplier} = ${ans}`];
    hint = '×100 moves the point 2 places right, ×1000 moves it 3 right.';
    input = { type: 'number' };
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 7) {
    const num = [325, 410, 560, 720, 95, 1410][p % 6];
    const mult = [100, 1000, 1000, 1000, 1000, 1000][p % 6];
    ans = num / mult;
    text = `Work out  ${num} ÷ ${mult}`;
    input = { type: 'number', tolerance: 1e-9 };
    sol = [`Each zero moves the decimal point one place to the left.`, `${num} ÷ ${mult} = ${ans}`];
    hint = '÷100 moves the point 2 places left, ÷1000 moves it 3 left.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 8) {
    const cases = [
      { e: '5² + 3', a: 28, s: ['Indices before addition: 5² = 25.', '25 + 3 = 28'] },
      { e: '6² − 11', a: 25, s: ['Indices before subtraction: 6² = 36.', '36 − 11 = 25'] },
      { e: '3 + 2²', a: 7, s: ['Indices before addition: 2² = 4.', '3 + 4 = 7'] },
      { e: '4² ÷ 2', a: 8, s: ['Indices before division: 4² = 16.', '16 ÷ 2 = 8'] },
      { e: '10 − 2³', a: 2, s: ['Indices before subtraction: 2³ = 8.', '10 − 8 = 2'] },
      { e: '1 + 3³', a: 28, s: ['Indices before addition: 3³ = 27.', '1 + 27 = 28'] },
    ];
    const c = cases[p % 6];
    ans = c.a;
    text = `Work out  ${c.e}`;
    input = { type: 'number' };
    sol = c.s;
    hint = 'BIDMAS: Indices (powers) come before +, −, ×, ÷.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  {
    const cases = [
      { t1: 'ticket', t2: 'drink', a: 8.5, b: 3.75, na: 2, nb: 2, pay: 30 },
      { t1: 'ticket', t2: 'snack', a: 7.25, b: 3.9, na: 3, nb: 2, pay: 40 },
      { t1: 'book', t2: 'pen', a: 6.5, b: 1.25, na: 2, nb: 3, pay: 20 },
      { t1: 'shirt', t2: 'socks', a: 12.99, b: 4.5, na: 2, nb: 1, pay: 50 },
      { t1: 'game', t2: 'poster', a: 18.5, b: 5.25, na: 1, nb: 2, pay: 40 },
      { t1: 'ticket', t2: 'programme', a: 9.25, b: 2.5, na: 2, nb: 2, pay: 35 },
    ];
    const c = cases[p % 6];
    const cost = c.a * c.na + c.b * c.nb;
    ans = Math.round((c.pay - cost) * 100) / 100;
    text = `A ${c.t1} costs ${money(c.a)} and a ${c.t2} costs ${money(c.b)}.\nSam buys ${c.na} ${c.t1}s and ${c.nb} ${c.t2}s and pays with ${money(c.pay)}.\nHow much change does Sam get?`;
    input = { type: 'number', placeholder: '£', tolerance: 0.005 };
    sol = [`Cost = ${c.na} × ${c.a} + ${c.nb} × ${c.b} = ${money(cost)}.`, `Change = ${money(c.pay)} − ${money(cost)} = ${money(ans)}.`];
    hint = 'Work out the total cost first, then subtract from the money paid.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: money(ans), solution: sol, hint };
  }
}
