import {
  clearSupabaseSession,
  storeSupabaseSession,
  storedSupabaseAccessToken,
  supabase,
  supabaseAccessToken,
} from '../../shared/supabase.js';

const base = '/api/english';
const authBase = '/api/auth';

async function req(path, opts = {}) {
  const token = (await supabaseAccessToken()) || storedSupabaseAccessToken();
  const res = await fetch(base + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
  const token = (await supabaseAccessToken()) || storedSupabaseAccessToken();
  const res = await fetch(authBase + path, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
    login: async (identifier, password) => {
      if (!supabase) {
        const result = await authReq('/login', {
          method: 'POST',
          body: { username: identifier, email: identifier, password },
        });
        storeSupabaseSession(result.session);
        return result;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
      if (error) throw new Error(error.message || 'Sign in failed.');
      return authReq('/me');
    },
    signup: async ({ username, email, password }) => {
      if (!supabase) {
        const result = await authReq('/signup', { method: 'POST', body: { username, email, password } });
        storeSupabaseSession(result.session);
        return result;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) throw new Error(error.message || 'Sign up failed.');
      if (!data.session) return { pendingEmailConfirmation: true, user: { username, email } };
      return authReq('/me');
    },
    claim: async ({ username, email, currentPassword, newPassword }) => {
      const result = await authReq('/claim', {
        method: 'POST',
        body: { username, email, currentPassword, newPassword },
      });
      if (result.session && supabase) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
      } else {
        storeSupabaseSession(result.session);
      }
      return result.session ? authReq('/me') : result;
    },
    logout: async () => {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message || 'Sign out failed.');
        return { ok: true };
      }
      const result = await authReq('/logout', { method: 'POST' });
      clearSupabaseSession();
      return result;
    },
    config: () => authReq('/config'),
  },
};
