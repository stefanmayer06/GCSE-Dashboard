import { makeRand, shuffle } from '../util.js';
import { TOPICS, STRANDS } from './topics.js';

const genMods = {
  'place-value': () => import('./q/place-value.js'),
  operations: () => import('./q/operations.js'),
  fractions: () => import('./q/fractions.js'),
  decimals: () => import('./q/decimals.js'),
  percentages: () => import('./q/percentages.js'),
  'money-finance': () => import('./q/money-finance.js'),
  expressions: () => import('./q/expressions.js'),
  equations: () => import('./q/equations.js'),
  sequences: () => import('./q/sequences.js'),
  inequalities: () => import('./q/inequalities.js'),
  formulae: () => import('./q/formulae.js'),
  graphs: () => import('./q/graphs.js'),
  ratio: () => import('./q/ratio.js'),
  proportion: () => import('./q/proportion.js'),
  scale: () => import('./q/scale.js'),
  angles: () => import('./q/angles.js'),
  'area-perimeter': () => import('./q/area-perimeter.js'),
  circles: () => import('./q/circles.js'),
  'volume-surface': () => import('./q/volume-surface.js'),
  pythagoras: () => import('./q/pythagoras.js'),
  trigonometry: () => import('./q/trigonometry.js'),
  transformations: () => import('./q/transformations.js'),
  'probability-basic': () => import('./q/probability-basic.js'),
  'probability-combined': () => import('./q/probability-combined.js'),
  averages: () => import('./q/averages.js'),
  charts: () => import('./q/charts.js'),
  scatter: () => import('./q/scatter.js'),
};

const bankCache = new Map();

export async function loadBank() {
  if (bankCache.size) return bankCache;
  await Promise.all(
    TOPICS.map(async (t) => {
      const mod = await genMods[t.id]();
      const set = [];
      for (let v = 0; v < 1000; v++) {
        const q = mod.default(v);
        if (!q) break;
        q.id = `${t.id}-${v}`;
        q.topicId = t.id;
        q.topic = t.name;
        q.strand = t.strand;
        q.strandName = STRANDS[t.strand].name;
        set.push(q);
      }
      bankCache.set(t.id, set);
    })
  );
  return bankCache;
}

export function bankSize() {
  if (!bankCache.size) return null;
  let n = 0;
  for (const set of bankCache.values()) n += set.length;
  return n;
}

export function questionsFor(topicId) {
  return bankCache.get(topicId) || [];
}

/** Remove the answers/solutions before sending questions to the client. */
export function sanitize(q, { withHint = false } = {}) {
  const out = {
    id: q.id,
    topicId: q.topicId,
    topic: q.topic,
    strand: q.strand,
    strandName: q.strandName,
    marks: q.marks,
    difficulty: q.difficulty,
    stretch: !!q.stretch,
    text: q.text,
    input: q.input,
  };
  if (withHint) out.hint = q.hint;
  return out;
}

function mark(q, value) {
  if (value === null || value === undefined || value === '') return false;
  if (q.input.type === 'mcq') {
    return String(value).trim().toUpperCase() === q.answer;
  }
  const v = parseFloat(String(value).replace(/[£$,\s]/g, ''));
  if (Number.isNaN(v)) return false;
  const tol = q.input.tolerance ?? 1e-6;
  return Math.abs(v - q.answer) <= tol;
}

export function markAnswers(pool, pairs) {
  const results = { perQ: [], correctMarks: 0, totalMarks: 0 };
  for (const { qid, value } of pairs) {
    const q = pool.find((x) => x.id === qid);
    if (!q) continue;
    const correct = mark(q, value);
    results.totalMarks += q.marks;
    if (correct) results.correctMarks += q.marks;
    results.perQ.push({
      qid,
      qn: null,
      marks: q.marks,
      correct,
      value: value ?? null,
      answerText: q.answerText,
      solution: q.solution,
      text: q.text,
      stretch: !!q.stretch,
      topicId: q.topicId,
      topic: q.topic,
    });
  }
  return results;
}

export function checkAnswer(qid, value) {
  for (const set of bankCache.values()) {
    const q = set.find((x) => x.id === qid);
    if (q) {
      return { correct: mark(q, value), answerText: q.answerText, solution: q.solution };
    }
  }
  return { correct: false, answerText: null, solution: ['Question not found.'] };
}

function shuffled(rng, set) {
  return shuffle(rng, set ? [...set] : []);
}

export function buildPractice(topicId, count = 8) {
  const set = bankCache.get(topicId) || [];
  if (!set.length) return [];
  const rng = makeRand('practice', Date.now());
  const mix = shuffled(rng, set).slice(0, count);
  return mix.map((q, i) => ({ ...sanitize(q, { withHint: true }), qn: i + 1 }));
}

/**
 * The three AQA GCSE Foundation papers.
 * Topic allocation mirrors AQA's published per-paper weightings:
 *  - Paper 1 (8300/1F, non-calculator): Number, Algebra, Ratio, Probability & Statistics
 *  - Paper 2 (8300/2F, calculator): Algebra, Ratio, Geometry, Probability & Statistics
 *  - Paper 3 (8300/3F, calculator): Number, Ratio, Geometry, Probability & Statistics
 */
export const PAPERS = {
  1: {
    id: 1,
    code: '8300/1F',
    name: 'Paper 1',
    calculator: false,
    spec: 'Non-calculator',
    blurb: 'Number, Algebra, Ratio, Probability & Statistics. No geometry, no calculator.',
    strands: { number: 25, algebra: 25, ratio: 20, probability: 14, statistics: 16 },
  },
  2: {
    id: 2,
    code: '8300/2F',
    name: 'Paper 2',
    calculator: true,
    spec: 'Calculator',
    blurb: 'Algebra, Ratio, Geometry & Measures, Probability & Statistics.',
    strands: { algebra: 25, ratio: 20, geometry: 30, probability: 12, statistics: 13 },
  },
  3: {
    id: 3,
    code: '8300/3F',
    name: 'Paper 3',
    calculator: true,
    spec: 'Calculator',
    blurb: 'Number, Ratio, Geometry & Measures, Probability & Statistics.',
    strands: { number: 25, ratio:20, geometry: 30, probability: 12, statistics: 13 },
  },
};

export function paperList() {
  return Object.values(PAPERS).map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    calculator: p.calculator,
    spec: p.spec,
    blurb: p.blurb,
    strands: Object.entries(p.strands).map(([sid, pct]) => ({
      id: sid,
      name: STRANDS[sid].name,
      color: STRANDS[sid].color,
      percent: pct,
    })),
    marks: { full: 80, short: 40 },
    minutes: { full: 90, short: 45 },
  }));
}

function strandBudgets(paper, total) {
  const out = new Map();
  for (const [sid, pct] of Object.entries(PAPERS[paper].strands)) {
    out.set(sid, Math.round((total * pct) / 100));
  }
  return out;
}

function strandPool(sid, exclude = new Set()) {
  const out = [];
  for (const topic of TOPICS) {
    if (topic.strand !== sid) continue;
    for (const q of bankCache.get(topic.id) || []) {
      if (!exclude.has(q.id)) out.push(q);
    }
  }
  return out;
}

const minQ = (total) => (total === 80 ? 24 : 12);
const maxQ = (total) => (total === 80 ? 36 : 20);

/** Shuffle first (variety), then prefer higher-mark questions to keep question counts exam-like. */
function bigFirst(rng, list) {
  const mixed = shuffle(rng, list);
  return mixed.sort((a, b) => b.marks - a.marks);
}

/**
 * Build an exam-style paper for a specific AQA foundation paper (1, 2 or 3).
 * Full: 80 marks / 90 minutes. Short: 40 marks / 45 minutes.
 * Uses the per-paper AQA strand weightings, keeps a handful of stretch
 * (difficulty 3) questions and orders the paper as a difficulty ramp:
 * easier questions first, stretch questions at the end.
 */
export function buildPaper(type = 'full', paperId = 1) {
  const paper = PAPERS[paperId] || PAPERS[1];
  const total = type === 'full' ? 80 : 40;
  const stretchBudget = Math.round(total * 0.12);
  const rng = makeRand('paper', Math.floor(Math.random() * 2 ** 31));
  const strandIds = Object.keys(paper.strands);

  for (let attempt = 0; attempt < 6000; attempt++) {
    const picked = [];
    const budgets = strandBudgets(paperId, total);
    let stretchLeft = stretchBudget;

    // Pass 1: stretch questions first (highest-demand marks).
    for (const sid of shuffled(rng, strandIds)) {
      const budget = budgets.get(sid);
      const stretchPool = bigFirst(rng, strandPool(sid).filter((q) => q.difficulty === 3));
      let used = 0;
      for (const q of stretchPool) {
        if (used >= Math.min(stretchBudget, budget * 0.45)) break;
        if (used + q.marks > stretchLeft) continue;
        picked.push(q);
        used += q.marks;
        stretchLeft -= q.marks;
      }
      budgets.set(sid, budget - used);
    }

    // Pass 2: fill ~half of the remaining marks per strand with difficulty 1.
    for (const sid of shuffled(rng, strandIds)) {
      let budget = budgets.get(sid);
      let easyTarget = Math.floor(budget * 0.55);
      const easy = bigFirst(rng, strandPool(sid, new Set(picked.map((q) => q.id))).filter((q) => q.difficulty === 1));
      for (const q of easy) {
        if (budget <= 0 || easyTarget <= 0) break;
        if (q.marks > easyTarget) continue;
        picked.push(q);
        budget -= q.marks;
        easyTarget -= q.marks;
      }
      budgets.set(sid, budget);
    }

    // Pass 3: fill whatever is left with any non-stretch questions.
    for (const sid of shuffled(rng, strandIds)) {
      let budget = budgets.get(sid);
      const fill = bigFirst(rng, strandPool(sid, new Set(picked.map((q) => q.id))).filter((q) => q.difficulty !== 3));
      for (const q of fill) {
        if (budget <= 0) break;
        if (q.marks > budget) continue;
        picked.push(q);
        budget -= q.marks;
      }
      budgets.set(sid, budget);
    }

    const sum = picked.reduce((a, q) => a + q.marks, 0);
    if (sum !== total || picked.length < minQ(total) || picked.length > maxQ(total)) continue;

    // Order as a difficulty ramp: level 1 first, level 2 middle, stretch at the end.
    const ramp = [];
    for (const d of [1, 2, 3]) {
      const band = picked.filter((q) => q.difficulty === d);
      const seeded = makeRand('paper-order', attempt * 961 + d * 101 + band.length);
      ramp.push(...shuffled(seeded, band));
    }
    return {
      paperId: paper.id,
      paperCode: paper.code,
      paperName: paper.name,
      calculator: paper.calculator,
      questions: ramp.map((q, i) => ({ ...sanitize(q), qn: i + 1 })),
      totalMarks: total,
      minutes: total === 80 ? 90 : 45,
      stretchCount: ramp.filter((q) => q.difficulty === 3).length,
      strandCoverage: strandIds.map((sid) => STRANDS[sid].name),
    };
  }

  // Practically unreachable given the bank size; graceful fallback anyway.
  const all = [];
  for (const sid of strandIds) all.push(...strandPool(sid));
  const any = shuffled(rng, all);
  const fallback = [];
  let left = total;
  for (const q of any) {
    if (left <= 0) break;
    if (q.marks > left) continue;
    fallback.push(q);
    left -= q.marks;
  }
  return {
    paperId: paper.id,
    paperCode: paper.code,
    paperName: paper.name,
    calculator: paper.calculator,
    questions: fallback.map((q, i) => ({ ...sanitize(q), qn: i + 1 })),
    totalMarks: fallback.reduce((a, q) => a + q.marks, 0),
    minutes: total === 80 ? 90 : 45,
    stretchCount: fallback.filter((q) => q.difficulty === 3).length,
    strandCoverage: strandIds.map((sid) => STRANDS[sid].name),
  };
}

/**
 * Ad-hoc questions drawn from the pools of one or more papers (default: all 3).
 * Mixed topics and difficulty with a few stretch questions sprinkled in.
 */
export function buildAdhoc(count = 15, paperIds = [1, 2, 3]) {
  const ids = paperIds.filter((p) => PAPERS[p]);
  if (!ids.length) ids.push(1, 2, 3);
  const strandIds = [...new Set(ids.flatMap((p) => Object.keys(PAPERS[p].strands)))];
  const pool = [];
  for (const sid of strandIds) pool.push(...strandPool(sid));
  const rng = makeRand('adhoc', Date.now());

  const stretchN = Math.max(1, Math.round(count * 0.15));
  const easyN = Math.round(count * 0.5);
  const stretch = shuffled(rng, pool.filter((q) => q.difficulty === 3)).slice(0, stretchN);
  const taken = new Set(stretch.map((q) => q.id));
  const easy = shuffled(rng, pool.filter((q) => q.difficulty === 1 && !taken.has(q.id))).slice(0, easyN);
  for (const q of easy) taken.add(q.id);
  const mid = shuffled(rng, pool.filter((q) => q.difficulty === 2 && !taken.has(q.id))).slice(0, Math.max(0, count - stretch.length - easy.length));
  const mix = shuffled(rng, [...stretch, ...easy, ...mid]);
  return {
    questions: mix.map((q, i) => ({ ...sanitize(q, { withHint: true }), qn: i + 1 })),
    papersIncluded: ids.map((p) => PAPERS[p].code),
  };
}

export function getQuestionById(id) {
  for (const set of bankCache.values()) {
    const q = set.find((x) => x.id === id);
    if (q) return q;
  }
  return null;
}