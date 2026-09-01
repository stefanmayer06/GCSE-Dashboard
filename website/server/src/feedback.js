import crypto from 'node:crypto';
import express from 'express';

import { defaultStorage } from './storage/index.js';

const ROLES = new Set(['student', 'parent', 'teacher', 'other']);
const SUBJECTS = new Set(['maths', 'maths-higher', 'english', 'multiple']);
const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 200;
const MAX_SHORT_TEXT_LENGTH = 120;

const DEFAULT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_MAX_PER_WINDOW = 5;
const SWEEP_INTERVAL_MS = 60 * 1000;

function optionalText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || 'unknown';
}

export function feedbackRoutes({
  storage = defaultStorage,
  windowMs = DEFAULT_WINDOW_MS,
  maxPerWindow = DEFAULT_MAX_PER_WINDOW,
} = {}) {
  const recent = new Map();
  let lastSweep = 0;

  function allow(key, now) {
    if (now - lastSweep > SWEEP_INTERVAL_MS) {
      lastSweep = now;
      for (const [entryKey, entry] of recent) {
        if (entry.resetAt <= now) recent.delete(entryKey);
      }
    }
    const entry = recent.get(key);
    if (!entry || entry.resetAt <= now) {
      recent.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= maxPerWindow;
  }

  const router = express.Router();

  router.post('/', async (req, res, next) => {
    try {
      const now = Date.now();
      const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};

      // Hidden honeypot: real users never fill this. Pretend success for bots.
      if (optionalText(body.website, MAX_SHORT_TEXT_LENGTH)) {
        res.status(201).json({ ok: true });
        return;
      }

      if (!allow(clientKey(req), now)) {
        res.status(429).json({ error: 'Too many feedback submissions. Please try again later.' });
        return;
      }

      const role = typeof body.role === 'string' ? body.role : '';
      const subject = typeof body.subject === 'string' ? body.subject : '';
      const rating = Number(body.rating);
      const message = typeof body.message === 'string' ? body.message.trim() : '';

      if (!ROLES.has(role)) {
        res.status(400).json({ error: 'Please tell us whether you are a student, parent, teacher or other.' });
        return;
      }
      if (!SUBJECTS.has(subject)) {
        res.status(400).json({ error: 'Please choose the subject you looked at.' });
        return;
      }
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        res.status(400).json({ error: 'Please pick a rating from 1 to 5.' });
        return;
      }
      if (!message) {
        res.status(400).json({ error: 'Please tell us what we should improve first.' });
        return;
      }

      const stored = await storage.saveFeedback({
        id: crypto.randomUUID(),
        role,
        subject,
        rating,
        heard: optionalText(body.heard, MAX_SHORT_TEXT_LENGTH),
        message: message.slice(0, MAX_MESSAGE_LENGTH),
        email: optionalText(body.email, MAX_EMAIL_LENGTH),
        source: optionalText(body.source, MAX_SHORT_TEXT_LENGTH),
        userAgent: optionalText(req.headers['user-agent'], MAX_SHORT_TEXT_LENGTH),
        createdAt: new Date(now).toISOString(),
      });

      res.status(stored === false ? 200 : 201).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default feedbackRoutes;
