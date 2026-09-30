import crypto from 'node:crypto';
import express from 'express';

import { defaultStorage } from './storage/index.js';

const ROLES = new Set(['student', 'parent', 'teacher', 'other']);
const SUBJECTS = new Set(['maths', 'maths-higher', 'english', 'multiple']);
export const PAYERS = new Set(['me', 'parent', 'school', 'nobody', 'unsure']);
export const PRICE_MODELS = new Set(['monthly', 'season-pass', 'free-only', 'unsure']);
// Van Westendorp price-sensitivity answers, in pounds per month.
export const PRICE_FIELDS = ['priceTooCheap', 'priceBargain', 'priceExpensive', 'priceTooExpensive'];
const MAX_PRICE = 100;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_DESIGN_NOTE_LENGTH = 500;
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

function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && !value.trim());
}

// Optional enum: blank is null, anything outside the set is invalid (undefined).
function optionalChoice(value, choices) {
  if (isBlank(value)) return null;
  return typeof value === 'string' && choices.has(value) ? value : undefined;
}

function optionalRating(value) {
  if (isBlank(value)) return null;
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : undefined;
}

function optionalPrice(value) {
  if (isBlank(value)) return null;
  const price = typeof value === 'string' ? Number(value.trim().replace(/^£/, '')) : value;
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > MAX_PRICE) return undefined;
  return Math.round(price * 100) / 100;
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

      const designRating = optionalRating(body.designRating);
      if (designRating === undefined) {
        res.status(400).json({ error: 'Please pick a design rating from 1 to 5, or leave it blank.' });
        return;
      }
      const payer = optionalChoice(body.payer, PAYERS);
      const priceModel = optionalChoice(body.priceModel, PRICE_MODELS);
      if (payer === undefined || priceModel === undefined) {
        res.status(400).json({ error: 'Please choose one of the listed pricing answers, or leave it blank.' });
        return;
      }
      const prices = {};
      for (const field of PRICE_FIELDS) {
        prices[field] = optionalPrice(body[field]);
        if (prices[field] === undefined) {
          res.status(400).json({ error: `Please enter prices as pounds per month between 0 and ${MAX_PRICE}, or leave them blank.` });
          return;
        }
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
        designRating,
        designNote: optionalText(body.designNote, MAX_DESIGN_NOTE_LENGTH),
        payer,
        priceModel,
        ...prices,
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
