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
  const r = makeRand('graphs', v);
  const t = v % 8;
  const p = Math.floor(v / 8);
  if (p >= 8) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const grad = ri(r, 2, 5);
    const steps = [1, 2, 3, 4][p % 4];
    const y1 = ri(r, 1, 6);
    const x1 = ri(r, 1, 5);
    const y2 = y1 + grad * steps;
    const x2 = x1 + steps;
    ans = grad;
    text = `A straight line passes through the points (${x1}, ${y1}) and (${x2}, ${y2}).\nWork out the gradient of the line.`;
    input = { type: 'number' };
    sol = [[`Gradient = change in y ÷ change in x.`, `= (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ${y2 - y1} ÷ ${steps} = ${grad}`]];
    hint = 'Gradient = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁).';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { eq: 'y = 5x + 2', grad: 5 }, { eq: 'y = 3x − 7', grad: 3 },
      { eq: 'y = 8x + 1', grad: 8 }, { eq: 'y = 2x + 9', grad: 2 },
      { eq: 'y = 6x − 4', grad: 6 }, { eq: 'y = 9x + 3', grad: 9 },
      { eq: 'y = 4x + 5', grad: 4 }, { eq: 'y = 7x − 1', grad: 7 },
    ];
    const c = cases[p % 8];
    ans = c.grad;
    text = `What is the gradient of the line  ${c.eq}?`;
    input = { type: 'number' };
    sol = [[`y = mx + c, where m is the gradient.`, `In ${c.eq}, m = ${c.grad}.`]];
    hint = 'In y = mx + c, the number multiplying x is the gradient.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 2) {
    const m_ = [2, 3, 4, 5][p % 4];
    const c2 = [3, 4, 6, 7][p % 4];
    const corr = `y = ${m_}x + ${c2}`;
    text = `A straight line has gradient ${m_} and passes through the point (0, ${c2}).\nWhat is the equation of the line?`;
    m = mcq(r, corr, [`y = ${m_}x − ${c2}`, `y = ${c2}x + ${m_}`, `y = ${m_ + c2}x`]);
    input = m.input;
    sol = [[`y = mx + c: m = gradient, c = y-intercept.`, `Gradient = ${m_}, intercept (0, ${c2}) → c = ${c2}.`, corr]];
    hint = 'y = mx + c: m is the gradient, c is where the line crosses the y-axis.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { eq: 'y = 2x + 3', pt: '(5, 13)', a: 'Yes', w: ['No', 'Not enough information', 'Only if x is positive'] },
      { eq: 'y = 4x − 1', pt: '(2, 7)', a: 'Yes', w: ['No', 'Not enough information', 'Only if x is positive'] },
      { eq: 'y = x + 9', pt: '(3, 12)', a: 'Yes', w: ['No', 'Not enough information', 'Only if x is positive'] },
      { eq: 'y = 2x + 3', pt: '(4, 12)', a: 'No', w: ['Yes', 'Not enough information', 'Only if x is positive'] },
      { eq: 'y = 3x − 2', pt: '(2, 5)', a: 'No', w: ['Yes', 'Not enough information', 'Only if x is positive'] },
      { eq: 'y = 5x + 2', pt: '(7, 37)', a: 'Yes', w: ['No', 'Not enough information', 'Only if x is positive'] },
      { eq: 'y = 4x + 6', pt: '(2, 15)', a: 'No', w: ['Yes', 'Not enough information', 'Only if x is positive'] },
      { eq: 'y = x − 4', pt: '(10, 6)', a: 'Yes', w: ['No', 'Not enough information', 'Only if x is positive'] },
    ];
const c = cases[p % 8];
    text = `Is the point ${c.pt} on the line  ${c.eq}?`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    const x = parseInt(c.pt.split('(')[1].split(',')[0], 10);
    const y = parseInt(c.pt.split(', ')[1], 10);
    const parts = c.eq.match(/y = (\d*)x ([+\u2212-]) (\d+)/);
    const coef = parts[1] ? parseInt(parts[1], 10) : 1;
    const calc = parts[2] === '+' ? coef * x + parseInt(parts[3], 10) : coef * x - parseInt(parts[3], 10);
    sol = [[`Substitute x = ${x} into ${c.eq}: y = ${calc}.`, `The point has y = ${y}, so it is ${c.a === 'Yes' ? 'on' : 'NOT on'} the line.`]];
    hint = 'Substitute the x-coordinate in and see if you get the y-coordinate back.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 4) {
    const m_ = [2, 3, 4, 5][p % 4];
    const corr = `y = ${m_}x`;
    text = `Which line is parallel to  y = ${m_}x + ${3 + p % 4}?`;
    m = mcq(r, corr, [`y = ${m_ + 2}x + 5`, `y = ${m_ + 1}x`, `y = −${m_}x`]);
    input = m.input;
    sol = [[`Parallel lines have the SAME gradient.`, `The gradient of y = ${m_}x + ${3 + p % 4} is ${m_}, so a parallel line is ${corr} (gradient ${m_}, passing through the origin).`]];
    hint = 'Parallel lines never meet — they have the same gradient (m value).';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: corr, solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { eq: '2y = 6x + 4', a: 'y = 3x + 2', w: ['y = 3x + 4', 'y = 6x + 2', 'y = 12x + 4'] },
      { eq: '3y = 9x − 3', a: 'y = 3x − 1', w: ['y = 9x − 1', 'y = 3x − 3', 'y = 27x − 3'] },
      { eq: '4y = 8x + 12', a: 'y = 2x + 3', w: ['y = 8x + 3', 'y = 2x + 12', 'y = 4x + 3'] },
      { eq: '2y = 10x − 2', a: 'y = 5x − 1', w: ['y = 10x − 1', 'y = 5x − 2', 'y = 2x − 1'] },
      { eq: '5y = 15x + 10', a: 'y = 3x + 2', w: ['y = 15x + 2', 'y = 3x + 10', 'y = 5x + 2'] },
      { eq: '2y = 4x + 8', a: 'y = 2x + 4', w: ['y = 4x + 4', 'y = 2x + 8', 'y = x + 4'] },
      { eq: '3y = 12x − 6', a: 'y = 4x − 2', w: ['y = 12x − 2', 'y = 4x − 6', 'y = 3x − 2'] },
      { eq: '4y = 20x − 4', a: 'y = 5x − 1', w: ['y = 20x − 1', 'y = 5x − 4', 'y = 4x − 1'] },
    ];
    const c = cases[p % 8];
    text = `Rearrange  ${c.eq}  into the form y = mx + c.`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Divide EVERYTHING by the number in front of y.`, `${c.eq} → ${c.a}`]];
    hint = 'Divide every term by the number multiplying y.';
    return { marks: 3, difficulty: 3, stretch: true, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 6) {
    const cases = [
      { eq: 'y = 4x − 7', c: -7 }, { eq: 'y = 2x + 6', c: 6 },
      { eq: 'y = 9x − 3', c: -3 }, { eq: 'y = 5x + 1', c: 1 },
      { eq: 'y = 3x − 8', c: -8 }, { eq: 'y = 7x + 2', c: 2 },
      { eq: 'y = 6x − 1', c: -1 }, { eq: 'y = 4x + 9', c: 9 },
    ];
    const c = cases[p % 8];
    ans = c.c;
    text = `What is the y-intercept of the line  ${c.eq}?`;
    input = { type: 'number' };
    sol = [[`y = mx + c: the y-intercept is c — the y-value when x = 0.`, `Here, ${ans} is the number on its own.`]];
    hint = 'The y-intercept is where the line crosses the y-axis — the number on its own.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  {
    const pts = [
      { p1: [2, 4], p2: [6, 10], m: '(4, 7)' },
      { p1: [1, 3], p2: [9, 11], m: '(5, 7)' },
      { p1: [3, 5], p2: [7, 9], m: '(5, 7)' },
      { p1: [2, 8], p2: [10, 2], m: '(6, 5)' },
      { p1: [0, 0], p2: [8, 4], m: '(4, 2)' },
      { p1: [4, 1], p2: [12, 7], m: '(8, 4)' },
      { p1: [1, 6], p2: [9, 14], m: '(5, 10)' },
      { p1: [3, 2], p2: [11, 8], m: '(7, 5)' },
    ];
    const c = pts[p % 8];
    text = `Work out the midpoint of the points (${c.p1[0]}, ${c.p1[1]}) and (${c.p2[0]}, ${c.p2[1]}).`;
    m = mcq(r, c.m, [`(${(c.p1[0] + c.p2[0]) / 2}, ${(c.p1[1] + c.p2[1]) / 2 - 1})`, `(${(c.p1[0] + c.p2[0]) / 2 + 1}, ${(c.p1[1] + c.p2[1]) / 2})`, `(${(c.p1[0] + c.p2[0]) / 2}, ${(c.p1[1] + c.p2[1]) / 2 + 1})`]);
    input = m.input;
    sol = [[`Midpoint = average of the x-coordinates and average of the y-coordinates.`, `x: (${c.p1[0]} + ${c.p2[0]}) ÷ 2 = ${(c.p1[0] + c.p2[0]) / 2}`, `y: (${c.p1[1]} + ${c.p2[1]}) ÷ 2 = ${(c.p1[1] + c.p2[1]) / 2}`, `Midpoint: ${c.m}`]];
    hint = 'Add the xs and halve, add the ys and halve.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.m, solution: sol, hint };
  }
}
