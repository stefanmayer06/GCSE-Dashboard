import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import express from 'express';

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function close(server) {
  if (!server.listening) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('auth uses durable hashed records and stable OAuth identities', async (t) => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'gcse-auth-'));
  const originalEnv = { ...process.env };
  t.after(async () => {
    process.env = originalEnv;
    await rm(dataDir, { recursive: true, force: true });
  });

  let profile = {
    sub: 'stable-subject',
    preferred_username: 'collision-user',
    email: 'first@example.test',
  };
  let malformedTokenResponse = false;
  const tokenBodies = [];
  const userinfoAuthHeaders = [];
  const providerServer = http.createServer(async (req, res) => {
    if (req.url === '/token') {
      let body = '';
      for await (const chunk of req) body += chunk;
      tokenBodies.push(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(malformedTokenResponse ? 'not-json' : JSON.stringify({ access_token: 'raw-access-token' }));
      return;
    }
    if (req.url === '/userinfo') {
      userinfoAuthHeaders.push(req.headers.authorization);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(profile));
      return;
    }
    res.writeHead(404).end();
  });
  const providerUrl = await listen(providerServer);
  t.after(() => close(providerServer));

  Object.assign(process.env, {
    DATA_DIR: dataDir,
    NODE_ENV: 'test',
    OAUTH_CLIENT_ID: 'test-client',
    OAUTH_CLIENT_SECRET: 'test-secret',
    OAUTH_AUTHORIZE_URL: `${providerUrl}/authorize`,
    OAUTH_TOKEN_URL: `${providerUrl}/token`,
    OAUTH_USERINFO_URL: `${providerUrl}/userinfo`,
    OAUTH_PROVIDER_NAME: 'Test Provider',
    APP_URL: 'https://study.example.test/',
  });
  delete process.env.VERCEL;
  delete process.env.STORAGE_DRIVER;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.SESSION_SECRET;

  const adminId = Buffer.from('admin').toString('base64url');
  await mkdir(path.join(dataDir, 'maths'), { recursive: true });
  await mkdir(path.join(dataDir, 'english'), { recursive: true });
  await mkdir(path.join(dataDir, 'users', adminId), { recursive: true });
  await writeFile(path.join(dataDir, 'maths', 'db.json'), JSON.stringify({ xp: 1 }));
  await writeFile(path.join(dataDir, 'english', 'db.json'), JSON.stringify({ xp: 2 }));
  await writeFile(path.join(dataDir, 'users', adminId, 'maths.json'), JSON.stringify({ xp: 99 }));

  const auth = await import(`../src/auth.js?test=${Date.now()}`);
  const { default: storage } = await import('../src/storage/index.js');
  await auth.initAuth();

  const admin = await storage.getUserByUsername('admin');
  assert.match(admin.password, /^[a-f0-9]{32}:[a-f0-9]{64}$/);
  assert.deepEqual(await storage.getProgress(admin.id, 'maths'), { xp: 99 });
  assert.deepEqual(await storage.getProgress(admin.id, 'english'), { xp: 2 });

  const app = express();
  app.use(express.json());
  app.use('/api/auth', auth.authRoutes());
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    return res.status(500).json({ error: 'test error' });
  });
  const appServer = http.createServer(app);
  const appUrl = await listen(appServer);
  t.after(() => close(appServer));

  let response = await fetch(`${appUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ADMIN', password: 'admin' }),
  });
  assert.equal(response.status, 200);
  const adminSetCookie = response.headers.get('set-cookie');
  assert.match(adminSetCookie, /HttpOnly; SameSite=Lax; Max-Age=2592000/);
  const adminCookie = adminSetCookie.split(';')[0];
  const adminToken = adminCookie.slice('gcse_session='.length);
  let sessions = JSON.parse(await readFile(path.join(dataDir, 'sessions.json'), 'utf8'));
  assert.equal(sessions[adminToken], undefined);
  assert.ok(sessions[hash(adminToken)]);
  assert.ok(Date.parse(sessions[hash(adminToken)].expiresAt) > Date.now());

  response = await fetch(`${appUrl}/api/auth/me`, { headers: { Cookie: adminCookie } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { user: { username: 'admin' }, oauth: false });

  const signup = () => fetch(`${appUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'collision-user', password: 'password-123' }),
  });
  const signupResponses = await Promise.all([signup(), signup()]);
  assert.deepEqual(signupResponses.map(({ status }) => status).sort(), [201, 409]);
  await Promise.all(signupResponses.map((signupResponse) => signupResponse.text()));

  response = await fetch(`${appUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: adminCookie },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  sessions = JSON.parse(await readFile(path.join(dataDir, 'sessions.json'), 'utf8'));
  assert.equal(sessions[hash(adminToken)], undefined);

  response = await fetch(
    `${appUrl}/api/auth/oauth?next=${encodeURIComponent('//outside.example/path')}`,
    { redirect: 'manual' },
  );
  assert.equal(response.status, 302);
  const authorizeUrl = new URL(response.headers.get('location'));
  const rawState = authorizeUrl.searchParams.get('state');
  assert.equal(
    authorizeUrl.searchParams.get('redirect_uri'),
    'https://study.example.test/api/auth/oauth/callback',
  );
  const oauthStates = JSON.parse(await readFile(path.join(dataDir, 'oauth-states.json'), 'utf8'));
  assert.equal(oauthStates[rawState], undefined);
  assert.equal(oauthStates[hash(rawState)].payload.next, '/');
  assert.ok(Date.parse(oauthStates[hash(rawState)].expiresAt) - Date.now() <= 10 * 60 * 1000);

  response = await fetch(
    `${appUrl}/api/auth/oauth/callback?state=${encodeURIComponent(rawState)}&code=first-code`,
    { redirect: 'manual' },
  );
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/');
  assert.equal(
    new URLSearchParams(tokenBodies[0]).get('redirect_uri'),
    'https://study.example.test/api/auth/oauth/callback',
  );
  assert.equal(userinfoAuthHeaders[0], 'Bearer raw-access-token');

  const identityHash = hash('Test Provider\0stable-subject').slice(0, 10);
  let oauthUsers = (await storage.listUsers()).filter((user) => user.oauth);
  assert.equal(oauthUsers.length, 1);
  assert.equal(oauthUsers[0].username, `collision-user-${identityHash}`);
  assert.deepEqual(oauthUsers[0].oauthIdentity, {
    provider: 'Test Provider',
    subject: 'stable-subject',
  });
  assert.doesNotMatch(
    await readFile(path.join(dataDir, 'users.json'), 'utf8'),
    /raw-access-token/,
  );

  response = await fetch(
    `${appUrl}/api/auth/oauth/callback?state=${encodeURIComponent(rawState)}&code=replay`,
    { redirect: 'manual' },
  );
  assert.equal(response.status, 400);

  profile = {
    sub: 'stable-subject',
    preferred_username: 'renamed-user',
    email: 'changed@example.test',
  };
  response = await fetch(
    `${appUrl}/api/auth/oauth?next=${encodeURIComponent('/english/learn?topic=writing')}`,
    { redirect: 'manual' },
  );
  const secondState = new URL(response.headers.get('location')).searchParams.get('state');
  process.env.NODE_ENV = 'production';
  response = await fetch(
    `${appUrl}/api/auth/oauth/callback?state=${encodeURIComponent(secondState)}&code=second-code`,
    { redirect: 'manual' },
  );
  process.env.NODE_ENV = 'test';
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), '/english/learn?topic=writing');
  assert.match(response.headers.get('set-cookie'), /; Secure$/);
  const oauthCookie = response.headers.get('set-cookie').split(';')[0];
  oauthUsers = (await storage.listUsers()).filter((user) => user.oauth);
  assert.equal(oauthUsers.length, 1);
  assert.equal(oauthUsers[0].username, `collision-user-${identityHash}`);

  response = await fetch(`${appUrl}/api/auth/me`, { headers: { Cookie: oauthCookie } });
  assert.deepEqual(await response.json(), {
    user: { username: `collision-user-${identityHash}` },
    oauth: true,
  });

  malformedTokenResponse = true;
  response = await fetch(`${appUrl}/api/auth/oauth`, { redirect: 'manual' });
  const malformedState = new URL(response.headers.get('location')).searchParams.get('state');
  response = await fetch(
    `${appUrl}/api/auth/oauth/callback?state=${encodeURIComponent(malformedState)}&code=bad-json`,
    { redirect: 'manual' },
  );
  assert.equal(response.status, 502);
  assert.equal(await response.text(), 'OAuth token exchange failed.');
});
