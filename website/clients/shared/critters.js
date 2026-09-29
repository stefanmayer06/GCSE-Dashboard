import { CRITTER_HUES, starsFor } from './circuit/palette.js';

// Study creatures: the milestone collection. Each creature is fed by ONE
// real evidence track (server progress or the mistake notebook) and evolves
// through four ranks as that evidence grows. Nothing here is stored: tiers
// are recomputed from evidence on every render, so a creature can only be
// earned, never granted. The art lives in circuit/Critter.jsx.
//
// Why ranks and not an Elo rating: Elo needs a rated opponent per result
// and drops after a miss, which would punish practising weak topics — the
// thing the mistake-to-mastery loop wants most. Ranks only rise with work.

export const RANKS = [
  { id: 'egg', name: 'Egg' },
  { id: 'bronze', name: 'Bronze' },
  { id: 'silver', name: 'Silver' },
  { id: 'gold', name: 'Gold' },
  { id: 'legend', name: 'Legend' },
];

export const MAX_TIER = RANKS.length - 1;

const plural = (count, one, many) => (count === 1 ? one : many);

// Tier thresholds for course-sized tracks scale with the course: English has
// 10 skills, Foundation 29 topics. Always strictly increasing.
function courseTiers(total, fractions, floor = []) {
  const n = Math.max(4, Math.round(Number(total) || 0) || 20);
  const tiers = fractions.map((f, index) => Math.max(floor[index] ?? 1, Math.ceil(n * f)));
  for (let index = 1; index < tiers.length; index += 1) {
    tiers[index] = Math.max(tiers[index], tiers[index - 1] + 1);
  }
  return tiers;
}

export const CRITTERS = [
  {
    id: 'ember',
    family: 'Ember',
    forms: ['Kindlekit', 'Emberfox', 'Blazetail', 'Solarfox'],
    ...CRITTER_HUES.ember,
    track: 'Day streak',
    lore: 'A fox made of warm light. It glows while your streak runs. Rest days pause it and a freeze protects it.',
    value: ({ progress }) => progress?.streak ?? 0,
    tiers: () => [3, 7, 30, 100],
    count: (n) => `${n}-day streak`,
    goal: (n) => `Reach a ${n}-day streak`,
    todo: (n) => `Keep studying for ${n} more ${plural(n, 'day', 'days')}`,
    action: { label: 'Study today', to: 'next' },
  },
  {
    id: 'quill',
    family: 'Quillby',
    forms: ['Quillet', 'Quillby', 'Inkspike', 'Quillmaster'],
    ...CRITTER_HUES.quill,
    track: 'Marked answers',
    lore: 'A hedgehog whose quills are pencils. Every answer you get marked sharpens another one.',
    value: ({ progress }) => progress?.practiceAnswered ?? 0,
    tiers: () => [25, 150, 500, 1500],
    count: (n) => `${n} marked ${plural(n, 'answer', 'answers')}`,
    goal: (n) => `Answer ${n} marked questions`,
    todo: (n) => `Answer ${n} more marked ${plural(n, 'question', 'questions')}`,
    action: { label: 'Answer questions', to: '/practice#adhoc' },
  },
  {
    id: 'tock',
    family: 'Tock',
    forms: ['Tick', 'Tock', 'Chronowl', 'Grand Chronowl'],
    ...CRITTER_HUES.tock,
    track: 'Timed papers',
    lore: 'An owl with a clock for a heart. It only wakes up under real exam conditions.',
    value: ({ progress }) => progress?.testsTaken ?? 0,
    tiers: () => [1, 3, 10, 25],
    count: (n) => `${n} timed ${plural(n, 'paper', 'papers')}`,
    goal: (n) => `Sit ${n} timed ${plural(n, 'paper', 'papers')}`,
    todo: (n) => `Sit ${n} more timed ${plural(n, 'paper', 'papers')}`,
    action: { label: 'Sit a timed paper', to: '/practice' },
  },
  {
    id: 'rexam',
    family: 'Rexam',
    forms: ['Rexlet', 'Rexam', 'Rexcel', 'Rexcellent'],
    ...CRITTER_HUES.rexam,
    track: 'Paper average',
    lore: 'A tiny dinosaur that grows with your average mark on timed papers. It shows your current form, so it can dip and grow back.',
    value: ({ progress }) => ((progress?.testsTaken ?? 0) > 0 ? progress?.overallPercent ?? 0 : 0),
    tiers: () => [40, 55, 70, 85],
    count: (n) => `${n}% paper average`,
    goal: (n) => `Average ${n}% across your timed papers`,
    todo: (n) => `Lift your paper average by ${n} ${plural(n, 'point', 'points')}`,
    action: { label: 'Sit a timed paper', to: '/practice' },
  },
  {
    id: 'tortile',
    family: 'Tortile',
    forms: ['Tortle', 'Tortile', 'Terratile', 'Atlastoise'],
    ...CRITTER_HUES.tortile,
    track: 'Topics explored',
    lore: 'A tortoise that carries your course map on its shell. Each topic you open adds a tile.',
    value: ({ progress }) => exploredTopics(progress),
    tiers: ({ topicCount }) => courseTiers(topicCount, [0, 0.25, 0.5, 1]),
    count: (n) => `${n} ${plural(n, 'topic', 'topics')} explored`,
    goal: (n) => `Explore ${n} ${plural(n, 'topic', 'topics')}`,
    todo: (n) => `Explore ${n} more ${plural(n, 'topic', 'topics')}`,
    action: { label: 'Open the map', to: 'learn' },
  },
  {
    id: 'prismo',
    family: 'Prismo',
    forms: ['Shardling', 'Prismo', 'Prismight', 'Gemperor'],
    ...CRITTER_HUES.prismo,
    track: '3-star topics',
    lore: 'A crystal beetle. It grows a gem for every topic you master: 90% or better over at least five answers.',
    value: ({ progress }) => threeStarTopics(progress),
    tiers: ({ topicCount }) => courseTiers(topicCount, [0, 0.1, 0.25, 0.5], [1, 2]),
    count: (n) => `${n} 3-star ${plural(n, 'topic', 'topics')}`,
    goal: (n) => `Earn 3 stars on ${n} ${plural(n, 'topic', 'topics')}`,
    todo: (n) => `Earn 3 stars on ${n} more ${plural(n, 'topic', 'topics')}`,
    action: { label: 'Replay a lesson', to: 'learn' },
  },
  {
    id: 'redo',
    family: 'Redo',
    forms: ['Redo', 'Retry', 'Rekindle', 'Reborn'],
    ...CRITTER_HUES.redo,
    track: 'Mistakes fixed',
    lore: 'A phoenix chick that hatches from a fixed mistake. Every notebook mistake you master makes it stronger.',
    value: ({ mistakes }) => (Array.isArray(mistakes) ? mistakes.filter((row) => row?.mastered).length : 0),
    tiers: () => [1, 5, 15, 40],
    count: (n) => `${n} ${plural(n, 'mistake', 'mistakes')} fixed`,
    goal: (n) => `Fix ${n} notebook ${plural(n, 'mistake', 'mistakes')} for good`,
    todo: (n) => `Fix ${n} more notebook ${plural(n, 'mistake', 'mistakes')}`,
    action: { label: 'Open the notebook', to: '/notebook' },
  },
  {
    id: 'memmoth',
    family: 'Memmoth',
    forms: ['Memmo', 'Memmoth', 'Rememmoth', 'Megamemmoth'],
    ...CRITTER_HUES.memmoth,
    track: 'Memory checks',
    lore: 'A mammoth never forgets. It grows each time you prove an old fixed mistake still sticks.',
    value: ({ mistakes }) => (Array.isArray(mistakes)
      ? mistakes.reduce((sum, row) => sum + (row?.mastered ? Math.max(0, Number(row.resurrectedCount) || 0) : 0), 0)
      : 0),
    tiers: () => [1, 5, 15, 40],
    count: (n) => `${n} memory ${plural(n, 'check', 'checks')} passed`,
    goal: (n) => `Pass ${n} memory ${plural(n, 'check', 'checks')}`,
    todo: (n) => `Pass ${n} more memory ${plural(n, 'check', 'checks')}`,
    action: { label: 'Open the notebook', to: '/notebook' },
  },
];

export const CRITTER_IDS = CRITTERS.map((critter) => critter.id);

export function critterById(id) {
  return CRITTERS.find((critter) => critter.id === id) || null;
}

// Topics with any marked evidence or a completed lesson.
export function exploredTopics(progress) {
  const ids = new Set(Array.isArray(progress?.completedLessonIds) ? progress.completedLessonIds : []);
  for (const [id, row] of Object.entries(progress?.topicStats || {})) {
    if (row && Number(row.total) > 0) ids.add(id);
  }
  return ids.size;
}

// Same rule as the map stars (starsFor): 90%+ over 5+ marked answers.
export function threeStarTopics(progress) {
  return Object.values(progress?.topicStats || {}).filter((row) => {
    const total = Number(row?.total) || 0;
    if (!total) return false;
    return starsFor(Math.round((100 * (Number(row.correct) || 0)) / total), total) === 3;
  }).length;
}

export function tierFor(value, tiers) {
  let tier = 0;
  for (const at of tiers) if (value >= at) tier += 1;
  return tier;
}

// One creature's state from evidence: tier, current form and progress
// towards the next evolution (0-1).
export function critterState(critter, evidence = {}) {
  const tiers = critter.tiers(evidence);
  const raw = Number(critter.value(evidence));
  const value = Number.isFinite(raw) ? Math.max(0, raw) : 0;
  const tier = tierFor(value, tiers);
  const next = tier < tiers.length ? tiers[tier] : null;
  const from = tier > 0 ? tiers[tier - 1] : 0;
  const toNext = next == null ? 1 : Math.max(0, Math.min(1, (value - from) / Math.max(1, next - from)));
  return {
    id: critter.id,
    critter,
    value,
    tier,
    tiers,
    rank: RANKS[tier],
    form: tier > 0 ? critter.forms[tier - 1] : `${critter.family} egg`,
    next,
    toNext,
  };
}

export function critterCollection({ progress = null, mistakes = [], topicCount = 0 } = {}) {
  const evidence = { progress, mistakes, topicCount };
  return CRITTERS.map((critter) => critterState(critter, evidence));
}

// Collector rank: the sum of every evolution, read like a game ladder.
const COLLECTOR_RANKS = [
  { at: 0, name: 'Egg hunter' },
  { at: 1, name: 'Bronze collector' },
  { at: 8, name: 'Silver collector' },
  { at: 16, name: 'Gold collector' },
  { at: 26, name: 'Legend collector' },
];

export function collectorRank(states) {
  const total = states.reduce((sum, state) => sum + state.tier, 0);
  const max = states.length * MAX_TIER;
  let index = 0;
  COLLECTOR_RANKS.forEach((rank, i) => { if (total >= rank.at) index = i; });
  const next = COLLECTOR_RANKS[index + 1] || null;
  return { total, max, name: COLLECTOR_RANKS[index].name, next: next ? { name: next.name, at: next.at } : null };
}

// Evolutions since the tiers last shown on this device. The seen map is a
// display cache only (it decides whether to play the evolve animation); it
// never grants a tier.
export function newEvolutions(seen, states) {
  if (!seen || typeof seen !== 'object') return [];
  return states
    .filter((state) => Number.isInteger(seen[state.id]) && state.tier > seen[state.id])
    .map((state) => ({ id: state.id, from: seen[state.id], to: state.tier }));
}

export function tierMap(states) {
  return Object.fromEntries(states.map((state) => [state.id, state.tier]));
}

export function seenKey(subject, userId) {
  return `gcse-critters:${subject}:${userId || 'guest'}`;
}

export function readSeen(subject, userId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(seenKey(subject, userId)) || 'null');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSeen(subject, userId, states) {
  try {
    localStorage.setItem(seenKey(subject, userId), JSON.stringify(tierMap(states)));
  } catch {
    // Private mode or blocked storage: celebrations just replay next time.
  }
}

// "Answer 12 more marked questions to evolve into Inkspike."
export function remainingCopy(state) {
  const { critter, next, value, tier } = state;
  if (next == null) return null;
  const gap = Math.max(0, next - value);
  return `${critter.todo(gap)} ${tier === 0 ? 'to hatch this egg' : `to evolve into ${critter.forms[tier]}`}.`;
}

export function progressLabel(state) {
  const { critter, value, next } = state;
  if (next == null) return `${critter.count(value)} · fully evolved`;
  return critter.id === 'rexam' ? `${value}% / ${next}%` : `${value} / ${next}`;
}

export function shareText(state, subjectName) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { critter } = state;
  return `My ${critter.family} evolved into ${state.form} (${state.rank.name} rank) revising ${subjectName} on GCSE Study Desk: ${critter.count(state.value)}. Free AQA practice, worked solutions and a mistake notebook that brings misses back until they stick. ${origin}`.trim();
}
