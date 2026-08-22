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

const fmtPt = ([x, y]) => `(${x}, ${y})`;

export default function gen(v) {
  const r = makeRand('transformations', v);
  const t = v % 8;
  const p = Math.floor(v / 8);
  if (p >= 8) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const x = ri(r, 1, 5);
    const y = ri(r, 1, 5);
    const vx = [3, 4, 5, 2][p % 4];
    const vy = [-2, 1, -3, 4][p % 4];
    const out = [x + vx, y + vy];
    text = `Point A is at (${x}, ${y}).\nIt is translated by the vector (${vx}, ${vy}) — ${vx} right and ${vy} ${vy < 0 ? 'down' : 'up'}.\nWhat are the new coordinates of A?`;
    m = mcq(r, fmtPt(out), [fmtPt([x - vx, y - vy]), fmtPt([x + vx, y - vy]), fmtPt([x + vy, y + vx])]);
    input = m.input;
    sol = [[`Translation moves every point by the same amount: add ${vx} to x and ${vy} to y.`, `(${x} + ${vx}, ${y} + ${vy}) = ${fmtPt(out)}`]];
    hint = 'Right/up = add, left/down = subtract.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: fmtPt(out), solution: sol, hint };
  }

  if (t === 1) {
    const x = ri(r, 1, 6);
    const y = ri(r, 1, 6);
    const out = [x, -y];
    text = `Point P is at (${x}, ${y}).\nIt is reflected in the x-axis.\nWhat are the new coordinates of P?`;
    m = mcq(r, fmtPt(out), [fmtPt([-x, y]), fmtPt([-x, -y]), fmtPt([y, x])]);
    input = m.input;
    sol = [[`Reflection in the x-axis flips the point over the horizontal axis.`, `The x stays the same, the y changes sign: ${fmtPt(out)}`]];
    hint = 'Reflected in the x-axis: (x, y) → (x, −y).';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: fmtPt(out), solution: sol, hint };
  }

  if (t === 2) {
    const x = ri(r, 1, 6);
    const y = ri(r, 1, 6);
    const out = [-x, y];
    text = `Point Q is at (${x}, ${y}).\nIt is reflected in the y-axis.\nWhat are the new coordinates of Q?`;
    m = mcq(r, fmtPt(out), [fmtPt([x, -y]), fmtPt([-x, -y]), fmtPt([y, x])]);
    input = m.input;
    sol = [[`Reflection in the y-axis flips the point over the vertical axis.`, `The y stays the same, the x changes sign: ${fmtPt(out)}`]];
    hint = 'Reflected in the y-axis: (x, y) → (−x, y).';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: fmtPt(out), solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { pt: [2, 1], a: [1, -2] }, { pt: [3, 2], a: [2, -3] }, { pt: [4, 1], a: [1, -4] },
      { pt: [1, 5], a: [5, -1] }, { pt: [2, 4], a: [4, -2] }, { pt: [5, 2], a: [2, -5] },
      { pt: [3, 4], a: [4, -3] }, { pt: [1, 2], a: [2, -1] },
    ];
    const c = cases[p % 8];
    text = `Point R is at ${fmtPt(c.pt)}.\nIt is rotated 90° CLOCKWISE about the origin.\nWhat are the new coordinates of R?`;
    m = mcq(r, fmtPt(c.a), [fmtPt([-c.pt[1], c.pt[0]]), fmtPt([-c.pt[0], -c.pt[1]]), fmtPt([c.pt[1], c.pt[0]])]);
    input = m.input;
    sol = [[`90° clockwise about the origin: (x, y) → (y, −x).`, `${fmtPt(c.pt)} → ${fmtPt(c.a)}`]];
    hint = '90° clockwise: swap the numbers and make the new y negative.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: fmtPt(c.a), solution: sol, hint };
  }

  if (t === 4) {
    const x = ri(r, 1, 5);
    const y = ri(r, 1, 5);
    const out = [-x, -y];
    text = `Point S is at (${x}, ${y}).\nIt is rotated 180° about the origin.\nWhat are the new coordinates of S?`;
    m = mcq(r, fmtPt(out), [fmtPt([-x, y]), fmtPt([x, -y]), fmtPt([y, x])]);
    input = m.input;
    sol = [[`A half turn sends every point to the opposite quadrant.`, `(x, y) → (−x, −y) → ${fmtPt(out)}`]];
    hint = 'Rotation by 180° = change BOTH signs.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: fmtPt(out), solution: sol, hint };
  }

  if (t === 5) {
    const k = [2, 3, 4, 5][p % 4];
    const x = ri(r, 1, 4);
    const y = ri(r, 1, 4);
    const out = [k * x, k * y];
    text = `Point T is at (${x}, ${y}).\nIt is enlarged by scale factor ${k} with centre of enlargement at the origin.\nWhat are the new coordinates of T?`;
    m = mcq(r, fmtPt(out), [fmtPt([x + k, y + k]), fmtPt([k * x, y]), fmtPt([x, k * y])]);
    input = m.input;
    sol = [[`Enlargement about the origin: multiply BOTH coordinates by the scale factor.`, `(${x} × ${k}, ${y} × ${k}) = ${fmtPt(out)}`]];
    hint = 'Multiply both x and y by the scale factor.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: fmtPt(out), solution: sol, hint };
  }

  if (t === 6) {
    const cases = [
      { shape: 'square', a: 4, w: [2, 1, 3] },
      { shape: 'equilateral triangle', a: 3, w: [1, 2, 4] },
      { shape: 'rectangle (not a square)', a: 2, w: [4, 1, 3] },
      { shape: 'regular hexagon', a: 6, w: [3, 2, 12] },
      { shape: 'isosceles triangle', a: 1, w: [2, 3, 4] },
      { shape: 'circle', a: 4, w: [1, 2, 3] },
      { shape: 'regular pentagon', a: 5, w: [1, 10, 2] },
      { shape: 'parallelogram (not a rectangle or rhombus)', a: 0, w: [2, 1, 4] },
    ];
    const c = cases[p % 8];
    text = `How many lines of symmetry does a ${c.shape} have?`;
    m = mcq(r, String(c.a), c.w.map(String).filter((x) => x !== String(c.a)));
    input = m.input;
    sol = [[`Fold the shape in half — each fold that matches perfectly is a line of symmetry.`, `A ${c.shape} has ${c.a} line(s) of symmetry.`]];
    hint = 'A line of symmetry is a mirror line — both halves must match exactly.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: String(c.a), solution: sol, hint };
  }

  {
    const x = ri(r, 1, 4);
    const y = ri(r, 1, 4);
    const vx = ri(r, 2, 5);
    const vy = ri(r, 2, 5);
    const afterT = [x + vx, y + vy];
    const out = [-afterT[0], afterT[1]];
    text = `Point A is at (${x}, ${y}).\nIt is translated by the vector (${vx}, ${vy}) and then reflected in the y-axis.\nWork out the final coordinates of A.`;
    m = mcq(r, fmtPt(out), [fmtPt([afterT[0], -afterT[1]]), fmtPt([x + vx, y + vy]), fmtPt([-x + vx, y + vy])]);
    input = m.input;
    sol = [[`Step 1 (translation): (${x}, ${y}) → (${afterT[0]}, ${afterT[1]}).`, `Step 2 (reflection in y-axis): x changes sign → ${fmtPt(out)}`]];
    hint = 'Do the transformations IN ORDER — translate first, then reflect.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: m.answer, answerText: fmtPt(out), solution: sol, hint };
  }
}