const { test, expect } = require('@playwright/test');

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
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(url, { waitUntil: 'networkidle' });
    for (const selector of selectors) await expect(page.locator(selector).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${name} has horizontal overflow`).toBeLessThanOrEqual(0);
    expect(errors, `${name} has browser errors`).toEqual([]);
  });
}

test('subject selector links and live status', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#maths-status')).toContainText('Ready');
  await expect(page.locator('#english-status')).toContainText('Ready');
  await expect(page.locator('a[href="/maths/"]')).toBeVisible();
  await expect(page.locator('a[href="/english/"]')).toBeVisible();
});

test('subject themes share the desk system but keep distinct accents', async ({ page }) => {
  await page.goto('/maths/', { waitUntil: 'networkidle' });
  const maths = await page.locator('.logo-icon').evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Georgia/);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(243, 240, 232)');

  await page.goto('/english/', { waitUntil: 'networkidle' });
  const english = await page.locator('.logo-icon').evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Georgia/);
  expect(maths).not.toEqual(english);
});

for (const [name, url] of [
  ['mobile-selector', '/'],
  ['mobile-maths', '/maths/'],
  ['mobile-english', '/english/'],
]) {
  test(name, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${name} has horizontal overflow`).toBeLessThanOrEqual(0);
  });
}
