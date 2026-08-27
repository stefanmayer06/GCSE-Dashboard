import assert from 'node:assert/strict';
import test from 'node:test';

import { requireSupabaseConfig, supabaseConfig } from '../src/supabase/client.js';

test('Supabase Auth requires a distinct public client key', () => {
  const env = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SECRET_KEY: 'secret' };
  assert.equal(supabaseConfig(env).publishableKey, '');
  assert.throws(() => requireSupabaseConfig(env), {
    code: 'SUPABASE_CONFIGURATION_ERROR',
  });
});

test('Supabase configuration keeps public and service credentials separate', () => {
  assert.deepEqual(requireSupabaseConfig({
    SUPABASE_URL: 'https://project.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'public',
    SUPABASE_SECRET_KEY: 'secret',
  }), {
    url: 'https://project.supabase.co',
    publishableKey: 'public',
    secretKey: 'secret',
    oauthProvider: '',
  });
});
