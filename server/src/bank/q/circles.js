import { makeRand, ri, pick, shuffle, round } from '../../util.js';

const PI = 3.14;

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
  const r = makeRand('circles', v);
  const t = v % 8;
  const p = Math.floor(v / 8);
  if (p >= 8) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const d = [6, 10, 8, 20, 4, 14, 12, 16][p % 8];
    ans = round(PI * d, 2);
    text = `A circle has diameter ${d} cm.\nWork out its circumference (use π = 3.14).`;
    input = { type: 'number', tolerance: 0.011, placeholder: 'cm' };
    sol = [[`Circumference = π × d.`, `${PI} × ${d} = ${ans} cm`]];
    hint = 'Circumference = π × diameter.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 1) {
    const rad = [5, 7, 10, 15, 3, 8, 20, 6][p % 8];
    ans = round(2 * PI * rad, 2);
    text = `A circle has radius ${rad} cm.\nWork out its circumference (use π = 3.14).`;
    input = { type: 'number', tolerance: 0.011, placeholder: 'cm' };
    sol = [[`Circumference = 2πr.`, `2 × ${PI} × ${rad} = ${ans} cm`]];
    hint = 'Circumference = 2 × π × radius.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 2) {
    const rad = [4, 3, 6, 8, 10, 5, 7, 9][p % 8];
    ans = round(PI * rad * rad, 2);
    text = `A circle has radius ${rad} cm.\nWork out its area (use π = 3.14).`;
    input = { type: 'number', tolerance: 0.011, placeholder: 'cm²' };
    sol = [[`Area = π × r².`, `${PI} × ${rad}² = ${PI} × ${rad * rad} = ${ans} cm²`]];
    hint = 'Area = π × radius². Square the radius FIRST, then multiply by π.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} cm²`, solution: sol, hint };
  }

  if (t === 3) {
    const d = [10, 8, 6, 4, 12, 14, 16, 20][p % 8];
    const rad = d / 2;
    ans = round(PI * rad * rad, 2);
    text = `A circle has diameter ${d} cm.\nWork out its area (use π = 3.14).`;
    input = { type: 'number', tolerance: 0.011, placeholder: 'cm²' };
    sol = [[`Radius = diameter ÷ 2 = ${rad} cm.`, `Area = π × r² = ${PI} × ${rad}² = ${ans} cm²`]];
    hint = 'Halve the diameter to get the radius first!';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm²`, solution: sol, hint };
  }

  if (t === 4) {
    const d = [6, 8, 10, 12, 4, 14, 16, 20][p % 8];
    ans = round((PI * d) / 2 + d, 2);
    text = `A semicircle has diameter ${d} cm.\nWork out its perimeter (use π = 3.14).`;
    input = { type: 'number', tolerance: 0.011, placeholder: 'cm' };
    sol = [[`Half the circumference = (π × ${d}) ÷ 2 = ${round((PI * d) / 2, 2)} cm.`, `DON\u2019T FORGET the straight edge: + ${d} cm.`, `Perimeter = ${round((PI * d) / 2, 2)} + ${d} = ${ans} cm`]];
    hint = 'Half the circle PLUS the straight diameter. A classic trap!';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { rad: 6, ask: 'circumference', a: '12π cm' },
      { rad: 5, ask: 'area', a: '25π cm²' },
      { rad: 9, ask: 'circumference', a: '18π cm' },
      { rad: 4, ask: 'area', a: '16π cm²' },
      { rad: 8, ask: 'circumference', a: '16π cm' },
      { rad: 7, ask: 'area', a: '49π cm²' },
      { rad: 3, ask: 'circumference', a: '6π cm' },
      { rad: 10, ask: 'area', a: '100π cm²' },
    ];
    const c = cases[p % 8];
    text = `A circle has radius ${c.rad} cm.\nWork out its ${c.ask}, leaving your answer in terms of π.`;
    const wrongs = c.ask === 'circumference' ? ['6π cm', '36π cm', '12 cm'] : ['10π cm²', '25 cm²', '20π cm²'];
    m = mcq(r, c.a, wrongs.filter((x) => x !== c.a));
    input = m.input;
    sol = c.ask === 'circumference'
      ? [[`C = 2πr = 2 × ${c.rad} × π = ${2 * c.rad}π cm`]]
      : [[`A = πr² = π × ${c.rad}² = ${c.rad * c.rad}π cm²`]];
    hint = '"In terms of π" means do NOT substitute 3.14 — just leave π in!';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 6) {
    const rad = [4, 5, 7, 10, 3, 6, 9, 8][p % 8];
    const C = Math.round(2 * PI * rad * 100) / 100;
    ans = rad;
    text = `A circle has circumference ${C} cm.\nWork out its radius (use π = 3.14).`;
    input = { type: 'number', tolerance: 0.06, placeholder: 'cm' };
    sol = [[`C = 2πr, so r = C ÷ (2 × 3.14).`, `${C} ÷ ${round(6.28, 2)} = ${rad} cm (to the nearest whole cm)`]];
    hint = 'Rearrange C = 2πr to r = C ÷ (2π).';
    return { marks: 3, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  {
    const d = 0.7;
    const n = ri(r, 100, 400);
    ans = round(PI * d * n, 1);
    text = `A bicycle wheel has diameter 0.7 m.\nThe wheel turns ${n} times.\nHow far does the bicycle travel? (use π = 3.14, answer in metres)`;
    input = { type: 'number', tolerance: 0.5, placeholder: 'm' };
    sol = [[`Each turn = circumference = π × 0.7 = ${round(PI * 0.7, 3)} m.`, `Distance = ${round(PI * 0.7, 3)} × ${n} = ${ans} m`]];
    hint = 'One turn of the wheel = one circumference. Multiply by turns.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `${ans} m`, solution: sol, hint };
  }
}