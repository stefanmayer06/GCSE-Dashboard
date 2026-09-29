// Circuit — subject + strand palette and the shape grammar behind every
// topic emblem. This file is the single source of truth for "what colour /
// shape is this subject, strand or topic?". Adding a subject means adding a
// row to SUBJECTS and its strands to STRANDS — see website/design/NEW_SUBJECT.md.
//
// Shapes follow the Shapez quadrant grammar: every emblem layer is four
// quadrants (top-right, bottom-right, bottom-left, top-left), each one of
//   C circle quarter · R square corner · S star point · W windmill blade
// and each quadrant has a colour key from HUES. Mastery stacks layers.

// Colour keys are shared by emblems, map tiles and video primitives. Each
// hue has a light-theme and dark-theme value; CSS reads the same values via
// the --hue-* custom properties declared in circuit.css.
export const HUES = {
  blue: { light: '#3d6bff', dark: '#6f93ff' },
  cyan: { light: '#10b5c9', dark: '#4fd8e6' },
  purple: { light: '#9b4dff', dark: '#bd8cff' },
  amber: { light: '#f5a300', dark: '#ffc443' },
  green: { light: '#10b777', dark: '#3fdb9c' },
  coral: { light: '#ff5566', dark: '#ff8591' },
  tangerine: { light: '#ff7a2e', dark: '#ff9d61' },
  rose: { light: '#f0468a', dark: '#ff7fb0' },
  volt: { light: '#c3f53c', dark: '#d4ff5c' },
  slate: { light: '#8b90b3', dark: '#6d7299' },
};

export const SUBJECTS = {
  maths: {
    id: 'maths',
    name: 'Maths Foundation',
    short: 'Foundation',
    hue: 'blue',
    glyph: 'F',
    illustration: 'foundation',
  },
  'maths-higher': {
    id: 'maths-higher',
    name: 'Maths Higher',
    short: 'Higher',
    hue: 'purple',
    glyph: 'H',
    illustration: 'higher',
  },
  english: {
    id: 'english',
    name: 'English Language',
    short: 'English',
    hue: 'tangerine',
    glyph: 'E',
    illustration: 'english',
  },
};

// Strand/section → hues + the shape vocabulary its emblems draw from. The
// first shape is the strand's signature: it appears most often.
export const STRANDS = {
  // Maths (shared by Foundation + Higher)
  number: { hue: 'blue', alt: 'cyan', shapes: ['C', 'C', 'R'], scene: 'number', name: 'Number' },
  algebra: { hue: 'purple', alt: 'blue', shapes: ['W', 'W', 'C'], scene: 'algebra', name: 'Algebra' },
  ratio: { hue: 'amber', alt: 'coral', shapes: ['C', 'R', 'W'], scene: 'ratio', name: 'Ratio & Proportion' },
  geometry: { hue: 'green', alt: 'cyan', shapes: ['R', 'S', 'R'], scene: 'geometry', name: 'Geometry & Measures' },
  probability: { hue: 'cyan', alt: 'purple', shapes: ['S', 'C', 'S'], scene: 'probability', name: 'Probability' },
  statistics: { hue: 'coral', alt: 'amber', shapes: ['R', 'R', 'W'], scene: 'statistics', name: 'Statistics' },
  // English Language
  reading: { hue: 'tangerine', alt: 'amber', shapes: ['C', 'S', 'C'], scene: 'reading', name: 'Reading skills' },
  writing: { hue: 'rose', alt: 'purple', shapes: ['W', 'R', 'W'], scene: 'writing', name: 'Writing skills' },
};

export const FALLBACK_STRAND = { hue: 'slate', alt: 'blue', shapes: ['C', 'R', 'S', 'W'], scene: 'number', name: 'Topic' };

export function strandInfo(strandId) {
  return STRANDS[strandId] || FALLBACK_STRAND;
}

export function hueValue(hue, theme = 'light') {
  const row = HUES[hue] || HUES.slate;
  return theme === 'dark' ? row.dark : row.light;
}

// CSS custom-property reference for a hue, so components follow the
// active theme without re-rendering: `var(--hue-blue)`.
export function hueVar(hue) {
  return `var(--hue-${HUES[hue] ? hue : 'slate'})`;
}

export function subjectFromPath(pathname = typeof window !== 'undefined' ? window.location.pathname : '') {
  if (pathname.startsWith('/maths-higher')) return 'maths-higher';
  if (pathname.startsWith('/english')) return 'english';
  return 'maths';
}

// Small, stable string hash (FNV-1a) so a topic always draws the same shape.
export function hashString(value) {
  let hash = 0x811c9dc5;
  const text = String(value ?? '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function pick(list, seed) {
  return list[seed % list.length];
}

// A layer code is four quadrants, e.g. [{ s: 'C', h: 'blue' }, …].
// Layer 0 is the topic's identity; higher layers are the rewards that
// appear as mastery grows, so they are seeded by topic + layer index.
export function emblemLayers(topicId, strandId, count = 4) {
  const strand = strandInfo(strandId);
  const layers = [];
  for (let layer = 0; layer < count; layer += 1) {
    const seed = hashString(`${topicId}:${layer}`);
    const quads = [];
    for (let quad = 0; quad < 4; quad += 1) {
      const qSeed = (seed >>> (quad * 5)) + quad * 7 + layer * 3;
      const shape = pick(strand.shapes, qSeed);
      const hueSeed = (seed >>> (quad * 3 + 1)) % 5;
      // Signature hue dominates layer 0; upper layers mix in the alt hue
      // and — at the crown — the reward volt.
      let hue = hueSeed < 3 ? strand.hue : strand.alt;
      if (layer === 3 && quad % 2 === 0) hue = 'volt';
      quads.push({ s: shape, h: hue });
    }
    // Symmetry keeps emblems legible at 24px: mirror opposite quadrants
    // on odd seeds.
    if (seed % 2 === 1) {
      quads[2] = { ...quads[0] };
      quads[3] = { ...quads[1] };
    }
    layers.push(quads);
  }
  return layers;
}

// Mastery → how many emblem layers are "built". New topics show a
// blueprint (outline) of layer 0 — Shapez's ghost-shape idea.
export function layersForStage(stageId) {
  switch (stageId) {
    case 'mastered': return 4;
    case 'secure': return 3;
    case 'developing': return 2;
    case 'learning':
    case 'revision': return 1;
    default: return 0;
  }
}

// Stars are replay targets derived only from marked evidence on the
// server (topic accuracy + answers), never stored separately.
export function starsFor(accuracy, answered = 0) {
  if (accuracy == null || !answered) return 0;
  if (accuracy >= 90 && answered >= 5) return 3;
  if (accuracy >= 70) return 2;
  if (accuracy >= 40) return 1;
  return 0;
}
