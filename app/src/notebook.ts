import type { Subject } from './theme';

export type MistakeRow = { id: string; sessionId?: string; subject: Subject; qid: string; topicId?: string; topicName: string; prompt: string; answer?: unknown; capturedAt: string; dueDates: string[]; reviewIndex: number; mastered: boolean; errorType?: string; correctAnswer?: string; workedSolution?: string[]; warmupCount?: number; lastReviewedAt?: string };

export const ERROR_TYPES = [
  { id: 'knowledge', label: 'Didn\u2019t know it' },
  { id: 'method', label: 'Wrong method' },
  { id: 'misread', label: 'Misread' },
  { id: 'arithmetic', label: 'Arithmetic slip' },
  { id: 'timing', label: 'Ran out of time' },
  { id: 'incomplete', label: 'Missing explanation' },
] as const;

export const ERROR_TYPE_IDS: string[] = ERROR_TYPES.map(type => type.id);
export function errorTypeLabel(id: string | undefined) { return ERROR_TYPES.find(type => type.id === id)?.label ?? null; }

const rec = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined;
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
export function notebookKey(userId: string | undefined) { return `notebook:${userId || 'anonymous'}`; }
export function dueDates(capturedAt: string) { const at = Date.parse(capturedAt); return [1, 3, 7, 21].map(days => new Date(at + days * 86_400_000).toISOString()); }

export function mistakesFromResult(serverResult: unknown, answers: Record<string, unknown>, sessionId: string, subject: Subject, capturedAt = new Date().toISOString()): MistakeRow[] {
  const root = rec(serverResult);
  const review = Array.isArray(root.perQuestion) ? root.perQuestion : Array.isArray(root.perQ) ? root.perQ : [];
  return review.flatMap((value, index) => {
    const row = rec(value); const qid = text(row.qid) ?? text(row.id) ?? `question-${index + 1}`;
    const got = finite(row.got) ?? finite(row.correctMarks); const marks = finite(row.marks) ?? finite(row.totalMarks);
    const incorrect = row.correct === false || (got !== undefined && marks !== undefined && got < marks);
    if (!incorrect) return [];
    const topic = rec(row.topic);
    const marking = rec(row.marking);
    const correctAnswer = text(row.answerText) ?? text(row.correctAnswer) ?? (typeof marking.modelAnswer === 'string' && marking.modelAnswer.trim() ? marking.modelAnswer : undefined);
    const workedSolution = Array.isArray(row.solution) ? row.solution.filter((step): step is string => typeof step === 'string' && step.trim().length > 0) : [];
    return [{ id: `${subject}:${sessionId}:${qid}`, sessionId, subject, qid, topicId: text(row.topicId) ?? text(topic.id), topicName: text(row.topicName) ?? text(topic.name) ?? text(row.topic) ?? 'Unassigned topic', prompt: text(row.text) ?? text(row.prompt) ?? text(row.title) ?? `Question ${index + 1}`, ...(row.value !== undefined ? { answer: row.value } : answers[qid] !== undefined ? { answer: answers[qid] } : {}), ...(correctAnswer ? { correctAnswer } : {}), ...(workedSolution.length ? { workedSolution } : {}), capturedAt, dueDates: dueDates(capturedAt), reviewIndex: 0, mastered: false }];
  });
}

// Merging a re-captured mistake refreshes the evidence but never resets review
// progress: retries, mastery and classification stick.
export function mergeMistakes(existing: MistakeRow[], incoming: MistakeRow[]) {
  const rows = Array.isArray(existing) ? existing : [];
  const byId = new Map(rows.map(row => [row.id, { ...row, reviewIndex: Number.isInteger(row.reviewIndex) ? row.reviewIndex : 0, mastered: row.mastered === true }]));
  incoming.forEach(row => {
    const prior = byId.get(row.id);
    byId.set(row.id, prior ? { ...row, capturedAt: prior.capturedAt, dueDates: prior.dueDates.length ? prior.dueDates : row.dueDates, reviewIndex: prior.reviewIndex, mastered: prior.mastered, ...(prior.errorType ? { errorType: prior.errorType } : {}), ...(prior.warmupCount ? { warmupCount: prior.warmupCount } : {}), ...(prior.lastReviewedAt ? { lastReviewedAt: prior.lastReviewedAt } : {}) } : row);
  });
  return [...byId.values()].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}
export function dueMistakes(rows: MistakeRow[], now = new Date()) { const stamp = now.getTime(); return rows.filter(row => { if (row.mastered) return false; const index=Number.isInteger(row.reviewIndex)?row.reviewIndex:0; return index < row.dueDates.length && Date.parse(row.dueDates[index]) <= stamp; }); }
export function advanceMistake(rows: MistakeRow[], id: string, now = new Date()) { return rows.map(row => { if (row.id !== id) return row; const index = Math.min((Number.isInteger(row.reviewIndex)?row.reviewIndex:0) + 1, row.dueDates.length || 4); return { ...row, reviewIndex: index, lastReviewedAt: now.toISOString(), mastered: index >= (row.dueDates.length || 4) }; }); }

// Learner classification of a mistake; unknown reasons are ignored, never guessed.
export function classifyMistake(rows: MistakeRow[], id: string, errorType: string) { if (!ERROR_TYPE_IDS.includes(errorType)) return rows; return rows.map(row => row.id === id ? { ...row, errorType } : row); }
export function markWarmupDone(rows: MistakeRow[], id: string) { return rows.map(row => row.id === id ? { ...row, warmupCount: Math.min(99, (row.warmupCount ?? 0) + 1) } : row); }

// Mistakes mastered inside a window ending `now` — the weekly mastery outcome.
export function masteredSince(rows: MistakeRow[], windowMs = 7 * 86_400_000, now = new Date()) { const cutoff = now.getTime() - windowMs; return rows.filter(row => { if (!row.mastered) return false; const at = Date.parse(row.lastReviewedAt || row.capturedAt || ''); return Number.isFinite(at) && at >= cutoff; }); }

export function parseMistakeRows(value: string | null, subject: Subject): MistakeRow[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      const row = rec(entry);
      const id = text(row.id);
      if (!id || typeof row.qid !== 'string') return [];
      return [{
        id,
        ...(text(row.sessionId) ? { sessionId: text(row.sessionId)! } : {}),
        subject,
        qid: row.qid,
        ...(text(row.topicId) ? { topicId: text(row.topicId)! } : {}),
        topicName: text(row.topicName) ?? 'Unassigned topic',
        prompt: text(row.prompt) ?? '',
        ...(row.answer !== undefined ? { answer: row.answer } : {}),
        ...(text(row.correctAnswer) ? { correctAnswer: text(row.correctAnswer)! } : {}),
        ...(Array.isArray(row.workedSolution) ? { workedSolution: row.workedSolution.filter((step): step is string => typeof step === 'string' && step.trim().length > 0) } : {}),
        ...(ERROR_TYPE_IDS.includes(String(row.errorType)) ? { errorType: String(row.errorType) } : {}),
        ...(typeof row.warmupCount === 'number' && Number.isFinite(row.warmupCount) ? { warmupCount: Math.max(0, Math.min(99, Math.round(row.warmupCount))) } : {}),
        ...(text(row.lastReviewedAt) ? { lastReviewedAt: text(row.lastReviewedAt)! } : {}),
        capturedAt: text(row.capturedAt) ?? new Date().toISOString(),
        dueDates: Array.isArray(row.dueDates) ? row.dueDates.map(String) : [],
        reviewIndex: typeof row.reviewIndex === 'number' && Number.isInteger(row.reviewIndex) ? Math.max(0, Math.min(4, row.reviewIndex)) : 0,
        mastered: row.mastered === true,
      }];
    });
  } catch { return []; }
}