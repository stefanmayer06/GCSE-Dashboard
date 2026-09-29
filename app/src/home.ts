import type { Subject } from './theme';
import { parseProgress, type TodayProgress } from './today/model';

export type SubjectSummary = {
  subject: Subject;
  progress: TodayProgress | null;
  due: number;
  faded: number;
  error: string | null;
};

export type OverallStatus = {
  totalXp: number;
  totalTests: number;
  totalAnswered: number;
  totalLessons: number;
  totalDue: number;
  bestStreak: number;
  activeSubjects: number;
  startedSubjects: number;
};

export function summarizeOverall(summaries: SubjectSummary[]): OverallStatus {
  let totalXp = 0;
  let totalTests = 0;
  let totalAnswered = 0;
  let totalLessons = 0;
  let totalDue = 0;
  let bestStreak = 0;
  let startedSubjects = 0;
  for (const s of summaries) {
    if (!s.progress) {
      totalDue += s.due;
      continue;
    }
    totalXp += s.progress.xp;
    totalTests += s.progress.tests;
    totalAnswered += s.progress.practiceAnswered;
    totalLessons += s.progress.lessons;
    totalDue += s.due;
    bestStreak = Math.max(bestStreak, s.progress.streak);
    if (s.progress.tests > 0 || s.progress.practiceAnswered > 0 || s.progress.lessons > 0) startedSubjects += 1;
  }
  return { totalXp, totalTests, totalAnswered, totalLessons, totalDue, bestStreak, activeSubjects: summaries.length, startedSubjects };
}

export function weakestSubject(summaries: SubjectSummary[]): SubjectSummary | null {
  const ranked = summaries
    .filter((s) => s.progress)
    .sort((a, b) => {
      const aa = a.progress!.accuracy ?? 101;
      const bb = b.progress!.accuracy ?? 101;
      if (aa !== bb) return aa - bb;
      return a.progress!.practiceAnswered - b.progress!.practiceAnswered;
    });
  return ranked[0] ?? null;
}

export function mostDue(summaries: SubjectSummary[]): SubjectSummary | null {
  const ranked = [...summaries].sort((a, b) => b.due - a.due);
  return ranked[0] && ranked[0].due > 0 ? ranked[0] : null;
}

export function homeHeadline(overall: OverallStatus): { title: string; body: string } {
  if (overall.startedSubjects === 0) return { title: 'Your trail starts here', body: 'Pick a study area below. Ten minutes on one topic beats an hour of staring — every miss gets a worked method.' };
  if (overall.totalDue > 0) return { title: `Retry the ${overall.totalDue} mistake${overall.totalDue === 1 ? '' : 's'} due today`, body: 'Sorting what you missed is worth more than anything else you could revise. The trail brings it back until it sticks.' };
  if (overall.totalTests === 0) return { title: 'Take the 10-question check', body: 'A quick diagnostic shows the trail where to start. No grade, no pressure — just a map.' };
  return { title: 'One step is enough today', body: 'Your weakest area is already marked. Small steps, real ones — rest is part of the plan.' };
}

export function subjectHeadline(subject: Subject, summary: SubjectSummary | null): string {
  if (!summary?.progress) return 'Not loaded yet — pull to refresh.';
  const p = summary.progress;
  if (p.tests === 0 && p.practiceAnswered === 0) return 'Fresh start — day one is whenever you open this.';
  const acc = p.accuracy == null ? 'no paper accuracy yet' : `${p.accuracy}% paper accuracy`;
  const due = summary.due > 0 ? ` · ${summary.due} due` : ' · nothing due';
  return `${p.lessons} lessons · ${p.tests} papers · ${acc}${due}`;
}

export function parseProgressSafe(payload: unknown): TodayProgress | null {
  try {
    return parseProgress(payload as Parameters<typeof parseProgress>[0]);
  } catch {
    return null;
  }
}

export function examTone(days: number | null): '' | 'soon' | 'urgent' | 'settled' {
  if (days == null || days < 0) return '';
  if (days <= 14) return 'urgent';
  if (days <= 45) return 'soon';
  return 'settled';
}
