import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

import {
  loadBank,
  bankSize,
  questionsFor,
  buildPaper,
  buildPractice,
  markAnswers,
  checkAnswer,
  getQuestionById,
} from './bank/index.js';
import { TOPICS, STRANDS } from './bank/topics.js';
import { predictGrade, gradeLabel, nextBoundaryGap, BOUNDARIES } from './grades.js';
import {
  progress,
  recordTest,
  recordPractice,
  registerActivity,
  addXp,
  getChatHistory,
  pushChat,
  clearChat,
} from './db.js';
import { askTutor } from './chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash-0731';

const app = express();
app.use(express.json({ limit: '1mb' }));

const activeTests = new Map();

const publicTopic = (t) => ({
  id: t.id,
  strand: t.strand,
  name: t.name,
  blurb: t.blurb,
  examWeight: t.examWeight,
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    bankSize: bankSize(),
    model: OPENROUTER_MODEL,
    chatReady: !!OPENROUTER_API_KEY,
    boundaries: BOUNDARIES,
  });
});

app.get('/api/topics', (req, res) => {
  const p = progress();
  const byStrand = {};
  for (const s of Object.values(STRANDS)) {
    byStrand[s.id] = {
      ...s,
      topics: TOPICS.filter((t) => t.strand === s.id).map((t) => {
        const stats = p.topicStats[t.id];
        return {
          ...publicTopic(t),
          accuracy: stats && stats.total ? Math.round((100 * stats.correct) / stats.total) : null,
          answered: stats ? stats.total : 0,
        };
      }),
    };
  }
  res.json({ strands: byStrand });
});

app.get('/api/topics/:id', (req, res) => {
  const t = TOPICS.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Topic not found' });
  const p = progress();
  const stats = p.topicStats[t.id];
  res.json({
    ...publicTopic(t),
    strandName: STRANDS[t.strand].name,
    strandColor: STRANDS[t.strand].color,
    notes: t.notes,
    resources: t.resources,
    accuracy: stats && stats.total ? Math.round((100 * stats.correct) / stats.total) : null,
    answered: stats ? stats.total : 0,
  });
});

app.post('/api/test/new', (req, res) => {
  const type = req.body?.type === 'short' ? 'short' : 'full';
  const paper = buildPaper(type);
  const id = crypto.randomUUID();
  activeTests.set(id, { id, type, questions: paper.questions, startedAt: Date.now() });
  if (activeTests.size > 50) {
    const first = activeTests.keys().next().value;
    activeTests.delete(first);
  }
  res.json({ id, type, totalMarks: paper.totalMarks, minutes: paper.minutes, stretchCount: paper.stretchCount, questions: paper.questions });
});

app.post('/api/test/:id/submit', (req, res) => {
  const test = activeTests.get(req.params.id);
  if (!test) return res.status(404).json({ error: 'Test not found (it may have expired).' });
  const answers = req.body?.answers || [];
  const durationSec = req.body?.durationSec || null;

  const pool = test.questions.map((q) => getQuestionById(q.id)).filter(Boolean);
  const marked = markAnswers(pool, answers);
  for (const row of marked.perQ) {
    const qn = test.questions.findIndex((q) => q.id === row.qid);
    row.qn = qn + 1;
  }
  const totalMarks = test.totalMarks || marked.totalMarks;
  const correctMarks = marked.correctMarks;
  const percent = Math.round((100 * correctMarks) / totalMarks);
  const grade = predictGrade(correctMarks, totalMarks);
  const gap = nextBoundaryGap(correctMarks, totalMarks);

  // Strand & topic breakdown
  const strandMap = new Map();
  const topicMap = new Map();
  for (const row of marked.perQ) {
    const q = getQuestionById(row.qid);
    if (!q) continue;
    const sk = q.strandName;
    if (!strandMap.has(sk)) strandMap.set(sk, { name: sk, marks: 0, got: 0, color: STRANDS[q.strand].color });
    const s = strandMap.get(sk);
    s.marks += row.marks;
    s.got += row.correct ? row.marks : 0;
    if (!topicMap.has(q.topicId)) topicMap.set(q.topicId, { id: q.topicId, name: q.topic, marks: 0, got: 0 });
    const tp = topicMap.get(q.topicId);
    tp.marks += row.marks;
    tp.got += row.correct ? row.marks : 0;
  }
  const strandAnalysis = [...strandMap.values()].map((s) => ({
    ...s,
    percent: Math.round((100 * s.got) / s.marks),
  }));
  const topics = [...topicMap.values()]
    .map((t) => ({ ...t, percent: Math.round((100 * t.got) / t.marks) }))
    .sort((a, b) => a.percent - b.percent);
  const weakTopics = topics.filter((t) => t.percent < 50);
  const strongTopics = topics.filter((t) => t.percent >= 80).sort((a, b) => b.percent - a.percent);

  const weakDetail = weakTopics.map((t) => {
    const meta = TOPICS.find((x) => x.id === t.id);
    return {
      id: t.id,
      name: t.name,
      strand: meta.strand,
      percent: t.percent,
      internal: `/learn/${t.id}`,
      resources: meta.resources,
    };
  });

  const result = {
    id: test.id,
    type: test.type,
    totalMarks,
    correctMarks,
    percent,
    grade,
    gradeLabel: gradeLabel(grade),
    nextBoundary: gap,
    durationSec,
    strandAnalysis,
    weakTopics: weakDetail,
    strongTopics: strongTopics.slice(0, 3).map((t) => ({ id: t.id, name: t.name, percent: t.percent })),
    perQuestion: marked.perQ,
  };

  recordTest({ ...result, topicAccuracy: topics.map((t) => ({ id: t.id, percent: t.percent })) });
  addXp(correctMarks * 2);
  registerActivity();
  activeTests.delete(test.id);
  res.json(result);
});

app.post('/api/practice', (req, res) => {
  const topicId = req.body?.topicId;
  const count = Math.min(20, Math.max(4, req.body?.count || 8));
  const questions = buildPractice(topicId, count);
  if (!questions.length) return res.status(404).json({ error: 'Topic not found' });
  res.json({ topicId, questions });
});

app.post('/api/check', (req, res) => {
  const { qid, value } = req.body || {};
  if (!qid) return res.status(400).json({ error: 'qid required' });
  const out = checkAnswer(qid, value);
  res.json(out);
});

app.post('/api/practice/submit', (req, res) => {
  const { topicId, answers } = req.body || {};
  if (!topicId) return res.status(400).json({ error: 'topicId required' });
  const pool = questionsFor(topicId);
  const marked = markAnswers(pool, answers);
  recordPractice({ topicId, correct: marked.correctMarks, total: marked.totalMarks });
  addXp(marked.correctMarks);
  registerActivity();
  res.json({ correctMarks: marked.correctMarks, totalMarks: marked.totalMarks, perQ: marked.perQ });
});

app.get('/api/progress', (req, res) => {
  res.json(progress());
});

app.post('/api/chat', async (req, res) => {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages required' });
  }
  registerActivity();
  pushChat('user', messages[messages.length - 1].content);
  try {
    const out = await askTutor(messages, { model: OPENROUTER_MODEL, apiKey: OPENROUTER_API_KEY });
    pushChat('assistant', out.reply);
    res.json(out);
  } catch (e) {
    res.json({ reply: 'Something went wrong talking to the AI. Try again in a moment.', model: 'error', error: true });
  }
});

app.delete('/api/chat', (req, res) => {
  clearChat();
  res.json({ ok: true });
});

app.get('/api/chat/history', (req, res) => {
  res.json({ messages: getChatHistory() });
});

// Serve the built React app in production.
const dist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

await loadBank();
console.log(`[bank] ${bankSize()} questions loaded across ${TOPICS.length} topics`);

app.listen(PORT, () => {
  console.log(`[server] Maths Dashboard on http://localhost:${PORT}`);
  console.log(`[chat] model=${OPENROUTER_MODEL} key=${OPENROUTER_API_KEY ? 'configured' : 'MISSING (offline tutor mode)'}`);
});
