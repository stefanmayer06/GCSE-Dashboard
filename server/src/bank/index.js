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
 * Build an exam-style paper.
 * Full: 80 marks / 90 minutes (like one AQA 8300/1F paper).
 * Short: 40 marks / 45 minutes.
 * Picks questions to hit the exact mark total with the AQA strand weightings,
 * keeps a handful of stretch (difficulty 3) questions, and caps length.
 */
export function buildPaper(type = 'full') {
  const total = type === 'full' ? 80 : 40;
  const stretchBudget = Math.round(total * 0.12);
  const rng = makeRand('paper', Math.floor(Math.random() * 2 ** 31));
  const pool = [];
  for (const set of bankCache.values()) pool.push(...set);
  const byStrand = (s) => pool.filter((q) => q.strand === s);

  for (let attempt = 0; attempt < 4000; attempt++) {
    const picked = [];
    const budgets = new Map();
    for (const s of Object.values(STRANDS)) budgets.set(s.id, (total * s.weight) / 100);

    let stretchLeft = stretchBudget;
    const strandIds = shuffled(rng, Object.values(STRANDS).map((s) => s.id));

    // Pass 1: stretch questions first (highest-demand marks).
    for (const sid of strandIds) {
      const budget = budgets.get(sid);
      const stretchPool = shuffled(rng, byStrand(sid).filter((q) => q.difficulty === 3));
      let used = 0;
      const block = [];
      for (const q of stretchPool) {
        if (used >= Math.min(stretchBudget, budget * 0.5)) break;
        if (used + q.marks > stretchLeft) continue;
        block.push(q);
        used += q.marks;
        stretchLeft -= q.marks;
      }
      picked.push(...block);
      budgets.set(sid, budget - used);
    }

    // Pass 2: fill remaining marks with difficulty 1-2 questions.
    for (const sid of strandIds) {
      let budget = budgets.get(sid);
      const fillPool = shuffled(
        rng,
        byStrand(sid).filter((q) => !picked.includes(q) && q.difficulty !== 3)
      );
      for (const q of fillPool) {
        if (budget <= 0) break;
        if (q.marks > budget) continue;
        picked.push(q);
        budget -= q.marks;
      }
      budgets.set(sid, budget);
    }

    const sum = picked.reduce((a, q) => a + q.marks, 0);
    const minQ = total === 80 ? 22 : 12;
    const maxQ = total === 80 ? 34 : 20;
    if (sum !== total || picked.length < minQ || picked.length > maxQ) continue;

    const ordered = shuffle(
      makeRand('paper-order', attempt * 961 + picked.length),
      picked
    );
    const paper = {
      questions: ordered.map((q, i) => ({ ...sanitize(q), qn: i + 1 })),
      totalMarks: total,
      minutes: total === 80 ? 90 : 45,
      stretchCount: ordered.filter((q) => q.difficulty === 3).length,
    };
    return paper;
  }

  // Practically unreachable given bank size; graceful fallback anyway.
  const any = shuffled(rng, pool);
  const fallback = [];
  let left = total;
  for (const q of any) {
    if (left <= 0) break;
    if (q.marks > left) continue;
    fallback.push(q);
    left -= q.marks;
  }
  return {
    questions: fallback.map((q, i) => ({ ...sanitize(q), qn: i + 1 })),
    totalMarks: fallback.reduce((a, q) => a + q.marks, 0),
    minutes: total === 80 ? 90 : 45,
    stretchCount: fallback.filter((q) => q.difficulty === 3).length,
  };
}

export function getQuestionById(id) {
  for (const set of bankCache.values()) {
    const q = set.find((x) => x.id === id);
    if (q) return q;
  }
  return null;
}