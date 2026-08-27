import { makeRand, ri, pick, shuffle, round } from '../../util.js';

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
  const r = makeRand('decimals', v);
  const t = v % 9;
  const p = Math.floor(v / 9);
  if (p >= 7) return null;
  let ans, text, input, sol, hint;

  if (t === 0) {
    const a = ri(r, 100, 999) / 100;
    const b = ri(r, 100, 999) / 100;
    ans = round(a + b, 2);
    text = `Work out  ${a} + ${b}`;
    input = { type: 'number', tolerance: 0.005, placeholder: '£' };
    sol = [[`Line up the decimal points and add each column.`, `${a} + ${b} = ${ans}`]];
    hint = 'Line the decimal points up, then add column by column.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `£${ans.toFixed(2)}`, solution: sol, hint };
  }

  if (t === 1) {
    const cost = round(ri(r, 350, 1850) / 100, 2);
    const pay = Math.ceil(cost) + ri(r, 1, 20);
    ans = round(pay - cost, 2);
    text = `A t-shirt costs £${cost.toFixed(2)}. Mia pays with £${pay}.00.\nHow much change does she get?`;
    input = { type: 'number', tolerance: 0.005, placeholder: '£' };
    sol = [[`£${pay.toFixed(2)} − £${cost.toFixed(2)} = £${ans.toFixed(2)}.`]];
    hint = 'Subtract the cost from the money paid — line up the decimal points.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `£${ans.toFixed(2)}`, solution: sol, hint };
  }

  if (t === 2) {
    const a = ri(r, 12, 98) / 10;
    const b = ri(r, 2, 9);
    ans = a * b;
    text = `Work out  ${a} × ${b}`;
    input = { type: 'number', tolerance: 1e-9 };
    sol = [[`Ignore the decimal point: ${Math.round(a * 10)} × ${b} = ${Math.round(a * 10) * b}.`, `One decimal place in the question → put the point back once → ${ans}`]];
    hint = 'Multiply as whole numbers first, then put the decimal point back.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { a: 0.3, b: 0.4 }, { a: 0.2, b: 0.6 }, { a: 0.5, b: 0.8 },
      { a: 1.2, b: 0.5 }, { a: 0.7, b: 0.3 }, { a: 2.5, b: 0.4 }, { a: 0.6, b: 1.5 },
    ];
    const c = cases[p % 7];
    ans = c.a * c.b;
    text = `Work out  ${c.a} × ${c.b}`;
    input = { type: 'number', tolerance: 1e-9 };
    const da = (c.a.toString().split('.')[1] || '').length;
    const db = (c.b.toString().split('.')[1] || '').length;
    sol = [[`${Math.round(c.a * 10 ** da)} × ${Math.round(c.b * 10 ** db)} = ${Math.round(c.a * 10 ** da) * Math.round(c.b * 10 ** db)}.`, `${da + db} decimal places in the question → ${da + db} in the answer → ${ans}`]];
    hint = 'Total decimal places in the answer = total decimal places in the question.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { n: 3.6, d: 4 }, { n: 7.2, d: 8 }, { n: 5.5, d: 5 },
      { n: 9.6, d: 3 }, { n: 4.9, d: 7 }, { n: 10.8, d: 12 }, { n: 8.4, d: 6 },
    ];
    const c = cases[p % 7];
    ans = c.n / c.d;
    text = `Work out  ${c.n} ÷ ${c.d}`;
    input = { type: 'number', tolerance: 1e-9 };
    const ints = Math.round(c.n * 10);
    sol = [[`Divide as if there is no point: ${ints} ÷ ${c.d} = ${ints / c.d}.`, `Put the point back → ${ans}`]];
    hint = 'Divide normally, then put the decimal point back in the same position.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { n: 4.2, d: 0.3 }, { n: 6.3, d: 0.7 }, { n: 3.6, d: 0.4 },
      { n: 9.6, d: 0.8 }, { n: 8.4, d: 0.6 }, { n: 7.5, d: 0.5 }, { n: 5.6, d: 0.7 },
    ];
    const c = cases[p % 7];
    ans = c.n / c.d;
    text = `Work out  ${c.n} ÷ ${c.d}`;
    input = { type: 'number', tolerance: 1e-9 };
    sol = [[`Make the divisor a whole number: × 10 top and bottom → ${Math.round(c.n * 10)} ÷ ${Math.round(c.d * 10)}.`, `${Math.round(c.n * 10)} ÷ ${Math.round(c.d * 10)} = ${ans}`]];
    hint = 'Multiply both numbers by 10, 100… until you are dividing by a whole number.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 6) {
    const cases = [
      { n: 7.418, a: 7.42 }, { n: 3.704, a: 3.7 }, { n: 0.876, a: 0.88 },
      { n: 12.354, a: 12.35 }, { n: 2.999, a: 3.0 }, { n: 9.995, a: 10.0 },
      { n: 5.122, a: 5.12 },
    ];
    const c = cases[p % 6];
    ans = c.a;
    text = `Round ${c.n} to 2 decimal places.`;
    input = { type: 'number', tolerance: 1e-9 };
    const third = parseInt(c.n.toString().split('.')[1]?.[2] ?? '0', 10);
    sol = [[`Look at the 3rd decimal place (${third}): ${third >= 5 ? '5 or more → round up' : 'less than 5 → keep it'}.`, `${c.n} → ${c.a}`]];
    hint = 'The 3rd decimal place decides what the 2nd becomes.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 7) {
    const lists = [
      { set: ['0.25', '0.3', '0.205', '0.29'], ans: '0.205' },
      { set: ['0.7', '0.67', '0.705', '0.72'], ans: '0.67' },
      { set: ['1.42', '1.4', '1.402', '1.39'], ans: '1.39' },
      { set: ['2.5', '2.48', '2.05', '2.51'], ans: '2.05' },
      { set: ['0.09', '0.1', '0.089', '0.11'], ans: '0.089' },
      { set: ['3.6', '3.56', '3.06', '3.601'], ans: '3.06' },
    ];
    const s = lists[p % 6];
    text = `Which of these numbers is the smallest?\n${s.set.join('   ')}`;
    const m = mcq(r, s.ans, s.set.filter((x) => x !== s.ans));
    input = m.input;
    sol = [[`Line them up with the same number of decimal places.`, `Smallest = ${s.ans}`]];
    hint = 'Pad with zeros: 0.3 = 0.300, so 0.3 > 0.29 > 0.25 > 0.205.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: s.ans, solution: sol, hint };
  }

  {
    const l = ri(r, 30, 90) / 10;
    const w = ri(r, 15, 45) / 10;
    ans = 2 * (l + w);
    text = `A rectangle is ${l} m long and ${w} m wide.\nWork out its perimeter.`;
    input = { type: 'number', tolerance: 1e-9, placeholder: 'm' };
    sol = [[`Perimeter = 2 × (length + width) = 2 × (${l} + ${w}) = 2 × ${l + w} = ${ans} m.`]];
    hint = 'Perimeter = distance all the way round = 2 × length + 2 × width.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} m`, solution: sol, hint };
  }
}