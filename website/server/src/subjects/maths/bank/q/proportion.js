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
  const r = makeRand('proportion', v);
  const t = v % 6;
  const p = Math.floor(v / 6);
  if (p >= 12) return null;
  let ans, text, input, sol, hint, m;

  if (t === 0) {
    const cases = [
      { for4: 200, n: 10, ing: 'flour (g)' },
      { for4: 3, n: 6, ing: 'eggs' },
      { for4: 150, n: 12, ing: 'sugar (g)' },
      { for4: 100, n: 14, ing: 'butter (g)' },
      { for4: 2, n: 10, ing: 'lemons' },
      { for4: 500, n: 6, ing: 'milk (ml)' },
      { for4: 80, n: 9, ing: 'chocolate (g)' },
      { for4: 250, n: 10, ing: 'rice (g)' },
      { for4: 4, n: 22, ing: 'sausages' },
      { for4: 60, n: 7, ing: 'cheese (g)' },
      { for4: 300, n: 8, ing: 'fruit (g)' },
      { for4: 6, n: 15, ing: 'carrots' },
    ];
    const c = cases[p % 12];
    ans = round((c.for4 / 4) * c.n, 2);
    text = `A recipe for 4 people needs ${c.for4} ${c.ing}.\nHow much ${c.ing} is needed for ${c.n} people?`;
    input = { type: 'number', tolerance: 0.001 };
    sol = [[`For 1 person: ${c.for4} ÷ 4 = ${c.for4 / 4}.`, `For ${c.n} people: ${c.for4 / 4} × ${c.n} = ${ans}`]];
    hint = 'Scale down to ONE person first, then multiply by how many you need.';
    return { marks: 2, difficulty: 1, stretch: false, text, input, answer: ans, answerText: `${ans} ${c.ing}`, solution: sol, hint };
  }

  if (t === 1) {
    const cases = [
      { a: '500 g pack of pasta', pa: 4.2, wa: 500, b: '750 g pack of pasta', pb: 6.9, wb: 750, unit: 'kg', scale: 1000 },
      { a: '400 g box of cereal', pa: 2.8, wa: 400, b: '650 g box of cereal', pb: 4.55, wb: 650, unit: 'kg', scale: 1000 },
      { a: '6 toilet rolls', pa: 3.6, wa: 6, b: '9 toilet rolls', pb: 5.85, wb: 9, unit: 'roll', scale: 1 },
      { a: '4 cans of cola', pa: 2.4, wa: 4, b: '6 cans of cola', pb: 4.2, wb: 6, unit: 'can', scale: 1 },
      { a: 'box of 80 tea bags', pa: 2.25, wa: 80, b: 'box of 150 tea bags', pb: 4.2, wb: 150, unit: 'bag', scale: 1 },
      { a: '500 ml bottle of shampoo', pa: 2.5, wa: 500, b: '750 ml bottle of shampoo', pb: 4.5, wb: 750, unit: 'litre', scale: 1000 },
      { a: '250 g block of butter', pa: 2.2, wa: 250, b: '400 g block of butter', pb: 3.6, wb: 400, unit: 'kg', scale: 1000 },
      { a: '300 g bag of mints', pa: 3.9, wa: 300, b: '500 g bag of mints', pb: 6.5, wb: 500, unit: 'kg', scale: 1000 },
      { a: 'box of 12 eggs', pa: 2.4, wa: 12, b: 'box of 18 eggs', pb: 3.96, wb: 18, unit: 'egg', scale: 1 },
      { a: '2 L bottle of lemonade', pa: 1.9, wa: 2, b: '3 L bottle of lemonade', pb: 2.7, wb: 3, unit: 'litre', scale: 1 },
      { a: '100 ml bottle of perfume', pa: 8, wa: 100, b: '150 ml bottle of perfume', pb: 12.75, wb: 150, unit: 'ml', scale: 1 },
      { a: '250 g bag of rice', pa: 1.75, wa: 250, b: '1 kg bag of rice', pb: 6.5, wb: 1000, unit: 'kg', scale: 1000 },
    ];
    const c = cases[p % 12];
    const ua = (c.pa / c.wa) * c.scale;
    const ub = (c.pb / c.wb) * c.scale;
    const same = Math.abs(ua - ub) < 1e-9;
    const best = same ? 'they are the same value' : ua < ub ? 'the first option' : 'the second option';
    text = `Which is better value for money?\n${c.a} at £${c.pa.toFixed(2)}   OR   ${c.b} at £${c.pb.toFixed(2)}\n(work it out using the price per ${c.unit})`;
    m = mcq(r, best, ['the first option', 'the second option', 'they are the same value'].filter((x) => x !== best));
    input = m.input;
    sol = [
      [`Price per ${c.unit} of ${c.a}: £${c.pa.toFixed(2)} ÷ ${c.wa} × ${c.scale} = £${ua.toFixed(4)}.`],
      [`Price per ${c.unit} of ${c.b}: £${c.pb.toFixed(2)} ÷ ${c.wb} × ${c.scale} = £${ub.toFixed(4)}.`],
      [same ? 'Both cost the same per unit — same value!' : `${ua < ub ? c.a : c.b} is cheaper per ${c.unit}, so it is better value.`],
    ];
    hint = 'Work out the price per unit (e.g. pence per 100 g) and compare.';
    return { marks: 3, difficulty: 3, stretch: false, text, input, answer: m.answer, answerText: best, solution: sol, hint };
  }

  if (t === 2) {
    const rates = [1.25, 1.3, 1.4, 1.5][p % 4];
    const pounds = ri(r, 4, 24) * 10;
    ans = round(pounds * rates, 2);
    text = `The exchange rate is £1 = $${rates}.\nConvert £${pounds} to dollars.`;
    input = { type: 'number', tolerance: 0.011, placeholder: '$' };
    sol = [[`Dollars = pounds × ${rates}.`, `£${pounds} × ${rates} = $${ans}`]];
    hint = '£ → $ : multiply by the rate. $ → £ : divide by the rate.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `$${ans}`, solution: sol, hint };
  }

  if (t === 3) {
    const rates = [1.25, 1.3, 1.4, 1.5][p % 4];
    const pounds = (ri(r, 2, 12) * 10) / rates;
    const dollars = round(pounds * rates, 2);
    ans = round(dollars / rates, 2);
    text = `The exchange rate is £1 = $${rates}.\nConvert $${dollars} to pounds.`;
    input = { type: 'number', tolerance: 0.011, placeholder: '£' };
    sol = [[`Pounds = dollars ÷ ${rates}.`, `$${dollars} ÷ ${rates} = £${ans}`]];
    hint = '$ → £ : divide by the rate. £ → $ : multiply by the rate.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `£${ans}`, solution: sol, hint };
  }

  if (t === 4) {
    const cases = [
      { a: 4, ta: 30 }, { a: 5, ta: 45 }, { a: 2, ta: 25 }, { a: 3, ta: 60 },
      { a: 8, ta: 40 }, { a: 6, ta: 18 }, { a: 4, ta: 32 }, { a: 10, ta: 50 },
      { a: 3, ta: 21 }, { a: 5, ta: 35 }, { a: 7, ta: 42 }, { a: 6, ta: 30 },
    ];
    const c = cases[p % 12];
    const k = [2, 3, 4, 5][p % 4];
    const T = c.ta * k;
    ans = c.a * k;
    text = `A machine makes ${c.a} toys in ${c.ta} minutes.\nHow many toys does it make in ${T} minutes?`;
    input = { type: 'number' };
    sol = [[`${T} ÷ ${c.ta} = ${k}, so the time is ${k} times longer.`, `Toys made = ${c.a} × ${k} = ${ans}`]];
    hint = 'Direct proportion: time × k → toys × k.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: String(ans), solution: sol, hint };
  }

  {
    const cases = [
      { origin: 'Buy', buy: 4.5, sell: 6, n: 60 },
      { origin: 'Buy', buy: 6, sell: 7.5, n: 40 },
      { origin: 'Buy', buy: 8, sell: 11, n: 30 },
      { origin: 'Buy', buy: 12, sell: 15, n: 25 },
      { origin: 'Buy', buy: 3, sell: 4, n: 90 },
      { origin: 'Buy', buy: 7, sell: 9.5, n: 36 },
      { origin: 'Buy', buy: 15, sell: 20, n: 20 },
      { origin: 'Buy', buy: 9, sell: 13, n: 28 },
      { origin: 'Buy', buy: 5, sell: 6.4, n: 50 },
      { origin: 'Buy', buy: 10, sell: 12.5, n: 24 },
      { origin: 'Buy', buy: 11, sell: 14, n: 22 },
      { origin: 'Buy', buy: 4, sell: 5.8, n: 55 },
    ];
    const c = cases[p % 12];
    const perItem = round(c.sell - c.buy, 2);
    ans = round(perItem * c.n, 2);
    text = `A shopkeeper buys ${c.n} mugs for £${c.buy} each and sells them for £${c.sell} each.\nWork out her total profit.`;
    input = { type: 'number', tolerance: 0.005, placeholder: '£' };
    sol = [[`Profit per mug = £${c.sell} − £${c.buy} = £${perItem}.`, `Total profit = ${c.n} × £${perItem} = £${ans}.`]];
    hint = 'Profit = selling price − cost, then multiply by how many you sold.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `£${ans}`, solution: sol, hint };
  }
}