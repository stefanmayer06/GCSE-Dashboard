import { defaultStorage } from './storage/index.js';

const defaultState = () => ({
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  testsTaken: 0,
  practiceAnswered: 0,
  totalTestMarks: 0,
  totalTestCorrect: 0,
  topicStats: {},
  completedLessons: [],
  history: [],
  chat: [],
});

const levelForXp = (xp) => Math.floor(Math.sqrt(xp / 50)) + 1;

function normalizeCompletedLessons(completedLessons, topicStats) {
  let values = [];
  if (Array.isArray(completedLessons)) {
    values = completedLessons;
  } else if (completedLessons && typeof completedLessons === 'object') {
    values = Object.entries(completedLessons)
      .filter(([, completed]) => completed === true)
      .map(([lessonId]) => lessonId);
  }

  const normalized = new Set(
    values
      .filter((lessonId) => typeof lessonId === 'string')
      .map((lessonId) => lessonId.trim())
      .filter(Boolean),
  );
  if (topicStats && typeof topicStats === 'object' && !Array.isArray(topicStats)) {
    for (const [topicId, stats] of Object.entries(topicStats)) {
      if (stats && Number(stats.total) > 0) normalized.add(topicId);
    }
  }
  return [...normalized];
}

function normalizeState(stored) {
  const source = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  const storedCompletions = source.completedLessons;
  const hasCompletedLessons = Array.isArray(storedCompletions)
    || (storedCompletions
      && typeof storedCompletions === 'object'
      && !Array.isArray(storedCompletions)
      && Object.values(storedCompletions).every((value) => typeof value === 'boolean'));
  const state = { ...defaultState(), ...source };
  state.completedLessons = normalizeCompletedLessons(
    state.completedLessons,
    hasCompletedLessons ? null : state.topicStats,
  );
  return state;
}

function progressFor(state, { includeHistory = true } = {}) {
  const level = levelForXp(state.xp);
  const xpInto = state.xp - (level - 1) ** 2 * 50;
  const xpNeeded = (level ** 2 - (level - 1) ** 2) * 50;
  const completedLessonIds = [...state.completedLessons];
  const result = {
    xp: state.xp,
    level,
    xpInto,
    xpNeeded,
    streak: state.streak,
    testsTaken: state.testsTaken,
    practiceAnswered: state.practiceAnswered,
    overallPercent: state.totalTestMarks
      ? Math.round((100 * state.totalTestCorrect) / state.totalTestMarks)
      : null,
    topicStats: state.topicStats,
    completedLessonIds,
    lessonsCompleted: completedLessonIds.length,
  };
  if (includeHistory) result.history = state.history.slice(0, 20);
  return result;
}

function applyActivity(state) {
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastActiveDate === today) return state.streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  state.streak = state.lastActiveDate === yesterday ? state.streak + 1 : 1;
  state.lastActiveDate = today;
  return state.streak;
}

function applyReward(state, { scoreXp = 0, lessonId = null } = {}, includeHistory = true) {
  const safeScoreXp = Number.isFinite(Number(scoreXp)) ? Math.max(0, Number(scoreXp)) : 0;
  const normalizedLessonId = typeof lessonId === 'string' ? lessonId.trim() : '';
  const levelBefore = levelForXp(state.xp);
  const firstCompletion = Boolean(
    normalizedLessonId && !state.completedLessons.includes(normalizedLessonId),
  );
  const completionXp = firstCompletion ? 20 : 0;
  const xpAwarded = safeScoreXp + completionXp;

  if (firstCompletion) state.completedLessons.push(normalizedLessonId);
  state.xp += xpAwarded;
  applyActivity(state);

  return {
    scoreXp: safeScoreXp,
    completionXp,
    xpAwarded,
    firstCompletion,
    levelBefore,
    levelAfter: levelForXp(state.xp),
    progress: progressFor(state, { includeHistory }),
  };
}

function applyTest(state, result) {
  state.testsTaken += 1;
  state.totalTestMarks += result.totalMarks;
  state.totalTestCorrect += result.correctMarks;
  state.history.unshift({
    id: result.id,
    at: new Date().toISOString(),
    type: result.type,
    totalMarks: result.totalMarks,
    correctMarks: result.correctMarks,
    percent: result.percent,
    grade: result.grade,
    topicAcc: result.topicAccuracy,
  });
  state.history = state.history.slice(0, 200);
}

function applyPractice(state, { topicId, correct, total }) {
  const topic = (state.topicStats[topicId] = state.topicStats[topicId] || {
    correct: 0,
    total: 0,
  });
  topic.correct += correct;
  topic.total += total;
  state.practiceAnswered += total;
}

function applyPracticeRecords(state, records) {
  for (const record of Array.isArray(records) ? records : [records]) {
    applyPractice(state, record);
  }
}

/** Per-user, per-subject progress backed by the configured async storage driver. */
export function createDb(userId, subject, storage = defaultStorage) {
  const dbUserId = String(userId);
  const dbSubject = String(subject);
  const compactStorage = storage.driver === 'supabase';

  async function loadDb() {
    return normalizeState(await storage.getProgress(dbUserId, dbSubject));
  }

  async function mutate(update) {
    return storage.mutateProgress(dbUserId, dbSubject, (stored) => {
      const state = normalizeState(stored);
      return { state, value: update(state) };
    });
  }

  async function registerActivity() {
    if (compactStorage) {
      const result = await storage.mutateSubjectProgress(dbUserId, dbSubject, { type: 'activity' });
      return result.progress.streak;
    }
    return mutate((state) => applyActivity(state));
  }

  async function addXp(amount) {
    if (compactStorage) {
      await storage.mutateSubjectProgress(dbUserId, dbSubject, { type: 'add_xp', amount });
      return;
    }
    return mutate((state) => {
      state.xp += amount;
    });
  }

  async function rewardActivity(options = {}) {
    if (compactStorage) {
      const result = await storage.mutateSubjectProgress(dbUserId, dbSubject, {
        type: 'reward',
        scoreXp: options.scoreXp,
        lessonId: options.lessonId,
      });
      return result.reward;
    }
    return mutate((state) => applyReward(state, options));
  }

  async function recordTest(result) {
    if (compactStorage) {
      await storage.mutateSubjectProgress(dbUserId, dbSubject, {
        type: 'test',
        testResult: result,
      });
      return;
    }
    return mutate((state) => {
      applyTest(state, result);
    });
  }

  async function recordPractice(record) {
    if (compactStorage) {
      await storage.mutateSubjectProgress(dbUserId, dbSubject, {
        type: 'practice',
        record,
      });
      return;
    }
    return mutate((state) => {
      applyPractice(state, record);
    });
  }

  async function recordTestAndReward({ result, scoreXp, lessonId = null }) {
    if (compactStorage) {
      const updated = await storage.mutateSubjectProgress(dbUserId, dbSubject, {
        type: 'test_and_reward',
        testResult: result,
        scoreXp,
        lessonId,
      });
      return updated.reward;
    }
    return mutate((state) => {
      applyTest(state, result);
      return applyReward(state, { scoreXp, lessonId });
    });
  }

  async function recordPracticeAndReward({ records, scoreXp, lessonId = null }) {
    if (compactStorage) {
      const updated = await storage.mutateSubjectProgress(dbUserId, dbSubject, {
        type: 'practice_and_reward',
        records,
        scoreXp,
        lessonId,
      });
      return updated.reward;
    }
    return mutate((state) => {
      applyPracticeRecords(state, records);
      return applyReward(state, { scoreXp, lessonId });
    });
  }

  async function progress() {
    return progressFor(await loadDb(), { includeHistory: !compactStorage });
  }

  async function getChatHistory() {
    if (compactStorage) return [];
    return (await loadDb()).chat.slice(-40);
  }

  async function pushChat(role, content) {
    if (compactStorage) return;
    return mutate((state) => {
      state.chat.push({ role, content, at: new Date().toISOString() });
      state.chat = state.chat.slice(-100);
    });
  }

  async function clearChat() {
    if (compactStorage) return;
    return mutate((state) => {
      state.chat = [];
    });
  }

  async function finalizeStudySession(criteria, operation) {
    return storage.finalizeStudySession({
      id: criteria.id,
      userId: dbUserId,
      subject: dbSubject,
      kind: criteria.kind,
    }, (_session, stored) => {
      const state = normalizeState(stored);
      if (operation.testResult !== undefined) applyTest(state, operation.testResult);
      if (operation.practiceRecords !== undefined) {
        applyPracticeRecords(state, operation.practiceRecords);
      }
      const rewarded = applyReward(state, operation, !compactStorage);
      const { progress, ...reward } = rewarded;
      return {
        state,
        response: { ...operation.response, reward, progress },
      };
    });
  }

  return {
    loadDb,
    registerActivity,
    addXp,
    rewardActivity,
    recordTest,
    recordPractice,
    recordTestAndReward,
    recordPracticeAndReward,
    progress,
    getChatHistory,
    pushChat,
    clearChat,
    finalizeStudySession,
  };
}
