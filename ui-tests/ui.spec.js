const { test } = require('@playwright/test');

const pages = [
  ['dashboard', '/', ['h1']],
  ['practice-setup', '/practice', ['h1']],
  ['exam-runner', '/practice?paper=1&type=short', ['.exam-bar', '.q-card']],
  ['learn', '/learn', ['.strand-panel']],
  ['topic', '/learn/fractions', ['.notes']],
  ['chat', '/chat', ['.chat-box']],
];

for (const [name, path, waitFor] of pages) {
  test(name, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    for (const sel of waitFor) {
      if (!(await page.locator(sel).first().count())) throw new Error(`${name}: missing ${sel}`);
    }
    const checks = await page.evaluate(() => {
      const out = { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      // smallest interactive targets
      const small = [];
      document.querySelectorAll('button, a, input, textarea, [role=button]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.width < 28 || r.height < 24)) small.push(el.tagName + '.' + (el.className || '').toString().slice(0, 30));
      });
      out.smallTargets = small.slice(0, 5);
      // focus ring presence on a button
      const btn = document.querySelector('button');
      if (btn) {
        btn.focus();
        const s = getComputedStyle(btn);
        out.focusStyle = { outline: s.outline, boxShadow: s.boxShadow.slice(0, 80) };
      }
      // any fixed overlay clipping check: elements wider than viewport
      out.overWide = [...document.querySelectorAll('*')].filter((el) => el.getBoundingClientRect().width > document.documentElement.clientWidth + 2).slice(0, 5).map((el) => el.className || el.tagName);
      return out;
    });
    console.log(`[${name}]`, JSON.stringify(checks), '| consoleErrors:', errors.length);
    if (checks.overflow > 0) throw new Error(`${name}: horizontal overflow ${checks.overflow}px`);
    if (errors.length) throw new Error(`${name}: console errors: ${errors.slice(0, 3).join(' | ')}`);
  });
}

for (const [name, path] of [['mobile-dashboard', '/'], ['mobile-exam', '/practice?paper=2&type=short']]) {
  test(name, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`[${name}] overflow:${overflow} errors:${errors.length}`);
    if (overflow > 0) throw new Error(`${name}: horizontal overflow ${overflow}px`);
    if (errors.length) throw new Error(`${name}: page errors ${errors.slice(0, 2).join(' | ')}`);
  });
}
