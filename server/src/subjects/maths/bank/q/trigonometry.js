import { makeRand, ri, pick, shuffle, round } from '../../util.js';

export default function gen(v) {
  const r = makeRand('trigonometry', v);
  const t = v % 6;
  const p = Math.floor(v / 6);
  if (p >= 8) return null;
  let ans, text, input, sol, hint;

  if (t === 0) {
    const cases = [
      { H: 10, th: 30 }, { H: 8, th: 30 }, { H: 12, th: 30 }, { H: 16, th: 30 },
      { H: 20, th: 30 }, { H: 6, th: 30 }, { H: 18, th: 30 }, { H: 14, th: 30 },
    ];
    const c = cases[p % 8];
    ans = c.H * 0.5;
    text = `A right-angled triangle has hypotenuse ${c.H} cm.\nThe angle between the hypotenuse and the adjacent side is ${c.th}°.\nWork out the length of the side OPPOSITE the ${c.th}° angle.`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`Opposite and hypotenuse → SOH: sin ${c.th}° = O ÷ ${c.H}.`, `sin 30° = 1/2, so O = ${c.H} × 1/2 = ${ans} cm`]];
    hint = 'SOH CAH TOA — with the hypotenuse use sin (O/H) or cos (A/H).';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { H: 12, th: 60 }, { H: 8, th: 60 }, { H: 10, th: 60 }, { H: 16, th: 60 },
      { H: 20, th: 60 }, { H: 6, th: 60 }, { H: 18, th: 60 }, { H: 14, th: 60 },
    ];
    const c = cases[p % 8];
    ans = c.H * 0.5;
    text = `A right-angled triangle has hypotenuse ${c.H} cm.\nThe angle between the hypotenuse and the adjacent side is ${c.th}°.\nWork out the length of the side ADJACENT to the ${c.th}° angle.`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`Adjacent and hypotenuse → CAH: cos ${c.th}° = A ÷ ${c.H}.`, `cos 60° = 1/2, so A = ${c.H} × 1/2 = ${ans} cm`]];
    hint = 'SOH CAH TOA — cos 60° = 1/2.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { A: 7 }, { A: 12 }, { A: 5 }, { A: 9 },
      { A: 15 }, { A: 4 }, { A: 11 }, { A: 8 },
    ];
    const c = cases[p % 8];
    ans = c.A;
    text = `A right-angled triangle has an angle of 45°.\nThe side ADJACENT to the angle is ${c.A} cm.\nWork out the length of the side OPPOSITE the 45° angle.`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`Opposite and adjacent → TOA: tan 45° = O ÷ ${c.A}.`, `tan 45° = 1, so O = ${c.A} × 1 = ${ans} cm`]];
    hint = 'tan 45° = 1 — the opposite and adjacent sides are EQUAL.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { ratio: 'sin θ = 1/2', a: 30 },
      { ratio: 'cos θ = 1/2', a: 60 },
      { ratio: 'tan θ = 1', a: 45 },
      { ratio: 'sin θ = 0.5', a: 30 },
      { ratio: 'cos θ = 0.5', a: 60 },
      { ratio: 'tan θ = 1', a: 45 },
      { ratio: 'sin θ = 1/2', a: 30 },
      { ratio: 'cos θ = 1/2', a: 60 },
    ];
    const c = cases[p % 8];
    ans = c.a;
    text = `θ is an angle between 0° and 90° and  ${c.ratio}.\nWork out the value of θ.`;
    input = { type: 'number', placeholder: '°' };
    sol = [[`Use the inverse button on your calculator (sin⁻¹, cos⁻¹ or tan⁻¹).`, `θ = ${ans}°`]];
    hint = 'sin 30° = 1/2, cos 60° = 1/2, tan 45° = 1 — know these!';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans}°`, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { L: 10, th: 30 }, { L: 8, th: 30 }, { L: 12, th: 30 }, { L: 6, th: 30 },
      { L: 16, th: 30 }, { L: 20, th: 30 }, { L: 14, th: 30 }, { L: 18, th: 30 },
    ];
    const c = cases[p % 8];
    ans = c.L * 0.5;
    text = `A ladder is ${c.L} m long.\nIt leans against a wall making an angle of ${c.th}° with the GROUND.\nHow high up the wall does the ladder reach?`;
    input = { type: 'number', placeholder: 'm' };
    sol = [[`The ladder is the hypotenuse, the height is the opposite side.`, `O = H × sin ${c.th}° = ${c.L} × 1/2 = ${ans} m`]];
    hint = 'Sketch it! Ladder = hypotenuse, height = opposite, so use sine.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `${ans} m`, solution: sol, hint };
  }

  {
    const cases = [
      { A: 8, th: 60 }, { A: 6, th: 60 }, { A: 10, th: 60 }, { A: 4, th: 60 },
      { A: 12, th: 60 }, { A: 14, th: 60 }, { A: 16, th: 60 }, { A: 18, th: 60 },
    ];
    const c = cases[p % 8];
    ans = c.A * 2;
    text = `A right-angled triangle has an angle of ${c.th}°.\nThe side ADJACENT to the angle is ${c.A} cm.\nWork out the length of the hypotenuse.`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`Adjacent and hypotenuse → CAH: cos ${c.th}° = ${c.A} ÷ H.`, `cos 60° = 1/2, so H = ${c.A} ÷ 1/2 = ${ans} cm`]];
    hint = 'cos 60° = 1/2, so the hypotenuse is double the adjacent side.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }
}