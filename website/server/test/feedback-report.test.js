import assert from 'node:assert/strict';
import test from 'node:test';

import { feedbackReport, priceSensitivity } from '../src/feedback-report.js';

const DAY = 86400000;
const NOW = Date.parse('2026-09-29T12:00:00.000Z');
const at = (days) => new Date(NOW + days * DAY).toISOString();
const prices = (tooCheap, bargain, expensive, tooExpensive) => ({ tooCheap, bargain, expensive, tooExpensive });

test('price sensitivity ignores incomplete and inconsistent answer sets', () => {
  const result = priceSensitivity([
    prices(1, 3, 6, 10),
    prices(2, 4, 8, 12),
    prices(1, 5, 7, 15),
    prices(8, 4, 6, 10),
    prices(null, 4, 6, 10),
  ]);
  assert.equal(result.responses, 3);
  assert.equal(result.inconsistent, 1);
  assert.deepEqual(result.medians, { tooCheap: 1, bargain: 4, expensive: 7, tooExpensive: 12 });
  // Curves cross at the first answered price where the falling share meets the rising one.
  assert.equal(result.pointOfMarginalCheapness, 3);
  assert.equal(result.optimalPricePoint, 3);
  assert.equal(result.indifferencePricePoint, 6);
  assert.equal(result.pointOfMarginalExpensiveness, 8);
});

test('price sensitivity is empty without complete answers', () => {
  assert.deepEqual(priceSensitivity([]), {
    responses: 0,
    inconsistent: 0,
    medians: { tooCheap: null, bargain: null, expensive: null, tooExpensive: null },
    pointOfMarginalCheapness: null,
    optimalPricePoint: null,
    indifferencePricePoint: null,
    pointOfMarginalExpensiveness: null,
  });
});

test('feedback report aggregates both storage shapes and omits free text', () => {
  const report = feedbackReport([
    {
      role: 'parent', rating: 4, source: 'Parent-Group', createdAt: at(-2),
      designRating: 5, designNote: 'private note', email: 'parent@example.test',
      payer: 'parent', priceModel: 'season-pass',
      priceTooCheap: 1, priceBargain: 4, priceExpensive: 8, priceTooExpensive: 12,
    },
    {
      role: 'student', rating: 2, source: 'reddit r/gcse', created_at: at(-3),
      design_rating: 3, payer: 'nobody', price_model: 'free-only',
      price_too_cheap: '0.5', price_bargain: '2', price_expensive: '5', price_too_expensive: '7',
    },
    { role: 'student', rating: 5, created_at: at(-1), message: 'free text' },
    { role: 'parent', rating: 1, createdAt: at(-120) },
  ], { sinceDays: 90, now: NOW });

  assert.equal(report.responses, 3);
  assert.deepEqual(report.byRole, { parent: 1, student: 2 });
  assert.deepEqual(report.bySource, { 'parent-group': 1, direct: 2 });
  assert.deepEqual(report.keepUsingRating, { responses: 3, average: 3.67 });
  assert.deepEqual(report.designRating, { responses: 2, average: 4 });
  assert.deepEqual(report.payer, { parent: 1, nobody: 1 });
  assert.deepEqual(report.priceModel, { 'season-pass': 1, 'free-only': 1 });
  assert.equal(report.monthlyPrice.all.responses, 2);
  assert.equal(report.monthlyPrice.parent.medians.bargain, 4);
  assert.equal(report.monthlyPrice.student.medians.tooExpensive, 7);
  const text = JSON.stringify(report);
  for (const secret of ['private note', 'parent@example.test', 'free text']) {
    assert.equal(text.includes(secret), false, `${secret} must not appear in the report`);
  }
});
