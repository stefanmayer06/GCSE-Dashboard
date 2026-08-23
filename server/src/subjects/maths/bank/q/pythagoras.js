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
  const r = makeRand('pythagoras', v);
  const t = v % 6;
  const p = Math.floor(v / 6);
  if (p >= 8) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const k = [2, 3, 4, 5, 6, 7, 8, 10][p % 8];
    const a = 3 * k;
    const b = 4 * k;
    ans = 5 * k;
    text = `A right-angled triangle has shorter sides ${a} cm and ${b} cm.\nWork out the length of the hypotenuse.`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`a² + b² = c² → c = √(${a}² + ${b}²).`, `c² = ${a * a} + ${b * b} = ${a * a + b * b}.`, `c = √${a * a + b * b} = ${ans} cm`]];
    hint = 'Hypotenuse = √(a² + b²) — it is always the LONGEST side.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 1) {
    const k = [1, 2, 3, 4][p % 4];
    const a = 5 * k;
    const b = 12 * k;
    ans = 13 * k;
    text = `A right-angled triangle has shorter sides ${a} cm and ${b} cm.\nWork out the length of the hypotenuse.`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`c = √(${a}² + ${b}²) = √(${a * a} + ${b * b}) = √${a * a + b * b} = ${ans} cm`]];
    hint = 'Hypotenuse = √(a² + b²).';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { c: 13, b: 5 }, { c: 10, b: 6 }, { c: 15, b: 9 },
      { c: 17, b: 8 }, { c: 26, b: 10 }, { c: 25, b: 15 },
      { c: 20, b: 12 }, { c: 30, b: 18 },
    ];
    const c = cases[p % 8];
    ans = Math.sqrt(c.c * c.c - c.b * c.b);
    text = `A right-angled triangle has hypotenuse ${c.c} cm and one shorter side ${c.b} cm.\nWork out the length of the other shorter side.`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`For a shorter side: a = √(c² − b²).`, `a = √(${c.c}² − ${c.b}²) = √(${c.c * c.c} − ${c.b * c.b}) = √${c.c * c.c - c.b * c.b} = ${ans} cm`]];
    hint = 'Finding a shorter side? SUBTRACT, then square root.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { sides: '6 cm, 8 cm, 10 cm', a: 'Yes', check: '6² + 8² = 36 + 64 = 100 = 10²' },
      { sides: '5 cm, 7 cm, 9 cm', a: 'No', check: '5² + 7² = 25 + 49 = 74 ≠ 9² = 81' },
      { sides: '9 cm, 12 cm, 15 cm', a: 'Yes', check: '9² + 12² = 81 + 144 = 225 = 15²' },
      { sides: '4 cm, 5 cm, 6 cm', a: 'No', check: '4² + 5² = 16 + 25 = 41 ≠ 6² = 36' },
      { sides: '8 cm, 15 cm, 17 cm', a: 'Yes', check: '8² + 15² = 64 + 225 = 289 = 17²' },
      { sides: '7 cm, 10 cm, 13 cm', a: 'No', check: '7² + 10² = 49 + 100 = 149 ≠ 13² = 169' },
      { sides: '12 cm, 16 cm, 20 cm', a: 'Yes', check: '12² + 16² = 144 + 256 = 400 = 20²' },
      { sides: '6 cm, 9 cm, 11 cm', a: 'No', check: '6² + 9² = 36 + 81 = 117 ≠ 11² = 121' },
    ];
    const c = cases[p % 8];
    text = `A triangle has sides ${c.sides}.\nIs it right-angled?`;
    m = mcq(r, c.a, c.a === 'Yes' ? ['No', 'Only if drawn to scale', 'Cannot tell'] : ['Yes', 'Only if drawn to scale', 'Cannot tell']);
    input = m.input;
    sol = [[`If it is right-angled, a² + b² = c² (c = longest side).`, c.check, `So it is ${c.a === 'Yes' ? 'right-angled' : 'NOT right-angled'}.`]];
    hint = 'Test the two shorter sides against the longest: a² + b² = c²?';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { l: 13, d: 5 }, { l: 10, d: 6 }, { l: 15, d: 9 }, { l: 17, d: 8 },
      { l: 26, d: 10 }, { l: 20, d: 12 }, { l: 25, d: 7 }, { l: 5, d: 3 },
    ];
    const c = cases[p % 8];
    ans = Math.sqrt(c.l * c.l - c.d * c.d);
    text = `A ladder is ${c.l} m long.\nIts base is ${c.d} m from a wall.\nHow high up the wall does the ladder reach?`;
    input = { type: 'number', placeholder: 'm' };
    sol = [[`The ladder is the hypotenuse. Wall height = √(${c.l}² − ${c.d}²).`, `= √(${c.l * c.l} − ${c.d * c.d}) = √${c.l * c.l - c.d * c.d} = ${ans} m`]];
    hint = 'The ladder is the hypotenuse — so SUBTRACT and square root.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} m`, solution: sol, hint };
  }

  {
    const cases = [
      { l: 6, w: 8 }, { l: 9, w: 12 }, { l: 12, w: 5 }, { l: 5, w: 12 },
      { l: 15, w: 8 }, { l: 7, w: 24 }, { l: 6, w: 17.5 }, { l: 10, w: 24 },
    ];
    const c = cases[p % 8];
    ans = Math.round(Math.sqrt(c.l * c.l + c.w * c.w) * 10) / 10;
    text = `A rectangle is ${c.l} cm long and ${c.w} cm wide.\nWork out the length of its diagonal.`;
    input = { type: 'number', tolerance: 0.06, placeholder: 'cm' };
    sol = [[`The diagonal splits the rectangle into right-angled triangles.`, `d = √(${c.l}² + ${c.w}²) = √(${c.l * c.l} + ${c.w * c.w}) = ${ans} cm`]];
    hint = 'The diagonal is the hypotenuse of a right-angled triangle.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }
}