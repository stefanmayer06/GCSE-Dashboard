import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

async function close(server) {
  if (!server.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('Vercel entrypoint retries after transient initialization failures', async (t) => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'gcse-vercel-entrypoint-'));
  const dataDir = path.join(tempDir, 'data');
  const originalEnv = { ...process.env };

  t.after(async () => {
    process.env = originalEnv;
    await rm(tempDir, { recursive: true, force: true });
  });

  Object.assign(process.env, {
    DATA_DIR: dataDir,
    NODE_ENV: 'test',
    STORAGE_DRIVER: 'json',
  });
  delete process.env.VERCEL;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.SESSION_SECRET;

  await writeFile(dataDir, 'temporarily unavailable');

  const handler = require('../../api/index.js');
  const server = http.createServer(handler);
  const appUrl = await listen(server);
  t.after(() => close(server));

  let response = await fetch(`${appUrl}/api/auth/config`);
  assert.equal(response.status, 503);

  await rm(dataDir);

  response = await fetch(`${appUrl}/api/auth/config`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { oauth: false, provider: 'OAuth' });
});
