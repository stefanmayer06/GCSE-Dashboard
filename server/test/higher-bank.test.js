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
  const higherTopicIds = new Set(higherTopics().filter((topic) => topic.tier === 'higher').map((topic) => topic.id));
  for (const type of ['short', 'full']) {
    const expectedMarks = type === 'full' ? 80 : 40;
    const stretchRange = type === 'full' ? [18, 30] : [8, 16];
    const minimumVisuals = type === 'full' ? 5 : 3;
    const minimumHigherMarks = type === 'full' ? 28 : 14;
    for (const paperId of [1, 2, 3]) {
      for (let sample = 0; sample < 50; sample++) {
        const paper = buildHigherPaper(type, paperId);
        const privateQuestions = paper.questions.map((question) => higherQuestionById(question.id));
        assert.equal(paper.questions.reduce((sum, question) => sum + question.marks, 0), expectedMarks);
        assert.ok(paper.questions.some((question) => question.stimulus?.type === 'cartesian' || question.stimulus?.type === 'histogram'), `${paper.paperCode} needs a graph`);
        assert.ok(paper.questions.filter((question) => question.stimulus).length >= minimumVisuals, `${paper.paperCode} needs ${minimumVisuals} visual questions`);
        assert.equal(paper.questions.filter((question) => question.exceptional).length, 1, `${paper.paperCode} must have one exceptional question`);
        assert.ok(paper.stretchMarks >= stretchRange[0] && paper.stretchMarks <= stretchRange[1], `${paper.paperCode} has ${paper.stretchMarks} stretch marks`);
        assert.equal(privateQuestions.filter((question) => question.stretch && higherTopicIds.has(question.topicId)).reduce((sum, question) => sum + question.marks, 0), paper.stretchMarks, `${paper.paperCode} stretch marks must come from Higher content`);
        assert.ok(privateQuestions.filter((question) => higherTopicIds.has(question.topicId)).reduce((sum, question) => sum + question.marks, 0) >= minimumHigherMarks, `${paper.paperCode} needs enough Higher-specific content`);
        assert.equal(new Set(privateQuestions.map((question) => question.familyId)).size, paper.questions.length, `${paper.paperCode} repeats a question family`);
        assert.equal(new Set(paper.questions.map((question) => question.strand)).size, 6, `${paper.paperCode} must cover all strands`);
        if (paperId === 1) {
          assert.equal(paper.questions.some((question) => higherQuestionById(question.id)?.calculator === 'required'), false, 'Paper 1 must be non-calculator safe');
          assert.equal(paper.questions.some((question) => /use π = 3\.14/i.test(question.text)), false, 'Paper 1 must exclude decimal-pi calculations');
        }
      }
    }
  }
});

test('Higher geometry, probability and statistics families provide structured stimuli', () => {
  for (const topicId of ['bounds', 'similarity-vectors', 'circle-theorems', 'trigonometry-higher', 'probability-conditional', 'statistics-higher']) {
    const questions = higherQuestionsFor(topicId);
    assert.ok(questions.length > 0, `${topicId} should have questions`);
    assert.ok(questions.every((question) => question.stimulus), `${topicId} should always provide a stimulus`);
    assert.ok(questions.every((question) => typeof question.stimulus.alt === 'string' && question.stimulus.alt.length > 0), `${topicId} stimuli need alt text`);
  }
});

test('Higher decimal algebra and probability calculations require a calculator', () => {
  for (const topicId of ['algebraic-fractions', 'functions-higher', 'probability-conditional']) {
    for (const question of higherQuestionsFor(topicId)) {
      if (/decimal places/i.test(question.text)) assert.equal(question.calculator, 'required', `${question.id} should be calculator-required`);
    }
  }
});
