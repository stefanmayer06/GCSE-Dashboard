import { createClient } from '@supabase/supabase-js';

function configured(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function supabaseConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || '').trim();
  const secretKey = String(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const publishableKey = String(
    env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || '',
  ).trim();
  return {
    url,
    secretKey,
    publishableKey,
    oauthProvider: String(env.SUPABASE_OAUTH_PROVIDER || '').trim(),
  };
}

export function requireSupabaseConfig(env = process.env) {
  const config = supabaseConfig(env);
  if (!configured(config.url) || !configured(config.secretKey) || !configured(config.publishableKey)) {
    const error = new Error(
      'Supabase storage requires SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY), and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY).',
    );
    error.code = 'SUPABASE_CONFIGURATION_ERROR';
    throw error;
  }
  return config;
}

export function createSupabaseServiceClient(config) {
  return createClient(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseAuthClient(config) {
  return createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function supabaseStorageError(error, fallback = 'Supabase request failed') {
  const wrapped = new Error(error?.message || fallback);
  wrapped.name = 'StorageError';
  wrapped.code = error?.code || error?.name || 'SUPABASE_ERROR';
  wrapped.status = error?.status;
  wrapped.cause = error;
  if (error?.code === '23505' || error?.status === 409) {
    wrapped.code = 'STORAGE_CONFLICT';
  }
  return wrapped;
}
