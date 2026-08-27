import assert from 'node:assert/strict';
import test from 'node:test';

import { rowToProgress } from '../src/storage/supabase.js';

test('Supabase progress rows expose derived summary fields for the dashboard', () => {
  const row = {
    xp: 120,
    streak: 3,
    last_active_date: '2026-08-27',
    tests_taken: 4,
    practice_answered: 32,
    total_test_marks: 240,
    total_test_correct: 132,
    topic_stats: { fractions: { correct: 5, total: 6 } },
    completed_lessons: ['fractions', 'ratio'],
  };
  const progress = rowToProgress(row);
  assert.equal(progress.testsTaken, 4);
  assert.equal(progress.overallPercent, 55);
  assert.equal(progress.level, 2);
  assert.equal(progress.xpInto, 70);
  assert.equal(progress.xpNeeded, 150);
  assert.equal(progress.lessonsCompleted, 2);
  assert.deepEqual(progress.completedLessonIds, ['fractions', 'ratio']);
});

test('Supabase progress row reports null average before any paper is marked', () => {
  const progress = rowToProgress({
    xp: 0,
    streak: 0,
    last_active_date: null,
    tests_taken: 0,
    practice_answered: 0,
    total_test_marks: 0,
    total_test_correct: 0,
    topic_stats: {},
    completed_lessons: [],
  });
  assert.equal(progress.overallPercent, null);
  assert.equal(progress.level, 1);
});