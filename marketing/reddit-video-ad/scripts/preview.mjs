// Render selected moments to PNG for review: node scripts/preview.mjs 1.5 4 9.8 [--guides]
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
const guides = args.includes('--guides');
const times = args.filter((a) => !a.startsWith('--')).map(Number);
const outDir = path.join(root, 'build', 'preview');
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => { console.error('[pageerror]', e.message); process.exitCode = 1; });
await page.goto(pathToFileURL(path.join(root, 'src', 'ad.html')).href + (guides ? '?guides' : ''));
await page.evaluate(() => window.READY);
for (const t of times) {
  await page.evaluate((tt) => window.renderFrame(tt), t);
  const file = path.join(outDir, `t${t.toFixed(2).padStart(5, '0')}.png`);
  await page.screenshot({ path: file });
  console.log(file);
}
await browser.close();
