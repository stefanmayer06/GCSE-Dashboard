import { makeRand, ri, pick, shuffle, round } from '../../util.js';

function mcq(r, correct, wrongs) {
  const options = shuffle(r, [{ text: correct, ok: true }, ...wrongs.map((w) => ({ text: String(w), ok: false }))]);
  return {
    input: { type: 'mcq', choices: options.map((o, i) => ({ label: String.fromCharCode(65 + i), text: o.text })) },
    answer: String.fromCharCode(65 + options.findIndex((o) => o.ok)),
    answerText: correct,
  };
}

export default function gen(v) {
  const r = makeRand('place-value', v);
  const t = v % 10;
  const p = Math.floor(v / 10);
  if (p >= 6) return null;
  let D, ans, text, input, sol, hint;

  if (t === 0) {
    const nums = [];
    const bases = [ri(r, 10, 90), ri(r, 100, 900), ri(r, 100, 999), ri(r, 10, 90)];
    nums.push(bases[0] / 100);
    nums.push(bases[1] / 100);
    nums.push(bases[2] / 1000);
    nums.push(bases[3] / 10);
    const set = [...new Set(nums.map((x) => round(x, 3)))];
    if (set.length < 4) return null;
    const sorted = [...set].sort((a, b) => a - b);
    ans = sorted.map(String).join(', ');
    text = `Write these numbers in order of size, starting with the smallest:\n${set.map(String).join('   ')}`;
    const wrong = [];
    wrong.push([...sorted].reverse().map(String).join(', '));
    wrong.push(`${sorted[1]}, ${sorted[0]}, ${sorted[2]}, ${sorted[3]}`);
    wrong.push(`${sorted[0]}, ${sorted[2]}, ${sorted[1]}, ${sorted[3]}`);
    const m = mcq(r, ans, wrong);
    input = m.input;
    sol = [`Line the numbers up by decimal point and compare digit by digit.`, `In order (smallest first): ${ans}`];
    hint = 'Add trailing zeros so every number has the same number of decimal places, e.g. 0.5 = 0.50.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: ans, solution: sol, hint };
  }

  if (t === 1) {
    const digits = shuffle(r, [2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    const num = digits[0] * 1000 + digits[1] * 100 + digits[2] * 10 + digits[3];
    const target = digits[p % 4];
    ans = target * 10 ** (3 - (p % 4));
    text = `What is the value of the digit ${target} in the number ${num}?`;
    input = { type: 'number', placeholder: 'e.g. 700' };
    sol = [`Write ${num} in a place value grid: thousands, hundreds, tens, units.`, `The digit ${target} is in the ${['thousands', 'hundreds', 'tens', 'units'][p % 4]} column, so its value is ${ans}.`];
    hint = 'The value of a digit = the digit × its place value (1, 10, 100, 1000…).';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 2) {
    const num = ri(r, 1200, 9800);
    const unit = [10, 100, 1000][p % 3];
    ans = Math.round(num / unit) * unit;
    text = `Round ${num} to the nearest ${unit}.`;
    input = { type: 'number' };
    const delta = (num / unit) % 1;
    const up = delta >= 0.5;
    sol = [`Look at the digit one place to the right of the ${unit}s digit.`, `It is ${delta.toFixed(2)} of the way, so round ${up ? 'up' : 'down'} → ${ans}.`];
    hint = 'Look one digit to the right: 5 or more → round up, 4 or less → round down.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 3) {
const pairs = [
      [3.47, 3.5], [2.041, 2.0], [5.632, 5.6], [8.99, 9.0], [0.784, 0.8], [4.35, 4.4],
    ];
    const [num, a] = pairs[p % 6];
    ans = a;
    text = `Round ${num} to 1 decimal place.`;
    input = { type: 'number' };
    sol = [`The hundredths digit decides: look at the 2nd decimal place of ${num}.`, `Round to one decimal place → ${ans}.`];
    hint = 'The 2nd decimal place decides what the 1st decimal place becomes.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 4) {
    D = [
      [-4, 7], [-9, 12], [5, -3], [-6, -3], [8, -15], [-12, 4],
    ][p % 6];
    ans = D[0] + D[1];
    text = `Work out ${D[0]} + ${D[1]}`;
    input = { type: 'number', placeholder: 'can be negative' };
    sol = [`Imagine a number line. Start at ${D[0]} and move ${D[1] > 0 ? `right ${D[1]}` : `left ${Math.abs(D[1])}`}.`, `${D[0]} + ${D[1]} = ${ans}`];
    hint = 'Think of a number line / temperature. Adding a negative moves left.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 5) {
    D = [
      [-3, 8], [-7, 12], [-2, 5], [-10, 16], [-5, 3], [-15, 20],
    ][p % 6];
    ans = D[0] + D[1];
    text = `The temperature at midnight is ${D[0]}°C. By noon it has risen by ${D[1]}°C.\nWhat is the temperature at noon?`;
    input = { type: 'number', placeholder: '°C' };
    sol = [`Rise means add: ${D[0]} + ${D[1]}.`, `On a number line, moving right ${D[1]} from ${D[0]} lands on ${ans}.`];
    hint = 'Rise = add. Draw a number line if it helps.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans}°C`, solution: sol, hint };
  }

  if (t === 6) {
    const lists = [
      { set: ['-2.5', '-3', '0.4', '-0.9'], ans: '0.4', word: 'largest' },
      { set: ['-4.1', '-4.01', '-3.9', '-4.001'], ans: '-3.9', word: 'largest' },
      { set: ['0.3', '0.03', '0.33', '0.333'], ans: '0.333', word: 'largest' },
      { set: ['-5', '-2', '-8', '-1'], ans: '-8', word: 'smallest' },
      { set: ['0.7', '0.07', '0.707', '0.77'], ans: '0.77', word: 'largest' },
      { set: ['-1.2', '-1.02', '-1.002', '-2.1'], ans: '-2.1', word: 'smallest' },
    ];
    const s = lists[p % 6];
    ans = s.ans;
    text = `Which of these numbers is the ${s.word}?\n${s.set.join('   ')}`;
    const wrongs = s.set.filter((x) => x !== ans);
    const m = mcq(r, ans, wrongs);
    input = m.input;
    const answer = m.answer;
    sol = [`Line them up on a number line.`, `The ${s.word} is ${ans}.`];
    hint = 'Negatives: the further from zero the smaller. −4 < −1.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer, answerText: ans, solution: sol, hint };
  }

  if (t === 7) {
    const nums = [7423, 861, 39250, 578, 25490, 0.00527];
    const anss = [7400, 860, 39000, 580, 25000, 0.0053];
    const num = nums[p % 6];
    ans = anss[p % 6];
    text = `Round ${num} to 2 significant figures.`;
    input = { type: 'number', tolerance: p % 6 === 5 ? 0.0001 : 0 };
    sol = [`Count from the first non-zero digit: keep the first 2 digits.`, `${num} → ${ans} (2 s.f.)`];
    hint = 'Significant figures start from the first NON-ZERO digit.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  if (t === 8) {
    const lists = [
      { set: [-12, -7, -4, -3], word: 'ascending' },
      { set: [-9, -1, -6, -20], word: 'ascending' },
      { set: [-2.5, -0.5, -1.5, -3.5], word: 'ascending' },
      { set: [-4, -13, -2, -8], word: 'descending' },
      { set: [-15, -3, -9, -27], word: 'descending' },
      { set: [-0.1, -0.9, -0.3, -0.7], word: 'ascending' },
    ];
    const s = lists[p % 6];
    const sorted = [...s.set].sort((a, b) => a - b);
    const order = s.word === 'ascending' ? sorted : [...sorted].reverse();
    ans = order.join(', ');
    text = `Write these numbers in ${s.word === 'ascending' ? 'ascending' : 'descending'} order:\n${s.set.join('   ')}`;
    const wrongs = [order.slice().reverse().join(', '), `${order[1]}, ${order[0]}, ${order[2]}, ${order[3]}`, `${order[0]}, ${order[2]}, ${order[1]}, ${order[3]}`];
    const m = mcq(r, ans, wrongs);
    input = m.input;
    const answer = m.answer;
    sol = [`Ascending = smallest first / descending = largest first.`, `Order: ${ans}`];
    hint = 'Remember −3 is BIGGER than −7 (closer to zero).';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer, answerText: ans, solution: sol, hint };
  }

  {
    const pairs = [
      { w: 'Four million, three thousand', n: '4,003,000', wrongs: ['4,300,000', '4,030,000', '400,003,000'] },
      { w: 'Two hundred and fifty thousand', n: '250,000', wrongs: ['205,000', '2,500,000', '25,000'] },
      { w: 'Six million, seven hundred thousand and forty', n: '6,700,040', wrongs: ['6,740,000', '670,040', '6,070,040'] },
      { w: 'Nine million and nine', n: '9,000,009', wrongs: ['9,000,900', '9,090,000', '900,009'] },
      { w: 'Three hundred and eight thousand', n: '308,000', wrongs: ['3,008,000', '380,000', '30,800'] },
      { w: 'Five hundred thousand and sixty-two', n: '500,062', wrongs: ['5,000,062', '500,620', '562,000'] },
    ];
    const s = pairs[p % 6];
    text = `Write "${s.w}" in figures.`;
    const m = mcq(r, s.n, s.wrongs);
    input = m.input;
    const answer = m.answer;
    sol = [`Split into groups of three digits from the right.`, `"${s.w}" → ${s.n}`];
    hint = 'Thousands are a group of 3 digits, millions a group of 6.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer, answerText: s.n, solution: sol, hint };
  }
}