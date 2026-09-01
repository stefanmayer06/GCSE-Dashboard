import { dateKey, missionOutcome } from './study.js';

const DAY = 86400000;
export const PERSONAL_UPDATED_EVENT = 'gcse-personal-updated';

// Learner-facing error classification for the mistake notebook. Each mistake
// can be tagged with the reason it was missed so retries target the cause.
export const ERROR_TYPES = [
  { id: 'knowledge', label: 'Didn\u2019t know it', hint: 'I never learned or forgot this fact or rule.' },
  { id: 'method', label: 'Wrong method', hint: 'I used the wrong approach for this kind of question.' },
  { id: 'misread', label: 'Misread the question', hint: 'I answered a different question to the one asked.' },
  { id: 'arithmetic', label: 'Arithmetic slip', hint: 'The method was right, the calculation wasn\u2019t.' },
  { id: 'timing', label: 'Ran out of time', hint: 'I knew what to do but rushed or never finished.' },
  { id: 'incomplete', label: 'Missing explanation', hint: 'My answer needed more working, reasoning or evidence.' },
];

export const ERROR_TYPE_IDS = ERROR_TYPES.map((type) => type.id);

function notifyPersonalUpdated(userId, subject) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(PERSONAL_UPDATED_EVENT, { detail: { userId, subject } }));
}

export function personalKey(userId, subject, name) {
  return `gcse-${encodeURIComponent(userId || 'anonymous')}-${subject}-${name}`;
}

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export function legacyPersonalData(userId, subject) {
  const legacyStudy = readJson(personalKey(userId, subject, 'study'), {});
  const legacyPlan = readJson(personalKey(userId, subject, 'plan'), null);
  const legacyMistakes = readJson(personalKey(userId, subject, 'mistakes'), []);
  return { study: legacyStudy, plan: legacyPlan, mistakes: legacyMistakes };
}

export function clearLegacyPersonal(userId, subject) {
  for (const name of ['study', 'plan', 'mistakes']) localStorage.removeItem(personalKey(userId, subject, name));
}

const importFlag = (userId, subject) => personalKey(userId, subject, 'personal-imported-v1');

function mapLegacyPlan(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(raw.from || ''))) return null;
  const days = (Array.isArray(raw.days) ? raw.days : []).flatMap((day) => {
    if (!day || typeof day !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(String(day.date || ''))) return [];
    return [{
      date: day.date,
      label: typeof day.label === 'string' && day.label ? day.label : 'Today',
      task: typeof day.task === 'string' && day.task ? day.task : 'Study session',
      minutes: Number.isInteger(day.minutes) ? day.minutes : 15,
      ...(typeof day.topicId === 'string' && day.topicId ? { topicId: day.topicId } : {}),
      status: day.status === 'done' ? 'done' : 'todo',
      ...(day.result && typeof day.result === 'object' ? { result: day.result } : {}),
    }];
  });
  if (!days.length) return null;
  const plan = { from: raw.from, days };
  if (raw.intent && typeof raw.intent === 'object' && typeof raw.intent.date === 'string') {
    plan.intent = { date: raw.intent.date, ...(typeof raw.intent.topicId === 'string' ? { topicId: raw.intent.topicId } : {}) };
  }
  return plan;
}

function mapLegacyMistakes(rows) {
  return (Array.isArray(rows) ? rows : []).flatMap((row) => {
    if (!row || typeof row !== 'object' || typeof row.id !== 'string') return [];
    const capturedMs = Number.isFinite(Number(row.added)) ? Number(row.added) : Date.now();
    const dueDates = [1, 3, 7, 21].map((days) => new Date(capturedMs + days * DAY).toISOString());
    const reviewIndex = Number.isInteger(row.interval) ? Math.max(0, Math.min(4, row.interval)) : 0;
    return [{
      id: row.id,
      qid: row.qid || row.id,
      topicName: row.topic || 'Unassigned topic',
      prompt: row.question || '',
      ...(row.answer != null ? { answer: row.answer } : {}),
      ...(Number.isFinite(Number(row.marks)) ? { marks: Number(row.marks) } : {}),
      ...(Number.isFinite(Number(row.max)) ? { maxMarks: Number(row.max) } : {}),
      capturedAt: new Date(capturedMs).toISOString(),
      dueDates,
      reviewIndex,
      mastered: reviewIndex >= 4,
    }];
  });
}

export async function importLegacyPersonal(api, userId, subject, remote) {
  const flag = importFlag(userId, subject);
  if (localStorage.getItem(flag)) return false;
  const legacy = legacyPersonalData(userId, subject);
  const hasLegacy = legacy.plan
    || (legacy.study && (legacy.study.examDate || legacy.study.passMode))
    || (Array.isArray(legacy.mistakes) && legacy.mistakes.length > 0);
  if (!hasLegacy) {
    localStorage.setItem(flag, 'v1');
    return false;
  }
  const preferences = {
    examDate: legacy.study?.examDate || '',
    targetGrade: '',
    passMode: legacy.study?.passMode === true ? 'foundation-pass' : 'balanced',
  };
  const plan = mapLegacyPlan(legacy.plan);
  const mistakes = mapLegacyMistakes(legacy.mistakes);
  if (!remote.preferences && (preferences.examDate || preferences.passMode !== 'balanced')) {
    await api.savePreferences(preferences);
  }
  if (!remote.plan && plan) await api.savePlan(plan);
  if (!remote.mistakes.length && mistakes.length) await api.saveMistakes(mistakes);
  localStorage.setItem(flag, 'v1');
  clearLegacyPersonal(userId, subject);
  return true;
}

export async function hydratePersonal(api, userId, subject) {
  const remote = await api.personal();
  const imported = await importLegacyPersonal(api, userId, subject, remote);
  return imported ? api.personal() : remote;
}

export function dueMistakeRows(rows, now = Date.now()) {
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (row.mastered) return false;
    const due = row.dueDates?.[row.reviewIndex ?? 0];
    return due && Date.parse(due) <= now;
  });
}

export function advanceMistakeRows(rows, id, now = Date.now()) {
  return rows.map((row) => {
    if (row.id !== id) return row;
    const reviewIndex = Math.min(4, (row.reviewIndex ?? 0) + 1);
    return { ...row, reviewIndex, lastReviewedAt: new Date(now).toISOString(), mastered: reviewIndex >= 4 };
  });
}

export function classifyMistake(rows, id, errorType) {
  if (!ERROR_TYPE_IDS.includes(errorType)) return rows;
  return rows.map((row) => (row.id === id ? { ...row, errorType } : row));
}

export function markWarmupDone(rows, id) {
  return rows.map((row) => (row.id === id
    ? { ...row, warmupCount: Math.min(99, (row.warmupCount ?? 0) + 1) }
    : row));
}

// Mistakes mastered inside a window ending `now` — the weekly "mistakes
// mastered" outcome reported on the dashboard and evidence summary.
export function masteredSince(rows, windowMs = 7 * DAY, now = Date.now()) {
  const cutoff = now - windowMs;
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    if (!row.mastered) return false;
    const at = Date.parse(row.lastReviewedAt || row.capturedAt || '');
    return Number.isFinite(at) && at >= cutoff;
  });
}

export function errorTypeCounts(rows) {
  const counts = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row?.errorType) counts[row.errorType] = (counts[row.errorType] || 0) + 1;
  }
  return counts;
}

// Merges newly captured mistakes into the notebook. Re-capturing an existing
// row (for example by reopening a results page) refreshes the evidence fields
// but never resets review progress: retries, mastery and classification stick.
export function mergeMistakeRows(existing, incoming) {
  const byId = new Map((Array.isArray(existing) ? existing : []).map((row) => [row.id, row]));
  for (const row of Array.isArray(incoming) ? incoming : []) {
    const prior = byId.get(row.id);
    byId.set(row.id, prior
      ? {
          ...row,
          capturedAt: prior.capturedAt,
          dueDates: prior.dueDates?.length ? prior.dueDates : row.dueDates,
          reviewIndex: prior.reviewIndex ?? 0,
          mastered: prior.mastered === true,
          ...(prior.errorType ? { errorType: prior.errorType } : {}),
          ...(prior.warmupCount ? { warmupCount: prior.warmupCount } : {}),
          ...(prior.lastReviewedAt ? { lastReviewedAt: prior.lastReviewedAt } : {}),
        }
      : row);
  }
  return [...byId.values()].sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)));
}

export function mistakeRowsFromResult(result, subject, sessionSeed, answers = {}) {
  const review = Array.isArray(result?.perQuestion) ? result.perQuestion : Array.isArray(result?.perQ) ? result.perQ : [];
  const capturedAt = new Date().toISOString();
  return review.flatMap((entry, index) => {
    const row = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : {};
    const qid = row.qid ?? row.id ?? `question-${index + 1}`;
    const got = Number.isFinite(Number(row.got)) ? Number(row.got)
      : row.correct === true && Number.isFinite(Number(row.marks ?? row.maxMarks ?? row.max)) ? Number(row.marks ?? row.maxMarks ?? row.max) : undefined;
    const max = Number.isFinite(Number(row.marks ?? row.maxMarks ?? row.max)) ? Number(row.marks ?? row.maxMarks ?? row.max) : undefined;
    const incorrect = row.correct === false || (got !== undefined && max !== undefined && got < max);
    if (!incorrect) return [];
    const correctAnswer = row.answerText ?? row.correctAnswer
      ?? (typeof row.marking?.modelAnswer === 'string' && row.marking.modelAnswer.trim() ? row.marking.modelAnswer : undefined);
    const workedSolution = Array.isArray(row.solution) ? row.solution.filter((step) => typeof step === 'string' && step.trim()) : [];
    return [{
      id: `${subject}:${sessionSeed || 'session'}:${qid}`,
      qid: String(qid),
      ...(typeof row.topicId === 'string' && row.topicId ? { topicId: row.topicId } : {}),
      topicName: row.topicName ?? row.topic ?? 'Mixed practice',
      prompt: row.text ?? row.prompt ?? row.question ?? `Question ${index + 1}`,
      ...(row.value !== undefined ? { answer: row.value } : answers[qid] !== undefined ? { answer: answers[qid] } : {}),
      ...(got !== undefined ? { marks: got } : {}),
      ...(max !== undefined ? { maxMarks: max } : {}),
      ...(correctAnswer !== undefined ? { correctAnswer } : {}),
      ...(workedSolution.length ? { workedSolution } : {}),
      capturedAt,
      dueDates: [1, 3, 7, 21].map((days) => new Date(Date.now() + days * DAY).toISOString()),
      reviewIndex: 0,
      mastered: false,
    }];
  });
}

export function startPlanDayInState(plan, date, topicId) {
  if (!plan || !Array.isArray(plan.days)) return null;
  return { ...plan, intent: { date, ...(topicId ? { topicId } : {}) } };
}

export function completePlanDayInState(plan, topicId, outcome, today = dateKey()) {
  if (!plan || !Array.isArray(plan.days)) return null;
  let index = -1;
  if (plan.intent?.date) {
    index = plan.days.findIndex((day) => day.date === plan.intent.date && day.status !== 'done' && (plan.intent.topicId ? day.topicId === plan.intent.topicId : !day.topicId));
  }
  if (index < 0) index = plan.days.findIndex((day) => day.date === today && day.status !== 'done' && day.topicId === topicId);
  if (index < 0) return null;
  const days = plan.days.map((day, position) => position === index
    ? { ...day, status: 'done', result: { ...outcome, completedAt: new Date().toISOString() } }
    : day);
  return { ...plan, days, intent: undefined };
}

// Persists a finished lesson: marks the started mission done with its score and
// captures any incorrect rows into the account notebook. Idempotent by row id.
export async function recordLessonResult(api, userId, subject, topicId, topicName, result, answers = {}) {
  const personal = await api.personal();
  const outcome = missionOutcome(result);
  const nextPlan = completePlanDayInState(personal.plan, topicId, outcome);
  const enriched = {
    ...result,
    perQ: (Array.isArray(result.perQ) ? result.perQ : []).map((row) => ({
      ...row,
      ...(row.topic == null && topicName ? { topic: topicName } : {}),
    })),
  };
  const built = mistakeRowsFromResult(enriched, subject, `lesson-${topicId}`, answers);
  if (nextPlan) {
    try {
      await api.savePlan(nextPlan);
      api.track?.('mission_complete', { topicId });
    } catch (error) {
      error.personalDomain = 'plan';
      throw error;
    }
    notifyPersonalUpdated(userId, subject);
  }
  if (built.length) {
    try {
      await api.saveMistakes(mergeMistakeRows(personal.mistakes, built));
    } catch (error) {
      error.personalDomain = 'mistakes';
      throw error;
    }
  }
  return nextPlan;
}
