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
  const r = makeRand('inequalities', v);
  const t = v % 5;
  const p = Math.floor(v / 5);
  if (p >= 12) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const x = ri(r, 1, 12);
    const a = [2, 3, 4, 5, 6, 7][p % 6];
    const b = ri(r, 1, 9);
    const c = a * x + b;
    const corr = `x > ${x}`;
    text = `Solve  ${a}x + ${b} > ${c}`;
    m = mcq(r, corr, [`x < ${x}`, `x ≥ ${x}`, `x ≤ ${x}`]);
    input = m.input;
    sol = [[`Solve it exactly like an equation: ${a}x > ${c - b}.`, `x > ${x}`]];
    hint = 'Solve it like an equation — the inequality sign stays the same here.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 1) {
    const x = ri(r, 1, 8);
    const a = [2, 3, 4, 5, 6, 7][p % 6];
    const b = ri(r, 1, 7);
    const c = a * (x + b);
    const corr = `x ≤ ${x}`;
    text = `Solve  ${a}(x + ${b}) ≤ ${c}`;
    m = mcq(r, corr, [`x < ${x}`, `x ≥ ${x}`, `x > ${x}`]);
    input = m.input;
    sol = [[`Expand first: ${a}x + ${a * b} ≤ ${c}.`, `x ≤ ${x}`]];
    hint = 'Expand the brackets first, then isolate x.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 2) {
    const lo = -ri(r, 3, 9);
    const hi = ri(r, 1, 8);
    const ints = [];
    for (let n = lo + 1; n <= hi; n++) ints.push(n);
    const corr = '{' + ints.join(', ') + '}';
    text = `List all the integers that satisfy\n${lo} < x ≤ ${hi}`;
    const wrong = ints.slice(0, -1);
    m = mcq(r, corr, [
      '{' + [...ints.slice(1), hi + 1].join(', ') + '}',
      '{' + [lo, ...ints].join(', ') + '}',
      '{' + [...wrong.slice(1), lo].join(', ') + '}',
    ]);
    input = m.input;
    sol = [[`Integers are whole numbers. x is more than ${lo} but at most ${hi}.`, `So x = ${ints.join(' or ')}`]];
    hint = '"<" means "strictly more than" (do not include the lower number), "≤" means "at most" (include the upper number).';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 3) {
    const n = ri(r, 10, 60);
    const corr = `x ≤ ${n}`;
    text = `A van can carry at most ${n} boxes.\nx is the number of boxes it carries.\nWrite this as an inequality.`;
    m = mcq(r, corr, [`x < ${n}`, `x ≥ ${n}`, `x > ${n}`]);
    input = m.input;
    sol = [[`"At most" means x can equal ${n} but not go above it.`, corr]];
    hint = '"At most" = ≤, "at least" = ≥.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  {
    const n = ri(r, 2, 9);
    const cases = [
      { corr: `x > ${n}`, desc: `The number line shows a line with an open circle at ${n} and an arrow to the right (numbers bigger than ${n} are shaded).`, w: [`x < ${n}`, `x ≥ ${n}`, `x ≤ ${n}`] },
      { corr: `x < ${n}`, desc: `The number line shows a line with an open circle at ${n} and an arrow to the left (numbers smaller than ${n} are shaded).`, w: [`x > ${n}`, `x ≥ ${n}`, `x ≤ ${n}`] },
      { corr: `x ≥ ${n}`, desc: `The number line shows a line with a closed (filled) circle at ${n} and an arrow to the right (numbers bigger than ${n} are shaded).`, w: [`x > ${n}`, `x < ${n}`, `x ≤ ${n}`] },
      { corr: `x ≤ ${n}`, desc: `The number line shows a line with a closed (filled) circle at ${n} and an arrow to the left (numbers smaller than ${n} are shaded).`, w: [`x > ${n}`, `x < ${n}`, `x ≥ ${n}`] },
    ];
    const c = cases[p % 4];
    text = `Which inequality is shown by the number line?\n${c.desc}`;
    m = mcq(r, c.corr, c.w);
    input = m.input;
    sol = [[`Open circle ○ = NOT included (< or >). Closed circle ● = included (≤ or ≥).`, `Shaded right = bigger than ${n}, shaded left = smaller than ${n}.`, `Answer: ${c.corr}`]];
    hint = 'Open circle < or >, filled circle ≤ or ≥. The arrow direction gives > or <.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.corr, solution: sol, hint };
  }
}