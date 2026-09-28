// Auto talk-through — turns a topic's existing notes into a short narrated
// explainer on the paper board, so EVERY lesson has something to watch
// even before a bespoke script is authored. Authored scripts in
// library/<subject>/ always win over this fallback.
//
// Notes grammar (server topics.js): { t: 'p', text } paragraph,
// { t: 'b', items } bullets, { t: 'f', title, text } formula/framework,
// { t: 'e', q, a } worked example.

import { strandInfo } from '../circuit/palette.js';

const MAX_BULLETS = 5;

function sizeFor(text) {
  const length = String(text).length;
  if (length > 340) return 23;
  if (length > 240) return 26;
  if (length > 150) return 29;
  return 33;
}

function trimSay(text, limit = 260) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

function formulaLines(text) {
  return String(text)
    .split(/\s{2,}·\s{2,}|\s·\s|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function autoScript(topic, { subject = 'maths' } = {}) {
  if (!topic?.notes?.length) return null;
  const strand = topic.strand || topic.section || null;
  const info = strandInfo(strand);
  const hue = info.hue;
  const english = subject === 'english';
  const scenes = [];
  let live = [];
  let n = 0;
  const nextId = (prefix) => `${prefix}${(n += 1)}`;
  const clear = () => {
    const out = live;
    live = [];
    return out;
  };

  scenes.push({
    id: 'intro',
    title: 'The big idea',
    beats: [
      {
        say: `${topic.name}. Here are the key ideas in about a minute, with a chance to try the worked example yourself.`,
        add: [
          { id: 'emblem', type: 'emblem', x: 480, y: 210, size: 170, topic: topic.id, strand, layers: 2, anim: 'pop', in: 0.9 },
          { id: 'title', type: 'text', x: 480, y: 372, text: topic.name, size: topic.name.length > 30 ? 34 : 44, anim: 'write', in: 1 },
          { id: 'chip', type: 'chip', x: 480, y: 440, text: info.name || (english ? 'English' : 'Maths'), color: hue, anim: 'pop', delay: 0.6 },
        ],
      },
    ],
  });

  // Scenes follow the note order; consecutive notes of the same kind share
  // a chapter. Each note's first beat clears whatever is on the board.
  const TITLES = { p: 'Key idea', b: 'Remember', f: english ? 'Framework' : 'Formula', e: 'Worked example' };
  let examples = 0;
  const pushBeats = (kind, beats) => {
    const last = scenes[scenes.length - 1];
    if (kind !== 'e' && last && last.kind === kind) last.beats.push(...beats);
    else scenes.push({ id: `${kind}-${scenes.length}`, kind, title: TITLES[kind], beats });
  };
  const clearAll = () => ['emblem', 'title', 'chip', ...clear()];

  topic.notes.forEach((note) => {
    if (note.t === 'p') {
      const id = nextId('p');
      pushBeats('p', [{
        say: trimSay(note.text),
        remove: clearAll(),
        add: [{ id, type: 'words', x: 110, y: 120, w: 740, text: note.text, size: sizeFor(note.text), fontKey: english ? 'read' : 'ui', anim: 'fade', in: 0.8 }],
      }]);
      live.push(id);
    } else if (note.t === 'b') {
      const items = (note.items || []).slice(0, MAX_BULLETS);
      const gap = items.length > 4 ? 84 : 96;
      const beats = items.map((item, index) => {
        const id = nextId('b');
        const beat = {
          say: trimSay(item, 200),
          add: [
            { id: `${id}n`, type: 'chip', x: 120, y: 90 + index * gap, text: String(index + 1), color: index % 2 ? info.alt : hue, anim: 'pop' },
            { id, type: 'words', x: 170, y: 90 + index * gap, w: 700, text: item, size: item.length > 90 ? 22 : 26, fontKey: 'ui', anim: 'slide' },
          ],
        };
        if (index === 0) beat.remove = clearAll();
        live.push(id, `${id}n`);
        return beat;
      });
      if (beats.length) pushBeats('b', beats);
    } else if (note.t === 'f') {
      const id = nextId('f');
      const lines = formulaLines(note.text);
      pushBeats('f', [{
        say: `${note.title}. ${trimSay(note.text, 220)}`,
        remove: clearAll(),
        add: [{ id, type: 'card', x: 100, y: 110, w: 760, h: 110 + lines.length * 48, title: String(note.title).toUpperCase(), body: lines.join('\n'), color: hue, size: lines.some((line) => line.length > 36) ? 24 : 30, anim: 'pop' }],
        pulse: [id],
      }]);
      live.push(id);
    } else if (note.t === 'e' && examples < 2) {
      examples += 1;
      const q = nextId('q');
      const a = nextId('a');
      pushBeats('e', [
        {
          say: `Worked example. ${trimSay(note.q, 200)}`,
          remove: clearAll(),
          add: [
            { id: `${q}k`, type: 'chip', x: 190, y: 70, text: 'WORKED EXAMPLE', color: hue, anim: 'pop' },
            { id: q, type: 'words', x: 110, y: 140, w: 740, text: note.q, size: sizeFor(note.q) + 2, fontKey: english ? 'read' : 'ui', anim: 'fade' },
            { id: `${q}p`, type: 'pip', x: 860, y: 450, size: 100, mood: 'think', anim: 'pop', delay: 0.5 },
          ],
        },
        {
          ask: {
            kind: 'reflect',
            prompt: english ? 'Plan your answer first — then compare it with the model.' : 'Have a go on paper first, then reveal the method.',
          },
        },
        {
          say: trimSay(note.a, 300),
          add: [{ id: a, type: 'words', x: 110, y: 300, w: 700, text: note.a, size: Math.min(28, sizeFor(note.a)), fontKey: 'hand', color: 'blue', anim: 'fade', in: 1 }],
          set: [{ id: `${q}p`, mood: 'cheer' }],
        },
      ]);
      live.push(q, a, `${q}k`, `${q}p`);
    }
  });

  scenes.push({
    id: 'wrap',
    title: 'Your turn',
    beats: [
      {
        say: 'That is the core of it. Now lock it in with a few practice questions — they come back later if any trip you up.',
        remove: clear(),
        add: [
          { id: 'end-emblem', type: 'emblem', x: 480, y: 220, size: 150, topic: topic.id, strand, layers: 3, anim: 'pop' },
          { id: 'end-text', type: 'text', x: 480, y: 380, text: 'Now: practise', size: 40, anim: 'write' },
          { id: 'end-pip', type: 'pip', x: 820, y: 430, size: 110, mood: 'cheer', anim: 'pop' },
        ],
      },
    ],
  });

  return {
    id: `auto-${topic.id}`,
    auto: true,
    topics: [topic.id],
    title: `${topic.name}: the talk-through`,
    summary: 'A narrated walk through the key notes, with a worked example to try before the reveal.',
    hue,
    board: 'paper',
    scenes,
  };
}
