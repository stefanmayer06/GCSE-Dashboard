import assert from 'node:assert/strict';
import test from 'node:test';

import { acquisitionReport, summarizeEvents } from '../src/event-report.js';

const DAY = 86400000;
const NOW = Date.parse('2026-09-23T12:00:00.000Z');
const at = (days) => new Date(NOW + days * DAY).toISOString();
const event = (userId, name, days, metadata = {}) => ({ userId, name, occurredAt: at(days), metadata });

test('activation needs both milestones within the first seven days', () => {
  const onTime = summarizeEvents([
    event('a', 'session_marked', -13),
    event('a', 'signup', -20),
    event('a', 'diagnostic_complete', -19),
  ]);
  assert.equal(onTime.activated, false, 'a session exactly seven days later is outside the first week');
  assert.equal(onTime.firstSeen, at(-20));
  assert.equal(onTime.lastSeen, at(-13));
  assert.deepEqual(onTime.counts, { signup: 1, diagnostic_complete: 1, session_marked: 1 });
  assert.equal(summarizeEvents([
    event('a', 'signup', -20),
    event('a', 'diagnostic_complete', -19),
    event('a', 'session_marked', -14),
  ]).activated, true);
});

test('acquisition report groups signups without returning learner identifiers', () => {
  const report = acquisitionReport([
    event('a', 'signup', -30, { source: 'parent-group' }),
    event('a', 'diagnostic_complete', -29),
    event('a', 'session_marked', -28),
    event('a', 'week_return', -22),
    event('b', 'signup', -20, { source: 'parent-group' }),
    event('b', 'session_marked', -19),
    event('c', 'signup', -2, { source: 'untrusted source' }),
    event('c', 'diagnostic_complete', -1),
    event('d', 'diagnostic_complete', -10),
  ], { sinceDays: 90, now: NOW });
  assert.deepEqual(report.sources, [
    { source: 'parent-group', signups: 2, diagnostics: 1, markedSessions: 2, activated: 1, d7Eligible: 2, d7Returned: 1 },
    { source: 'direct', signups: 1, diagnostics: 1, markedSessions: 0, activated: 0, d7Eligible: 0, d7Returned: 0 },
  ]);
  assert.equal(JSON.stringify(report).includes('"userId"'), false);
  assert.equal(JSON.stringify(report).includes('"a"'), false);
});
