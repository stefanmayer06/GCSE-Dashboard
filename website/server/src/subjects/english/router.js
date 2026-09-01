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
import { defaultStorage } from '../../storage/index.js';
import { attachPersonalRoutes } from '../../personal.js';

const { apiKey, model } = aiConfig();
const MAX_MARK_ATTEMPTS = 3;

const app = express.Router();
app.use(express.json({ limit: '2mb' }));
attachPersonalRoutes(app, () => 'english', defaultStorage);

app.use((req, res, next) => {
  if (req.user) req.db = createDb(req.user.id, 'english');
  next();
});

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

function expiredTest(res) {
  return res.status(410).json({
    error: 'This saved paper is no longer active. Start a new paper to continue.',
    code: 'TEST_EXPIRED',
  });
}

function sessionCriteria(req, id, kind) {
  return { id, userId: String(req.user.id), subject: 'english', kind };
}

function sessionFailure(res, outcome) {
  if (outcome?.status === 'busy') {
    return res.status(409).json({
      error: 'This submission is already being marked. Try again in a moment.',
      code: 'SUBMISSION_IN_PROGRESS',
    });
  }
  return expiredTest(res);
}

async function claimSession(req, id, kind) {
  return defaultStorage.claimStudySession(sessionCriteria(req, id, kind));
}

async function getActiveSession(req, id, kind) {
  const outcome = await defaultStorage.getStudySession(sessionCriteria(req, id, kind));
  return outcome.status === 'ok' ? outcome.session : null;
}

function answersByQid(answers) {
  const out = new Map();
  if (!Array.isArray(answers)) return out;
  for (const answer of answers) {
    if (answer && answer.qid != null) out.set(answer.qid, answer.value);
  }
  return out;
}

function isNonblank(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(isNonblank);
  if (typeof value === 'object') return Object.values(value).some(isNonblank);
  return true;
}

function sourceTextForQuestion(q) {
  if (!q.sourceRef) return '';
  if (q.sourceRef.paperId === 2 && (q.sourceRef.textA || q.sourceRef.textB)) {
    return `${q.sourceRef.textA || ''}\n\n${q.sourceRef.textB || ''}`.slice(0, 7000);
  }
  return q.sourceRef.text || '';
}

export function markAttemptsFor(payload, qid) {
  const attempts = payload?.markAttempts?.[qid];
  return Array.isArray(attempts) ? attempts.slice(0, MAX_MARK_ATTEMPTS) : [];
}

export function attemptMetadata(attempts, marks = null) {
  const previousMarks = attempts.length ? attempts[attempts.length - 1].marks : null;
  return {
    attemptNo: attempts.length + 1,
    previousMarks,
    markDelta: Number.isFinite(marks) && Number.isFinite(previousMarks)
      ? marks - previousMarks
      : null,
    canResubmit: attempts.length + (Number.isFinite(marks) ? 1 : 0) < MAX_MARK_ATTEMPTS,
  };
}

function attemptLimit(res) {
  return res.status(429).json({
    error: `This question has already been AI-marked ${MAX_MARK_ATTEMPTS} times.`,
    code: 'MARK_ATTEMPT_LIMIT',
    canResubmit: false,
  });
}

const stripMarkCtx = (q) => {
  const out = { ...q };
  delete out.markCtx;
  return out;
};

// Editorial metadata for the coverage audit trail (see ENGLISH_AUDIT.md).
const ENGLISH_EDITORIAL = {
  spec: 'AQA 8700',
  reviewer: 'Study Desk content team',
  markingRationale: 'List and true/false questions are marked deterministically against fixed answers; extended answers use AQA-style rubrics and never promise an official mark.',
  reportIssueUrl: '/support.html',
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
    editorial: ENGLISH_EDITORIAL,
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

app.get('/topics', asyncRoute(async (req, res) => {
  const p = await req.db.progress();
  const completed = new Set(p.completedLessonIds);
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
          ...(Array.isArray(t.specRefs) && t.specRefs.length ? { specRefs: t.specRefs } : {}),
          ...(t.reviewed ? { reviewed: t.reviewed } : {}),
          accuracy: stats && stats.total ? Math.round((100 * stats.correct) / stats.total) : null,
          answered: stats ? stats.total : 0,
          completed: completed.has(t.id),
        };
      }),
    };
  }
  res.json({ sections: out });
}));

app.get('/topics/:id', asyncRoute(async (req, res) => {
  const t = TOPICS.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Topic not found' });
  const p = await req.db.progress();
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
    editorial: ENGLISH_EDITORIAL,
    ...(Array.isArray(t.specRefs) && t.specRefs.length ? { specRefs: t.specRefs } : {}),
    ...(t.reviewed ? { reviewed: t.reviewed } : {}),
    accuracy: stats && stats.total ? Math.round((100 * stats.correct) / stats.total) : null,
    answered: stats ? stats.total : 0,
    completed: p.completedLessonIds.includes(t.id),
  });
}));

/* ---------------- tests ---------------- */

app.post('/test/new', asyncRoute(async (req, res) => {
  const type = req.body?.type === 'short' ? 'short' : 'full';
  const paperId = req.body?.paper === 2 ? 2 : 1;
  const paper = buildPaper(type, paperId);
  const id = crypto.randomUUID();
  const full = fullSetFor(paper.entryId, paperId);
  const byId = new Map(full.map((q) => [q.id, q]));
  const privateQuestions = paper.questions.map((q) => ({
    ...byId.get(q.id),
    qn: q.qn,
  }));
  const created = await defaultStorage.createStudySession({
    ...sessionCriteria(req, id, 'paper'),
    payload: {
      id,
      type,
      paperId,
      entryId: paper.entryId,
      totalMarks: paper.totalMarks,
      questions: privateQuestions,
      startedAt: new Date().toISOString(),
    },
  });
  if (created.status !== 'created') {
    return res.status(503).json({ error: 'Could not start a paper. Please try again.' });
  }
  res.json({ id, ...paper });
}));

app.get('/test/:id/status', asyncRoute(async (req, res) => {
  const outcome = await defaultStorage.getStudySession(sessionCriteria(req, req.params.id, 'paper'));
  if (outcome.status === 'ok') return res.json({ active: true });
  if (outcome.status === 'completed') return res.json({ active: false, completed: true });
  return sessionFailure(res, outcome);
}));

app.delete('/test/:id', asyncRoute(async (req, res) => {
  const outcome = await defaultStorage.discardStudySession(sessionCriteria(req, req.params.id, 'paper'));
  if (outcome.status === 'discarded') return res.json({ discarded: true });
  if (outcome.status === 'completed') return res.json({ discarded: false, completed: true });
  return sessionFailure(res, outcome);
}));

function sourceTextFor(test) {
  const entry = getTextDetail(test.entryId);
  if (!entry) return '';
  if (test.paperId === 1) return entry.text || '';
  return `${entry.textA || ''}\n\n${entry.textB || ''}`.slice(0, 7000);
}

app.post('/test/:id/submit', asyncRoute(async (req, res) => {
  const criteria = sessionCriteria(req, req.params.id, 'paper');
  const claimed = await claimSession(req, req.params.id, 'paper');
  if (claimed.status === 'completed') return res.json(claimed.result);
  if (claimed.status !== 'claimed') return sessionFailure(res, claimed);
  const test = claimed.session.payload;
  const answers = req.body?.answers || [];
  const durationSec = req.body?.durationSec || null;
  const sourceText = sourceTextFor(test);

  const perQuestion = [];
  let scored = 0;
  let pending = 0;

  for (const q of test.questions) {
    const full = q;
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

  try {
    const finalized = await req.db.finalizeStudySession(criteria, {
      testResult: {
        ...result,
        topicAccuracy: skills.map((skill) => ({ id: skill.id, percent: skill.percent })),
      },
      scoreXp: Math.round(scored * 2),
      response: result,
    });
    if (finalized.status === 'completed') {
      // Durable paper history + funnel trail (best-effort; never blocks the result).
      await Promise.allSettled([
        defaultStorage.saveAttempt(req.user.id, 'english', {
          sessionId: test.id,
          paperCode: result.paperCode,
          paperName: result.paperName,
          type: result.type,
          totalMarks: result.totalMarks,
          correctMarks: result.correctMarks,
          percent: result.percent,
          grade: result.grade,
          durationSec: result.durationSec,
          completedAt: new Date().toISOString(),
          result,
        }),
        defaultStorage.recordEvent(req.user.id, 'session_marked', {
          subject: 'english',
          metadata: { kind: 'paper', type: result.type, paperCode: result.paperCode, complete: !incomplete },
        }),
      ]);
      return res.json(finalized.result);
    }
    return sessionFailure(res, finalized);
  } catch (error) {
    await defaultStorage.releaseStudySession(criteria).catch(() => {});
    throw error;
  }
}));

/* ---------------- practice & ad-hoc ---------------- */

app.post('/practice', asyncRoute(async (req, res) => {
  const topicId = req.body?.topicId;
  const count = Math.min(4, Math.max(1, req.body?.count || 3));
  const full = buildPractice(topicId, count);
  if (!full.length) return res.status(404).json({ error: 'Topic not found' });
  const sessionId = crypto.randomUUID();
  const created = await defaultStorage.createStudySession({
    ...sessionCriteria(req, sessionId, 'practice'),
    payload: { topicId, questions: full, aiMarks: {}, markAttempts: {} },
  });
  if (created.status !== 'created') {
    return res.status(503).json({ error: 'Could not start practice. Please try again.' });
  }
  res.json({ sessionId, topicId, questions: full.map(stripMarkCtx) });
}));

app.post('/adhoc', asyncRoute(async (req, res) => {
  const count = Math.min(20, Math.max(5, req.body?.count || 12));
  const kinds = Array.isArray(req.body?.kinds) && req.body.kinds.length
    ? req.body.kinds.filter((k) => ['listing', 'truefalse', 'analysis'].includes(k))
    : ['listing', 'truefalse', 'analysis'];
  const full = buildAdhoc(count, kinds);
  const sessionId = crypto.randomUUID();
  const created = await defaultStorage.createStudySession({
    ...sessionCriteria(req, sessionId, 'adhoc'),
    payload: { questions: full, aiMarks: {}, markAttempts: {} },
  });
  if (created.status !== 'created') {
    return res.status(503).json({ error: 'Could not start the round. Please try again.' });
  }
  res.json({ sessionId, questions: full.map(stripMarkCtx) });
}));

app.post('/check', asyncRoute(async (req, res) => {
  const { sessionId, qid, value } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  const session = await getActiveSession(req, sessionId, 'practice')
    || await getActiveSession(req, sessionId, 'adhoc');
  if (!session) return res.status(404).json({ error: 'Session expired — start again.' });
  const q = session.payload.questions.find((x) => x.id === qid);
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
}));

async function scoreEnglishSession(req, res, kind, includeLesson) {
  const { sessionId, answers } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  const criteria = sessionCriteria(req, sessionId, kind);
  const claimed = await claimSession(req, sessionId, kind);
  if (claimed.status === 'completed') return res.json(claimed.result);
  if (claimed.status !== 'claimed') return sessionFailure(res, claimed);

  const s = claimed.session.payload;
  const answerMap = answersByQid(answers);
  let correct = 0;
  let total = 0;
  const perQ = [];
  for (const q of s.questions) {
    const ans = answerMap.get(q.id) ?? null;
    const attempts = markAttemptsFor(s, q.id);
    const latestAttempt = attempts.at(-1);
    let got = 0;
    if (q.type === 'list') got = markList(ans, q.markCtx.points).marks;
    else if (q.type === 'truefalse') got = markTrueFalse(ans, q.markCtx.answers).marks;
    else if (q.markType === 'self') got = 0;
    else got = Math.min(q.marks, Number(s.aiMarks?.[q.id]) || 0);
    total += q.marks;
    correct += got;
    perQ.push({
      qid: q.id,
      got,
      marks: q.marks,
      skillIds: q.skillIds,
      topicId: q.skillIds?.[0],
      topicName: TOPICS.find((topic) => topic.id === q.skillIds?.[0])?.name,
      title: q.title,
      text: q.text,
      value: ans,
      ...(latestAttempt ? {
        marking: latestAttempt.feedback,
        attemptNo: attempts.length,
        previousMarks: attempts.length > 1 ? attempts.at(-2).marks : null,
        markDelta: attempts.length > 1 ? latestAttempt.marks - attempts.at(-2).marks : null,
        canResubmit: attempts.length < MAX_MARK_ATTEMPTS,
      } : {}),
    });
  }

  const practiceRecords = [];
  for (const skill of new Set(s.questions.flatMap((q) => q.skillIds))) {
    const qs = s.questions.filter((q) => q.skillIds.includes(skill));
    const max = qs.reduce((sum, q) => sum + q.marks, 0);
    const gotSum = qs.reduce((sum, q) => sum + (perQ.find((p) => p.qid === q.id)?.got || 0), 0);
    practiceRecords.push({ topicId: skill, correct: gotSum, total: max });
  }

  const qualifies = includeLesson
    && s.questions.length > 0
    && s.questions.every((question) => isNonblank(answerMap.get(question.id)));
  const response = {
    correctMarks: Math.round(correct * 10) / 10,
    totalMarks: total,
    perQ,
  };
  try {
    const finalized = await req.db.finalizeStudySession(criteria, {
      practiceRecords,
      scoreXp: Math.round(correct * 2),
      lessonId: qualifies ? s.topicId : null,
      response,
    });
    if (finalized.status === 'completed') return res.json(finalized.result);
    return sessionFailure(res, finalized);
  } catch (error) {
    await defaultStorage.releaseStudySession(criteria).catch(() => {});
    throw error;
  }
}

app.post('/practice/submit', asyncRoute((req, res) => scoreEnglishSession(req, res, 'practice', true)));
app.post('/adhoc/submit', asyncRoute((req, res) => scoreEnglishSession(req, res, 'adhoc', false)));

/** Generic AI marking for practice / ad-hoc text questions. */
app.post('/mark', asyncRoute(async (req, res) => {
  const { sessionId, qid, answer } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  const s = await getActiveSession(req, sessionId, 'practice')
    || await getActiveSession(req, sessionId, 'adhoc');
  if (!s) return res.status(404).json({ error: 'Session expired.' });
  const q = s.payload.questions.find((question) => question.id === qid);
  if (!q?.rubricKey || q.markType === 'self') return res.status(400).json({ error: 'Question is not AI-marked.' });
  const existingAttempts = markAttemptsFor(s.payload, q.id);
  if (existingAttempts.length >= MAX_MARK_ATTEMPTS) return attemptLimit(res);
  const out = await markAnswer({
    rubricKey: q.rubricKey,
    questionText: q.text,
    sourceText: sourceTextForQuestion(q),
    answer,
    apiKey,
    model,
  });
  if (out.ai && Number.isFinite(Number(out.marks))) {
    const marks = Math.min(q.marks, Math.max(0, Number(out.marks)));
    const updated = await defaultStorage.updateStudySession(
      sessionCriteria(req, sessionId, s.kind),
      (current) => {
        const attempts = markAttemptsFor(current.payload, q.id);
        if (attempts.length >= MAX_MARK_ATTEMPTS) return { value: { limited: true } };
        const metadata = attemptMetadata(attempts, marks);
        const attempt = {
          answer: answer ?? null,
          feedback: { ...out, marks },
          timestamp: new Date().toISOString(),
          marks,
        };
        return {
          payload: {
            ...current.payload,
            aiMarks: {
              ...(current.payload.aiMarks || {}),
              [q.id]: marks,
            },
            markAttempts: {
              ...(current.payload.markAttempts || {}),
              [q.id]: [...attempts, attempt],
            },
          },
          value: metadata,
        };
      },
    );
    if (updated.status === 'busy') return sessionFailure(res, updated);
    if (updated.status !== 'updated') return sessionFailure(res, updated);
    if (updated.value?.limited) return attemptLimit(res);
    return res.json({ ...out, marks, ...updated.value });
  }
  return res.json({ ...out, ...attemptMetadata(existingAttempts) });
}));

/* ---------------- progress & chat ---------------- */

app.get('/progress', asyncRoute(async (req, res) => {
  res.json(await req.db.progress());
}));

app.post('/chat', asyncRoute(async (req, res) => {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages required' });
  }
  await req.db.registerActivity();
  await req.db.pushChat('user', messages[messages.length - 1].content);
  try {
    const out = await askTutor(messages, { model, apiKey });
    await req.db.pushChat('assistant', out.reply);
    res.json(out);
  } catch {
    res.json({ reply: 'Something went wrong talking to the AI. Try again in a moment.', model: 'error', error: true });
  }
}));

app.delete('/chat', asyncRoute(async (req, res) => {
  await req.db.clearChat();
  res.json({ ok: true });
}));

app.get('/chat/history', asyncRoute(async (req, res) => {
  res.json({ messages: await req.db.getChatHistory() });
}));

export default app;
