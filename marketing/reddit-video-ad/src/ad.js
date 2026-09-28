/* GCSE Study Desk — 25 s Reddit ad (1080 × 1920, 30 fps).
 *
 * Everything on screen is a pure function of time: renderFrame(t) sets every
 * style for second t, so frames can be captured in any order and re-rendered
 * identically. The same file exports the caption track (window.CAPTIONS) and
 * the sound-effect cues (window.SFX), so audio, captions and picture share one
 * timeline. Voiceover word timings come from vo-data.js (scripts/tts.py).
 */
(() => {
  'use strict';

  const DURATION = 25;
  const COLORS = {
    paper: '#f7f4ec', card: '#ffffff', muted: '#efead9', ink: '#191c17', quiet: '#5b6055',
    line: '#d9d3c0', lineStrong: '#8a8471',
    indigo: '#4338ca', indigoInk: '#232058', indigoTint: '#e4e1ff', indigoSoft: '#f3f1ff',
    pine: '#0f766e', pineTint: '#d3eee7',
    ember: '#b45309', emberTint: '#f7e5c6',
    good: '#15803d', goodWash: '#dcf0e3',
  };

  /* ---------- easing (Trailhead motion tokens) ---------- */
  function cubicBezier(p1x, p1y, p2x, p2y) {
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dsx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const err = sx(t) - x;
        if (Math.abs(err) < 1e-7) return sy(t);
        const d = dsx(t);
        if (Math.abs(d) < 1e-7) break;
        t -= err / d;
      }
      let lo = 0, hi = 1;
      t = x;
      for (let i = 0; i < 60; i++) {
        const v = sx(t);
        if (Math.abs(v - x) < 1e-7) break;
        if (x > v) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return sy(t);
    };
  }
  const E = {
    out: cubicBezier(0.22, 0.61, 0.36, 1),     // --v3-ease-out
    spring: cubicBezier(0.34, 1.56, 0.64, 1),  // --v3-ease-spring
    inOut: cubicBezier(0.65, 0, 0.35, 1),
    soft: cubicBezier(0.45, 0.05, 0.25, 1),
    sine: cubicBezier(0.37, 0, 0.63, 1),       // camera: unhurried scroll
    linear: (x) => x,
  };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, t0, d, e = E.out) => e(clamp((t - t0) / d));

  function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, k) {
    const A = hexToRgb(a), B = hexToRgb(b);
    const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  const $ = (sel) => document.querySelector(sel);
  const px = (v) => `${v.toFixed(2)}px`;
  function setStyle(el, o, tf) {
    el.style.opacity = o.toFixed(4);
    el.style.transform = tf || 'none';
    el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
  }

  /* ---------- the trail: connected dots that draw forward ---------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, parent) => {
    const el = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (parent) parent.appendChild(el);
    return el;
  };

  const DOT_GAP = 30;
  const SEGMENTS = [
    { color: COLORS.ink, d: 'M540,640 C540,780 760,820 760,960 C760,1100 128,1080 128,1235', t0: 0.9, t1: 3.3, ease: E.soft },
    { color: COLORS.ink, d: 'M128,1235 L128,1481', t0: 3.3, t1: 3.8, ease: E.linear },
    { color: COLORS.ink, d: 'M128,1481 L128,1727', t0: 3.8, t1: 4.3, ease: E.linear },
    { color: COLORS.indigo, d: 'M128,1727 L128,2210', t0: 8.7, t1: 9.45, ease: E.inOut },
    { color: COLORS.indigo, d: 'M128,2210 L128,2500', t0: 11.45, t1: 12.15, ease: E.inOut },
    { color: COLORS.indigo, d: 'M128,2500 L128,3010', t0: 14.35, t1: 14.85, ease: E.inOut },
    // The loop back: the trail curls round before it reaches the retry point.
    { color: COLORS.indigo, d: 'M128,3010 L128,3395 a44,44 0 1,1 -88,0 a44,44 0 1,1 88,0 L128,3540', t0: 16.85, t1: 17.75, ease: E.inOut },
    { color: COLORS.indigo, d: 'M128,3540 L128,3935', t0: 19.05, t1: 19.45, ease: E.inOut },
  ];
  // at: when the trail reaches the node (it pops in then).
  const NODES = {
    head: { x: 540, y: 640, at: 0.85 },
    f: { x: 128, y: 1235, at: 3.3 },
    h: { x: 128, y: 1481, at: 3.8 },
    e: { x: 128, y: 1727, at: 4.3 },
    today: { x: 128, y: 2210, at: 9.45 },
    q: { x: 128, y: 2500, at: 12.15 },
    m: { x: 128, y: 3010, at: 14.85 },
    retry: { x: 128, y: 3540, at: 17.75 },
    secure: { x: 128, y: 3935, at: 19.45 },
  };

  function buildTrail() {
    const svg = $('#trail');
    const defs = svgEl('defs', {}, svg);
    SEGMENTS.forEach((seg, i) => {
      const probe = svgEl('path', { d: seg.d, fill: 'none' }, svg);
      seg.len = probe.getTotalLength();
      probe.remove();
      const mask = svgEl('mask', { id: `m${i}`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1080, height: 4600 }, defs);
      seg.maskPath = svgEl('path', { d: seg.d, fill: 'none', stroke: '#fff', 'stroke-width': 46, 'stroke-linecap': 'butt', 'stroke-dasharray': `0 ${seg.len + 100}` }, mask);
      const g = svgEl('g', { mask: `url(#m${i})` }, svg);
      svgEl('path', { d: seg.d, fill: 'none', stroke: seg.color, 'stroke-width': 3, 'stroke-opacity': 0.32, 'stroke-linecap': 'round' }, g);
      svgEl('path', { d: seg.d, fill: 'none', stroke: seg.color, 'stroke-width': 13, 'stroke-linecap': 'round', 'stroke-dasharray': `0 ${DOT_GAP}` }, g);
      seg.headDot = svgEl('circle', { r: 11, fill: seg.color, opacity: 0 }, svg);
      seg.probe = svgEl('path', { d: seg.d, fill: 'none', stroke: 'none' }, defs);
    });
    for (const [key, n] of Object.entries(NODES)) {
      const g = svgEl('g', { transform: `translate(${n.x} ${n.y}) scale(0)` }, svg);
      n.pulse = svgEl('circle', { r: 22, fill: 'none', 'stroke-width': 4, opacity: 0 }, g);
      n.ring = svgEl('circle', { r: 21, fill: COLORS.paper, 'stroke-width': 6 }, g);
      n.core = svgEl('circle', { r: 10, fill: COLORS.ink }, g);
      n.g = g;
      n.key = key;
    }
  }

  function renderTrail(t) {
    for (const seg of SEGMENTS) {
      const k = seg.ease(clamp((t - seg.t0) / (seg.t1 - seg.t0)));
      const drawn = seg.len * k;
      seg.maskPath.setAttribute('stroke-dasharray', `${drawn.toFixed(2)} ${(seg.len + 100).toFixed(2)}`);
      const drawing = k > 0 && k < 1;
      if (drawing) {
        const p = seg.probe.getPointAtLength(drawn);
        seg.headDot.setAttribute('cx', p.x.toFixed(2));
        seg.headDot.setAttribute('cy', p.y.toFixed(2));
      }
      seg.headDot.setAttribute('opacity', drawing ? 1 : 0);
    }
  }

  // state: ring colour, core fill (0..1), pulse on/off
  function renderNode(n, t, { color, fill, pulse }) {
    const s = prog(t, n.at, 0.5, E.spring);
    n.g.setAttribute('transform', `translate(${n.x} ${n.y}) scale(${s.toFixed(4)})`);
    n.ring.setAttribute('stroke', color);
    n.core.setAttribute('fill', color);
    n.core.setAttribute('r', (10 * clamp(fill)).toFixed(2));
    if (pulse) {
      const ph = ((t - n.at) % 1.6 + 1.6) % 1.6 / 1.6;
      n.pulse.setAttribute('stroke', color);
      n.pulse.setAttribute('r', (22 + 30 * E.out(ph)).toFixed(2));
      n.pulse.setAttribute('opacity', (0.38 * (1 - ph) * clamp((t - n.at) / 0.4)).toFixed(3));
    } else {
      n.pulse.setAttribute('opacity', 0);
    }
  }

  /* ---------- camera ---------- */
  const PANS = [
    { t0: 2.45, d: 1.1, to: 700 },
    { t0: 8.6, d: 1.1, to: 1400 },
    { t0: 11.35, d: 1.1, to: 2100 },
    { t0: 16.8, d: 1.1, to: 2750 },
    { t0: 20.25, d: 1.1, to: 3250 },
  ];
  function camY(t) {
    let y = 0;
    for (const p of PANS) y += (p.to - y) * prog(t, p.t0, p.d, E.sine);
    return y;
  }

  /* ---------- helpers for common motion ---------- */
  // Rise into place (cards rise, never drop) and leave by lifting away.
  function rise(el, t, tin, din, tout, dout, dist = 48, extra = '') {
    const a = prog(t, tin, din, E.out);
    const b = tout == null ? 0 : prog(t, tout, dout, E.inOut);
    const o = a * (1 - b);
    setStyle(el, o, `translateY(${px((1 - a) * dist - b * 36)}) ${extra}`);
    return o;
  }
  function revealHand(el, t, t0, d) {
    const k = clamp((t - t0) / d);
    const edge = lerp(-8, 108, E.soft(k));
    const m = `linear-gradient(90deg, #000 ${edge - 8}%, transparent ${edge}%)`;
    el.style.webkitMaskImage = m;
    el.style.maskImage = m;
    el.style.opacity = k > 0 ? 1 : 0;
  }
  function tap(rip, touch, t, t0, x, y) {
    rip.style.left = px(x); rip.style.top = px(y);
    touch.style.left = px(x); touch.style.top = px(y);
    const k = clamp((t - t0) / 0.6);
    const on = t >= t0 && k < 1;
    rip.style.opacity = on ? (0.9 * (1 - E.out(k))).toFixed(3) : 0;
    rip.style.transform = `scale(${lerp(0.25, 1.25, E.out(k)).toFixed(3)})`;
    const kt = clamp((t - t0 + 0.12) / 0.42);
    const touchOn = t >= t0 - 0.12 && kt < 1;
    touch.style.opacity = touchOn ? (Math.sin(Math.PI * kt) * 0.95).toFixed(3) : 0;
    touch.style.transform = `scale(${lerp(1.15, 0.85, kt).toFixed(3)})`;
  }
  // A press squish: down to 98% then back (DESIGN.md: pressing squishes).
  const press = (t, t0) => 1 - 0.022 * Math.sin(Math.PI * clamp((t - t0) / 0.24));

  /* ---------- fit headlines to their column ---------- */
  function fitHeadline(el, maxSize) {
    el.style.fontSize = `${maxSize}px`;
    const width = el.clientWidth;
    let widest = 0;
    el.querySelectorAll('.ln').forEach((ln) => { widest = Math.max(widest, ln.getBoundingClientRect().width); });
    const size = Math.floor(Math.min(maxSize, maxSize * (width / widest)));
    el.style.fontSize = `${size}px`;
    return size;
  }

  /* ---------- captions (verbatim voiceover, chunked for reading) ---------- */
  // [line id, first word index, last word index (inclusive), display lines]
  const CAPTION_CHUNKS = [
    ['L1', 0, 5, ['Not sure what to revise next?']],
    ['L2', 0, 9, ['GCSE Study Desk helps you', 'find one useful next step.']],
    ['L3', 0, 6, ['Choose Maths Foundation,', 'Maths Higher, or English.']],
    ['L4', 0, 6, ['Practise exam-style questions,', 'see a worked method,']],
    ['L4', 7, 12, ['and revisit mistakes', 'as you learn.']],
    ['L5', 0, 5, ['App and new features', 'coming soon.']],
    ['L6', 0, 3, ['Thanks for being here.']],
  ];
  function buildCaptions() {
    const lines = Object.fromEntries(window.VO.lines.map((l) => [l.id, l]));
    const caps = CAPTION_CHUNKS.map(([id, w0, w1, rows]) => {
      const line = lines[id];
      const words = line.words.slice(w0, w1 + 1);
      return { id, rows, text: rows.join(' '), start: words[0].start, end: words[words.length - 1].end, lineText: line.text };
    });
    // Captions must be the words actually spoken, in order, and each chunk
    // must be timed by exactly the words it shows.
    const norm = (x) => x.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    caps.forEach((c) => {
      const [id, w0, w1] = CAPTION_CHUNKS[caps.indexOf(c)];
      const said = lines[id].words.slice(w0, w1 + 1).map((w) => w.text).join(' ');
      if (norm(said) !== norm(c.text)) throw new Error(`Caption timing words "${said}" do not match "${c.text}"`);
    });
    const spoken = window.VO.lines.map((l) => l.text).join(' ');
    const shown = caps.map((c) => c.text).join(' ');
    if (spoken !== shown) throw new Error(`Caption text drifted from the voiceover:\n${spoken}\n${shown}`);
    caps.forEach((c, i) => {
      const next = caps[i + 1];
      c.in = c.start - 0.12;
      const hold = c.end + 0.45;
      if (next && next.start - c.end < 0.3) {
        c.out = (c.end + next.start) / 2; // same sentence continues: switch between words
        next.inOverride = c.out;
      } else {
        c.out = next ? Math.min(hold, next.start - 0.2) : Math.min(hold, DURATION - 0.1);
      }
      if (c.inOverride != null) c.in = c.inOverride;
    });
    const host = $('#caps');
    caps.forEach((c) => {
      const el = document.createElement('div');
      el.className = 'cap';
      el.innerHTML = c.rows.map((r) => r.replace(/&/g, '&amp;')).join('<br>');
      host.appendChild(el);
      c.el = el;
    });
    return caps;
  }
  function renderCaptions(t, caps) {
    for (const c of caps) {
      const fin = c.inOverride != null ? 0.06 : 0.14;
      const fout = 0.12;
      const a = clamp((t - c.in) / fin);
      const b = clamp((t - (c.out - fout)) / fout);
      const o = t < c.in || t >= c.out ? 0 : Math.min(a, 1 - b);
      const lift = (1 - E.out(a)) * 10;
      c.el.style.opacity = o.toFixed(3);
      c.el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
      c.el.style.transform = `translateX(-50%) translateY(${px(lift)})`;
    }
  }

  /* ---------- sound cues (read by scripts/audio.py) ---------- */
  const SFX = [
    { t: 0.05, kind: 'paper', gain: 0.5 },
    { t: 0.85, kind: 'tick', gain: 0.45 },
    { t: 3.3, kind: 'tick', gain: 0.55 },
    { t: 3.8, kind: 'tick', gain: 0.5 },
    { t: 4.3, kind: 'tick', gain: 0.5 },
    { t: 7.95, kind: 'tap', gain: 0.9 },
    { t: 9.45, kind: 'tick', gain: 0.55 },
    { t: 10.95, kind: 'tap', gain: 0.9 },
    { t: 12.15, kind: 'tick', gain: 0.5 },
    { t: 12.85, kind: 'pencil', dur: 0.6, gain: 0.8 },
    { t: 13.6, kind: 'pencil', dur: 0.4, gain: 0.75 },
    { t: 14.3, kind: 'pencil', dur: 0.35, gain: 0.6, circle: true },
    { t: 14.85, kind: 'tick', gain: 0.5 },
    { t: 16.0, kind: 'tick', gain: 0.4 },
    { t: 17.75, kind: 'tick', gain: 0.55 },
    { t: 18.15, kind: 'pencil', dur: 0.4, gain: 0.8 },
    { t: 18.8, kind: 'chime', gain: 0.5 },
    { t: 20.1, kind: 'stamp', gain: 0.75 },
    { t: 21.05, kind: 'stamp', gain: 0.6 },
  ];

  /* ---------- scene setup ---------- */
  let CAPS = [];
  const els = {};
  const SUBJECTS = [
    { id: '#sub-f', node: 'f', hue: COLORS.indigo, tint: COLORS.indigoTint },
    { id: '#sub-h', node: 'h', hue: COLORS.pine, tint: COLORS.pineTint },
    { id: '#sub-e', node: 'e', hue: COLORS.ember, tint: COLORS.emberTint },
  ];
  const NOTES = [
    // id, pop time, rotation, drift direction when the trail clears a path
    ['#n1', -0.3, -4, -1], ['#n2', -0.18, 3, 1], ['#n3', -0.06, 2, -1],
    ['#n4', 0.06, -3, -1], ['#n5', 0.18, -2, 1], ['#n6', 0.3, 3, -1],
  ];

  function init() {
    buildTrail();
    CAPS = buildCaptions();
    for (const id of ['world', 'h1', 'h3', 'h5', 'today', 'startbtn', 'question', 'w1', 'w2', 'circle36', 'method', 's1', 's2', 'm24', 'm6', 'retrychip', 'retry', 'ans', 'gm', 'correct', 'mastery', 'st-dev', 'st-sec', 'fill', 'end', 'mark', 'brand', 'soon', 'thanks', 'rip1', 'tch1', 'rip2', 'tch2']) {
      els[id] = document.getElementById(id);
    }
    // Park the pencil circle over the "36" in the learner's working.
    const c36 = document.getElementById('c36').getBoundingClientRect();
    const wk = document.querySelector('#question .working').getBoundingClientRect();
    const ring = document.getElementById('circle36svg');
    ring.style.left = px(c36.left - wk.left + c36.width / 2 - 75);
    ring.style.top = px(c36.top - wk.top + c36.height / 2 - 59);
    fitHeadline(els.h1, 112);
    fitHeadline(els.h3, 112);
    fitHeadline(els.h5, 88);
    SUBJECTS.forEach((s) => {
      s.el = $(s.id);
      s.badge = s.el.querySelector('.badge');
      s.go = s.el.querySelector('.go');
      s.el.style.borderWidth = '3px';
    });
    buildEndTrail();
  }

  function buildEndTrail() {
    const svg = $('#endtrail');
    const d = 'M128,250 C128,470 540,340 540,508';
    const probe = svgEl('path', { d, fill: 'none' }, svg);
    const len = probe.getTotalLength();
    probe.remove();
    const defs = svgEl('defs', {}, svg);
    const mask = svgEl('mask', { id: 'mend', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1080, height: 1920 }, defs);
    const mp = svgEl('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': 46, 'stroke-dasharray': `0 ${len + 50}` }, mask);
    const g = svgEl('g', { mask: 'url(#mend)' }, svg);
    svgEl('path', { d, fill: 'none', stroke: COLORS.ink, 'stroke-width': 3, 'stroke-opacity': 0.32 }, g);
    svgEl('path', { d, fill: 'none', stroke: COLORS.ink, 'stroke-width': 13, 'stroke-linecap': 'round', 'stroke-dasharray': `0 ${DOT_GAP}` }, g);
    els.endTrail = { mp, len };
  }

  /* ---------- the frame ---------- */
  function renderFrame(t) {
    // Camera + world fade into the end card
    const cam = camY(t);
    const worldFade = 1 - prog(t, 20.35, 0.6, E.inOut);
    els.world.style.transform = `translateY(${px(-cam)})`;
    els.world.style.opacity = worldFade.toFixed(4);

    renderTrail(t);

    /* 0–3 s: the pile of notes, the headline, a trail begins */
    setStyle(els.h1, 1 - prog(t, 2.45, 0.4, E.inOut), `translateY(${px(-30 * prog(t, 2.45, 0.4, E.inOut))})`);
    for (const [id, t0, rot, dir] of NOTES) {
      const el = $(id);
      const a = prog(t, t0, 0.5, E.spring);
      const clear = prog(t, 1.3, 1.2, E.inOut);
      const gone = prog(t, 2.5, 0.5, E.inOut);
      const o = clamp(prog(t, t0, 0.25, E.out)) * (1 - 0.25 * clear) * (1 - gone);
      setStyle(el, o, `translate(${px(dir * 16 * clear)}, ${px((1 - a) * 26)}) rotate(${rot}deg) scale(${lerp(0.94, 1, a).toFixed(4)})`);
    }
    renderNode(NODES.head, t, { color: COLORS.ink, fill: 1, pulse: t < 2.6 });

    /* 3–9 s: three subjects, lit one at a time; Maths Foundation is chosen */
    // Strictly one subject colour at a time: each card settles fully before
    // the next one lights (the next card lights as it lands).
    const litF = Math.max(prog(t, 3.3, 0.3) * (1 - prog(t, 3.72, 0.2)), prog(t, 7.98, 0.3));
    const litH = prog(t, 3.92, 0.3) * (1 - prog(t, 4.22, 0.2));
    const litE = prog(t, 4.42, 0.3) * (1 - prog(t, 5.3, 0.45));
    const lits = [litF, litH, litE];
    const subjectOut = [8.95, 8.8, 8.8];
    SUBJECTS.forEach((s, i) => {
      const tin = [3.3, 3.8, 4.3][i];
      const scale = i === 0 ? press(t, 7.95) : 1;
      rise(s.el, t, tin, 0.6, subjectOut[i], 0.45, 48, `scale(${scale.toFixed(4)})`);
      const l = lits[i];
      s.el.style.background = mix(COLORS.card, s.tint, 0.62 * l);
      s.el.style.borderColor = mix(COLORS.line, s.hue, l);
      s.badge.style.background = mix(COLORS.muted, s.hue, l);
      s.badge.style.color = mix(COLORS.ink, '#ffffff', l);
      s.go.style.borderColor = mix(COLORS.line, s.hue, l);
      s.go.style.color = mix(COLORS.quiet, s.hue, l);
      const n = NODES[s.node];
      renderNode(n, t, { color: l > 0.02 ? mix(COLORS.ink, s.hue, l) : COLORS.ink, fill: 0.55 + 0.45 * l, pulse: false });
    });
    tap(els.rip1, els.tch1, t, 7.95, 910, 1235);

    /* 9–12 s: today's one step settles onto the trail */
    const pressStart = press(t, 10.95);
    rise(els.today, t, 9.2, 0.7, 11.45, 0.45, 64, `scale(${pressStart.toFixed(4)})`);
    const btnDown = Math.sin(Math.PI * clamp((t - 10.95) / 0.24));
    els.startbtn.style.background = mix(COLORS.indigo, COLORS.indigoInk, 0.35 * btnDown);
    els.startbtn.style.transform = `translateY(${px(2 * btnDown)})`;
    tap(els.rip2, els.tch2, t, 10.95, 590, 2518);
    renderNode(NODES.today, t, { color: COLORS.indigo, fill: 1, pulse: t < 11.5 });
    els.h3.querySelectorAll('.ln').forEach((ln, i) => {
      const a = prog(t, 9.55 + i * 0.14, 0.55, E.out);
      const b = prog(t, 11.35, 0.4, E.inOut);
      setStyle(ln, a * (1 - b), `translateY(${px((1 - a) * 40 - b * 30)})`);
    });

    /* 12–17 s: question, a thoughtful attempt, the worked method */
    rise(els.question, t, 12.0, 0.6, 16.9, 0.5);
    revealHand(els.w1, t, 12.85, 0.6);
    revealHand(els.w2, t, 13.6, 0.4);
    els.circle36.style.strokeDashoffset = `${(100 * (1 - prog(t, 14.3, 0.4, E.soft))).toFixed(2)}`;
    els.circle36.style.opacity = t >= 14.3 ? 1 : 0;
    renderNode(NODES.q, t, { color: COLORS.indigo, fill: 1, pulse: t > 12.15 && t < 14.85 });
    rise(els.method, t, 14.5, 0.6, 16.9, 0.5);
    rise(els.s1, t, 14.8, 0.45, null, 0, 24);
    rise(els.s2, t, 15.3, 0.45, null, 0, 24);
    els.m24.style.backgroundSize = `${(100 * prog(t, 15.1, 0.35, E.soft)).toFixed(2)}% 100%`;
    els.m6.style.backgroundSize = `${(100 * prog(t, 15.6, 0.35, E.soft)).toFixed(2)}% 100%`;
    rise(els.retrychip, t, 16.0, 0.45, null, 0, 20);
    renderNode(NODES.m, t, { color: COLORS.indigo, fill: 1, pulse: t > 14.85 && t < 16.9 });

    /* 17–20 s: loop back to the retry, a small green highlight, SECURE */
    rise(els.retry, t, 17.3, 0.6, null, 0);
    revealHand(els.ans, t, 18.15, 0.4);
    const ok = prog(t, 18.8, 0.3, E.out);
    els.retry.style.borderColor = mix(COLORS.line, COLORS.good, ok);
    els.gm.style.backgroundColor = ok > 0 ? mix(COLORS.card, COLORS.goodWash, ok) : 'transparent';
    const pop = prog(t, 18.8, 0.45, E.spring);
    setStyle(els.correct, clamp((t - 18.8) / 0.15), `scale(${lerp(0.6, 1, pop).toFixed(4)})`);
    renderNode(NODES.retry, t, { color: mix(COLORS.indigo, COLORS.good, ok), fill: 1, pulse: t > 17.75 && t < 19.4 });
    els.h5.querySelectorAll('.ln').forEach((ln, i) => {
      const a = prog(t, 17.45 + i * 0.55, 0.55, E.out);
      const b = prog(t, 20.3, 0.4, E.inOut);
      setStyle(ln, a * (1 - b), `translateY(${px((1 - a) * 40 - b * 30)})`);
    });
    rise(els.mastery, t, 19.05, 0.55, null, 0);
    els.fill.style.width = `${(52 + 28 * prog(t, 19.45, 0.7, E.out)).toFixed(2)}%`;
    const sec = prog(t, 20.1, 0.45, E.spring);
    const secOn = clamp((t - 20.1) / 0.12);
    setStyle(els['st-dev'], 1 - secOn, 'none');
    setStyle(els['st-sec'], secOn, `scale(${lerp(1.35, 1, sec).toFixed(4)}) rotate(${lerp(-5, 0, sec).toFixed(3)}deg)`);
    const secure = prog(t, 20.1, 0.3, E.out);
    renderNode(NODES.secure, t, { color: mix(COLORS.indigo, COLORS.good, secure), fill: 1, pulse: false });

    /* 21–25 s: end card */
    const et = prog(t, 20.5, 0.6, E.soft);
    els.endTrail.mp.setAttribute('stroke-dasharray', `${(els.endTrail.len * et).toFixed(2)} ${els.endTrail.len + 50}`);
    const markS = prog(t, 21.05, 0.55, E.spring);
    setStyle(els.mark, clamp((t - 21.05) / 0.15), `scale(${lerp(0.72, 1, markS).toFixed(4)})`);
    rise(els.brand, t, 21.25, 0.6, null, 0, 40);
    rise(els.soon, t, 21.65, 0.6, null, 0, 32);
    rise(els.thanks, t, 23.1, 0.6, null, 0, 32);

    renderCaptions(t, CAPS);
  }

  /* ---------- boot ---------- */
  const faces = [
    '600 100px Fraunces', 'italic 400 70px Fraunces', 'italic 500 70px Fraunces',
    '400 40px Inter', '500 40px Inter', '600 40px Inter', '700 40px Inter',
    '600 30px "IBM Plex Mono"', '700 30px "IBM Plex Mono"', '600 60px Caveat',
  ];
  window.READY = Promise.all(faces.map((f) => document.fonts.load(f, 'ABCxyz0123456789?')))
    .then(() => document.fonts.ready)
    .then(() => {
      init();
      renderFrame(0);
      window.CAPTIONS = CAPS.map(({ text, rows, in: tin, out, start, end }) => ({ text, rows, in: tin, out, start, end }));
      window.SFX = SFX;
      window.DURATION = DURATION;
      window.renderFrame = renderFrame;
      // Camera speed in px/s: the renderer adds motion blur only while it moves.
      window.motionAt = (tt) => Math.abs(camY(tt + 0.005) - camY(tt - 0.005)) / 0.01;
      const q = new URLSearchParams(location.search);
      if (q.has('guides')) document.body.classList.add('guides');
      if (q.has('t')) renderFrame(parseFloat(q.get('t')));
      return true;
    });
})();
