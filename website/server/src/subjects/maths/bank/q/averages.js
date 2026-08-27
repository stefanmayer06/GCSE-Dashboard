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
  const r = makeRand('averages', v);
  const t = v % 8;
  const p = Math.floor(v / 8);
  if (p >= 9) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const cases = [
      { set: [4, 7, 9, 12] }, { set: [6, 11, 13, 14, 16] }, { set: [3, 8, 8, 21] },
      { set: [5, 9, 10, 11, 15] }, { set: [2, 7, 8, 9, 14] }, { set: [10, 15, 20, 25, 30] },
      { set: [1, 3, 7, 9, 20] }, { set: [8, 12, 13, 17, 20] }, { set: [2, 4, 6, 8, 10, 12] },
    ];
    const c = cases[p % 9];
    ans = round(c.set.reduce((a, b) => a + b, 0) / c.set.length, 4);
    text = `Work out the mean of these numbers:\n${c.set.join(', ')}`;
    input = { type: 'number', tolerance: 1e-9 };
    sol = [[`Mean = total ÷ how many.`, `Total = ${c.set.join(' + ')} = ${c.set.reduce((a, b) => a + b, 0)}.`, `${c.set.reduce((a, b) => a + b, 0)} ÷ ${c.set.length} = ${ans}`]];
    hint = 'Add them all up, then divide by how many numbers there are.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { set: [3, 8, 5, 12, 6] }, { set: [7, 2, 9, 4] }, { set: [15, 3, 8, 11, 2, 20] },
      { set: [1, 5, 9, 13] }, { set: [22, 6, 14, 9, 17] }, { set: [4, 11, 7, 2, 15, 8] },
      { set: [10, 3, 6, 12, 1] }, { set: [18, 5, 9, 13, 21] }, { set: [2, 9, 14, 5, 8, 11] },
    ];
    const c = cases[p % 9];
    const s = [...c.set].sort((a, b) => a - b);
    const mid = s.length % 2 === 1 ? s[Math.floor(s.length / 2)] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
    ans = mid;
    text = `Work out the median of these numbers:\n${c.set.join(', ')}`;
    input = { type: 'number', tolerance: 1e-9 };
    sol = [[`Put them in order first: ${s.join(', ')}.`, s.length % 2 === 1 ? `The middle value is ${mid}.` : `Two middle values: average of ${s[s.length / 2 - 1]} and ${s[s.length / 2]} = ${mid}.`]];
    hint = 'Order the numbers first — the median is the MIDDLE one.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { set: [3, 5, 5, 7, 9] }, { set: [2, 2, 6, 8, 2, 9] }, { set: [1, 4, 4, 4, 7] },
      { set: [10, 12, 10, 15] }, { set: [3, 3, 3, 5, 8, 3] }, { set: [6, 6, 9, 6, 11, 6] },
      { set: [20, 20, 25, 30] }, { set: [4, 4, 4, 4, 9] }, { set: [7, 2, 7, 7, 11] },
    ];
    const c = cases[p % 9];
    const counts = {};
    let mode = null;
    let best = 0;
    for (const x of c.set) {
      counts[x] = (counts[x] || 0) + 1;
      if (counts[x] > best) { best = counts[x]; mode = x; }
    }
    ans = mode;
    text = `Work out the mode of these numbers:\n${c.set.join(', ')}`;
    input = { type: 'number' };
    sol = [[`The mode is the number that appears MOST.`, `${ans} appears ${best} times — more than any other.`]];
    hint = 'Mode = most common. It is NOT the biggest number!';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { set: [4, 9, 3, 12, 6] }, { set: [15, 2, 9, 20] }, { set: [7, 14, 3, 18, 5] },
      { set: [22, 8, 16, 10] }, { set: [1, 9, 4, 13, 6] }, { set: [30, 12, 25, 18] },
      { set: [11, 3, 17, 8, 5] }, { set: [40, 15, 28, 33] }, { set: [6, 19, 2, 14, 9] },
    ];
    const c = cases[p % 9];
    ans = Math.max(...c.set) - Math.min(...c.set);
    text = `Work out the range of these numbers:\n${c.set.join(', ')}`;
    input = { type: 'number' };
    sol = [[`Range = biggest − smallest.`, `${Math.max(...c.set)} − ${Math.min(...c.set)} = ${ans}`]];
    hint = 'Range = biggest minus smallest.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { table: [[1, 4], [2, 3], [3, 5]] },
      { table: [[2, 5], [3, 4], [4, 1]] },
      { table: [[1, 2], [2, 6], [3, 2]] },
      { table: [[0, 3], [1, 5], [2, 2]] },
      { table: [[2, 4], [3, 6], [4, 2]] },
      { table: [[1, 5], [2, 1], [3, 4]] },
      { table: [[3, 3], [4, 5], [5, 2]] },
      { table: [[0, 2], [1, 4], [2, 4]] },
    ];
    const c = cases[p % 8];
    const rows = c.table.map(([x, f]) => `${x}: ${f}`);
    const totalF = c.table.reduce((a, [, f]) => a + f, 0);
    const sumFX = c.table.reduce((a, [x, f]) => a + x * f, 0);
    ans = Math.round((sumFX / totalF) * 100) / 100;
    text = `The table shows the number of pets owned by ${totalF} students.\nNumber of pets (x): frequency\n${rows.join('   ')}\nWork out the mean number of pets.`;
    input = { type: 'number', tolerance: 0.011 };
    sol = [[`Multiply each value by its frequency and add: ${c.table.map(([x, f]) => `${x}×${f}`).join(' + ')} = ${sumFX}.`, `Divide by the total frequency: ${sumFX} ÷ ${totalF} = ${round(sumFX / totalF, 2)}`]];
    hint = 'Mean = sum of (value × frequency) ÷ total frequency.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { table: [[1, 4], [2, 3], [3, 5]], a: 2 },
      { table: [[2, 5], [3, 4], [4, 1]], a: 2.5 },
      { table: [[1, 2], [2, 6], [3, 2]], a: 2 },
      { table: [[0, 3], [1, 5], [2, 2]], a: 1 },
      { table: [[2, 4], [3, 6], [4, 2]], a: 3 },
      { table: [[1, 5], [2, 1], [3, 4]], a: 2 },
      { table: [[3, 3], [4, 5], [5, 2]], a: 4 },
      { table: [[0, 2], [1, 4], [2, 4]], a: 1 },
    ];
    const c = cases[p % 8];
    const rows = c.table.map(([x, f]) => `${x}: ${f}`);
    const totalF = c.table.reduce((a, [, f]) => a + f, 0);
    const flat = [];
    for (const [x, f] of c.table) for (let i = 0; i < f; i++) flat.push(x);
    flat.sort((a, b) => a - b);
    ans = totalF % 2 === 0 ? (flat[totalF / 2 - 1] + flat[totalF / 2]) / 2 : flat[Math.floor(totalF / 2)];
    text = `The table shows the number of pets owned by ${totalF} students.\nNumber of pets (x): frequency\n${rows.join('   ')}\nWork out the median number of pets.`;
    input = { type: 'number', tolerance: 1e-9 };
    const pos = totalF % 2 === 0 ? `positions ${totalF / 2} and ${totalF / 2 + 1}` : `position ${(totalF + 1) / 2}`;
    sol = [[`Total frequency = ${totalF}, so use ${pos}.`, `List them in order: ${flat.join(', ')}.`, `The median is ${ans}.`]];
    hint = 'Find the middle POSITION first: (total frequency + 1) ÷ 2.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 6) {
    const cases = [
      { known: [6, 8, 4, 9], mean: 7 },
      { known: [5, 11, 7, 8], mean: 8 },
      { known: [3, 9, 12, 6], mean: 8 },
      { known: [10, 4, 8, 5], mean: 7 },
      { known: [7, 13, 6, 11], mean: 9 },
      { known: [2, 14, 9, 7], mean: 9 },
      { known: [12, 8, 15, 9], mean: 11 },
      { known: [6, 10, 4, 12], mean: 9 },
    ];
    const c = cases[p % 8];
    ans = c.mean * 5 - c.known.reduce((a, b) => a + b, 0);
    text = `The mean of 5 numbers is ${c.mean}.\nFour of the numbers are ${c.known.join(', ')}.\nWork out the missing number.`;
    input = { type: 'number' };
    sol = [[`Total of all 5 numbers = ${c.mean} × 5 = ${c.mean * 5}.`, `Sum of the four known numbers = ${c.known.reduce((a, b) => a + b, 0)}.`, `Missing number = ${c.mean * 5} − ${c.known.reduce((a, b) => a + b, 0)} = ${ans}`]];
    hint = 'Mean × count = total. Work backwards from the total.';
    return { marks: 3, difficulty: 3, stretch: true, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  {
    const cases = [
      { q: 'the favourite crisp flavour of a class', a: 'mode', w: ['mean', 'median', 'range'] },
      { q: 'the average number of pets per student', a: 'mean', w: ['mode', 'median', 'range'] },
      { q: 'the most common shoe size in a shop', a: 'mode', w: ['mean', 'median', 'range'] },
      { q: 'the average house price on a street with one mansion', a: 'median', w: ['mean', 'mode', 'range'] },
      { q: 'the most popular film genre', a: 'mode', w: ['mean', 'median', 'range'] },
      { q: 'the average exam score of a class', a: 'mean', w: ['mode', 'median', 'range'] },
      { q: 'the middle salary in a company', a: 'median', w: ['mean', 'mode', 'range'] },
      { q: 'the most common number of goals in a season', a: 'mode', w: ['mean', 'median', 'range'] },
    ];
    const c = cases[p % 8];
    text = `Which average would be MOST appropriate for ${c.q}?`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Mode = most common (best for non-numeric choices).`, `Mean = total ÷ count (best when all values matter).`, `Median = middle value (best when outliers exist).`, `Answer: ${c.a}.`]];
    hint = 'Mode for favourites, mean for fair averages, median when outliers mess things up.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }
}
