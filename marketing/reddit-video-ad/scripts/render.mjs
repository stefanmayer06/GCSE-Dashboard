// Capture every frame of src/ad.html and encode the silent picture track.
//
//   node scripts/render.mjs            -> build/video.mp4, build/sfx.json,
//                                         build/captions.json, out/captions.srt
//
// Frames are captured at exact timestamps, so the render is deterministic and
// independent of machine speed. While the camera scrolls, each output frame
// averages SUBFRAMES captures spread over half a frame interval (a 180-degree
// shutter) for natural motion blur; other frames are captured once. SUBFRAMES=1
// turns blur off for quick drafts.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const FPS = 30;
const SUBFRAMES = Number(process.env.SUBFRAMES || 4);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const build = path.join(root, 'build');
const out = path.join(root, 'out');
fs.mkdirSync(build, { recursive: true });
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('[pageerror]', e.message); process.exit(1); });
await page.goto(pathToFileURL(path.join(root, 'src', 'ad.html')).href);
await page.evaluate(() => window.READY);

const { sfx, captions, duration } = await page.evaluate(() => ({
  sfx: window.SFX, captions: window.CAPTIONS, duration: window.DURATION,
}));
fs.writeFileSync(path.join(build, 'sfx.json'), JSON.stringify(sfx, null, 2));
fs.writeFileSync(path.join(build, 'captions.json'), JSON.stringify(captions, null, 2));

const stamp = (s) => {
  const ms = Math.round(s * 1000);
  const hh = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const mm = String(Math.floor(ms / 60000) % 60).padStart(2, '0');
  const ss = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss},${String(ms % 1000).padStart(3, '0')}`;
};
const srt = captions.map((c, i) => `${i + 1}\n${stamp(c.in)} --> ${stamp(c.out)}\n${c.rows.join('\n')}\n`).join('\n');
fs.writeFileSync(path.join(out, 'captions.srt'), srt);

const frames = Math.round(duration * FPS);
const ffmpeg = spawn('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'image2pipe', '-framerate', String(FPS * SUBFRAMES), '-c:v', 'png', '-i', '-',
  '-vf', [
    ...(SUBFRAMES > 1 ? [`tmix=frames=${SUBFRAMES}`, `select='eq(mod(n\\,${SUBFRAMES})\\,${SUBFRAMES - 1})'`, `setpts=N/${FPS}/TB`] : []),
    'scale=in_range=full:out_range=tv:out_color_matrix=bt709', 'format=yuv420p',
  ].join(','),
  '-r', String(FPS),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-tune', 'animation',
  '-profile:v', 'high', '-level:v', '4.2', '-g', String(FPS * 2), '-bf', '2',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
  '-movflags', '+faststart', '-an',
  path.join(build, 'video.mp4'),
], { stdio: ['pipe', 'inherit', 'inherit'] });
const done = new Promise((resolve, reject) => ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))));

const cdp = await page.context().newCDPSession(page);
const capture = async (t) => {
  await page.evaluate((tt) => window.renderFrame(tt), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  return Buffer.from(data, 'base64');
};
const send = async (png) => {
  if (!ffmpeg.stdin.write(png)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
};

const t0 = Date.now();
let blurred = 0;
for (let f = 0; f < frames; f++) {
  const t = f / FPS;
  const moving = SUBFRAMES > 1 && (await page.evaluate((tt) => window.motionAt(tt), t)) > 120;
  if (moving) {
    blurred++;
    for (let j = 0; j < SUBFRAMES; j++) {
      const offset = (j - (SUBFRAMES - 1) / 2) / (2 * SUBFRAMES * FPS);
      await send(await capture(Math.min(duration - 1e-4, Math.max(0, t + offset))));
    }
  } else {
    const png = await capture(t);
    for (let j = 0; j < SUBFRAMES; j++) await send(png);
  }
  if (f % 150 === 0) console.log(`frame ${f}/${frames}`);
}
ffmpeg.stdin.end();
await done;
await browser.close();
console.log(`rendered ${frames} frames (${blurred} with motion blur) in ${((Date.now() - t0) / 1000).toFixed(1)} s -> build/video.mp4`);
