import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import express from 'express';

import storage from './storage/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', 'data'));
const SESSION_COOKIE = 'gcse_session';
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;
const OAUTH_STATE_TTL = 10 * 60 * 1000;
const DEFAULT_OAUTH_FETCH_TIMEOUT = 10_000;
const MAX_OAUTH_FETCH_TIMEOUT = 15_000;
const USERNAME_PATTERN = /^[a-z0-9_.-]{3,32}$/;
const scrypt = promisify(crypto.scrypt);

const oauthCfg = {
  clientId: process.env.OAUTH_CLIENT_ID || '',
  clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
  authorizeUrl: process.env.OAUTH_AUTHORIZE_URL || '',
  tokenUrl: process.env.OAUTH_TOKEN_URL || '',
  userinfoUrl: process.env.OAUTH_USERINFO_URL || '',
  scope: process.env.OAUTH_SCOPE || 'openid profile email',
  provider: process.env.OAUTH_PROVIDER_NAME || 'OAuth',
};

export function oauthConfigured() {
  return Boolean(
    oauthCfg.clientId
      && oauthCfg.clientSecret
      && oauthCfg.authorizeUrl
      && oauthCfg.tokenUrl
      && oauthCfg.userinfoUrl,
  );
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(String(password), salt, 32);
  return `${salt}:${Buffer.from(hash).toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const parts = String(stored || '').split(':');
  if (parts.length !== 2 || !parts[0] || !/^[a-f0-9]{64}$/i.test(parts[1])) return false;

  try {
    const expected = Buffer.from(parts[1], 'hex');
    const actual = Buffer.from(await scrypt(String(password), parts[0], expected.length));
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function storedTokenHash(value) {
  const secret = String(process.env.SESSION_SECRET || '');
  if (!secret) return sha256(value);
  return crypto.createHmac('sha256', secret).update(String(value)).digest('hex');
}

function validateAuthConfiguration() {
  const protectedDeployment = Boolean(process.env.VERCEL)
    || (process.env.NODE_ENV === 'production' && storage.driver === 'postgres');
  if (protectedDeployment && !configuredAppUrl()) {
    throw new Error('Auth configuration error: APP_URL is required on the production deployment.');
  }
  if (protectedDeployment && String(process.env.SESSION_SECRET || '').length < 32) {
    throw new Error(
      'Auth configuration error: SESSION_SECRET must be at least 32 characters on Vercel.',
    );
  }
}

export function userIdFor(username) {
  return Buffer.from(String(username), 'utf8').toString('base64url');
}

function adminPasswordForSeed() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const protectedDeployment = Boolean(process.env.VERCEL)
    || (process.env.NODE_ENV === 'production' && storage.driver === 'postgres');
  if (protectedDeployment) {
    throw new Error(
      'Auth configuration error: ADMIN_PASSWORD is required to seed a missing admin account.',
    );
  }
  return 'admin';
}

async function seedAdmin() {
  let admin = await storage.getUserByUsername('admin');
  if (admin) return admin;

  const password = adminPasswordForSeed();
  try {
    admin = await storage.createUser({
      username: 'admin',
      password: await hashPassword(password),
      oauth: false,
      createdAt: new Date().toISOString(),
    });
    console.log('[auth] admin account seeded');
    return admin;
  } catch (error) {
    if (error?.code !== 'STORAGE_CONFLICT') throw error;
    admin = await storage.getUserByUsername('admin');
    if (!admin) throw error;
    return admin;
  }
}

async function migrateLegacyProgress(admin, subject) {
  const legacyFile = path.join(ROOT_DATA_DIR, subject, 'db.json');
  let source;
  try {
    source = await readFile(legacyFile, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn(`[auth] legacy ${subject} migration skipped: progress file is unreadable`);
    }
    return;
  }

  let state;
  try {
    state = JSON.parse(source);
  } catch {
    console.warn(`[auth] legacy ${subject} migration skipped: progress file is invalid JSON`);
    return;
  }

  const imported = await storage.importProgressIfAbsent(admin.id, subject, state);
  if (imported) console.log(`[auth] migrated legacy ${subject} data to admin account`);
}

let authInitPromise = null;

async function initializeAuth() {
  validateAuthConfiguration();
  await storage.init();
  const admin = await seedAdmin();
  if (storage.driver === 'json') {
    await migrateLegacyProgress(admin, 'maths');
    await migrateLegacyProgress(admin, 'english');
  }
}

export async function initAuth() {
  if (!authInitPromise) authInitPromise = initializeAuth();
  try {
    await authInitPromise;
  } catch (error) {
    authInitPromise = null;
    throw error;
  }
}

function parseCookies(header = '') {
  const cookies = {};
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 1) continue;
    const name = part.slice(0, separator).trim();
    try {
      cookies[name] = decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      cookies[name] = '';
    }
  }
  return cookies;
}

function sessionTokenFrom(req) {
  return parseCookies(req.headers.cookie || '')[SESSION_COOKIE] || null;
}

async function requestUser(req) {
  await initAuth();
  const token = sessionTokenFrom(req);
  if (!token) return null;
  const session = await storage.getAuthSession(storedTokenHash(token));
  if (!session) return null;
  return storage.getUserById(session.userId);
}

export async function sessionUser(req) {
  const user = await requestUser(req);
  return user?.username || null;
}

export async function requireAuth(req, res, next) {
  try {
    const user = await requestUser(req);
    if (!user) return res.status(401).json({ error: 'authentication required' });
    req.user = { id: user.id, username: user.username, oauth: Boolean(user.oauth) };
    return next();
  } catch (error) {
    return next(error);
  }
}

async function issueSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  const createdAt = new Date();
  await storage.putAuthSession({
    tokenHash: storedTokenHash(token),
    userId,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + SESSION_TTL).toISOString(),
  });
  return token;
}

function secureCookies() {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

function sessionCookie(value, maxAge) {
  const parts = [
    `${SESSION_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secureCookies()) parts.push('Secure');
  return parts.join('; ');
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', sessionCookie(token, SESSION_TTL / 1000));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', sessionCookie('', 0));
}

function configuredAppUrl() {
  const configured = String(process.env.APP_URL || '').trim();
  if (!configured) return null;
  const normalized = configured.replace(/\/+$/, '');
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('Auth configuration error: APP_URL must be an absolute HTTP(S) URL.');
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol)
    || parsed.username
    || parsed.password
    || parsed.search
    || parsed.hash
  ) {
    throw new Error('Auth configuration error: APP_URL must be an absolute HTTP(S) URL.');
  }
  return normalized;
}

function oauthRedirectUri(req) {
  const appUrl = configuredAppUrl();
  if (appUrl) return `${appUrl}/api/auth/oauth/callback`;

  const host = req.get('host');
  if (!host) throw new Error('Unable to determine the OAuth callback URL.');
  const protocol = process.env.VERCEL || req.protocol === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/api/auth/oauth/callback`;
}

function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (/[\u0000-\u001f\u007f]/.test(value)) return '/';
  try {
    const target = new URL(value, 'https://gcse-study-desk.invalid');
    if (target.origin !== 'https://gcse-study-desk.invalid') return '/';
  } catch {
    return '/';
  }
  return value;
}

function oauthFetchTimeout() {
  const configured = Number(
    process.env.OAUTH_FETCH_TIMEOUT_MS ?? process.env.OAUTH_TIMEOUT_MS,
  );
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_OAUTH_FETCH_TIMEOUT;
  return Math.min(Math.max(1, Math.trunc(configured)), MAX_OAUTH_FETCH_TIMEOUT);
}

function fetchTimeout() {
  const timeout = oauthFetchTimeout();
  if (typeof globalThis.AbortSignal?.timeout === 'function') {
    return { signal: globalThis.AbortSignal.timeout(timeout), clear: () => {} };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  timer.unref?.();
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

class OAuthRequestError extends Error {}

async function fetchOAuthJson(url, options) {
  const timeout = fetchTimeout();
  try {
    const response = await fetch(url, { ...options, signal: timeout.signal });
    if (!response.ok) throw new OAuthRequestError();
    const data = await response.json().catch(() => null);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new OAuthRequestError();
    }
    return data;
  } catch (error) {
    if (error instanceof OAuthRequestError) throw error;
    throw new OAuthRequestError();
  } finally {
    timeout.clear();
  }
}

function sanitizeOAuthUsername(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  let username = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '');
  if (!username) return null;
  if (username.length < 3) username = `user-${username}`;
  username = username.slice(0, 32).replace(/[._-]+$/g, '');
  return USERNAME_PATTERN.test(username) ? username : null;
}

function oauthUsernameBase(info) {
  for (const value of [info.preferred_username, info.email, info.name]) {
    const username = sanitizeOAuthUsername(value);
    if (username) return username;
  }
  return 'oauth-user';
}

function oauthUsernameCandidate(base, identity, attempt) {
  if (attempt === 0) return base;
  const suffix = sha256(attempt === 1 ? identity : `${identity}\0${attempt}`).slice(0, 10);
  const prefix = base.slice(0, 21).replace(/[._-]+$/g, '') || 'oauth';
  return `${prefix}-${suffix}`;
}

async function oauthUser(info) {
  const subject = typeof info.sub === 'string' ? info.sub : '';
  if (!subject.trim()) throw new OAuthRequestError();

  const provider = oauthCfg.provider;
  const existing = await storage.getUserByOAuthIdentity(provider, subject);
  if (existing) return existing;

  const identity = `${provider}\0${subject}`;
  const base = oauthUsernameBase(info);
  const password = await hashPassword(crypto.randomBytes(24).toString('hex'));
  const createdAt = new Date().toISOString();

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const username = oauthUsernameCandidate(base, identity, attempt);
    try {
      return await storage.createUser({
        username,
        password,
        oauth: true,
        provider,
        oauthIdentity: { provider, subject },
        createdAt,
      });
    } catch (error) {
      if (error?.code !== 'STORAGE_CONFLICT') throw error;
      const racedUser = await storage.getUserByOAuthIdentity(provider, subject);
      if (racedUser) return racedUser;
      if (error.field === 'oauthIdentity') throw error;
    }
  }

  throw new Error('Unable to create a unique OAuth username.');
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
  };
}

export function authRoutes() {
  const router = express.Router();

  router.use(asyncRoute(async (req, res, next) => {
    await initAuth();
    next();
  }));

  router.get('/config', (req, res) => {
    res.json({ oauth: oauthConfigured(), provider: oauthCfg.provider });
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json({
      user: { username: req.user.username },
      oauth: req.user.oauth,
    });
  });

  router.post('/login', asyncRoute(async (req, res) => {
    const { username = '', password = '' } = req.body || {};
    const name = String(username).trim().toLowerCase();
    const user = await storage.getUserByUsername(name);
    const validPassword = user
      && !user.oauth
      && await verifyPassword(password, user.password ?? user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    setSessionCookie(res, await issueSession(user.id));
    return res.json({ user: { username: user.username } });
  }));

  router.post('/signup', asyncRoute(async (req, res) => {
    const { username = '', password = '' } = req.body || {};
    const name = String(username).trim().toLowerCase();
    const passwordValue = String(password);
    if (!USERNAME_PATTERN.test(name)) {
      return res.status(400).json({
        error: 'Usernames must be 3-32 characters and may only use letters, numbers, dots, dashes and underscores.',
      });
    }
    if (passwordValue.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    let user;
    try {
      user = await storage.createUser({
        username: name,
        password: await hashPassword(passwordValue),
        oauth: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error?.code === 'STORAGE_CONFLICT') {
        // PostgreSQL may report the deterministic user ID constraint before username.
        const existing = await storage.getUserByUsername(name);
        if (existing) return res.status(409).json({ error: 'That username is already taken.' });
      }
      throw error;
    }

    setSessionCookie(res, await issueSession(user.id));
    return res.status(201).json({ user: { username: user.username } });
  }));

  router.post('/logout', requireAuth, asyncRoute(async (req, res) => {
    const token = sessionTokenFrom(req);
    if (token) await storage.deleteAuthSession(storedTokenHash(token));
    clearSessionCookie(res);
    return res.json({ ok: true });
  }));

  router.get('/oauth', asyncRoute(async (req, res) => {
    if (!oauthConfigured()) return res.status(404).json({ error: 'OAuth is not configured' });

    const state = crypto.randomBytes(24).toString('base64url');
    const redirectUri = oauthRedirectUri(req);
    const now = Date.now();
    await storage.putOAuthState({
      stateHash: storedTokenHash(state),
      payload: { next: safeNext(req.query.next), redirectUri },
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + OAUTH_STATE_TTL).toISOString(),
    });

    const authorizeUrl = new URL(oauthCfg.authorizeUrl);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', oauthCfg.clientId);
    authorizeUrl.searchParams.set('scope', oauthCfg.scope);
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    return res.redirect(authorizeUrl.toString());
  }));

  router.get('/oauth/callback', asyncRoute(async (req, res) => {
    if (!oauthConfigured()) return res.status(404).json({ error: 'OAuth is not configured' });

    const rawState = typeof req.query.state === 'string' ? req.query.state : '';
    const storedState = rawState
      ? await storage.consumeOAuthState(storedTokenHash(rawState))
      : null;
    if (!storedState) return res.status(400).send('Invalid OAuth state. Please try again.');
    if (req.query.error) return res.status(400).send('Sign-in was cancelled.');

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) return res.status(400).send('Missing OAuth authorisation code.');

    const redirectUri = typeof storedState.payload?.redirectUri === 'string'
      ? storedState.payload.redirectUri
      : oauthRedirectUri(req);
    let tokenData;
    try {
      tokenData = await fetchOAuthJson(oauthCfg.tokenUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: oauthCfg.clientId,
          client_secret: oauthCfg.clientSecret,
        }).toString(),
      });
    } catch {
      return res.status(502).send('OAuth token exchange failed.');
    }

    if (typeof tokenData.access_token !== 'string' || !tokenData.access_token) {
      return res.status(502).send('OAuth token exchange failed.');
    }

    let info;
    try {
      info = await fetchOAuthJson(oauthCfg.userinfoUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
    } catch {
      return res.status(502).send('OAuth sign-in failed.');
    }

    let user;
    try {
      user = await oauthUser(info);
    } catch (error) {
      if (error instanceof OAuthRequestError) {
        return res.status(502).send('OAuth sign-in failed.');
      }
      throw error;
    }

    setSessionCookie(res, await issueSession(user.id));
    return res.redirect(safeNext(storedState.payload?.next));
  }));

  return router;
}
