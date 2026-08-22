import { makeRand, shuffle } from '../../util.js';

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
  const r = makeRand('expressions', v);
  const t = v % 9;
  const p = Math.floor(v / 9);
  if (p >= 8) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const cases = [
      { q: '5a + 3b − 2a + b', a: '3a + 4b', w: ['4a + 4b', '3a + 3b', '8a + 4b'] },
      { q: '7x − 4 + 2x − 6', a: '9x − 10', w: ['9x + 10', '5x + 10', '9x − 2'] },
      { q: '6p + 2q − p + 5q', a: '5p + 7q', w: ['7p + 7q', '5p + 3q', '12p + 7q'] },
      { q: '4m − 3n + 2m − 5n', a: '6m − 8n', w: ['6m − 2n', '6m + 8n', '2m − 8n'] },
      { q: '9y − 2y + 7 − 3', a: '7y + 4', w: ['7y + 10', '11y + 4', '7y − 4'] },
      { q: '3z + 5 − z + 9 + 2z', a: '4z + 14', w: ['4z + 4', '6z + 14', '3z + 14'] },
      { q: '8k − 6 − 3k + 10', a: '5k + 4', w: ['5k − 16', '11k + 4', '5k − 4'] },
      { q: '2h + 3h + 7h − 5h', a: '7h', w: ['17h', '7h²', '−3h'] },
    ];
    const c = cases[p % 8];
    text = `Simplify  ${c.q}`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Collect the like terms together (same letters).`, `${c.q} = ${c.a}`]];
    hint = 'Only add/subtract terms with exactly the same letters.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { q: '3(x + 2)', a: '3x + 6', w: ['3x + 2', '6x', '3x + 5'] },
      { q: '4(2x + 5)', a: '8x + 20', w: ['8x + 5', '6x + 9', '8x + 9'] },
      { q: '5(x − 3)', a: '5x − 15', w: ['5x − 3', '5x + 15', 'x − 15'] },
      { q: '2(7x + 4)', a: '14x + 8', w: ['14x + 4', '9x + 6', '14x + 6'] },
      { q: '6(3 + 2x)', a: '18 + 12x', w: ['18 + 2x', '9 + 8x', '18 + 8x'] },
      { q: '7(4x − 1)', a: '28x − 7', w: ['28x − 1', '11x − 7', '28x + 7'] },
      { q: '5(3x + 2)', a: '15x + 10', w: ['15x + 2', '8x + 7', '15x + 7'] },
      { q: '9(2x − 4)', a: '18x − 36', w: ['18x − 4', '11x − 36', '18x + 36'] },
    ];
    const c = cases[p % 8];
    text = `Expand  ${c.q}`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Multiply the number outside by EVERYTHING inside the bracket.`, `${c.q} = ${c.a}`]];
    hint = 'The outside number multiplies every term inside the brackets.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { q: '−2(x − 3)', a: '−2x + 6', w: ['−2x − 6', '2x + 6', '−2x − 3'] },
      { q: '−3(x + 4)', a: '−3x − 12', w: ['−3x + 12', '3x − 12', '−3x + 4'] },
      { q: '−5(2x − 1)', a: '−10x + 5', w: ['−10x − 5', '10x + 5', '−10x − 1'] },
      { q: '−4(x − 7)', a: '−4x + 28', w: ['−4x − 28', '4x + 28', '−4x + 7'] },
      { q: '−2(3x + 5)', a: '−6x − 10', w: ['−6x + 10', '6x − 10', '−6x + 5'] },
      { q: '−(x − 6)', a: '−x + 6', w: ['−x − 6', 'x + 6', 'x − 6'] },
      { q: '−6(2x + 3)', a: '−12x − 18', w: ['−12x + 18', '12x − 18', '−12x + 3'] },
      { q: '−7(3x − 1)', a: '−21x + 7', w: ['−21x − 7', '21x + 7', '−21x − 1'] },
    ];
    const c = cases[p % 8];
    text = `Expand  ${c.q}`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Multiply the negative number by each term — two minuses make a plus.`, `${c.q} = ${c.a}`]];
    hint = 'Negative × negative = positive, so two minuses make a plus.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { q: '3x + 6', a: '3(x + 2)', w: ['3(x + 6)', '9(x + 2)', '3x(x + 2)'] },
      { q: '8x + 12', a: '4(2x + 3)', w: ['4(2x + 12)', '8(x + 12)', '2(4x + 12)'] },
      { q: '10x − 15', a: '5(2x − 3)', w: ['5(5x − 3)', '10(x − 15)', '5(2x − 15)'] },
      { q: '6x + 9', a: '3(2x + 3)', w: ['3(2x + 9)', '6(x + 9)', '3(6x + 3)'] },
      { q: '14x − 21', a: '7(2x − 3)', w: ['7(7x − 3)', '14(x − 21)', '7(2x − 21)'] },
      { q: '4x + 10', a: '2(2x + 5)', w: ['2(2x + 10)', '4(x + 10)', '2(4x + 5)'] },
      { q: '12x − 8', a: '4(3x − 2)', w: ['4(3x − 8)', '12(x − 8)', '4(3x − 4)'] },
      { q: '9x + 15', a: '3(3x + 5)', w: ['3(3x + 15)', '9(x + 15)', '3(9x + 5)'] },
    ];
    const c = cases[p % 8];
    text = `Factorise fully  ${c.q}`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Find the biggest number that divides both terms.`, `${c.q} = ${c.a}`]];
    hint = 'Factorising is expanding backwards — take out the biggest common factor.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { x: 5, y: 3, m: 3, n: 2 },
      { x: 4, y: 7, m: 5, n: 1 },
      { x: 6, y: 2, m: 2, n: 4 },
      { x: 3, y: 8, m: 4, n: 2 },
      { x: 7, y: 5, m: 3, n: 3 },
      { x: 2, y: 9, m: 6, n: 2 },
      { x: 8, y: 3, m: 2, n: 5 },
      { x: 4, y: 6, m: 5, n: 3 },
    ];
    const c = cases[p % 8];
    ans = c.m * c.x + c.n * c.y;
    text = `Find the value of  ${c.m}x + ${c.n}y\nwhen x = ${c.x} and y = ${c.y}`;
    input = { type: 'number' };
    sol = [[`Replace x with ${c.x} and y with ${c.y}:`, `${c.m} × ${c.x} + ${c.n} × ${c.y} = ${c.m * c.x} + ${c.n * c.y} = ${ans}`]];
    hint = 'Swap the letters for the numbers, then use BIDMAS.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { q: 'x² × x³', a: 'x⁵', w: ['x⁶', 'x⁸', 'x²'] },
      { q: 'x⁴ × x²', a: 'x⁶', w: ['x⁸', 'x²', 'x⁵'] },
      { q: 'y³ × y⁵', a: 'y⁸', w: ['y¹⁵', 'y²', 'y⁷'] },
      { q: 'x⁷ × x²', a: 'x⁹', w: ['x¹⁴', 'x⁵', 'x⁸'] },
      { q: 'x² × x⁶', a: 'x⁸', w: ['x¹²', 'x⁴', 'x⁷'] },
      { q: 'm⁴ × m³', a: 'm⁷', w: ['m¹²', 'm¹', 'm⁶'] },
      { q: 'a⁵ × a⁶', a: 'a¹¹', w: ['a³⁰', 'a²', 'a¹⁰'] },
      { q: 'x³ × x⁴', a: 'x⁷', w: ['x¹²', 'x¹', 'x⁶'] },
    ];
    const c = cases[p % 8];
    text = `Simplify  ${c.q}`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Multiplying powers of the same letter: ADD the powers.`, `${c.q} = ${c.a}`]];
    hint = 'Same base, multiply → add the powers.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 6) {
    const cases = [
      { q: 'x⁵ ÷ x²', a: 'x³', w: ['x⁷', 'x²', 'x¹⁰'] },
      { q: 'x⁸ ÷ x³', a: 'x⁵', w: ['x¹¹', 'x³', 'x²⁴'] },
      { q: 'y⁷ ÷ y²', a: 'y⁵', w: ['y⁹', 'y²', 'y¹⁴'] },
      { q: 'x⁹ ÷ x⁴', a: 'x⁵', w: ['x¹³', 'x⁴', 'x³⁶'] },
      { q: 'x⁶ ÷ x', a: 'x⁵', w: ['x⁶', 'x⁷', 'x¹'] },
      { q: 'm⁸ ÷ m⁵', a: 'm³', w: ['m¹³', 'm⁵', 'm⁴⁰'] },
      { q: 'a¹⁰ ÷ a⁷', a: 'a³', w: ['a¹⁷', 'a⁷', 'a⁷⁰'] },
      { q: 'x⁷ ÷ x⁶', a: 'x', w: ['x¹³', 'x⁴²', 'x⁶'] },
    ];
    const c = cases[p % 8];
    text = `Simplify  ${c.q}`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Dividing powers of the same letter: SUBTRACT the powers.`, `${c.q} = ${c.a}`]];
    hint = 'Same base, divide → subtract the powers.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 7) {
    const cases = [
      { q: '(x + 2)(x + 3)', a: 'x² + 5x + 6', w: ['x² + 6', 'x² + 5x + 5', '2x + 5x + 6'] },
      { q: '(x + 4)(x + 1)', a: 'x² + 5x + 4', w: ['x² + 4', 'x² + 5x + 5', '2x + 5x + 4'] },
      { q: '(x + 3)(x + 5)', a: 'x² + 8x + 15', w: ['x² + 15', 'x² + 8x + 8', '2x + 8x + 15'] },
      { q: '(x + 2)(x + 7)', a: 'x² + 9x + 14', w: ['x² + 14', 'x² + 9x + 9', '2x + 9x + 14'] },
      { q: '(x + 6)(x + 1)', a: 'x² + 7x + 6', w: ['x² + 6', 'x² + 7x + 7', '2x + 7x + 6'] },
      { q: '(x + 4)(x + 5)', a: 'x² + 9x + 20', w: ['x² + 20', 'x² + 9x + 9', '2x + 9x + 20'] },
      { q: '(x + 3)(x + 9)', a: 'x² + 12x + 27', w: ['x² + 27', 'x² + 12x + 12', '2x + 12x + 27'] },
      { q: '(x + 8)(x + 2)', a: 'x² + 10x + 16', w: ['x² + 16', 'x² + 10x + 10', '2x + 10x + 16'] },
    ];
    const c = cases[p % 8];
    text = `Expand and simplify  ${c.q}`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`FOIL: First, Outside, Inside, Last.`, `First: x². Outside + Inside give the x-term. Last: the numbers multiply.`, `${c.q} = ${c.a}`]];
    hint = 'Use FOIL: First, Outside, Inside, Last — then collect the x terms.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  {
    const cases = [
      { l: '3x', wd: '2x + 1', l2: '6x', w2: '4x + 2', a: '10x + 2', w: ['5x + 1', '10x + 1', '6x + 1'] },
      { l: '5x', wd: 'x + 4', l2: '10x', w2: '2x + 8', a: '12x + 8', w: ['6x + 8', '12x + 4', '10x + 4'] },
      { l: '4x', wd: '2x − 3', l2: '8x', w2: '4x − 6', a: '12x − 6', w: ['6x − 6', '12x − 3', '8x − 3'] },
      { l: 'x', wd: '3x + 7', l2: '2x', w2: '6x + 14', a: '8x + 14', w: ['4x + 14', '8x + 7', '6x + 7'] },
      { l: '6x', wd: 'x − 2', l2: '12x', w2: '2x − 4', a: '14x − 4', w: ['7x − 4', '14x − 2', '12x − 2'] },
      { l: '2x', wd: '5x + 3', l2: '4x', w2: '10x + 6', a: '14x + 6', w: ['7x + 6', '14x + 3', '10x + 3'] },
      { l: '3x', wd: '4x − 5', l2: '6x', w2: '8x − 10', a: '14x − 10', w: ['7x − 10', '14x − 5', '12x − 5'] },
      { l: '7x', wd: 'x + 9', l2: '14x', w2: '2x + 18', a: '16x + 18', w: ['8x + 18', '16x + 9', '14x + 9'] },
    ];
    const c = cases[p % 8];
    text = `A rectangle has sides ${c.l} and ${c.wd}.\nWrite an expression for its perimeter. Give your answer in its simplest form.`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Perimeter = 2 × length + 2 × width.`, `= 2(${c.l}) + 2(${c.wd}) = ${c.l2} + ${c.w2}`, `= ${c.a}`]];
    hint = 'Perimeter = 2 × length + 2 × width, then collect like terms.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }
}