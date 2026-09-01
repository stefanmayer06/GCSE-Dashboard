import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWeekPlan, captureMistakes, completePlanDay, dateKey, loadMistakes, loadPlan, missionOutcome, planKey, startPlanDay, studyKey } from '../../clients/shared/study.js';

function memoryStorage(t) {
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  t.after(() => { delete globalThis.localStorage; });
  return values;
}

test('a repeated mistake reactivates a completed notebook item', t => {
  const values = memoryStorage(t);
  values.set(studyKey('user', 'maths', 'mistakes'), JSON.stringify([{
    id: 'q1:Fractions', qid: 'q1', topic: 'Fractions', completed: true, interval: 3, due: null, added: 1,
  }]));

  captureMistakes('user', 'maths', { perQuestion: [{ qid: 'q1', topic: 'Fractions', got: 0, marks: 2 }] }, () => '/learn/fractions');

  const row = loadMistakes('user', 'maths')[0];
  assert.equal(row.completed, false);
  assert.equal(row.interval, 0);
});

test('the exam plan is anchored to its first day and stays stable through the day', t => {
  memoryStorage(t);
  const topics = [{ id: 'fractions', name: 'Fractions' }, { id: 'ratio', name: 'Ratio' }];
  const morning = new Date(2026, 8, 1, 9, 0);
  const first = loadPlan('user', 'maths', topics, false, morning);
  assert.equal(first.from, '2026-09-01');
  assert.equal(first.days[0].task, 'Fractions');
  assert.equal(first.days[0].topicId, 'fractions');
  assert.equal(first.days[3].task, 'Mistake retry');
  assert.equal(first.days[3].topicId, null);
  const evening = loadPlan('user', 'maths', topics, false, new Date(2026, 8, 1, 21, 0));
  assert.deepEqual(evening, first);
  const tomorrow = loadPlan('user', 'maths', topics, false, new Date(2026, 8, 2, 8, 0));
  assert.notEqual(tomorrow.from, first.from);
});

test('completing a started mission saves the score and keeps the rest of the week untouched', t => {
  const values = memoryStorage(t);
  const topics = [{ id: 'fractions', name: 'Fractions' }, { id: 'ratio', name: 'Ratio' }];
  const plan = loadPlan('user', 'maths', topics, false, new Date(2026, 8, 1, 9, 0));
  startPlanDay('user', 'maths', '2026-09-01', 'fractions');
  completePlanDay('user', 'maths', 'fractions', missionOutcome({ correctMarks: 4, totalMarks: 5, reward: { scoreXp: 12 }, weakTopics: [{ name: 'fractions' }] }), new Date(2026, 8, 1, 10, 0));
  const stored = JSON.parse(values.get(planKey('user', 'maths')));
  assert.equal(stored.days[0].status, 'done');
  assert.equal(stored.days[0].result.percent, 80);
  assert.equal(stored.days[0].result.xpEarned, 12);
  assert.equal(stored.days[1].status, 'todo');
  assert.equal(stored.intent, undefined);
  assert.equal(stored.days.filter(day => day.status === 'done').length, 1);
  assert.equal(dateKey(new Date(2026, 8, 1, 10, 0)), '2026-09-01');
});

test('a never-started topic matches today only when it equals today\u2019s planned task', t => {
  memoryStorage(t);
  const topics = [{ id: 'fractions', name: 'Fractions' }, { id: 'ratio', name: 'Ratio' }];
  loadPlan('user', 'maths', topics, false, new Date(2026, 8, 1, 9, 0));
  completePlanDay('user', 'maths', 'algebra', missionOutcome({ correctMarks: 1, totalMarks: 2 }), new Date(2026, 8, 1, 10, 0));
  const stored = JSON.parse(globalThis.localStorage.getItem(planKey('user', 'maths')));
  assert.equal(stored.days.filter(day => day.status === 'done').length, 0);
  completePlanDay('user', 'maths', 'fractions', missionOutcome({ correctMarks: 1, totalMarks: 2 }), new Date(2026, 8, 1, 11, 0));
  const updated = JSON.parse(globalThis.localStorage.getItem(planKey('user', 'maths')));
  assert.equal(updated.days[0].status, 'done');
});

test('buildWeekPlan reuses legacy plan seeds carryover', t => {
  const plan = buildWeekPlan([{ id: 'fractions', name: 'Fractions' }], 'maths', true, new Date(2026, 8, 1, 9, 0), [{ date: '2026-09-01', topicId: 'fractions', topic: 'Fractions' }]);
  assert.equal(plan.days[0].topicId, 'fractions');
  assert.equal(plan.days[0].minutes, 15);
});
