import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createDb } from '../src/db.js';
import { createJsonStorage } from '../src/storage/index.js';

async function temporaryStorage(t) {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'gcse-rewards-'));
  const storage = createJsonStorage({ dataDir });
  t.after(async () => {
    await storage.close();
    await rm(dataDir, { recursive: true, force: true });
  });
  return { dataDir, storage };
}

function testResult(id, overrides = {}) {
  return {
    id,
    type: 'short',
    totalMarks: 10,
    correctMarks: 7,
    percent: 70,
    grade: 5,
    topicAccuracy: [{ id: 'fractions', percent: 70 }],
    ...overrides,
  };
}

test('first lesson completion awards 20 XP once and repeat attempts award score XP only', async (t) => {
  const { storage } = await temporaryStorage(t);
  const first = await createDb('reward-user', 'maths', storage).rewardActivity({
    scoreXp: 7,
    lessonId: 'fractions',
  });

  assert.deepEqual(
    {
      scoreXp: first.scoreXp,
      completionXp: first.completionXp,
      xpAwarded: first.xpAwarded,
      firstCompletion: first.firstCompletion,
    },
    { scoreXp: 7, completionXp: 20, xpAwarded: 27, firstCompletion: true },
  );
  assert.equal(first.progress.xp, 27);
  assert.deepEqual(first.progress.completedLessonIds, ['fractions']);
  assert.equal(first.progress.lessonsCompleted, 1);

  const repeat = await createDb('reward-user', 'maths', storage).rewardActivity({
    scoreXp: 4,
    lessonId: 'fractions',
  });
  assert.equal(repeat.scoreXp, 4);
  assert.equal(repeat.completionXp, 0);
  assert.equal(repeat.xpAwarded, 4);
  assert.equal(repeat.firstCompletion, false);
  assert.equal(repeat.progress.xp, 31);
  assert.equal(repeat.progress.lessonsCompleted, 1);
});

test('reward metadata reports a level crossing using the existing level formula', async (t) => {
  const { storage } = await temporaryStorage(t);
  const db = createDb('level-user', 'english', storage);
  await db.rewardActivity({ scoreXp: 49 });
  const crossing = await db.rewardActivity({ scoreXp: 1 });

  assert.equal(crossing.levelBefore, 1);
  assert.equal(crossing.levelAfter, 2);
  assert.equal(crossing.progress.level, 2);
  assert.equal(crossing.progress.xp, 50);
});

test('legacy topic activity counts as completion and malformed completion data is normalized', async (t) => {
  const { dataDir, storage } = await temporaryStorage(t);
  const userDir = path.join(dataDir, 'users', 'legacy-user');
  await mkdir(userDir, { recursive: true });
  await writeFile(
    path.join(userDir, 'maths.json'),
    JSON.stringify({
      xp: 12,
      topicStats: {
        decimals: { correct: 2, total: 3 },
        untouched: { correct: 0, total: 0 },
      },
    }),
  );

  const db = createDb('legacy-user', 'maths', storage);
  const progress = await db.progress();
  assert.deepEqual(progress.completedLessonIds, ['decimals']);
  assert.doesNotThrow(() => JSON.stringify(progress));

  const reward = await db.rewardActivity({ scoreXp: 5, lessonId: 'decimals' });
  assert.equal(reward.firstCompletion, false);
  assert.equal(reward.completionXp, 0);
  assert.equal(reward.xpAwarded, 5);
  assert.equal(reward.progress.xp, 17);
});

test('modern incomplete practice is not inferred as a completed lesson', async (t) => {
  const { dataDir, storage } = await temporaryStorage(t);
  const userDir = path.join(dataDir, 'users', 'modern-user');
  await mkdir(userDir, { recursive: true });
  await writeFile(
    path.join(userDir, 'maths.json'),
    JSON.stringify({
      xp: 0,
      completedLessons: [],
      topicStats: { fractions: { correct: 0, total: 4 } },
    }),
  );

  const reward = await createDb('modern-user', 'maths', storage).rewardActivity({
    lessonId: 'fractions',
  });
  assert.equal(reward.firstCompletion, true);
  assert.equal(reward.completionXp, 20);
});

test('malformed completion data falls back to legacy topic activity', async (t) => {
  const { dataDir, storage } = await temporaryStorage(t);
  const userDir = path.join(dataDir, 'users', 'malformed-user');
  await mkdir(userDir, { recursive: true });
  await writeFile(
    path.join(userDir, 'maths.json'),
    JSON.stringify({
      completedLessons: 'not-an-array',
      topicStats: { decimals: { correct: 1, total: 2 } },
    }),
  );

  const reward = await createDb('malformed-user', 'maths', storage).rewardActivity({
    lessonId: 'decimals',
  });
  assert.equal(reward.firstCompletion, false);
  assert.equal(reward.completionXp, 0);
});

test('lesson completions are isolated by user and subject', async (t) => {
  const { storage } = await temporaryStorage(t);
  const [mathsA, englishA, mathsB] = await Promise.all([
    createDb('isolation-a', 'maths', storage).rewardActivity({ lessonId: 'algebra' }),
    createDb('isolation-a', 'english', storage).rewardActivity({ lessonId: 'algebra' }),
    createDb('isolation-b', 'maths', storage).rewardActivity({ lessonId: 'algebra' }),
  ]);

  for (const reward of [mathsA, englishA, mathsB]) {
    assert.equal(reward.firstCompletion, true);
    assert.equal(reward.completionXp, 20);
    assert.equal(reward.progress.xp, 20);
  }

  const repeat = await createDb('isolation-a', 'maths', storage).rewardActivity({
    lessonId: 'algebra',
  });
  assert.equal(repeat.firstCompletion, false);
  assert.equal(repeat.progress.xp, 20);
  assert.equal(englishA.progress.lessonsCompleted, 1);
  assert.equal(mathsB.progress.lessonsCompleted, 1);
});

test('concurrent db instances do not lose XP, tests, practice, or chat', async (t) => {
  const { storage } = await temporaryStorage(t);
  const dbs = [
    createDb('concurrent-user', 'maths', storage),
    createDb('concurrent-user', 'maths', storage),
  ];
  const operations = [];

  for (let index = 0; index < 25; index += 1) {
    const db = dbs[index % dbs.length];
    operations.push(db.addXp(1));
    operations.push(db.recordTest(testResult(`test-${index}`, {
      totalMarks: 2,
      correctMarks: 1,
      percent: 50,
    })));
    operations.push(db.recordPractice({ topicId: 'fractions', correct: 1, total: 2 }));
  }
  for (let index = 0; index < 45; index += 1) {
    operations.push(dbs[index % dbs.length].pushChat('user', `message-${index}`));
  }
  await Promise.all(operations);

  const state = await dbs[0].loadDb();
  assert.equal(state.xp, 25);
  assert.equal(state.testsTaken, 25);
  assert.equal(state.totalTestMarks, 50);
  assert.equal(state.totalTestCorrect, 25);
  assert.equal(state.history.length, 25);
  assert.equal(new Set(state.history.map(({ id }) => id)).size, 25);
  assert.equal(state.practiceAnswered, 50);
  assert.deepEqual(state.topicStats.fractions, { correct: 25, total: 50 });
  assert.equal(state.chat.length, 45);
  assert.equal((await dbs[1].progress()).history.length, 20);
  assert.equal((await dbs[1].getChatHistory()).length, 40);
});

test('composite record and reward methods use one progress mutation each', async (t) => {
  const { storage } = await temporaryStorage(t);
  let mutationCalls = 0;
  const countingStorage = {
    ...storage,
    mutateProgress(...args) {
      mutationCalls += 1;
      return storage.mutateProgress(...args);
    },
  };
  const db = createDb('composite-user', 'maths', countingStorage);

  const testReward = await db.recordTestAndReward({
    result: testResult('paper-1'),
    scoreXp: 14,
  });
  assert.equal(mutationCalls, 1);
  assert.equal(testReward.progress.testsTaken, 1);
  assert.equal(testReward.progress.history[0].id, 'paper-1');
  assert.equal(testReward.progress.xp, 14);

  const singleReward = await db.recordPracticeAndReward({
    records: { topicId: 'fractions', correct: 2, total: 3 },
    scoreXp: 2,
    lessonId: 'fractions',
  });
  assert.equal(mutationCalls, 2);
  assert.equal(singleReward.firstCompletion, true);
  assert.equal(singleReward.progress.practiceAnswered, 3);
  assert.deepEqual(singleReward.progress.topicStats.fractions, { correct: 2, total: 3 });

  const manyReward = await db.recordPracticeAndReward({
    records: [
      { topicId: 'fractions', correct: 1, total: 2 },
      { topicId: 'algebra', correct: 3, total: 4 },
    ],
    scoreXp: 4,
  });
  assert.equal(mutationCalls, 3);
  assert.equal(manyReward.progress.practiceAnswered, 9);
  assert.deepEqual(manyReward.progress.topicStats.fractions, { correct: 3, total: 5 });
  assert.deepEqual(manyReward.progress.topicStats.algebra, { correct: 3, total: 4 });
  assert.equal(manyReward.progress.xp, 40);
});

test('finalizeStudySession records and rewards once and replays its stored response', async (t) => {
  const { storage } = await temporaryStorage(t);
  const criteria = { id: 'paper-session', userId: 'session-user', subject: 'maths', kind: 'paper' };
  await storage.createStudySession({
    ...criteria,
    payload: { answers: [] },
    expiresAt: new Date(Date.now() + 60_000),
  });
  const db = createDb(criteria.userId, criteria.subject, storage);
  const operation = {
    testResult: testResult('paper-session', {
      totalMarks: 5,
      correctMarks: 4,
      percent: 80,
    }),
    practiceRecords: [
      { topicId: 'fractions', correct: 2, total: 3 },
      { topicId: 'algebra', correct: 1, total: 2 },
    ],
    scoreXp: 8,
    lessonId: 'fractions',
    response: { correctMarks: 4, totalMarks: 5 },
  };

  const finalized = await db.finalizeStudySession(criteria, operation);
  assert.equal(finalized.status, 'completed');
  assert.equal(finalized.replayed, false);
  assert.equal(finalized.result.correctMarks, 4);
  assert.equal(finalized.result.reward.scoreXp, 8);
  assert.equal(finalized.result.reward.completionXp, 20);
  assert.equal(finalized.result.reward.xpAwarded, 28);
  assert.equal('progress' in finalized.result.reward, false);
  assert.equal(finalized.result.progress.xp, 28);
  assert.equal(finalized.result.progress.testsTaken, 1);
  assert.equal(finalized.result.progress.practiceAnswered, 5);
  assert.deepEqual(finalized.result.progress.completedLessonIds, ['fractions']);

  const replay = await db.finalizeStudySession(criteria, {
    testResult: testResult('duplicate'),
    practiceRecords: { topicId: 'fractions', correct: 100, total: 100 },
    scoreXp: 100,
    response: { changed: true },
  });
  assert.equal(replay.status, 'completed');
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.result, finalized.result);

  const progress = await db.progress();
  assert.equal(progress.xp, 28);
  assert.equal(progress.testsTaken, 1);
  assert.equal(progress.practiceAnswered, 5);
  assert.equal(progress.history[0].id, 'paper-session');
});
