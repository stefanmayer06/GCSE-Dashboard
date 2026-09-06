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

function planMinutes(subject, passMode, preferences) {
  const override = Number.isInteger(preferences?.minutesPerDay)
    ? Math.max(5, Math.min(120, preferences.minutesPerDay))
    : null;
  if (override) return override;
  if (passMode && subject === 'maths') return 15;
  return subject === 'english' ? 20 : 15;
}

// Weeks run Monday to Sunday so the exam plan always shows the same calendar
// week, with days before today rendered as already passed. Rest days from
// preferences render as real rest (never a mission, never a miss).
export function weekStartKey(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return dateKey(new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY));
}

const weekdayOf = (date) => (date.getDay() + 6) % 7; // Monday = 0 … Sunday = 6

export function buildWeekPlan(priority, subject, passMode, now = new Date(), seeds = [], preferences = null) {
  const start = new Date(`${weekStartKey(now)}T12:00:00`);
  const today = dateKey(now);
  const restDays = new Set(
    Array.isArray(preferences?.restDays)
      ? preferences.restDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : [],
  );
  const minutes = planMinutes(subject, passMode, preferences);
  let lessonCursor = 0;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY);
    const seed = (Array.isArray(seeds) ? seeds : []).find((row) => row.date === dateKey(date));
    if (!seed && restDays.has(weekdayOf(date))) {
      return {
        date: dateKey(date),
        label: dateKey(date) === today ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' }),
        task: 'Rest day',
        topicId: null,
        minutes: 0,
        status: 'todo',
        rest: true,
      };
    }
    const isReview = index === 3 || index === 6;
    // Skip review slots that fall on rest days is handled above; lessons walk
    // the priority list in order so rest days never consume a topic.
    let item = null;
    if (!isReview) {
      const list = Array.isArray(priority) ? priority : [];
      item = list.length ? list[lessonCursor++ % list.length] : null;
    }
    const task = seed?.topic || (isReview ? (index === 6 ? 'Weekly review' : 'Mistake retry') : item?.name || FALLBACK_TASKS[index % 3]);
    return {
      date: dateKey(date),
      label: dateKey(date) === today ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'short' }),
      task,
      topicId: seed?.topicId || (task === item?.name ? item?.id : undefined) || null,
      minutes,
      status: 'todo',
    };
  });
  return { from: weekStartKey(now), days };
}

// Move a future day's work to another future day (same week): swaps tasks so
// a busy day never silently drops its mission.
export function movePlanDay(plan, fromDate, toDate, today = dateKey()) {
  if (!plan || !Array.isArray(plan.days)) return null;
  if (fromDate < today || toDate < today || fromDate === toDate) return null;
  const days = plan.days.map((day) => ({ ...day }));
  const from = days.find((day) => day.date === fromDate);
  const to = days.find((day) => day.date === toDate);
  if (!from || !to || from.status === 'done' || to.status === 'done') return null;
  if (from.rest || to.rest) return null;
  const swap = { task: from.task, topicId: from.topicId, minutes: from.minutes };
  from.task = to.task;
  from.topicId = to.topicId;
  from.minutes = to.minutes;
  to.task = swap.task;
  to.topicId = swap.topicId;
  to.minutes = swap.minutes;
  return { ...plan, days };
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

// Milestones with real meaning: streak eras, paper counts, lesson counts.
// Each reached milestone is shareable; streak eras also bank a freeze
// server-side, so the payout is protection, not confetti.
const MILESTONE_DEFS = [
  { id: 'streak-7', kind: 'streak', at: 7, label: '7-day streak', detail: 'A full week — banks a streak freeze.' },
  { id: 'streak-30', kind: 'streak', at: 30, label: '30-day streak', detail: 'A full month — banks a streak freeze.' },
  { id: 'streak-100', kind: 'streak', at: 100, label: '100-day streak', detail: 'Century club — banks a streak freeze.' },
  { id: 'papers-1', kind: 'papers', at: 1, label: 'First timed paper', detail: 'Sat a full paper under exam conditions.' },
  { id: 'papers-10', kind: 'papers', at: 10, label: '10 timed papers', detail: 'Double digits of exam-day practice.' },
  { id: 'papers-25', kind: 'papers', at: 25, label: '25 timed papers', detail: 'A whole exam season of papers.' },
  { id: 'lessons-5', kind: 'lessons', at: 5, label: '5 lessons completed', detail: 'Five topics learned and drilled.' },
  { id: 'lessons-25', kind: 'lessons', at: 25, label: '25 lessons completed', detail: 'Serious ground covered.' },
];

export function milestonesFor(progress) {
  const values = {
    streak: progress?.streak ?? 0,
    papers: progress?.testsTaken ?? 0,
    lessons: progress?.lessonsCompleted ?? 0,
  };
  return MILESTONE_DEFS.map((def) => {
    const value = values[def.kind] ?? 0;
    return { ...def, value, reached: value >= def.at };
  });
}

// Fix-Up 5 targeting: due mistake topics first (most urgent), then weakest
// practised topics. Returns topic ids for Maths, skill/kind routing for
// English (writing weaknesses route to lessons — quick-fire can't mark
// extended writing, and the UI says so honestly).
const ENGLISH_WRITING_SKILLS = new Set(['creative-writing', 'argument-writing', 'accuracy']);

export function fixupTargets({ topics = [], progress = null, mistakes = [], limit = 5 } = {}) {
  const stats = progress?.topicStats || {};
  const now = Date.now();
  const dueTopics = [];
  for (const row of Array.isArray(mistakes) ? mistakes : []) {
    if (row?.mastered || !row?.topicId) continue;
    const due = row.dueDates?.[row.reviewIndex ?? 0];
    if (due && Date.parse(due) <= now && !dueTopics.includes(row.topicId)) dueTopics.push(row.topicId);
  }
  const weak = [...topics]
    .map((topic) => {
      const st = stats[topic.id];
      if (!st || !(st.total > 0)) return null;
      return { id: topic.id, accuracy: Math.round((100 * (st.correct || 0)) / st.total) };
    })
    .filter(Boolean)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((row) => row.id);
  const ordered = [...dueTopics];
  for (const id of weak) {
    if (ordered.length >= limit) break;
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered.slice(0, Math.max(1, limit));
}

export function fixupEnglishPlan({ topics = [], progress = null, mistakes = [], limit = 5 } = {}) {
  const ids = fixupTargets({ topics, progress, mistakes, limit: limit + 2 });
  const quickfire = [];
  const lessons = [];
  for (const id of ids) {
    if (ENGLISH_WRITING_SKILLS.has(id)) {
      if (lessons.length < 2) lessons.push(id);
    } else if (quickfire.length < limit) {
      quickfire.push(id);
    }
    if (quickfire.length >= limit && lessons.length >= 2) break;
  }
  // Quick-fire only covers listing/structure/comparing-style skills: map
  // anything else onto the analysis kind honestly rather than pretending.
  const kinds = quickfire.includes('listing') ? ['listing', 'truefalse', 'analysis'] : ['analysis', 'truefalse', 'listing'];
  return { skillIds: quickfire.slice(0, limit), kinds, lessons };
}