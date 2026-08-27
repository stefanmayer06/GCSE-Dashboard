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

export async function supabaseAccessToken() {
  const stored = storedSupabaseAccessToken();
  if (stored) return stored;
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
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
