import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

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

/**
 * Per-user, per-subject JSON store.
 * A user's data lives at ${DATA_DIR}/users/<userId>/<subject>.json so
 * it survives server restarts and Docker redeploys on the persistent volume.
 */
export function createDb(userId, subject) {
  const dir = path.join(ROOT_DATA_DIR, 'users', String(userId));
  const file = path.join(dir, `${subject}.json`);
  let state = null;

  function loadDb() {
    if (state) return state;
    try {
      const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
      const storedCompletions = stored.completedLessons;
      const hasCompletedLessons = Array.isArray(storedCompletions)
        || (storedCompletions
          && typeof storedCompletions === 'object'
          && !Array.isArray(storedCompletions)
          && Object.values(storedCompletions).every((value) => typeof value === 'boolean'));
      state = { ...defaultState(), ...stored };
      state.completedLessons = normalizeCompletedLessons(
        state.completedLessons,
        hasCompletedLessons ? null : state.topicStats,
      );
    } catch {
      state = defaultState();
    }
    return state;
  }

  function saveDb() {
    const s = loadDb();
    fs.mkdirSync(dir, { recursive: true });
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(s));
    fs.renameSync(tmp, file);
  }

  /**
   * Register activity. Returns updated streak.
   */
  function registerActivity() {
    const s = loadDb();
    const today = new Date().toISOString().slice(0, 10);
    if (s.lastActiveDate === today) return s.streak;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    s.streak = s.lastActiveDate === yesterday ? s.streak + 1 : 1;
    s.lastActiveDate = today;
    saveDb();
    return s.streak;
  }

  function addXp(amount) {
    const s = loadDb();
    s.xp += amount;
    saveDb();
  }

  function rewardActivity({ scoreXp = 0, lessonId = null } = {}) {
    const s = loadDb();
    const safeScoreXp = Number.isFinite(Number(scoreXp)) ? Math.max(0, Number(scoreXp)) : 0;
    const normalizedLessonId = typeof lessonId === 'string' ? lessonId.trim() : '';
    const levelBefore = levelForXp(s.xp);
    const firstCompletion = Boolean(normalizedLessonId && !s.completedLessons.includes(normalizedLessonId));
    const completionXp = firstCompletion ? 20 : 0;
    const xpAwarded = safeScoreXp + completionXp;

    if (firstCompletion) s.completedLessons.push(normalizedLessonId);
    s.xp += xpAwarded;

    const today = new Date().toISOString().slice(0, 10);
    if (s.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      s.streak = s.lastActiveDate === yesterday ? s.streak + 1 : 1;
      s.lastActiveDate = today;
    }

    saveDb();
    return {
      scoreXp: safeScoreXp,
      completionXp,
      xpAwarded,
      firstCompletion,
      levelBefore,
      levelAfter: levelForXp(s.xp),
      progress: progress(),
    };
  }

  function recordTest(result) {
    const s = loadDb();
    s.testsTaken += 1;
    s.totalTestMarks += result.totalMarks;
    s.totalTestCorrect += result.correctMarks;
    s.history.unshift({
      id: result.id,
      at: new Date().toISOString(),
      type: result.type,
      totalMarks: result.totalMarks,
      correctMarks: result.correctMarks,
      percent: result.percent,
      grade: result.grade,
      topicAcc: result.topicAccuracy,
    });
    s.history = s.history.slice(0, 200);
    saveDb();
  }

  function recordPractice({ topicId, correct, total }) {
    const s = loadDb();
    const t = (s.topicStats[topicId] = s.topicStats[topicId] || {
      correct: 0,
      total: 0,
    });
    t.correct += correct;
    t.total += total;
    s.practiceAnswered += total;
    saveDb();
  }

  function progress() {
    const s = loadDb();
    const level = levelForXp(s.xp);
    const xpInto = s.xp - (level - 1) ** 2 * 50;
    const xpNeeded = (level ** 2 - (level - 1) ** 2) * 50;
    const completedLessonIds = [...s.completedLessons];
    return {
      xp: s.xp,
      level,
      xpInto,
      xpNeeded,
      streak: s.streak,
      testsTaken: s.testsTaken,
      practiceAnswered: s.practiceAnswered,
      overallPercent: s.totalTestMarks
        ? Math.round((100 * s.totalTestCorrect) / s.totalTestMarks)
        : null,
      history: s.history.slice(0, 20),
      topicStats: s.topicStats,
      completedLessonIds,
      lessonsCompleted: completedLessonIds.length,
    };
  }

  function getChatHistory() {
    return loadDb().chat.slice(-40);
  }

  function pushChat(role, content) {
    const s = loadDb();
    s.chat.push({ role, content, at: new Date().toISOString() });
    s.chat = s.chat.slice(-100);
    saveDb();
  }

  function clearChat() {
    const s = loadDb();
    s.chat = [];
    saveDb();
  }

  return {
    loadDb,
    saveDb,
    registerActivity,
    addXp,
    rewardActivity,
    recordTest,
    recordPractice,
    progress,
    getChatHistory,
    pushChat,
    clearChat,
  };
}
