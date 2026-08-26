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
  const r = makeRand('fractions', v);
  const t = v % 10;
  const p = Math.floor(v / 10);
  if (p >= 6) return null;
  let ans, text, input, sol, hint;
  let m;

  if (t === 0) {
    const base = [8, 10, 12, 5, 7, 9][p % 6];
    let a, b;
    do { a = ri(r, 1, base - 1); b = ri(r, 1, base - 1); } while (b === a);
    const sum = a + b;
    text = `Work out  ${a}/${base}  +  ${b}/${base}\nGive your answer as a fraction in its simplest form.`;
    const corr = fracStr(sum, base);
    const wrongs = [`${sum}/${base}`, `${a + b}/${base * 2}`, fracStr(sum - 1, base)].filter((x) => x !== corr).slice(0, 3);
    m = mcq(r, corr, wrongs);
    sol = [`Same denominator — just add the tops: ${a} + ${b} = ${sum}.`, `Answer: ${sum}/${base}${corr !== `${sum}/${base}` ? ` = ${corr}` : ''}`];
    hint = 'When denominators match, only the numerators are added.';
    return { marks: 1, difficulty: 1, stretch: false, text, input: m.input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 1) {
    const pairs = [
      { a: 1, b: 3, c: 1, d: 4 },
      { a: 1, b: 2, c: 1, d: 6 },
      { a: 1, b: 4, c: 1, d: 6 },
      { a: 2, b: 5, c: 1, d: 10 },
      { a: 1, b: 3, c: 1, d: 6 },
      { a: 2, b: 3, c: 1, d: 4 },
    ];
    const { a, b, c, d } = pairs[p % 6];
    const corr = fracStr(a * d + c * b, b * d);
    text = `Work out  ${a}/${b}  +  ${c}/${d}\nGive your answer as a fraction in its simplest form.`;
    const lcm = (b * d) / ((x, y) => { while (y) [x, y] = [y, x % y]; return x; })(b, d);
    const wrongs = [`${a + c}/${b + d}`, fracStr(a + c, b), `${a * d + c * b}/${b * d}`].filter((x) => x !== corr).slice(0, 3);
    m = mcq(r, corr, wrongs);
    sol = [`Make the denominators the same (LCM of ${b} and ${d} is ${lcm}).`, `${a}/${b} = ${(a * lcm) / b}/${lcm} and ${c}/${d} = ${(c * lcm) / d}/${lcm}.`, `Add the tops → ${corr}`];
    hint = 'Change both fractions so they share the same denominator, then add the tops.';
    return { marks: 2, difficulty: 2, stretch: false, text, input: m.input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 2) {
    const pairs = [
      { a: 3, b: 4, c: 1, d: 3 },
      { a: 5, b: 6, c: 1, d: 2 },
      { a: 7, b: 8, c: 1, d: 4 },
      { a: 4, b: 5, c: 1, d: 10 },
      { a: 5, b: 6, c: 1, d: 4 },
      { a: 7, b: 10, c: 1, d: 5 },
    ];
    const { a, b, c, d } = pairs[p % 6];
    const corr = fracStr(a * d - c * b, b * d);
    text = `Work out  ${a}/${b}  −  ${c}/${d}\nGive your answer as a fraction in its simplest form.`;
    const wrongs = [`${a - c}/${b - d}`, fracStr(a - c, b), `${a * d - c * b}/${b * d}`].filter((x) => x !== corr).slice(0, 3);
    m = mcq(r, corr, wrongs);
    sol = [`Make the denominators the same, then subtract the tops.`, `${a}/${b} − ${c}/${d} = ${corr}`];
    hint = 'Common denominator first — you cannot just subtract the tops.';
    return { marks: 2, difficulty: 2, stretch: false, text, input: m.input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 3) {
    const pairs = [
      { a: 2, b: 3, c: 3, d: 5 },
      { a: 3, b: 4, c: 2, d: 3 },
      { a: 1, b: 2, c: 2, d: 7 },
      { a: 3, b: 5, c: 5, d: 8 },
      { a: 4, b: 5, c: 5, d: 6 },
      { a: 2, b: 9, c: 3, d: 4 },
    ];
    const { a, b, c, d } = pairs[p % 6];
    const corr = fracStr(a * c, b * d);
    text = `Work out  ${a}/${b}  ×  ${c}/${d}\nGive your answer as a fraction in its simplest form.`;
    const wrongs = [`${a * c}/${b}`, fracStr(a * d, c * b), fracStr(a + c, b * d)].filter((x) => x !== corr).slice(0, 3);
    m = mcq(r, corr, wrongs);
    sol = [`Multiply the tops: ${a} × ${c} = ${a * c}. Multiply the bottoms: ${b} × ${d} = ${b * d}.`, `${a * c}/${b * d} simplifies to ${corr}`];
    hint = 'Multiply top × top and bottom × bottom, then simplify.';
    return { marks: 2, difficulty: 2, stretch: false, text, input: m.input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { n: 6, a: 2, b: 3 },
      { n: 10, a: 2, b: 5 },
      { n: 6, a: 1, b: 3 },
      { n: 8, a: 2, b: 3 },
      { n: 12, a: 3, b: 4 },
      { n: 9, a: 3, b: 5 },
    ];
    const { n, a, b } = cases[p % 6];
    const corr = fracStr(n * b, a);
    text = `Work out  ${n} ÷ ${a}/${b}`;
    const wrongs = [fracStr(n * a, b), fracStr(n * b * a, 1), fracStr(n * b, a + b)].filter((x) => x !== corr).slice(0, 3);
    m = mcq(r, corr, wrongs);
    sol = [`Divide by a fraction = multiply by its flip (KFC).`, `${n} ÷ ${a}/${b} = ${n} × ${b}/${a} = ${n * b}/${a} = ${corr}`];
    hint = 'Keep the first, Flip the second, Change ÷ to ×.';
    return { marks: 3, difficulty: 3, stretch: true, text, input: m.input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { a: 3, b: 4, n: 28 },
      { a: 2, b: 5, n: 35 },
      { a: 5, b: 6, n: 42 },
      { a: 3, b: 8, n: 72 },
      { a: 7, b: 10, n: 90 },
      { a: 2, b: 3, n: 60 },
    ];
    const { a, b, n } = cases[p % 6];
    ans = (n / b) * a;
    text = `A concert hall has ${n} seats. ${a}/${b} of the seats are occupied.\nHow many seats are occupied?`;
    input = { type: 'number' };
    sol = [`Divide by the bottom: ${n} ÷ ${b} = ${n / b}.`, `Multiply by the top: ${n / b} × ${a} = ${ans}.`];
    hint = 'To find a fraction of an amount: divide by the bottom, multiply by the top.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 6) {
    const cases = [
      { w: 2, a: 3, b: 4 },
      { w: 3, a: 1, b: 2 },
      { w: 1, a: 5, b: 6 },
      { w: 4, a: 2, b: 3 },
      { w: 2, a: 2, b: 5 },
      { w: 5, a: 3, b: 8 },
    ];
    const { w, a, b } = cases[p % 6];
    ans = w * b + a;
    text = `Write  ${w} ${a}/${b}  as an improper fraction.\nGive the NUMERATOR (the top number) of your answer.`;
    input = { type: 'number' };
    sol = [[`${w} × ${b} + ${a} = ${ans}, so the improper fraction is ${ans}/${b}.`]];
    hint = 'Whole × bottom + top gives the new top number.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans}/${b}`, solution: sol, hint };
  }

  if (t === 7) {
    const cases = [
      { n: 13, d: 4 }, { n: 11, d: 3 }, { n: 17, d: 5 },
      { n: 22, d: 7 }, { n: 14, d: 6 }, { n: 19, d: 6 },
    ];
    const { n, d } = cases[p % 6];
    const w = Math.floor(n / d);
    const rem = n % d;
    const proper = fracStr(rem, d);
    const corr = rem === 0 ? `${w}` : `${w} ${proper}`;
    text = `Write  ${n}/${d}  as a mixed number in its simplest form.`;
    const wrongs = [`${w + 1} ${rem}/${d}`, `${w} ${d - rem}/${d}`, `${w + 1} ${(rem + d) / d}/${d}`].filter((x) => x !== corr && x.length > 0).slice(0, 3);
    m = mcq(r, corr, wrongs);
    sol = [`How many whole ${d}s fit into ${n}? ${n} ÷ ${d} = ${w} remainder ${rem}.`, `Simplify the remaining ${rem}/${d} to ${proper}.`, `So ${n}/${d} = ${corr}`];
    hint = 'Divide the top by the bottom: the answer is the whole part, the remainder is the new top.';
    return { marks: 1, difficulty: 1, stretch: false, text, input: m.input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 8) {
    const cases = [
      { n: 12, d: 16, r: '3/4' }, { n: 6, d: 9, r: '2/3' }, { n: 10, d: 15, r: '2/3' },
      { n: 8, d: 20, r: '2/5' }, { n: 21, d: 28, r: '3/4' }, { n: 14, d: 35, r: '2/5' },
    ];
const c = cases[p % 6];
    const top = parseInt(c.r.split('/')[0], 10);
    const div = c.n / top;
    text = `Simplify  ${c.n}/${c.d}`;
    const wrongs = [`${c.n / 2}/${c.d / 2}`, `${c.n}/${c.d - 1}`, `${c.n - 1}/${c.d}`].filter((x) => x !== c.r).slice(0, 3);
    m = mcq(r, c.r, wrongs);
    sol = [[`Find the biggest number that divides both: ${div} goes into ${c.n} and ${c.d}.`, `Divide top and bottom by ${div} → ${c.r}`]];
    hint = 'Divide the top AND the bottom by the same number.';
    return { marks: 1, difficulty: 1, stretch: false, text, input: m.input, answer: m.answer, answerText: c.r, solution: sol, hint };
  }

  {
    const cases = [
      { a: 3, b: 4, to: 12, n: 9 },
      { a: 2, b: 3, to: 15, n: 10 },
      { a: 4, b: 5, to: 20, n: 16 },
      { a: 7, b: 8, to: 24, n: 21 },
      { a: 3, b: 5, to: 25, n: 15 },
      { a: 5, b: 6, to: 30, n: 25 },
    ];
    const c = cases[p % 6];
    ans = c.n;
    text = `Fill in the missing number:   ${c.a}/${c.b}  =  ?/${c.to}`;
    input = { type: 'number' };
    sol = [[`${c.to} ÷ ${c.b} = ${c.to / c.b}, so multiply the top by the same: ${c.a} × ${c.to / c.b} = ${c.n}.`]];
    hint = 'Whatever you multiply the bottom by, multiply the top by too.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }
}
