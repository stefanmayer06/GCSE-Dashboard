import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { createStorage } from '../src/storage/index.js';

test('storage selection keeps JSON local and rejects non-Supabase Vercel storage', () => {
  assert.equal(createStorage({ driver: 'json', dataDir: '/tmp/gcse-storage-selection' }).driver, 'json');

  const child = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', "import './server/src/storage/index.js'"],
    { cwd: new URL('../..', import.meta.url), env: { ...process.env, VERCEL: '1' }, encoding: 'utf8' },
  );
  assert.notEqual(child.status, 0);
  assert.match(child.stderr, /Vercel requires Supabase storage/);
});
