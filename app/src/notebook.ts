import type { Subject } from './theme';

export type MistakeRow = { id: string; sessionId: string; subject: Subject; qid: string; topicId?: string; topicName: string; prompt: string; answer: unknown; capturedAt: string; due: string[]; reviewIndex: number };
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
    return [{ id: `${subject}:${sessionId}:${qid}`, sessionId, subject, qid, topicId: text(row.topicId) ?? text(topic.id), topicName: text(row.topicName) ?? text(topic.name) ?? text(row.topic) ?? 'Unassigned topic', prompt: text(row.text) ?? text(row.prompt) ?? text(row.title) ?? `Question ${index + 1}`, answer: row.value ?? answers[qid] ?? null, capturedAt, due: dueDates(capturedAt), reviewIndex: 0 }];
  });
}

export function mergeMistakes(existing: string | null, incoming: MistakeRow[]) {
  let rows: MistakeRow[] = [];
  try { const parsed = JSON.parse(existing ?? '[]'); if (Array.isArray(parsed)) rows = parsed; } catch {}
  const byId = new Map(rows.map(row => [row.id, { ...row, reviewIndex: Number.isInteger(row.reviewIndex) ? row.reviewIndex : 0 }])); incoming.forEach(row => byId.set(row.id, row));
  return [...byId.values()].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}
export function dueMistakes(rows: MistakeRow[], now = new Date()) { const stamp = now.getTime(); return rows.filter(row => { const index=Number.isInteger(row.reviewIndex)?row.reviewIndex:0; return index < row.due.length && Date.parse(row.due[index]) <= stamp; }); }
export function advanceMistake(rows: MistakeRow[], id: string) { return rows.map(row => { const index=Number.isInteger(row.reviewIndex)?row.reviewIndex:0; return row.id === id ? { ...row, reviewIndex: Math.min(index + 1, row.due.length) } : row; }); }
