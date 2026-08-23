import express from 'express';
import crypto from 'node:crypto';

import {
  loadBank,
  bankSize,
  questionsFor,
  buildPaper,
  buildPractice,
  buildAdhoc,
  markAnswers,
  checkAnswer,
  getQuestionById,
  paperList,
} from './bank/index.js';
import { TOPICS, STRANDS } from './bank/topics.js';
import { predictGrade, gradeLabel, nextBoundaryGap, BOUNDARIES } from './grades.js';
import { createDb } from '../../db.js';
import { askTutor } from './chat.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b';

const app = express.Router();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  if (req.user) req.db = createDb(req.user.id, 'maths');
  next();
});

const activeTests = new Map();

const publicTopic = (t) => ({
  id: t.id,
  strand: t.strand,
  name: t.name,
  blurb: t.blurb,
  examWeight: t.examWeight,
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    bankSize: bankSize(),
    model: OPENROUTER_MODEL,
    chatReady: !!OPENROUTER_API_KEY,
    boundaries: BOUNDARIES,
  });
});

app.get('/topics', (req, res) => {
  const p = req.db.progress();
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

app.get('/topics/:id', (req, res) => {
  const t = TOPICS.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Topic not found' });
  const p = req.db.progress();
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

app.get('/papers', (req, res) => {
  res.json({ papers: paperList() });
});

app.post('/test/new', (req, res) => {
  const type = req.body?.type === 'short' ? 'short' : 'full';
  const paperId = [1, 2, 3].includes(req.body?.paper) ? req.body.paper : 1;
  const paper = buildPaper(type, paperId);
  const id = crypto.randomUUID();
  activeTests.set(id, {
    id,
    type,
    paperId: paper.paperId,
    paperCode: paper.paperCode,
    paperName: paper.paperName,
    calculator: paper.calculator,
    questions: paper.questions,
    startedAt: Date.now(),
  });
  if (activeTests.size > 50) {
    const first = activeTests.keys().next().value;
    activeTests.delete(first);
  }
  res.json({
    id,
    type,
    paperId: paper.paperId,
    paperCode: paper.paperCode,
    paperName: paper.paperName,
    calculator: paper.calculator,
    totalMarks: paper.totalMarks,
    minutes: paper.minutes,
    stretchCount: paper.stretchCount,
    strandCoverage: paper.strandCoverage,
    questions: paper.questions,
  });
});

app.post('/test/:id/submit', (req, res) => {
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
    paperId: test.paperId,
    paperCode: test.paperCode,
    paperName: test.paperName,
    calculator: test.calculator,
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

  req.db.recordTest({ ...result, topicAccuracy: topics.map((t) => ({ id: t.id, percent: t.percent })) });
  req.db.addXp(correctMarks * 2);
  req.db.registerActivity();
  activeTests.delete(test.id);
  res.json(result);
});

app.post('/practice', (req, res) => {
  const topicId = req.body?.topicId;
  const count = Math.min(20, Math.max(4, req.body?.count || 8));
  const questions = buildPractice(topicId, count);
  if (!questions.length) return res.status(404).json({ error: 'Topic not found' });
  res.json({ topicId, questions });
});

app.post('/check', (req, res) => {
  const { qid, value } = req.body || {};
  if (!qid) return res.status(400).json({ error: 'qid required' });
  const out = checkAnswer(qid, value);
  res.json(out);
});

app.post('/practice/submit', (req, res) => {
  const { topicId, answers } = req.body || {};
  if (!topicId) return res.status(400).json({ error: 'topicId required' });
  const pool = questionsFor(topicId);
  const marked = markAnswers(pool, answers);
  req.db.recordPractice({ topicId, correct: marked.correctMarks, total: marked.totalMarks });
  req.db.addXp(marked.correctMarks);
  req.db.registerActivity();
  res.json({ correctMarks: marked.correctMarks, totalMarks: marked.totalMarks, perQ: marked.perQ });
});

app.post('/adhoc', (req, res) => {
  const count = Math.min(30, Math.max(5, req.body?.count || 15));
  const papers = Array.isArray(req.body?.papers) && req.body.papers.length
    ? req.body.papers
    : [1, 2, 3];
  const set = buildAdhoc(count, papers);
  res.json(set);
});

app.post('/adhoc/submit', (req, res) => {
  const answers = req.body?.answers || [];
  const results = { perQ: [], correctMarks: 0, totalMarks: 0 };
  const topicTally = new Map();
  for (const { qid, value } of answers) {
    const q = getQuestionById(qid);
    if (!q) continue;
    const { correct, answerText } = checkAnswer(qid, value);
    results.totalMarks += q.marks;
    if (correct) results.correctMarks += q.marks;
    results.perQ.push({ qid, marks: q.marks, correct, value: value ?? null, answerText, topicId: q.topicId, topic: q.topic });
    if (!topicTally.has(q.topicId)) topicTally.set(q.topicId, { correct: 0, total: 0 });
    const t = topicTally.get(q.topicId);
    t.total += q.marks;
    if (correct) t.correct += q.marks;
  }
  for (const [topicId, t] of topicTally) req.db.recordPractice({ topicId, correct: t.correct, total: t.total });
  req.db.addXp(results.correctMarks);
  req.db.registerActivity();
  res.json(results);
});

app.get('/progress', (req, res) => {
  res.json(req.db.progress());
});

app.post('/chat', async (req, res) => {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages required' });
  }
  req.db.registerActivity();
  req.db.pushChat('user', messages[messages.length - 1].content);
  try {
    const out = await askTutor(messages, { model: OPENROUTER_MODEL, apiKey: OPENROUTER_API_KEY });
    req.db.pushChat('assistant', out.reply);
    res.json(out);
  } catch (e) {
    res.json({ reply: 'Something went wrong talking to the AI. Try again in a moment.', model: 'error', error: true });
  }
});

app.delete('/chat', (req, res) => {
  req.db.clearChat();
  res.json({ ok: true });
});

app.get('/chat/history', (req, res) => {
  res.json({ messages: req.db.getChatHistory() });
});

await loadBank();
console.log(`[bank] ${bankSize()} questions loaded across ${TOPICS.length} topics`);
export default app;
