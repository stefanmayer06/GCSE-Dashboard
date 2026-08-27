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

async function completeMathsLessonQuiz(page) {
  await page.getByRole('button', { name: 'Start 5 questions' }).click();
  const questions = page.locator('.quiz-q');
  await expect(questions).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    const question = questions.nth(index);
    const choices = question.locator('.choice');
    if (await choices.count()) await choices.first().click();
    else await question.locator('.answer-input').fill('1');
    await question.getByRole('button', { name: 'Check answer' }).click();
  }
  await page.getByRole('button', { name: 'Finish & score' }).click();
}

const pages = [
  ['selector', '/', ['#page-title', '.maths-card', '.english-card']],
  ['subjects-directory', '/subjects', ['.subject-directory', '.dir-maths', '.dir-english', '.dir-coming']],
  ['maths-dashboard', '/maths/', ['h1', '.subject-switch']],
  ['maths-practice', '/maths/practice', ['h1']],
  ['maths-exam', '/maths/practice?paper=1&type=short', ['.exam-bar', '.q-card']],
  ['maths-higher-dashboard', '/maths-higher/', ['h1', '.subject-switch']],
  ['maths-higher-practice', '/maths-higher/practice', ['h1']],
  ['maths-higher-exam', '/maths-higher/practice?paper=1&type=short', ['.exam-bar', '.q-card']],
  ['maths-higher-learn', '/maths-higher/learn/surds', ['.notes']],
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
  await page.evaluate(() => {
    localStorage.setItem('mathsmate-active-test', 'private draft');
    localStorage.setItem('mathsmate-last-result', 'private result');
    localStorage.setItem('englishmate-last-result', 'other private result');
  });
  await page.locator('.sign-out').click();
  await expect(page.locator('.login-card')).toBeVisible();
  await expect.poll(() => page.evaluate(() => [localStorage.getItem('mathsmate-active-test'), localStorage.getItem('mathsmate-last-result'), localStorage.getItem('englishmate-last-result')])).toEqual([null, null, null]);
});

test('subject selector links and live status', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#maths-status')).toContainText('Ready');
  await expect(page.locator('#english-status')).toContainText('Ready');
  await expect(page.locator('a[href="/maths/"]')).toBeVisible();
  await expect(page.locator('a[href="/english/"]')).toBeVisible();
  await expect(page.locator('a[href="/subjects"]')).toBeVisible();
});

test('subject directory links to both subjects and tolerates more rows', async ({ page }) => {
  await page.goto(`${BASE}/subjects`, { waitUntil: 'networkidle' });
  await expect(page.locator('a[href="/maths/"]')).toBeVisible();
  await expect(page.locator('a[href="/english/"]')).toBeVisible();
  await expect(page.locator('.dir-coming')).toContainText('Coming soon');
  await expect(page.locator('#spec-subjects')).toContainText('03');
  await expect(page.locator('a[href="/maths-higher/"]')).toBeVisible();
  await expect(page.locator('.subjects-toggle')).toHaveClass(/is-current/);
  await Promise.all([
    page.waitForURL(/\/(maths|english)\/$/),
    page.locator('.dir-maths .dir-open').click(),
  ]);
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

test('English tutor renders Markdown response structure', async ({ page }) => {
  await signIn(page);
  await page.route('**/api/english/chat/history', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      messages: [
        { role: 'assistant', content: '### Language analysis\n\n**Step 1:** Choose a short quotation.\n\n- Name the technique\n- Explain the effect\n\n`quote → method → effect`' },
      ],
    }),
  }));
  await page.goto(`${BASE}/english/chat`, { waitUntil: 'networkidle' });
  await expect(page.locator('.markdown-message h3')).toContainText('Language analysis');
  await expect(page.locator('.markdown-message strong')).toContainText('Step 1:');
  await expect(page.locator('.markdown-message ul li')).toHaveCount(2);
  await expect(page.locator('.markdown-message code')).toContainText('quote');
});

test('Higher Maths exposes three 8300H papers with Higher grade boundaries', async ({ page }) => {
  await signIn(page);
  const response = await page.request.post(`${BASE}/api/maths-higher/test/new`, { data: { type: 'full', paper: 1 } });
  expect(response.ok()).toBeTruthy();
  const paper = await response.json();
  expect(paper.paperCode).toBe('8300/1H');
  expect(paper.totalMarks).toBe(80);
  expect(paper.questions.reduce((sum, q) => sum + q.marks, 0)).toBe(80);
  expect(paper.questions.some((q) => /surds|function|quadratic|proof/i.test(`${q.topic} ${q.text}`))).toBeTruthy();
  expect(paper.questions.filter((q) => q.exceptional).length).toBe(1);
  expect(paper.questions.some((q) => q.stimulus?.type === 'cartesian' || q.stimulus?.type === 'histogram')).toBeTruthy();
  expect(paper.questions.filter((q) => q.stimulus).length).toBeGreaterThanOrEqual(5);
  expect(paper.stretchMarks).toBeGreaterThanOrEqual(18);
  expect(paper.stretchMarks).toBeLessThanOrEqual(30);

  const status = await page.request.get(`${BASE}/api/maths-higher/test/${paper.id}/status`);
  expect(status.ok()).toBeTruthy();
  expect(await status.json()).toEqual({ active: true });

  const submit = await page.request.post(`${BASE}/api/maths-higher/test/${paper.id}/submit`, {
    data: { answers: paper.questions.map((q) => ({ qid: q.id, value: null })), durationSec: 5 },
  });
  const result = await submit.json();
  expect(result.tier).toBe('higher');
  expect(result.boundaries[0].grade).toBe(9);
  expect(result.strandAnalysis.length).toBeGreaterThan(0);
});

for (const [subject, route, storageKey] of [
  ['Maths', 'maths', 'mathsmate-active-test'],
  ['Higher Maths', 'maths-higher', 'mathsmate-higher-active-test'],
  ['English', 'english', 'englishmate-active-test'],
]) {
  test(`${subject} clears an expired saved paper after a restart`, async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/${route}/`, { waitUntil: 'networkidle' });
    await page.evaluate(({ key }) => {
      localStorage.setItem(key, JSON.stringify({
        test: { id: 'expired-after-restart', questions: [] },
        answers: {}, current: 0, secondsLeft: 600, elapsed: 20,
      }));
    }, { key: storageKey });
    await page.goto(`${BASE}/${route}/practice?paper=1&type=short`, { waitUntil: 'networkidle' });
    await expect(page.locator('.error-banner')).toContainText('no longer active');
    await expect(page.locator('h1')).toContainText(/Practice/);
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
    await expect(page).toHaveURL(new RegExp(`/${route}/practice$`));
  });
}

for (const [subject, route, apiRoute, storageKey] of [
  ['Maths', 'maths', 'maths', 'mathsmate-active-test'],
  ['Higher Maths', 'maths-higher', 'maths-higher', 'mathsmate-higher-active-test'],
  ['English', 'english', 'english', 'englishmate-active-test'],
]) {
  test(`${subject} can quit a paper without changing progress`, async ({ page }) => {
    if (route === 'maths-higher') await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);
    const before = await (await page.request.get(`${BASE}/api/${apiRoute}/progress`)).json();
    await page.goto(`${BASE}/${route}/practice?paper=1&type=short`, { waitUntil: 'networkidle' });
    const testId = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).test.id, storageKey);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    await page.getByRole('button', { name: 'Quit paper', exact: true }).click();
    const modal = page.locator('.modal').filter({ hasText: 'Quit this paper?' });
    await expect(modal).toContainText('will not affect your scores or progress');
    await modal.getByRole('button', { name: 'Quit paper', exact: true }).click();

    await expect(page.locator('.papers-grid')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${route}/practice$`));
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
    const status = await page.request.get(`${BASE}/api/${apiRoute}/test/${testId}/status`);
    expect(status.status()).toBe(410);
    const after = await (await page.request.get(`${BASE}/api/${apiRoute}/progress`)).json();
    expect(after).toEqual(before);
  });
}

test('Higher Maths renders an accessible graph question in the exam runner', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths-higher/practice?paper=1&type=short`, { waitUntil: 'networkidle' });
  const graphIndex = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mathsmate-higher-active-test'));
    return saved.test.questions.findIndex((question) => question.stimulus?.type === 'cartesian' || question.stimulus?.type === 'histogram');
  });
  expect(graphIndex).toBeGreaterThanOrEqual(0);
  await page.locator('.q-dot').nth(graphIndex).click();
  await expect(page.locator('.graph-stimulus svg')).toBeVisible();
  await expect(page.locator('.graph-stimulus svg')).toHaveAttribute('role', 'img');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('Higher Maths renders a structured visual at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto(`${BASE}/maths-higher/practice?paper=2&type=short`, { waitUntil: 'networkidle' });
  const visualIndex = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mathsmate-higher-active-test'));
    return saved.test.questions.findIndex((question) => question.stimulus && !['cartesian', 'histogram'].includes(question.stimulus.type));
  });
  expect(visualIndex).toBeGreaterThanOrEqual(0);
  await page.locator('.q-dot').nth(visualIndex).click();
  await expect(page.locator('.maths-visual')).toBeVisible();
  await expect(page.locator('.maths-visual [role="img"], .maths-visual table').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('Maths recovers if a paper expires while it is open', async ({ page }) => {
  await signIn(page);
  await page.route('**/api/maths/test/*/submit', (route) => route.fulfill({
    status: 410,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'This saved paper is no longer active. It may have expired after a server restart. Start a new paper to continue.', code: 'TEST_EXPIRED' }),
  }));
  await page.goto(`${BASE}/maths/practice?paper=1&type=short`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Submit paper' }).click();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.locator('.error-banner')).toContainText('no longer active');
  await expect(page.locator('h1')).toContainText('Practice exam');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('mathsmate-active-test'))).toBeNull();
});

test('Foundation Maths renders an accessible visual question in the exam runner', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/practice?paper=1&type=short`, { waitUntil: 'networkidle' });
  const visualIndex = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('mathsmate-active-test'));
    return saved.test.questions.findIndex((question) => question.stimulus);
  });
  expect(visualIndex).toBeGreaterThanOrEqual(0);
  await page.locator('.q-dot').nth(visualIndex).click();
  await expect(page.locator('.maths-visual')).toBeVisible();
  await expect(page.locator('.maths-visual [role="img"], .maths-visual table').first()).toBeVisible();
});

test('Foundation lesson graph supports keyboard inspection and resizing', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/learn/graphs`, { waitUntil: 'networkidle' });
  const visual = page.locator('.lesson-visual .maths-visual');
  await expect(visual).toBeVisible();
  await visual.locator('.visual-point').first().focus();
  await visual.locator('.visual-point').first().press('Enter');
  await expect(visual.locator('.visual-readout')).toContainText('A (1, 2)');
  await visual.getByRole('button', { name: 'Enlarge' }).click();
  await expect(visual.getByRole('button', { name: 'Fit' })).toBeVisible();
});

test('Foundation lesson visual stays interactive at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto(`${BASE}/maths/learn/charts`, { waitUntil: 'networkidle' });
  const visual = page.locator('.lesson-visual .maths-visual');
  await expect(visual).toBeVisible();
  await visual.locator('.data-bar-column').first().click();
  await expect(visual.locator('.visual-readout')).toContainText('Mon: 23');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
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

test('login lowercases the username so capitals work', async ({ page }) => {
  const username = `CaseName${Date.now()}`;
  const password = 'revision-pass-1';
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  await page.locator('.login-switch').click();
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirm"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.sidebar')).toBeVisible();

  await page.locator('.sign-out').click();
  await expect(page.locator('.login-card')).toBeVisible();
  await page.locator('input[name="username"]').fill(username.toUpperCase());
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.sign-out')).toContainText(username.toLowerCase());
});

test('english exam shows a 14+ appropriate picture for the Q5 description task', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/english/practice?paper=1&type=short`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.q-dot');
  await page.locator('.q-dot').nth(1).click();
  await page.waitForSelector('.q-card');
  await page.waitForSelector('.q-image img');
  const alt = await page.locator('.q-image img').getAttribute('alt');
  expect(alt && alt.length > 10).toBeTruthy();
  await expect(page.locator('.q-image-cap')).toContainText('Wikimedia Commons');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('lesson rewards persist, update levels live and cannot be claimed twice', async ({ page }) => {
  const username = `reward${Date.now()}`;
  const signup = await page.request.post(`${BASE}/api/auth/signup`, {
    data: { username, password: 'revision-pass-1' },
  });
  expect(signup.ok()).toBeTruthy();

  const issuedResponse = await page.request.post(`${BASE}/api/maths/practice`, {
    data: { topicId: 'fractions', count: 5 },
  });
  const issued = await issuedResponse.json();
  const incompleteResponse = await page.request.post(`${BASE}/api/maths/practice/submit`, {
    data: {
      sessionId: issued.sessionId,
      topicId: 'fractions',
      answers: issued.questions.slice(0, 4).map((question) => ({ qid: question.id, value: '1' })),
    },
  });
  const incomplete = await incompleteResponse.json();
  expect(incomplete.reward).toMatchObject({ firstCompletion: false, completionXp: 0 });
  const replay = await page.request.post(`${BASE}/api/maths/practice/submit`, {
    data: { sessionId: issued.sessionId, topicId: 'fractions', answers: [] },
  });
  expect(replay.ok()).toBeTruthy();
  expect(await replay.json()).toMatchObject({
    correctMarks: incomplete.correctMarks,
    totalMarks: incomplete.totalMarks,
    reward: incomplete.reward,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/maths/learn/fractions`, { waitUntil: 'networkidle' });
  await completeMathsLessonQuiz(page);

  await expect(page.locator('.reward-dialog')).toBeVisible();
  await expect(page.locator('.reward-dialog')).toContainText('Lesson stamp earned');
  await expect(page.locator('.reward-dialog')).toContainText('first-completion XP');
  await expect(page.locator('.reward-close')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Choose another lesson' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.reward-close')).toBeFocused();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Another 5' })).toBeFocused();
  await expect(page.locator('.topic-complete-stamp')).toBeVisible();

  const firstProgress = await (await page.request.get(`${BASE}/api/maths/progress`)).json();
  expect(firstProgress.lessonsCompleted).toBe(1);
  expect(firstProgress.xp).toBeGreaterThanOrEqual(20);

  await page.getByRole('button', { name: 'Another 5' }).click();
  const questions = page.locator('.quiz-q');
  await expect(questions.first().getByRole('button', { name: 'Check answer' })).toBeVisible();
  for (let index = 0; index < 5; index += 1) {
    const question = questions.nth(index);
    const choices = question.locator('.choice');
    if (await choices.count()) await choices.first().click();
    else await question.locator('.answer-input').fill('1');
    await question.getByRole('button', { name: 'Check answer' }).click();
  }
  const repeatResponse = page.waitForResponse((response) => response.url().endsWith('/api/maths/practice/submit'));
  await page.getByRole('button', { name: 'Finish & score' }).click();
  const repeat = await (await repeatResponse).json();
  expect(repeat.reward.firstCompletion).toBeFalsy();
  expect(repeat.reward.completionXp).toBe(0);
  await expect(page.locator('.reward-dialog')).toHaveCount(0);

  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  await expect(page.locator('.expertise-path')).toContainText('1 lesson completed');
  await page.getByRole('button', { name: 'View badge collection' }).click();
  await expect(page.locator('.badge-collection')).toBeVisible();
});

test('English offline lesson completion earns the same first-completion reward', async ({ page }) => {
  const username = `engreward${Date.now()}`;
  const signup = await page.request.post(`${BASE}/api/auth/signup`, {
    data: { username, password: 'revision-pass-1' },
  });
  expect(signup.ok()).toBeTruthy();

  const practiceResponse = await page.request.post(`${BASE}/api/english/practice`, {
    data: { topicId: 'creative-writing', count: 1 },
  });
  const practice = await practiceResponse.json();
  const submitResponse = await page.request.post(`${BASE}/api/english/practice/submit`, {
    data: {
      sessionId: practice.sessionId,
      answers: practice.questions.map((question) => ({ qid: question.id, value: { text: 'A cold wind moved through the empty street.' } })),
      aiResults: Object.fromEntries(practice.questions.map((question) => [question.id, { ai: true, marks: question.marks }])),
    },
  });
  expect(submitResponse.ok()).toBeTruthy();
  const result = await submitResponse.json();
  expect(result.reward).toMatchObject({ firstCompletion: true, completionXp: 20 });
  expect(result.reward.scoreXp).toBe(0);
  expect(result.progress.lessonsCompleted).toBe(1);

  const topic = await (await page.request.get(`${BASE}/api/english/topics/creative-writing`)).json();
  expect(topic.completed).toBeTruthy();
});

test('English quick-fire shows extracts and enables true-false marking', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/english/practice`, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'List four things' }).click();
  await page.getByRole('button', { name: 'Language analysis' }).click();
  await page.getByRole('button', { name: /Give me questions/ }).click();

  const sourcePanel = page.locator('.adhoc-source-panel');
  await expect(sourcePanel).toBeVisible();
  await expect(sourcePanel.locator('.source-text')).toBeVisible();
  await expect(sourcePanel.locator('.adhoc-source-tabs')).toBeVisible();
  await expect(sourcePanel.locator('.source-panel')).toHaveCSS('overflow-y', 'auto');

  const question = page.locator('.quiz-q').first();
  const check = question.getByRole('button', { name: 'Check answer' });
  await expect(check).toBeDisabled();
  const rows = question.locator('.tf-row');
  expect(await rows.count()).toBeGreaterThan(0);
  for (let index = 0; index < await rows.count(); index += 1) {
    await rows.nth(index).getByRole('button', { name: 'TRUE' }).click();
  }
  await expect(check).toBeEnabled();
  await check.click();
  await expect(question.locator('.fb-box')).toBeVisible();
});

for (const [name, url] of [
  ['mobile-selector', '/'],
  ['mobile-subjects', '/subjects'],
  ['mobile-maths', '/maths/'],
  ['mobile-maths-higher', '/maths-higher/'],
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
