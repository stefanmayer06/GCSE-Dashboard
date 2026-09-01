import { createClient } from '@supabase/supabase-js';

const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const key = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || import.meta.env.VITE_SUPABASE_ANON_KEY
    || '',
).trim();

export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const SERVER_SESSION_KEY = 'gcse-supabase-session';
const TOKEN_TIMEOUT_MS = 2500;

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) storeSupabaseSession(session);
    else localStorage.removeItem(SERVER_SESSION_KEY);
  });
}

export async function supabaseAccessToken() {
  const stored = storedSupabaseAccessToken();
  if (stored) return stored;
  if (!supabase) return null;
  try {
    return await Promise.race([
      supabase.auth.getSession().then(({ data }) => data.session?.access_token || null),
      new Promise((_, reject) => setTimeout(() => reject(new Error('token timeout')), TOKEN_TIMEOUT_MS)),
    ]);
  } catch {
    return storedSupabaseAccessToken();
  }
}

export async function supabaseSessionUser() {
  if (!supabase) {
    const stored = storedSupabaseAccessToken();
    return stored ? { username: null, email: null } : null;
  }
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  return {
    username: user.user_metadata?.username || null,
    email: user.email || null,
  };
}

export function storedSupabaseAccessToken() {
  try {
    const value = JSON.parse(localStorage.getItem(SERVER_SESSION_KEY) || 'null');
    return value?.access_token || null;
  } catch {
    return null;
  }
}

export function storeSupabaseSession(session) {
  if (!session?.access_token) return;
  localStorage.setItem(SERVER_SESSION_KEY, JSON.stringify(session));
}

export async function clearSupabaseSession() {
  localStorage.removeItem(SERVER_SESSION_KEY);
  if (supabase) await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
}
