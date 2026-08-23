import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(ROOT_DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(ROOT_DATA_DIR, 'sessions.json');
const SESSION_COOKIE = 'gcse_session';
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

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
    oauthCfg.clientId &&
      oauthCfg.clientSecret &&
      oauthCfg.authorizeUrl &&
      oauthCfg.tokenUrl &&
      oauthCfg.userinfoUrl,
  );
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}

let users = readJson(USERS_FILE, {});
let sessions = readJson(SESSIONS_FILE, {});

function writeUsers() {
  writeJson(USERS_FILE, users);
}

function writeSessions() {
  writeJson(SESSIONS_FILE, sessions);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  try {
    const check = crypto.scryptSync(password, salt, 32).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(check, 'hex'));
  } catch {
    return false;
  }
}

export function userIdFor(username) {
  return Buffer.from(String(username), 'utf8').toString('base64url');
}

export function initAuth() {
  fs.mkdirSync(ROOT_DATA_DIR, { recursive: true });

  if (!users.admin) {
    users.admin = {
      username: 'admin',
      password: hashPassword('admin'),
      oauth: false,
      createdAt: new Date().toISOString(),
    };
    writeUsers();
    console.log('[auth] admin account seeded (admin / admin)');
  }

  const now = Date.now();
  let changed = false;
  for (const [token, s] of Object.entries(sessions)) {
    if (s.exp < now) {
      delete sessions[token];
      changed = true;
    }
  }
  if (changed) writeSessions();

  migrateLegacyData('maths');
  migrateLegacyData('english');
}

/**
 * Move the pre-login single-file progress into the default admin account
 * so no progress is lost when upgrading to user accounts.
 */
function migrateLegacyData(subject) {
  const legacy = path.join(ROOT_DATA_DIR, subject, 'db.json');
  const target = path.join(ROOT_DATA_DIR, 'users', userIdFor('admin'), `${subject}.json`);
  if (!fs.existsSync(legacy) || fs.existsSync(target)) return;
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(legacy, target);
    console.log(`[auth] migrated legacy ${subject} data to admin account`);
  } catch (e) {
    console.log(`[auth] legacy ${subject} migration failed:`, e.message);
  }
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function sessionTokenFrom(req) {
  return parseCookies(req.headers.cookie || '')[SESSION_COOKIE] || null;
}

export function sessionUser(req) {
  const token = sessionTokenFrom(req);
  if (!token) return null;
  const s = sessions[token];
  if (!s) return null;
  if (s.exp < Date.now()) {
    delete sessions[token];
    writeSessions();
    return null;
  }
  return s.username;
}

export function requireAuth(req, res, next) {
  const username = sessionUser(req);
  const user = username ? users[username] : null;
  if (!user) return res.status(401).json({ error: 'authentication required' });
  req.user = { username: user.username, id: userIdFor(user.username) };
  next();
}

function issueSession(username) {
  const token = crypto.randomBytes(24).toString('hex');
  sessions[token] = { username, exp: Date.now() + SESSION_TTL };
  writeSessions();
  return token;
}

function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL / 1000}`,
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function oauthRedirectUri(req) {
  return `${req.protocol}://${req.get('host')}/api/auth/oauth/callback`;
}

const oauthStates = new Map();

export function authRoutes() {
  const router = express.Router();

  router.get('/config', (req, res) => {
    res.json({ oauth: oauthConfigured(), provider: oauthCfg.provider });
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json({
      user: { username: req.user.username },
      oauth: !!users[req.user.username]?.oauth,
    });
  });

  router.post('/login', (req, res) => {
    const { username = '', password = '' } = req.body || {};
    const user = users[username];
    if (!user || user.oauth || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    setSessionCookie(res, issueSession(user.username));
    res.json({ user: { username: user.username } });
  });

  router.post('/signup', (req, res) => {
    const { username = '', password = '' } = req.body || {};
    const name = String(username).trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,32}$/.test(name)) {
      return res.status(400).json({
        error: 'Usernames must be 3-32 characters and may only use letters, numbers, dots, dashes and underscores.',
      });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (users[name]) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }
    users[name] = {
      username: name,
      password: hashPassword(password),
      oauth: false,
      createdAt: new Date().toISOString(),
    };
    writeUsers();
    setSessionCookie(res, issueSession(name));
    res.status(201).json({ user: { username: name } });
  });

  router.post('/logout', requireAuth, (req, res) => {
    const token = sessionTokenFrom(req);
    if (token && sessions[token]) {
      delete sessions[token];
      writeSessions();
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  router.get('/oauth', (req, res) => {
    if (!oauthConfigured()) return res.status(404).json({ error: 'OAuth is not configured' });
    const state = crypto.randomBytes(16).toString('hex');
    const next = typeof req.query.next === 'string' && req.query.next.startsWith('/') ? req.query.next : '/';
    oauthStates.set(state, next);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: oauthCfg.clientId,
      scope: oauthCfg.scope,
      state,
      redirect_uri: oauthRedirectUri(req),
    });
    res.redirect(`${oauthCfg.authorizeUrl}?${params}`);
  });

  router.get('/oauth/callback', async (req, res) => {
    if (!oauthConfigured()) return res.status(404).json({ error: 'OAuth is not configured' });
    const next = oauthStates.get(req.query.state);
    oauthStates.delete(req.query.state);
    if (!next) return res.status(400).send('Invalid OAuth state. Please try again.');
    if (req.query.error) return res.status(400).send('Sign-in was cancelled.');
    if (!req.query.code) return res.status(400).send('Missing OAuth authorisation code.');

    try {
      const tokenRes = await fetch(oauthCfg.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: req.query.code,
          redirect_uri: oauthRedirectUri(req),
          client_id: oauthCfg.clientId,
          client_secret: oauthCfg.clientSecret,
        }).toString(),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        return res.status(502).send('OAuth token exchange failed.');
      }

      const infoRes = await fetch(oauthCfg.userinfoUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const info = await infoRes.json();
      const username = String(info.preferred_username || info.email || info.sub || 'oauth-user').toLowerCase();
      if (!users[username]) {
        users[username] = {
          username,
          password: hashPassword(crypto.randomBytes(16).toString('hex')),
          oauth: true,
          provider: oauthCfg.provider,
          createdAt: new Date().toISOString(),
        };
        writeUsers();
      }
      setSessionCookie(res, issueSession(username));
      res.redirect(next);
    } catch {
      res.status(502).send('OAuth sign-in failed.');
    }
  });

  return router;
}