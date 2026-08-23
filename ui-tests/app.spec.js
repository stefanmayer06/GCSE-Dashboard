const { test, expect } = require('@playwright/test');

const BASE = process.env.UI_BASE || 'http://localhost:3000';

async function signIn(page) {
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  const username = page.locator('input[name="username"]');
  if (await username.count()) {
    await username.fill('admin');
    await page.locator('input[name="password"]').fill('admin');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.sidebar')).toBeVisible();
  }
}

const pages = [
  ['selector', '/', ['#page-title', '.maths-card', '.english-card']],
  ['maths-dashboard', '/maths/', ['h1', '.subject-switch']],
  ['maths-practice', '/maths/practice', ['h1']],
  ['maths-exam', '/maths/practice?paper=1&type=short', ['.exam-bar', '.q-card']],
  ['maths-learn', '/maths/learn', ['.strand-panel']],
  ['maths-topic', '/maths/learn/fractions', ['.notes']],
  ['maths-chat', '/maths/chat', ['.chat-box']],
  ['english-dashboard', '/english/', ['h1', '.subject-switch']],
  ['english-practice', '/english/practice', ['h1']],
  ['english-exam-paper-1', '/english/practice?paper=1&type=short', ['.exam-bar', '.q-card', '.source-panel']],
  ['english-exam-paper-2', '/english/practice?paper=2&type=short', ['.exam-bar', '.source-tabs']],
  ['english-learn', '/english/learn', ['.strand-panel']],
  ['english-topic', '/english/learn/language', ['.notes']],
  ['english-texts', '/english/texts', ['.text-card']],
  ['english-text-detail', '/english/texts/p1-great-expectations', ['.text-detail-source']],
  ['english-chat', '/english/chat', ['.chat-box']],
];

for (const [name, url, selectors] of pages) {
  test(name, async ({ page }) => {
    const errors = [];
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      if (message.text().includes('401')) return;
      errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(String(error)));
    if (url.startsWith('/maths') || url.startsWith('/english')) await signIn(page);
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    for (const selector of selectors) await expect(page.locator(selector).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${name} has horizontal overflow`).toBeLessThanOrEqual(0);
    expect(errors, `${name} has browser errors`).toEqual([]);
  });
}

test('login gate accepts the admin account and rejects a bad password', async ({ page }) => {
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  await expect(page.locator('.login-card')).toBeVisible();
  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill('wrong-password');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.login-error')).toBeVisible();
  await page.locator('input[name="password"]').fill('admin');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.sign-out')).toContainText('admin');
});

test('signing out returns to the login gate', async ({ page }) => {
  await signIn(page);
  await page.locator('.sign-out').click();
  await expect(page.locator('.login-card')).toBeVisible();
});

test('subject selector links and live status', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#maths-status')).toContainText('Ready');
  await expect(page.locator('#english-status')).toContainText('Ready');
  await expect(page.locator('a[href="/maths/"]')).toBeVisible();
  await expect(page.locator('a[href="/english/"]')).toBeVisible();
});

test('subject themes share the desk system but keep distinct accents', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  const maths = await page.locator('.logo-icon').evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Georgia/);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(243, 240, 232)');

  await page.goto(`${BASE}/english/`, { waitUntil: 'networkidle' });
  const english = await page.locator('.logo-icon').evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Georgia/);
  expect(maths).not.toEqual(english);
});

test('dark mode toggles, persists and reaches every surface', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  const lightBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(darkBackground).not.toEqual(lightBackground);

  await page.goto(`${BASE}/english/`, { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('a new visitor can create an account and sign in with it', async ({ page }) => {
  const username = `student${Date.now()}`;
  const password = 'revision-pass-1';
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  await expect(page.locator('.login-card')).toBeVisible();
  await page.locator('.login-switch').click();
  await expect(page.locator('h1')).toContainText('Create an account');
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirm"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.sign-out')).toContainText(username);
});

test('signup rejects a taken username; the server rejects a weak password', async ({ page }) => {
  await page.goto(`${BASE}/english/`, { waitUntil: 'networkidle' });
  await page.locator('.login-switch').click();

  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill('admin-pass-123');
  await page.locator('input[name="confirm"]').fill('admin-pass-123');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.login-error')).toContainText('already taken');

  const response = await page.request.post(`${BASE}/api/auth/signup`, {
    data: { username: 'bob', password: 'short' },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: 'Password must be at least 8 characters.' });
});

for (const [name, url] of [
  ['mobile-selector', '/'],
  ['mobile-maths', '/maths/'],
  ['mobile-english', '/english/'],
]) {
  test(name, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    if (url.startsWith('/maths') || url.startsWith('/english')) await signIn(page);
    await page.goto(BASE + url, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${name} has horizontal overflow`).toBeLessThanOrEqual(0);
  });
}