// Validates every authored explainer script (pure data) without a browser.
// Run from website/: `npm run explainers:check`. Catches the mistakes that
// make a video silently wrong: unknown element types, set/remove/pulse on
// ids that don't exist yet, duplicate ids, checkpoints without answers,
// choice answers missing from options, tap targets that don't exist, and
// word-tap targets beyond the passage length.
import { CHECKPOINT_KINDS, ELEMENT_TYPES, compile } from '../clients/shared/explainer/engine.js';
import { MATHS_EXPLAINERS } from '../clients/shared/explainer/library/maths/index.js';
import { ENGLISH_EXPLAINERS } from '../clients/shared/explainer/library/english/index.js';

const libraries = { maths: MATHS_EXPLAINERS, english: ENGLISH_EXPLAINERS };
let problems = 0;
const seenScriptIds = new Set();

function fail(script, message) {
  problems += 1;
  console.error(`✗ ${script.id}: ${message}`);
}

for (const [subject, scripts] of Object.entries(libraries)) {
  for (const script of scripts) {
    if (!script.id || seenScriptIds.has(script.id)) fail(script, 'missing or duplicate script id');
    seenScriptIds.add(script.id);
    if (!Array.isArray(script.topics) || !script.topics.length) fail(script, 'needs a non-empty topics array');
    if (!script.title) fail(script, 'needs a title');
    const live = new Map(); // id -> element
    const everyId = new Set();
    for (const scene of script.scenes || []) {
      for (const control of scene.play || []) {
        if (!control.id || !control.prop) fail(script, `scene ${scene.id}: play control needs id + prop`);
      }
      for (const beat of scene.beats || []) {
        if (beat.ask) {
          const ask = beat.ask;
          if (!CHECKPOINT_KINDS.includes(ask.kind)) fail(script, `unknown checkpoint kind "${ask.kind}"`);
          if (!ask.prompt) fail(script, 'checkpoint without a prompt');
          if (ask.kind !== 'reflect' && (ask.answer == null || ask.answer === '')) fail(script, `checkpoint "${ask.prompt}" has no answer`);
          if (ask.kind === 'choice') {
            const answers = Array.isArray(ask.answer) ? ask.answer : [ask.answer];
            for (const answer of answers) if (!(ask.options || []).map(String).includes(String(answer))) fail(script, `choice answer "${answer}" is not one of the options`);
          }
          if (ask.kind === 'tap') {
            for (const target of ask.targets || []) {
              const [id, word] = String(target).split(':');
              const el = live.get(id);
              if (!el) fail(script, `tap target "${target}" is not on the board at that point`);
              else if (word != null) {
                const count = String(el.text || '').split(/\s+/).filter(Boolean).length;
                if (Number(word) >= count) fail(script, `tap target "${target}" is beyond the ${count}-word passage`);
              }
            }
            const answers = Array.isArray(ask.answer) ? ask.answer : [ask.answer];
            for (const answer of answers) if (!(ask.targets || []).includes(answer)) fail(script, `tap answer "${answer}" is not in targets`);
          }
          if (ask.kind === 'slider') {
            if (!ask.bind?.id || !ask.bind?.prop) fail(script, 'slider checkpoint needs bind { id, prop }');
            else if (!live.has(ask.bind.id)) fail(script, `slider binds to "${ask.bind.id}" which is not on the board`);
          }
          continue;
        }
        if (!beat.say && !beat.dur) fail(script, `scene ${scene.id}: beat with no "say" needs an explicit dur`);
        for (const id of beat.remove || []) {
          if (!live.has(id)) fail(script, `remove "${id}" before it exists (or twice)`);
          live.delete(id);
        }
        for (const el of beat.add || []) {
          if (!ELEMENT_TYPES.includes(el.type)) fail(script, `unknown element type "${el.type}" (${el.id})`);
          if (everyId.has(el.id)) fail(script, `duplicate element id "${el.id}"`);
          everyId.add(el.id);
          live.set(el.id, { ...el });
        }
        for (const change of beat.set || []) {
          if (!live.has(change.id)) fail(script, `set "${change.id}" which is not on the board`);
          else Object.assign(live.get(change.id), change);
        }
        for (const id of beat.pulse || []) if (!live.has(id)) fail(script, `pulse "${id}" which is not on the board`);
      }
    }
    for (const scene of script.scenes || []) {
      for (const control of scene.play || []) if (!everyId.has(control.id)) fail(script, `play control targets unknown element "${control.id}"`);
    }
    const compiled = compile(script);
    const minutes = (compiled.duration / 60).toFixed(1);
    console.log(`✓ ${subject.padEnd(7)} ${script.id.padEnd(28)} ${String(compiled.chapters.length).padStart(2)} parts ${String(compiled.checkpoints.length).padStart(2)} checkpoints ~${minutes} min`);
  }
}

if (problems) {
  console.error(`\n${problems} problem(s) found.`);
  process.exit(1);
}
console.log(`\nAll ${seenScriptIds.size} explainers valid.`);
