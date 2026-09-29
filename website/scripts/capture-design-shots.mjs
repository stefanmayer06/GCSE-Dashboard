// Captures the screenshots embedded in website/design/design-doc.html.
// Needs the built app running locally with the JSON storage driver:
//   npm run build && npm start        (in another terminal)
//   npm run design:shots              (this script)
//   npm run design:doc                (rebuilds the HTML doc)
// It signs up a throwaway local learner ("designdemo-<time>") and seeds a
// little marked practice so emblems, stars and the map look lived-in.
// Set CHROMIUM_PATH if Playwright's own Chrome is not installed.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(root, 'design/shots');
const BASE = process.env.UI_BASE || 'http://localhost:3000';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const api = context.request;

const username = `designdemo${Date.now()}`;
const signup = await api.post(`${BASE}/api/auth/signup`, { data: { username, password: 'design-demo-pass-1' } });
if (!signup.ok()) throw new Error(`Signup failed (${signup.status()}). Is the local server running with the JSON driver?`);

// Seed a few practice rounds. Answers come from /check so some land right
// and some wrong, which gives a realistic spread of mastery.
async function seed(base, topicId, accuracy) {
  const practice = await (await api.post(`${BASE}/api/${base}/practice`, { data: { topicId, count: 5 } })).json();
  const answers = [];
  for (const [index, q] of (practice.questions || []).entries()) {
    const probe = await (await api.post(`${BASE}/api/${base}/check`, { data: { qid: q.id, value: '__probe__' } })).json();
    const choice = q.input?.type === 'mcq' ? q.input.choices.find((c) => String(c.text) === String(probe.answerText)) : null;
    const right = choice ? choice.label : probe.answerText;
    answers.push({ qid: q.id, value: index / 5 < accuracy ? right : 'x' });
  }
  await api.post(`${BASE}/api/${base}/practice/submit`, { data: { sessionId: practice.sessionId, topicId, answers } });
}
for (const [topic, accuracy] of [['fractions', 1], ['place-value', 0.8], ['decimals', 0.6], ['percentages', 0.4], ['equations', 1], ['expressions', 0.6], ['angles', 0.8]]) {
  await seed('maths', topic, accuracy);
  await seed('maths', topic, accuracy);
}

async function shot(name, url, { width = 1280, height = 800, theme = 'light', scroll = 0, prepare = null, full = false } = {}) {
  await page.setViewportSize({ width, height });
  await page.addInitScript((value) => { try { localStorage.setItem('gcse-theme', value); } catch {} }, theme);
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.evaluate((value) => { document.documentElement.setAttribute('data-theme', value); localStorage.setItem('gcse-theme', value); }, theme);
  if (scroll) {
    await page.evaluate((y) => {
      const content = document.querySelector('.content');
      if (content && content.scrollHeight > content.clientHeight + 4) content.scrollTop = y;
      else window.scrollTo(0, y);
    }, scroll);
  }
  if (prepare) await prepare(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 72, fullPage: full });
  console.log('captured', name);
}

await shot('landing', '/');
await shot('home-light', '/maths/');
await shot('home-dark', '/maths/', { theme: 'dark' });
await shot('map', '/maths/learn', { scroll: 330 });
await shot('lesson', '/maths/learn/fractions');
await shot('notes', '/maths/learn/fractions', { scroll: 1000 });
await shot('explainer', '/maths/learn/fractions', {
  scroll: 470,
  prepare: async (p) => {
    const player = p.locator('.xp-player');
    await player.getByRole('button', { name: /Watch/ }).click();
    await player.getByRole('button', { name: 'Pause', exact: true }).click();
    await player.locator('.xp-chapter').nth(1).click();
    await player.getByRole('button', { name: 'Play', exact: true }).click();
    await p.waitForSelector('.xp-check');
  },
});
await shot('english-explainer', '/english/learn/language', {
  scroll: 430,
  prepare: async (p) => {
    const player = p.locator('.xp-player');
    await player.getByRole('button', { name: /Watch/ }).click();
    await p.waitForSelector('.xp-check', { timeout: 20000 });
  },
});
await shot('exam', '/maths/practice?paper=1&type=short');
await shot('english-exam', '/english/practice?paper=1&type=short', { theme: 'dark' });
await shot('mobile-home', '/maths-higher/', { width: 390, height: 844 });
await shot('mobile-map', '/english/learn', { width: 390, height: 844, scroll: 520 });

// Last: signing out for the login screen ends the demo session.
await shot('login', '/english/', {
  prepare: async (p) => {
    await p.context().clearCookies();
    await p.reload({ waitUntil: 'networkidle' });
  },
});

await browser.close();
