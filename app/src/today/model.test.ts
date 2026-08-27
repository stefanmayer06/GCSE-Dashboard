import { isNewProgress, nextPaper, parsePapers, parseProgress, parseTopics, rankedTopics, recommendSession } from './model';

const topics = parseTopics({ strands: { number: { name: 'Number', topics: [
  { id: 'fractions', name: 'Fractions', accuracy: 42, answered: 12, completed: true },
  { id: 'ratio', name: 'Ratio', accuracy: null, answered: 0, completed: false },
  { id: 'algebra', name: 'Algebra', accuracy: null, answered: 0, completed: false },
] } } });

test('normalizes grouped server topics and deterministically prioritizes unseen topics', () => {
  expect(topics).toHaveLength(3);
  expect(rankedTopics(topics).map((topic) => topic.id)).toEqual(['algebra', 'ratio', 'fractions']);
  expect(recommendSession('maths', topics)).toEqual(expect.objectContaining({ minutes: 12, topic: expect.objectContaining({ id: 'algebra' }) }));
});

test('prioritizes lowest accuracy when every topic has practice', () => {
  const practiced = topics.map((topic, index) => ({ ...topic, answered: 2, accuracy: [70, 35, 55][index] }));
  expect(recommendSession('english', practiced)).toEqual(expect.objectContaining({ minutes: 15, topic: expect.objectContaining({ id: 'ratio' }) }));
});

test('uses only real history to advance the available paper', () => {
  const papers = parsePapers({ papers: [{ id: 1, code: '8300/1F', name: 'Paper 1', minutes: { short: 45 } }, { id: 2, code: '8300/2F', name: 'Paper 2' }] });
  expect(nextPaper(papers, [])).toEqual({ paper: papers[0], hasRecordedHistory: false });
  expect(nextPaper(papers, [{ paperId: 1 }])).toEqual({ paper: papers[1], hasRecordedHistory: true });
});

test('recognizes untouched server progress without deriving XP', () => {
  const progress = parseProgress({ xp: 0, level: 1, streak: 0, testsTaken: 0, practiceAnswered: 0, lessonsCompleted: 0 });
  expect(isNewProgress(progress)).toBe(true);
  expect(progress.xp).toBe(0);
});
