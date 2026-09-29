import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import express from 'express';

import { createJsonStorage } from '../src/storage/json.js';
import { feedbackRoutes } from '../src/feedback.js';

function validBody(overrides = {}) {
  return {
    role: 'student',
    subject: 'maths',
    rating: 4,
    message: 'The timed paper session is great but the review step feels abrupt.',
    ...overrides,
  };
}

async function temporaryStorage(t) {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'gcse-feedback-'));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  return { dataDir, storage: createJsonStorage({ dataDir }) };
}

async function listen(router) {
  const app = express()
    .use(express.json({ limit: '2mb' }))
    .use('/api/feedback', router);
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/api/feedback`;
  return {
    url,
    post: (body, headers = {}) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
    close: () => new Promise((resolve, reject) => {
      server.closeAllConnections();
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

test('feedback route stores valid submissions through the JSON driver', async (t) => {
  const { dataDir, storage } = await temporaryStorage(t);
  const routes = await listen(feedbackRoutes({ storage }));
  t.after(routes.close);

  const response = await routes.post(validBody({
    heard: 'Reddit r/GCSE',
    email: 'tester@example.test',
    source: 'reddit-r-gcse',
  }));

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });

  const saved = await readFile(path.join(dataDir, 'feedback.json'), 'utf8');
  const records = Object.values(JSON.parse(saved));
  assert.equal(records.length, 1);
  assert.equal(records[0].role, 'student');
  assert.equal(records[0].subject, 'maths');
  assert.equal(records[0].rating, 4);
  assert.equal(records[0].source, 'reddit-r-gcse');
  assert.equal(records[0].heard, 'Reddit r/GCSE');
  assert.equal(records[0].email, 'tester@example.test');
  assert.ok(records[0].id);
  assert.ok(records[0].createdAt);
});

test('feedback route stores optional design and pricing answers', async (t) => {
  const { dataDir, storage } = await temporaryStorage(t);
  const routes = await listen(feedbackRoutes({ storage }));
  t.after(routes.close);

  const response = await routes.post(validBody({
    role: 'parent',
    designRating: 3,
    designNote: '  The results page hides the retry button.  ',
    payer: 'parent',
    priceModel: 'season-pass',
    priceTooCheap: '1',
    priceBargain: '£4.50',
    priceExpensive: 9.999,
    priceTooExpensive: '',
  }));
  assert.equal(response.status, 201);

  const [record] = Object.values(JSON.parse(await readFile(path.join(dataDir, 'feedback.json'), 'utf8')));
  assert.equal(record.designRating, 3);
  assert.equal(record.designNote, 'The results page hides the retry button.');
  assert.equal(record.payer, 'parent');
  assert.equal(record.priceModel, 'season-pass');
  assert.equal(record.priceTooCheap, 1);
  assert.equal(record.priceBargain, 4.5);
  assert.equal(record.priceExpensive, 10);
  assert.equal(record.priceTooExpensive, null);

  const report = await storage.getFeedbackReport(90);
  assert.equal(report.responses, 1);
  assert.deepEqual(report.byRole, { parent: 1 });
  assert.equal(report.designRating.average, 3);
  assert.equal(JSON.stringify(report).includes('retry button'), false, 'the report never returns free text');
});

test('feedback without design or pricing answers stores nulls', async (t) => {
  const { dataDir, storage } = await temporaryStorage(t);
  const routes = await listen(feedbackRoutes({ storage }));
  t.after(routes.close);

  assert.equal((await routes.post(validBody({ payer: '', priceModel: '', designRating: null }))).status, 201);
  const [record] = Object.values(JSON.parse(await readFile(path.join(dataDir, 'feedback.json'), 'utf8')));
  for (const key of ['designRating', 'designNote', 'payer', 'priceModel', 'priceTooCheap', 'priceBargain', 'priceExpensive', 'priceTooExpensive']) {
    assert.equal(record[key], null, key);
  }
});

test('feedback route rejects invalid payloads without storing them', async (t) => {
  const { storage } = await temporaryStorage(t);
  const routes = await listen(feedbackRoutes({ storage, maxPerWindow: 50 }));
  t.after(routes.close);

  for (const body of [
    validBody({ role: 'bot' }),
    validBody({ subject: 'science' }),
    validBody({ rating: 9 }),
    validBody({ rating: 'excellent' }),
    validBody({ message: '   ' }),
    validBody({ designRating: 6 }),
    validBody({ payer: 'grandparent' }),
    validBody({ priceModel: 'lifetime' }),
    validBody({ priceBargain: -1 }),
    validBody({ priceExpensive: 'a lot' }),
    validBody({ priceTooExpensive: 250 }),
    {},
  ]) {
    const response = await routes.post(body);
    assert.equal(response.status, 400, `expected 400 for ${JSON.stringify(body)}`);
    const error = await response.json();
    assert.ok(typeof error.error === 'string' && error.error.length > 0);
  }
});

test('feedback route rate limits repeated submissions per client', async (t) => {
  const { storage } = await temporaryStorage(t);
  const routes = await listen(feedbackRoutes({ storage, maxPerWindow: 3 }));
  t.after(routes.close);

  const headers = { 'X-Forwarded-For': '203.0.113.7' };
  for (let i = 0; i < 3; i += 1) {
    const response = await routes.post(validBody({ message: `Attempt ${i + 1}` }), headers);
    assert.equal(response.status, 201);
  }
  const limited = await routes.post(validBody({ message: 'Attempt 4' }), headers);
  assert.equal(limited.status, 429);

  const otherClient = await routes.post(validBody({ message: 'Different client' }), {
    'X-Forwarded-For': '198.51.100.9',
  });
  assert.equal(otherClient.status, 201);
});

test('feedback honeypot pretends success without storing anything', async (t) => {
  const { dataDir, storage } = await temporaryStorage(t);
  const routes = await listen(feedbackRoutes({ storage }));
  t.after(routes.close);

  const response = await routes.post(validBody({ website: 'https://spam.example' }));
  assert.equal(response.status, 201);
  const stored = await readFile(path.join(dataDir, 'feedback.json'), 'utf8').catch(() => null);
  assert.equal(stored, null, 'no feedback.json should be written for honeypot submissions');
});
