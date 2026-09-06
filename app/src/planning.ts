import type { Subject } from './theme';

export type PassMode = 'balanced' | 'foundation-pass';
export type PlanningPreferences = { examDate: string; targetGrade: string; passMode: PassMode; restDays: number[]; minutesPerDay: number | null };
export const defaultPlanningPreferences: PlanningPreferences = { examDate: '', targetGrade: '', passMode: 'balanced', restDays: [], minutesPerDay: null };

export type MissionResult = {
  percent: number;
  correctMarks: number;
  totalMarks: number;
  xpEarned: number | null;
  completedAt: string;
  weakTopics: string[];
};

export type PlanDay = {
  date: string;
  label: string;
  task: string;
  minutes: number;
  topicId?: string;
  status: 'todo' | 'done';
  result?: MissionResult;
  rest?: boolean;
};

export type PlanState = {
  from: string;
  days: PlanDay[];
  intent?: { date: string; topicId?: string };
};

export type FocusTopic = { id: string; name: string };

const fallbackTasks = ['Diagnostic', 'Core skills', 'Mixed recall'];
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const finite = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
const text = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value : undefined;

export function parsePlanningPreferences(value: string | null): PlanningPreferences {
  if (!value) return defaultPlanningPreferences;
  try {
    const raw = JSON.parse(value) as Record<string, unknown>;
    return {
      examDate: typeof raw.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.examDate) ? raw.examDate : '',
      targetGrade: typeof raw.targetGrade === 'string' ? raw.targetGrade.slice(0, 2) : '',
      passMode: raw.passMode === 'foundation-pass' ? 'foundation-pass' : 'balanced',
      restDays: Array.isArray(raw.restDays) ? [...new Set((raw.restDays as unknown[]).filter((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6))].sort((a, b) => a - b) : [],
      minutesPerDay: Number.isInteger(raw.minutesPerDay) ? Math.max(5, Math.min(120, raw.minutesPerDay as number)) : null,
    };
  } catch { return defaultPlanningPreferences; }
}

export function planningKey(userId: string | undefined, subject: Subject) { return `planning:${userId || 'anonymous'}:${subject}`; }
export function planStateKey(userId: string | undefined, subject: Subject) { return `planning:${userId || 'anonymous'}:${subject}:plan`; }
export function daysToExam(examDate: string, now = new Date()) {
  const end = Date.parse(`${examDate}T12:00:00`);
  if (!Number.isFinite(end)) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime();
  return Math.max(0, Math.ceil((end - today) / 86_400_000));
}

export function dateKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function minutesFor(subject: Subject, passMode: PassMode, preferences?: PlanningPreferences) {
  if (preferences && Number.isInteger(preferences.minutesPerDay)) {
    return Math.max(5, Math.min(120, preferences.minutesPerDay as number));
  }
  if (passMode === 'foundation-pass' && subject === 'maths') return 15;
  return subject === 'english' ? 20 : 15;
}

const weekdayOf = (date: Date) => (date.getDay() + 6) % 7; // Monday = 0 … Sunday = 6

export function buildPlan(subject: Subject, passMode: PassMode, focus: FocusTopic[], now = new Date(), preferences?: PlanningPreferences): PlanState {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const restDays = new Set(preferences?.restDays ?? []);
  const minutes = minutesFor(subject, passMode, preferences);
  let cursor = 0;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * 86_400_000);
    if (restDays.has(weekdayOf(date))) {
      return {
        date: dateKey(date),
        label: index === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' }),
        task: 'Rest day',
        minutes: 0,
        status: 'todo' as const,
        rest: true as const,
      };
    }
    const isReview = index === 3 || index === 6;
    const item = isReview ? undefined : focus.length ? focus[cursor++ % focus.length] : undefined;
    const task = isReview ? (index === 6 ? 'Weekly review' : 'Mistake retry') : item?.name ?? fallbackTasks[index % fallbackTasks.length];
    return {
      date: dateKey(date),
      label: index === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' }),
      task,
      minutes,
      ...(item?.id ? { topicId: item.id } : {}),
      status: 'todo' as const,
    };
  });
  return { from: dateKey(now), days };
}

// Swap two future days' work so a busy day never silently drops its mission.
export function movePlanDay(plan: PlanState, fromDate: string, toDate: string, today = dateKey()): PlanState | null {
  if (fromDate < today || toDate < today || fromDate === toDate) return null;
  const days = plan.days.map(day => ({ ...day }));
  const from = days.find(day => day.date === fromDate);
  const to = days.find(day => day.date === toDate);
  if (!from || !to || from.status === 'done' || to.status === 'done' || from.rest || to.rest) return null;
  const swap = { task: from.task, topicId: from.topicId, minutes: from.minutes };
  from.task = to.task; from.topicId = to.topicId; from.minutes = to.minutes;
  to.task = swap.task; to.topicId = swap.topicId; to.minutes = swap.minutes;
  return { ...plan, days };
}

// Milestones with real meaning; streak eras bank a freeze server-side.
const MILESTONE_DEFS = [
  { id: 'streak-7', kind: 'streak', at: 7, label: '7-day streak', detail: 'A full week — banks a streak freeze.' },
  { id: 'streak-30', kind: 'streak', at: 30, label: '30-day streak', detail: 'A full month — banks a streak freeze.' },
  { id: 'streak-100', kind: 'streak', at: 100, label: '100-day streak', detail: 'Century club — banks a streak freeze.' },
  { id: 'papers-1', kind: 'papers', at: 1, label: 'First timed paper', detail: 'A full paper under exam conditions.' },
  { id: 'papers-10', kind: 'papers', at: 10, label: '10 timed papers', detail: 'Double digits of exam-day practice.' },
  { id: 'papers-25', kind: 'papers', at: 25, label: '25 timed papers', detail: 'A whole exam season of papers.' },
  { id: 'lessons-5', kind: 'lessons', at: 5, label: '5 lessons completed', detail: 'Five topics learned and drilled.' },
  { id: 'lessons-25', kind: 'lessons', at: 25, label: '25 lessons completed', detail: 'Serious ground covered.' },
] as const;

export type Milestone = { id: string; kind: string; at: number; label: string; detail: string; value: number; reached: boolean };

export function milestonesFor(progress: { streak?: number; testsTaken?: number; lessonsCompleted?: number } | null): Milestone[] {
  const values: Record<string, number> = {
    streak: progress?.streak ?? 0,
    papers: progress?.testsTaken ?? 0,
    lessons: progress?.lessonsCompleted ?? 0,
  };
  return MILESTONE_DEFS.map(def => {
    const value = values[def.kind] ?? 0;
    return { ...def, value, reached: value >= def.at };
  });
}

// Fix-Up targeting: due mistake topics first, then weakest practised topics.
export function fixupTargets(topics: { id: string; accuracy?: number | null; answered?: number }[], mistakes: { topicId?: string; mastered?: boolean; dueDates?: string[]; reviewIndex?: number }[], limit = 5): string[] {
  const now = Date.now();
  const ordered: string[] = [];
  for (const row of mistakes) {
    if (row.mastered || !row.topicId) continue;
    const due = row.dueDates?.[row.reviewIndex ?? 0];
    if (due && Date.parse(due) <= now && !ordered.includes(row.topicId)) ordered.push(row.topicId);
  }
  const weak = topics
    .filter(t => (t.answered ?? 0) > 0 && t.accuracy != null)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
    .map(t => t.id);
  for (const id of weak) {
    if (ordered.length >= limit) break;
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered.slice(0, Math.max(1, limit));
}

const ENGLISH_WRITING = new Set(['creative-writing', 'argument-writing', 'accuracy']);

export function fixupEnglishPlan(topicIds: string[], limit = 5): { skillIds: string[]; kinds: string[]; lessons: string[] } {
  const quickfire: string[] = [];
  const lessons: string[] = [];
  for (const id of topicIds) {
    if (ENGLISH_WRITING.has(id)) { if (lessons.length < 2) lessons.push(id); }
    else if (quickfire.length < limit) quickfire.push(id);
    if (quickfire.length >= limit && lessons.length >= 2) break;
  }
  return {
    skillIds: quickfire.slice(0, limit),
    kinds: quickfire.includes('listing') ? ['listing', 'truefalse', 'analysis'] : ['analysis', 'truefalse', 'listing'],
    lessons,
  };
}

export function stablePlan(stored: PlanState | null, subject: Subject, passMode: PassMode, focus: FocusTopic[], now = new Date(), preferences?: PlanningPreferences) {
  const today = dateKey(now);
  if (stored && stored.from === today && Array.isArray(stored.days) && stored.days.length === 7) return { plan: stored, changed: false };
  return { plan: buildPlan(subject, passMode, focus, now, preferences), changed: true };
}

function parseMissionResult(value: unknown): MissionResult | undefined {
  const row = record(value);
  const completedAt = text(row.completedAt);
  if (!completedAt) return undefined;
  return {
    percent: finite(row.percent) ?? 0,
    correctMarks: finite(row.correctMarks) ?? 0,
    totalMarks: finite(row.totalMarks) ?? 0,
    xpEarned: finite(row.xpEarned) ?? null,
    completedAt,
    weakTopics: Array.isArray(row.weakTopics) ? (row.weakTopics as unknown[]).flatMap((entry) => text(entry) ?? text(record(entry).name) ?? []) : [],
  };
}

export function parsePlanState(value: string | null): PlanState | null {
  if (!value) return null;
  try {
    const raw = JSON.parse(value) as Record<string, unknown>;
    if (typeof raw.from !== 'string' || !Array.isArray(raw.days)) return null;
    const days = (raw.days as unknown[]).flatMap((entry) => {
      const row = record(entry);
      if (typeof row.date !== 'string' || typeof row.task !== 'string' || typeof row.label !== 'string') return [];
      const result = row.result === undefined ? undefined : parseMissionResult(row.result);
      return [{
        date: row.date,
        label: row.label,
        task: row.task,
        minutes: finite(row.minutes) ?? 15,
        ...(typeof row.topicId === 'string' && row.topicId ? { topicId: row.topicId } : {}),
        status: row.status === 'done' ? 'done' as const : 'todo' as const,
        ...(result ? { result } : {}),
        ...(row.rest === true ? { rest: true as const } : {}),
      }];
    });
    const intent = record(raw.intent);
    return days.length === 7 ? { from: raw.from, days, ...(typeof intent.date === 'string' ? { intent: { date: intent.date, ...(typeof intent.topicId === 'string' && intent.topicId ? { topicId: intent.topicId } : {}) } } : {}) } : null;
  } catch { return null; }
}

export function missionResultFromServer(payload: unknown, completedAt = new Date().toISOString()): MissionResult {
  const root = record(payload);
  const correctMarks = finite(root.correctMarks);
  const totalMarks = finite(root.totalMarks);
  const percent = finite(root.percent) ?? (correctMarks != null && totalMarks ? Math.round(correctMarks * 100 / totalMarks) : 0);
  const reward = record(root.reward);
  const xpEarned = finite(reward.scoreXp) ?? finite(reward.completionXp) ?? finite(root.xpEarned) ?? null;
  const weakTopics = Array.isArray(root.weakTopics) ? (root.weakTopics as unknown[]).flatMap((entry) => text(entry) ?? text(record(entry).name) ?? []) : [];
  return { percent, correctMarks: correctMarks ?? 0, totalMarks: totalMarks ?? 0, xpEarned, completedAt, weakTopics: weakTopics.slice(0, 5) };
}

export function completeMission(plan: PlanState, topicId: string | undefined, result: MissionResult): PlanState {
  let index = -1;
  if (plan.intent?.date) index = plan.days.findIndex(day => day.date === plan.intent?.date && day.status === 'todo' && (plan.intent?.topicId ? day.topicId === plan.intent?.topicId : day.topicId === undefined));
  if (index < 0) index = plan.days.findIndex(day => day.date === plan.from && day.status === 'todo' && day.topicId === topicId);
  if (index < 0) return plan;
  const days = plan.days.map((day, position) => position === index ? { ...day, status: 'done' as const, result } : day);
  return { ...plan, days, intent: undefined };
}

export function nextMission(plan: PlanState) {
  return plan.days.find(day => day.status === 'todo') ?? null;
}

export function missionForToday(plan: PlanState | null, now = new Date()) {
  const day = plan?.days.find(item => item.date === dateKey(now)) ?? null;
  if (!day) return { day: null, mission: null, done: null };
  if (day.status === 'done') return { day, mission: null, done: day };
  return { day, mission: day, done: null };
}

export function startMission(plan: PlanState, date: string, topicId: string | undefined): PlanState {
  return { ...plan, intent: { date, ...(topicId ? { topicId } : {}) } };
}

export function readinessEvidence(progress: { tests: number; practiceAnswered: number; accuracy: number | null }) {
  const ready = progress.tests >= 2 && progress.practiceAnswered >= 20 && progress.accuracy !== null;
  return { ready, score: ready ? progress.accuracy : null, tests: progress.tests, practiceAnswered: progress.practiceAnswered };
}