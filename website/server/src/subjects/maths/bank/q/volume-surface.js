import { makeRand, ri, pick, shuffle } from '../../util.js';

export default function gen(v) {
  const r = makeRand('volume-surface', v);
  const t = v % 6;
  const p = Math.floor(v / 6);
  if (p >= 12) return null;
  let ans, text, input, sol, hint;

  if (t === 0) {
    const l = ri(r, 4, 12);
    const w = ri(r, 3, 9);
    const h = ri(r, 2, 8);
    ans = l * w * h;
    text = `A cuboid is ${l} cm long, ${w} cm wide and ${h} cm high.\nWork out its volume.`;
    input = { type: 'number', placeholder: 'cm³' };
    sol = [[`Volume = length × width × height.`, `${l} × ${w} × ${h} = ${ans} cm³`]];
    hint = 'Volume of a cuboid = l × w × h.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} cm³`, solution: sol, hint };
  }

  if (t === 1) {
    const s = ri(r, 3, 12);
    ans = s ** 3;
    text = `A cube has side length ${s} cm.\nWork out its volume.`;
    input = { type: 'number', placeholder: 'cm³' };
    sol = [[`Volume of a cube = side³.`, `${s}³ = ${s} × ${s} × ${s} = ${ans} cm³`]];
    hint = 'A cube\u2019s volume = side × side × side.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} cm³`, solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { l: 5, w: 4, h: 3 }, { l: 7, w: 3, h: 2 }, { l: 6, w: 5, h: 4 },
      { l: 4, w: 4, h: 9 }, { l: 8, w: 3, h: 5 }, { l: 10, w: 2, h: 6 },
      { l: 3, w: 6, h: 7 }, { l: 9, w: 4, h: 2 },
    ];
    const c = cases[p % 8];
    ans = 2 * (c.l * c.w + c.w * c.h + c.l * c.h);
    text = `A cuboid is ${c.l} cm long, ${c.w} cm wide and ${c.h} cm high.\nWork out its SURFACE AREA.`;
    input = { type: 'number', placeholder: 'cm²' };
    sol = [[`There are 6 faces: 2 of l×w, 2 of w×h, 2 of l×h.`, `Front/back: ${c.l} × ${c.h} = ${c.l * c.h} each.`, `Top/bottom: ${c.l} × ${c.w} = ${c.l * c.w} each.`, `Sides: ${c.w} × ${c.h} = ${c.w * c.h} each.`, `Total: 2×${c.l * c.h} + 2×${c.l * c.w} + 2×${c.w * c.h} = ${ans} cm²`]];
    hint = 'Surface area = add the areas of ALL 6 faces.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `${ans} cm²`, solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { b: 6, h: 4, l: 10 }, { b: 8, h: 3, l: 7 }, { b: 5, h: 6, l: 8 },
      { b: 4, h: 5, l: 12 }, { b: 10, h: 4, l: 5 }, { b: 6, h: 8, l: 4 },
      { b: 9, h: 4, l: 6 }, { b: 7, h: 6, l: 9 },
    ];
    const c = cases[p % 8];
    ans = (c.b * c.h * c.l) / 2;
    text = `A triangular prism has a triangular cross-section with base ${c.b} cm and height ${c.h} cm.\nThe prism is ${c.l} cm long.\nWork out its volume.`;
    input = { type: 'number', placeholder: 'cm³' };
    sol = [[`Cross-section area (triangle) = 1/2 × ${c.b} × ${c.h} = ${(c.b * c.h) / 2} cm².`, `Volume = area of cross-section × length = ${(c.b * c.h) / 2} × ${c.l} = ${ans} cm³`]];
    hint = 'Volume of any prism = area of the cross-section × length.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm³`, solution: sol, hint };
  }

  if (t === 4) {
    const ml = [45, 120, 250, 5, 630, 1000, 75, 400][p % 8];
    ans = ml;
    text = `A jug holds ${ml} cm³ of water.\nHow many millilitres is this?`;
    input = { type: 'number', placeholder: 'ml' };
    sol = [[`1 cm³ = 1 ml, so ${ml} cm³ = ${ml} ml`]];
    hint = '1 cm³ is exactly the same amount as 1 ml.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ml} ml`, solution: sol, hint };
  }

  {
    const L = [40, 50, 60, 80][p % 4];
    const W = [30, 40, 50, 20][p % 4];
    const H = [50, 40, 70, 100][p % 4];
    const cm3 = L * W * H;
    ans = cm3 / 1000;
    text = `A fish tank is ${L} cm long, ${W} cm wide and ${H} cm deep.\nHow many litres of water does it hold when full?`;
    input = { type: 'number', placeholder: 'litres' };
    sol = [[`Volume in cm³: ${L} × ${W} × ${H} = ${cm3} cm³.`, `1000 cm³ = 1 litre, so ${cm3} ÷ 1000 = ${ans} litres`]];
    hint = 'Work out cm³ first, then divide by 1000 to get litres.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} litres`, solution: sol, hint };
  }
}