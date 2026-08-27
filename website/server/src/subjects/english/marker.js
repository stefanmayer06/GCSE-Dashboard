const STOP = new Set(
  ('the a an he she it they we you i was were is are had has have been being be of in on at to from by for as and or but with his her their its our your my into out up down over under not no so then than that this these those there here when where what who which while could would should will can do does did am').split(' ')
);

function tokens(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u2019'\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function score(line, point) {
  const lt = new Set(tokens(line));
  const pt = tokens(point);
  if (!pt.length || !lt.size) return 0;
  let hits = 0;
  for (const w of pt) if (lt.has(w)) hits++;
  return hits / pt.length;
}

/**
 * Mark a "list four things" answer.
 * Each line can earn one mark by matching an acceptable point.
 */
export function markList(value, points) {
  const lines = String(value || '')
    .split(/\n+/)
    .map((l) => l.replace(/^[-\d.)\s]+/, '').trim())
    .filter(Boolean);
  const used = new Set();
  const matched = [];
  const missed = [];
  for (const point of points) {
    let best = null;
    let bestScore = 0.45;
    for (let i = 0; i < lines.length; i++) {
      if (used.has(i)) continue;
      const s = score(lines[i], point);
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    }
    if (best !== null) {
      used.add(best);
      matched.push({ point, line: lines[best] });
    } else {
      missed.push(point);
    }
  }
  return { marks: Math.min(4, matched.length), matched, missed };
}

/** Mark the 8-statement true/false question (0.5 per statement, total 4). */
export function markTrueFalse(value, statements) {
  const v = value || {};
  let correct = 0;
  const rows = statements.map((s, i) => {
    const yours = v[i] === true || v[i] === 'true';
    const right = s.a === true;
    if (yours === right) correct += 0.5;
    return { text: s.t, answer: right, yours, right: yours === right };
  });
  return { marks: correct, rows };
}