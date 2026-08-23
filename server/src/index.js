import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import mathsRouter from './subjects/maths/router.js';
import englishRouter from './subjects/english/router.js';
import { authRoutes, initAuth, requireAuth, oauthConfigured } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');
const selector = path.join(root, 'selector');
const mathsDist = path.join(root, 'clients', 'maths', 'dist');
const englishDist = path.join(root, 'clients', 'english', 'dist');
const PORT = Number(process.env.PORT) || 3000;

initAuth();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, subjects: ['maths', 'english'] });
});

// Subject data requires a session; health endpoints stay public so the
// selector can show live availability before anyone signs in.
const gate = (req, res, next) => {
  const pathname = (req.originalUrl || req.url || '').split('?')[0];
  if (pathname === '/api/maths/health' || pathname === '/api/english/health') return next();
  requireAuth(req, res, next);
};

app.use('/api/maths', gate, mathsRouter);
app.use('/api/english', gate, englishRouter);

function mountSubject(subject, dist) {
  if (!fs.existsSync(dist)) return;
  app.use((req, res, next) => {
    if (req.path === `/${subject}/`) return res.sendFile(path.join(dist, 'index.html'));
    next();
  });
  app.use(`/${subject}`, express.static(dist));
  app.get(`/${subject}/*`, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

mountSubject('maths', mathsDist);
mountSubject('english', englishDist);

app.use(express.static(selector));
app.get('/', (req, res) => res.sendFile(path.join(selector, 'index.html')));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found' });
  res.status(404).sendFile(path.join(selector, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[server] GCSE Study Desk on http://localhost:${PORT}`);
  console.log('[subjects] MathsMate at /maths/ · EnglishMate at /english/');
  console.log(`[auth] login ready · OAuth ${oauthConfigured() ? 'configured' : 'not configured (password login only)'}`);
});