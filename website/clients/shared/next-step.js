// 2.1 — "What should I study next?" recommendation engine.
//
// Pure functions over data the clients already fetch (topics catalogue,
// compact progress aggregates, saved personal plan + mistake notebook).
// No new backend, no invented content: every recommendation links to a
// real route with real material behind it.
//
// Priority (strongest learning loop first):
//   1. Mistakes due for retry  -> the mistake-to-mastery loop
//   2. Today's mission         -> the exam plan the learner already set
//   3. Weakest practised topic -> evidence from topicStats
//   4. Untouched core topic    -> breadth before depth for new learners
//   5. Diagnostic / practice   -> cold start or everything looks healthy

export function topicAccuracy(stats) {
  if (!stats || typeof stats.total !== 'number' || stats.total <= 0) return null;
  const correct = typeof stats.correct === 'number' ? stats.correct : 0;
  return Math.round((100 * correct) / stats.total);
}

export function weakTopics(topics, progress, limit = 3) {
  const stats = progress?.topicStats || {};
  const rows = (Array.isArray(topics) ? topics : [])
    .map((topic) => {
      const st = stats[topic.id];
      if (!st || !(st.total > 0)) return null;
      return {
        id: topic.id,
        name: topic.name || topic.id,
        accuracy: topicAccuracy(st),
        answered: st.total,
        strand: topic.strand || topic.section || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
  return rows.slice(0, Math.max(0, limit));
}

export function untouchedTopics(topics, progress, limit = 3) {
  const stats = progress?.topicStats || {};
  return (Array.isArray(topics) ? topics : [])
    .filter((topic) => {
      const st = stats[topic.id];
      return !st || !(st.total > 0);
    })
    .slice(0, Math.max(0, limit))
    .map((topic) => ({
      id: topic.id,
      name: topic.name || topic.id,
      strand: topic.strand || topic.section || null,
    }));
}

function countDueMistakes(personal, dueCount) {
  if (typeof dueCount === 'number' && Number.isFinite(dueCount)) return dueCount;
  const mistakes = personal?.mistakes;
  if (!Array.isArray(mistakes)) return 0;
  const now = Date.now();
  let due = 0;
  for (const row of mistakes) {
    if (row?.mastered) continue;
    const dates = Array.isArray(row?.dueDates) ? row.dueDates : [];
    const index = typeof row?.reviewIndex === 'number' ? row.reviewIndex : 0;
    const next = dates[index];
    if (!next || Date.parse(next) <= now) due += 1;
  }
  return due;
}

function todayMission(personal) {
  const days = personal?.plan?.days;
  if (!Array.isArray(days) || days.length === 0) return null;
  const pad = (value) => String(value).padStart(2, '0');
  const now = new Date();
  const key = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const today = days.find((day) => day.date === key) || null;
  if (!today || today.status === 'done') return null;
  return today;
}

// Where a learner can resume real work: the most recent durable attempt
// or an in-progress local draft. Callers pass what they know; anything
// missing is simply skipped rather than invented.
export function resumeTarget({ lastResult = null, activeTest = null, subject = 'maths' } = {}) {
  if (activeTest?.paper && activeTest?.type) {
    return {
      kind: 'resume',
      title: 'Resume your paper',
      detail: `Paper ${activeTest.paper} · ${activeTest.type === 'full' ? 'full paper' : 'quick paper'} — pick up where you left off.`,
      href: `/practice?paper=${encodeURIComponent(activeTest.paper)}&type=${encodeURIComponent(activeTest.type)}`,
    };
  }
  if (lastResult && typeof lastResult.percent === 'number') {
    void subject;
    return {
      kind: 'review',
      title: 'Review your last paper',
      detail: `You scored ${lastResult.percent}%. Walk the worked solutions, then retry what you missed.`,
      href: '/results',
    };
  }
  return null;
}

export function computeNextStep({ topics = [], progress = null, personal = null, dueCount = null, options = {} } = {}) {
  const list = Array.isArray(topics) ? topics : [];
  const stats = progress?.topicStats || {};
  const answered = Object.values(stats).reduce((sum, row) => sum + (row?.total || 0), 0);
  const practisedTopics = Object.values(stats).filter((row) => row && row.total > 0).length;
  const mission = todayMission(personal);
  const due = countDueMistakes(personal, dueCount);
  const weak = weakTopics(list, progress, 1)[0] || null;

  // 1. The loop that matters most: mistakes waiting for their retry date.
  if (due > 0) {
    return {
      kind: 'retry',
      eyebrow: due === 1 ? '1 mistake due' : `${due} mistakes due`,
      title: due === 1 ? 'Retry your due mistake' : 'Clear your due mistakes',
      detail: 'Spaced retries lock in what you missed. A few focused minutes now beats relearning it later.',
      href: '/notebook',
      cta: 'Open mistake notebook',
      meta: options.examDays != null && options.examDays >= 0 ? `${options.examDays} days to exams` : null,
    };
  }

  // 2. Today's plan beats browsing: the learner already chose this.
  if (mission) {
    if (mission.topicId) {
      return {
        kind: 'mission',
        eyebrow: "Today's mission",
        title: mission.task || 'Complete today’s mission',
        detail: `${mission.minutes || 15} focused minutes · learn it, then finish the short practice to lock today in.`,
        href: `/learn/${mission.topicId}`,
        cta: 'Start mission',
        meta: mission.label || null,
      };
    }
    const isRetryDay = mission.task === 'Mistake retry';
    return {
      kind: 'mission',
      eyebrow: "Today's mission",
      title: mission.task || 'Complete today’s mission',
      detail: isRetryDay
        ? 'No new lesson today. Work the notebook, then the day is yours.'
        : 'This day has no lesson — use the practice desk to keep your plan on track.',
      href: isRetryDay ? '/notebook' : '/practice',
      cta: isRetryDay ? 'Open notebook' : 'Open practice',
      meta: mission.label || null,
    };
  }

  // 3. Evidence-led: the weakest practised topic earns attention first.
  if (weak && weak.accuracy != null && weak.accuracy < 70) {
    return {
      kind: 'weak-topic',
      eyebrow: `Needs work · ${weak.accuracy}% so far`,
      title: `Revisit ${weak.name}`,
      detail: `Your accuracy across ${weak.answered} question${weak.answered === 1 ? '' : 's'} suggests the method is not secure yet. Reread the lesson, then drill it.`,
      href: `/learn/${weak.id}`,
      cta: 'Relearn this topic',
      meta: weak.strand,
    };
  }

  // 4. Cold start: point at the diagnostic, not an empty dashboard.
  if (answered === 0 || practisedTopics === 0) {
    return {
      kind: 'diagnostic',
      eyebrow: 'Start here',
      title: 'Take the 10-question diagnostic',
      detail: 'It samples every strand in about ten minutes and sets your first week of missions.',
      href: '/practice?diagnostic=1#adhoc',
      cta: 'Start diagnostic',
      meta: null,
    };
  }

  // 5. Breadth: an untouched topic keeps momentum when nothing is weak.
  const fresh = untouchedTopics(list, progress, 1)[0] || null;
  if (fresh) {
    return {
      kind: 'fresh-topic',
      eyebrow: 'Keep momentum',
      title: `Learn ${fresh.name}`,
      detail: 'Nothing is overdue and nothing looks weak — open new ground while confidence is high.',
      href: `/learn/${fresh.id}`,
      cta: 'Open lesson',
      meta: fresh.strand,
    };
  }

  // 6. Healthy state: exam conditions.
  return {
    kind: 'practice',
    eyebrow: 'Everything on track',
    title: 'Sit a timed paper',
    detail: 'Your topics look secure. Prove it under exam timing and review the worked solutions.',
    href: '/practice',
    cta: 'Open practice desk',
    meta: null,
  };
}

// V3 mastery scale: New → Learning → Developing → Secure → Mastered,
// plus a Needs-revision flag for due/regressed rows. Tones stay back-compat
// (good/mid/low/quiet) so old CSS keeps working; V3 adds stage ids.
export function masteryStage(accuracy, answered = 0, needsRevision = false) {
  if (needsRevision) return { id: 'revision', text: 'Needs revision', tone: 'low' };
  if (accuracy == null) return { id: 'new', text: 'New', tone: 'quiet' };
  if (accuracy >= 90 && answered >= 5) return { id: 'mastered', text: 'Mastered', tone: 'good' };
  if (accuracy >= 70) return { id: 'secure', text: 'Secure', tone: 'good' };
  if (accuracy >= 40) return { id: 'developing', text: 'Developing', tone: 'mid' };
  return { id: 'learning', text: 'Learning', tone: 'low' };
}

export function strengthLabel(accuracy, answered = 0) {
  const stage = masteryStage(accuracy, answered, false);
  // Back-compat: old callers expect Secure/Developing/Focus/Not tried.
  if (stage.id === 'mastered' || stage.id === 'secure') return { text: stage.text, tone: 'good' };
  if (stage.id === 'developing') return { text: 'Developing', tone: 'mid' };
  if (stage.id === 'learning') return { text: 'Focus', tone: 'low' };
  return { text: 'Not tried', tone: 'quiet' };
}
