import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT_DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', '..', 'data');
export const DATA_DIR = path.join(ROOT_DATA_DIR, 'english');

const DB_FILE = path.join(DATA_DIR, 'db.json');

const defaultState = () => ({
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  testsTaken: 0,
  practiceAnswered: 0,
  totalTestMarks: 0,
  totalTestCorrect: 0,
  topicStats: {},
  history: [],
  chat: [],
});

let state = null;

export function loadDb() {
  if (state) return state;
  try {
    state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    state = { ...defaultState(), ...state };
  } catch {
    state = defaultState();
  }
  return state;
}

export function saveDb() {
  const s = loadDb();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s));
  fs.renameSync(tmp, DB_FILE);
}

/**
 * Register activity. Returns updated streak.
 */
export function registerActivity() {
  const s = loadDb();
  const today = new Date().toISOString().slice(0, 10);
  if (s.lastActiveDate === today) return s.streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  s.streak = s.lastActiveDate === yesterday ? s.streak + 1 : 1;
  s.lastActiveDate = today;
  saveDb();
  return s.streak;
}

export function addXp(amount) {
  const s = loadDb();
  s.xp += amount;
  saveDb();
}

export function recordTest(result) {
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

export function recordPractice({ topicId, correct, total }) {
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

export function progress() {
  const s = loadDb();
  const level = Math.floor(Math.sqrt(s.xp / 50)) + 1;
  const xpInto = s.xp - (level - 1) ** 2 * 50;
  const xpNeeded = (level ** 2 - (level - 1) ** 2) * 50;
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
  };
}

export function getChatHistory() {
  return loadDb().chat.slice(-40);
}

export function pushChat(role, content) {
  const s = loadDb();
  s.chat.push({ role, content, at: new Date().toISOString() });
  s.chat = s.chat.slice(-100);
  saveDb();
}

export function clearChat() {
  const s = loadDb();
  s.chat = [];
  saveDb();
}
