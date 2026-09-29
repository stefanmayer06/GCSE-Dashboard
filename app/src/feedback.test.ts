import { submitFeedback, validateFeedback } from './feedback';

test('validates feedback before sending', () => {
  expect(validateFeedback({})).toMatch(/student/i);
  expect(validateFeedback({ role: 'student' })).toMatch(/subject/i);
  expect(validateFeedback({ role: 'student', subject: 'maths', rating: 0, message: 'hello there' })).toMatch(/rating/i);
  expect(validateFeedback({ role: 'student', subject: 'maths', rating: 5, message: '  ' })).toMatch(/improve/i);
  expect(validateFeedback({ role: 'student', subject: 'maths', rating: 5, message: 'The practice timer confused me', email: 'not-an-email' })).toMatch(/email/i);
  expect(validateFeedback({ role: 'student', subject: 'maths', rating: 4, message: 'The practice timer confused me' })).toBeNull();
});

test('posts to the public feedback endpoint without auth', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const request = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return { ok: true, json: async () => ({ ok: true }) };
  }) as unknown as typeof fetch;
  process.env.EXPO_PUBLIC_API_URL = 'https://study.example.com';
  await submitFeedback({ role: 'student', subject: 'maths', rating: 5, message: 'Loved the fix-up set' }, request);
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toBe('https://study.example.com/api/feedback');
  const body = JSON.parse(String((calls[0].init as { body: string }).body));
  expect(body.role).toBe('student');
  expect(body.website).toBe('');
  expect(body.source).toBe('mobile-app');
});

test('surfaces rate-limit errors honestly', async () => {
  const request = (async () => ({ ok: false, status: 429, json: async () => ({ error: 'Too many feedback submissions. Please try again later.' }) })) as unknown as typeof fetch;
  process.env.EXPO_PUBLIC_API_URL = 'https://study.example.com';
  await expect(submitFeedback({ role: 'student', subject: 'english', rating: 3, message: 'More source variety please' }, request)).rejects.toThrow(/Too many/);
});
