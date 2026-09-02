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
import {
  loadHigherBank,
  higherBankSize,
  higherQuestionsFor,
  higherPaperList,
  buildHigherPaper,
  buildHigherPractice,
  buildHigherAdhoc,
  higherMarkAnswers,
  higherCheckAnswer,
  higherQuestionById,
  higherTopics,
} from './bank/higher.js';
import { createDb } from '../../db.js';
import { defaultStorage } from '../../storage/index.js';
import { attachPersonalRoutes } from '../../personal.js';
import { askTutor } from './chat.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen3.7-flash';

const app = express.Router();
app.use(express.json({ limit: '1mb' }));

const isHigher = (req) => req.baseUrl === '/api/maths-higher' || req.originalUrl.startsWith('/api/maths-higher');
const tierKey = (req) => (isHigher(req) ? 'maths-higher' : 'maths');
const tierFns = (req) => isHigher(req)
  ? { topics: higherTopics(), size: higherBankSize, questionsFor: higherQuestionsFor, papers: higherPaperList, buildPaper: buildHigherPaper, buildPractice: buildHigherPractice, buildAdhoc: buildHigherAdhoc, markAnswers: higherMarkAnswers, checkAnswer: higherCheckAnswer, questionById: higherQuestionById }
  : { topics: TOPICS, size: bankSize, questionsFor, papers: paperList, buildPaper, buildPractice, buildAdhoc, markAnswers, checkAnswer, questionById: getQuestionById };

attachPersonalRoutes(app, tierKey, defaultStorage);

app.use((req, res, next) => {
  if (req.user) req.db = createDb(req.user.id, tierKey(req));
  next();
});

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

function uniqueAnswersByQid(answers) {
  const byQid = new Map();
  if (!Array.isArray(answers)) return [];
  for (const answer of answers) {
    if (answer && answer.qid != null) byQid.set(answer.qid, answer);
  }
  return [...byQid.values()];
}

function isNonblank(value) {
  if (value === null || value === undefined) return false;
  return typeof value !== 'string' || value.trim().length > 0;
}

function expiredTest(res) {
  return res.status(410).json({
    error: 'This saved paper is no longer active. Start a new paper to continue.',
    code: 'TEST_EXPIRED',
  });
}

function sessionCriteria(req, id, kind) {
  return { id, userId: String(req.user.id), subject: tierKey(req), kind };
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

// Editorial metadata for the coverage audit trail (see FOUNDATION_AUDIT.md and
// HIGHER_AUDIT.md). Spec sections match the published AQA 8300 subject content
// numbering (3.1-3.6); statement-level references ship with the documented
// coverage audit rather than being guessed here.
const SPEC_SECTIONS = {
  number: { section: '3.1', area: 'Number' },
  algebra: { section: '3.2', area: 'Algebra' },
  ratio: { section: '3.3', area: 'Ratio, proportion and rates of change' },
  geometry: { section: '3.4', area: 'Geometry and measures' },
  probability: { section: '3.5', area: 'Probability' },
  statistics: { section: '3.6', area: 'Statistics' },
};

const EDITORIAL = {
  reviewer: 'Study Desk content team',
  markingRationale: 'Every generated question carries an exact answer, worked solution and deterministic marking metadata — marks never depend on the AI tutor.',
  reportIssueUrl: '/support.html',
};

const publicTopic = (t) => ({
  id: t.id,
  strand: t.strand,
  name: t.name,
  blurb: t.blurb,
  examWeight: t.examWeight,
  ...(SPEC_SECTIONS[t.strand] ? { specSection: SPEC_SECTIONS[t.strand].section, specArea: SPEC_SECTIONS[t.strand].area } : {}),
  ...(t.reviewed ? { reviewed: t.reviewed } : {}),
});

app.get('/health', (req, res) => {
  const fns = tierFns(req);
  res.json({
    ok: true,
    bankSize: fns.size(),
    tier: isHigher(req) ? 'higher' : 'foundation',
    tierLabel: isHigher(req) ? 'Higher' : 'Foundation',
    model: OPENROUTER_MODEL,
    chatReady: !!OPENROUTER_API_KEY,
    boundaries: isHigher(req) ? BOUNDARIES.higher : BOUNDARIES.foundation,
    editorial: { ...EDITORIAL, spec: 'AQA 8300' },
  });
});

app.get('/topics', asyncRoute(async (req, res) => {
  const fns = tierFns(req);
  const p = await req.db.progress();
  const completed = new Set(p.completedLessonIds);
  const byStrand = {};
  for (const s of Object.values(STRANDS)) {
    byStrand[s.id] = {
      ...s,
      topics: fns.topics.filter((t) => t.strand === s.id).map((t) => {
        const stats = p.topicStats[t.id];
        return {
          ...publicTopic(t),
          accuracy: stats && stats.total ? Math.round((100 * stats.correct) / stats.total) : null,
          answered: stats ? stats.total : 0,
          completed: completed.has(t.id),
        };
      }),
    };
  }
  res.json({ strands: byStrand });
}));

app.get('/topics/:id', asyncRoute(async (req, res) => {
  const fns = tierFns(req);
  const t = fns.topics.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: 'Topic not found' });
  const p = await req.db.progress();
  const stats = p.topicStats[t.id];
  res.json({
    ...publicTopic(t),
    strandName: STRANDS[t.strand].name,
    strandColor: STRANDS[t.strand].color,
    notes: t.notes,
    resources: t.resources,
    editorial: EDITORIAL,
    accuracy: stats && stats.total ? Math.round((100 * stats.correct) / stats.total) : null,
    answered: stats ? stats.total : 0,
    completed: p.completedLessonIds.includes(t.id),
  });
}));

app.get('/papers', (req, res) => {
  res.json({ papers: tierFns(req).papers() });
});

app.post('/test/new', asyncRoute(async (req, res) => {
  const fns = tierFns(req);
  const type = req.body?.type === 'short' ? 'short' : 'full';
  const paperId = [1, 2, 3].includes(req.body?.paper) ? req.body.paper : 1;
  const paper = fns.buildPaper(type, paperId);
  const id = crypto.randomUUID();
  const response = {
    id,
    type,
    paperId: paper.paperId,
    paperCode: paper.paperCode,
    paperName: paper.paperName,
    calculator: paper.calculator,
    totalMarks: paper.totalMarks,
    minutes: paper.minutes,
    stretchCount: paper.stretchCount,
    stretchMarks: paper.stretchMarks,
    exceptionalCount: paper.exceptionalCount || 0,
    strandCoverage: paper.strandCoverage,
    questions: paper.questions,
  };
  const created = await defaultStorage.createStudySession({
    ...sessionCriteria(req, id, 'paper'),
    payload: {
      ...response,
      tier: isHigher(req) ? 'higher' : 'foundation',
      questionIds: paper.questions.map((question) => question.id),
      startedAt: new Date().toISOString(),
    },
  });
  if (created.status !== 'created') {
    return res.status(503).json({ error: 'Could not start a paper. Please try again.' });
  }
  res.json(response);
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

app.post('/test/:id/submit', asyncRoute(async (req, res) => {
  const criteria = sessionCriteria(req, req.params.id, 'paper');
  const claimed = await claimSession(req, req.params.id, 'paper');
  if (claimed.status === 'completed') return res.json(claimed.result);
  if (claimed.status !== 'claimed') return sessionFailure(res, claimed);
  const test = claimed.session.payload;
  const answers = uniqueAnswersByQid(req.body?.answers);
  const durationSec = req.body?.durationSec || null;

  const higher = test.tier === 'higher';
  const questionById = higher ? higherQuestionById : getQuestionById;
  const marker = higher ? higherMarkAnswers : markAnswers;
  const pool = test.questionIds.map((qid) => questionById(qid)).filter(Boolean);
  const marked = marker(pool, answers);
  for (const row of marked.perQ) {
    const qn = test.questionIds.findIndex((qid) => qid === row.qid);
    row.qn = qn + 1;
  }
  const totalMarks = test.totalMarks || marked.totalMarks;
  const correctMarks = marked.correctMarks;
  const percent = Math.round((100 * correctMarks) / totalMarks);
   const grade = predictGrade(correctMarks, totalMarks, test.tier);
   const gap = nextBoundaryGap(correctMarks, totalMarks, test.tier);

  // Strand & topic breakdown
  const strandMap = new Map();
  const topicMap = new Map();
  for (const row of marked.perQ) {
    const q = questionById(row.qid);
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
    const meta = tierFns(req).topics.find((x) => x.id === t.id);
    if (!meta) return null;
    return {
      id: t.id,
      name: t.name,
      strand: meta.strand,
      percent: t.percent,
      internal: `/learn/${t.id}`,
      resources: meta.resources,
    };
  }).filter(Boolean);

  const result = {
    id: test.id,
    type: test.type,
    paperId: test.paperId,
    paperCode: test.paperCode,
     paperName: test.paperName,
     tier: test.tier,
     calculator: test.calculator,
     boundaries: higher ? BOUNDARIES.higher : BOUNDARIES.foundation,
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

  try {
    const finalized = await req.db.finalizeStudySession(criteria, {
      testResult: {
        ...result,
        topicAccuracy: topics.map((topic) => ({ id: topic.id, percent: topic.percent })),
      },
      scoreXp: correctMarks * 2,
      response: result,
    });
    if (finalized.status === 'completed') {
      // Durable paper history + funnel trail (best-effort; never blocks the result).
      await Promise.allSettled([
        defaultStorage.saveAttempt(req.user.id, tierKey(req), {
          sessionId: test.id,
          paperCode: result.paperCode,
          paperName: result.paperName,
          type: result.type,
          tier: test.tier,
          totalMarks: result.totalMarks,
          correctMarks: result.correctMarks,
          percent: result.percent,
          grade: result.grade,
          durationSec: result.durationSec,
          completedAt: new Date().toISOString(),
          result,
        }),
        defaultStorage.recordEvent(req.user.id, 'session_marked', {
          subject: tierKey(req),
          metadata: { kind: 'paper', type: result.type, paperCode: result.paperCode, percent: result.percent },
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

app.post('/practice', asyncRoute(async (req, res) => {
  const fns = tierFns(req);
  const topicId = req.body?.topicId;
  const count = Math.min(20, Math.max(4, req.body?.count || 8));
  const questions = fns.buildPractice(topicId, count);
  if (!questions.length) return res.status(404).json({ error: 'Topic not found' });
  const sessionId = crypto.randomUUID();
  const created = await defaultStorage.createStudySession({
    ...sessionCriteria(req, sessionId, 'practice'),
    payload: {
      tier: isHigher(req) ? 'higher' : 'foundation',
      topicId,
      questionIds: questions.map((question) => question.id),
    },
  });
  if (created.status !== 'created') {
    return res.status(503).json({ error: 'Could not start practice. Please try again.' });
  }
  res.json({ sessionId, topicId, questions });
}));

app.post('/check', (req, res) => {
  const fns = tierFns(req);
  const { qid, value } = req.body || {};
  if (!qid) return res.status(400).json({ error: 'qid required' });
  const out = fns.checkAnswer(qid, value);
  res.json(out);
});

app.post('/practice/submit', asyncRoute(async (req, res) => {
  const fns = tierFns(req);
  const { sessionId, topicId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  const criteria = sessionCriteria(req, sessionId, 'practice');
  const claimed = await claimSession(req, sessionId, 'practice');
  if (claimed.status === 'completed') return res.json(claimed.result);
  if (claimed.status !== 'claimed') return sessionFailure(res, claimed);
  const session = claimed.session.payload;
  const tier = isHigher(req) ? 'higher' : 'foundation';
  if (session.tier !== tier) {
    await defaultStorage.releaseStudySession(criteria);
    return res.status(400).json({ error: 'Practice tier does not match session.' });
  }
  if (topicId !== session.topicId) {
    await defaultStorage.releaseStudySession(criteria);
    return res.status(400).json({ error: 'Practice topic does not match session.' });
  }
  const submittedAnswers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const issuedIds = new Set(session.questionIds);
  const answers = uniqueAnswersByQid(submittedAnswers).filter((answer) => issuedIds.has(answer.qid));
  const pool = fns.questionsFor(topicId);
  const marked = fns.markAnswers(pool, answers);
  const qualifies = answers.length === session.questionIds.length
    && answers.every((answer) => isNonblank(answer.value));
  const response = {
    correctMarks: marked.correctMarks,
    totalMarks: marked.totalMarks,
    perQ: marked.perQ,
  };
  try {
    const finalized = await req.db.finalizeStudySession(criteria, {
      practiceRecords: { topicId, correct: marked.correctMarks, total: marked.totalMarks },
      scoreXp: marked.correctMarks,
      lessonId: qualifies ? topicId : null,
      response,
    });
    if (finalized.status === 'completed') return res.json(finalized.result);
    return sessionFailure(res, finalized);
  } catch (error) {
    await defaultStorage.releaseStudySession(criteria).catch(() => {});
    throw error;
  }
}));

app.post('/adhoc', asyncRoute(async (req, res) => {
  const fns = tierFns(req);
  const count = Math.min(30, Math.max(5, req.body?.count || 15));
  const papers = Array.isArray(req.body?.papers) && req.body.papers.length
    ? req.body.papers
     : [1, 2, 3];
  const set = fns.buildAdhoc(count, papers);
  const roundId = crypto.randomUUID();
  const created = await defaultStorage.createStudySession({
    ...sessionCriteria(req, roundId, 'adhoc'),
    payload: { questionIds: set.questions.map((question) => question.id) },
  });
  if (created.status !== 'created') {
    return res.status(503).json({ error: 'Could not start the round. Please try again.' });
  }
  res.json({ ...set, roundId });
}));

app.post('/adhoc/submit', asyncRoute(async (req, res) => {
  const fns = tierFns(req);
  const roundId = req.body?.roundId;
  if (!roundId) return res.status(400).json({ error: 'roundId required' });
  const criteria = sessionCriteria(req, roundId, 'adhoc');
  const claimed = await claimSession(req, roundId, 'adhoc');
  if (claimed.status === 'completed') return res.json(claimed.result);
  if (claimed.status !== 'claimed') return sessionFailure(res, claimed);
  const issuedIds = new Set(claimed.session.payload.questionIds);
  const answers = uniqueAnswersByQid(req.body?.answers).filter((answer) => issuedIds.has(answer.qid));
  const results = { perQ: [], correctMarks: 0, totalMarks: 0 };
  const topicTally = new Map();
  for (const { qid, value } of answers) {
     const q = fns.questionById(qid);
    if (!q) continue;
     const { correct, answerText } = fns.checkAnswer(qid, value);
    results.totalMarks += q.marks;
    if (correct) results.correctMarks += q.marks;
    results.perQ.push({ qid, marks: q.marks, correct, value: value ?? null, answerText, topicId: q.topicId, topic: q.topic });
    if (!topicTally.has(q.topicId)) topicTally.set(q.topicId, { correct: 0, total: 0 });
    const t = topicTally.get(q.topicId);
    t.total += q.marks;
    if (correct) t.correct += q.marks;
  }
  const response = { ...results };
  try {
    const finalized = await req.db.finalizeStudySession(criteria, {
      practiceRecords: [...topicTally].map(([topicId, tally]) => ({
        topicId,
        correct: tally.correct,
        total: tally.total,
      })),
      scoreXp: results.correctMarks,
      response,
    });
    if (finalized.status === 'completed') return res.json(finalized.result);
    return sessionFailure(res, finalized);
  } catch (error) {
    await defaultStorage.releaseStudySession(criteria).catch(() => {});
    throw error;
  }
}));

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
     const out = await askTutor(messages, { model: OPENROUTER_MODEL, apiKey: OPENROUTER_API_KEY, tier: isHigher(req) ? 'higher' : 'foundation' });
    await req.db.pushChat('assistant', out.reply);
    res.json(out);
  } catch (e) {
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

await loadBank();
await loadHigherBank();
console.log(`[bank] ${bankSize()} questions loaded across ${TOPICS.length} topics`);
export default app;
