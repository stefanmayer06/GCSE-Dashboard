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

// Per-subject personal data routes: preferences, the saved 7-day plan and the
// mistake notebook. All data is user-scoped server-side; the subject is derived
// from the mounted router namespace.
export function attachPersonalRoutes(app, subjectFor, storage) {
  app.get('/personal', asyncRoute(async (req, res) => {
    const subject = normalizeSubject(subjectFor(req));
    res.json(await storage.getPersonal(req.user.id, subject));
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
    res.json({ mistakes: await storage.saveMistakes(req.user.id, subject, rows) });
  }));

  app.use('/personal', (req, res, next) => {
    const error = personalError('PERSONAL_ROUTE_NOT_FOUND', 'Personal data route not found');
    error.status = 404;
    next(error);
  });

  return app;
}