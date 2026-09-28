// Explainer engine — compiles a declarative script into a scrubbable
// timeline and evaluates the stage at any time t (seconds).
//
// A script is DATA (see website/design/VIDEO_AUTHORING.md):
//   { id, title, summary, hue, board, scenes: [{ id, title, play?, beats: [...] }] }
// A beat is one narrated step:
//   { say, dur?, add?: [element], set?: [{ id, ...props }], remove?: [id],
//     camera?: { x, y, w, h } | 'reset', pulse?: [id], wait?: seconds }
// or a checkpoint that pauses the video until the learner answers:
//   { ask: { kind: 'choice' | 'number' | 'tap' | 'slider', prompt, ... } }
//
// Evaluation is a pure function of t, so play, pause, scrub, replay and
// reduced motion all share one code path.

export const STAGE_W = 960;
export const STAGE_H = 540;
export const DEFAULT_CAMERA = { x: 0, y: 0, w: STAGE_W, h: STAGE_H };

const ENTER_DUR = 0.6;
const TWEEN_DUR = 0.8;
const EXIT_DUR = 0.35;

export function estimateDuration(text = '') {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  // ~2.5 words per second at rate 1, plus a breath.
  return Math.max(2.2, words / 2.5 + 0.8);
}

export const ease = {
  linear: (p) => p,
  out: (p) => 1 - (1 - p) ** 3,
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2),
  spring: (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    return 1 - Math.cos(p * Math.PI * 4.5) * Math.exp(-p * 6);
  },
};

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function lerp(a, b, p) {
  return a + (b - a) * p;
}

// Interpolate two prop values. Numbers tween, same-length numeric arrays
// tween element-wise, arrays of objects tween their numeric fields, and
// everything else switches at the halfway point.
export function mix(a, b, p) {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, p);
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    return a.map((value, index) => mix(value, b[index], p));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const out = { ...b };
    for (const key of Object.keys(b)) if (key in a) out[key] = mix(a[key], b[key], p);
    return out;
  }
  return p < 0.5 ? a : b;
}

function normaliseCamera(camera) {
  if (!camera || camera === 'reset') return { ...DEFAULT_CAMERA };
  if (camera.zoom) {
    const w = STAGE_W / camera.zoom;
    const h = STAGE_H / camera.zoom;
    return { x: (camera.cx ?? STAGE_W / 2) - w / 2, y: (camera.cy ?? STAGE_H / 2) - h / 2, w, h };
  }
  return { ...DEFAULT_CAMERA, ...camera };
}

export function compile(script) {
  const elements = new Map(); // id -> { type, born, enterDur, anim, died, keys: [{ t, dur, props, ease }] }
  const beats = [];
  const checkpoints = [];
  const chapters = [];
  const cameraKeys = [{ t: 0, dur: 0, value: { ...DEFAULT_CAMERA } }];
  const pulses = [];
  let t = 0;

  (script.scenes || []).forEach((scene, sceneIndex) => {
    chapters.push({ id: scene.id || `scene-${sceneIndex}`, title: scene.title || `Part ${sceneIndex + 1}`, t, play: scene.play || null, index: sceneIndex });
    (scene.beats || []).forEach((beat, beatIndex) => {
      if (beat.ask) {
        checkpoints.push({
          id: beat.ask.id || `${scene.id || sceneIndex}-ask-${beatIndex}`,
          t,
          scene: sceneIndex,
          ...beat.ask,
        });
        // The next beat starts just after the checkpoint so its changes
        // (often the answer) never show while the question is open.
        t += 0.05;
        return;
      }
      const start = t + (beat.wait || 0);
      const dur = beat.dur ?? estimateDuration(beat.say);
      for (const el of beat.add || []) {
        const { id, type, anim = 'fade', delay = 0, in: enterDur = ENTER_DUR, ...props } = el;
        elements.set(id, {
          id,
          type,
          anim,
          born: start + delay,
          enterDur,
          died: Infinity,
          keys: [{ t: start + delay, dur: 0, props, ease: 'linear' }],
        });
      }
      for (const change of beat.set || []) {
        const { id, tween = TWEEN_DUR, delay = 0, easing = 'inOut', ...props } = change;
        const target = elements.get(id);
        if (!target) continue;
        target.keys.push({ t: start + delay, dur: tween, props, ease: easing });
      }
      for (const id of beat.remove || []) {
        const target = elements.get(id);
        if (target && target.died === Infinity) target.died = start;
      }
      for (const id of beat.pulse || []) pulses.push({ id, t: start + 0.2 });
      if (beat.camera) cameraKeys.push({ t: start, dur: beat.cameraDur ?? 1.1, value: normaliseCamera(beat.camera) });
      beats.push({ scene: sceneIndex, index: beats.length, t: start, dur, end: start + dur, say: beat.say || '', caption: beat.caption ?? beat.say ?? '' });
      t = start + dur;
    });
  });

  return {
    script,
    duration: t,
    elements: [...elements.values()],
    beats,
    checkpoints,
    chapters,
    cameraKeys,
    pulses,
  };
}

function propsAt(el, time, snap = false) {
  let props = { ...el.keys[0].props };
  for (let index = 1; index < el.keys.length; index += 1) {
    const key = el.keys[index];
    if (time < key.t) break;
    // Under reduced motion (snap) any tween that has started is shown at
    // its end state.
    const p = snap || key.dur <= 0 ? 1 : clamp01((time - key.t) / key.dur);
    const eased = (ease[key.ease] || ease.inOut)(p);
    const next = { ...props };
    for (const [name, value] of Object.entries(key.props)) {
      next[name] = name in props ? mix(props[name], value, eased) : value;
    }
    props = next;
  }
  return props;
}

// Evaluate the stage at time t. `overrides` lets sandbox controls and
// slider checkpoints drive element props live: { [id]: { prop: value } }.
export function frameAt(compiled, time, { overrides = {}, reducedMotion = false } = {}) {
  const items = [];
  for (const el of compiled.elements) {
    if (time < el.born) continue;
    if (time >= el.died + EXIT_DUR) continue;
    const enterRaw = el.enterDur > 0 ? clamp01((time - el.born) / el.enterDur) : 1;
    const enter = reducedMotion ? 1 : enterRaw;
    const exit = el.died === Infinity ? 0 : clamp01((time - el.died) / EXIT_DUR);
    let props = propsAt(el, time, reducedMotion);
    if (overrides[el.id]) props = { ...props, ...overrides[el.id] };
    const pulse = compiled.pulses.find((item) => item.id === el.id && time >= item.t && time < item.t + 1.2);
    items.push({ id: el.id, type: el.type, anim: el.anim, props, enter, exit, pulse: pulse ? (time - pulse.t) / 1.2 : null, age: time - el.born });
  }
  return { items, camera: cameraAt(compiled, time, reducedMotion) };
}

function cameraAt(compiled, time, reducedMotion) {
  let camera = { ...DEFAULT_CAMERA };
  for (const key of compiled.cameraKeys) {
    if (time < key.t) break;
    const p = reducedMotion || key.dur === 0 ? 1 : ease.inOut(clamp01((time - key.t) / key.dur));
    camera = mix(camera, key.value, p);
  }
  return camera;
}

export function beatAt(compiled, time) {
  let current = null;
  for (const beat of compiled.beats) {
    if (time + 1e-6 >= beat.t) current = beat;
    else break;
  }
  return current;
}

export function chapterAt(compiled, time) {
  let current = compiled.chapters[0] || null;
  for (const chapter of compiled.chapters) {
    if (time + 1e-6 >= chapter.t) current = chapter;
  }
  return current;
}

export function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

// Word-wrap helper for passage/words elements (no DOM measuring, so it is
// deterministic and SSR-safe). `charW` is the average glyph width in em.
export function wrapWords(text, maxWidth, size, charW = 0.52) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = [];
  let width = 0;
  const space = size * charW;
  words.forEach((word, index) => {
    const w = word.length * size * charW;
    if (line.length && width + space + w > maxWidth) {
      lines.push(line);
      line = [];
      width = 0;
    }
    line.push({ word, index });
    width += (line.length > 1 ? space : 0) + w;
  });
  if (line.length) lines.push(line);
  return lines;
}

// Answer checking shared by checkpoints.
export function checkAnswer(ask, value) {
  if (value == null || value === '') return false;
  if (ask.kind === 'number' || ask.kind === 'slider') {
    const expected = Number(ask.answer);
    const given = Number(String(value).replace(/[,\s£%]/g, ''));
    if (!Number.isFinite(given)) return String(value).trim().toLowerCase() === String(ask.answer).toLowerCase();
    return Math.abs(given - expected) <= (ask.tolerance ?? 1e-9);
  }
  const accept = Array.isArray(ask.answer) ? ask.answer : [ask.answer];
  return accept.map((item) => String(item).trim().toLowerCase()).includes(String(value).trim().toLowerCase());
}
