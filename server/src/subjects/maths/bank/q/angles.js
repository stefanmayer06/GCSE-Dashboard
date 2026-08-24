import { makeRand, ri, pick, shuffle } from '../../util.js';

export default function gen(v) {
  const r = makeRand('angles', v);
  const t = v % 9;
  const p = Math.floor(v / 9);
  if (p >= 8) return null;
  let ans, text, input, sol, hint;

  if (t === 0) {
    const a = ri(r, 30, 160);
    ans = 180 - a;
    text = `Two angles sit on a straight line.\nOne of them is ${a}°.\nWork out the other angle.`;
    input = { type: 'number', placeholder: '°' };
    sol = [[`Angles on a straight line add up to 180°.`, `180 − ${a} = ${ans}°`]];
    hint = 'Angles on a straight line always add up to 180°.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans}°`, solution: sol, hint };
  }

  if (t === 1) {
    const a = ri(r, 40, 150);
    const b = ri(r, 40, 150);
    ans = 360 - a - b;
    text = `Three angles meet at a point.\nTwo of them are ${a}° and ${b}°.\nWork out the third angle.`;
    input = { type: 'number', placeholder: '°' };
    sol = [[`Angles around a point add up to 360°.`, `360 − ${a} − ${b} = ${ans}°`]];
    hint = 'Angles around a point always add up to 360°.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans}°`, solution: sol, hint };
  }

  if (t === 2) {
    const a = ri(r, 25, 80);
    const b = ri(r, 25, 80);
    ans = 180 - a - b;
    text = `Two angles in a triangle are ${a}° and ${b}°.\nWork out the third angle.`;
    input = { type: 'number', placeholder: '°' };
    sol = [[`Angles in a triangle add up to 180°.`, `180 − ${a} − ${b} = ${ans}°`]];
    hint = 'Angles in a triangle always add up to 180°.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans}°`, solution: sol, hint };
  }

  if (t === 3) {
    const a = ri(r, 50, 110);
    const b = ri(r, 50, 110);
    const c = ri(r, Math.max(40, 181 - a - b), Math.min(100, 319 - a - b));
    ans = 360 - a - b - c;
    text = `Three angles in a quadrilateral are ${a}°, ${b}° and ${c}°.\nWork out the fourth angle.`;
    input = { type: 'number', placeholder: '°' };
    sol = [[`Angles in a quadrilateral add up to 360°.`, `360 − ${a} − ${b} − ${c} = ${ans}°`]];
    hint = 'Angles in any quadrilateral add up to 360°.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans}°`, solution: sol, hint };
  }

  if (t === 4) {
    const given = ri(r, 35, 140);
    ans = given;
    text = `Two parallel lines are crossed by a transversal.\nOne angle is ${given}° and another angle is alternate to it.\nWhat is the size of the alternate angle?`;
    input = { type: 'number', placeholder: '°' };
    sol = [[`Alternate angles between parallel lines are equal.`, `The alternate angle is also ${ans}°.`]];
    hint = 'Alternate angles between parallel lines are equal.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans}°`, solution: sol, hint };
  }

  if (t === 5) {
    const given = ri(r, 35, 140);
    ans = 180 - given;
    text = `Two parallel lines are crossed by a transversal.\nOne angle is ${given}° and another angle is co-interior with it.\nWork out the size of the co-interior angle.`;
    input = { type: 'number', placeholder: '°' };
    sol = [[`Co-interior angles between parallel lines add up to 180°.`, `180 − ${given} = ${ans}°`]];
    hint = 'Co-interior angles between parallel lines add to 180°.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans}°`, solution: sol, hint };
  }

  if (t === 6) {
    const polys = [
      { name: 'pentagon', n: 5, a: 108 }, { name: 'hexagon', n: 6, a: 120 },
      { name: 'octagon', n: 8, a: 135 }, { name: 'heptagon', n: 7, a: 128.57142857142858 },
      { name: 'nonagon', n: 9, a: 140 }, { name: 'decagon', n: 10, a: 144 },
      { name: 'dodecagon', n: 12, a: 150 }, { name: 'square', n: 4, a: 90 },
    ];
    const c = polys[p % 8];
    ans = Math.round(c.a * 100) / 100;
    text = `Work out the size of one interior angle of a regular ${c.name}.${Number.isInteger(c.a) ? '' : '\nGive your answer to 2 decimal places.'}`;
    input = { type: 'number', tolerance: 0.011, placeholder: '°' };
    sol = [[`Sum of interior angles = 180 × (${c.n} − 2) = ${180 * (c.n - 2)}°.`, `Each interior angle = ${180 * (c.n - 2)} ÷ ${c.n} = ${ans}° (rounded).`]];
    hint = 'Regular = all angles equal. Sum first, then divide by the number of sides.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${Math.round(c.a * 100) / 100}°`, solution: sol, hint };
  }

  if (t === 7) {
    const n = [5, 6, 7, 8, 9, 10, 12, 20][p % 8];
    ans = 180 * (n - 2);
    text = `What is the sum of the interior angles of a polygon with ${n} sides?`;
    input = { type: 'number', placeholder: '°' };
    sol = [[`Sum = 180 × (n − 2) = 180 × ${n - 2} = ${ans}°`]];
    hint = 'Sum of interior angles = 180 × (number of sides − 2).';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans}°`, solution: sol, hint };
  }

  {
    const apex = [40, 60, 80, 100, 50, 70, 90, 30][p % 8];
    ans = (180 - apex) / 2;
    text = `An isosceles triangle has an apex angle of ${apex}° (the angle between the two EQUAL sides).\nWork out the size of one of the base angles.`;
    input = { type: 'number', placeholder: '°' };
    sol = [[`Angles in a triangle add to 180°, so the base angles add to ${180 - apex}°.`, `Isosceles → base angles are EQUAL: ${180 - apex} ÷ 2 = ${ans}°`]];
    hint = 'In an isosceles triangle the two base angles are equal.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans}°`, solution: sol, hint };
  }
}
