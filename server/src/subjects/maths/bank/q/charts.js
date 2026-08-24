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
  const r = makeRand('charts', v);
  const t = v % 6;
  const p = Math.floor(v / 6);
  if (p >= 12) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const cases = [
      { total: 180, n: 45 }, { total: 120, n: 30 }, { total: 200, n: 50 },
      { total: 160, n: 20 }, { total: 240, n: 60 }, { total: 90, n: 15 },
      { total: 360, n: 90 }, { total: 150, n: 50 }, { total: 320, n: 80 },
      { total: 140, n: 35 }, { total: 300, n: 100 }, { total: 270, n: 45 },
    ];
    const c = cases[p % 12];
    ans = round((c.n / c.total) * 360, 2);
    text = `A pie chart shows the favourite sports of ${c.total} students.\n${c.n} students chose football.\nWork out the size of the angle for football.`;
    input = { type: 'number', tolerance: 0.011, placeholder: '°' };
    sol = [[`Angle = (students ÷ total) × 360°.`, `(${c.n} ÷ ${c.total}) × 360 = ${ans}°`]];
    hint = 'Each student is worth 360 ÷ total degrees. Multiply by the count.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans}°`, solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { angle: 120, total: 90 }, { angle: 90, total: 120 }, { angle: 60, total: 180 },
      { angle: 150, total: 144 }, { angle: 45, total: 160 }, { angle: 180, total: 80 },
      { angle: 135, total: 96 }, { angle: 72, total: 150 }, { angle: 200, total: 108 },
      { angle: 100, total: 180 }, { angle: 40, total: 270 }, { angle: 160, total: 180 },
    ];
    const c = cases[p % 12];
    ans = round((c.angle / 360) * c.total, 4);
    text = `A pie chart shows how ${c.total} people travel to work.\nThe angle for "train" is ${c.angle}°.\nHow many people travel by train?`;
    input = { type: 'number', tolerance: 1e-9 };
    sol = [[`Fraction of the pie = ${c.angle} ÷ 360.`, `People = (${c.angle} ÷ 360) × ${c.total} = ${ans}`]];
    hint = 'Angle ÷ 360 gives the fraction, then multiply by the total.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { a: 23, b: 17, thing: 'sandwiches', place: 'Monday', place2: 'Tuesday' },
      { a: 31, b: 24, thing: 'drinks', place: 'Saturday', place2: 'Sunday' },
      { a: 42, b: 35, thing: 'tickets', place: 'week 1', place2: 'week 2' },
      { a: 18, b: 11, thing: 'cars', place: 'morning', place2: 'afternoon' },
      { a: 27, b: 19, thing: 'packets', place: 'shop A', place2: 'shop B' },
      { a: 35, b: 28, thing: 'books', place: 'January', place2: 'February' },
      { a: 40, b: 33, thing: 'goals', place: 'season 1', place2: 'season 2' },
      { a: 25, b: 16, thing: 'orders', place: 'lunch', place2: 'dinner' },
      { a: 48, b: 39, thing: 'views', place: 'video 1', place2: 'video 2' },
      { a: 21, b: 13, thing: 'jumpers', place: 'red', place2: 'blue' },
      { a: 33, b: 26, thing: 'slices', place: 'pizza A', place2: 'pizza B' },
      { a: 29, b: 22, thing: 'points', place: 'team A', place2: 'team B' },
    ];
    const c = cases[p % 12];
    ans = c.a - c.b;
    text = `A bar chart shows ${c.thing} sold.\n${c.place}: ${c.a}.  ${c.place2}: ${c.b}.\nHow many MORE ${c.thing} were sold on ${c.place}?`;
    input = { type: 'number' };
    sol = [[`Read the two bars and subtract: ${c.a} − ${c.b} = ${ans}`]];
    hint = 'Read the heights of both bars, then subtract.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { girls: 12, boys: 8, total: 60, cell: 20, what: 'total' },
      { girls: 10, boys: 6, total: 40, cell: 16, what: 'total' },
      { girls: 15, boys: 9, total: 72, cell: 24, what: 'total' },
      { girls: 8, boys: 5, total: 35, cell: 13, what: 'total' },
      { girls: 14, boys: 10, total: 80, cell: 24, what: 'total' },
      { girls: 9, boys: 7, total: 48, cell: 16, what: 'total' },
      { girls: 11, boys: 9, total: 50, cell: 20, what: 'total' },
      { girls: 13, boys: 6, total: 57, cell: 19, what: 'total' },
      { girls: 7, boys: 11, total: 54, cell: 18, what: 'total' },
      { girls: 16, boys: 12, total: 84, cell: 28, what: 'total' },
      { girls: 5, boys: 4, total: 27, cell: 9, what: 'total' },
      { girls: 18, boys: 14, total: 96, cell: 32, what: 'total' },
    ];
    const c = cases[p % 12];
    ans = c.cell;
    text = `A two-way table shows how pupils travel to school.\n${c.girls} girls and ${c.boys} boys walk.\nThere are ${c.total} pupils in total.\nWork out the total number of pupils who walk.`;
    input = { type: 'number' };
    sol = [[`Total who walk = girls who walk + boys who walk.`, `${c.girls} + ${c.boys} = ${c.cell}`]];
    hint = 'In a two-way table, add the row/column entries to fill missing cells.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { tallies: '||||/ |||', n: 8 }, { tallies: '||||', n: 4 }, { tallies: '||||/ ||||', n: 9 },
      { tallies: '||||/ ||', n: 7 }, { tallies: '||||/ ||||/ ||', n: 12 }, { tallies: '||||/ |', n: 6 },
      { tallies: '||||/ |||', n: 8 }, { tallies: '||', n: 2 }, { tallies: '||||/ ||||/', n: 10 },
      { tallies: '|||', n: 3 }, { tallies: '||||/ ||||/ |', n: 11 }, { tallies: '|', n: 1 },
    ];
    const c = cases[p % 12];
    ans = c.n;
    text = `A tally chart shows the number of pets owned.\nOne student's tally is:  ${c.tallies}\nHow many pets does this student own?`;
    input = { type: 'number' };
    sol = [[`Count in groups of 5 (four strokes then a diagonal line).`, `"${c.tallies}" = ${c.n}`]];
    hint = 'Count in groups of 5: four vertical strokes and one diagonal = 5.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  {
    const cases = [
      { key: '◯ = 4', sym: 7, what: 'cars sold', a: 28 },
      { key: '✿ = 5', sym: 6, what: 'plants', a: 30 },
      { key: '◯ = 10', sym: 9, what: 'tickets', a: 90 },
      { key: '☆ = 2', sym: 13, what: 'goals', a: 26 },
      { key: '◯ = 8', sym: 5, what: 'books', a: 40 },
      { key: '✿ = 3', sym: 11, what: 'cakes', a: 33 },
      { key: '◯ = 6', sym: 7, what: 'jumpers', a: 42 },
      { key: '☆ = 5', sym: 9, what: 'wins', a: 45 },
      { key: '◯ = 12', sym: 4, what: 'drinks', a: 48 },
      { key: '✿ = 4', sym: 10, what: 'orders', a: 40 },
      { key: '◯ = 9', sym: 6, what: 'goals', a: 54 },
      { key: '☆ = 7', sym: 8, what: 'points', a: 56 },
    ];
    const c = cases[p % 12];
    ans = c.a;
    text = `A pictogram shows ${c.what} per day.\nThe key says ${c.key}.\nOne row shows ${c.sym} symbols.\nHow many ${c.what} is that?`;
    input = { type: 'number' };
    sol = [[`Multiply symbols by the key value: ${c.sym} × ${parseInt(c.key.split('=')[1], 10)} = ${ans}`]];
    hint = 'Check the KEY first — one symbol can be worth more than 1!';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }
}
