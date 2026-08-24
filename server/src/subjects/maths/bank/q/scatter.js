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
  const r = makeRand('scatter', v);
  const t = v % 4;
  const p = Math.floor(v / 4);
  if (p >= 16) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const cases = [
      { x: 'hours of revision', y: 'exam score', a: 'positive correlation', w: ['negative correlation', 'no correlation', 'a curve'] },
      { x: 'temperature', y: 'number of ice creams sold', a: 'positive correlation', w: ['negative correlation', 'no correlation', 'a curve'] },
      { x: 'age of a car', y: 'its value', a: 'negative correlation', w: ['positive correlation', 'no correlation', 'a curve'] },
      { x: 'height', y: 'shoe size', a: 'positive correlation', w: ['negative correlation', 'no correlation', 'a curve'] },
      { x: 'hours of gaming', y: 'hours of sleep', a: 'negative correlation', w: ['positive correlation', 'no correlation', 'a curve'] },
      { x: 'distance from the sea', y: 'price of fish', a: 'positive correlation', w: ['negative correlation', 'no correlation', 'a curve'] },
      { x: 'shoe size', y: 'favourite colour', a: 'no correlation', w: ['positive correlation', 'negative correlation', 'a curve'] },
      { x: 'height of a hill', y: 'temperature at the top', a: 'negative correlation', w: ['positive correlation', 'no correlation', 'a curve'] },
    ];
    const c = cases[p % 8];
    const pattern = c.a === 'positive correlation' ? 'rise from bottom-left to top-right' : c.a === 'negative correlation' ? 'fall from top-left to bottom-right' : 'are scattered with no clear upward or downward pattern';
    text = `On a scatter graph, ${c.x} is plotted against ${c.y}.\nThe points ${pattern}.\nWhat type of correlation does the graph show?`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Points going UP as you move right = positive. Down = negative.`, `Answer: ${c.a}.`]];
    hint = 'Up together = positive, one up one down = negative, scattered = none.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { p1: [5, 20], p2: [20, 50], x: 10, a: 30, ctx: 'hours spent revising' },
      { p1: [10, 30], p2: [30, 90], x: 20, a: 60, ctx: 'hours of practice' },
      { p1: [4, 15], p2: [16, 75], x: 10, a: 50, ctx: 'hours of study' },
      { p1: [2, 12], p2: [12, 42], x: 7, a: 27, ctx: 'hours of training' },
      { p1: [5, 25], p2: [15, 65], x: 10, a: 45, ctx: 'hours of revision' },
      { p1: [8, 20], p2: [20, 44], x: 12, a: 28, ctx: 'hours of lessons' },
      { p1: [3, 11], p2: [18, 71], x: 10, a: 43, ctx: 'hours of practice' },
      { p1: [6, 22], p2: [18, 58], x: 12, a: 40, ctx: 'hours of study' },
      { p1: [10, 40], p2: [30, 120], x: 20, a: 80, ctx: 'hours of training' },
      { p1: [2, 8], p2: [14, 56], x: 8, a: 32, ctx: 'hours of revision' },
      { p1: [4, 14], p2: [16, 62], x: 10, a: 42, ctx: 'hours of lessons' },
      { p1: [5, 15], p2: [25, 95], x: 15, a: 55, ctx: 'hours of practice' },
      { p1: [7, 25], p2: [21, 67], x: 14, a: 46, ctx: 'hours of study' },
      { p1: [3, 10], p2: [15, 46], x: 9, a: 28, ctx: 'hours of training' },
      { p1: [6, 18], p2: [24, 72], x: 12, a: 36, ctx: 'hours of revision' },
      { p1: [8, 30], p2: [20, 66], x: 14, a: 48, ctx: 'hours of lessons' },
    ];
    const c = cases[p % 16];
    const g = (c.p2[1] - c.p1[1]) / (c.p2[0] - c.p1[0]);
    const intercept = c.p1[1] - g * c.p1[0];
    ans = round(g * c.x + intercept, 4);
    text = `A scatter graph shows test score against ${c.ctx}.\nA line of best fit has been drawn through (${c.p1[0]}, ${c.p1[1]}) and (${c.p2[0]}, ${c.p2[1]}).\nUse the line to ESTIMATE the test score for ${c.x} hours.`;
    input = { type: 'number', tolerance: 0.5 };
    sol = [[`Gradient = (${c.p2[1]} − ${c.p1[1]}) ÷ (${c.p2[0]} − ${c.p1[0]}) = ${g}.`, `At x = ${c.x}: y = ${g} × ${c.x} + ${intercept} = ${ans}`]];
    hint = 'Use the LINE, not the points: go up from the x-value until you hit the line, then read across.';
    return { marks: 3, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `≈ ${ans}`, solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { pts: '(1, 10), (2, 9), (3, 11), (12, 40)', a: '(12, 40)', w: ['(1, 10)', '(2, 9)', '(3, 11)'] },
      { pts: '(4, 5), (5, 6), (6, 5), (20, 2)', a: '(20, 2)', w: ['(4, 5)', '(5, 6)', '(6, 5)'] },
      { pts: '(2, 30), (3, 28), (4, 31), (15, 80)', a: '(15, 80)', w: ['(2, 30)', '(3, 28)', '(4, 31)'] },
      { pts: '(1, 2), (2, 3), (3, 4), (25, 1)', a: '(25, 1)', w: ['(1, 2)', '(2, 3)', '(3, 4)'] },
      { pts: '(5, 50), (6, 48), (7, 52), (18, 10)', a: '(18, 10)', w: ['(5, 50)', '(6, 48)', '(7, 52)'] },
      { pts: '(3, 20), (4, 22), (5, 19), (30, 60)', a: '(30, 60)', w: ['(3, 20)', '(4, 22)', '(5, 19)'] },
      { pts: '(2, 15), (3, 14), (4, 16), (22, 5)', a: '(22, 5)', w: ['(2, 15)', '(3, 14)', '(4, 16)'] },
      { pts: '(1, 40), (2, 42), (3, 41), (28, 90)', a: '(28, 90)', w: ['(1, 40)', '(2, 42)', '(3, 41)'] },
    ];
    const c = cases[p % 8];
    text = `A scatter graph has these points:\n${c.pts}\nWhich point is an outlier?`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`An outlier is far away from the general pattern of the other points.`, `${c.a} does not fit the pattern → outlier.`]];
    hint = 'Look for the point that does NOT fit the pattern.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  {
    const cases = [
      { data: 'data for 0–10 hours', a: 'Yes — you can only estimate within the range of the data', w: ['No — the line can go on forever', 'Yes — as long as the line is straight', 'No — only if the points are plotted'] },
      { data: 'data for speeds of 10–70 mph', a: 'Yes — you can only estimate within the range of the data', w: ['No — the line can go on forever', 'Yes — as long as the line is straight', 'No — only if the points are plotted'] },
      { data: 'data for ages 5–16', a: 'Yes — you can only estimate within the range of the data', w: ['No — the line can go on forever', 'Yes — as long as the line is straight', 'No — only if the points are plotted'] },
      { data: 'data for 1–20 drinks', a: 'Yes — you can only estimate within the range of the data', w: ['No — the line can go on forever', 'Yes — as long as the line is straight', 'No — only if the points are plotted'] },
    ];
    const c = cases[p % 4];
    text = `A scatter graph has ${c.data}.\nIs it reliable to use the line of best fit to estimate a value OUTSIDE this range?`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`The line of best fit only models the data you have.`, `Estimates far outside the plotted range are unreliable.`]];
    hint = 'Extrapolating (going beyond the data) is risky — the trend might change.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }
}
