import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPaper, loadBank, markAnswers, questionsFor } from '../src/subjects/maths/bank/index.js';
import { TOPICS } from '../src/subjects/maths/bank/topics.js';

await loadBank();

const visualTopics = [
  'scale', 'angles', 'area-perimeter', 'circles', 'volume-surface', 'pythagoras',
  'trigonometry', 'transformations', 'probability-basic', 'probability-combined', 'charts', 'scatter',
];

test('all diagram-led Foundation families carry serializable accessible stimuli', () => {
  for (const topicId of visualTopics) {
    const questions = questionsFor(topicId);
    const visualQuestions = questions.filter((question) => question.stimulus);
    assert.ok(visualQuestions.length >= questions.length * 0.8, `${topicId} has insufficient visual coverage`);
    for (const question of visualQuestions) {
      assert.ok(question.stimulus.type, `${question.id} has no stimulus type`);
      assert.ok(question.stimulus.alt, `${question.id} has no text alternative`);
      assert.doesNotThrow(() => JSON.stringify(question.stimulus));
    }
  }
});

test('generated Foundation papers use all strands and realistic visual density', () => {
  const expected = ['Algebra', 'Geometry & Measures', 'Number', 'Probability', 'Ratio & Proportion', 'Statistics'];
  for (const paperId of [1, 2, 3]) {
    for (const type of ['full', 'short']) {
      for (let sample = 0; sample < 20; sample++) {
        const paper = buildPaper(type, paperId);
        const target = type === 'full' ? 80 : 40;
        const visualCount = paper.questions.filter((question) => question.stimulus).length;
        assert.equal(paper.totalMarks, target);
        assert.deepEqual([...paper.strandCoverage].sort(), expected);
        assert.ok(visualCount >= (target === 80 ? 8 : 4));
        assert.ok(visualCount <= (target === 80 ? 13 : 7));
      }
    }
  }
});

test('parallel-line MCQs have exactly one matching gradient', () => {
  for (let pattern = 0; pattern < 8; pattern++) {
    const question = questionsFor('graphs')[4 + pattern * 8];
    const sourceGradient = Number(question.text.match(/y = (\d+)x/)?.[1]);
    const matching = question.input.choices.filter((choice) => Number(choice.text.match(/y = (\d+)x/)?.[1]) === sourceGradient);
    assert.equal(matching.length, 1, question.id);
  }
});

test('corrected geometry and chart variants stay mathematically valid', () => {
  const octagonSymmetry = questionsFor('transformations')[46];
  assert.equal(octagonSymmetry.answerText, '8');
  assert.equal(octagonSymmetry.stimulus.kind, 'polygon');
  assert.equal(octagonSymmetry.stimulus.sides, 8);

  for (let pattern = 0; pattern < 8; pattern++) {
    const quadrilateral = questionsFor('angles')[3 + pattern * 9];
    assert.ok(quadrilateral.answer >= 40 && quadrilateral.answer < 180, quadrilateral.id);
  }

  for (let pattern = 0; pattern < 12; pattern++) {
    const tally = questionsFor('charts')[4 + pattern * 6];
    assert.equal(tally.stimulus.count, tally.answer);
  }
});

test('frequency tables and visual sequences use structured stimuli', () => {
  for (let pattern = 0; pattern < 9; pattern++) {
    for (const branch of [4, 5]) {
      const question = questionsFor('averages')[branch + pattern * 8];
      assert.equal(question.stimulus.type, 'table');
      assert.ok(question.stimulus.rows.length >= 3);
    }
  }
  for (let pattern = 0; pattern < 8; pattern++) {
    assert.equal(questionsFor('sequences')[7 + pattern * 8].stimulus.type, 'dot-pattern');
  }
});

test('Foundation result rows retain the question stimulus for review', () => {
  const question = questionsFor('angles').find((item) => item.stimulus);
  const marked = markAnswers([question], [{ qid: question.id, value: question.answer }]);
  assert.deepEqual(marked.perQ[0].stimulus, question.stimulus);
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

test('Foundation N4 factor, prime, HCF and LCM questions have one valid answer', () => {
  const questions = questionsFor('factors-multiples');
  assert.equal(questions.length, 60);
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const prime = (n) => n >= 2 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((d) => n % d !== 0);
  const product = (notation) => notation.split(' × ').reduce((total, term) => {
    const [, base, power] = term.match(/^(\d+)([²³⁴])?$/) || [];
    assert.ok(base, `unreadable prime product: ${notation}`);
    return total * Number(base) ** ({ '²': 2, '³': 3, '⁴': 4 }[power] || 1);
  }, 1);

  for (const question of questions) {
    const family = Number(question.id.split('-').at(-1)) % 6;
    const choices = question.input.choices?.map((choice) => choice.text);
    if (family === 0) {
      const number = Number(question.text.match(/\d+/)[0]);
      assert.equal(choices.filter((choice) => number % Number(choice) === 0).length, 1, question.id);
    } else if (family === 1) {
      assert.equal(choices.filter((choice) => prime(Number(choice))).length, 1, question.id);
    } else if (family === 2) {
      const number = Number(question.text.match(/\d+/)[0]);
      assert.equal(choices.filter((choice) => product(choice) === number).length, 1, question.id);
    } else {
      const [a, b] = [...question.text.matchAll(/\d+/g)].slice(0, 2).map((match) => Number(match[0]));
      const expected = family === 3 || (family === 5 && question.text.startsWith('Two ribbons'))
        ? gcd(a, b)
        : a * b / gcd(a, b);
      assert.equal(question.answer, expected, question.id);
    }
    const marked = markAnswers([question], [{ qid: question.id, value: question.answer }]);
    assert.equal(marked.correctMarks, question.marks, question.id);
  }
});

test('finance lessons and tax questions supply fictional rules without asserting UK rates', () => {
  const lesson = TOPICS.find((topic) => topic.id === 'money-finance');
  assert.ok(lesson);
  assert.ok(lesson.notes.some((note) => note.t === 'p' && note.text.includes('do not assume a current UK tax rule')));
  assert.doesNotMatch(JSON.stringify(lesson), /National Insurance|first £12,570 you earn is tax-free/);

  for (const question of questionsFor('money-finance')) {
    const variant = Number(question.id.split('-').at(-1)) % 6;
    if (variant !== 0 && variant !== 5) continue;
    assert.match(question.text, /simplified fictional/);
    assert.doesNotMatch(question.text, /National Insurance/);
    const income = Number(question.text.match(/£([\d,]+) per year/)[1].replaceAll(',', ''));
    const rate = variant === 0 ? 0.2 : 0.28;
    assert.ok(Math.abs(question.answer - (income - 12570) * rate) < 0.001, question.id);
    assert.equal(markAnswers([question], [{ qid: question.id, value: question.answer }]).correctMarks, question.marks);
  }
});

test('Foundation N9 standard-form questions have one correctly normalised answer', () => {
  const questions = questionsFor('standard-form');
  assert.equal(questions.length, 60);
  const parse = (text) => {
    const match = text.match(/^([\d.]+) × 10\^(-?\d+)$/);
    assert.ok(match, `unreadable standard form: ${text}`);
    return { coefficient: Number(match[1]), value: Number(match[1]) * 10 ** Number(match[2]) };
  };
  const near = (a, b) => Math.abs(a - b) <= Math.max(1e-12, Math.abs(b) * 1e-10);

  for (const question of questions) {
    const family = Number(question.id.split('-').at(-1)) % 6;
    const choices = question.input.choices || [];
    assert.equal(new Set(choices.map((choice) => choice.text)).size, choices.length, question.id);
    if (family === 1) {
      const source = question.text.match(/([\d.]+ × 10\^-?\d+)/)[1];
      assert.ok(near(question.answer, parse(source).value), question.id);
    } else {
      const selected = choices.find((choice) => choice.label === question.answer);
      assert.equal(selected?.text, question.answerText, question.id);
      if (family === 2) {
        assert.equal(choices.filter((choice) => {
          const { coefficient } = parse(choice.text);
          return coefficient >= 1 && coefficient < 10;
        }).length, 1, question.id);
      } else if (family === 4) {
        assert.equal(Math.max(...choices.map((choice) => parse(choice.text).value)), parse(selected.text).value, question.id);
      } else {
        const target = family === 0
          ? Number(question.text.match(/Write ([\d,.]+)/)[1].replaceAll(',', ''))
          : family === 3
            ? [...question.text.matchAll(/([\d.]+ × 10\^-?\d+)/g)].slice(0, 2).reduce((value, match) => value * parse(match[1]).value, 1)
            : Number(question.text.match(/([\d.]+)E([+-]\d+)/)[1]) * 10 ** Number(question.text.match(/([\d.]+)E([+-]\d+)/)[2]);
        assert.equal(choices.filter((choice) => {
          const { coefficient, value } = parse(choice.text);
          return coefficient >= 1 && coefficient < 10 && near(value, target);
        }).length, 1, question.id);
      }
    }
    assert.equal(markAnswers([question], [{ qid: question.id, value: question.answer }]).correctMarks, question.marks, question.id);
  }
});

test('known Foundation content regressions remain corrected', () => {
  assert.equal(questionsFor('fractions')[47].answerText, '2 1/3');
  assert.equal(questionsFor('averages')[45].answer, 1.5);
  assert.match(questionsFor('percentages')[20].solution.flat().join(' '), /÷ 1\.05/);
  assert.match(questionsFor('angles')[33].text, /2 decimal places/);

  for (let pattern = 0; pattern < 12; pattern++) {
    const question = questionsFor('ratio')[5 + pattern * 6];
    const [total, firstPart, secondPart] = [...question.text.matchAll(/\d+/g)].map((match) => Number(match[0]));
    assert.equal(question.answer, total * secondPart / (firstPart + secondPart), question.id);
  }

  for (let sample = 0; sample < 30; sample++) {
    const paper = buildPaper('full', 1);
    assert.ok(paper.questions.every((question) => !(question.topicId === 'trigonometry' && Number(question.id.split('-').at(-1)) % 6 === 3)));
  }
});

test('targeted Fix-Up adhoc sets draw weak topics first and still reach full size', async () => {
  const { buildAdhoc } = await import('../src/subjects/maths/bank/index.js');
  const topics = ['fractions', 'ratio'];
  const set = buildAdhoc(5, [1, 2, 3], topics);
  assert.equal(set.questions.length, 5);
  assert.equal(set.targeted, true);
  assert.ok(set.targetedCount >= 1, 'at least one targeted question expected');
  assert.ok(set.questions.every((q) => q.topicId && q.text && q.input), 'targeted questions stay fully formed');
  const plain = buildAdhoc(5, [1, 2, 3]);
  assert.equal(plain.questions.length, 5);
  assert.equal(plain.targeted, undefined);
});
