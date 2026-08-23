import { makeRand, ri, pick, shuffle, gcd } from '../../util.js';

export default function gen(v) {
  const r = makeRand('equations', v);
  const t = v % 8;
  const p = Math.floor(v / 8);
  if (p >= 8) return null;
  let ans, text, input, sol, hint;

  if (t === 0) {
    const a = ri(r, 2, 30);
    const b = a + ri(r, 1, 40);
    ans = b - a;
    text = `Solve  x + ${a} = ${b}`;
    input = { type: 'number' };
    sol = [[`Undo +${a} by subtracting ${a} from both sides:`, `x = ${b} − ${a} = ${ans}`]];
    hint = 'Do the opposite operation (+ becomes −) to both sides.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `x = ${ans}`, solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { a: 4, b: 20 }, { a: 3, b: 27 }, { a: 5, b: 45 }, { a: 6, b: 54 },
      { a: 7, b: 42 }, { a: 8, b: 72 }, { a: 9, b: 81 }, { a: 2, b: 38 },
    ];
    const c = cases[p % 8];
    ans = c.b / c.a;
    text = `Solve  ${c.a}x = ${c.b}`;
    input = { type: 'number' };
    sol = [[`Undo ×${c.a} by dividing both sides by ${c.a}:`, `x = ${c.b} ÷ ${c.a} = ${ans}`]];
    hint = 'To undo multiplication, divide both sides by the same number.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `x = ${ans}`, solution: sol, hint };
  }

  if (t === 2) {
    const a = [2, 3, 4, 5, 6, 7, 8, 9][p % 8];
    const x = ri(r, 2, 12);
    const b = ri(r, 1, 15);
    const c = a * x + b;
    ans = x;
    text = `Solve  ${a}x + ${b} = ${c}`;
    input = { type: 'number' };
    sol = [[`Subtract ${b} from both sides: ${a}x = ${c - b}.`, `Divide both sides by ${a}: x = ${ans}.`]];
    hint = 'Get the x term by itself first (subtract the number), then divide by the coefficient.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `x = ${ans}`, solution: sol, hint };
  }

  if (t === 3) {
    const a = [2, 3, 4, 5, 6, 7, 8, 9][p % 8];
    const x = ri(r, 2, 10);
    const b = ri(r, 1, 12);
    const c = x + b;
    ans = x;
    text = `Solve  x/${a} + ${b} = ${c}`;
    input = { type: 'number' };
    sol = [[`Subtract ${b} from both sides: x/${a} = ${x}.`, `Multiply both sides by ${a}: x = ${ans}.`]];
    hint = 'Undo in reverse order: subtract first, then multiply by the denominator.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `x = ${ans}`, solution: sol, hint };
  }

  if (t === 4) {
    const a = [2, 3, 4, 5, 6, 7, 8, 9][p % 8];
    const x = ri(r, 2, 10);
    const b = ri(r, 1, 9);
    const c = a * (x + b);
    ans = x;
    text = `Solve  ${a}(x + ${b}) = ${c}`;
    input = { type: 'number' };
    sol = [[`Expand the brackets: ${a}x + ${a * b} = ${c}.`, `Subtract ${a * b}: ${a}x = ${a * x}.`, `Divide by ${a}: x = ${ans}.`]];
    hint = 'Expand the brackets first, then solve as normal.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `x = ${ans}`, solution: sol, hint };
  }

  if (t === 5) {
    const x = ri(r, 2, 9);
    const a = [3, 4, 5, 6, 7, 8, 9, 10][p % 8];
    const b = [1, 2, 3, 4, 2, 3, 1, 2][p % 8];
    const cx = a - 1;
    ans = x;
    const total = cx * x;
    text = `Solve  ${a}x + ${b} = ${cx}x + ${total}`;
    input = { type: 'number' };
    sol = [[`Get the x terms on one side: subtract ${cx}x from both sides → x + ${b} = ${total}.`, `x = ${total} − ${b} = ${ans}.`]];
    hint = 'Collect all the x terms on one side first.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `x = ${ans}`, solution: sol, hint };
  }

  if (t === 6) {
    const x = ri(r, 2, 12);
    const a = [1, 2, 3, 4, 5, 6, 2, 3][p % 8];
    const d = x * 2;
    text = `I think of a number.\nI multiply it by ${a} and add ${d}.\nMy answer is ${a * x + d}.\nWhat number did I think of?`;
    ans = x;
    input = { type: 'number' };
    sol = [[`Write it as an equation: ${a}x + ${d} = ${a * x + d}.`, `Subtract ${d}: ${a}x = ${a * x}.`, `Divide by ${a}: x = ${x}.`]];
    hint = 'Write the sentence as an equation and solve it.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  {
    const cases = [
      { eq: '2(x + 3) = 3x − 2', a: 8, s: ['Expand: 2x + 6 = 3x − 2.', 'Add 2: 2x + 8 = 3x.', 'Subtract 2x: 8 = x.'] },
      { eq: '4(x + 1) = 3x + 9', a: 5, s: ['Expand: 4x + 4 = 3x + 9.', 'Subtract 3x: x + 4 = 9.', 'x = 5.'] },
      { eq: '3(x − 2) = 2x + 1', a: 7, s: ['Expand: 3x − 6 = 2x + 1.', 'Subtract 2x: x − 6 = 1.', 'x = 7.'] },
      { eq: '5(x + 2) = 4x + 13', a: 3, s: ['Expand: 5x + 10 = 4x + 13.', 'Subtract 4x: x + 10 = 13.', 'x = 3.'] },
      { eq: '2(2x + 5) = 5x + 4', a: 6, s: ['Expand: 4x + 10 = 5x + 4.', 'Subtract 4x: 10 = x + 4.', 'x = 6.'] },
      { eq: '3(x + 4) = 2x + 17', a: 5, s: ['Expand: 3x + 12 = 2x + 17.', 'Subtract 2x: x + 12 = 17.', 'x = 5.'] },
      { eq: '6(x − 1) = 5x + 4', a: 10, s: ['Expand: 6x − 6 = 5x + 4.', 'Subtract 5x: x − 6 = 4.', 'x = 10.'] },
      { eq: '4(x + 7) = 3x + 32', a: 4, s: ['Expand: 4x + 28 = 3x + 32.', 'Subtract 3x: x + 28 = 32.', 'x = 4.'] },
    ];
    const c = cases[p % 8];
    ans = c.a;
    text = `Solve  ${c.eq}`;
    input = { type: 'number' };
    sol = c.s;
    hint = 'Expand first, then get x-terms on one side and numbers on the other.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `x = ${ans}`, solution: sol, hint };
  }
}