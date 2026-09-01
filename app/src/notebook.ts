import type { Subject } from './theme';

export type MistakeRow = { id: string; sessionId?: string; subject: Subject; qid: string; topicId?: string; topicName: string; prompt: string; answer?: unknown; capturedAt: string; dueDates: string[]; reviewIndex: number; mastered: boolean };
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
    return [{ id: `${subject}:${sessionId}:${qid}`, sessionId, subject, qid, topicId: text(row.topicId) ?? text(topic.id), topicName: text(row.topicName) ?? text(topic.name) ?? text(row.topic) ?? 'Unassigned topic', prompt: text(row.text) ?? text(row.prompt) ?? text(row.title) ?? `Question ${index + 1}`, ...(row.value !== undefined ? { answer: row.value } : answers[qid] !== undefined ? { answer: answers[qid] } : {}), capturedAt, dueDates: dueDates(capturedAt), reviewIndex: 0, mastered: false }];
  });
}

export function mergeMistakes(existing: MistakeRow[], incoming: MistakeRow[]) {
  const rows = Array.isArray(existing) ? existing : [];
  const byId = new Map(rows.map(row => [row.id, { ...row, reviewIndex: Number.isInteger(row.reviewIndex) ? row.reviewIndex : 0, mastered: row.mastered === true }])); incoming.forEach(row => byId.set(row.id, row));
  return [...byId.values()].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}
export function dueMistakes(rows: MistakeRow[], now = new Date()) { const stamp = now.getTime(); return rows.filter(row => { if (row.mastered) return false; const index=Number.isInteger(row.reviewIndex)?row.reviewIndex:0; return index < row.dueDates.length && Date.parse(row.dueDates[index]) <= stamp; }); }export function advanceMistake(rows: MistakeRow[], id: string) { return rows.map(row => { if (row.id !== id) return row; const index = Math.min((Number.isInteger(row.reviewIndex)?row.reviewIndex:0) + 1, row.dueDates.length || 4); return { ...row, reviewIndex: index, mastered: index >= (row.dueDates.length || 4) }; }); }

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
        capturedAt: text(row.capturedAt) ?? new Date().toISOString(),
        dueDates: Array.isArray(row.dueDates) ? row.dueDates.map(String) : [],
        reviewIndex: typeof row.reviewIndex === 'number' && Number.isInteger(row.reviewIndex) ? Math.max(0, Math.min(4, row.reviewIndex)) : 0,
        mastered: row.mastered === true,
      }];
    });
  } catch { return []; }
}