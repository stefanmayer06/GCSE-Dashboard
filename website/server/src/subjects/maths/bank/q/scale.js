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
  const r = makeRand('scale', v);
  const t = v % 6;
  const p = Math.floor(v / 6);
  if (p >= 10) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const cm = [2, 4, 5, 8, 10, 3, 6, 12, 7, 9][p % 10];
    ans = (cm * 25000) / 100000;
    text = `A map has a scale of 1 : 25 000.\nThe distance between two towns is ${cm} cm on the map.\nWhat is the real distance in km?`;
    input = { type: 'number', placeholder: 'km' };
    sol = [[`Real distance = ${cm} × 25 000 = ${cm * 25000} cm.`, `${cm * 25000} cm = ${(cm * 25000) / 100000} km`]];
    hint = '1 cm on the map = 25 000 cm in real life = 250 m. Multiply, then convert.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} km`, solution: sol, hint };
  }

  if (t === 1) {
    const km = [2.5, 5, 7.5, 10, 12.5, 4, 8, 6, 15, 20][p % 10];
    ans = (km * 100000) / 25000;
    text = `A map has a scale of 1 : 25 000.\nTwo parks are ${km} km apart in real life.\nHow far apart are they on the map (in cm)?`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`${km} km = ${km * 100000} cm in real life.`, `Map distance = ${km * 100000} ÷ 25 000 = ${ans} cm`]];
    hint = 'Convert km to cm first (×100 000), then divide by the scale.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 2) {
    const m = [6, 8, 12, 4, 10, 14, 5, 16, 7, 20][p % 10];
    ans = m;
    text = `A plan is drawn to the scale 1 : 100.\nA room is ${m} m long.\nHow long is the room on the plan (in cm)?`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`${m} m = ${m * 100} cm.`, `On the plan (÷ 100): ${m * 100} ÷ 100 = ${ans} cm`]];
    hint = '1 cm on the plan = 100 cm (1 m) in real life — so a 6 m room is 6 cm.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 3) {
    const side = [3, 5, 7, 4, 6, 8, 10, 12, 15, 9][p % 10];
    const k = [2, 3, 4, 5][p % 4];
    ans = side * k;
    text = `A triangle with side ${side} cm is enlarged by scale factor ${k}.\nWhat is the length of the enlarged side?`;
    input = { type: 'number', placeholder: 'cm' };
    sol = [[`Enlargement: multiply every length by the scale factor.`, `${side} × ${k} = ${ans} cm`]];
    hint = 'Scale factor × old length = new length.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { small: 4, big: 12, other: 5 },
      { small: 3, big: 9, other: 7 },
      { small: 5, big: 10, other: 6 },
      { small: 6, big: 18, other: 5 },
      { small: 4, big: 7.5, other: 8 },
      { small: 3, big: 7.5, other: 6 },
      { small: 5, big: 12.5, other: 7 },
      { small: 8, big: 20, other: 9 },
      { small: 6, big: 8, other: 10 },
      { small: 10, big: 15, other: 12 },
    ];
    const c = cases[p % 10];
    const k = c.big / c.small;
    ans = Math.round(c.other * k * 100) / 100;
    text = `Two triangles are similar.\nOne side of the smaller triangle is ${c.small} cm and the matching side of the bigger triangle is ${c.big} cm.\nAnother side of the smaller triangle is ${c.other} cm.\nHow long is the MATCHING side on the bigger triangle?`;
    input = { type: 'number', tolerance: 0.011, placeholder: 'cm' };
    sol = [[`Scale factor = ${c.big} ÷ ${c.small} = ${k}.`, `Matching side = ${c.other} × ${k} = ${ans} cm`]];
    hint = 'Similar shapes have the same shape but different size — find the scale factor.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `${ans} cm`, solution: sol, hint };
  }

  {
    const bearings = [
      { dir: 'due East', a: 90 }, { dir: 'South West', a: 225 }, { dir: 'due South', a: 180 },
      { dir: 'North East', a: 45 }, { dir: 'due West', a: 270 }, { dir: 'South East', a: 135 },
      { dir: 'due North', a: 0 }, { dir: 'North West', a: 315 },
    ];
    const c = bearings[p % 8];
    ans = c.a;
    text = `A ship sails ${c.dir}.\nWhat is its bearing?`;
    input = { type: 'number', placeholder: '°' };
    sol = [[`Bearings are measured clockwise from North and always use 3 digits.`, `${c.dir} = ${String(ans).padStart(3, '0')}°`]];
    hint = 'Bearings are always 3 digits and measured clockwise from North (000°).';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${String(ans).padStart(3, '0')}°`, solution: sol, hint };
  }
}