const base = '/api/english';
const authBase = '/api/auth';

async function req(path, opts = {}) {
  const res = await fetch(base + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `Request failed (${res.status})`);
    error.code = body.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

async function authReq(path, opts = {}) {
  const res = await fetch(authBase + path, {
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
  papers: () => req('/papers'),
  texts: () => req('/texts'),
  text: (id) => req(`/texts/${id}`),
  topics: () => req('/topics'),
  topic: (id) => req(`/topics/${id}`),
  newTest: (type, paper = 1) => req('/test/new', { method: 'POST', body: { type, paper } }),
  testStatus: (id) => req(`/test/${id}/status`),
  discardTest: (id) => req(`/test/${id}`, { method: 'DELETE' }),
  submitTest: (id, answers, durationSec) =>
    req(`/test/${id}/submit`, { method: 'POST', body: { answers, durationSec } }),
  practice: (topicId, count = 3) =>
    req('/practice', { method: 'POST', body: { topicId, count } }),
  check: (sessionId, qid, value) =>
    req('/check', { method: 'POST', body: { sessionId, qid, value } }),
  practiceSubmit: (sessionId, answers, aiResults) =>
    req('/practice/submit', { method: 'POST', body: { sessionId, answers, aiResults } }),
  adhoc: (count, kinds) => req('/adhoc', { method: 'POST', body: { count, kinds } }),
  adhocSubmit: (sessionId, answers, aiResults) =>
    req('/adhoc/submit', { method: 'POST', body: { sessionId, answers, aiResults } }),
  mark: (sessionId, qid, answer) =>
    req('/mark', { method: 'POST', body: { sessionId, qid, answer } }),
  progress: () => req('/progress'),
  chat: (messages) => req('/chat', { method: 'POST', body: { messages } }),
  clearChat: () => req('/chat', { method: 'DELETE' }),
  chatHistory: () => req('/chat/history'),
  auth: {
    me: () => authReq('/me'),
    login: (username, password) => authReq('/login', { method: 'POST', body: { username, password } }),
    signup: (username, password) => authReq('/signup', { method: 'POST', body: { username, password } }),
    logout: () => authReq('/logout', { method: 'POST' }),
    config: () => authReq('/config'),
  },
};
