import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildHigherPaper,
  higherCheckAnswer,
  higherQuestionById,
  higherQuestionsFor,
  higherTopics,
  loadHigherBank,
} from '../src/subjects/maths/bank/higher.js';

await loadHigherBank();

test('every Higher question accepts its canonical answer', () => {
  for (const topic of higherTopics()) {
    for (const question of higherQuestionsFor(topic.id)) {
      const value = question.input.accepted?.[0] ?? question.answer;
      assert.equal(higherCheckAnswer(question.id, value).correct, true, question.id);
    }
  }
});

test('generated Higher papers satisfy hard assessment constraints', () => {
  for (const type of ['short', 'full']) {
    const expectedMarks = type === 'full' ? 80 : 40;
    for (const paperId of [1, 2, 3]) {
      for (let sample = 0; sample < 50; sample++) {
        const paper = buildHigherPaper(type, paperId);
        assert.equal(paper.questions.reduce((sum, question) => sum + question.marks, 0), expectedMarks);
        assert.ok(paper.questions.some((question) => question.stimulus?.type === 'cartesian' || question.stimulus?.type === 'histogram'), `${paper.paperCode} needs a graph`);
        assert.equal(paper.questions.filter((question) => question.exceptional).length, 1, `${paper.paperCode} must have one exceptional question`);
        if (paperId === 1) {
          assert.equal(paper.questions.some((question) => higherQuestionById(question.id)?.calculator === 'required'), false, 'Paper 1 must be non-calculator safe');
        }
      }
    }
  }
});
