import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createJsonStorage } from '../src/storage/json.js';
import {
  normalizeMistakeRows,
  normalizePlan,
  normalizePreferences,
} from '../src/personal-model.js';

async function temporaryStorage(t) {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'gcse-personal-'));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  return { dataDir, storage: createJsonStorage({ dataDir }) };
}

test('personal model normalizes preferences, plans and mistake rows defensively', () => {
  assert.deepEqual(normalizePreferences(null), { examDate: '', targetGrade: '', passMode: 'balanced' });
  assert.deepEqual(normalizePreferences({ examDate: '2027-06-01', targetGrade: '6', passMode: 'foundation-pass' }), {
    examDate: '2027-06-01', targetGrade: '6', passMode: 'foundation-pass',
  });
  assert.equal(normalizePreferences({ examDate: 'nonsense' }).examDate, '');
  assert.equal(normalizePreferences({ passMode: 'chaos' }).passMode, 'balanced');

  assert.equal(normalizePlan(null), undefined);
  assert.throws(() => normalizePlan({ from: 'nonsense' }), /valid start date/);
  assert.throws(() => normalizePlan({ from: '2026-09-01', days: [] }), /1 and 14 days/);
  const plan = normalizePlan({
    from: '2026-09-01',
    days: [
      { date: '2026-09-01', task: 'Fractions', topicId: 'fractions', status: 'done', result: { percent: 80, correctMarks: 4, totalMarks: 5, xpEarned: 12, completedAt: '2026-09-01T10:00:00.000Z', weakTopics: ['fractions'] } },
      { date: '2026-09-02', task: 'Ratio' },
    ],
    intent: { date: '2026-09-01', topicId: 'fractions' },
  });
  assert.equal(plan.days[0].status, 'done');
  assert.equal(plan.days[0].result.percent, 80);
  assert.deepEqual(plan.days[0].result.weakTopics, ['fractions']);
  assert.deepEqual(plan.intent, { date: '2026-09-01', topicId: 'fractions' });
  // A day without a result carries no result key.
  assert.equal('result' in plan.days[1], false);
  // A day result without completedAt is dropped, not invented.
  assert.equal('result' in normalizePlan({ from: '2026-09-01', days: [{ date: '2026-09-01', result: { percent: 50 } }] }).days[0], false);

  const rows = normalizeMistakeRows([
    { id: 'm1', qid: 'q1', topicName: 'Fractions', prompt: 'Find a half', answer: '2', capturedAt: '2026-09-01T10:00:00.000Z', dueDates: ['2026-09-02T00:00:00.000Z'], reviewIndex: 0 },
    { id: 'm1', qid: 'dup', topicName: 'Dup' },
    { id: 'm2', qid: 'q2', topic: 'Ratio', question: 'Simplify', due: [1], mastered: true },
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].topicName, 'Fractions');
  assert.equal(rows[1].topicName, 'Ratio');
  assert.equal(rows[1].prompt, 'Simplify');
  assert.equal(rows[1].mastered, true);
  assert.equal(rows[0].mastered, false);
});

test('JSON storage persists personal data per user and subject', async (t) => {
  const { storage } = await temporaryStorage(t);
  await storage.init();
  assert.deepEqual(await storage.getPersonal('user-a', 'maths'), { preferences: null, plan: null, mistakes: [] });

  const preferences = await storage.savePreferences('user-a', 'maths', { examDate: '2027-06-01', targetGrade: '6', passMode: 'foundation-pass' });
  assert.deepEqual(preferences, { examDate: '2027-06-01', targetGrade: '6', passMode: 'foundation-pass' });

  const plan = normalizePlan({
    from: '2026-09-01',
    days: [{ date: '2026-09-01', task: 'Fractions', topicId: 'fractions' }, { date: '2026-09-02', task: 'Ratio', topicId: 'ratio' }],
  });
  await storage.savePlan('user-a', 'maths', plan);
  const mistakes = await storage.saveMistakes('user-a', 'maths', normalizeMistakeRows([
    { id: 'm1', qid: 'q1', topicName: 'Fractions', prompt: 'Find a half' },
  ]));

  const state = await storage.getPersonal('user-a', 'maths');
  assert.deepEqual(state.preferences, preferences);
  assert.deepEqual(state.plan, plan);
  assert.equal(state.mistakes.length, 1);
  assert.equal(state.mistakes[0].id, 'm1');

  // Subject and user isolation.
  assert.deepEqual((await storage.getPersonal('user-a', 'english')).plan, null);
  assert.deepEqual((await storage.getPersonal('user-b', 'maths')).mistakes, []);

  // Replace semantics: saving a new list replaces the old one.
  await storage.saveMistakes('user-a', 'maths', []);
  assert.deepEqual((await storage.getPersonal('user-a', 'maths')).mistakes, []);
  await storage.savePlan('user-a', 'maths', null);
  assert.deepEqual((await storage.getPersonal('user-a', 'maths')).plan, null);
});