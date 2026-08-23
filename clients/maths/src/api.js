const base = '/api/maths';

async function req(path, opts = {}) {
  const res = await fetch(base + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  health: () => req('/health'),
  topics: () => req('/topics'),
  topic: (id) => req(`/topics/${id}`),
  papers: () => req('/papers'),
  newTest: (type, paper = 1) => req('/test/new', { method: 'POST', body: { type, paper } }),
  submitTest: (id, answers, durationSec) =>
    req(`/test/${id}/submit`, { method: 'POST', body: { answers, durationSec } }),
  practice: (topicId, count = 8) =>
    req('/practice', { method: 'POST', body: { topicId, count } }),
  check: (qid, value) => req('/check', { method: 'POST', body: { qid, value } }),
  practiceSubmit: (topicId, answers) =>
    req('/practice/submit', { method: 'POST', body: { topicId, answers } }),
  adhoc: (count, papers) => req('/adhoc', { method: 'POST', body: { count, papers } }),
  adhocSubmit: (answers) => req('/adhoc/submit', { method: 'POST', body: { answers } }),
  progress: () => req('/progress'),
  chat: (messages) => req('/chat', { method: 'POST', body: { messages } }),
  clearChat: () => req('/chat', { method: 'DELETE' }),
  chatHistory: () => req('/chat/history'),
};
