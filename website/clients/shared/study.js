const DAY = 86400000;
const FALLBACK_TASKS = ['Diagnostic', 'Core skills', 'Mixed recall'];

export function dateKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

function planMinutes(subject, passMode) {
  if (passMode && subject === 'maths') return 15;
  return subject === 'english' ? 20 : 15;
}

// Weeks run Monday to Sunday so the exam plan always shows the same calendar
// week, with days before today rendered as already passed.
export function weekStartKey(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return dateKey(new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY));
}

export function buildWeekPlan(priority, subject, passMode, now = new Date(), seeds = []) {
  const start = new Date(`${weekStartKey(now)}T12:00:00`);
  const today = dateKey(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY);
    const seed = (Array.isArray(seeds) ? seeds : []).find((row) => row.date === dateKey(date));
    const isReview = index === 3 || index === 6;
    const item = isReview ? null : priority[index % Math.max(1, priority.length)] || null;
    const task = seed?.topic || (isReview ? (index === 6 ? 'Weekly review' : 'Mistake retry') : item?.name || FALLBACK_TASKS[index % 3]);
    return {
      date: dateKey(date),
      label: dateKey(date) === today ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' }),
      task,
      topicId: seed?.topicId || (task === item?.name ? item?.id : undefined) || null,
      minutes: planMinutes(subject, passMode),
      status: 'todo',
    };
  });
  return { from: weekStartKey(now), days };
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