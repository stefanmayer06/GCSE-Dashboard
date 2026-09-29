const DAY = 86400000;
const SOURCE = /^[a-z0-9][a-z0-9_-]{0,59}$/;

function timeOf(event) {
  const value = Date.parse(event?.occurredAt ?? event?.occurred_at ?? '');
  return Number.isFinite(value) ? value : null;
}

function userOf(event) {
  return event?.userId ?? event?.user_id;
}

export function summarizeEvents(events) {
  const ordered = events
    .filter((event) => timeOf(event) !== null)
    .sort((a, b) => timeOf(a) - timeOf(b));
  const counts = {};
  for (const event of ordered) counts[event.name] = (counts[event.name] || 0) + 1;
  const first = ordered.length ? timeOf(ordered[0]) : null;
  const activated = first !== null
    && ['diagnostic_complete', 'session_marked'].every((name) => ordered.some(
      (event) => event.name === name && timeOf(event) < first + 7 * DAY,
    ));
  return {
    counts,
    firstSeen: first === null ? null : new Date(first).toISOString(),
    lastSeen: ordered.length ? new Date(timeOf(ordered.at(-1))).toISOString() : null,
    activated,
  };
}

export function acquisitionReport(events, { sinceDays = 90, now = Date.now() } = {}) {
  const since = now - Math.max(1, Number(sinceDays) || 90) * DAY;
  const signupByUser = new Map();
  const eventsByUser = new Map();
  for (const event of events) {
    const time = timeOf(event);
    const user = userOf(event);
    if (!user || time === null) continue;
    if (!eventsByUser.has(user)) eventsByUser.set(user, []);
    eventsByUser.get(user).push(event);
    if (event?.name !== 'signup' || !user || time === null || time < since || time > now) continue;
    const previous = signupByUser.get(user);
    if (!previous || time < previous.time) {
      const rawSource = event.metadata?.source;
      signupByUser.set(user, {
        time,
        source: typeof rawSource === 'string' && SOURCE.test(rawSource) ? rawSource : 'direct',
      });
    }
  }
  const groups = new Map();
  for (const [user, signup] of signupByUser) {
    const later = eventsByUser.get(user) || [];
    const inWeek = (name) => later.some((event) => {
      const time = timeOf(event);
      return event.name === name && time >= signup.time && time < signup.time + 7 * DAY;
    });
    const diagnostic = inWeek('diagnostic_complete');
    const marked = inWeek('session_marked');
    const d7Eligible = signup.time <= now - 14 * DAY;
    const d7Returned = d7Eligible && later.some((event) => {
      const time = timeOf(event);
      return time >= signup.time + 7 * DAY && time < signup.time + 14 * DAY;
    });
    const row = groups.get(signup.source) || {
      source: signup.source,
      signups: 0,
      diagnostics: 0,
      markedSessions: 0,
      activated: 0,
      d7Eligible: 0,
      d7Returned: 0,
    };
    row.signups += 1;
    row.diagnostics += Number(diagnostic);
    row.markedSessions += Number(marked);
    row.activated += Number(diagnostic && marked);
    row.d7Eligible += Number(d7Eligible);
    row.d7Returned += Number(d7Returned);
    groups.set(signup.source, row);
  }
  return {
    since: new Date(since).toISOString(),
    asOf: new Date(now).toISOString(),
    sources: [...groups.values()].sort((a, b) => b.signups - a.signups || a.source.localeCompare(b.source)),
  };
}
