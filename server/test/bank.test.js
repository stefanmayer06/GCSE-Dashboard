import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPaper, loadBank, questionsFor } from '../src/bank/index.js';
import { TOPICS } from '../src/bank/topics.js';

await loadBank();

const visualTopics = [
  'scale', 'angles', 'area-perimeter', 'circles', 'volume-surface', 'pythagoras',
  'trigonometry', 'transformations', 'probability-basic', 'probability-combined', 'charts', 'scatter',
];

test('all diagram-led families carry serializable accessible stimuli', () => {
  for (const topicId of visualTopics) {
    const questions = questionsFor(topicId);
    const visualQuestions = questions.filter((q) => q.stimulus);
    assert.ok(visualQuestions.length >= questions.length * 0.8, `${topicId} has insufficient visual coverage`);
    for (const question of visualQuestions) {
      assert.ok(question.stimulus.type, `${question.id} has no stimulus type`);
      assert.ok(question.stimulus.alt, `${question.id} has no text alternative`);
      assert.doesNotThrow(() => JSON.stringify(question.stimulus));
    }
  }
});

test('generated papers use all strands and realistic visual density', () => {
  const expected = ['Algebra', 'Geometry & Measures', 'Number', 'Probability', 'Ratio & Proportion', 'Statistics'];
  for (const paperId of [1, 2, 3]) {
    for (const type of ['full', 'short']) {
      for (let sample = 0; sample < 20; sample++) {
        const paper = buildPaper(type, paperId);
        const target = type === 'full' ? 80 : 40;
        const visualCount = paper.questions.filter((q) => q.stimulus).length;
        assert.equal(paper.totalMarks, target);
        assert.deepEqual([...paper.strandCoverage].sort(), expected);
        assert.ok(visualCount >= (target === 80 ? 8 : 4));
        assert.ok(visualCount <= (target === 80 ? 13 : 7));
      }
    }
  }
});

test('parallel-line MCQs have exactly one matching gradient', () => {
  for (let p = 0; p < 8; p++) {
    const q = questionsFor('graphs')[4 + p * 8];
    const sourceGradient = Number(q.text.match(/y = (\d+)x/)?.[1]);
    const matching = q.input.choices.filter((choice) => Number(choice.text.match(/y = (\d+)x/)?.[1]) === sourceGradient);
    assert.equal(matching.length, 1, q.id);
  }
});

test('corrected geometry and chart variants stay mathematically valid', () => {
  const circleSymmetry = questionsFor('transformations')[46];
  assert.equal(circleSymmetry.answerText, 'infinitely many');

  for (let p = 0; p < 8; p++) {
    const quadrilateral = questionsFor('angles')[3 + p * 9];
    assert.ok(quadrilateral.answer >= 40 && quadrilateral.answer < 180, quadrilateral.id);
  }

  for (let p = 0; p < 12; p++) {
    const tally = questionsFor('charts')[4 + p * 6];
    assert.equal(tally.stimulus.count, tally.answer);
  }
});

test('frequency tables and visual sequences use structured stimuli', () => {
  for (let p = 0; p < 9; p++) {
    for (const branch of [4, 5]) {
      const question = questionsFor('averages')[branch + p * 8];
      assert.equal(question.stimulus.type, 'table');
      assert.ok(question.stimulus.rows.length >= 3);
    }
  }
  for (let p = 0; p < 8; p++) {
    assert.equal(questionsFor('sequences')[7 + p * 8].stimulus.type, 'dot-pattern');
  }
});

test('arithmetic and equation generators store mathematically correct answers', () => {
  for (const question of questionsFor('operations')) {
    if (question.id.endsWith('-5') || /-\d5$/.test(question.id)) {
      const values = [...question.text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
      if (question.text.includes('÷') && question.text.includes('×')) {
        assert.equal(question.answer, (values[0] / values[1]) * values[2], question.id);
      }
    }
    if (question.text.includes('× 100')) {
      const [value, multiplier] = [...question.text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
      assert.equal(question.answer, value * multiplier, question.id);
    }
  }

  for (const question of questionsFor('equations')) {
    if (!question.text.includes('Solve')) continue;
    const candidate = question.answer;
    const equation = question.text.replace('Solve', '').trim().replaceAll('−', '-').replaceAll('x', `(${candidate})`);
    const [left, right] = equation.split('=').map((side) => Function(`return ${side.replace(/(\d)\s*\(/g, '$1*(')}`)());
    assert.ok(Math.abs(left - right) < 1e-9, question.id);
  }
});

test('known content regressions remain corrected', () => {
  assert.equal(questionsFor('fractions')[47].answerText, '2 1/3');
  assert.equal(questionsFor('averages')[45].answer, 1.5);
  assert.match(questionsFor('percentages')[20].solution.flat().join(' '), /÷ 1\.05/);
  assert.match(questionsFor('angles')[33].text, /2 decimal places/);

  for (let sample = 0; sample < 30; sample++) {
    const paper = buildPaper('full', 1);
    assert.ok(paper.questions.every((question) => !(question.topicId === 'trigonometry' && Number(question.id.split('-').at(-1)) % 6 === 3)));
  }
});
