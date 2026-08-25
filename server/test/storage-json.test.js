import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createJsonStorage } from '../src/storage/json.js';

async function temporaryStorage(t) {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'gcse-storage-'));
  t.after(() => rm(dataDir, { recursive: true, force: true }));
  return { dataDir, storage: createJsonStorage({ dataDir }) };
}

test('JSON storage preserves legacy users/progress and hashes legacy session keys', async (t) => {
  const { dataDir, storage } = await temporaryStorage(t);
  const username = 'legacy-user';
  const userId = Buffer.from(username).toString('base64url');
  const password = '0123456789abcdef:abcdef0123456789';
  const rawToken = '0123456789abcdef0123456789abcdef0123456789abcdef';
  const expiresAt = Date.now() + 60_000;

  await mkdir(path.join(dataDir, 'users', userId), { recursive: true });
  await writeFile(path.join(dataDir, 'users.json'), JSON.stringify({
    [username]: { username, password, oauth: false, createdAt: '2025-01-01T00:00:00.000Z' },
  }));
  await writeFile(path.join(dataDir, 'sessions.json'), JSON.stringify({
    [rawToken]: { username, exp: expiresAt },
  }));
  await writeFile(
    path.join(dataDir, 'users', userId, 'maths.json'),
    JSON.stringify({ xp: 42, history: [] }),
  );

  await storage.init();

  const user = await storage.getUserByUsername(username);
  assert.equal(user.id, userId);
  assert.equal(user.password, password);
  assert.deepEqual(await storage.getProgress(userId, 'maths'), { xp: 42, history: [] });

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const session = await storage.getAuthSession(tokenHash);
  assert.equal(session.userId, userId);
  assert.equal(session.username, username);

  const persistedSessions = JSON.parse(await readFile(path.join(dataDir, 'sessions.json'), 'utf8'));
  assert.equal(persistedSessions[rawToken], undefined);
  assert.ok(persistedSessions[tokenHash]);
});

test('JSON progress mutations serialize and OAuth state consumption is atomic', async (t) => {
  const { storage } = await temporaryStorage(t);
  await storage.init();
  assert.equal(await storage.importProgressIfAbsent('user-a', 'english', { count: 0 }), true);
  assert.equal(await storage.importProgressIfAbsent('user-a', 'english', { count: 100 }), false);

  const values = await Promise.all(Array.from({ length: 20 }, () => (
    storage.mutateProgress('user-a', 'english', async (state) => {
      await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 3)));
      state.count += 1;
      return { state, value: state.count };
    })
  )));

  assert.deepEqual(values, Array.from({ length: 20 }, (_, index) => index + 1));
  assert.deepEqual(await storage.getProgress('user-a', 'english'), { count: 20 });

  await storage.putOAuthState({
    stateHash: 'oauth-state-hash',
    payload: { next: '/maths' },
    expiresAt: new Date(Date.now() + 60_000),
  });
  const consumed = await Promise.all([
    storage.consumeOAuthState('oauth-state-hash'),
    storage.consumeOAuthState('oauth-state-hash'),
  ]);
  assert.equal(consumed.filter(Boolean).length, 1);
  assert.deepEqual(consumed.find(Boolean).payload, { next: '/maths' });
});

test('JSON study sessions prevent duplicate claims and finalize exactly once', async (t) => {
  const { dataDir, storage } = await temporaryStorage(t);
  const criteria = { id: 'paper-1', userId: 'user-a', subject: 'maths', kind: 'paper' };
  const expiresAt = new Date(Date.now() + 60_000);

  const created = await storage.createStudySession({
    ...criteria,
    payload: { answers: [] },
    expiresAt,
  });
  assert.equal(created.status, 'created');

  const updated = await storage.updateStudySession(criteria, (session) => ({
    payload: { ...session.payload, answers: [{ qid: 'q1', value: '4' }] },
    value: 'saved',
  }));
  assert.equal(updated.status, 'updated');
  assert.equal(updated.value, 'saved');

  const leaseUntil = new Date(Date.now() + 30_000);
  const claims = await Promise.all([
    storage.claimStudySession({ ...criteria, leaseUntil }),
    storage.claimStudySession({ ...criteria, leaseUntil }),
  ]);
  assert.deepEqual(claims.map(({ status }) => status), ['claimed', 'busy']);
  assert.equal((await storage.releaseStudySession(criteria)).status, 'released');
  assert.equal((await storage.claimStudySession({ ...criteria, leaseUntil })).status, 'claimed');

  await storage.importProgressIfAbsent('user-a', 'maths', { xp: 2 });
  let finalizeCalls = 0;
  const finalized = await storage.finalizeStudySession(criteria, (session, progress) => {
    finalizeCalls += 1;
    assert.equal(session.payload.answers[0].qid, 'q1');
    return {
      state: { ...progress, xp: progress.xp + 8 },
      response: { score: 4, total: 5 },
    };
  });
  assert.equal(finalized.status, 'completed');
  assert.equal(finalized.replayed, false);
  assert.deepEqual(finalized.result, { score: 4, total: 5 });

  const replay = await storage.finalizeStudySession(criteria, () => {
    finalizeCalls += 1;
    throw new Error('completed sessions must not run finalizers again');
  });
  assert.equal(replay.status, 'completed');
  assert.equal(replay.replayed, true);
  assert.deepEqual(replay.result, finalized.result);
  assert.equal(finalizeCalls, 1);
  assert.deepEqual(await storage.getProgress('user-a', 'maths'), { xp: 10 });

  await storage.close();
  const reopened = createJsonStorage({ dataDir });
  await reopened.init();
  assert.deepEqual((await reopened.getStudySession(criteria)).result, finalized.result);
  assert.deepEqual(await reopened.getProgress('user-a', 'maths'), { xp: 10 });
  await reopened.close();
});
