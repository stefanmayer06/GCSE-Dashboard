import { homeHeadline, mostDue, summarizeOverall, weakestSubject } from './home';
import type { SubjectSummary } from './home';

const base = (overrides: Partial<SubjectSummary> = {}): SubjectSummary => ({
  subject: 'maths',
  progress: { xp: 0, level: 1, xpInto: 0, xpNeeded: 100, streak: 0, streakFreezes: 1, accuracy: null, lessons: 0, tests: 0, practiceAnswered: 0, history: [] },
  due: 0,
  faded: 0,
  error: null,
  ...overrides,
});

test('summarizes overall status across all subjects', () => {
  const overall = summarizeOverall([
    base({ subject: 'maths', progress: { ...base().progress!, xp: 120, tests: 2, practiceAnswered: 30, lessons: 3, streak: 4 }, due: 2 }),
    base({ subject: 'maths-higher', progress: { ...base().progress!, xp: 40, tests: 1, practiceAnswered: 10, lessons: 1, streak: 2 }, due: 0 }),
    base({ subject: 'english', due: 1 }),
  ]);
  expect(overall.totalXp).toBe(160);
  expect(overall.totalTests).toBe(3);
  expect(overall.totalDue).toBe(3);
  expect(overall.bestStreak).toBe(4);
  expect(overall.startedSubjects).toBe(2);
});

test('picks weakest and most-due subjects honestly', () => {
  const weak = weakestSubject([
    base({ subject: 'maths', progress: { ...base().progress!, accuracy: 72, practiceAnswered: 20 } }),
    base({ subject: 'maths-higher', progress: { ...base().progress!, accuracy: 41, practiceAnswered: 12 } }),
    base({ subject: 'english', progress: { ...base().progress!, accuracy: 88, practiceAnswered: 8 } }),
  ]);
  expect(weak?.subject).toBe('maths-higher');
  const due = mostDue([base({ due: 0 }), base({ subject: 'maths-higher', due: 3 }), base({ subject: 'english', due: 1 })]);
  expect(due?.subject).toBe('maths-higher');
  expect(mostDue([base(), base()])).toBeNull();
});

test('headlines stay encouraging and specific', () => {
  expect(homeHeadline({ totalXp: 0, totalTests: 0, totalAnswered: 0, totalLessons: 0, totalDue: 0, bestStreak: 0, activeSubjects: 3, startedSubjects: 0 }).title).toMatch(/trail starts/i);
  expect(homeHeadline({ totalXp: 10, totalTests: 1, totalAnswered: 12, totalLessons: 1, totalDue: 4, bestStreak: 2, activeSubjects: 3, startedSubjects: 2 }).title).toMatch(/retry/i);
});
