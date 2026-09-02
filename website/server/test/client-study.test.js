import assert from 'node:assert/strict';
import test from 'node:test';
import { buildWeekPlan, dateKey, missionOutcome, weekStartKey } from '../../clients/shared/study.js';
import {
  advanceMistakeRows,
  completePlanDayInState,
  dueMistakeRows,
  hydratePersonal,
  importLegacyPersonal,
  masteredSince,
  mergeMistakeRows,
  mistakeRowsFromResult,
  personalKey,
  recordLessonResult,
  startPlanDayInState,
} from '../../clients/shared/study-personal.js';

function memoryStorage(t, seed = {}) {
  const values = new Map(Object.entries(seed));
  globalThis.localStorage = {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  t.after(() => { delete globalThis.localStorage; });
  return values;
}

function fakeApi(overrides = {}) {
  const calls = { personal: 0, preferences: 0, plan: 0, mistakes: 0, savedPlan: null, savedMistakes: [] };
  const api = {
    personal: async () => { calls.personal += 1; return overrides.personal ?? { preferences: null, plan: null, mistakes: [] }; },
    savePreferences: async (preferences) => { calls.preferences += 1; return { preferences }; },
    savePlan: async (plan) => { calls.plan += 1; calls.savedPlan = plan; if (overrides.savePlan) return overrides.savePlan(plan); return { plan }; },
    saveMistakes: async (rows) => { calls.mistakes += 1; calls.savedMistakes = rows; if (overrides.saveMistakes) return overrides.saveMistakes(rows); return { mistakes: rows }; },
  };
  return { api, calls };
}

test('weeks run Monday to Sunday with today highlighted and review slots fixed', () => {
  // Tuesday 1 Sep 2026: the week anchor is Monday 31 Aug, today lands on day 2.
  const plan = buildWeekPlan([{ id: 'fractions', name: 'Fractions' }, { id: 'ratio', name: 'Ratio' }], 'maths', true, new Date(2026, 8, 1, 9, 0));
  assert.equal(plan.from, '2026-08-31');
  assert.equal(plan.days.length, 7);
  assert.equal(plan.days[0].date, '2026-08-31');
  assert.equal(plan.days[0].label, 'Mon');
  assert.equal(plan.days[1].label, 'Today');
  assert.equal(plan.days[2].date, '2026-09-02');
  assert.equal(plan.days[6].date, '2026-09-06');
  assert.equal(plan.days[0].task, 'Fractions');
  assert.equal(plan.days[0].topicId, 'fractions');
  assert.equal(plan.days[0].minutes, 15);
  assert.equal(plan.days[3].task, 'Mistake retry');
  assert.equal(plan.days[3].topicId, null);
  assert.equal(plan.days[6].task, 'Weekly review');
});

test('weekStartKey anchors every weekday to the same Monday', () => {
  assert.equal(weekStartKey(new Date(2026, 7, 31, 7, 0)), '2026-08-31', 'Monday maps to itself');
  assert.equal(weekStartKey(new Date(2026, 8, 2, 23, 0)), '2026-08-31', 'Wednesday stays in the same week');
  assert.equal(weekStartKey(new Date(2026, 8, 6, 12, 0)), '2026-08-31', 'Sunday closes the same week');
  assert.equal(weekStartKey(new Date(2026, 8, 7, 0, 30)), '2026-09-07', 'Monday starts a fresh week');
});

test('plan state helpers keep completion scoped to today and the started day', () => {
  const plan = buildWeekPlan([{ id: 'fractions', name: 'Fractions' }], 'maths', false, new Date(2026, 8, 1, 9, 0));
  const started = startPlanDayInState(plan, '2026-09-01', 'fractions');
  assert.deepEqual(started.intent, { date: '2026-09-01', topicId: 'fractions' });
  const done = completePlanDayInState(started, 'fractions', missionOutcome({ correctMarks: 4, totalMarks: 5, reward: { scoreXp: 12 } }));
  assert.equal(done.days[1].status, 'done');
  assert.equal(done.days[1].result.percent, 80);
  assert.equal(done.days[1].result.xpEarned, 12);
  assert.equal(done.intent, undefined);
  assert.equal(done.days[2].status, 'todo');
  // A topic that was never planned does not consume a day.
  assert.equal(completePlanDayInState(plan, 'algebra', missionOutcome({ correctMarks: 1, totalMarks: 2 })), null);
});

test('lesson quick practice completes today without requiring a start intent', () => {
  const plan = buildWeekPlan([{ id: 'sequences', name: 'Sequences' }], 'maths', false, new Date(2026, 8, 1, 9, 0));
  const done = completePlanDayInState(plan, 'sequences', missionOutcome({ correctMarks: 3, totalMarks: 5 }), '2026-09-01');
  assert.equal(done.days[1].status, 'done');
  assert.equal(done.days[1].result.percent, 60);
  assert.equal(done.days[2].status, 'todo');
});

test('mistake rows build, merge, advance and go due on schedule', () => {
  const now = Date.now();
  const rows = mistakeRowsFromResult({
    perQ: [
      { qid: 'q1', topic: 'Fractions', topicId: 'fractions', correct: false, got: 0, marks: 4, value: '7', answerText: '3/4', solution: ['Simplify', 'Check'] },
      { qid: 'q2', correct: true, got: 4, marks: 4 },
    ],
  }, 'maths', 'lesson-fractions');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].topicName, 'Fractions');
  assert.equal(rows[0].topicId, 'fractions');
  assert.equal(rows[0].answer, '7');
  assert.equal(rows[0].correctAnswer, '3/4');
  assert.deepEqual(rows[0].workedSolution, ['Simplify', 'Check']);
  assert.equal(rows[0].dueDates.length, 4);

  // Re-capturing the same miss (e.g. reopening an old results page) refreshes
  // the evidence but must never reset review progress or mastery.
  const merged = mergeMistakeRows(
    [{ ...rows[0], reviewIndex: 2, mastered: false, errorType: 'method', warmupCount: 1 }],
    rows,
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].reviewIndex, 2, 'a repeated miss keeps its review progress');
  assert.equal(merged[0].errorType, 'method');
  assert.equal(merged[0].warmupCount, 1);
  assert.equal(dueMistakeRows(merged, now + 8 * 86400000).length, 1, 'review 3 is still scheduled on the original dates');

  const advanced = advanceMistakeRows(merged, rows[0].id);
  assert.equal(advanced[0].reviewIndex, 3);
  assert.ok(advanced[0].lastReviewedAt, 'retry evidence records when the review happened');
  const mastered = [0, 1, 2].reduce((acc) => advanceMistakeRows(acc, rows[0].id), advanced);
  assert.equal(mastered[0].mastered, true);
  assert.equal(masteredSince(mastered, 7 * 86400000, now + 86400000).length, 1);
  assert.equal(masteredSince(mastered, 7 * 86400000, now + 8 * 86400000).length, 0, 'mastery evidence expires out of the weekly window');
});

test('legacy local data imports once, uploads only empty domains and clears the keys', async (t) => {
  const values = memoryStorage(t, {
    [personalKey('user', 'maths', 'study')]: JSON.stringify({ examDate: '2027-06-01', passMode: true }),
    [personalKey('user', 'maths', 'plan')]: JSON.stringify({ from: '2026-09-01', days: [{ date: '2026-09-01', task: 'Fractions', topicId: 'fractions', status: 'todo' }] }),
    [personalKey('user', 'maths', 'mistakes')]: JSON.stringify([{ id: 'legacy:1', qid: 'q1', topic: 'Ratio', question: 'Simplify', marks: 1, max: 3, interval: 0, added: Date.now() }]),
  });
  const { api, calls } = fakeApi();

  const imported = await importLegacyPersonal(api, 'user', 'maths', { preferences: null, plan: null, mistakes: [] });
  assert.equal(imported, true);
  assert.equal(calls.preferences, 1);
  assert.equal(calls.plan, 1);
  assert.equal(calls.mistakes, 1);
  assert.equal(calls.savedMistakes[0].topicName, 'Ratio');
  assert.equal(values.has(personalKey('user', 'maths', 'study')), false);
  assert.equal(values.has(personalKey('user', 'maths', 'plan')), false);
  assert.equal(values.has(personalKey('user', 'maths', 'mistakes')), false);

  const again = await importLegacyPersonal(api, 'user', 'maths', { preferences: null, plan: null, mistakes: [] });
  assert.equal(again, false);
  assert.equal(calls.mistakes, 1, 'second run is a no-op');
});

test('remote data wins and legacy data is never uploaded over it', async (t) => {
  const values = memoryStorage(t, {
    [personalKey('user', 'maths', 'study')]: JSON.stringify({ examDate: '2027-06-01' }),
  });
  const { api, calls } = fakeApi({ personal: { preferences: { examDate: '2028-01-01', targetGrade: '', passMode: 'balanced' }, plan: null, mistakes: [] } });
  await importLegacyPersonal(api, 'user', 'maths', { preferences: { examDate: '2028-01-01' }, plan: null, mistakes: [] });
  assert.equal(calls.preferences, 0);
  assert.equal(values.has(personalKey('user', 'maths', 'study')), false, 'legacy keys still cleared after skipping upload');
});

test('hydratePersonal refreshes after a one-time import', async (t) => {
  const values = memoryStorage(t, {
    [personalKey('user', 'maths', 'plan')]: JSON.stringify({ from: '2026-09-01', days: [{ date: '2026-09-01', task: 'Fractions', topicId: 'fractions' }] }),
  });
  const { api, calls } = fakeApi();
  await hydratePersonal(api, 'user', 'maths');
  assert.equal(calls.personal, 2);
  assert.equal(calls.plan, 1);
  await hydratePersonal(api, 'user', 'maths');
  assert.equal(calls.personal, 3, 'later hydrations skip the import');
  assert.equal(calls.plan, 1);
});

test('recordLessonResult completes the started mission and saves mistakes together', async (t) => {
  memoryStorage(t);
  const today = dateKey();
  const plan = { from: today, days: [{ date: today, task: 'Fractions', topicId: 'fractions', status: 'todo', minutes: 15 }], intent: { date: today, topicId: 'fractions' } };
  const { api, calls } = fakeApi({ personal: { preferences: null, plan, mistakes: [] } });
  await recordLessonResult(api, 'user', 'maths', 'fractions', 'Fractions', {
    correctMarks: 3,
    totalMarks: 5,
    reward: { scoreXp: 9 },
    perQ: [{ qid: 'q1', correct: false, got: 0, marks: 3 }],
  }, { q1: '12' });
  assert.equal(calls.plan, 1);
  assert.equal(calls.savedPlan.days[0].status, 'done');
  assert.equal(calls.savedPlan.days[0].result.percent, 60);
  assert.equal(calls.mistakes, 1);
  assert.equal(calls.savedMistakes[0].topicName, 'Fractions');
  assert.equal(calls.savedMistakes[0].answer, '12');
});

test('recordLessonResult distinguishes a notebook failure after the mission is saved', async (t) => {
  memoryStorage(t);
  const today = dateKey();
  const plan = { from: today, days: [{ date: today, task: 'Fractions', topicId: 'fractions', status: 'todo', minutes: 15 }] };
  const { api, calls } = fakeApi({
    personal: { preferences: null, plan, mistakes: [] },
    saveMistakes: async () => { throw new Error('Notebook unavailable'); },
  });
  await assert.rejects(
    recordLessonResult(api, 'user', 'maths', 'fractions', 'Fractions', {
      correctMarks: 1,
      totalMarks: 2,
      perQ: [{ qid: 'q1', correct: false, got: 0, marks: 1 }],
    }),
    (error) => error.personalDomain === 'mistakes',
  );
  assert.equal(calls.savedPlan.days[0].status, 'done');
});

test('dateKey is stable calendar-local', () => {
  assert.equal(dateKey(new Date(2026, 8, 1, 10, 0)), '2026-09-01');
});
