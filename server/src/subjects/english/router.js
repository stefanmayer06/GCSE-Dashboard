import express from 'express';
import crypto from 'node:crypto';

import {
  paperList,
  buildPaper,
  buildPractice,
  buildAdhoc,
  fullSetFor,
  allTexts,
  getTextDetail,
} from './bank/index.js';
import { TOPICS, SECTIONS } from './topics.js';
import { BOUNDARIES, predictGrade, gradeLabel, nextBoundaryGap } from './grades.js';
import { markList, markTrueFalse } from './marker.js';
import { markAnswer, askTutor, aiConfig } from './ai.js';
import { createDb } from '../../db.js';

const { apiKey, model } = aiConfig();

const app = express.Router();
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  if (req.user) req.db = createDb(req.user.id, 'english');
  next();
});

const activeTests = new Map();
const sessions = new Map();

function newSession(kind, fullQuestions) {
  const id = crypto.randomUUID();
  sessions.set(id, { kind, questions: fullQuestions, at: Date.now() });
  if (sessions.size > 100) sessions.delete(sessions.keys().next().value);
  return id;
}

function sessionFor(id) {
  const s = sessions.get(id);
  if (!s) return null;
  return s;
}

const stripMarkCtx = (q) => {
  const out = { ...q };
  delete out.markCtx;
  return out;
};

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    texts: allTexts().length,
    model,
    chatReady: !!apiKey,
    aiMarking: !!apiKey,
    boundaries: BOUNDARIES,
    papers: paperList(),
  });
});

app.get('/papers', (req, res) => {
  res.json({ papers: paperList() });
});

app.get('/texts', (req, res) => {
  res.json({ texts: allTexts() });
});

app.get('/texts/:id', (req, res) => {
  const t = getTextDetail(req.params.id);
  if (!t) return res.status(404).json({ error: 'Text not found' });
  res.json(t);
});

/* ---------------- learning topics ---------------- */

app.get('/topics', (req, res) => {
  const p = req.db.progress();
  const out = {};
  for (const s of Object.values(SECTIONS)) {
    out[s.id] = {
      ...s,
      topics: TOPICS.filter((t) => t.section === s.id).map((t) => {
        const stats = p.topicStats[t.id];
        return {
          id: t.id,
          section: t.section,
          name: t.name,
          blurb: t.blurb,
          examWeight: t.examWeight,
          accuracy: stats && stats.total ? Math.round((100 * stats.correct) / stats.total) : null,
          answered: stats ? stats.total : 0,
        };
      }),
    };
  }
  res.json({ sections: out });
});

app.get('/topics/:id', (req, res) => {
  const t = TOPICS.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Topic not found' });
  const p = req.db.progress();
  const stats = p.topicStats[t.id];
  res.json({
    id: t.id,
    section: t.section,
    sectionName: SECTIONS[t.section].name,
    sectionColor: SECTIONS[t.section].color,
    name: t.name,
    blurb: t.blurb,
    examWeight: t.examWeight,
    notes: t.notes,
    resources: t.resources,
    accuracy: stats && stats.total ? Math.round((100 * stats.correct) / stats.total) : null,
    answered: stats ? stats.total : 0,
  });
});

/* ---------------- tests ---------------- */

app.post('/test/new', (req, res) => {
  const type = req.body?.type === 'short' ? 'short' : 'full';
  const paperId = req.body?.paper === 2 ? 2 : 1;
  const paper = buildPaper(type, paperId);
  const id = crypto.randomUUID();
  const full = fullSetFor(paper.entryId, paperId);
  const byId = new Map(full.map((q) => [q.id, q]));
  const questions = paper.questions.map((q) => ({ ...q, __full: byId.get(q.id) }));
  activeTests.set(id, { id, type, paperId, entryId: paper.entryId, questions, totalMarks: paper.totalMarks, startedAt: Date.now() });
  if (activeTests.size > 30) activeTests.delete(activeTests.keys().next().value);
  res.json({ id, ...paper });
});

function sourceTextFor(test) {
  const entry = getTextDetail(test.entryId);
  if (!entry) return '';
  if (test.paperId === 1) return entry.text || '';
  return `${entry.textA || ''}\n\n${entry.textB || ''}`.slice(0, 7000);
}

app.post('/test/:id/submit', async (req, res) => {
  const test = activeTests.get(req.params.id);
  if (!test) return res.status(404).json({ error: 'Test not found (it may have expired).' });
  const answers = req.body?.answers || [];
  const durationSec = req.body?.durationSec || null;
  const sourceText = sourceTextFor(test);

  const perQuestion = [];
  let scored = 0;
  let pending = 0;

  for (const q of test.questions) {
    const full = q.__full;
    const ans = (answers.find((a) => a.qid === q.id) || {}).value ?? null;
    const base = {
      qid: q.id,
      qn: q.qn,
      title: q.title,
      marks: q.marks,
      skillIds: q.skillIds,
      type: q.type,
      statement: q.statement || null,
      options: q.options || [],
      text: q.text,
      value: ans,
    };
    if (q.type === 'list') {
      const r = markList(ans, full.markCtx.points);
      scored += r.marks;
      base.got = r.marks;
      base.correct = r.marks === q.marks;
      base.listResult = { matched: r.matched, missed: r.missed, points: full.markCtx.points };
    } else if (q.type === 'truefalse') {
      const r = markTrueFalse(ans, full.markCtx.answers);
      scored += r.marks;
      base.got = r.marks;
      base.correct = r.marks === q.marks;
      base.tfResult = r.rows;
    } else {
      const marking = await markAnswer({
        rubricKey: full.rubricKey,
        questionText: q.text,
        sourceText,
        answer: ans,
        apiKey,
        model,
      });
      if (marking.ai) {
        scored += marking.marks;
        base.got = marking.marks;
      } else {
        pending += 1;
        base.got = null;
        if (!marking.modelAnswer && full.modelAnswer) marking.modelAnswer = full.modelAnswer;
      }
      base.marking = marking;
    }
    perQuestion.push(base);
  }

  const totalMarks = test.totalMarks;
  const incomplete = pending > 0;
  const grade = incomplete ? null : predictGrade(scored, totalMarks);
  const gap = incomplete ? null : nextBoundaryGap(scored, totalMarks);

  const skillAgg = new Map();
  for (const row of perQuestion) {
    for (const s of row.skillIds) {
      if (!skillAgg.has(s)) skillAgg.set(s, { id: s, name: TOPICS.find((t) => t.id === s)?.name || s, got: 0, max: 0 });
      const a = skillAgg.get(s);
      a.max += row.marks;
      if (row.got != null) a.got += row.got;
    }
  }
  const skills = [...skillAgg.values()].map((s) => ({ ...s, percent: s.max ? Math.round((100 * s.got) / s.max) : 0 }));
  const weakTopics = skills
    .filter((s) => s.percent < 60 && s.max >= 4)
    .map((s) => ({
      id: s.id,
      name: s.name,
      percent: s.percent,
      internal: `/learn/${s.id}`,
      resources: TOPICS.find((t) => t.id === s.id)?.resources || [],
    }));

  const result = {
    id: test.id,
    type: test.type,
    paperId: test.paperId,
    paperCode: test.paperId === 1 ? '8700/1' : '8700/2',
    paperName: test.paperId === 1 ? 'Paper 1' : 'Paper 2',
    totalMarks,
    correctMarks: Math.round(scored * 10) / 10,
    percent: incomplete ? null : Math.round((100 * scored) / totalMarks),
    grade,
    gradeLabel: gradeLabel(grade),
    nextBoundary: gap,
    incomplete,
    aiMarked: incomplete === false,
    durationSec,
    skills,
    weakTopics,
    perQuestion,
  };

  req.db.recordTest({ ...result, topicAccuracy: skills.map((s) => ({ id: s.id, percent: s.percent })) });
  req.db.addXp(Math.round(scored * 2));
  req.db.registerActivity();
  activeTests.delete(test.id);
  res.json(result);
});

/* ---------------- practice & ad-hoc ---------------- */

app.post('/practice', (req, res) => {
  const topicId = req.body?.topicId;
  const count = Math.min(4, Math.max(1, req.body?.count || 3));
  const full = buildPractice(topicId, count);
  if (!full.length) return res.status(404).json({ error: 'Topic not found' });
  const sessionId = newSession('practice', full);
  res.json({ sessionId, topicId, questions: full.map(stripMarkCtx) });
});

app.post('/adhoc', (req, res) => {
  const count = Math.min(20, Math.max(5, req.body?.count || 12));
  const kinds = Array.isArray(req.body?.kinds) && req.body.kinds.length
    ? req.body.kinds.filter((k) => ['listing', 'truefalse', 'analysis'].includes(k))
    : ['listing', 'truefalse', 'analysis'];
  const full = buildAdhoc(count, kinds);
  const sessionId = newSession('adhoc', full);
  res.json({ sessionId, questions: full.map(stripMarkCtx) });
});

app.post('/check', (req, res) => {
  const { sessionId, qid, value } = req.body || {};
  const s = sessionFor(sessionId);
  if (!s) return res.status(404).json({ error: 'Session expired — start again.' });
  const q = s.questions.find((x) => x.id === qid);
  if (!q) return res.status(404).json({ error: 'Question not found.' });
  if (q.type === 'list') {
    const r = markList(value, q.markCtx.points);
    return res.json({ correct: r.marks === 4, got: r.marks, max: 4, matched: r.matched, missed: r.missed, points: q.markCtx.points });
  }
  if (q.type === 'truefalse') {
    const r = markTrueFalse(value, q.markCtx.answers);
    return res.json({ correct: r.marks === 4, got: r.marks, max: 4, rows: r.rows });
  }
  return res.status(400).json({ error: 'This question type is marked by the AI tutor instead.' });
});

app.post('/practice/submit', (req, res) => {
  const { sessionId, answers, aiResults } = req.body || {};
  const s = sessionFor(sessionId);
  if (!s) return res.status(404).json({ error: 'Session expired.' });
  const aiMap = aiResults || {};
  let correct = 0;
  let total = 0;
  const perQ = [];
  for (const q of s.questions) {
    const ans = (answers.find((a) => a.qid === q.id) || {}).value ?? null;
    let got = 0;
    if (q.type === 'list') got = markList(ans, q.markCtx.points).marks;
    else if (q.type === 'truefalse') got = markTrueFalse(ans, q.markCtx.answers).marks;
    else if (q.markType === 'self') got = 0;
    else got = Math.min(q.marks, Number(aiMap[q.id]?.marks) || 0);
    total += q.marks;
    correct += got;
    perQ.push({ qid: q.id, got, marks: q.marks, skillIds: q.skillIds });
  }
  const skills = new Set(s.questions.flatMap((q) => q.skillIds));
  for (const skill of skills) {
    const qs = s.questions.filter((q) => q.skillIds.includes(skill));
    const max = qs.reduce((a, q) => a + q.marks, 0);
    const gotSum = qs.reduce((a, q) => a + (perQ.find((p) => p.qid === q.id)?.got || 0), 0);
    req.db.recordPractice({ topicId: skill, correct: gotSum, total: max });
  }
  req.db.addXp(Math.round(correct * 2));
  req.db.registerActivity();
  sessions.delete(sessionId);
  res.json({ correctMarks: Math.round(correct * 10) / 10, totalMarks: total, perQ });
});

app.post('/adhoc/submit', (req, res) => {
  const { sessionId, answers, aiResults } = req.body || {};
  const s = sessionFor(sessionId);
  if (!s) return res.status(404).json({ error: 'Session expired.' });
  const aiMap = aiResults || {};
  let correct = 0;
  let total = 0;
  const perQ = [];
  for (const q of s.questions) {
    const ans = (answers.find((a) => a.qid === q.id) || {}).value ?? null;
    let got = 0;
    if (q.type === 'list') got = markList(ans, q.markCtx.points).marks;
    else if (q.type === 'truefalse') got = markTrueFalse(ans, q.markCtx.answers).marks;
    else got = Math.min(q.marks, Number(aiMap[q.id]?.marks) || 0);
    total += q.marks;
    correct += got;
    perQ.push({ qid: q.id, got, marks: q.marks, skillIds: q.skillIds });
  }
  for (const skill of new Set(s.questions.flatMap((q) => q.skillIds))) {
    const qs = s.questions.filter((q) => q.skillIds.includes(skill));
    req.db.recordPractice({ topicId: skill, correct: qs.reduce((a, q) => a + (perQ.find((p) => p.qid === q.id)?.got || 0), 0), total: qs.reduce((a, q) => a + q.marks, 0) });
  }
  req.db.addXp(Math.round(correct * 2));
  req.db.registerActivity();
  sessions.delete(sessionId);
  res.json({ correctMarks: Math.round(correct * 10) / 10, totalMarks: total, perQ });
});

/** Generic AI marking for practice / ad-hoc text questions. */
app.post('/mark', async (req, res) => {
  const { rubricKey, questionText, sourceText, answer } = req.body || {};
  if (!rubricKey) return res.status(400).json({ error: 'rubricKey required' });
  const out = await markAnswer({ rubricKey, questionText, sourceText, answer, apiKey, model });
  res.json(out);
});

/* ---------------- progress & chat ---------------- */

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
    const out = await askTutor(messages, { model, apiKey });
    req.db.pushChat('assistant', out.reply);
    res.json(out);
  } catch {
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

export default app;
