export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function makeRand(topicId, variant) {
  return mulberry32(hashStr(topicId) + variant * 1013904223);
}

export function ri(r, min, max) {
  return min + Math.floor(r() * (max - min + 1));
}

export function pick(r, arr) {
  return arr[Math.floor(r() * arr.length)];
}

export function shuffle(r, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function fracStr(n, d) {
  const g = gcd(n, d);
  n /= g;
  d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
}

export function round(x, dp = 2) {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}

export function fmt(x) {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
  return String(round(x, 4));
}

export function money(x) {
  const v = Math.abs(x - Math.round(x * 100) / 100);
  return v < 1e-9
    ? `£${(Math.round(x * 100) / 100).toFixed(2)}`
    : `£${round(x * 100) / 100}`;
}

export function numChoiceLetters(n = 4) {
  return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
}

const WORDS = ['shows', 'works out', 'calculates', 'finds', 'earns', 'records'];

export function pickWord(r) {
  return pick(r, WORDS);
}

export function nearestWholeDivisors(r, n, min = 2, max = 12) {
  const out = [];
  for (let d = min; d <= max; d++) if (n % d === 0) out.push(d);
  return out;
}