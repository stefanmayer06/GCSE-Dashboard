import { makeRand, ri, pick, shuffle, round } from '../../util.js';

export default function gen(v) {
  const r = makeRand('percentages', v);
  const t = v % 8;
  const p = Math.floor(v / 8);
  if (p >= 8) return null;
  let ans, text, input, sol, hint;

  if (t === 0) {
    const cases = [
      { pct: 10, n: 280 }, { pct: 1, n: 4500 }, { pct: 50, n: 360 },
      { pct: 10, n: 92 }, { pct: 1, n: 380 }, { pct: 25, n: 160 },
      { pct: 10, n: 7.8 }, { pct: 50, n: 190 },
    ];
    const c = cases[p % 8];
    ans = (c.pct / 100) * c.n;
    text = `What is ${c.pct}% of ${c.n}?`;
    input = { type: 'number', tolerance: 1e-9 };
    sol = [[`${c.pct}% = divide by ${100 / c.pct}: ${c.n} ÷ ${100 / c.pct} = ${ans}`]];
    hint = '10% = ÷10, 1% = ÷100, 25% = ÷4, 50% = ÷2.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { pct: 15, n: 80 }, { pct: 35, n: 60 }, { pct: 45, n: 120 },
      { pct: 65, n: 40 }, { pct: 85, n: 60 }, { pct: 55, n: 80 },
      { pct: 75, n: 120 }, { pct: 95, n: 20 },
    ];
    const c = cases[p % 8];
    ans = (c.pct / 100) * c.n;
    text = `Work out ${c.pct}% of ${c.n}`;
    input = { type: 'number' };
    const ten = c.n / 10;
    const one = c.n / 100;
    const five = ten / 2;
    sol = [[`10% = ${ten}, 5% = ${five}, 1% = ${one}.`, `Build ${c.pct}% up in parts → ${ans}`]];
    hint = 'Start from 10% and 1%, then combine them.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { n: 40, pct: 15 }, { n: 60, pct: 20 }, { n: 80, pct: 25 },
      { n: 120, pct: 10 }, { n: 50, pct: 30 }, { n: 90, pct: 20 },
      { n: 200, pct: 12 }, { n: 45, pct: 40 },
    ];
    const c = cases[p % 8];
    ans = (c.n * (100 + c.pct)) / 100;
    text = `A jacket costs £${c.n}. The price increases by ${c.pct}%.\nWork out the new price.`;
    input = { type: 'number', placeholder: '£' };
    sol = [[`Multiplier for +${c.pct}% = 1.${c.pct}.`, `£${c.n} × 1.${c.pct} = £${ans}`]];
    hint = 'Increase by p% = multiply by (100+p)/100.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `£${ans}`, solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { n: 80, pct: 25 }, { n: 50, pct: 30 }, { n: 90, pct: 20 },
      { n: 120, pct: 15 }, { n: 60, pct: 35 }, { n: 100, pct: 14 },
      { n: 200, pct: 18 }, { n: 70, pct: 20 },
    ];
    const c = cases[p % 8];
    ans = (c.n * (100 - c.pct)) / 100;
    text = `A game costs £${c.n}. There is ${c.pct}% off.\nWork out the sale price.`;
    input = { type: 'number', placeholder: '£' };
    sol = [[`Multiplier for −${c.pct}% = 0.${100 - c.pct}.`, `£${c.n} × 0.${100 - c.pct} = £${ans}`]];
    hint = 'Decrease by p% = multiply by (100−p)/100.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `£${ans}`, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { n: 66, pct: 10 }, { n: 72, pct: 20 }, { n: 52.5, pct: 5 },
      { n: 90, pct: 25 }, { n: 115, pct: 15 }, { n: 84, pct: 40 },
      { n: 96, pct: 60 }, { n: 126, pct: 29 },
    ];
    const c = cases[p % 8];
    ans = round((c.n * 100) / (100 + c.pct), 4);
    const multiplier = (1 + c.pct / 100).toFixed(2);
    text = `A bike costs £${c.n} after a price increase of ${c.pct}%.\nWhat was the original price?`;
    input = { type: 'number', placeholder: '£', tolerance: 0.005 };
    sol = [[`£${c.n} is ${100 + c.pct}% of the original.`, `Original = £${c.n} ÷ ${multiplier} = £${round(ans, 2)}`]];
    hint = 'To UNDO an increase, divide by the multiplier.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `£${round(ans, 2)}`, solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { a: 40, b: 48 }, { a: 60, b: 45 }, { a: 25, b: 30 },
      { a: 80, b: 68 }, { a: 150, b: 180 }, { a: 30, b: 24 },
      { a: 120, b: 90 }, { a: 70, b: 84 },
    ];
    const c = cases[p % 8];
    const diff = c.b - c.a;
    ans = Math.abs(diff) / c.a * 100;
    const what = c.b - c.a;
    text = `The price of a ticket changes from £${c.a} to £${c.b}.\nWhat is the percentage ${what > 0 ? 'increase' : 'decrease'}?`;
    input = { type: 'number', placeholder: '%' };
    sol = [[`Change = £${c.b} − £${c.a} = £${Math.abs(diff)}.`, `Percentage change = ${Math.abs(diff)} ÷ ${c.a} × 100 = ${ans}%`]];
    hint = 'Percentage change = (change ÷ original) × 100.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans}%`, solution: sol, hint };
  }

  if (t === 6) {
    const cases = [
      { a: 12, b: 60 }, { a: 21, b: 70 }, { a: 18, b: 45 },
      { a: 36, b: 80 }, { a: 27, b: 60 }, { a: 42, b: 56 },
      { a: 24, b: 40 }, { a: 33, b: 55 },
    ];
    const c = cases[p % 8];
    ans = round((c.a / c.b) * 100, 4);
    text = `Sam scores ${c.a} out of ${c.b} in a test.\nWhat percentage is this?`;
    input = { type: 'number', placeholder: '%', tolerance: 1e-9 };
    sol = [[`${c.a} ÷ ${c.b} × 100 = ${ans}%`]];
    hint = 'Score ÷ total × 100.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans}%`, solution: sol, hint };
  }

  {
    const n = [500, 800, 1000, 1200, 250, 640][p % 6];
    const rate = [4, 5, 6, 3, 8, 10][p % 6];
    const r1 = round(n * (1 + rate / 100), 2);
    ans = round(r1 * (1 + rate / 100), 2);
    text = `£${n} is invested in a savings account at ${rate}% compound interest per year.\nNo other money is added. Work out the total after 2 years.`;
    input = { type: 'number', placeholder: '£', tolerance: 0.011 };
    sol = [[`Year 1: £${n} × 1.${rate < 10 ? '0' + rate : rate} = £${r1.toFixed(2)}.`, `Year 2: £${r1.toFixed(2)} × 1.${rate < 10 ? '0' + rate : rate} = £${ans.toFixed(2)}.`]];
    hint = 'Compound interest gets interest on ALL the money each year — multiply again.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `£${ans.toFixed(2)}`, solution: sol, hint };
  }
}
