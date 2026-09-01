import express from 'express';
import {
  personalError,
  normalizeMistakeRows,
  normalizePlan,
  normalizePreferences,
  normalizeSubject,
} from './personal-model.js';

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

// Mistake-lifecycle events derived server-side from the notebook diff, so the
// activation/retention trail does not depend on client instrumentation.
function mistakeEvents(previous, next) {
  const before = new Map((Array.isArray(previous) ? previous : []).map((row) => [row.id, row]));
  const events = [];
  for (const row of Array.isArray(next) ? next : []) {
    const prior = before.get(row.id);
    if (!prior) events.push(['mistake_saved', { topicId: row.topicId }]);
    else {
      if ((row.reviewIndex ?? 0) > (prior.reviewIndex ?? 0)) {
        events.push(['mistake_retry', { reviewIndex: row.reviewIndex }]);
      }
      if (row.mastered && !prior.mastered) events.push(['mistake_mastered', {}]);
    }
  }
  return events;
}

// Per-subject personal data routes: preferences, the saved 7-day plan, the
// mistake notebook and durable paper attempts. All data is user-scoped
// server-side; the subject is derived from the mounted router namespace.
export function attachPersonalRoutes(app, subjectFor, storage) {
  app.get('/personal', asyncRoute(async (req, res) => {
    const subject = normalizeSubject(subjectFor(req));
    res.json(await storage.getPersonal(req.user.id, subject));
  }));

  app.get('/personal/attempts', asyncRoute(async (req, res) => {
    const subject = normalizeSubject(subjectFor(req));
    const limit = Number.isInteger(Number(req.query?.limit)) ? Number(req.query.limit) : 20;
    res.json({ attempts: await storage.listAttempts(req.user.id, subject, limit) });
  }));

  app.put('/personal/preferences', asyncRoute(async (req, res) => {
    const subject = normalizeSubject(subjectFor(req));
    const preferences = normalizePreferences(req.body);
    res.json({ preferences: await storage.savePreferences(req.user.id, subject, preferences) });
  }));

  app.put('/personal/plan', asyncRoute(async (req, res) => {
    const subject = normalizeSubject(subjectFor(req));
    const plan = normalizePlan(req.body);
    res.json({ plan: await storage.savePlan(req.user.id, subject, plan) });
  }));

  app.put('/personal/mistakes', asyncRoute(async (req, res) => {
    const subject = normalizeSubject(subjectFor(req));
    const rows = normalizeMistakeRows(req.body);
    let previous = [];
    try {
      previous = (await storage.getPersonal(req.user.id, subject)).mistakes ?? [];
    } catch {
      previous = [];
    }
    const saved = await storage.saveMistakes(req.user.id, subject, rows);
    if (typeof storage.recordEvent === 'function') {
      for (const [name, metadata] of mistakeEvents(previous, saved)) {
        await storage.recordEvent(req.user.id, name, { subject, metadata }).catch(() => {});
      }
    }
    res.json({ mistakes: saved });
  }));

  app.use('/personal', (req, res, next) => {
    const error = personalError('PERSONAL_ROUTE_NOT_FOUND', 'Personal data route not found');
    error.status = 404;
    next(error);
  });

  return app;
}