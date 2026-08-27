import type { Subject } from '../theme';

export type UnknownRecord = Record<string, unknown>;
export type PracticeKind = 'paper' | 'practice' | 'adhoc';
export type AnswerValue = string | number | boolean | string[] | boolean[] | Record<string, unknown> | null;

export interface LocalSession {
  id: string;
  kind: PracticeKind;
  subject: Subject;
  title: string;
  topicId?: string;
  startedAt: string;
  endsAt?: string;
  questions: UnknownRecord[];
  raw: UnknownRecord;
}

export interface Draft {
  session: LocalSession;
  answers: Record<string, AnswerValue>;
  current: number;
  savedAt: string;
  expiredAt?: string;
}

export interface PracticeStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiSet(entries: readonly (readonly [string, string])[]): Promise<void>;
  multiRemove(keys: readonly string[]): Promise<void>;
}

const record = (value: unknown): UnknownRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
export const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
export const text = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value : undefined;
export const finite = (value: unknown): number | undefined => typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export function questionId(question: UnknownRecord, index = 0) {
  return text(question.id) ?? text(question.qid) ?? `question-${index + 1}`;
}

export function normalizeAnswer(value: unknown): AnswerValue {
  if (value == null) return null;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item.trim() : Boolean(item)) as string[] | boolean[];
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value as UnknownRecord).map(([key, item]) => [key, typeof item === 'string' ? item.trim() : item]));
  return String(value);
}

export function hasAnswer(value: unknown) {
  const answer = normalizeAnswer(value);
  if (answer == null) return false;
  if (typeof answer === 'string') return answer.length > 0;
  if (Array.isArray(answer)) return answer.some(Boolean);
  if (typeof answer === 'object') return Object.values(answer).some(Boolean);
  return true;
}

export function draftId(userId: string | undefined, subject: Subject, sessionId: string) {
  return `practice:draft:${userId || 'anonymous'}:${subject}:${sessionId}`;
}
export function activeId(userId: string | undefined, subject: Subject) {
  return `practice:active:${userId || 'anonymous'}:${subject}`;
}
export function resultId(userId: string | undefined, subject: Subject, sessionId: string) {
  return `practice:result:${userId || 'anonymous'}:${subject}:${sessionId}`;
}

export async function persistNewSession(storage: PracticeStorage, userId: string | undefined, session: LocalSession) {
  const draft: Draft = { session, answers: {}, current: 0, savedAt: new Date().toISOString() };
  const draftKey = draftId(userId, session.subject, session.id);
  const activeKey = activeId(userId, session.subject);
  try {
    await storage.multiSet([[draftKey, JSON.stringify(draft)], [activeKey, session.id]]);
    return draft;
  } catch (cause) {
    await storage.multiRemove([draftKey, activeKey]).catch(() => undefined);
    throw cause;
  }
}

export function parseDraft(value: string | null, subject: Subject, sessionId?: string): Draft | undefined {
  if (!value) return undefined;
  try {
    const draft = JSON.parse(value) as Draft;
    if (!draft?.session?.id || draft.session.subject !== subject || !Array.isArray(draft.session.questions)) return undefined;
    if (sessionId && draft.session.id !== sessionId) return undefined;
    if (draft.expiredAt && !draft.session.endsAt) return undefined;
    return { ...draft, answers: draft.answers ?? {}, current: Math.max(0, Math.min(draft.current ?? 0, Math.max(0, draft.session.questions.length - 1))) };
  } catch {
    return undefined;
  }
}

export function cacheResult(payload: unknown, answers: Record<string, AnswerValue>) {
  return { serverResult: payload, submittedAnswers: Object.fromEntries(Object.entries(answers).map(([id, value]) => [id, normalizeAnswer(value)])) };
}

export function readCachedResult(payload: unknown) {
  const cached = record(payload);
  return cached.serverResult === undefined
    ? { serverResult: payload, submittedAnswers: {} as Record<string, AnswerValue> }
    : { serverResult: cached.serverResult, submittedAnswers: record(cached.submittedAnswers) as Record<string, AnswerValue> };
}

export function secondsRemaining(endsAt: string | undefined, now = Date.now()) {
  if (!endsAt) return undefined;
  const end = Date.parse(endsAt);
  return Number.isFinite(end) ? Math.max(0, Math.ceil((end - now) / 1000)) : undefined;
}
export function durationSeconds(startedAt: string, now = Date.now()) {
  const start = Date.parse(startedAt);
  return Number.isFinite(start) ? Math.max(0, Math.floor((now - start) / 1000)) : 0;
}

export function parsePapers(payload: unknown): UnknownRecord[] {
  const root = record(payload);
  return asArray(root.papers ?? payload).map(record).filter(item => item.id != null || item.code != null);
}

export function parseTopics(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) return payload.map(record);
  const root = record(payload);
  const sections = record(root.sections);
  if (Object.keys(sections).length) return Object.values(sections).flatMap(section => asArray(record(section).topics).map(record));
  return asArray(root.topics).map(record);
}

export function sessionFromResponse(subject: Subject, kind: PracticeKind, payload: unknown, title: string, topicId?: string, now = Date.now()): LocalSession {
  const raw = record(payload);
  const id = text(raw.id) ?? text(raw.sessionId) ?? text(raw.roundId);
  if (!id) throw new Error('The server did not return a session ID.');
  const minutes = finite(raw.minutes);
  const startedAt = new Date(now).toISOString();
  return { id, kind, subject, title, topicId, startedAt, endsAt: minutes ? new Date(now + minutes * 60_000).toISOString() : undefined, questions: asArray(raw.questions).map(record), raw };
}

export function parseResult(payload: unknown) {
  const raw = record(payload);
  const correctMarks = finite(raw.correctMarks);
  const totalMarks = finite(raw.totalMarks);
  const percent = finite(raw.percent) ?? (correctMarks != null && totalMarks ? Math.round(correctMarks * 100 / totalMarks) : undefined);
  return {
    raw,
    correctMarks,
    totalMarks,
    percent,
    grade: raw.grade,
    gradeLabel: text(raw.gradeLabel),
    nextBoundary: record(raw.nextBoundary),
    weakTopics: asArray(raw.weakTopics).map(record),
    review: asArray(raw.perQuestion ?? raw.perQ).map(record),
    reward: record(raw.reward),
    progress: record(raw.progress),
    incomplete: raw.incomplete === true,
  };
}
