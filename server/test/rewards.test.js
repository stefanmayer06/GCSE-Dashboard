import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

const dataDir = await mkdtemp(path.join(os.tmpdir(), 'gcse-rewards-'));
process.env.DATA_DIR = dataDir;

const { createDb } = await import('../src/db.js');

after(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

test('first lesson completion awards 20 XP once and repeat attempts award score XP only', () => {
  const first = createDb('reward-user', 'maths').rewardActivity({ scoreXp: 7, lessonId: 'fractions' });

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

  const repeat = createDb('reward-user', 'maths').rewardActivity({ scoreXp: 4, lessonId: 'fractions' });
  assert.equal(repeat.scoreXp, 4);
  assert.equal(repeat.completionXp, 0);
  assert.equal(repeat.xpAwarded, 4);
  assert.equal(repeat.firstCompletion, false);
  assert.equal(repeat.progress.xp, 31);
  assert.equal(repeat.progress.lessonsCompleted, 1);
});

test('reward metadata reports a level crossing using the existing level formula', () => {
  const db = createDb('level-user', 'english');
  db.rewardActivity({ scoreXp: 49 });
  const crossing = db.rewardActivity({ scoreXp: 1 });

  assert.equal(crossing.levelBefore, 1);
  assert.equal(crossing.levelAfter, 2);
  assert.equal(crossing.progress.level, 2);
  assert.equal(crossing.progress.xp, 50);
});

test('legacy topic activity counts as completion and malformed completion data is normalized', async () => {
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

  const db = createDb('legacy-user', 'maths');
  assert.deepEqual(db.progress().completedLessonIds, ['decimals']);
  assert.doesNotThrow(() => JSON.stringify(db.progress()));

  const reward = db.rewardActivity({ scoreXp: 5, lessonId: 'decimals' });
  assert.equal(reward.firstCompletion, false);
  assert.equal(reward.completionXp, 0);
  assert.equal(reward.xpAwarded, 5);
  assert.equal(reward.progress.xp, 17);
});

test('modern incomplete practice is not inferred as a completed lesson', async () => {
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

  const reward = createDb('modern-user', 'maths').rewardActivity({ lessonId: 'fractions' });
  assert.equal(reward.firstCompletion, true);
  assert.equal(reward.completionXp, 20);
});

test('malformed completion data falls back to legacy topic activity', async () => {
  const userDir = path.join(dataDir, 'users', 'malformed-user');
  await mkdir(userDir, { recursive: true });
  await writeFile(
    path.join(userDir, 'maths.json'),
    JSON.stringify({
      completedLessons: 'not-an-array',
      topicStats: { decimals: { correct: 1, total: 2 } },
    }),
  );

  const reward = createDb('malformed-user', 'maths').rewardActivity({ lessonId: 'decimals' });
  assert.equal(reward.firstCompletion, false);
  assert.equal(reward.completionXp, 0);
});

test('lesson completions are isolated by user and subject', () => {
  const mathsA = createDb('isolation-a', 'maths').rewardActivity({ lessonId: 'algebra' });
  const englishA = createDb('isolation-a', 'english').rewardActivity({ lessonId: 'algebra' });
  const mathsB = createDb('isolation-b', 'maths').rewardActivity({ lessonId: 'algebra' });

  for (const reward of [mathsA, englishA, mathsB]) {
    assert.equal(reward.firstCompletion, true);
    assert.equal(reward.completionXp, 20);
    assert.equal(reward.progress.xp, 20);
  }

  const repeat = createDb('isolation-a', 'maths').rewardActivity({ lessonId: 'algebra' });
  assert.equal(repeat.firstCompletion, false);
  assert.equal(repeat.progress.xp, 20);
  assert.equal(englishA.progress.lessonsCompleted, 1);
  assert.equal(mathsB.progress.lessonsCompleted, 1);
});
