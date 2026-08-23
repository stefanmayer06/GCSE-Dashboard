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
  const r = makeRand('area-perimeter', v);
  const t = v % 8;
  const p = Math.floor(v / 8);
  if (p >= 9) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const l = ri(r, 4, 15);
    const w = ri(r, 3, 12);
    ans = l * w;
    text = `A rectangle is ${l} cm long and ${w} cm wide.\nWork out its area.`;
    input = { type: 'number', placeholder: 'cm²' };
    sol = [[`Area of a rectangle = length × width.`, `${l} × ${w} = ${ans} cm²`]];
    hint = 'Area = base × height. Don\u2019t confuse it with perimeter!';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} cm²`, solution: sol, hint };
  }

  if (t === 1) {
    const l = ri(r, 5, 15);
    const w = ri(r, 3, 10);
    ans = 2 * (l + w);
    text = `A rectangle is ${l} m long and ${w} m wide.\nWork out its perimeter.`;
    input = { type: 'number', placeholder: 'm' };
    sol = [[`Perimeter = 2 × length + 2 × width.`, `2 × ${l} + 2 × ${w} = ${2 * l} + ${2 * w} = ${ans} m`]];
    hint = 'Perimeter = add ALL the sides (2 lengths + 2 widths).';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} m`, solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { b: 8, h: 5 }, { b: 10, h: 7 }, { b: 6, h: 9 }, { b: 12, h: 4 },
      { b: 14, h: 5 }, { b: 9, h: 8 }, { b: 16, h: 3 }, { b: 7, h: 6 }, { b: 20, h: 2 },
    ];
    const c = cases[p % 9];
    ans = (c.b * c.h) / 2;
    text = `A triangle has base ${c.b} cm and perpendicular height ${c.h} cm.\nWork out its area.`;
    input = { type: 'number', placeholder: 'cm²' };
    sol = [[`Area of a triangle = 1/2 × base × height.`, `1/2 × ${c.b} × ${c.h} = ${ans} cm²`]];
    hint = 'Area of a triangle = base × height ÷ 2. The height must be PERPENDICULAR.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} cm²`, solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { b: 8, h: 6 }, { b: 12, h: 5 }, { b: 9, h: 7 }, { b: 15, h: 4 },
      { b: 11, h: 8 }, { b: 7, h: 9 }, { b: 13, h: 6 }, { b: 10, h: 12 }, { b: 14, h: 5 },
    ];
    const c = cases[p % 9];
    ans = c.b * c.h;
    text = `A parallelogram has base ${c.b} cm and perpendicular height ${c.h} cm.\nWork out its area.`;
    input = { type: 'number', placeholder: 'cm²' };
    sol = [[`Area of a parallelogram = base × height.`, `${c.b} × ${c.h} = ${ans} cm²`]];
    hint = 'Area of a parallelogram = base × PERPENDICULAR height (not the slanted side).';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm²`, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { a: 5, b: 9, h: 4 }, { a: 3, b: 7, h: 6 }, { a: 4, b: 10, h: 5 },
      { a: 6, b: 12, h: 3 }, { a: 2, b: 8, h: 7 }, { a: 5, b: 11, h: 4 },
      { a: 4, b: 9, h: 8 }, { a: 7, b: 13, h: 5 }, { a: 3, b: 9, h: 6 },
    ];
    const c = cases[p % 9];
    ans = ((c.a + c.b) / 2) * c.h;
    text = `A trapezium has parallel sides ${c.a} cm and ${c.b} cm.\nIts height is ${c.h} cm.\nWork out its area.`;
    input = { type: 'number', placeholder: 'cm²' };
    sol = [[`Area = 1/2 × (a + b) × h.`, `1/2 × (${c.a} + ${c.b}) × ${c.h} = ${ans} cm²`]];
    hint = 'Add the two parallel sides first, then half, then multiply by the height.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm²`, solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { a: 6, b: 4, c: 3, d: 5 }, { a: 8, b: 5, c: 4, d: 3 },
      { a: 10, b: 3, c: 6, d: 4 }, { a: 5, b: 7, c: 2, d: 6 },
      { a: 9, b: 4, c: 5, d: 3 }, { a: 7, b: 6, c: 3, d: 4 },
      { a: 12, b: 5, c: 4, d: 6 }, { a: 6, b: 8, c: 3, d: 5 }, { a: 11, b: 4, c: 7, d: 2 },
    ];
    const c = cases[p % 9];
    ans = c.a * c.b + c.c * c.d;
    text = `An L-shape is made from two rectangles.\nThe first rectangle is ${c.a} cm by ${c.b} cm.\nThe second rectangle is ${c.c} cm by ${c.d} cm.\nWork out the TOTAL area of the shape.`;
    input = { type: 'number', placeholder: 'cm²' };
    sol = [[`Split into rectangles and find each area.`, `Rectangle 1: ${c.a} × ${c.b} = ${c.a * c.b} cm².`, `Rectangle 2: ${c.c} × ${c.d} = ${c.c * c.d} cm².`, `Total = ${c.a * c.b} + ${c.c * c.d} = ${ans} cm²`]];
    hint = 'Split the shape into rectangles, find each area, then add.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm²`, solution: sol, hint };
  }

  if (t === 6) {
    const l = ri(r, 6, 16);
    const w = ri(r, 4, 10);
    ans = 2 * (l + w);
    text = `A rectangle has a perimeter of ${2 * (l + w)} cm.\nIts length is ${l} cm.\nWork out its width.`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`Perimeter = 2 × length + 2 × width.`, `2 × width = ${2 * (l + w)} − 2 × ${l} = ${2 * w}.`, `Width = ${2 * w} ÷ 2 = ${w} cm`]];
    hint = 'Take the two lengths off the perimeter, then halve what is left.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: w, answerText: `${w} cm`, solution: sol, hint };
  }

  {
    const frame = [2, 3, 4][p % 3];
    const l = ri(r, 6, 12);
    const w = ri(r, 4, 8);
    const L = l + 2 * frame;
    const W = w + 2 * frame;
    ans = 2 * (L + W);
    text = `A photo measuring ${l} cm by ${w} cm is placed in a frame that is ${frame} cm wide all the way around.\nWork out the perimeter of the OUTER edge of the frame.`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`The frame adds ${frame} cm to EACH side.`, `Outer dimensions: ${l} + 2×${frame} = ${L} cm by ${w} + 2×${frame} = ${W} cm.`, `Perimeter = 2 × (${L} + ${W}) = ${ans} cm`]];
    hint = 'The frame widens the photo by TWICE the frame width (once each side).';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }
}