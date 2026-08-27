import { filterTopicGroups, mergeTopicProgress, parseNotes, parseTopicGroups, safeText } from './learn';

describe('learn contract parsing', () => {
  test('parses server strand and section maps', () => {
    const groups = parseTopicGroups({ strands: { number: { name: 'Number', topics: [{ id: 'fractions', name: 'Fractions', accuracy: 50 }] } } });
    expect(groups[0]).toMatchObject({ id: 'number', name: 'Number' });
    expect(groups[0].topics[0]).toMatchObject({ id: 'fractions', accuracy: 50 });
    expect(parseTopicGroups({ sections: { reading: { name: 'Reading skills', topics: [{ id: 'language', name: 'Language' }] } } })[0].id).toBe('reading');
  });

  test('merges heterogeneous progress and assigns one recommendation', () => {
    const groups = parseTopicGroups([{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }]);
    const merged = mergeTopicProgress(groups, { topics: { a: { correct: 2, total: 4 } }, completedLessonIds: ['b'] });
    expect(merged[0].topics[0]).toMatchObject({ accuracy: 50, answered: 4, recommended: true });
    expect(merged[0].topics[1].completed).toBe(true);
  });

  test('filters against topic copy and group name', () => {
    const groups = parseTopicGroups({ sections: { writing: { name: 'Writing skills', topics: [{ id: 'story', name: 'Story openings', blurb: 'Create atmosphere' }] } } });
    expect(filterTopicGroups(groups, 'atmosphere')).toHaveLength(1);
    expect(filterTopicGroups(groups, 'algebra')).toHaveLength(0);
  });

  test('normalizes notes and never stringifies objects', () => {
    expect(parseNotes([{ t: 'p', text: 'Purpose' }, { t: 'b', items: ['One', { text: 'Two' }] }, { t: 'f', title: 'Frame', text: { text: 'Point, evidence, explain' } }, { t: 'e', q: 'Why?', a: ['Because', 'Therefore'] }])).toEqual([
      { kind: 'paragraph', text: 'Purpose' },
      { kind: 'list', items: ['One', 'Two'] },
      { kind: 'method', title: 'Frame', text: 'Point, evidence, explain' },
      { kind: 'example', question: 'Why?', answer: 'Because\nTherefore' },
    ]);
    expect(safeText({ unexpected: true })).toBe('');
  });
});
