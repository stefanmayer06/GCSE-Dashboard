import { activeId, cacheResult, draftId, normalizeAnswer, parseDraft, parseResult, parseTopics, persistNewSession, progressiveSolutionHints, readCachedResult, secondsRemaining, type PracticeStorage } from './core';

describe('practice core', () => {
  test('normalizes submitted answers without inventing values', () => {
    expect(normalizeAnswer('  12  ')).toBe('12');
    expect(normalizeAnswer([' one ', 'two'])).toEqual(['one', 'two']);
    expect(normalizeAnswer(undefined)).toBeNull();
  });
  test('scopes storage IDs by user and subject', () => {
    expect(draftId('u1', 'english', 's1')).toBe('practice:draft:u1:english:s1');
    expect(activeId('u1', 'maths-higher')).not.toBe(activeId('u1', 'maths'));
  });
  test('restores timers from wall clock time', () => {
    expect(secondsRemaining('2026-01-01T00:01:00.000Z', Date.parse('2026-01-01T00:00:20.000Z'))).toBe(40);
  });
  test('parses partial server results safely', () => {
    const result = parseResult({ correctMarks: 3, totalMarks: 4, extra: 'kept' });
    expect(result.percent).toBe(75);
    expect(result.review).toEqual([]);
    expect(result.raw.extra).toBe('kept');
  });
  test('rejects damaged, mismatched and expired-invalid drafts', () => {
    expect(parseDraft('{bad', 'english')).toBeUndefined();
    expect(parseDraft(JSON.stringify({ session: { id: 's1', subject: 'maths', questions: [] } }), 'english')).toBeUndefined();
    expect(parseDraft(JSON.stringify({ session: { id: 's1', subject: 'english', questions: [] }, answers: {}, current: 0, savedAt: '', expiredAt: 'now' }), 'english')).toBeUndefined();
  });
  test('stores local submitted answers separately from authoritative server results', () => {
    const cached = readCachedResult(cacheResult({ perQuestion: [{ qid: 'q1' }], xpEarned: 10 }, { q1: '  response  ' }));
    expect(cached.serverResult).toMatchObject({ xpEarned: 10 });
    expect(cached.submittedAnswers.q1).toBe('response');
  });
  test('parses Maths strand topic payloads',()=>{expect(parseTopics({strands:{number:{topics:[{id:'fractions'}]}}})).toEqual([{id:'fractions'}])});
  test('extracts nested progressive solution steps while hiding the final answer',()=>{expect(progressiveSolutionHints([['Choose two points.','Calculate the gradient.','Answer = 3.']])).toEqual(['Choose two points.','Calculate the gradient.'])});
  test('cleans both scoped keys if creating the persisted handoff fails', async () => {
    const removed: readonly string[][] = [];
    const storage: PracticeStorage = {
      getItem: async () => null,
      setItem: async () => undefined,
      removeItem: async () => undefined,
      multiSet: async () => { throw new Error('disk full'); },
      multiRemove: async keys => { (removed as string[][]).push([...keys]); },
    };
    await expect(persistNewSession(storage, 'u1', { id: 's1', kind: 'practice', subject: 'english', title: 'T', startedAt: '', questions: [], raw: {} })).rejects.toThrow('disk full');
    expect(removed[0]).toEqual([draftId('u1', 'english', 's1'), activeId('u1', 'english')]);
  });
});
