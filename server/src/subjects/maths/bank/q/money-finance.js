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
  const r = makeRand('money-finance', v);
  const t = v % 6;
  const p = Math.floor(v / 6);
  if (p >= 10) return null;
  let ans, text, input, sol, hint;

  if (t === 0) {
    const income = (ri(r, 150, 350) * 100);
    const taxed = income - 12570;
    ans = taxed * 0.2;
    text = `Jamie earns £${income.toLocaleString()} per year.\nThe first £12,570 of income is tax-free. Any earnings above this are taxed at 20%.\nWork out how much tax Jamie pays per year.`;
    input = { type: 'number', placeholder: '£' };
    sol = [[`Taxable income = £${income.toLocaleString()} − £12,570 = £${taxed.toLocaleString()}.`, `Tax = 20% of £${taxed.toLocaleString()} = £${ans.toLocaleString()}.`]];
    hint = 'Subtract the tax-free allowance first, then find 20% of what is left.';
    return { marks: 4, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `£${ans.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, solution: sol, hint };
  }

  if (t === 1) {
    const start = ri(r, 10, 60) * 10;
    const out1 = round(ri(r, 200, 900) / 10, 2);
    const in1 = round(ri(r, 500, 2000) / 10, 2);
    const out2 = round(ri(r, 150, 600) / 10, 2);
    ans = round(start + in1 - out1 - out2, 2);
    text = `Zara's bank account holds £${start}.\nShe pays a bill of £${out1.toFixed(2)}, receives £${in1.toFixed(2)}, then pays another bill of £${out2.toFixed(2)}.\nHow much is left in the account?`;
    input = { type: 'number', tolerance: 0.005, placeholder: '£' };
    sol = [[`£${start} − £${out1.toFixed(2)} + £${in1.toFixed(2)} − £${out2.toFixed(2)} = £${ans.toFixed(2)}.`]];
    hint = 'Work through the transactions in order: subtract bills, add money in.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `£${ans.toFixed(2)}`, solution: sol, hint };
  }

  if (t === 2) {
    const mins = ri(r, 15, 120);
    const rate = [5, 10, 15, 20, 25][p % 5];
    const fixed = round(ri(r, 400, 1200) / 100, 2);
    ans = round((mins * rate) / 100 + fixed, 2);
    text = `A phone contract costs £${fixed.toFixed(2)} per month plus ${rate}p for every minute of calls.\nAli uses ${mins} minutes of calls in one month.\nWork out his bill for that month.`;
    input = { type: 'number', tolerance: 0.005, placeholder: '£' };
    sol = [[`Call cost = ${mins} × ${rate}p = £${((mins * rate) / 100).toFixed(2)}.`, `Total = £${fixed.toFixed(2)} + £${((mins * rate) / 100).toFixed(2)} = £${ans.toFixed(2)}.`]];
    hint = 'Careful: pence must be turned into pounds (divide by 100) before adding.';
    return { marks: 3, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `£${ans.toFixed(2)}`, solution: sol, hint };
  }

  if (t === 3) {
    const salary = ri(r, 180, 420) * 100;
    const pct = [5, 10, 15, 20, 25][p % 5];
    ans = round(salary * (1 + pct / 100), 2);
    text = `Leo's salary is £${salary.toLocaleString()} per year.\nHis salary increases by ${pct}%.\nWork out his new salary.`;
    input = { type: 'number', placeholder: '£' };
    sol = [[`Increase = multiplier ×${1 + pct / 100}.`, `£${salary.toLocaleString()} × ${1 + pct / 100} = £${ans.toLocaleString()}.`]];
    hint = 'New amount = old amount × (100 + pct)/100.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `£${ans.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, solution: sol, hint };
  }

  if (t === 4) {
    const amount = ri(r, 40, 200) * 10;
    const rate = [2, 3, 4, 5][p % 4];
    ans = round((amount * rate) / 100, 2);
    text = `£${amount.toLocaleString()} is invested for one year at ${rate}% simple interest per year.\nWork out the interest earned.`;
    input = { type: 'number', placeholder: '£', tolerance: 0.005 };
    sol = [[`${rate}% of £${amount.toLocaleString()} = £${amount.toLocaleString()} × ${rate}/100 = £${ans.toFixed(2)}.`]];
    hint = 'Simple interest = same percentage of the original amount each year.';
    return { marks: 2, difficulty: 2, stretch: false, text, input, answer: ans, answerText: `£${ans.toFixed(2)}`, solution: sol, hint };
  }

  {
    const gross = ri(r, 200, 400) * 100;
    const taxable = gross - 12570;
    const it = taxable * 0.2;
    const ni = taxable * 0.08;
    ans = round(it + ni, 2);
    text = `Priya's gross salary is £${gross.toLocaleString()} per year.\nShe pays 20% income tax and 8% National Insurance on everything she earns above £12,570.\nWork out the total she pays in income tax and National Insurance.`;
    input = { type: 'number', tolerance: 0.011, placeholder: '£' };
    sol = [[`Earnings above £12,570: £${gross.toLocaleString()} − £12,570 = £${taxable.toLocaleString()}.`, `Income tax: 20% of £${taxable.toLocaleString()} = £${round(it, 2).toLocaleString('en-GB', { minimumFractionDigits: 2 })}.`, `NI: 8% of £${taxable.toLocaleString()} = £${round(ni, 2).toLocaleString('en-GB', { minimumFractionDigits: 2 })}.`, `Total = £${ans.toLocaleString('en-GB', { minimumFractionDigits: 2 })}.`]];
    hint = 'Work out the tax and NI separately on the same taxable amount, then add.';
    return { marks: 5, difficulty: 3, stretch: true, text, input, answer: ans, answerText: `£${ans.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`, solution: sol, hint };
  }
}