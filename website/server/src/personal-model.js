const SUBJECTS = ['maths', 'maths-higher', 'english'];
const ERROR_TYPES = ['knowledge', 'method', 'misread', 'arithmetic', 'timing', 'incomplete'];
const EVENT_NAMES = [
  'signup',
  'diagnostic_start',
  'diagnostic_complete',
  'mission_start',
  'mission_complete',
  'session_marked',
  'mistake_saved',
  'mistake_retry',
  'mistake_mastered',
  'onboarding_complete',
  'week_return',
  'evidence_report',
];
const MAX_ATTEMPTS_PER_SUBJECT = 50;
const record = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
const text = (value) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

export function personalError(code, message) {
  const error = new Error(message);
  error.name = 'PersonalDataError';
  error.code = code;
  error.status = 400;
  return error;
}

export function normalizeSubject(subject) {
  if (SUBJECTS.includes(subject)) return subject;
  throw personalError('PERSONAL_INVALID_SUBJECT', 'Invalid subject');
}

export function normalizePreferences(payload) {
  if (payload === null || payload === undefined) {
    return { examDate: '', targetGrade: '', passMode: 'balanced' };
  }
  const raw = record(payload);
  const examDate = typeof raw.examDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.examDate.trim()) ? raw.examDate.trim() : '';
  const targetGrade = typeof raw.targetGrade === 'string' ? raw.targetGrade.trim().slice(0, 1) : '';
  const passMode = raw.passMode === 'foundation-pass' ? 'foundation-pass' : 'balanced';
  return { examDate, targetGrade, passMode };
}

export function normalizeResult(payload) {
  const raw = record(payload);
  if (typeof raw.completedAt !== 'string') return undefined;
  const marks = (value, allow) => (typeof value === 'number' && Number.isFinite(value) && (allow || value >= 0) ? value : undefined);
  const percent = marksOf(raw.percent, true);
  const correctMarks = marks(raw.correctMarks, false);
  const totalMarks = marks(raw.totalMarks, false);
  return {
    percent: percent ?? (correctMarks !== undefined && totalMarks ? Math.round((correctMarks * 100) / totalMarks) : 0),
    correctMarks: correctMarks ?? 0,
    totalMarks: totalMarks ?? 0,
    xpEarned: Number.isInteger(raw.xpEarned) ? raw.xpEarned : null,
    completedAt: raw.completedAt,
    weakTopics: Array.isArray(raw.weakTopics)
      ? raw.weakTopics.flatMap((entry) => text(entry) ?? text(record(entry).name) ?? []).slice(0, 5)
      : [],
  };
}

function marksOf(value, allowNegative) {
  return typeof value === 'number' && Number.isFinite(value) && (allowNegative || value >= 0) ? value : undefined;
}

export function normalizeDay(payload) {
  const raw = record(payload);
  if (typeof raw.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date.trim())) {
    throw personalError('PERSONAL_INVALID_PLAN', 'Every plan day needs a valid date');
  }
  const result = raw.result === undefined || raw.result === null ? undefined : normalizeResult(raw.result);
  return {
    date: raw.date.trim(),
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim().slice(0, 24) : 'Today',
    task: typeof raw.task === 'string' && raw.task.trim() ? raw.task.trim().slice(0, 120) : 'Study session',
    minutes: Number.isInteger(raw.minutes) ? Math.max(1, Math.min(120, raw.minutes)) : 15,
    ...(typeof raw.topicId === 'string' && raw.topicId.trim() ? { topicId: raw.topicId.trim().slice(0, 120) } : {}),
    status: raw.status === 'done' ? 'done' : 'todo',
    ...(result ? { result } : {}),
  };
}

export function normalizePlan(payload) {
  if (payload === null || payload === undefined) return undefined;
  const raw = record(payload);
  if (typeof raw.from !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.from.trim())) {
    throw personalError('PERSONAL_INVALID_PLAN', 'Plan needs a valid start date');
  }
  const days = Array.isArray(raw.days) ? raw.days : [];
  if (days.length < 1 || days.length > 14) {
    throw personalError('PERSONAL_INVALID_PLAN', 'A study plan must hold between 1 and 14 days');
  }
  const intentRaw = raw.intent === undefined || raw.intent === null ? undefined : record(raw.intent);
  const intent = intentRaw && typeof intentRaw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(intentRaw.date.trim())
    ? { date: intentRaw.date.trim(), ...(typeof intentRaw.topicId === 'string' && intentRaw.topicId.trim() ? { topicId: intentRaw.topicId.trim().slice(0, 120) } : {}) }
    : undefined;
  return { from: raw.from.trim(), days: days.map(normalizeDay), ...(intent ? { intent } : {}) };
}

export function normalizeMistakeRows(payload) {
  if (payload === null || payload === undefined) return [];
  const rows = Array.isArray(payload) ? payload : record(payload).rows;
  if (!Array.isArray(rows)) throw personalError('PERSONAL_INVALID_MISTAKES', 'Mistake rows must be an array');
  const out = [];
  const seen = new Set();
  for (const entry of rows.slice(0, 500)) {
    const raw = record(entry);
    const id = text(raw.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const dueDates = Array.isArray(raw.dueDates ?? raw.due) ? (raw.dueDates ?? raw.due).map(String) : [];
    const reviewIndex = Number.isInteger(raw.reviewIndex) ? Math.max(0, Math.min(4, raw.reviewIndex)) : 0;
    const capturedAt = text(raw.capturedAt)
      ?? (Number.isFinite(raw.added) ? new Date(raw.added).toISOString() : new Date().toISOString());
    const workedSolution = Array.isArray(raw.workedSolution)
      ? raw.workedSolution
        .map((step) => (typeof step === 'string' ? step.trim() : ''))
        .filter(Boolean)
        .slice(0, 30)
      : [];
    out.push({
      id,
      ...(text(raw.sessionId) ? { sessionId: text(raw.sessionId).slice(0, 200) } : {}),
      ...(text(raw.qid) ? { qid: text(raw.qid).slice(0, 200) } : {}),
      ...(text(raw.topicId) ? { topicId: text(raw.topicId).slice(0, 200) } : {}),
      topicName: text(raw.topicName) ?? text(raw.topic) ?? 'Unassigned topic',
      prompt: text(raw.prompt) ?? text(raw.question) ?? '',
      ...(raw.answer !== undefined && raw.answer !== null ? { answer: raw.answer } : {}),
      ...(marksOf(raw.marks ?? raw.got, false) !== undefined ? { marks: marksOf(raw.marks ?? raw.got, false) } : {}),
      ...(marksOf(raw.maxMarks ?? raw.max, false) !== undefined ? { maxMarks: marksOf(raw.maxMarks ?? raw.max, false) } : {}),
      capturedAt,
      dueDates,
      reviewIndex,
      ...(ERROR_TYPES.includes(raw.errorType) ? { errorType: raw.errorType } : {}),
      ...(Number.isInteger(raw.warmupCount) ? { warmupCount: Math.max(0, Math.min(99, raw.warmupCount)) } : {}),
      ...(text(raw.lastReviewedAt) ? { lastReviewedAt: text(raw.lastReviewedAt) } : {}),
      ...(raw.correctAnswer !== undefined && raw.correctAnswer !== null ? { correctAnswer: raw.correctAnswer } : {}),
      ...(workedSolution.length ? { workedSolution } : {}),
      mastered: raw.mastered === true || reviewIndex >= dueDates.length && dueDates.length > 0,
    });
  }
  return out;
}

export function eventNames() {
  return [...EVENT_NAMES];
}

export function normalizeEvent(payload) {
  const raw = record(payload);
  const name = text(raw.name);
  if (!name || !EVENT_NAMES.includes(name)) {
    throw personalError('EVENT_INVALID_NAME', 'Unknown event name');
  }
  const subject = text(raw.subject);
  if (subject && !SUBJECTS.includes(subject)) {
    throw personalError('EVENT_INVALID_SUBJECT', 'Invalid event subject');
  }
  const metadata = record(raw.metadata);
  const clean = {};
  for (const [key, value] of Object.entries(metadata).slice(0, 20)) {
    if (typeof key !== 'string' || key.length > 60) continue;
    if (value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = typeof value === 'string' ? value.slice(0, 300) : value;
    }
  }
  return {
    name,
    ...(subject ? { subject } : {}),
    metadata: clean,
  };
}

export function normalizeAttempt(payload) {
  const raw = record(payload);
  const sessionId = text(raw.sessionId);
  if (!sessionId) throw personalError('ATTEMPT_INVALID_SESSION', 'A paper attempt needs a session id');
  const percent = Number.isFinite(Number(raw.percent)) ? Math.round(Number(raw.percent)) : null;
  const grade = Number.isInteger(raw.grade) ? raw.grade : null;
  const durationSec = Number.isFinite(Number(raw.durationSec)) && Number(raw.durationSec) >= 0
    ? Math.round(Number(raw.durationSec))
    : null;
  return {
    sessionId: sessionId.slice(0, 200),
    paperCode: text(raw.paperCode)?.slice(0, 40),
    paperName: text(raw.paperName)?.slice(0, 80),
    type: raw.type === 'short' ? 'short' : 'full',
    tier: text(raw.tier)?.slice(0, 40),
    totalMarks: Math.max(0, Number(raw.totalMarks) || 0),
    correctMarks: Math.max(0, Number(raw.correctMarks) || 0),
    percent: percent != null && percent >= 0 && percent <= 100 ? percent : null,
    grade: grade != null && grade >= 0 && grade <= 9 ? grade : null,
    durationSec,
    completedAt: text(raw.completedAt) ?? new Date().toISOString(),
    result: record(raw.result),
  };
}

export const attemptLimit = MAX_ATTEMPTS_PER_SUBJECT;

export function mistakeRowToSnake(row, subject, userId) {
  return {
    user_id: userId,
    subject,
    legacy_id: row.id,
    session_id: row.sessionId ?? null,
    question_id: row.qid ?? null,
    topic_id: row.topicId ?? null,
    topic_name: row.topicName || 'Unassigned topic',
    prompt: row.prompt || '',
    answer: row.answer === undefined ? null : row.answer,
    marks: row.marks ?? null,
    max_marks: row.maxMarks ?? null,
    due_dates: row.dueDates || [],
    review_index: row.reviewIndex || 0,
    status: row.mastered ? 'mastered' : 'active',
    captured_at: row.capturedAt,
    mastered_at: row.mastered ? new Date().toISOString() : null,
    error_type: row.errorType ?? null,
    warmup_count: row.warmupCount ?? 0,
    last_reviewed_at: row.lastReviewedAt ?? null,
    correct_answer: row.correctAnswer === undefined ? null : row.correctAnswer,
    worked_solution: row.workedSolution ?? null,
  };
}

export function progressRowToState(row) {
  if (!row) return null;
  return {
    xp: Math.max(0, Number(row.xp) || 0),
    streak: Math.max(0, Number(row.streak) || 0),
    lastActiveDate: row.last_active_date ?? null,
    testsTaken: Math.max(0, Number(row.tests_taken) || 0),
    practiceAnswered: Math.max(0, Number(row.practice_answered) || 0),
    totalTestMarks: Math.max(0, Number(row.total_test_marks) || 0),
    totalTestCorrect: Math.max(0, Number(row.total_test_correct) || 0),
    topicStats: row.topic_stats && typeof row.topic_stats === 'object' ? row.topic_stats : {},
    completedLessons: Array.isArray(row.completed_lessons) ? row.completed_lessons : [],
  };
}