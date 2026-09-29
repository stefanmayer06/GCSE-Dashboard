import assert from 'node:assert/strict';
import test from 'node:test';

import { allTexts, buildPaper, buildPractice, fullSetFor, getTextDetail, sourceTextForSession } from '../src/subjects/english/bank/index.js';
import { markChooseFour, markMultipleChoiceFour } from '../src/subjects/english/marker.js';
import { P1_TEXTS } from '../src/subjects/english/texts/p1.js';
import { LEGACY_P1_TEXTS } from '../src/subjects/english/texts/p1-legacy.js';
import { P1_Q1_ITEMS } from '../src/subjects/english/texts/p1-q1.js';
import { P2_PAIRS } from '../src/subjects/english/texts/p2.js';
import { LEGACY_P2_SOURCES } from '../src/subjects/english/texts/p2-legacy.js';

test('every Paper 1 source has four 2026-format Q1 parts with private answers', () => {
  for (const source of P1_TEXTS) {
    const question = fullSetFor(source.id, 1)[0];
    assert.equal(question.type, 'mcq4');
    assert.equal(question.marks, 4);
    assert.equal(question.input.items.length, 4);
    assert.equal(question.markCtx.answers.length, 4);
    for (const [i, item] of question.input.items.entries()) {
      assert.deepEqual(item.choices.map(({ id }) => id), ['A', 'B', 'C']);
      assert.ok(item.choices.some(({ id }) => id === question.markCtx.answers[i]));
    }
  }

  const practice = buildPractice('listing', 6);
  assert.equal(practice.length, P1_TEXTS.length);
  for (const question of practice) {
    assert.equal(question.type, 'mcq4');
    assert.equal(question.markCtx.kind, 'mcq4');
  }
  const paper = buildPaper('full', 1);
  assert.equal(paper.questions[0].type, 'mcq4');
  assert.equal(paper.questions[0].markCtx, undefined);
  assert.equal(JSON.stringify(paper.questions[0]).includes('"answers"'), false);
  assert.equal(paper.totalMarks, 80);
});

test('four-part multiple choice awards one mark per correct selection', () => {
  const q = fullSetFor(P1_TEXTS[0].id, 1)[0];
  const answers = q.markCtx.answers;
  const allCorrect = Object.fromEntries(answers.map((answer, i) => [i, answer]));
  assert.equal(markMultipleChoiceFour(allCorrect, q.input.items, answers).marks, 4);
  const partial = { ...allCorrect, 1: 'X', 3: '' };
  const result = markMultipleChoiceFour(partial, q.input.items, answers);
  assert.equal(result.marks, 2);
  assert.equal(result.rows[1].right, false);
  assert.equal(result.rows[1].answer, q.input.items[1].choices.find(({ id }) => id === answers[1]).text);
});

function sourcePart(source, range) {
  const start = source.indexOf(range.start);
  const end = source.indexOf(range.end, start);
  assert.ok(start >= 0 && end >= start, `Missing or reversed range: ${range.start} → ${range.end}`);
  return source.slice(start, end + range.end.length);
}

test('contemporary Paper 1 sources and models stay within their question focus', () => {
  const expectedAnswers = {
    'p1-last-crossing': ['At seven', 'A field recorder', 'Orange', 'A pair of binoculars'],
    'p1-signal-on-the-moor': ['To the weather station', 'Owen', 'A map', 'Three'],
    'p1-the-spare-room': ['At nine twenty', 'Eight', 'A violin', 'A cheese sandwich'],
    'p1-captain-for-a-morning': ['At eight', 'A life jacket', 'To the next harbour', 'Ginger'],
    'p1-the-road-home': ['One stop too early', 'One per cent', 'On a postcard', 'Yellow'],
    'p1-the-test-run': ['At six', 'A cardboard tray', 'A toolbox', 'Nearest the stage'],
  };
  for (const entry of P1_TEXTS) {
    assert.equal(entry.century, '21st century');
    assert.match(entry.source, /original fiction written for practice/i);
    const [q1, q2, q3, q4, q5] = fullSetFor(entry.id, 1);
    const retrievalPart = sourcePart(entry.text, entry.q1.range);
    for (const [index, [prompt, choices, correct, evidence]] of P1_Q1_ITEMS[entry.id].entries()) {
      assert.equal(choices[correct], expectedAnswers[entry.id][index], `${entry.id}: ${prompt}`);
      assert.ok(retrievalPart.includes(evidence), `${entry.id}: retrieval evidence outside range`);
    }
    for (const [key, question] of [['q2', q2], ['q3', q3], ['q4', q4]]) {
      const part = key === 'q3' ? entry.text : sourcePart(entry.text, entry[key].range);
      assert.ok(question.modelAnswer.length > 300, `${entry.id}: missing ${key} model`);
      const quotes = [...question.modelAnswer.matchAll(/"([^"\n]+)"/g)];
      assert.ok(quotes.length >= 2, `${entry.id}: insufficient ${key} source references`);
      for (const [, quote] of quotes) assert.ok(part.includes(quote), `${entry.id} ${key}: quote outside focus: ${quote}`);
    }
    assert.match(q3.text, /build tension|increase suspense|more at ease|change Hari|anxiety to reassurance|confidence turning into doubt/);
    assert.match(q4.text, /Use only the later part/);
    assert.match(q5.options[0].text, /Use your imagination/);
    assert.match(q5.options[1].text, /opening of a story/);
    assert.ok(q5.image.url.startsWith('https://commons.wikimedia.org/wiki/Special:FilePath/'));
    assert.equal([q1, q2, q3, q4, q5].reduce((sum, q) => sum + q.marks, 0), 80);
  }
  const quick = buildPaper('short', 1);
  assert.equal(quick.totalMarks, 44);
  assert.ok(P1_TEXTS.some(({ id }) => id === quick.entryId));
});

test('classic Paper 1 IDs keep their texts and questions but leave the active library', () => {
  const listed = allTexts().filter(({ id }) => id.startsWith('p1-'));
  assert.deepEqual(listed.map(({ id }) => id), P1_TEXTS.map(({ id }) => id));
  for (const legacy of LEGACY_P1_TEXTS) {
    const detail = getTextDetail(legacy.id);
    assert.equal(detail.text, legacy.text);
    assert.equal(detail.archived, true);
    assert.match(detail.paper, /Archived classic/);
    const questions = fullSetFor(legacy.id, 1);
    assert.equal(questions.length, 5);
    assert.ok(questions[1].modelAnswer);
    assert.equal(questions.reduce((sum, q) => sum + q.marks, 0), 80);
  }
  for (const current of P1_TEXTS) assert.equal(getTextDetail(current.id).archived, false);
  const drills = buildPractice('listing', P1_TEXTS.length);
  for (const question of drills) {
    const source = P1_TEXTS.find(({ id }) => question.id.startsWith(`${id}-q`));
    assert.ok(source);
    assert.ok(question.sourceRef.text.includes(source.q1.range.end), 'Retrieval source must not be truncated before the range ends');
  }
});

test('English paper marking keeps the source version seen when a session began', () => {
  for (const legacy of LEGACY_P1_TEXTS) {
    assert.equal(sourceTextForSession({ entryId: legacy.id, paperId: 1 }), legacy.text);
  }
  for (const legacy of LEGACY_P2_SOURCES) {
    const oldText = `${legacy.textA}\n\n${legacy.textB}`;
    assert.equal(sourceTextForSession({ entryId: legacy.id, paperId: 2 }), oldText);
    const current = getTextDetail(legacy.id);
    assert.notEqual(current.textA, legacy.textA, 'Current library must not replace a snapshotless session’s older source');
    const currentText = `${current.textA}\n\n${current.textB}`;
    assert.equal(sourceTextForSession({ entryId: legacy.id, paperId: 2, sourceText: currentText }), currentText);
  }
  assert.equal(sourceTextForSession({ entryId: 'retired-id', paperId: 1, sourceText: 'The text this learner actually read.' }), 'The text this learner actually read.');
});

test('Paper 2 Q1 selects four true statements and caps over-selection', () => {
  for (const pair of P2_PAIRS) {
    const q = fullSetFor(pair.id, 2)[0];
    assert.equal(q.type, 'choose4');
    assert.equal(q.input.statements.length, 8);
    assert.equal(q.markCtx.answers.filter((statement) => statement.a).length, 4);
    const correct = Object.fromEntries(q.markCtx.answers.map((statement, i) => [i, statement.a]));
    assert.equal(markChooseFour(correct, q.markCtx.answers).marks, 4);
    const allSelected = Object.fromEntries(q.markCtx.answers.map((_, i) => [i, true]));
    assert.ok(markChooseFour(allSelected, q.markCtx.answers).marks <= 4);
  }
  const paper = buildPaper('full', 2);
  assert.equal(paper.questions[0].type, 'choose4');
  assert.equal(paper.questions[0].markCtx, undefined);
  assert.equal(paper.totalMarks, 80);
});

test('Paper 2 pairs use non-fiction and Source A alone for Q1', () => {
  for (const pair of P2_PAIRS) {
    const [q1, q2, q3, q4] = fullSetFor(pair.id, 2);
    const sources = [pair.sourceA, pair.sourceB];
    assert.deepEqual(sources.map(({ century }) => century).sort(), ['19th century', '21st century']);
    assert.match(sources.find(({ century }) => century === '19th century').kind, /non-fiction/i);
    assert.match(sources.find(({ century }) => century === '21st century').source, /original text written for practice/i);
    assert.equal(pair.q1.source, 'A');
    assert.match(q1.text, /only to Source A/i);
    assert.ok(q1.input.statements.every(({ text }) => !/Source B/i.test(text)));
    assert.match(q3.text, /only to Source B/i);
    assert.ok(!/Gradgrind|Dickens|Sissy|Gaskell|Milton/.test(`${q2.modelAnswer} ${q4.modelAnswer}`));
  }
  const [schoolsQ1, schoolsQ2, , schoolsQ4] = fullSetFor('p2-schools', 2);
  assert.ok(schoolsQ1.input.statements.every(({ text }) => !/phone|school ban/i.test(text)));
  assert.match(schoolsQ2.text, /experiences of learning/i);
  assert.match(schoolsQ4.modelAnswer, /Mill/);
  const [weatherQ1, weatherQ2, , weatherQ4] = fullSetFor('p2-weather', 2);
  assert.ok(weatherQ1.input.statements.every(({ text }) => !/heatwave|tarmac/i.test(text)));
  assert.match(weatherQ2.modelAnswer, /Schlesinger/);
  assert.match(weatherQ4.modelAnswer, /melodramatic ghost/);
  const [cityQ1, cityQ2, , cityQ4] = fullSetFor('p2-city', 2);
  assert.ok(cityQ1.input.statements.every(({ text }) => !/village|library|flatmate/i.test(text)));
  assert.match(cityQ2.modelAnswer, /Engels/);
  assert.match(cityQ4.modelAnswer, /brutal indifference/);
  const [workQ1, workQ2, workQ3, workQ4] = fullSetFor('p2-work', 2);
  assert.ok(workQ1.input.statements.every(({ text }) => !/agency|supervisor|dentist/i.test(text)));
  assert.match(workQ2.modelAnswer, /Mayhew/);
  assert.match(workQ3.text, /Low Pay/);
  assert.match(workQ4.modelAnswer, /street seller/);
  const reversed = P2_PAIRS.find(({ id }) => id === 'p2-city-modern-first');
  assert.equal(reversed.sourceA.century, '21st century');
  assert.equal(reversed.sourceB.century, '19th century');
  const [reversedQ1, reversedQ2, reversedQ3] = fullSetFor(reversed.id, 2);
  assert.match(reversedQ1.text, /only to Source A/i);
  assert.equal(reversedQ1.markCtx.answers.filter(({ a }) => a).length, 4);
  assert.match(reversedQ2.modelAnswer, /Source A describes a modern worker/);
  assert.match(reversedQ3.text, /only to Source B/i);
  assert.match(reversedQ3.modelAnswer, /Engels/);
  const detail = getTextDetail(reversed.id);
  assert.match(detail.textMetaA.source, /original text written for practice/i);
  assert.equal(detail.textMetaA.gutenberg, null);
  assert.match(detail.textMetaB.source, /public domain/i);
  assert.match(detail.textMetaB.gutenberg, /gutenberg\.org/);
});

test('older-source reading practice follows the older text in either source order', () => {
  const practice = buildPractice('reading-19c', P2_PAIRS.length);
  assert.equal(practice.length, P2_PAIRS.length);
  for (const question of practice) {
    assert.equal(question.rubricKey, 'reading19c');
    assert.match(question.rubric.name, /not an exam question/i);
    assert.ok(question.sourceRef.text);
    assert.ok(question.modelAnswer);
    assert.equal(question.sourceRef.textA, undefined);
  }
  const reversed = practice.find(({ id }) => id.startsWith('p2-city-modern-first'));
  assert.match(reversed.text, /Read Source B/);
  assert.match(reversed.sourceRef.text, /brutal indifference/);
});
