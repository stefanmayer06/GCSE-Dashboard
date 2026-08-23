import { makeRand, shuffle } from '../util.js';
import { P1_TEXTS } from '../texts/p1.js';
import { P2_PAIRS } from '../texts/p2.js';
import { exemplarsFor } from '../texts/exemplars.js';
import { rubricFor } from '../marking.js';

export const PAPERS = {
  1: {
    id: 1,
    code: '8700/1',
    name: 'Paper 1',
    title: 'Explorations in Creative Reading and Writing',
    blurb: 'One fiction extract · Questions 1–5 (4 + 8 + 8 + 20 + 40 marks)',
    minutes: 105,
    quickMinutes: 50,
  },
  2: {
    id: 2,
    code: '8700/2',
    name: 'Paper 2',
    title: 'Writers\u2019 Viewpoints and Perspectives',
    blurb: 'Two non-fiction sources (19th century + modern) · Questions 1–5 (4 + 8 + 12 + 16 + 40 marks)',
    minutes: 105,
    quickMinutes: 50,
  },
};

export function paperList() {
  return Object.values(PAPERS);
}

export function allTexts() {
  const list = [];
  for (const t of P1_TEXTS) {
    list.push({
      id: t.id,
      paper: 'Paper 1 — Fiction extract',
      title: t.title,
      author: t.author,
      year: t.year,
      century: t.century,
      kind: t.kind,
      source: t.source,
      gutenberg: t.gutenberg || null,
      excerpt: t.text.slice(0, 400),
      theme: 'AQA-style creative reading text',
      skills: t.skills,
    });
  }
  for (const p of P2_PAIRS) {
    list.push({
      id: p.id,
      paper: 'Paper 2 — Writers\u2019 viewpoints',
      title: `${p.sourceA.title} / ${p.sourceB.title}`,
      author: `${p.sourceA.author} (${p.sourceA.year}) · ${p.sourceB.author} (${p.sourceB.year})`,
      year: p.sourceA.year,
      century: `${p.sourceA.century} + ${p.sourceB.century}`,
      kind: 'Source pair',
      source: p.sourceA.source,
      gutenberg: p.sourceA.gutenberg || null,
      excerpt: p.sourceA.text.slice(0, 200) + ' …',
      theme: p.theme,
      skills: p.skills,
    });
  }
  return list;
}

export function getTextDetail(id) {
  const p1 = P1_TEXTS.find((t) => t.id === id);
  if (p1) {
    return {
      id: p1.id,
      paper: 'Paper 1 — Fiction extract',
      title: p1.title,
      author: p1.author,
      year: p1.year,
      century: p1.century,
      kind: p1.kind,
      source: p1.source,
      gutenberg: p1.gutenberg || null,
      text: p1.text,
      skills: p1.skills,
    };
  }
  const p2 = P2_PAIRS.find((t) => t.id === id);
  if (p2) {
    return {
      id: p2.id,
      paper: 'Paper 2 — Source pair',
      title: `${p2.sourceA.title} / ${p2.sourceB.title}`,
      author: `${p2.sourceA.author} (${p2.sourceA.year}) · ${p2.sourceB.author} (${p2.sourceB.year})`,
      year: p2.sourceA.year,
      century: `${p2.sourceA.century} + ${p2.sourceB.century}`,
      kind: p2.kind,
      source: p2.sourceA.source,
      gutenberg: p2.sourceA.gutenberg || null,
      theme: p2.theme,
      textA: p2.sourceA.text,
      textMetaA: { title: p2.sourceA.title, author: p2.sourceA.author, year: p2.sourceA.year, century: p2.sourceA.century },
      textB: p2.sourceB.text,
      textMetaB: { title: p2.sourceB.title, author: p2.sourceB.author, year: p2.sourceB.year, century: p2.sourceB.century },
      skills: p2.skills,
    };
  }
  return null;
}

/* ---------------- question assembly ---------------- */

function baseQ(entryId, qn, type, marks, targetMins, title, text, skillIds, extra = {}) {
  return {
    id: `${entryId}-q${qn}`,
    qn,
    type,
    marks,
    targetMins,
    title,
    text,
    skillIds,
    ...extra,
  };
}

function p1QuestionSet(entry) {
  const ex = exemplarsFor(entry.id);
  const qs = [];
  qs.push(
    baseQ(entry.id, 1, 'list', 4, 5, 'Q1 · List four things', entry.q1.focus, ['listing'], {
      input: { kind: 'list', placeholder: 'Write one thing per line…', hint: 'Short, separate points — no analysis.' },
      markType: 'auto',
      markCtx: { kind: 'list', points: entry.q1.points },
    })
  );
  qs.push(
    baseQ(entry.id, 2, 'text', 8, 10, 'Q2 · Language analysis', entry.q2.focus, ['language'], {
      input: { kind: 'textarea', rows: 8, hint: 'Use quotes. Name the technique, then the effect.' },
      markType: 'ai',
      rubricKey: 'p1q2',
      modelAnswer: ex.q2 || '',
      worth: 8,
    })
  );
  qs.push(
    baseQ(entry.id, 3, 'text', 8, 10, 'Q3 · Structure analysis', entry.q3.focus, ['structure'], {
      input: { kind: 'textarea', rows: 8, hint: 'Think opening, focus shifts, tension, ending.' },
      markType: 'ai',
      rubricKey: 'p1q3',
      modelAnswer: ex.q3 || '',
      worth: 8,
    })
  );
  qs.push(
    baseQ(entry.id, 4, 'text', 20, 20, 'Q4 · To what extent do you agree?', `${entry.q4.statement}\n\n${entry.q4.focus}`, ['evaluation'], {
      input: { kind: 'textarea', rows: 12, hint: 'Build an argument, don\u2019t list. Use evaluative language.' },
      markType: 'ai',
      rubricKey: 'p1q4',
      modelAnswer: ex.q4 || '',
      worth: 20,
      statement: entry.q4.statement,
    })
  );
  qs.push(
    baseQ(entry.id, 5, 'essay', 40, 45, 'Q5 · Creative writing (40 marks)', 'Choose ONE task and write your response.', ['creative-writing', 'accuracy'], {
      options: [
        { id: 'a', label: 'Description', text: entry.q5a },
        { id: 'b', label: 'Story', text: entry.q5b },
      ],
      input: { kind: 'textarea', rows: 18, hint: '5 minutes planning, 35 writing, 5 checking. New paragraph per idea!' },
      markType: 'ai',
      rubricKey: 'p1q5',
      modelAnswer: ex.q5plan || '',
      worth: 40,
    })
  );
  return qs;
}

function p2QuestionSet(pair) {
  const ex = exemplarsFor(pair.id);
  const qs = [];
  qs.push(
    baseQ(pair.id, 1, 'truefalse', 4, 5, 'Q1 · Choose four true statements', 'Read both sources. Choose whether each statement is TRUE or FALSE.', ['listing'], {
      input: { kind: 'truefalse', statements: pair.q1.statements.map((s) => ({ text: s.t })) },
      markType: 'auto',
      markCtx: { kind: 'truefalse', answers: pair.q1.statements },
    })
  );
  qs.push(
    baseQ(pair.id, 2, 'text', 8, 8, 'Q2 · Summary of the differences', pair.q2.focus, ['summarising'], {
      input: { kind: 'textarea', rows: 8, hint: 'Details from BOTH sources, compared. No language analysis here.' },
      markType: 'ai',
      rubricKey: 'p2q2',
      modelAnswer: ex.q2 || '',
      worth: 8,
    })
  );
  qs.push(
    baseQ(pair.id, 3, 'text', 12, 12, 'Q3 · Language analysis (Source B)', pair.q3.focus, ['language'], {
      input: { kind: 'textarea', rows: 10, hint: 'Quote from Source B only. Technique + effect on the reader.' },
      markType: 'ai',
      rubricKey: 'p2q3',
      modelAnswer: ex.q3 || '',
      worth: 12,
    })
  );
  qs.push(
    baseQ(pair.id, 4, 'text', 16, 16, 'Q4 · Compare viewpoints and methods', pair.q4.focus, ['comparing'], {
      input: { kind: 'textarea', rows: 12, hint: 'WHAT each writer thinks AND HOW they put it across — compare both.' },
      markType: 'ai',
      rubricKey: 'p2q4',
      modelAnswer: ex.q4 || '',
      worth: 16,
    })
  );
  qs.push(
    baseQ(pair.id, 5, 'essay', 40, 40, 'Q5 · Writing to argue (40 marks)', pair.q5.prompt, ['argument-writing', 'accuracy'], {
      options: [],
      input: { kind: 'textarea', rows: 18, hint: 'Match the form. Argue with reasons; persuade with feeling. 5 min plan, 35 write.' },
      markType: 'ai',
      rubricKey: 'p2q5',
      modelAnswer: ex.q5plan || '',
      worth: 40,
    })
  );
  return qs;
}

/* ---------------- sanitising ---------------- */

/** Remove answers/rubric internals before questions reach the client. */
function sanitize(q) {
  const out = {
    id: q.id,
    qn: q.qn,
    type: q.type,
    marks: q.marks,
    targetMins: q.targetMins,
    title: q.title,
    text: q.text,
    skillIds: q.skillIds,
    input: q.input,
    markType: q.markType,
    rubricKey: q.rubricKey || null,
    options: q.options || [],
    worth: q.worth,
    statement: q.statement || null,
  };
  if (q.type === 'truefalse') {
    out.input = { ...q.input, statements: q.input.statements.map((s) => ({ text: s.text })) };
  }
  return out;
}

/* ---------------- papers ---------------- */

export function buildPaper(type = 'full', paperId = 1) {
  const paper = PAPERS[paperId] || PAPERS[1];
  const rng = makeRand('paper', Math.floor(Math.random() * 2 ** 31));

  let entry;
  let set;
  if (paperId === 1) {
    entry = P1_TEXTS[Math.floor(rng() * P1_TEXTS.length)];
    set = p1QuestionSet(entry);
  } else {
    entry = P2_PAIRS[Math.floor(rng() * P2_PAIRS.length)];
    set = p2QuestionSet(entry);
  }

  const quick = type === 'short';
  const questions = (quick ? set.filter((q) => q.qn === 1 || q.qn === 5) : set)
    .map((q, i) => ({ ...sanitize(q), qn: i + 1 }));

  const out = {
    type,
    paperId: paper.id,
    paperCode: paper.code,
    paperName: paper.name,
    paperTitle: paper.title,
    entryId: entry.id,
    minutes: quick ? paper.quickMinutes : paper.minutes,
    totalMarks: questions.reduce((a, q) => a + q.marks, 0),
    questions,
  };

  if (paperId === 1) {
    out.source = {
      kind: 'single',
      title: entry.title,
      author: entry.author,
      year: entry.year,
      century: entry.century,
      text: entry.text,
    };
  } else {
    out.source = {
      kind: 'pair',
      sourceA: { title: entry.sourceA.title, author: entry.sourceA.author, year: entry.sourceA.year, century: entry.sourceA.century, text: entry.sourceA.text },
      sourceB: { title: entry.sourceB.title, author: entry.sourceB.author, year: entry.sourceB.year, century: entry.sourceB.century, text: entry.sourceB.text },
    };
  }
  return out;
}

/** Store full question sets (with answers/rubrics) for active tests. */
export function fullSetFor(entryId, paperId) {
  if (paperId === 1) {
    const e = P1_TEXTS.find((t) => t.id === entryId);
    return e ? p1QuestionSet(e) : [];
  }
  const p = P2_PAIRS.find((t) => t.id === entryId);
  return p ? p2QuestionSet(p) : [];
}

/* ---------------- practice & ad-hoc ---------------- */

const ACCURACY_DRILLS = [
  {
    id: 'acc-1', text: 'Rewrite this sentence correctly:\n"your going to there house later, but its to late to borrow theyre car"',
    answerText: '"You\u2019re going to their house later, but it\u2019s too late to borrow their car."\nYou\u2019re = you are · their = belonging to them · it\u2019s = it is · too = also/excessively · their = belonging to them.',
  },
  {
    id: 'acc-2', text: 'Rewrite this sentence correctly:\n"the dog wagged it\u2019s tail and ran across the road were the children was playing"',
    answerText: '"The dog wagged its tail and ran across the road where the children were playing."\nits (no apostrophe) = belonging to it · where = place · were = plural verb.',
  },
  {
    id: 'acc-3', text: 'Rewrite this sentence correctly:\n"i could of gone to the shop but i didnt have no money"',
    answerText: '"I could have gone to the shop, but I didn\u2019t have any money."\n"Could of" is not correct — the phrase is "could have". Avoid double negatives: "didn\u2019t have any".',
  },
  {
    id: 'acc-4', text: 'Rewrite this sentence correctly:\n"the teacher said its important to practice every day and your marks will improve"',
    answerText: '"The teacher said it\u2019s important to practise every day, and your marks will improve."\nit\u2019s = it is · practise = verb (with an s) · comma before "and" joins the two clauses.',
  },
];

function buildPracticeQ(topicId, entry, paperId, idx) {
  const ex = exemplarsFor(entry.id);
  if (topicId === 'listing') {
    const e = P1_TEXTS.find((t) => t.id === entry.id);
    return baseQ(entry.id, idx, 'list', 4, 5, 'Practice · List four things', e.q1.focus, ['listing'], {
      sourceRef: { paperId: 1, text: e.text.slice(0, 1500) },
      input: { kind: 'list', placeholder: 'Write one thing per line…' },
      markType: 'auto',
      markCtx: { kind: 'list', points: e.q1.points },
    });
  }
  if (topicId === 'language') {
    const e = P1_TEXTS.find((t) => t.id === entry.id);
    if (e) {
      return baseQ(entry.id, idx, 'text', 8, 10, 'Practice · Language analysis', e.q2.focus, ['language'], {
        sourceRef: { paperId: 1, text: e.text },
        input: { kind: 'textarea', rows: 8 },
        markType: 'ai',
        rubricKey: 'p1q2',
        modelAnswer: ex.q2 || '',
      });
    }
    const p = P2_PAIRS.find((t) => t.id === entry.id);
    return baseQ(entry.id, idx, 'text', 12, 12, 'Practice · Language analysis (Source B)', p.q3.focus, ['language'], {
      sourceRef: { paperId: 2, text: p.sourceB.text, title: p.sourceB.title },
      input: { kind: 'textarea', rows: 10 },
      markType: 'ai',
      rubricKey: 'p2q3',
      modelAnswer: ex.q3 || '',
    });
  }
  if (topicId === 'structure') {
    const e = P1_TEXTS.find((t) => t.id === entry.id);
    return baseQ(entry.id, idx, 'text', 8, 10, 'Practice · Structure analysis', e.q3.focus, ['structure'], {
      sourceRef: { paperId: 1, text: e.text },
      input: { kind: 'textarea', rows: 8 },
      markType: 'ai',
      rubricKey: 'p1q3',
      modelAnswer: ex.q3 || '',
    });
  }
  if (topicId === 'evaluation') {
    const e = P1_TEXTS.find((t) => t.id === entry.id);
    return baseQ(entry.id, idx, 'text', 20, 20, 'Practice · Evaluation', `${e.q4.statement}\n\n${e.q4.focus}`, ['evaluation'], {
      sourceRef: { paperId: 1, text: e.text },
      input: { kind: 'textarea', rows: 12 },
      markType: 'ai',
      rubricKey: 'p1q4',
      modelAnswer: ex.q4 || '',
    });
  }
  if (topicId === 'summarising') {
    const p = P2_PAIRS.find((t) => t.id === entry.id);
    return baseQ(entry.id, idx, 'text', 8, 8, 'Practice · Summary', p.q2.focus, ['summarising'], {
      sourceRef: { paperId: 2, textA: p.sourceA.text, titleA: p.sourceA.title, textB: p.sourceB.text, titleB: p.sourceB.title },
      input: { kind: 'textarea', rows: 8 },
      markType: 'ai',
      rubricKey: 'p2q2',
      modelAnswer: ex.q2 || '',
    });
  }
  if (topicId === 'comparing') {
    const p = P2_PAIRS.find((t) => t.id === entry.id);
    return baseQ(entry.id, idx, 'text', 16, 16, 'Practice · Comparing viewpoints', p.q4.focus, ['comparing'], {
      sourceRef: { paperId: 2, textA: p.sourceA.text, titleA: p.sourceA.title, textB: p.sourceB.text, titleB: p.sourceB.title },
      input: { kind: 'textarea', rows: 12 },
      markType: 'ai',
      rubricKey: 'p2q4',
      modelAnswer: ex.q4 || '',
    });
  }
  if (topicId === 'reading-19c') {
    const p = P2_PAIRS.find((t) => t.id === entry.id);
    return baseQ(entry.id, idx, 'text', 8, 8, 'Practice · Decode the 19th-century source', `Read Source A (${p.sourceA.title}, ${p.sourceA.century}).\nIn your own words, explain what the writer says and what their attitude seems to be. Then pick TWO phrases you had to work out and explain how you decoded them.`, ['reading-19c'], {
      sourceRef: { paperId: 2, textA: p.sourceA.text, titleA: p.sourceA.title },
      input: { kind: 'textarea', rows: 8 },
      markType: 'ai',
      rubricKey: 'p2q2',
      modelAnswer: ex.q2 || '',
    });
  }
  if (topicId === 'creative-writing') {
    const e = P1_TEXTS.find((t) => t.id === entry.id);
    return baseQ(entry.id, idx, 'essay', 40, 30, 'Practice · Creative writing', `Choose ONE:\n\nDescription: ${e.q5a}\n\nStory: ${e.q5b}\n\nWrite your response (aim for 3-4 paragraphs).`, ['creative-writing', 'accuracy'], {
      input: { kind: 'textarea', rows: 14 },
      markType: 'ai',
      rubricKey: 'p1q5',
      modelAnswer: ex.q5plan || '',
    });
  }
  if (topicId === 'argument-writing') {
    const p = P2_PAIRS.find((t) => t.id === entry.id);
    return baseQ(entry.id, idx, 'essay', 40, 30, 'Practice · Writing to argue', p.q5.prompt, ['argument-writing', 'accuracy'], {
      input: { kind: 'textarea', rows: 14 },
      markType: 'ai',
      rubricKey: 'p2q5',
      modelAnswer: ex.q5plan || '',
    });
  }
  return null;
}

export function buildPractice(topicId, count = 3) {
  if (topicId === 'accuracy') {
    return ACCURACY_DRILLS.map((d, i) => ({
      id: d.id,
      qn: i + 1,
      type: 'text',
      marks: 4,
      targetMins: 3,
      title: 'Practice · Fix the errors',
      text: d.text,
      skillIds: ['accuracy'],
      input: { kind: 'textarea', rows: 4 },
      markType: 'self',
      modelAnswer: d.answerText,
      worth: null,
      options: [],
      markCtx: null,
      rubricKey: null,
      sourceRef: null,
    }));
  }
  const rng = makeRand('practice-' + topicId, Date.now());
  const pool = topicId === 'comparing' || topicId === 'summarising' || topicId === 'reading-19c'
    ? P2_PAIRS : P1_TEXTS;
  const picked = shuffle(rng, [...pool]).slice(0, count);
  const qs = [];
  picked.forEach((e, i) => {
    const q = buildPracticeQ(topicId, e, pool === P2_PAIRS ? 2 : 1, i + 1);
    if (q) {
      q.rubric = q.rubricKey ? rubricFor(q.rubricKey) : null;
      if (q.markType !== 'auto') delete q.markCtx;
      qs.push(q);
    }
  });
  return qs;
}

export function buildAdhoc(count = 12, kinds = ['listing', 'truefalse', 'analysis']) {
  const rng = makeRand('adhoc', Date.now());
  const qs = [];
  const p1 = shuffle(rng, [...P1_TEXTS]);
  const p2 = shuffle(rng, [...P2_PAIRS]);
  const usedTexts = new Set();
  let guard = 0;
  while (qs.length < count && guard < 200) {
    guard++;
    const kind = kinds[Math.floor(rng() * kinds.length)];
    if (kind === 'listing') {
      const e = p1.find((t) => !usedTexts.has(t.id)) || p1[qs.length % p1.length];
      usedTexts.add(e.id);
      const q = p1QuestionSet(e)[0];
      q.qn = qs.length + 1;
      q.title = 'Quick-fire · List four things';
      q.sourceRef = { paperId: 1, text: e.text.slice(0, 1800), title: e.title };
      qs.push(q);
    } else if (kind === 'truefalse') {
      const p = p2.find((t) => !usedTexts.has(t.id)) || p2[qs.length % p2.length];
      usedTexts.add(p.id);
      const q = p2QuestionSet(p)[0];
      q.qn = qs.length + 1;
      q.title = 'Quick-fire · True or false';
      q.sourceRef = {
        paperId: 2,
        textA: p.sourceA.text,
        titleA: p.sourceA.title,
        textB: p.sourceB.text,
        titleB: p.sourceB.title,
      };
      qs.push(q);
    } else {
      const useP1 = rng() < 0.5;
      const idx = Math.floor(rng() * 4);
      const entry = useP1 ? p1[idx % p1.length] : p2[idx % p2.length];
      const set = useP1 ? p1QuestionSet(entry) : p2QuestionSet(entry);
      const q = set[useP1 ? 2 : 3];
      const clone = { ...q };
      clone.id = `${q.id}-adhoc-${guard}`;
      clone.qn = qs.length + 1;
      clone.marks = q.marks;
      clone.targetMins = Math.ceil(q.marks / 2);
      clone.title = 'Quick-fire · Language analysis';
      clone.sourceRef = {
        paperId: useP1 ? 1 : 2,
        text: useP1 ? entry.text : entry.sourceB.text,
        title: useP1 ? entry.title : entry.sourceB.title,
      };
      qs.push(clone);
    }
  }
  return qs;
}