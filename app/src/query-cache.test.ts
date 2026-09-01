import type { QueryClient } from '@tanstack/react-query';
import { queryKeys, warmSubjectCache } from './query-cache';

test('uses one subject resource key across every route', () => {
  expect(queryKeys.progress('maths')).toEqual(['subject', 'maths', 'progress']);
  expect(queryKeys.topics('maths')).toEqual(['subject', 'maths', 'topics']);
  expect(queryKeys.papers('maths')).toEqual(['subject', 'maths', 'papers']);
  expect(queryKeys.progress('maths-higher')).not.toEqual(queryKeys.progress('maths'));
});

test('keeps personal cache entries account scoped', () => {
  expect(queryKeys.personal('english', 'user-a')).not.toEqual(queryKeys.personal('english', 'user-b'));
});

test('warms likely next routes after the first screen', async () => {
  const prefetchQuery = jest.fn().mockResolvedValue(undefined);
  await warmSubjectCache({ prefetchQuery } as unknown as QueryClient, 'english', ['one', 'two', 'three', 'four']);
  expect(prefetchQuery).toHaveBeenCalledTimes(5);
  expect(prefetchQuery.mock.calls.map(([options]) => options.queryKey)).toEqual([
    queryKeys.tutorHistory('english'),
    queryKeys.topic('english', 'one'),
    queryKeys.topic('english', 'two'),
    queryKeys.topic('english', 'three'),
    queryKeys.texts('english'),
  ]);
});
