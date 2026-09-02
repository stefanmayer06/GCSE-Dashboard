import express from 'express';

import { normalizeEvent } from './personal-model.js';

let pruned = false;

// Product event trail backing the activation and retention model documented in
// ANALYTICS.md. Events are appended through the configured storage driver and
// are always scoped to the signed-in user. Mounted behind the standard auth
// gate at /api/events.
export function analyticsRoutes(storage) {
  const router = express.Router();

  router.post('/events', async (req, res, next) => {
    try {
      const event = normalizeEvent(req.body);
      await storage.recordEvent(req.user.id, event.name, {
        subject: event.subject ?? null,
        metadata: event.metadata,
      });
      // Funnel events are retention-managed (see ANALYTICS.md); the prune runs
      // best-effort once per server process so serverless boots keep the table
      // within its documented window.
      if (!pruned && typeof storage.pruneEvents === 'function') {
        pruned = true;
        storage.pruneEvents().catch(() => {});
      }
      res.status(202).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.get('/events/summary', async (req, res, next) => {
    try {
      res.json(await storage.getEventSummary(req.user.id));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default analyticsRoutes;
