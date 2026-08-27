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
  const r = makeRand('formulae', v);
  const t = v % 7;
  const p = Math.floor(v / 7);
  if (p >= 9) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const speed = ri(r, 30, 90);
    const time = ri(r, 2, 5);
    ans = speed * time;
    text = `Use the formula  speed = distance ÷ time\nA train travels at ${speed} km/h for ${time} hours.\nHow far does it travel?`;
    input = { type: 'number', placeholder: 'km' };
    sol = [[`Rearrange: distance = speed × time.`, `distance = ${speed} × ${time} = ${ans} km`]];
    hint = 'Rearrange to distance = speed × time.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} km`, solution: sol, hint };
  }

  if (t === 1) {
    const u = ri(r, 2, 12);
    const a = ri(r, 1, 5);
    const t2 = [2, 3, 4, 5][p % 4];
    ans = u + a * t2;
    text = `Use the formula  v = u + at\nto work out v when u = ${u}, a = ${a} and t = ${t2}`;
    input = { type: 'number' };
    sol = [[`v = ${u} + ${a} × ${t2}`, `v = ${u} + ${a * t2} = ${ans}`]];
    hint = 'Multiply a by t first (BIDMAS), then add u.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 2) {
    const F = [41, 50, 59, 68, 77, 86, 95, 104][p % 8];
    ans = ((F - 32) * 5) / 9;
    text = `The formula to convert Fahrenheit to Celsius is\nC = 5/9 × (F − 32)\nConvert ${F}°F to °C.`;
    input = { type: 'number', placeholder: '°C' };
    sol = [[`C = 5/9 × (${F} − 32) = 5/9 × ${F - 32} = ${ans}°C`]];
    hint = 'Subtract 32 first (brackets!), then multiply by 5 and divide by 9.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans}°C`, solution: sol, hint };
  }

  if (t === 3) {
    const C = [10, 15, 20, 25, 30, 35, 40, 45][p % 8];
    ans = (9 / 5) * C + 32;
    text = `The formula to convert Celsius to Fahrenheit is\nF = 9/5 × C + 32\nConvert ${C}°C to °F.`;
    input = { type: 'number', placeholder: '°F' };
    sol = [[`F = 9/5 × ${C} + 32 = ${(9 / 5) * C} + 32 = ${ans}°F`]];
    hint = 'Multiply by 9, divide by 5, then add 32.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans}°F`, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { a: 5, b: 9, h: 4 }, { a: 3, b: 7, h: 6 }, { a: 4, b: 10, h: 5 },
      { a: 6, b: 12, h: 3 }, { a: 2, b: 8, h: 7 }, { a: 5, b: 11, h: 4 },
      { a: 4, b: 9, h: 8 }, { a: 7, b: 13, h: 5 }, { a: 3, b: 6, h: 4 },
    ];
    const c = cases[p % 9];
    ans = ((c.a + c.b) / 2) * c.h;
    text = `The area of a trapezium is  A = 1/2 × (a + b) × h\nWork out A when a = ${c.a}, b = ${c.b} and h = ${c.h}`;
    input = { type: 'number' };
    sol = [[`Add a and b first (inside the brackets): ${c.a} + ${c.b} = ${c.a + c.b}.`, `A = 1/2 × ${c.a + c.b} × ${c.h} = ${ans}`]];
    hint = 'Brackets first: add the two bases, then half, then multiply by height.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 5) {
    const cases = [
      { eq: 'y = x + 5', want: 'x', a: 'x = y − 5', w: ['x = y + 5', 'x = 5 − y', 'x = 5y'] },
      { eq: 'p = 3q', want: 'q', a: 'q = p/3', w: ['q = 3p', 'q = p − 3', 'q = p + 3'] },
      { eq: 's = t − 7', want: 't', a: 't = s + 7', w: ['t = s − 7', 't = 7 − s', 't = 7s'] },
      { eq: 'm = 4n + 2', want: 'n', a: 'n = (m − 2)/4', w: ['n = m/4 + 2', 'n = (m + 2)/4', 'n = m − 2'] },
      { eq: 'y = x ÷ 2', want: 'x', a: 'x = 2y', w: ['x = y ÷ 2', 'x = y + 2', 'x = y − 2'] },
      { eq: 'v = u + 10', want: 'u', a: 'u = v − 10', w: ['u = v + 10', 'u = 10 − v', 'u = 10v'] },
    ];
    const c = cases[p % 6];
    text = `Make ${c.want} the subject of the formula:\n${c.eq}`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Undo the operations on ${c.want} in reverse order.`, c.a]];
    hint = 'Undo the last thing that was done to the letter you want.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  {
    const m = ri(r, 2, 12);
    const fixed = ri(r, 2, 6);
    const rate = ri(r, 1, 3);
    ans = fixed + rate * m;
    text = `A taxi company uses the formula\nC = ${fixed} + ${rate}m\nto work out the cost C (£) of a journey of m miles.\nWork out the cost of a ride of ${m} miles.`;
    input = { type: 'number', placeholder: '£' };
    sol = [[`C = ${fixed} + ${rate} × ${m} = ${fixed} + ${rate * m} = £${ans}`]];
    hint = 'Substitute the number of miles in place of m.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `£${ans}`, solution: sol, hint };
  }
}