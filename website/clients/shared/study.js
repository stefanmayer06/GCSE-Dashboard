const DAY = 86400000;
const INTERVALS = [1, 3, 7, 21];
const FALLBACK_TASKS = ['Diagnostic', 'Core skills', 'Mixed recall'];

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export function studyKey(userId, subject, name) { return `gcse-${encodeURIComponent(userId || 'anonymous')}-${subject}-${name}`; }
export function loadStudy(userId, subject) { return read(studyKey(userId, subject, 'study'), { examDate: '', passMode: false }); }
export function saveStudy(userId, subject, value) { localStorage.setItem(studyKey(userId, subject, 'study'), JSON.stringify(value)); }
export function loadMistakes(userId, subject) { return read(studyKey(userId, subject, 'mistakes'), []); }

export function dateKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function planKey(userId, subject) { return studyKey(userId, subject, 'plan'); }
export function savePlan(userId, subject, plan) { localStorage.setItem(planKey(userId, subject), JSON.stringify(plan)); }
export function loadPlan(userId, subject, priority, passMode, now = new Date()) {
  const today = dateKey(now);
  const stored = read(planKey(userId, subject), null);
  if (stored && stored.from === today && Array.isArray(stored.days) && stored.days.length === 7) return stored;
  if (!priority.length) return stored;
  const legacy = read(studyKey(userId, subject, 'study'), {});
  const seeds = Array.isArray(legacy.plan) ? legacy.plan : [];
  const plan = buildWeekPlan(priority, subject, passMode, now, seeds);
  savePlan(userId, subject, plan);
  return plan;
}

function planMinutes(subject, passMode) {
  if (passMode && subject === 'maths') return 15;
  return subject === 'english' ? 20 : 15;
}

export function buildWeekPlan(priority, subject, passMode, now = new Date(), seeds = []) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY);
    const seed = seeds.find((row) => row.date === dateKey(date));
    const isReview = index === 3 || index === 6;
    const item = isReview ? null : priority[index % Math.max(1, priority.length)] || null;
    const task = seed?.topic || (isReview ? (index === 6 ? 'Weekly review' : 'Mistake retry') : item?.name || FALLBACK_TASKS[index % 3]);
    return {
      date: dateKey(date),
      label: index === 0 ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' }),
      task,
      topicId: seed?.topicId || (task === item?.name ? item?.id : undefined) || null,
      minutes: planMinutes(subject, passMode),
      status: 'todo',
    };
  });
  return { from: dateKey(now), days };
}

export function startPlanDay(userId, subject, date, topicId) {
  const stored = read(planKey(userId, subject), null);
  if (!stored || !Array.isArray(stored.days)) return;
  savePlan(userId, subject, { ...stored, intent: { date, ...(topicId ? { topicId } : {}) } });
}

export function completePlanDay(userId, subject, topicId, outcome, now = new Date()) {
  const stored = read(planKey(userId, subject), null);
  if (!stored || !Array.isArray(stored.days)) return;
  let index = -1;
  if (stored.intent?.date) {
    index = stored.days.findIndex((day) => day.date === stored.intent.date && day.status !== 'done' && (stored.intent.topicId ? day.topicId === stored.intent.topicId : !day.topicId));
  }
  if (index < 0) index = stored.days.findIndex((day) => day.date === stored.from && day.status !== 'done' && day.topicId === topicId);
  if (index < 0) return;
  const result = { ...outcome, completedAt: now.toISOString() };
  const days = stored.days.map((day, position) => (position === index ? { ...day, status: 'done', result } : day));
  savePlan(userId, subject, { ...stored, days, intent: undefined });
}

export function missionOutcome(res) {
  return {
    percent: typeof res.percent === 'number' ? res.percent : res.totalMarks ? Math.round((res.correctMarks / res.totalMarks) * 100) : 0,
    correctMarks: res.correctMarks ?? 0,
    totalMarks: res.totalMarks ?? 0,
    xpEarned: res.reward?.scoreXp ?? res.reward?.completionXp ?? null,
    weakTopics: Array.isArray(res.weakTopics) ? res.weakTopics.map((w) => (typeof w === 'string' ? w : w?.name)).filter(Boolean).slice(0, 5) : [],
  };
}

export function flattenTopics(catalog, groupsKey) {
  const groups = catalog?.[groupsKey] || {};
  return Object.values(groups).flatMap((group) => group.topics || []);
}

export function readiness(progress) {
  const rows = Object.values(progress?.topicStats || {}).filter((row) => row.total > 0);
  const answered = rows.reduce((sum, row) => sum + row.total, 0);
  if (answered < 20 || rows.length < 3) return { ready: false, answered, topics: rows.length };
  const correct = rows.reduce((sum, row) => sum + row.correct, 0);
  return { ready: true, score: Math.round(correct / answered * 100), answered, topics: rows.length };
}

export function priorityTopics(topics, progress, passMode = false) {
  const stats = progress?.topicStats || {};
  return [...topics].sort((a, b) => {
    const aa = stats[a.id];
    const bb = stats[b.id];
    const aScore = aa ? aa.correct / aa.total : -1;
    const bScore = bb ? bb.correct / bb.total : -1;
    const aCore = passMode ? -(Number(a.examWeight) || 0) / 100 : 0;
    const bCore = passMode ? -(Number(b.examWeight) || 0) / 100 : 0;
    return (aScore + aCore) - (bScore + bCore);
  });
}

export function rollingPlan(topics, progress, passMode) {
  const priority = priorityTopics(topics, progress, passMode);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() + index * DAY);
    return { date: date.toISOString().slice(0, 10), label: date.toLocaleDateString(undefined, { weekday: 'short' }), topic: priority[index % Math.max(1, priority.length)] };
  });
}

export function captureMistakes(userId, subject, result, topicUrl) {
  const review = result?.perQuestion || result?.perQ;
  if (!Array.isArray(review)) return;
  const existing = loadMistakes(userId, subject);
  const now = Date.now();
  for (const q of review) {
    const got = q.got ?? (q.correct ? q.marks : 0);
    const max = q.marks ?? q.max;
    if (got == null || !Number.isFinite(Number(max)) || got >= max * 0.6) continue;
    const topic = q.topic || q.topicName || q.title || 'Mixed practice';
    const id = `${q.qid}:${topic}`;
    const item = existing.find((row) => row.id === id);
    const next = { id, qid: q.qid, topic, question: q.text || q.prompt || q.title, answer: q.value, marks: got, max, due: now + DAY, interval: 0, completed: false, url: topicUrl(q, topic), added: now };
    if (item) Object.assign(item, next);
    else existing.push(next);
  }
  localStorage.setItem(studyKey(userId, subject, 'mistakes'), JSON.stringify(existing.slice(-100)));
}

export function advanceMistake(userId, subject, id) {
  const rows = loadMistakes(userId, subject).map((row) => {
    if (row.id !== id) return row;
    if (row.interval >= INTERVALS.length - 1) return { ...row, completed: true, due: null };
    const interval = Math.min(row.interval + 1, INTERVALS.length - 1);
    return { ...row, interval, due: Date.now() + INTERVALS[interval] * DAY };
  });
  localStorage.setItem(studyKey(userId, subject, 'mistakes'), JSON.stringify(rows));
  return rows;
}
