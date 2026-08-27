import { makeRand, ri, pick, shuffle } from '../../util.js';

function gcd2(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

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
  const r = makeRand('ratio', v);
  const t = v % 6;
  const p = Math.floor(v / 6);
  if (p >= 12) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const parts = [
      { a: 3, b: 5 }, { a: 2, b: 7 }, { a: 4, b: 5 }, { a: 3, b: 7 },
      { a: 5, b: 9 }, { a: 2, b: 3 }, { a: 7, b: 4 }, { a: 5, b: 2 },
      { a: 4, b: 9 }, { a: 3, b: 8 }, { a: 6, b: 5 }, { a: 2, b: 5 },
    ];
    const c = parts[p % 12];
    const total = c.a + c.b;
    const unit = ri(r, 2, 12);
    const money = total * unit;
    ans = c.a * unit;
    text = `Share £${money} in the ratio ${c.a} : ${c.b}.\nHow much does the FIRST part get?`;
    input = { type: 'number', placeholder: '£' };
    sol = [[`Total parts = ${c.a} + ${c.b} = ${total}.`, `One part = £${money} ÷ ${total} = £${unit}.`, `First share = ${c.a} × £${unit} = £${ans}.`]];
    hint = 'Add the parts, divide the money by the total parts, then multiply.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `£${ans}`, solution: sol, hint };
  }

  if (t === 1) {
    const parts = [
      { a: 2, b: 3, c: 5 }, { a: 1, b: 4, c: 5 }, { a: 3, b: 4, c: 5 },
      { a: 2, b: 5, c: 8 }, { a: 1, b: 2, c: 7 }, { a: 4, b: 5, c: 6 },
      { a: 2, b: 6, c: 7 }, { a: 3, b: 5, c: 9 }, { a: 1, b: 3, c: 6 },
      { a: 5, b: 6, c: 8 }, { a: 2, b: 4, c: 9 }, { a: 4, b: 7, c: 8 },
    ];
    const c = parts[p % 12];
    const total = c.a + c.b + c.c;
    let unit = 10 / gcd2(total, 10);
    if (unit === 1) unit = 3;
    ans = c.b * unit;
    text = `Share £${total * unit} in the ratio ${c.a} : ${c.b} : ${c.c}.\nHow much does Hamza get if his share is the MIDDLE part (${c.b} parts)?`;
    input = { type: 'number', placeholder: '£' };
    sol = [[`Total parts = ${total}.`, `One part = £${total * unit} ÷ ${total} = £${unit}.`, `Middle share = ${c.b} × £${unit} = £${ans}.`]];
    hint = 'With three people, add all the parts, divide the total, then multiply by the middle person\u2019s parts.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `£${ans}`, solution: sol, hint };
  }

  if (t === 2) {
    const cases = [
      { q: '12 : 18', a: '2 : 3', w: ['4 : 6', '1 : 6', '6 : 9'] },
      { q: '15 : 25', a: '3 : 5', w: ['5 : 8', '3 : 10', '1 : 2'] },
      { q: '16 : 24', a: '2 : 3', w: ['8 : 12', '4 : 6', '1 : 3'] },
      { q: '21 : 28', a: '3 : 4', w: ['7 : 9', '3 : 7', '1 : 4'] },
      { q: '36 : 48', a: '3 : 4', w: ['9 : 12', '12 : 16', '1 : 2'] },
      { q: '40 : 60', a: '2 : 3', w: ['4 : 6', '20 : 30', '1 : 4'] },
      { q: '18 : 24', a: '3 : 4', w: ['6 : 8', '9 : 15', '1 : 3'] },
      { q: '25 : 40', a: '5 : 8', w: ['5 : 15', '1 : 2', '20 : 35'] },
      { q: '30 : 45', a: '2 : 3', w: ['10 : 15', '1 : 3', '5 : 6'] },
      { q: '28 : 42', a: '2 : 3', w: ['14 : 21', '4 : 6', '1 : 3'] },
      { q: '35 : 56', a: '5 : 8', w: ['7 : 11', '5 : 21', '1 : 2'] },
      { q: '45 : 72', a: '5 : 8', w: ['9 : 14', '15 : 24', '1 : 2'] },
    ];
    const c = cases[p % 12];
    text = `Simplify the ratio ${c.q}`;
    m = mcq(r, c.a, c.w.filter((x) => x !== c.a));
    input = m.input;
    const nums = c.q.split(' : ');
    sol = [[`Find the biggest number that divides both (the HCF).`, `${c.q} ÷ HCF → ${c.a}`]];
    hint = 'Divide both sides by the biggest number that goes into both.';
    return { marks: 1, difficulty: 1, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 3) {
    const cases = [
      { q: 'The ratio of red : blue beads is 3 : 5.', ask: 'blue', a: '5/8', w: ['3/5', '3/8', '5/3'] },
      { q: 'The ratio of boys : girls is 2 : 3.', ask: 'girls', a: '3/5', w: ['2/3', '2/5', '3/2'] },
      { q: 'The ratio of tea : coffee sold is 4 : 7.', ask: 'coffee', a: '7/11', w: ['4/7', '4/11', '7/4'] },
      { q: 'The ratio of wins : losses is 5 : 2.', ask: 'wins', a: '5/7', w: ['5/2', '2/7', '2/5'] },
      { q: 'The ratio of cats : dogs is 3 : 8.', ask: 'dogs', a: '8/11', w: ['3/8', '3/11', '8/3'] },
      { q: 'The ratio of left : right handed pupils is 1 : 9.', ask: 'right handed', a: '9/10', w: ['1/9', '1/10', '9/1'] },
      { q: 'The ratio of flour : sugar is 7 : 3.', ask: 'flour', a: '7/10', w: ['7/3', '3/10', '3/7'] },
      { q: 'The ratio of adults : children is 2 : 5.', ask: 'children', a: '5/7', w: ['2/5', '2/7', '5/2'] },
      { q: 'The ratio of fish : chips eaten is 3 : 7.', ask: 'chips', a: '7/10', w: ['3/7', '3/10', '7/3'] },
      { q: 'The ratio of red : green counters is 6 : 5.', ask: 'red', a: '6/11', w: ['6/5', '5/11', '5/6'] },
      { q: 'The ratio of students : teachers is 11 : 1.', ask: 'students', a: '11/12', w: ['11/1', '1/12', '1/11'] },
      { q: 'The ratio of pickles : burgers is 1 : 4.', ask: 'burgers', a: '4/5', w: ['1/4', '1/5', '4/1'] },
    ];
    const c = cases[p % 12];
    text = `${c.q}\nWhat fraction of the total is ${c.ask}?`;
    m = mcq(r, c.a, c.w);
    input = m.input;
    sol = [[`Total parts = sum of the ratio parts.`, `Fraction = ${c.ask} parts ÷ total parts → ${c.a}`]];
    hint = 'Add the ratio parts to get the total, then put the wanted part on top.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: m.answer, answerText: c.a, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { a: 2, b: 5, givenA: 14, name: 'blue', nameA: 'red' },
      { a: 3, b: 7, givenA: 21, name: 'green', nameA: 'yellow' },
      { a: 4, b: 9, givenA: 32, name: 'white', nameA: 'black' },
      { a: 5, b: 3, givenA: 45, name: 'girls', nameA: 'boys' },
      { a: 6, b: 5, givenA: 42, name: 'red', nameA: 'green' },
      { a: 2, b: 9, givenA: 18, name: 'adults', nameA: 'children' },
      { a: 3, b: 8, givenA: 24, name: 'spoons', nameA: 'forks' },
      { a: 7, b: 4, givenA: 49, name: 'blue', nameA: 'red' },
      { a: 3, b: 5, givenA: 27, name: 'chairs', nameA: 'tables' },
      { a: 4, b: 7, givenA: 28, name: 'students', nameA: 'teachers' },
      { a: 8, b: 3, givenA: 56, name: 'cows', nameA: 'sheep' },
      { a: 5, b: 6, givenA: 35, name: 'goals', nameA: 'assists' },
    ];
    const c = cases[p % 12];
    ans = (c.givenA / c.a) * c.b;
    text = `The ratio of ${c.nameA} to ${c.name} is ${c.a} : ${c.b}.\nThere are ${c.givenA} ${c.nameA}.\nHow many ${c.name} are there?`;
    input = { type: 'number' };
    sol = [[`${c.givenA} ÷ ${c.a} = ${c.givenA / c.a} (the value of ONE part).`, `${c.name}: ${c.b} × ${c.givenA / c.a} = ${ans}`]];
    hint = 'Divide what you know by its part to find ONE part, then multiply by the other part.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  {
    const cases = [
      { a: 3, b: 5 }, { a: 2, b: 7 }, { a: 4, b: 7 }, { a: 5, b: 9 },
      { a: 3, b: 8 }, { a: 2, b: 5 }, { a: 5, b: 7 }, { a: 4, b: 9 },
      { a: 3, b: 4 }, { a: 6, b: 7 }, { a: 5, b: 6 }, { a: 7, b: 10 },
    ];
    const c = cases[p % 12];
    const unit = Math.max(6, Math.abs(c.b - c.a) * Math.round(24 / Math.abs(c.b - c.a)));
    const total = (c.a + c.b) * unit;
    const diff = Math.abs(c.b - c.a) * unit;
    ans = c.b * unit;
    text = `Nina and Omar share £${total} in the ratio ${c.a} : ${c.b}.\nOmar gets £${diff} more than Nina (Omar has the bigger share).\nHow much money does Omar get?`;
    input = { type: 'number', placeholder: '£' };
    sol = [[`The difference in parts = ${c.b - c.a} parts = £${diff}.`, `One part = £${diff} ÷ ${c.b - c.a} = £${unit}.`, `Omar gets ${c.b} × £${unit} = £${ans}.`]];
    hint = 'The DIFFERENCE between the shares corresponds to the difference in parts.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `£${ans}`, solution: sol, hint };
  }
}
