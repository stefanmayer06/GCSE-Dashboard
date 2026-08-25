import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { authRoutes, requireAuth } from './auth.js';
import mathsRouter from './subjects/maths/router.js';
import englishRouter from './subjects/english/router.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');
const selector = path.join(root, 'selector');
const publicDir = path.join(root, 'public');

const publicSubjectHealth = new Set([
  '/api/maths/health',
  '/api/maths-higher/health',
  '/api/english/health',
]);

function requestPath(req) {
  return (req.originalUrl || req.url || '').split('?')[0];
}

function isApiRequest(req) {
  const pathname = requestPath(req);
  return pathname === '/api' || pathname.startsWith('/api/');
}

function subjectGate(req, res, next) {
  const pathname = requestPath(req).replace(/\/+$/, '') || '/';
  if (publicSubjectHealth.has(pathname)) return next();

  try {
    return Promise.resolve(requireAuth(req, res, next)).catch(next);
  } catch (error) {
    return next(error);
  }
}

function availableDist(...candidates) {
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'index.html'))) || null;
}

function mountSubject(app, subject, dist) {
  if (!dist) return;
  app.use((req, res, next) => {
    if (req.path === `/${subject}/`) return res.sendFile(path.join(dist, 'index.html'));
    return next();
  });
  app.use(`/${subject}`, express.static(dist));
  app.get(`/${subject}/*`, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

function errorStatus(error) {
  const status = Number(error?.status || error?.statusCode);
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}

function publicErrorMessage(error, status) {
  if (status === 400 && error?.type === 'entity.parse.failed') return 'Invalid JSON request body';
  if (status === 413) return 'Request body too large';
  if (status >= 400 && status < 500) return 'Invalid request';
  return 'Internal server error';
}

function logRequestError(req, error) {
  const rawCode = typeof error?.code === 'string' ? error.code : error?.name;
  const code = typeof rawCode === 'string' && /^[A-Za-z0-9_-]+$/.test(rawCode) ? rawCode : 'Error';
  console.error(`[server] ${req.method} ${requestPath(req)} failed (${code})`);
}

export function createApp({ serveStatic = true } = {}) {
  const app = express();
  app.disable('x-powered-by');

  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '2mb' }));

  app.use('/api/auth', authRoutes());

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, subjects: ['maths', 'maths-higher', 'english'] });
  });

  app.use('/api/maths', subjectGate, mathsRouter);
  app.use('/api/maths-higher', subjectGate, mathsRouter);
  app.use('/api/english', subjectGate, englishRouter);

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  if (serveStatic) {
    const mathsDist = availableDist(
      path.join(root, 'clients', 'maths', 'dist'),
      path.join(publicDir, 'maths'),
    );
    const mathsHigherDist = availableDist(
      path.join(root, 'clients', 'maths', 'dist-higher'),
      path.join(publicDir, 'maths-higher'),
    ) || mathsDist;
    const englishDist = availableDist(
      path.join(root, 'clients', 'english', 'dist'),
      path.join(publicDir, 'english'),
    );

    mountSubject(app, 'maths', mathsDist);
    mountSubject(app, 'maths-higher', mathsHigherDist);
    mountSubject(app, 'english', englishDist);

    app.use(express.static(selector));
    app.get('/', (req, res) => res.sendFile(path.join(selector, 'index.html')));
    app.get('/subjects', (req, res) => res.sendFile(path.join(selector, 'subjects.html')));
  }

  app.use((req, res) => {
    if (serveStatic) return res.status(404).sendFile(path.join(selector, 'index.html'));
    return res.status(404).send('Not found');
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    logRequestError(req, error);
    if (isApiRequest(req)) {
      const status = errorStatus(error);
      return res.status(status).json({ error: publicErrorMessage(error, status) });
    }
    return res.status(500).send('Internal server error');
  });

  return app;
}

export default createApp;
