import assert from 'node:assert/strict';
import test from 'node:test';

import { createJsonStorage } from '../src/storage/json.js';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { attemptMetadata, markAttemptsFor } from '../src/subjects/english/router.js';

test('English attempt metadata describes improvements and does not consume failed marks', () => {
  const attempts = [{ marks: 2 }, { marks: 5 }];
  assert.deepEqual(attemptMetadata(attempts, 7), {
    attemptNo: 3,
    previousMarks: 5,
    markDelta: 2,
    canResubmit: false,
  });
  assert.deepEqual(attemptMetadata(attempts), {
    attemptNo: 3,
    previousMarks: 5,
    markDelta: null,
    canResubmit: true,
  });
  assert.deepEqual(markAttemptsFor({ markAttempts: { q1: [{ marks: 1 }, { marks: 2 }, { marks: 3 }, { marks: 4 }] } }, 'q1'), [
    { marks: 1 }, { marks: 2 }, { marks: 3 },
  ]);
});

test('English mark attempt payloads remain immutable and preserve the latest compatibility mark', async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'english-attempts-'));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  const storage = createJsonStorage({ dataDir });
  const criteria = { id: 'attempt-session', userId: 'user-a', subject: 'english', kind: 'practice' };
  await storage.createStudySession({
    ...criteria,
    expiresAt: new Date(Date.now() + 60_000),
    payload: { questions: [{ id: 'q1' }], aiMarks: {}, markAttempts: {} },
  });

  const firstFeedback = { ai: true, marks: 2, strengths: 'Clear point' };
  await storage.updateStudySession(criteria, (session) => ({
    payload: {
      ...session.payload,
      aiMarks: { q1: 2 },
      markAttempts: {
        q1: [{ answer: 'First answer', feedback: firstFeedback, timestamp: '2026-09-01T10:00:00.000Z', marks: 2 }],
      },
    },
  }));
  firstFeedback.marks = 99;
  await storage.updateStudySession(criteria, (session) => ({
    payload: {
      ...session.payload,
      aiMarks: { ...session.payload.aiMarks, q1: 4 },
      markAttempts: {
        ...session.payload.markAttempts,
        q1: [...session.payload.markAttempts.q1, {
          answer: 'Improved answer',
          feedback: { ai: true, marks: 4, strengths: 'Developed analysis' },
          timestamp: '2026-09-01T10:05:00.000Z',
          marks: 4,
        }],
      },
    },
  }));

  const saved = (await storage.getStudySession(criteria)).session.payload;
  assert.equal(saved.aiMarks.q1, 4);
  assert.equal(saved.markAttempts.q1.length, 2);
  assert.equal(saved.markAttempts.q1[0].feedback.marks, 2);
  assert.equal(saved.markAttempts.q1[0].answer, 'First answer');
});
