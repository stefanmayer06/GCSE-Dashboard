// Builds website/design/design-doc.html — the Circuit design document —
// from the live code: graphics are rendered from clients/shared/circuit,
// tokens are read from tokens.css, the explainer table from the library,
// and screens from design/shots/*.jpg (npm run design:shots).
// Run: npm run design:doc   (writes design/design-doc.html and
// design/design-doc.fragment.html, the head-less version for Artifacts).
import { build } from 'esbuild';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const buildDir = path.join(root, 'scripts/art/.build');
mkdirSync(buildDir, { recursive: true });
const outfile = path.join(buildDir, 'doc.mjs');
await build({
  entryPoints: [path.join(root, 'scripts/art/doc-entry.jsx')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  packages: 'external',
  outfile,
  logLevel: 'error',
});
const { DOC } = await import(`${pathToFileURL(outfile).href}?v=${Date.now()}`);

const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- CSS: tokens (with the Artifact-safe dark pattern) + graphics ----------
const tokens = readFileSync(path.join(root, 'clients/shared/circuit/tokens.css'), 'utf8');
const darkMatch = tokens.match(/:root\[data-theme='dark'\] \{([\s\S]*?)\n\}/);
const darkBody = darkMatch ? darkMatch[1] : '';
const base = readFileSync(path.join(root, 'clients/shared/circuit/base.css'), 'utf8');
const graphics = base.slice(base.indexOf('/* @public:start'), base.indexOf('/* @public:end */'))
  + readFileSync(path.join(root, 'clients/shared/circuit/critters.css'), 'utf8');
const tokenCss = `${tokens}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {${darkBody}
  }
}
${graphics}`;

// ---------- Screens ----------
const shotsDir = path.join(root, 'design/shots');
const shots = existsSync(shotsDir)
  ? Object.fromEntries(readdirSync(shotsDir).filter((f) => f.endsWith('.jpg')).map((f) => [f.replace('.jpg', ''), `data:image/jpeg;base64,${readFileSync(path.join(shotsDir, f)).toString('base64')}`]))
  : {};
const shot = (name, caption, cls = '') => (shots[name]
  ? `<figure class="shot ${cls}"><img src="${shots[name]}" alt="${esc(caption)}" /><figcaption>${caption}</figcaption></figure>`
  : `<figure class="shot missing ${cls}"><div class="shot-missing">Run npm run design:shots to capture “${esc(name)}”.</div><figcaption>${caption}</figcaption></figure>`);

// ---------- Content helpers ----------
const HUE_NOTES = {
  blue: 'Foundation · Number',
  cyan: 'Probability · alt',
  purple: 'Higher · Algebra',
  amber: 'Ratio · stars',
  green: 'Geometry · correct',
  coral: 'Statistics · wrong',
  tangerine: 'English · Reading',
  rose: 'Writing',
  volt: 'Rewards · go',
  slate: 'Fallback',
};
const swatches = Object.entries(DOC.hues).map(([name, row]) => `
  <li class="swatch">
    <span class="chip-pair"><i style="background:${row.light}"></i><i style="background:${row.dark}"></i></span>
    <b>--hue-${name}</b>
    <small>${row.light} · ${row.dark}</small>
    <span class="note">${HUE_NOTES[name] || ''}</span>
  </li>`).join('');

const surfaceTokens = [
  ['--c-bg', 'Page ground'], ['--c-surface', 'Cards'], ['--c-surface-2', 'Sunken'], ['--c-ink', 'Text'],
  ['--c-muted', 'Secondary text'], ['--c-line', 'Hairlines'], ['--c-night', 'Rail · heroes · player'], ['--c-primary', 'Main action'],
  ['--c-good', 'Correct (with a tick)'], ['--c-bad', 'Wrong (with a cross)'], ['--c-warn', 'Heads-up'], ['--c-focus', 'Focus ring'],
].map(([token, use]) => `<li class="token"><i style="background:var(${token})"></i><b>${token}</b><small>${use}</small></li>`).join('');

const strandRows = Object.entries(DOC.strands).map(([id, row]) => `
  <tr><td><b>${esc(row.name)}</b><br /><code>${id}</code></td><td><span class="dot" style="background:var(--hue-${row.hue})"></span> ${row.hue}</td><td><span class="dot" style="background:var(--hue-${row.alt})"></span> ${row.alt}</td><td><code>${row.shapes.join(' ')}</code></td><td class="scene-cell">${DOC.art.strandScenes[id]}</td></tr>`).join('');

const emblemRows = Object.entries(DOC.art.emblems).map(([id, stages]) => `
  <div class="emblem-row"><span class="emblem-name">${esc(DOC.strands[id].name)}</span>${stages.map((svg) => `<span class="emblem-cell">${svg}</span>`).join('')}</div>`).join('');

const tiles = DOC.art.tiles.map((tile) => `<figure class="tile-fig">${tile.svg}<figcaption><b>${tile.state}</b></figcaption></figure>`).join('');
const critterRows = DOC.art.critters.map((row) => `
  <div class="critter-row"><span class="emblem-name">${esc(row.family)}<small>${esc(row.track)}</small></span>${row.badges.map((svg, tier) => `<figure class="emblem-cell">${svg}<figcaption>${tier ? esc(row.forms[tier - 1]) : 'Egg'}</figcaption></figure>`).join('')}</div>`).join('');
const pips = DOC.art.pip.map((p) => `<figure class="pip-fig">${p.svg}<figcaption>${p.mood}</figcaption></figure>`).join('');
const icons = DOC.art.icons.map((icon) => `<li>${icon.svg}<small>${icon.name}</small></li>`).join('');

const libraryRows = DOC.library.map((row) => `
  <tr>
    <td><b>${esc(row.title)}</b><br /><code>${esc(row.id)}</code></td>
    <td>${row.subject === 'english' ? 'English' : row.topics.some((t) => /higher|circle|surds|conditional/.test(t)) ? 'Higher' : 'Foundation'}</td>
    <td><code>${row.topics.map(esc).join(', ')}</code></td>
    <td>${row.parts.map(esc).join(' → ')}</td>
    <td>${row.checkpoints.map((k) => `<span class="kind k-${k}">${k}</span>`).join(' ')}${row.sandbox ? ' <span class="kind k-sandbox">sandbox</span>' : ''}</td>
    <td class="num">${Math.floor(row.seconds / 60)}:${String(row.seconds % 60).padStart(2, '0')}</td>
    <td>${row.board}</td>
  </tr>`).join('');

const INSPIRATION = [
  ['Brilliant', 'The isometric level path, bold geometric headlines, a navy night surface with a single lime reward colour, and illustration-led cards.', 'Course map, level tiles, landing hero, subject cards'],
  ['Khan Academy', 'Narrated chalkboard videos you can pause and interrogate, with a transcript and questions woven into the explanation.', 'Explainer player: night board, Kalam annotations, checkpoints, transcript'],
  ['Mimo', 'A game HUD (streak, gems, level), pressable 3D buttons, and progress you can see filling.', 'Rail HUD chips, volt “go” buttons, lesson progress bar, combo meter'],
  ['Shapez', 'Shapes built from four quadrants, stacked in layers, flowing along conveyor belts.', 'Emblem grammar (C R S W quadrants), mastery layers, animated circuit traces'],
  ['Polly', 'A friendly conversational guide that makes a chat feel like a companion rather than a form.', 'Pip, the guide: tutor avatar, checkpoints, empty states, celebrations'],
  ['Duolingo · Credly', 'Collectible achievements that level up, and credential-style badges with a frame, ribbon and rank you would want to show someone.', 'Study creatures: evidence-fed milestones that hatch and evolve Bronze → Silver → Gold → Legend'],
  ['Coursera', 'Units, lessons and a clear sense of where you are in a course.', 'Units as worlds, lesson stages (Watch → Learn → Practise → Master)'],
  ['Substack', 'Calm long-form reading with a serif that invites you to read closely.', 'Literata for English sources, notes and the reader-style lesson column'],
].map(([name, what, where]) => `<tr><td><b>${name}</b></td><td>${what}</td><td>${where}</td></tr>`).join('');

const fragment = `<title>Circuit Design System</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Mono:wght@400;700;800&family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,600;0,800;1,400&family=Kalam:wght@400;700&family=Literata:ital,wght@0,400;0,700;1,400&family=Unbounded:wght@500;700;800&display=swap" />
<style>
${tokenCss}
/* ===== Design doc layout (sidebar index + reading column) ===== */
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--c-bg); color: var(--c-ink); font-family: var(--font-ui); font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
a { color: var(--c-ink); text-underline-offset: 3px; }
code { padding: 1px 6px; border-radius: 6px; background: var(--c-surface-3); font-family: var(--font-mono); font-size: 0.86em; }
.doc { display: grid; grid-template-columns: 240px minmax(0, 1fr); max-width: 1320px; margin: 0 auto; padding-inline: 16px; }
.index { position: sticky; top: env(safe-area-inset-top, 0px); align-self: start; max-height: 100vh; overflow-y: auto; padding: 28px 20px 28px 4px; }
.index p { margin: 0 0 10px; color: var(--c-muted); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.index a { display: block; padding: 6px 10px; border-radius: 10px; color: var(--c-ink-2); font-size: 0.9rem; font-weight: 700; text-decoration: none; }
.index a:hover { background: var(--c-surface); }
main { min-width: 0; padding-block: 24px 80px; }
section { padding-block: 34px 10px; scroll-margin-top: 12px; }
h1, h2, h3 { margin: 0; text-wrap: balance; }
h2 { font-family: var(--font-display); font-size: clamp(1.6rem, 1.2rem + 1.4vw, 2.3rem); font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
h3 { margin: 26px 0 10px; font-size: 1.08rem; font-weight: 800; }
.kicker { margin: 0 0 8px; color: var(--c-muted); font-family: var(--font-mono); font-size: 0.74rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.lead { max-width: 68ch; color: var(--c-ink-2); font-size: 1.05rem; }
p { max-width: 70ch; }
.hero { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); align-items: center; gap: 24px; padding: clamp(24px, 4vw, 48px); border-radius: var(--r-xl); background: radial-gradient(60% 70% at 85% 30%, color-mix(in srgb, var(--hue-purple) 38%, transparent), transparent 70%), var(--c-night); color: var(--c-night-ink); }
.hero h1 { color: #fff; font-family: var(--font-display); font-size: clamp(2.6rem, 1.4rem + 5vw, 5rem); font-weight: 800; letter-spacing: -0.04em; line-height: 0.95; }
.hero h1 em { color: var(--hue-volt); font-style: normal; }
.hero p { color: var(--c-night-muted); }
.hero .facts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; padding: 0; list-style: none; }
.hero .facts li { padding: 6px 12px; border: 1px solid var(--c-night-3); border-radius: 999px; font-size: 0.85rem; font-weight: 700; }
.hero .facts b { color: #fff; }
.hero-art svg { width: 100%; height: auto; }
.table-wrap { overflow-x: auto; margin-top: 14px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); }
table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
th, td { padding: 10px 12px; border-bottom: 1px solid var(--c-line); text-align: left; vertical-align: top; }
th { color: var(--c-muted); font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase; }
tr:last-child td { border-bottom: 0; }
td.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.scene-cell svg { width: 120px; height: auto; }
.dot { display: inline-block; width: 12px; height: 12px; border: 2px solid var(--emblem-line); border-radius: 3px; vertical-align: -1px; transform: rotate(45deg); }
.principles { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; margin: 16px 0 0; padding: 0; list-style: none; }
.principles li { padding: 16px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); }
.principles b { display: block; margin-bottom: 4px; font-family: var(--font-display); font-weight: 700; }
.swatches, .tokens { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; margin: 14px 0 0; padding: 0; list-style: none; }
.swatch, .token { display: grid; gap: 2px; padding: 12px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); }
.swatch b, .token b { font-family: var(--font-mono); font-size: 0.82rem; }
.swatch small, .token small, .swatch .note { color: var(--c-muted); font-size: 0.78rem; }
.chip-pair { display: flex; margin-bottom: 6px; }
.chip-pair i { width: 50%; height: 44px; border: 1px solid var(--c-line); }
.chip-pair i:first-child { border-radius: 10px 0 0 10px; }
.chip-pair i:last-child { border-radius: 0 10px 10px 0; }
.token i { height: 36px; margin-bottom: 6px; border: 1px solid var(--c-line); border-radius: 10px; }
.type-specimen { display: grid; gap: 12px; margin-top: 14px; }
.face { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 18px; align-items: center; padding: 18px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); }
.face-meta b { display: block; font-size: 0.95rem; }
.face-meta small { color: var(--c-muted); }
.face-sample { min-width: 0; overflow-wrap: anywhere; }
.s-display { font-family: var(--font-display); font-size: clamp(1.8rem, 1.2rem + 2vw, 2.8rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
.s-ui { font-family: var(--font-ui); font-size: 1.15rem; }
.s-mono { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 700; }
.s-read { font-family: var(--font-read); font-size: 1.25rem; }
.s-hand { font-family: var(--font-hand); font-size: 1.5rem; color: var(--hue-tangerine); }
.quads { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
.quad { display: grid; justify-items: center; gap: 6px; padding: 14px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); text-align: center; }
.quad svg { width: 70px; height: 70px; }
.quad small { color: var(--c-muted); }
.emblem-grid { display: grid; gap: 6px; margin-top: 14px; padding: 14px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); overflow-x: auto; }
.emblem-row { display: grid; grid-template-columns: 170px repeat(5, 72px); align-items: center; gap: 8px; min-width: 560px; }
.emblem-head { font-family: var(--font-mono); font-size: 0.7rem; font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: 0.06em; text-align: center; }
.emblem-name { font-weight: 800; font-size: 0.9rem; }
.emblem-cell { display: grid; place-items: center; }
.critter-grid { display: grid; gap: 10px; margin-top: 14px; padding: 14px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); overflow-x: auto; }
.critter-row { display: grid; grid-template-columns: 150px repeat(5, 100px); align-items: center; gap: 8px; min-width: 670px; }
.critter-row small { display: block; color: var(--c-muted); font-family: var(--font-mono); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.critter-row figure { margin: 0; }
.critter-row figcaption { color: var(--c-muted); font-family: var(--font-mono); font-size: 0.7rem; text-align: center; }
.gallery { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 14px; padding: 16px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); }
.gallery figure { margin: 0; text-align: center; }
.gallery figcaption { color: var(--c-muted); font-family: var(--font-mono); font-size: 0.78rem; }
.icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; margin: 14px 0 0; padding: 0; list-style: none; }
.icon-grid li { display: grid; justify-items: center; gap: 6px; padding: 14px 6px; border-radius: var(--r-sm); background: var(--c-surface); color: var(--c-ink); --icon-accent: var(--hue-blue); }
.icon-grid small { color: var(--c-muted); font-family: var(--font-mono); font-size: 0.7rem; }
.scenes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
.scenes figure { margin: 0; padding: 12px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); }
.scenes figcaption { color: var(--c-muted); font-size: 0.85rem; text-align: center; }
.demo { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 14px; padding: 18px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); }
.demo.night { background: var(--c-night); border-color: var(--c-night); }
.demo-label { width: 100%; margin: 0; color: var(--c-muted); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.demo.night .demo-label { color: var(--c-night-muted); }
.b { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 10px 20px; border: 2px solid var(--c-line-strong); border-radius: 999px; background: var(--c-surface); color: var(--c-ink); font: inherit; font-weight: 800; }
.b.primary { border-color: var(--c-primary); background: var(--c-primary); color: var(--c-on-primary); }
.b.go { border-color: var(--emblem-line); background: var(--hue-volt); color: var(--volt-ink); box-shadow: 0 4px 0 var(--emblem-line); transform: translateY(-2px); }
.choice-demo { display: flex; align-items: center; gap: 12px; min-width: 190px; min-height: 54px; padding: 10px 14px; border: 2px solid var(--c-line-strong); border-radius: var(--r-md); background: var(--c-surface); box-shadow: 0 4px 0 var(--c-line-strong); font-weight: 700; }
.choice-demo.sel { border-color: var(--hue-blue); background: color-mix(in srgb, var(--hue-blue) 10%, var(--c-surface)); box-shadow: 0 4px 0 var(--hue-blue); }
.choice-demo span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: var(--c-surface-3); font-family: var(--font-mono); font-size: 0.8rem; }
.fb { padding: 10px 14px; border-radius: var(--r-sm); font-weight: 700; }
.fb.right { background: var(--c-good-wash); color: var(--c-good); }
.fb.wrong { background: var(--c-bad-wash); color: var(--c-bad); }
.combo { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border: 2px solid var(--emblem-line); border-radius: 999px; background: var(--hue-amber); color: var(--emblem-line); box-shadow: 0 3px 0 var(--emblem-line); font-weight: 800; }
.v-stage { padding: 2px 10px; border-radius: 999px; font-family: var(--font-mono); font-size: 0.72rem; font-weight: 800; background: var(--c-surface-3); }
.v-stage.m { background: var(--hue-volt); color: var(--volt-ink); }
.v-stage.s { background: color-mix(in srgb, var(--hue-green) 18%, var(--c-surface)); color: var(--c-good); }
.shots { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 14px; }
.shot { margin: 0; }
.shot img { display: block; width: 100%; height: auto; border: 1px solid var(--c-line); border-radius: var(--r-md); box-shadow: var(--sh-2); }
.shot.wide { grid-column: 1 / -1; }
.shot.phone img { max-width: 300px; margin: 0 auto; }
.shot figcaption { margin-top: 8px; color: var(--c-ink-2); font-size: 0.88rem; }
.shot-missing { padding: 40px 16px; border: 2px dashed var(--c-line-strong); border-radius: var(--r-md); color: var(--c-muted); text-align: center; }
.anatomy { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; margin: 14px 0 0; padding: 0; list-style: none; counter-reset: a; }
.anatomy li { padding: 14px 16px 14px 52px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); position: relative; }
.anatomy li::before { counter-increment: a; content: counter(a); position: absolute; left: 14px; top: 14px; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; background: var(--c-night); color: var(--hue-volt); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 800; }
pre { margin: 14px 0 0; padding: 16px; overflow-x: auto; border-radius: var(--r-md); background: var(--c-night); color: var(--c-night-ink); font-family: var(--font-mono); font-size: 0.82rem; line-height: 1.55; }
pre .c { color: var(--c-night-muted); }
pre .k { color: var(--hue-volt); }
.kind { display: inline-block; margin: 1px 0; padding: 1px 8px; border-radius: 999px; background: var(--c-surface-3); font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; }
.k-choice { background: color-mix(in srgb, var(--hue-blue) 16%, var(--c-surface)); }
.k-number { background: color-mix(in srgb, var(--hue-amber) 22%, var(--c-surface)); }
.k-tap { background: color-mix(in srgb, var(--hue-tangerine) 20%, var(--c-surface)); }
.k-slider { background: color-mix(in srgb, var(--hue-cyan) 20%, var(--c-surface)); }
.k-sandbox { background: var(--hue-volt); color: var(--volt-ink); }
.pill-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.pill-list code { background: var(--c-surface); border: 1px solid var(--c-line); }
.two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.card { padding: 16px 18px; border: 1px solid var(--c-line); border-radius: var(--r-md); background: var(--c-surface); }
.card h3 { margin-top: 0; }
.card ul { margin: 6px 0 0; padding-left: 18px; }
footer { margin-top: 40px; padding-top: 18px; border-top: 1px solid var(--c-line); color: var(--c-muted); font-size: 0.85rem; }
@media (max-width: 980px) {
  .doc { display: block; }
  .index { position: static; display: flex; flex-wrap: wrap; gap: 4px; max-height: none; padding: 16px 0 0; }
  .index p { width: 100%; }
  .hero { grid-template-columns: 1fr; }
  .scenes, .shots, .two { grid-template-columns: 1fr; }
  .face { grid-template-columns: 1fr; }
  .quads { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
</style>

<div class="doc">
  <nav class="index" aria-label="Contents">
    <p>Circuit · v5</p>
    <a href="#direction">Direction</a>
    <a href="#colour">Colour</a>
    <a href="#type">Type</a>
    <a href="#shapes">Shape grammar</a>
    <a href="#tiles">Level tiles</a>
    <a href="#pip">Pip</a>
    <a href="#creatures">Creatures</a>
    <a href="#icons">Icons &amp; scenes</a>
    <a href="#components">Components</a>
    <a href="#screens">Screens</a>
    <a href="#explainers">Explainers</a>
    <a href="#motion">Motion &amp; access</a>
    <a href="#handoff">Handoff</a>
  </nav>
  <main>
    <header class="hero">
      <div>
        <p class="kicker" style="color:var(--hue-volt)">GCSE Study Desk · design system v5</p>
        <h1>Circuit<br /><em>learn · play · replay</em></h1>
        <p>The design language for Maths Foundation, Maths Higher and English Language: every topic is a level you can replay, every explainer stops to ask you something, and every star is earned from marked answers.</p>
        <ul class="facts">
          <li><b>5</b> typefaces</li>
          <li><b>${Object.keys(DOC.hues).length}</b> hue keys</li>
          <li><b>${DOC.elementTypes.length}</b> board primitives</li>
          <li><b>${DOC.library.length}</b> explainers</li>
          <li><b>${DOC.art.icons.length}</b> icons</li>
        </ul>
      </div>
      <div class="hero-art">${DOC.art.hero}</div>
    </header>

    <section id="direction">
      <p class="kicker">Direction</p>
      <h2>Brilliant’s play, Khan’s explaining, Shapez’s shapes</h2>
      <p class="lead">Circuit borrows one idea from each reference and ties them together with a single metaphor: revision as a circuit you build. Topics are components (layered shapes), the map is the board, and practice is the current running through it.</p>
      <div class="table-wrap"><table><thead><tr><th>Reference</th><th>What we took</th><th>Where it lives</th></tr></thead><tbody>${INSPIRATION}</tbody></table></div>
      <h3>Principles</h3>
      <ul class="principles">
        <li><b>Earned, never faked</b>Stars, emblem layers and readiness come only from marked answers on the server. Nothing is awarded for opening a page.</li>
        <li><b>One next step</b>Every screen answers “what now?” with one volt button. Everything else is quieter.</li>
        <li><b>Ask before telling</b>Explainers and worked examples make you commit to an answer before the method appears.</li>
        <li><b>Nothing is locked</b>Revision is free-roam. The map suggests a tile with a light beam; it never blocks one.</li>
        <li><b>Never colour alone</b>Right and wrong carry a tick or a cross, stages carry words, tiles carry glyphs.</li>
        <li><b>Calm streaks</b>Rest days pause a streak and freezes protect it. We never shame a learner for a day off.</li>
      </ul>
    </section>

    <section id="colour">
      <p class="kicker">Colour</p>
      <h2>Night ink, lavender paper, one volt reward</h2>
      <p class="lead">Surfaces are cool lavender in light mode and deep night in dark mode. The night colour is also the product’s stage: the rail, heroes, the explainer player and celebrations sit on it in both themes. Volt lime is reserved for “go” and for rewards, so it keeps its meaning.</p>
      <h3>Surface and semantic tokens (live — follow the viewer’s theme)</h3>
      <ul class="tokens">${surfaceTokens}</ul>
      <h3>Hue keys (light · dark)</h3>
      <ul class="swatches">${swatches}</ul>
      <h3>Subjects and strands</h3>
      <p>Each subject owns a hue: Foundation <b style="color:var(--hue-blue)">blue</b>, Higher <b style="color:var(--hue-purple)">purple</b>, English <b style="color:var(--hue-tangerine)">tangerine</b>. Strands and sections own a signature hue, an alternate and a shape vocabulary.</p>
      <div class="table-wrap"><table><thead><tr><th>Strand</th><th>Hue</th><th>Alt</th><th>Shapes</th><th>World scene</th></tr></thead><tbody>${strandRows}</tbody></table></div>
    </section>

    <section id="type">
      <p class="kicker">Type</p>
      <h2>Five faces, each with one job</h2>
      <p class="lead">No default system or “AI” faces. Everything is self-hosted in the apps (Fontsource) and on the public pages (selector/fonts).</p>
      <div class="type-specimen">
        <div class="face"><div class="face-meta"><b>Unbounded</b><small>Display: page titles, level names, the brand. Wide and game-like; used large and sparingly.</small></div><div class="face-sample s-display">Place Value &amp; Ordering</div></div>
        <div class="face"><div class="face-meta"><b>Atkinson Hyperlegible Next</b><small>UI and body, plus every numeral. Designed by the Braille Institute for legibility; its zero never reads as an O.</small></div><div class="face-sample s-ui">Answer 5 questions — 0, 8 and 80 stay distinct. Misses come back for a retry.</div></div>
        <div class="face"><div class="face-meta"><b>Atkinson Hyperlegible Mono</b><small>Labels, answers, formulae, timers and counters.</small></div><div class="face-sample s-mono">a² + b² = c² · 44:59 · 8300/1F</div></div>
        <div class="face"><div class="face-meta"><b>Literata</b><small>Reading: English sources, notes and passages on the board. The Substack moment.</small></div><div class="face-sample s-read">The wind clawed at the shutters, and the old house groaned.</div></div>
        <div class="face"><div class="face-meta"><b>Kalam</b><small>Hand annotation inside explainers and revealed worked methods only.</small></div><div class="face-sample s-hand">divide by the bottom, times by the top</div></div>
      </div>
    </section>

    <section id="shapes">
      <p class="kicker">Shape grammar</p>
      <h2>Every topic is a shape you build</h2>
      <p class="lead">From Shapez: an emblem layer is four quadrants (top-right, bottom-right, bottom-left, top-left), each a circle quarter, square corner, star point or windmill blade in a strand hue. A topic’s first layer is its identity, derived from a hash of its id, so it never changes. Mastery stacks smaller layers on top: the emblem literally builds as marked evidence improves.</p>
      <div class="quads">
        <div class="quad"><svg viewBox="-50 -50 100 100"><path d="M0 0 L0 -40 A40 40 0 0 1 40 0 Z" fill="var(--hue-blue)" stroke="var(--emblem-line)" stroke-width="3.2"/></svg><b>C</b><small>circle quarter</small></div>
        <div class="quad"><svg viewBox="-50 -50 100 100"><path d="M0 0 L0 -36 L36 -36 L36 0 Z" fill="var(--hue-green)" stroke="var(--emblem-line)" stroke-width="3.2"/></svg><b>R</b><small>square corner</small></div>
        <div class="quad"><svg viewBox="-50 -50 100 100"><path d="M0 0 L0 -24 L40 -40 L24 0 Z" fill="var(--hue-cyan)" stroke="var(--emblem-line)" stroke-width="3.2"/></svg><b>S</b><small>star point</small></div>
        <div class="quad"><svg viewBox="-50 -50 100 100"><path d="M0 0 L0 -24 L40 -40 L40 0 Z" fill="var(--hue-purple)" stroke="var(--emblem-line)" stroke-width="3.2"/></svg><b>W</b><small>windmill blade</small></div>
      </div>
      <h3>Mastery stages (rendered from the real component)</h3>
      <div class="emblem-grid">
        <div class="emblem-row"><span></span><span class="emblem-head">new</span><span class="emblem-head">learning</span><span class="emblem-head">developing</span><span class="emblem-head">secure</span><span class="emblem-head">mastered</span></div>
        ${emblemRows}
      </div>
      <p>new = dashed blueprint · learning 1 layer · developing 2 · secure 3 · mastered 4 layers with a rotating volt ring. Thresholds match <code>masteryStage()</code>: 40% developing, 70% secure, 90% over 5+ answers mastered. Stars use the same thresholds (1 · 2 · 3).</p>
    </section>

    <section id="tiles">
      <p class="kicker">Level tiles</p>
      <h2>Isometric level nodes</h2>
      <p class="lead">The Brilliant path tile: a 2:1 rhombus slab with shaded sides and the topic emblem projected onto its top face. Tiles sit on a winding path joined by circuit traces; traces between tiles you have started run like conveyor belts.</p>
      <div class="gallery">${tiles}</div>
      <p><b>current</b> gets a light beam and a “Start/Next” bubble · <b>done</b> shows a tick medallion · <b>mastered</b> turns volt · <b>boss</b> (timed papers) wears a crown.</p>
    </section>

    <section id="pip">
      <p class="kicker">Mascot</p>
      <h2>Pip, the guide</h2>
      <p class="lead">A round volt shape with a quadrant buckle and a star antenna. Pip is the AI tutor’s face and appears at checkpoints, empty states and celebrations — never on dense working screens like the exam hall. Only the eyes and mouth change, so Pip reads at 24px.</p>
      <div class="gallery">${pips}</div>
    </section>

    <section id="creatures">
      <p class="kicker">Milestones</p>
      <h2>Study creatures</h2>
      <p class="lead">Milestones are a collection of eight original creatures. Each one is fed by a single evidence track — day streak, marked answers, timed papers, paper average, topics explored, 3-star topics, notebook mistakes fixed and memory checks — so it hatches and evolves only from real, marked work. Ranks rise Bronze → Silver → Gold → Legend, and the badge frame grows with them: rivets, then wings, then a volt crown and halo.</p>
      <div class="critter-grid">${critterRows}</div>
      <p>Tap a creature to meet it: it reacts, shows its whole evolution line (future forms as silhouettes with their target) and offers the one action that grows it. Evolutions since your last visit replay as a celebration. Built in <code>circuit/Critter.jsx</code>; evidence rules in <code>critters.js</code>.</p>
    </section>

    <section id="icons">
      <p class="kicker">Icons &amp; scenes</p>
      <h2>Drawn for this product</h2>
      <p class="lead">A 24px grid, 2px rounded strokes in <code>currentColor</code>, and exactly one filled accent shape per icon that picks up <code>--icon-accent</code> — an echo of the emblem quadrants. No icon font, no emoji.</p>
      <ul class="icon-grid">${icons}</ul>
      <h3>Subject scenes</h3>
      <div class="scenes">
        <figure>${DOC.art.subjects.maths}<figcaption>Foundation · number factory</figcaption></figure>
        <figure>${DOC.art.subjects['maths-higher']}<figcaption>Higher · parabola wall and wedge</figcaption></figure>
        <figure>${DOC.art.subjects.english}<figcaption>English · open book and quotes</figcaption></figure>
      </div>
      <p>Scenes are built with a tiny isometric kit (<code>iso.js</code>: box, face matrices) and shaded by mixing each hue with the night ink, so they follow the theme with no extra artwork.</p>
    </section>

    <section id="components">
      <p class="kicker">Components</p>
      <h2>Pressable, calm, legible</h2>
      <div class="demo"><p class="demo-label">Buttons — one volt “go” per screen</p><span class="b go">Start today’s revision →</span><span class="b primary">Open Maths Foundation</span><span class="b">Quick · 40 marks</span></div>
      <div class="demo night"><p class="demo-label">Rail HUD</p>${DOC.art.hud}</div>
      <div class="demo"><p class="demo-label">Answer tiles, feedback and streaks</p><span class="choice-demo"><span>A</span>4</span><span class="choice-demo sel"><span>B</span>7</span><span class="fb right">✓ Correct — 28 ÷ 4 = 7</span><span class="fb wrong">✗ Not quite — share 28 into 4 parts</span><span class="combo">3 in a row · on fire</span></div>
      <div class="demo"><p class="demo-label">Progress and reward bits</p>${DOC.art.stars.join('')}${DOC.art.ring}<span style="flex:1;min-width:200px">${DOC.art.segments}</span><span class="v-stage">New</span><span class="v-stage s">Secure</span><span class="v-stage m">Mastered</span></div>
      <div class="demo"><p class="demo-label">Streak week</p><span style="width:min(100%,320px)">${DOC.art.week}</span></div>
    </section>

    <section id="screens">
      <p class="kicker">Screens</p>
      <h2>The main designs</h2>
      <p class="lead">Captured from the running app with a seeded demo learner. Regenerate with <code>npm run design:shots</code> then <code>npm run design:doc</code>.</p>
      <div class="shots">
        ${shot('landing', '<b>Landing.</b> Night hero with the circuit island, scene-led subject cards, “how it plays” and the live worked example.')}
        ${shot('login', '<b>Sign in.</b> Illustrated stage on the left, a calm form card on the right; the stage becomes a header on phones.')}
        ${shot('home-light', '<b>Home (light).</b> A bento board: the up-next hero with the lesson’s own tile, streak week and level ring beside it.')}
        ${shot('home-dark', '<b>Home (dark).</b> Same grid and type; dark is its own palette, not an inversion.')}
        ${shot('map', '<b>Course map.</b> Units as worlds with a scene banner and star meter; tiles show emblem layers, ticks and stars.')}
        ${shot('lesson', '<b>Lesson.</b> Sticky lesson HUD, emblem, and the four stage chips: Watch, Learn, Practise, Master.')}
        ${shot('explainer', '<b>Explainer checkpoint.</b> The story stops; Pip asks. Captions sit in a strip under the board, never over it.')}
        ${shot('english-explainer', '<b>Tap checkpoint.</b> Words on the board become targets; the prompt sits below so it never hides one.')}
        ${shot('notes', '<b>Notes deck.</b> Numbered idea cards, quadrant bullets, night formula cards and predict-then-reveal examples.')}
        ${shot('exam', '<b>Exam hall.</b> A night timer bar, question grid navigator and a calm question card.')}
        ${shot('english-exam', '<b>English paper (dark).</b> Literata source panel beside game-style choice tiles.', 'wide')}
        ${shot('mobile-home', '<b>Phone.</b> Slim top bar and a bottom tab dock; the hero stacks with its art on top.', 'phone')}
        ${shot('mobile-map', '<b>Phone map.</b> The path narrows its zigzag so labels never overflow.', 'phone')}
      </div>
    </section>

    <section id="explainers">
      <p class="kicker">Interactive explainers</p>
      <h2>Short videos you can talk back to</h2>
      <p class="lead">Explainers are narrated, captioned “videos” rendered live in SVG from a script. Because the board is live, a learner can pause and play with it, and the story stops at checkpoints until they answer. Every topic has one: ${DOC.library.length} are authored; the rest get an automatic talk-through built from the topic’s notes.</p>
      <ol class="anatomy">
        <li><b>Poster</b> — title, length, parts, checkpoint count, “Watch &amp; play”.</li>
        <li><b>Board</b> — 960×540 SVG stage, night (chalkboard) or paper (whiteboard), with a camera that can zoom.</li>
        <li><b>Checkpoints</b> — choice, number, tap-on-board, slider and reflect. Two tries, then “show me”.</li>
        <li><b>Caption strip</b> — the beat’s words, reserved under the board. Narration uses the device’s voice when available and holds the clock until it finishes.</li>
        <li><b>Scrubber</b> — chapter segments plus checkpoint diamonds (hollow, seen, answered). Keyboard: space, ←/→, J/L, C, M.</li>
        <li><b>Chapters, transcript, sandbox</b> — jump to a part, read everything, or drag live sliders while paused.</li>
      </ol>
      <h3>Script format (pure data)</h3>
      <pre><span class="c">// clients/shared/explainer/library/maths/fractions-of-an-amount.js</span>
export default {
  id: <span class="k">'fractions-of-an-amount'</span>, topics: [<span class="k">'fractions'</span>], hue: <span class="k">'blue'</span>, board: <span class="k">'night'</span>,
  title: <span class="k">'Fractions of an amount'</span>,
  scenes: [{
    id: <span class="k">'question'</span>, title: <span class="k">'What it asks'</span>,
    beats: [
      { say: <span class="k">'Picture twenty-eight as one long bar.'</span>,
        add: [{ id: <span class="k">'bar'</span>, type: <span class="k">'bar'</span>, x: 150, y: 225, w: 640, h: 84, parts: 1, total: 28, anim: <span class="k">'slide'</span> }] },
      { say: <span class="k">'The bottom number tells us how many equal parts.'</span>, set: [{ id: <span class="k">'bar'</span>, parts: 4, tween: 1.6 }] },
      { ask: { kind: <span class="k">'choice'</span>, prompt: <span class="k">'How much goes into each part?'</span>, options: [<span class="k">'4'</span>, <span class="k">'7'</span>, <span class="k">'12'</span>], answer: <span class="k">'7'</span> } },
    ],
  }],
};</pre>
      <h3>Board primitives</h3>
      <div class="pill-list">${DOC.elementTypes.map((t) => `<code>${t}</code>`).join('')}</div>
      <h3>Library</h3>
      <div class="table-wrap"><table><thead><tr><th>Explainer</th><th>Course</th><th>Topics</th><th>Parts</th><th>Checkpoints</th><th>Length</th><th>Board</th></tr></thead><tbody>${libraryRows}</tbody></table></div>
      <p>Length is the narrated running time before checkpoints. <code>npm run explainers:check</code> validates every script (ids, targets, answers) without a browser.</p>
    </section>

    <section id="motion">
      <p class="kicker">Motion &amp; accessibility</p>
      <h2>Motion that explains, never decorates</h2>
      <div class="two">
        <div class="card"><h3>Motion</h3><ul><li>140 / 240 / 420 / 700 ms steps; out-cubic for UI, a gentle spring for rewards.</li><li>One celebratory moment per success: the emblem tier springs in, confetti made of quadrants bursts once.</li><li>Traces move like belts only between started tiles.</li><li><code>prefers-reduced-motion</code>: animations collapse to a frame, explainer tweens snap to their end state, confetti is hidden.</li></ul></div>
        <div class="card"><h3>Accessibility</h3><ul><li>Atkinson Hyperlegible for all UI text and numbers.</li><li>Every state carries text or a glyph as well as colour.</li><li>Explainers: captions on by default, full transcript, keyboard shortcuts, tap targets reachable with Tab + Enter.</li><li>44px touch targets; visible focus rings in both themes; the rail keeps its accessible nav names on every breakpoint.</li></ul></div>
      </div>
    </section>

    <section id="handoff">
      <p class="kicker">Handoff</p>
      <h2>Extending Circuit to a new subject</h2>
      <div class="two">
        <div class="card"><h3>Where things live</h3><ul>
          <li><code>clients/shared/circuit/</code> — tokens, CSS, palette + shape grammar, Emblem, IsoTile, Icon, Pip, Scenes, Critter.</li>
          <li><code>clients/shared/explainer/</code> — engine, primitives, player, narration, autoscript, library.</li>
          <li><code>clients/shared/AppShell.jsx</code>, <code>TodayHome.jsx</code>, <code>CourseMap.jsx</code>, <code>LessonKit.jsx</code>, <code>PracticeKit.jsx</code>, <code>CreaturesPage.jsx</code>, <code>MePage.jsx</code>, <code>PipChat.jsx</code>.</li>
          <li><code>selector/</code> — public pages; <code>art.js</code> and <code>circuit-public.css</code> are generated.</li>
          <li><code>/&lt;subject&gt;/lab</code> — the live graphics lab.</li>
        </ul></div>
        <div class="card"><h3>Commands</h3><ul>
          <li><code>npm run explainers:check</code> — validate scripts.</li>
          <li><code>npm run art:export</code> — sync graphics + tokens to the public pages.</li>
          <li><code>npm run design:shots</code> — recapture screens (app running).</li>
          <li><code>npm run design:doc</code> — rebuild this page.</li>
        </ul><p>Guides: <code>website/design/DESIGN.md</code>, <code>GRAPHICS.md</code>, <code>VIDEO_AUTHORING.md</code>, <code>NEW_SUBJECT.md</code>.</p></div>
      </div>
      <footer>Generated from the code by <code>scripts/build-design-doc.mjs</code>. GCSE Study Desk is an independent revision tool, not affiliated with AQA.</footer>
    </section>
  </main>
</div>
`;

const full = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
${fragment.slice(0, fragment.indexOf('<div class="doc">'))}
</head>
<body>
${fragment.slice(fragment.indexOf('<div class="doc">'))}
</body>
</html>
`;

mkdirSync(path.join(root, 'design'), { recursive: true });
writeFileSync(path.join(root, 'design/design-doc.html'), full);
writeFileSync(path.join(root, 'design/design-doc.fragment.html'), fragment);
console.log(`Wrote design/design-doc.html (${Math.round(full.length / 1024)} KB, ${Object.keys(shots).length} screens).`);
