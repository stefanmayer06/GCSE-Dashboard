import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createJsonStorage } from '../src/storage/json.js';
import {
  normalizeAttempt,
  normalizeEvent,
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
    { id: 'm1', qid: 'q1', topicName: 'Fractions', prompt: 'Find a half', answer: 2, capturedAt: '2026-09-01T10:00:00.000Z', dueDates: ['2026-09-02T00:00:00.000Z'], reviewIndex: 0 },
    { id: 'm1', qid: 'dup', topicName: 'Dup' },
    { id: 'm2', qid: 'q2', topic: 'Ratio', question: 'Simplify', due: [1], mastered: true },
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].topicName, 'Fractions');
  assert.equal(rows[0].answer, 2);
  assert.equal(rows[1].topicName, 'Ratio');
  assert.equal(rows[1].prompt, 'Simplify');
  assert.equal(rows[1].mastered, true);
  assert.equal(rows[0].mastered, false);
});

test('mistake rows carry classification, warm-up and retry evidence', () => {
  const rows = normalizeMistakeRows([
    {
      id: 'm1',
      qid: 'q1',
      topicId: 'fractions',
      topicName: 'Fractions',
      prompt: 'Find a half',
      answer: 2,
      errorType: 'misread',
      warmupCount: 2,
      lastReviewedAt: '2026-09-05T10:00:00.000Z',
      correctAnswer: '3/4',
      workedSolution: ['Simplify both fractions', 'Cross-check by multiplying back'],
    },
    { id: 'm2', errorType: 'nonsense' },
  ]);
  assert.equal(rows[0].errorType, 'misread');
  assert.equal(rows[0].warmupCount, 2);
  assert.equal(rows[0].lastReviewedAt, '2026-09-05T10:00:00.000Z');
  assert.equal(rows[0].correctAnswer, '3/4');
  assert.deepEqual(rows[0].workedSolution, ['Simplify both fractions', 'Cross-check by multiplying back']);
  // Unknown classifications are dropped, never guessed.
  assert.equal('errorType' in rows[1], false);
});

test('event payloads are validated against the documented taxonomy', () => {
  assert.equal(normalizeEvent({ name: 'mistake_retry', subject: 'maths', metadata: { reviewIndex: 1 } }).name, 'mistake_retry');
  assert.deepEqual(normalizeEvent({ name: 'diagnostic_start', metadata: { questionCount: 10 } }).metadata, { questionCount: 10 });
  // Metadata is flattened to safe scalar values.
  const cleaned = normalizeEvent({ name: 'session_marked', metadata: { nested: { deep: true }, ok: 'yes', n: 3 } }).metadata;
  assert.equal(cleaned.nested, undefined);
  assert.equal(cleaned.ok, 'yes');
  assert.equal(cleaned.n, 3);
  assert.throws(() => normalizeEvent({ name: 'made_up_event' }), /Unknown event name/);
  assert.throws(() => normalizeEvent({}), /Unknown event name/);
  assert.throws(() => normalizeEvent({ name: 'signup', subject: 'latin' }), /Invalid event subject/);
});

test('paper attempt payloads normalize defensively', () => {
  const attempt = normalizeAttempt({
    sessionId: 'session-1',
    paperCode: '8300/1F',
    paperName: 'Paper 1',
    type: 'short',
    tier: 'foundation',
    totalMarks: 40,
    correctMarks: 31,
    percent: 78,
    grade: 4,
    durationSec: 3010,
    completedAt: '2026-09-01T10:00:00.000Z',
    result: { perQuestion: [] },
  });
  assert.equal(attempt.sessionId, 'session-1');
  assert.equal(attempt.type, 'short');
  assert.equal(attempt.grade, 4);
  assert.equal(attempt.result.perQuestion.length, 0);
  assert.throws(() => normalizeAttempt({}), /needs a session id/);
  const clamped = normalizeAttempt({ sessionId: 's2', percent: 180, grade: 42, durationSec: -5 });
  assert.equal(clamped.percent, null);
  assert.equal(clamped.grade, null);
  assert.equal(clamped.durationSec, null);
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

test('JSON storage retains paper attempts with the documented cap', async (t) => {
  const { storage } = await temporaryStorage(t);
  await storage.init();
  assert.deepEqual(await storage.listAttempts('user-a', 'maths'), []);

  for (let index = 0; index < 52; index += 1) {
    await storage.saveAttempt('user-a', 'maths', {
      sessionId: `session-${index}`,
      paperCode: '8300/1F',
      type: 'full',
      totalMarks: 80,
      correctMarks: 40 + index,
      percent: 50,
      grade: 4,
      durationSec: 3000,
      completedAt: new Date(Date.UTC(2026, 7, 1 + index)).toISOString(),
      result: { id: `session-${index}` },
    });
  }
  const attempts = await storage.listAttempts('user-a', 'maths', 50);
  assert.equal(attempts.length, 50, 'only the most recent 50 attempts are retained');
  assert.equal(attempts[0].sessionId, 'session-51');
  assert.equal(attempts[0].result.id, 'session-51');

  // Attempts are scoped per user and subject and can be re-saved idempotently.
  await storage.saveAttempt('user-a', 'maths', { sessionId: 'session-51', totalMarks: 80, correctMarks: 99 });
  const updated = await storage.listAttempts('user-a', 'maths', 1);
  assert.equal(updated[0].correctMarks, 99);
  assert.equal((await storage.listAttempts('user-b', 'maths')).length, 0);
  assert.equal((await storage.listAttempts('user-a', 'english')).length, 0);
});

test('JSON storage records and summarises the product event trail', async (t) => {
  const { storage } = await temporaryStorage(t);
  await storage.init();

  await storage.recordEvent('user-a', 'signup', { metadata: { source: 'direct' } });
  await storage.recordEvent('user-a', 'diagnostic_complete', { subject: 'maths', metadata: { percent: 60 } });
  await storage.recordEvent('user-a', 'session_marked', { subject: 'maths', metadata: { kind: 'paper' } });
  await storage.recordEvent('user-b', 'signup', {});

  const summary = await storage.getEventSummary('user-a');
  assert.deepEqual(summary.counts, { signup: 1, diagnostic_complete: 1, session_marked: 1 });
  assert.equal(summary.activated, true, 'activation needs a completed diagnostic and a marked session');
  assert.ok(summary.firstSeen && summary.lastSeen);

  const other = await storage.getEventSummary('user-b');
  assert.equal(other.activated, false);

  // Retention pruning removes only events older than the window.
  await storage.recordEvent('user-a', 'mistake_retry', {});
  const pruned = await storage.pruneEvents(30);
  assert.equal(pruned, 0, 'fresh events are kept');
  const after = await storage.getEventSummary('user-a');
  assert.equal(after.counts.mistake_retry, 1);
});
