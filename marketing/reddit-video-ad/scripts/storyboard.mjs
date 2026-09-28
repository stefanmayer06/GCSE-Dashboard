// Build out/storyboard.png: twelve stills from the ad with timecodes, the
// on-screen text and the voiceover for each beat. Stills are rendered from
// src/ad.html at the listed times, so the board always matches the video.
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BEATS = [
  [0.0, '01 · Hook', 'Revision notes on warm paper.', 'On screen: WHAT SHOULD I REVISE NEXT?', 'VO: “Not sure what to revise next?”'],
  [2.2, '01 · The trail forms', 'A clear trail of dots draws through the pile.', '', ''],
  [4.4, '02 · Three subjects', 'Cards rise in sequence, one subject colour at a time.', '', 'VO: “GCSE Study Desk helps you find one useful next step.”'],
  [8.2, '03 · Choose', 'A tap on Maths Foundation; the trail turns indigo.', '', 'VO: “Choose Maths Foundation, Maths Higher, or English.”'],
  [10.4, '03 · Today', 'The Today card settles onto the trail; the learner taps Start.', 'On screen: ONE STEP IS ENOUGH TODAY.', ''],
  [13.9, '04 · Practise', 'Exam-style question and a thoughtful handwritten attempt.', '', 'VO: “Practise exam-style questions,”'],
  [16.2, '04 · Worked method', 'The slip is circled; a calm method card explains it. No red.', '', 'VO: “see a worked method, and revisit mistakes as you learn.”'],
  [17.7, '05 · Loop back', 'The trail curls back to a retry point a day later.', 'On screen: LEARN IT.', ''],
  [19.2, '05 · Retry', 'Correct this time: a small green highlight.', 'On screen: COME BACK TO IT. MAKE IT STICK.', ''],
  [20.2, '05 · Secure', 'Progress fills and the stage stamps to SECURE.', '', ''],
  [22.4, '06 · End card', 'Trail ends at the SD mark. Dashed pill = not yet.', 'On screen: GCSE STUDY DESK · APP & NEW FEATURES COMING SOON', 'VO: “App and new features coming soon.”'],
  [24.6, '06 · Sign-off', 'Hold on the brand.', 'On screen: Thanks for being here.', 'VO: “Thanks for being here.”'],
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const ad = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await ad.goto(pathToFileURL(path.join(root, 'src', 'ad.html')).href);
await ad.evaluate(() => window.READY);
const stills = [];
for (const [t] of BEATS) {
  await ad.evaluate((tt) => window.renderFrame(tt), t);
  stills.push((await ad.screenshot({ type: 'png' })).toString('base64'));
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const panels = BEATS.map(([t, title, action, onscreen, vo], i) => `
  <figure>
    <img src="data:image/png;base64,${stills[i]}" alt="">
    <figcaption>
      <span class="tc">${t.toFixed(1).padStart(4, '0')} s</span>
      <b>${esc(title)}</b>
      <span>${esc(action)}</span>
      ${onscreen ? `<span class="os">${esc(onscreen)}</span>` : ''}
      ${vo ? `<span class="vo">${esc(vo)}</span>` : ''}
    </figcaption>
  </figure>`).join('');

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<link rel="stylesheet" href="${pathToFileURL(path.join(root, 'src', 'fonts', 'fonts.css')).href}">
<style>
  body { margin: 0; background: #f7f4ec; color: #191c17; font: 16px/1.45 Inter, sans-serif; }
  main { width: 1560px; padding: 48px 56px 56px; }
  h1 { font: 600 44px/1.05 Fraunces, Georgia, serif; font-variation-settings: 'SOFT' 70, 'WONK' 1; margin: 0 0 6px; }
  p.sub { margin: 0 0 32px; color: #5b6055; }
  .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 28px 22px; }
  figure { margin: 0; }
  img { width: 100%; border-radius: 14px; border: 1px solid #d9d3c0; display: block; background: #fff; }
  figcaption { display: grid; gap: 4px; margin-top: 10px; font-size: 13px; }
  .tc { font: 600 11px 'IBM Plex Mono', monospace; letter-spacing: .08em; color: #4338ca; }
  b { font-size: 14px; }
  .os { color: #232058; }
  .vo { color: #5b6055; font-style: italic; }
</style></head><body><main>
  <h1>GCSE Study Desk · Reddit ad · 25 s · 1080×1920</h1>
  <p class="sub">Trailhead style: warm paper, ink, one subject colour at a time. Burned-in captions throughout; all copy sits inside the central 4:5 area.</p>
  <div class="grid">${panels}</div>
</main></body></html>`;
const boardFile = path.join(root, 'build', 'storyboard.html');
fs.writeFileSync(boardFile, html);
const board = await browser.newPage({ viewport: { width: 1560, height: 1000 } });
await board.goto(pathToFileURL(boardFile).href);
await board.evaluate(() => document.fonts.ready);
await board.screenshot({ path: path.join(root, 'out', 'storyboard.png'), fullPage: true });
await browser.close();
console.log('out/storyboard.png');
