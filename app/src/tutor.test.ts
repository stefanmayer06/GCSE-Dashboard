import { boundTutorHistory, parseTutorHistory, parseTutorNotebook, parseTutorResponse, tutorNotebookKey, type TutorMessage } from './tutor';

test('reads current and alternate tutor response fields', () => {
  expect(parseTutorResponse({ reply: ' Try this step ', model: ' tutor-v1 ' })).toEqual({ content: 'Try this step', model: 'tutor-v1', error: false });
  expect(parseTutorResponse({ message: { text: 'Nested answer' } }).content).toBe('Nested answer');
  expect(parseTutorResponse({ model: 'x' }).error).toBe(true);
});

test('filters malformed and blank history while accepting text fields', () => {
  expect(parseTutorHistory({ messages: [{ role: 'user', content: ' Question ' }, { role: 'assistant', text: 'Answer' }, { role: 'system', content: 'hidden' }, { role: 'assistant', content: '' }] })).toEqual([
    { role: 'user', content: 'Question' },
    { role: 'assistant', content: 'Answer' },
  ]);
  expect(parseTutorHistory({ messages: [] })).toEqual([]);
});

test('bounds history by count and characters and excludes unconfirmed messages', () => {
  const messages: TutorMessage[] = [
    { id: '1', role: 'user', content: 'old' },
    { id: '2', role: 'assistant', content: '12345' },
    { id: '3', role: 'user', content: 'failed', status: 'failed' },
    { id: '4', role: 'user', content: '67890' },
  ];
  expect(boundTutorHistory(messages, 2, 8)).toEqual([{ role: 'assistant', content: '345' }, { role: 'user', content: '67890' }]);
});

test('scopes tutor notebooks by authenticated user and subject under the cleanup prefix', () => {
  expect(tutorNotebookKey('user-a', 'english')).toBe('tutor-notebook:user-a:english:v1');
  expect(tutorNotebookKey('user-b', 'english')).not.toBe(tutorNotebookKey('user-a', 'english'));
  expect(tutorNotebookKey('user-a', 'maths')).not.toBe(tutorNotebookKey('user-a', 'english'));
  expect(tutorNotebookKey('user/with spaces', 'english')).toMatch(/^tutor-notebook:/);
});

test('parses notebook histories independently and marks interrupted sends for retry', () => {
  const first = parseTutorNotebook(JSON.stringify({ messages: [{ id: '1', role: 'user', content: 'Private A', status: 'sending' }], draft: 'Draft A' }));
  const second = parseTutorNotebook(JSON.stringify({ messages: [{ id: '2', role: 'assistant', content: 'Private B' }], draft: 'Draft B' }));
  expect(first).toEqual({ messages: [{ id: '1', role: 'user', content: 'Private A', status: 'failed' }], draft: 'Draft A' });
  expect(second).toEqual({ messages: [{ id: '2', role: 'assistant', content: 'Private B' }], draft: 'Draft B' });
  expect(parseTutorNotebook(null)).toEqual({ messages: [], draft: '' });
});
