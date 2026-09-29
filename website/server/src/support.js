import crypto from 'node:crypto';
import express from 'express';

import { defaultStorage } from './storage/index.js';

const TOPICS = new Set(['account', 'study', 'content', 'privacy', 'other']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function supportRoutes({ storage = defaultStorage, windowMs = 10 * 60 * 1000, maxPerWindow = 5 } = {}) {
  const recent = new Map();
  const router = express.Router();

  router.post('/', async (req, res, next) => {
    try {
      const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
      if (typeof body.website === 'string' && body.website.trim()) {
        return res.status(201).json({ ok: true });
      }

      const topic = typeof body.topic === 'string' ? body.topic : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      if (!TOPICS.has(topic)) return res.status(400).json({ error: 'Choose what you need help with.' });
      if (!message || message.length > 2000) {
        return res.status(400).json({ error: 'Describe the issue in 1 to 2,000 characters.' });
      }
      if (email.length > 200 || (email && !EMAIL_PATTERN.test(email))) {
        return res.status(400).json({ error: 'Enter a valid reply email, or leave it blank.' });
      }
      if (topic === 'privacy' && !email) {
        return res.status(400).json({ error: 'Add a reply email so we can follow up on a privacy request.' });
      }

      const now = Date.now();
      const key = String(req.ip || req.socket?.remoteAddress || 'unknown');
      for (const [id, entry] of recent) {
        if (entry.resetAt <= now) recent.delete(id);
      }
      const entry = recent.get(key);
      if (entry && entry.resetAt > now && entry.count >= maxPerWindow) {
        return res.status(429).json({ error: 'Too many support requests. Please try again later.' });
      }
      recent.set(key, entry && entry.resetAt > now
        ? { count: entry.count + 1, resetAt: entry.resetAt }
        : { count: 1, resetAt: now + windowMs });

      await storage.saveSupportRequest({
        id: crypto.randomUUID(),
        topic,
        message,
        email: email || null,
        createdAt: new Date(now).toISOString(),
      });
      if (typeof storage.pruneSupportRequests === 'function') {
        await storage.pruneSupportRequests(180).catch(() => {});
      }
      return res.status(201).json({ ok: true });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

export default supportRoutes;
