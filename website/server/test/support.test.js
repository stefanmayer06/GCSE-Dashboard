import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import express from 'express';

import { createJsonStorage } from '../src/storage/json.js';
import { supportRoutes } from '../src/support.js';

async function setup(t, options = {}) {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'gcse-support-'));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  const storage = createJsonStorage({ dataDir });
  const app = express().use(express.json()).use('/api/support', supportRoutes({ storage, ...options }));
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve) => {
    server.closeAllConnections();
    server.close(resolve);
  }));
  const url = `http://127.0.0.1:${server.address().port}/api/support`;
  return {
    dataDir,
    storage,
    post: (body, headers = {}) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  };
}

test('support route stores a private request without inventing a rating or account', async (t) => {
  const { dataDir, post } = await setup(t);
  const response = await post({ topic: 'content', message: 'The ratio question on Foundation Paper 2 is unclear.', email: 'parent@example.test' });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  const records = Object.values(JSON.parse(await readFile(path.join(dataDir, 'support-requests.json'), 'utf8')));
  assert.equal(records.length, 1);
  assert.equal(records[0].topic, 'content');
  assert.equal(records[0].email, 'parent@example.test');
  assert.equal(records[0].message, 'The ratio question on Foundation Paper 2 is unclear.');
  assert.equal('rating' in records[0], false);
  assert.equal('userId' in records[0], false);
});

test('support route requires reply email for privacy requests and rejects invalid content', async (t) => {
  const { dataDir, post } = await setup(t, { maxPerWindow: 20 });
  for (const body of [
    { topic: 'privacy', message: 'Please send my data.' },
    { topic: 'account', message: 'Help', email: 'not-an-email' },
    { topic: 'unknown', message: 'Help' },
    { topic: 'study', message: ' ' },
    { topic: 'study', message: 'x'.repeat(2001) },
  ]) {
    const response = await post(body);
    assert.equal(response.status, 400);
  }
  await assert.rejects(readFile(path.join(dataDir, 'support-requests.json'), 'utf8'));
});

test('support honeypot and rate limit protect the public write route', async (t) => {
  const { dataDir, post } = await setup(t, { maxPerWindow: 2 });
  const payload = { topic: 'account', message: 'Cannot sign in.' };
  const headers = { 'X-Forwarded-For': '203.0.113.7' };
  assert.equal((await post({ ...payload, website: 'spam.example' }, headers)).status, 201);
  await assert.rejects(readFile(path.join(dataDir, 'support-requests.json'), 'utf8'));
  assert.equal((await post(payload, headers)).status, 201);
  assert.equal((await post(payload, headers)).status, 201);
  assert.equal((await post(payload, headers)).status, 429);
});
