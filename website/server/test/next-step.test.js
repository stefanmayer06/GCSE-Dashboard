import assert from 'node:assert/strict';
import test from 'node:test';
import { computeNextStep, creatureForStep } from '../../clients/shared/next-step.js';
import { recordRoundMistakes } from '../../clients/shared/study-personal.js';

const topics = [
  { id: 'fractions', name: 'Fractions', strand: 'number' },
  { id: 'decimals', name: 'Decimals', strand: 'number' },
  { id: 'ratio', name: 'Ratio', strand: 'ratio' },
];

function todayKey() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

test('a learner with no marked answers is sent to the 10-question check first', () => {
  const step = computeNextStep({ topics, progress: { topicStats: {} }, personal: { plan: null, mistakes: [] } });
  assert.equal(step.kind, 'diagnostic');
  assert.equal(step.href, '/practice?diagnostic=1#adhoc');
  assert.equal(step.cta, 'Start the check');
  assert.equal(creatureForStep(step), 'quill');
});

test('due retries come before everything else and feed Redo', () => {
  const step = computeNextStep({ topics, progress: { topicStats: {} }, personal: { mistakes: [] }, dueCount: 2 });
  assert.equal(step.kind, 'retry');
  assert.equal(step.href, '/notebook');
  assert.equal(creatureForStep(step), 'redo');
});

test("today's planned lesson wins once the learner has evidence", () => {
  const progress = { topicStats: { fractions: { correct: 4, total: 5 } } };
  const personal = { plan: { days: [{ date: todayKey(), task: 'Decimals', topicId: 'decimals', status: 'todo' }] }, mistakes: [] };
  const step = computeNextStep({ topics, progress, personal });
  assert.equal(step.kind, 'mission');
  assert.equal(step.href, '/learn/decimals');
  assert.equal(creatureForStep(step), 'quill');
  const retryDay = computeNextStep({ topics, progress, personal: { plan: { days: [{ date: todayKey(), task: 'Mistake retry', status: 'todo' }] }, mistakes: [] } });
  assert.equal(retryDay.href, '/notebook');
  assert.equal(creatureForStep(retryDay), 'redo');
});

test('weak topics, then new topics, then timed papers', () => {
  const weak = computeNextStep({ topics, progress: { topicStats: { fractions: { correct: 1, total: 5 } } }, personal: { mistakes: [] } });
  assert.equal(weak.kind, 'weak-topic');
  assert.equal(weak.href, '/learn/fractions');

  const fresh = computeNextStep({ topics, progress: { topicStats: { fractions: { correct: 5, total: 5 } } }, personal: { mistakes: [] } });
  assert.equal(fresh.kind, 'fresh-topic');
  assert.equal(creatureForStep(fresh), 'tortile');

  const allDone = Object.fromEntries(topics.map((topic) => [topic.id, { correct: 9, total: 10 }]));
  const paper = computeNextStep({ topics, progress: { topicStats: allDone }, personal: { mistakes: [] } });
  assert.equal(paper.kind, 'practice');
  assert.equal(creatureForStep(paper), 'tock');
  assert.equal(creatureForStep(null), null);
});

test('mixed-round misses go to the notebook with their reason, without duplicates', async () => {
  const saved = [];
  const api = {
    personal: async () => ({ mistakes: [{ id: 'maths:old:q-2', qid: 'q-2', mastered: false, capturedAt: '2026-01-01T00:00:00.000Z' }] }),
    saveMistakes: async (rows) => { saved.push(rows); },
  };
  const result = {
    perQ: [
      { qid: 'q-1', marks: 1, correct: false, value: '7', answerText: '9', topicId: 'fractions', topic: 'Fractions' },
      { qid: 'q-2', marks: 1, correct: false, value: '1', answerText: '2', topicId: 'decimals', topic: 'Decimals' },
      { qid: 'q-3', marks: 1, correct: true, value: '3', answerText: '3', topicId: 'ratio', topic: 'Ratio' },
    ],
  };
  const count = await recordRoundMistakes(api, 'maths', 'round-1', result, {
    questions: [{ id: 'q-1', text: 'Work out 3 x 3' }, { id: 'q-2', text: 'Halve 4' }, { id: 'q-3', text: 'Three' }],
    feedback: { 'q-1': { solution: ['3 x 3 = 9'] } },
    errorTypes: { 'q-1': 'arithmetic' },
  });
  assert.equal(count, 1);
  const rows = saved[0];
  const added = rows.find((row) => row.qid === 'q-1');
  assert.equal(added.prompt, 'Work out 3 x 3');
  assert.equal(added.errorType, 'arithmetic');
  assert.deepEqual(added.workedSolution, ['3 x 3 = 9']);
  assert.equal(added.correctAnswer, '9');
  assert.equal(added.dueDates.length, 4);
  assert.equal(rows.filter((row) => row.qid === 'q-2').length, 1, 'an open row is not captured twice');
  assert.ok(!rows.some((row) => row.qid === 'q-3'), 'correct answers are not mistakes');

  const none = await recordRoundMistakes(api, 'maths', 'round-2', { perQ: [result.perQ[2]] }, {});
  assert.equal(none, 0);
  assert.equal(saved.length, 1);
});
