import { test, expect } from '@playwright/test';

const BASE = process.env.UI_BASE || 'http://localhost:3000';

function scopedKey(subject, name) {
  return `gcse-admin-${subject}-${name}`;
}

// The first visit to Today shows a short welcome (exam date, first egg).
// Tests that are not about the welcome mark it as seen for the admin.
async function skipWelcome(page, user = 'admin') {
  await page.addInitScript((name) => {
    for (const subject of ['maths', 'maths-higher', 'english']) {
      localStorage.setItem(`gcse-welcome:${subject}:${encodeURIComponent(name)}`, '1');
    }
  }, user);
}

async function signIn(page) {
  await skipWelcome(page);
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  const username = page.locator('input[name="username"]');
  if (await username.count()) {
    await username.fill('admin');
    await page.locator('input[name="password"]').fill('admin');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.sidebar')).toBeVisible();
  }
}

// Lessons ask one question at a time: answer, check, then move on.
async function answerMathsQuiz(page, count = 5) {
  for (let index = 0; index < count; index += 1) {
    await expect(page.locator('.quiz-progress-count')).toHaveText(`Question ${index + 1} of ${count}`);
    const question = page.locator('.quiz-flow .quiz-q');
    const choices = question.locator('.choice');
    if (await choices.count()) await choices.first().click();
    else await question.locator('.answer-input').fill('1');
    await question.getByRole('button', { name: 'Check answer' }).click();
    await page.getByRole('button', { name: index === count - 1 ? 'Finish & score' : 'Next question' }).click();
  }
}

async function completeMathsLessonQuiz(page) {
  await page.getByRole('button', { name: 'Start 5 questions' }).click();
  await answerMathsQuiz(page, 5);
}

const pages = [
  ['selector', '/', ['#page-title', '.maths-card', '.english-card']],
  ['support', '/support.html', ['#contact', '#support-form', '#support-button']],
  ['subjects-directory', '/subjects', ['.subject-directory', '.dir-maths', '.dir-english', '.dir-coming']],
  ['maths-foundation-guide', '/gcse-maths-foundation', ['#course-title', '.course-stats', '.faq-list']],
  ['maths-higher-guide', '/gcse-maths-higher', ['#course-title', '.course-stats', '.faq-list']],
  ['english-language-guide', '/gcse-english-language', ['#course-title', '.course-stats', '.faq-list']],
  ['maths-dashboard', '/maths/', ['h1', '.subject-switch']],
  ['maths-practice', '/maths/practice', ['h1']],
  ['maths-exam', '/maths/practice?paper=1&type=short', ['.exam-bar', '.q-card']],
  ['maths-higher-dashboard', '/maths-higher/', ['h1', '.subject-switch']],
  ['maths-higher-practice', '/maths-higher/practice', ['h1']],
  ['maths-higher-exam', '/maths-higher/practice?paper=1&type=short', ['.exam-bar', '.q-card']],
  ['maths-higher-learn', '/maths-higher/learn/surds#learn', ['.notes']],
  ['maths-learn', '/maths/learn', ['.strand-panel']],
  ['maths-topic', '/maths/learn/fractions#learn', ['.notes']],
  ['maths-factors-topic', '/maths/learn/factors-multiples#learn', ['.notes']],
  ['maths-chat', '/maths/chat', ['.chat-box']],
  ['english-dashboard', '/english/', ['h1', '.subject-switch']],
  ['english-practice', '/english/practice', ['h1']],
  ['english-exam-paper-1', '/english/practice?paper=1&type=short', ['.exam-bar', '.q-card', '.source-panel']],
  ['english-exam-paper-2', '/english/practice?paper=2&type=short', ['.exam-bar', '.source-tabs']],
  ['english-learn', '/english/learn', ['.strand-panel']],
  ['english-topic', '/english/learn/language#learn', ['.notes']],
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

test('English modern-first source pair shows the selected source and its provenance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto(`${BASE}/english/texts/p2-city-modern-first`, { waitUntil: 'networkidle' });
  await expect(page.locator('.source-flag')).toHaveText('Original text written for practice');
  await expect(page.getByRole('link', { name: 'Full text on Project Gutenberg' })).toHaveCount(0);
  await page.getByRole('button', { name: /Source B.*Condition of the Working-Class/ }).click();
  await expect(page.locator('.source-flag')).toContainText('Public domain');
  await expect(page.getByRole('link', { name: 'Full text on Project Gutenberg' })).toHaveAttribute('href', /gutenberg\.org/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('English current fiction library preserves an archived classic deep link', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto(`${BASE}/english/texts`, { waitUntil: 'networkidle' });
  await expect(page.locator('.text-card[href*="/p1-"]')).toHaveCount(6);
  await expect(page.getByRole('link', { name: /The Last Crossing/ })).toBeVisible();
  await expect(page.locator('.text-card[href$="/p1-great-expectations"]')).toHaveCount(0);
  await page.getByRole('link', { name: /The Last Crossing/ }).click();
  await expect(page.locator('.source-flag')).toHaveText('Original fiction written for practice');
  await expect(page.locator('.text-detail-source')).toContainText('Nia reached the marsh gate');
  await expect(page.getByRole('link', { name: 'Full text on Project Gutenberg' })).toHaveCount(0);
  await page.goto(`${BASE}/english/texts/p1-great-expectations`, { waitUntil: 'networkidle' });
  await expect(page.locator('.text-detail-source')).toContainText('Ours was the marsh country');
  await expect(page.getByRole('heading', { name: 'Continue with current practice' })).toBeVisible();
  await expect(page.locator('.page-head')).toContainText('Archived classic skills practice');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('login gate accepts the admin account and rejects a bad password', async ({ page }) => {
  await skipWelcome(page);
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  await expect(page.locator('.login-card')).toBeVisible();
  await page.locator('input[name="username"]').fill('admin');
  await page.locator('input[name="password"]').fill('wrong-password');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.login-error')).toBeVisible();
  await page.locator('input[name="password"]').fill('admin');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.getByRole('link', { name: 'Me', exact: true }).click();
  await expect(page.locator('.sign-out')).toContainText('admin');
});

test('signing out returns to the login gate', async ({ page }) => {
  await signIn(page);
  const storageKeys = [
    'mathsmate-active-test',
    'mathsmate-last-result',
    'englishmate-last-result',
    scopedKey('maths', 'active-test'),
    scopedKey('maths', 'last-result'),
    scopedKey('english', 'last-result'),
  ];
  await page.evaluate(() => {
    localStorage.setItem('mathsmate-active-test', 'private draft');
    localStorage.setItem('mathsmate-last-result', 'private result');
    localStorage.setItem('englishmate-last-result', 'other private result');
    localStorage.setItem('gcse-admin-maths-active-test', 'private scoped draft');
    localStorage.setItem('gcse-admin-maths-last-result', 'private scoped result');
    localStorage.setItem('gcse-admin-english-last-result', 'other scoped result');
  });
  await page.goto(`${BASE}/maths/me`, { waitUntil: 'networkidle' });
  await page.locator('.sign-out').click();
  await expect(page.locator('.login-card')).toBeVisible();
  await expect.poll(() => page.evaluate((keys) => keys.map((key) => localStorage.getItem(key)), storageKeys)).toEqual(storageKeys.map(() => null));
});

test('subject selector keeps course links usable when health details are unavailable', async ({ page }) => {
  await page.route('**/api/maths/health', (route) => route.abort());
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('.maths-card .enter-link')).toBeVisible();
  await expect(page.locator('.english-card .enter-link')).toBeVisible();
  await expect(page.locator('.maths-card')).not.toContainText('Offline');
  await expect(page.locator('a[href="/subjects"]')).toBeVisible();
});

test('public example explains the method and carries acquisition source into the diagnostic', async ({ page }) => {
  await page.goto(`${BASE}/?src=parent-group`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Check the method' }).click();
  await expect(page.locator('#example-prompt')).toBeVisible();
  await page.getByRole('radio', { name: '4' }).check();
  await page.getByRole('button', { name: 'Check the method' }).click();
  await expect(page.locator('#example-result')).toContainText('x = 5');
  await expect(page.locator('#example-result')).toContainText('Subtract 5 from both sides');
  await expect(page.locator('#example-result')).toContainText('later retry');
  await expect(page.locator('.example-start')).toHaveAttribute('href', '/maths/practice?diagnostic=1&src=parent-group#adhoc');
  await expect(page.locator('.maths-card .enter-link')).toHaveAttribute('href', '/maths/?src=parent-group');
  await page.getByRole('radio', { name: '5' }).check();
  await page.getByRole('button', { name: 'Check the method' }).click();
  await expect(page.locator('#example-outcome')).toContainText('Correct');
});

test('course guides and the subject directory preserve a campaign source through signup links', async ({ page }) => {
  await page.goto(`${BASE}/gcse-maths-foundation`, { waitUntil: 'networkidle' });
  await expect(page.locator('.course-action.primary')).toHaveAttribute('href', '/maths/?src=guide-foundation');
  await page.goto(`${BASE}/gcse-maths-foundation?src=parent-group`, { waitUntil: 'networkidle' });
  await expect(page.locator('.course-action.primary')).toHaveAttribute('href', '/maths/?src=parent-group');
  await expect(page.locator('a[href="/subjects?src=parent-group"]')).toHaveCount(2);
  await page.goto(`${BASE}/subjects?src=parent-group`, { waitUntil: 'networkidle' });
  await expect(page.locator('.dir-maths .dir-open')).toHaveAttribute('href', '/maths/?src=parent-group');
});

test('homepage check continues through signup into ten diagnostic questions', async ({ page }) => {
  const username = `visitor${Date.now()}`;
  await page.goto(`${BASE}/?src=parent-group`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Start a 10-question check' }).click();
  await expect(page).toHaveURL(/\/maths\/practice\?diagnostic=1&src=parent-group#adhoc$/);
  await expect(page.locator('.login-card')).toBeVisible();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill('revision-pass-1');
  await page.locator('input[name="confirm"]').fill('revision-pass-1');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.locator('.round-title b')).toHaveText('10-question check');
  await expect(page.locator('.quiz-progress-count')).toHaveText('Question 1 of 10');
  await expect(page.locator('.quiz-flow .quiz-q')).toHaveCount(1);
  await expect.poll(async () => {
    const response = await page.request.get(`${BASE}/api/events/summary`);
    return response.ok() ? (await response.json()).counts.diagnostic_start : undefined;
  }).toBe(1);
});

test('support form sends an account request and requires a reply email for privacy', async ({ page }) => {
  await page.goto(`${BASE}/support.html`, { waitUntil: 'networkidle' });
  await page.locator('#topic').selectOption('privacy');
  await page.locator('#message').fill('I need a copy of my account data.');
  await page.getByRole('button', { name: 'Send support request' }).click();
  await expect(page.locator('#email')).toHaveAttribute('required', '');
  await expect(page.locator('#status')).toBeEmpty();

  await page.locator('#topic').selectOption('account');
  await page.locator('#message').fill('I cannot sign in to Maths Foundation.');
  await page.getByRole('button', { name: 'Send support request' }).click();
  await expect(page.locator('#status')).toContainText('Your request was received');
  await expect(page.locator('#topic')).toHaveValue('');
});

test('public GCSE guides expose indexable SEO metadata and structured data', async ({ page }) => {
  const guides = ['/gcse-maths-foundation', '/gcse-maths-higher', '/gcse-english-language'];
  for (const path of guides) {
    await page.goto(BASE + path);
    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const structuredData = await page.locator('script[type="application/ld+json"]').textContent();

    expect(title.length).toBeLessThanOrEqual(60);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(robots).toContain('index, follow');
    expect(new URL(canonical).pathname).toBe(path);
    expect(structuredData).toBeTruthy();
    const schema = JSON.parse(structuredData);
    expect(schema['@graph']).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'LearningResource' }),
      expect.objectContaining({ '@type': 'FAQPage' }),
    ]));
  }
});

test('authenticated subject shells are excluded from search indexing', async ({ page }) => {
  for (const path of ['/maths/', '/maths-higher/', '/english/', '/feedback.html', '/support.html', '/delete-account.html', '/api/health']) {
    const response = await page.goto(BASE + path);
    expect(response.headers()['x-robots-tag'], path).toContain('noindex');
  }
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

test('subject directory total includes both Maths question banks', async ({ page }) => {
  const foundation = await (await page.request.get(`${BASE}/api/maths/health`)).json();
  const higher = await (await page.request.get(`${BASE}/api/maths-higher/health`)).json();
  await page.goto(`${BASE}/subjects`, { waitUntil: 'networkidle' });
  await expect(page.locator('#spec-bank')).toHaveText(`${(foundation.bankSize + higher.bankSize).toLocaleString()}+`);
  await page.route('**/api/maths-higher/health', (route) => route.abort());
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#spec-bank')).toHaveText('4,600+');
});

test('subject themes share the desk system but keep distinct accents', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  const maths = await page.locator('.logo-icon').evaluate((element) => getComputedStyle(element).backgroundColor);
  // Circuit v5: self-hosted Unbounded display type on the shared cool paper.
  await expect(page.locator('h1')).toHaveCSS('font-family', /Unbounded/);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(242, 243, 250)');

  await page.goto(`${BASE}/english/`, { waitUntil: 'networkidle' });
  const english = await page.locator('.logo-icon').evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Unbounded/);
  expect(maths).not.toEqual(english);
});

test('course map shows every Foundation topic as a replayable level tile', async ({ page }) => {
  await signIn(page);
  const topics = await (await page.request.get(`${BASE}/api/maths/topics`)).json();
  const count = Object.values(topics.strands).reduce((sum, strand) => sum + strand.topics.length, 0);
  await page.goto(`${BASE}/maths/learn`, { waitUntil: 'networkidle' });
  await expect(page.locator('.map-tile')).toHaveCount(count);
  await expect(page.locator('.map-bubble')).toHaveCount(1);
  await expect(page.locator('.map-tile').first()).toHaveAttribute('aria-label', /stars/);
});

test('an authored explainer stops at a checkpoint and continues after an answer', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/learn/fractions`, { waitUntil: 'networkidle' });
  const player = page.locator('.xp-player');
  await expect(player.locator('.xp-poster h3')).toHaveText('Fractions of an amount');
  await player.getByRole('button', { name: /Watch/ }).click();
  await player.getByRole('button', { name: 'Pause', exact: true }).click();
  await player.locator('.xp-chapter').nth(1).click();
  await player.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(player.locator('.xp-check')).toBeVisible();
  await expect(player.locator('.xp-check-prompt')).toContainText('How much goes into each');
  await player.locator('.xp-check').getByRole('button', { name: '7', exact: true }).click();
  await expect(player.locator('.xp-fb.right')).toContainText('28 ÷ 4 = 7');
  await player.getByRole('button', { name: /Continue/ }).click();
  await expect(player.locator('.xp-check')).toHaveCount(0);
  await expect(player.locator('.xp-diamond.right')).toHaveCount(1);
});

test('topics without an authored explainer get a narrated talk-through', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/learn/decimals`, { waitUntil: 'networkidle' });
  await expect(page.locator('.xp-poster h3')).toContainText('talk-through');
  await page.getByRole('button', { name: /^Step 2: Learn/ }).click();
  await expect(page).toHaveURL(/#learn$/);
  await expect(page.locator('#stage-learn .notes')).toBeVisible();
  await page.goto(`${BASE}/english/learn/language`, { waitUntil: 'networkidle' });
  await expect(page.locator('.xp-poster h3')).toHaveText('Zoom into a word');
});

test('lesson headers avoid treating study-priority scores as exam weight claims', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/learn/factors-multiples`, { waitUntil: 'networkidle' });
  await expect(page.locator('.page-head .sub')).toContainText('AQA 8300 Foundation revision');
  await expect(page.locator('.page-head .sub')).not.toContainText(/roughly|% of your paper/i);
  await page.goto(`${BASE}/english/learn/language`, { waitUntil: 'networkidle' });
  await expect(page.locator('.page-head .sub')).toContainText('AQA 8700 revision');
  await expect(page.locator('.page-head .sub')).not.toContainText(/roughly|marks across/i);
});

test('standard form lesson opens a five-question practice', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/learn/standard-form#learn`, { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toHaveText('Standard Form');
  await expect(page.locator('.example-card')).toContainText('0.00042');
  await page.getByRole('button', { name: /^Next: Practise/ }).click();
  await page.getByRole('button', { name: 'Start 5 questions' }).click();
  await expect(page.locator('.quiz-progress-count')).toHaveText('Question 1 of 5');
  await expect(page.locator('.quiz-flow .quiz-q')).toHaveCount(1);
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
  ['Maths', 'maths', scopedKey('maths', 'active-test')],
  ['Higher Maths', 'maths-higher', scopedKey('maths-higher', 'active-test')],
  ['English', 'english', scopedKey('english', 'active-test')],
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
  ['Maths', 'maths', 'maths', scopedKey('maths', 'active-test')],
  ['Higher Maths', 'maths-higher', 'maths-higher', scopedKey('maths-higher', 'active-test')],
  ['English', 'english', 'english', scopedKey('english', 'active-test')],
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
   const graphIndex = await page.evaluate((key) => {
     const saved = JSON.parse(localStorage.getItem(key));
     return saved.test.questions.findIndex((question) => question.stimulus?.type === 'cartesian' || question.stimulus?.type === 'histogram');
   }, scopedKey('maths-higher', 'active-test'));
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
   const visualIndex = await page.evaluate((key) => {
     const saved = JSON.parse(localStorage.getItem(key));
     return saved.test.questions.findIndex((question) => question.stimulus && !['cartesian', 'histogram'].includes(question.stimulus.type));
   }, scopedKey('maths-higher', 'active-test'));
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
  await expect(page.locator('h1')).toContainText('Practice');
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), scopedKey('maths', 'active-test'))).toBeNull();
});

test('paper confirmation dialog traps focus and restores it on Escape', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/practice?paper=1&type=short`, { waitUntil: 'networkidle' });
  const submitPaper = page.getByRole('button', { name: 'Submit paper', exact: true });
  await submitPaper.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAttribute('aria-labelledby', /.+/);
  await expect(dialog).toHaveAttribute('aria-describedby', /.+/);
  await expect(dialog.getByRole('button', { name: 'Keep working', exact: true })).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Submit', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Keep working', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');

  await expect(dialog).toHaveCount(0);
  await expect(submitPaper).toBeFocused();
});

test('Foundation Maths renders an accessible visual question in the exam runner', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/practice?paper=1&type=short`, { waitUntil: 'networkidle' });
   const visualIndex = await page.evaluate((key) => {
     const saved = JSON.parse(localStorage.getItem(key));
     return saved.test.questions.findIndex((question) => question.stimulus);
   }, scopedKey('maths', 'active-test'));
  expect(visualIndex).toBeGreaterThanOrEqual(0);
  await page.locator('.q-dot').nth(visualIndex).click();
  await expect(page.locator('.maths-visual')).toBeVisible();
  await expect(page.locator('.maths-visual [role="img"], .maths-visual table').first()).toBeVisible();
});

test('Foundation lesson graph supports keyboard inspection and resizing', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/learn/graphs#learn`, { waitUntil: 'networkidle' });
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
  await page.goto(`${BASE}/maths/learn/charts#learn`, { waitUntil: 'networkidle' });
  const visual = page.locator('.lesson-visual .maths-visual');
  await expect(visual).toBeVisible();
  await visual.locator('.data-bar-column').first().click();
  await expect(visual.locator('.visual-readout')).toContainText('Mon: 23');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('dark mode toggles, persists and reaches every surface', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/me`, { waitUntil: 'networkidle' });
  const lightBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.locator('.theme-toggle').click();
  await expect(page.locator('.theme-toggle')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkBackground = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(darkBackground).not.toEqual(lightBackground);

  await page.goto(`${BASE}/english/`, { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('tablet navigation keeps account controls and accessible names', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await signIn(page);
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  await expect(page.locator('.sidebar nav a')).toHaveCount(5);
  await expect.poll(() => page.locator('.sidebar nav a').evaluateAll((links) => links.map((link) => link.getAttribute('aria-label')))).toEqual([
    'Today', 'Learn', 'Practice', 'Creatures', 'Me',
  ]);
  await page.getByRole('link', { name: 'Me', exact: true }).click();
  await expect(page.locator('.theme-toggle')).toBeVisible();
  await expect(page.locator('.sign-out')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('mobile header controls meet the touch target', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await signIn(page);
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  const controls = page.locator('.app-header .subject-pill, .app-header .streak-chip, .app-header .header-partner, .sidebar .nav-item');
  await expect(controls).toHaveCount(8);
  const sizes = await controls.evaluateAll((items) => items.map((control) => {
    const rect = control.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  expect(sizes.every(({ width, height }) => width >= 44 && height >= 44)).toBeTruthy();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('save-data connections skip non-critical route prefetches', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true, effectiveType: '2g' },
    });
  });
  const assetRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/assets/') && request.url().endsWith('.js')) assetRequests.push(request.url());
  });

  await signIn(page);
  await page.waitForTimeout(400);
  expect(assetRequests.some((url) => /\/(Practice|Results|Learn|Topic|Chat)-[^/]+\.js$/.test(url))).toBeFalsy();
});

test('landscape tablet keeps collapsed sidebar controls reachable', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await signIn(page);
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });

  const metrics = await page.locator('.sidebar').evaluate((sidebar) => ({
    documentHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    sidebarHeight: sidebar.clientHeight,
    sidebarScrollHeight: sidebar.scrollHeight,
  }));
  expect(metrics.documentHeight).toBeLessThanOrEqual(metrics.viewportHeight);
  expect(metrics.sidebarScrollHeight).toBeGreaterThan(metrics.sidebarHeight);

  await page.locator('.sidebar').evaluate((sidebar) => { sidebar.scrollTop = sidebar.scrollHeight; });
  const controlsInViewport = await page.evaluate(() => ['.sidebar nav a[aria-label="Me"]', '.sidebar .palette-trigger'].every((selector) => {
    const rect = document.querySelector(selector).getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }));
  expect(controlsInViewport).toBeTruthy();
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
  await expect(page.locator('.welcome-page h1')).toHaveText('When are your exams?');
  await page.getByRole('radio', { name: /Summer/ }).first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.welcome-page h1')).toHaveText('Pick your first egg');
  await page.getByRole('radio', { name: /Tock/ }).click();
  await page.getByRole('button', { name: 'Choose Tock' }).click();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(page.locator('.upnext-card h2')).toHaveText('Take the 10-question check');
  await expect(page.locator('.rail-partner')).toContainText('Tock egg');
  await page.getByRole('link', { name: 'Me', exact: true }).click();
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
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.locator('.sidebar')).toBeVisible();

  await page.goto(`${BASE}/maths/me`, { waitUntil: 'networkidle' });
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
  await page.goto(`${BASE}/maths/learn/fractions#practise`, { waitUntil: 'networkidle' });
  await completeMathsLessonQuiz(page);

  await expect(page.locator('.reward-dialog')).toBeVisible();
  await expect(page.locator('.reward-dialog')).toContainText('Lesson complete');
  // Rewards are creatures now: the dialog shows what the lesson fed.
  await expect(page.locator('.reward-dialog .creature-gains')).toContainText('What this lesson fed');
  await expect(page.locator('.reward-dialog .creature-gains')).toContainText(/marked answers?/);
  await expect(page.locator('.reward-dialog')).not.toContainText('XP');
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
  const repeatResponse = page.waitForResponse((response) => response.url().endsWith('/api/maths/practice/submit'));
  await answerMathsQuiz(page, 5);
  const repeat = await (await repeatResponse).json();
  expect(repeat.reward.firstCompletion).toBeFalsy();
  expect(repeat.reward.completionXp).toBe(0);
  await expect(page.locator('.reward-dialog')).toHaveCount(0);
  await expect(page.locator('.quiz-done')).toContainText('What this round fed');

  // Marked answers grow Quillby; the Creatures tab shows the same count.
  const latest = await (await page.request.get(`${BASE}/api/maths/progress`)).json();
  await page.goto(`${BASE}/maths/creatures`, { waitUntil: 'networkidle' });
  await expect(page.locator('.critter-card', { hasText: 'Quillby egg' })).toContainText(`${latest.practiceAnswered} / 25`);
  await expect(page.locator('body')).not.toContainText(/\bXP\b|Level \d|badge collection/i);
});

test('milestone creatures hatch from marked work and open as interactive badges', async ({ page }) => {
  const username = `critter${Date.now()}`;
  const signup = await page.request.post(`${BASE}/api/auth/signup`, {
    data: { username, password: 'revision-pass-1' },
  });
  expect(signup.ok()).toBeTruthy();

  await page.goto(`${BASE}/maths/creatures`, { waitUntil: 'networkidle' });
  const cards = page.locator('.critter-card');
  await expect(cards).toHaveCount(8);
  await expect(page.locator('.critter-card.rank-egg')).toHaveCount(8);
  await expect(page.locator('.critter-evolve')).toHaveCount(0);

  // Marked answers are the only thing that feeds Quillby: 25 hatches it.
  for (const topicId of ['fractions', 'decimals']) {
    const issued = await (await page.request.post(`${BASE}/api/maths/practice`, { data: { topicId, count: 20 } })).json();
    const submit = await page.request.post(`${BASE}/api/maths/practice/submit`, {
      data: { sessionId: issued.sessionId, topicId, answers: issued.questions.map((question) => ({ qid: question.id, value: '1' })) },
    });
    expect(submit.ok()).toBeTruthy();
  }
  const progress = await (await page.request.get(`${BASE}/api/maths/progress`)).json();
  expect(progress.practiceAnswered).toBeGreaterThanOrEqual(25);
  expect(progress.practiceAnswered).toBeLessThan(150);

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('.critter-evolve')).toBeVisible();
  await expect(page.locator('.critter-evolve h2')).toContainText('Quillby hatched into Quillet');
  // Two topics practised also hatched Tortile (topics explored): queued next.
  await page.getByRole('button', { name: /Next evolution/ }).click();
  await expect(page.locator('.critter-evolve h2')).toContainText('Tortile hatched into Tortle');
  await page.locator('.critter-evolve .reward-close').click();
  await expect(page.locator('.critter-card.is-new')).toHaveCount(2);
  await page.locator('.critter-card', { hasText: 'Quillet' }).click();

  const dialog = page.locator('.critter-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.evo-step')).toHaveCount(4);
  await expect(dialog.locator('.evo-step.reached')).toHaveCount(1);
  await expect(dialog.locator('.critter-speech')).toHaveText("Hi! I'm Quillet.");
  await dialog.getByRole('button', { name: 'Pet Quillet' }).click();
  await expect(dialog.locator('.critter-speech')).toContainText('marked answers. We did that together!');
  await expect(dialog.locator('.critter-hearts svg')).toHaveCount(5);
  await expect(dialog.getByRole('link', { name: /Answer questions/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.critter-card.rank-bronze')).toHaveCount(2);
  await expect(page.locator('.critter-card.is-new')).toHaveCount(1);

  // Reloading does not replay an evolution that was already shown.
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('.critter-card').first()).toBeVisible();
  await expect(page.locator('.critter-evolve')).toHaveCount(0);
});

test('Maths lesson quick practice completes today in the exam plan', async ({ page }) => {
  const username = `mission${Date.now()}`;
  const signup = await page.request.post(`${BASE}/api/auth/signup`, {
    data: { username, password: 'revision-pass-1' },
  });
  expect(signup.ok()).toBeTruthy();
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const savePlan = await page.request.put(`${BASE}/api/maths/personal/plan`, {
    data: {
      from: date,
      days: [{ date, label: 'Today', task: 'Fractions', minutes: 15, topicId: 'fractions', status: 'todo' }],
    },
  });
  expect(savePlan.ok()).toBeTruthy();

  await page.goto(`${BASE}/maths/learn/fractions#practise`, { waitUntil: 'networkidle' });
  await completeMathsLessonQuiz(page);
  await expect(page.locator('.quiz-done')).toBeVisible();
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  await expect(page.locator('.week-day.done')).toHaveAttribute('aria-label', /Fractions done/);
  await expect(page.locator('.today-task.done')).toContainText('Fractions done');
  await expect(page.locator('.week-card .section-meta')).toContainText('1 of 1 days done');
});

test('saving exam preferences refreshes personal data without an error', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/maths/me`, { waitUntil: 'networkidle' });
  const input = page.locator('.exam-settings input[aria-label="Exam date"]');
  await expect(input).toBeVisible();

  // State-independent: pick a date different from the saved one so the
  // controlled input actually changes and issues the PUT. Filling the
  // already-saved value fires no React change event (by design — no save
  // needed), which would leave both response waiters hanging.
  const current = await input.inputValue();
  const nextDate = current === '2099-05-14' ? '2099-05-15' : '2099-05-14';
  const saveResponse = page.waitForResponse((response) => (
    response.url().endsWith('/api/maths/personal/preferences')
    && response.request().method() === 'PUT'
  ));
  const refreshResponse = page.waitForResponse((response) => (
    response.url().endsWith('/api/maths/personal')
    && response.request().method() === 'GET'
  ));
  await input.fill(nextDate);
  expect((await saveResponse).ok()).toBeTruthy();
  expect((await refreshResponse).ok()).toBeTruthy();
  await expect(page.locator('.plan-note.error')).toHaveCount(0);
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

test('English quick-fire shows extracts and marks four selected statements', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/english/practice`, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Four quick choices' }).click();
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
  const rows = question.locator('.choose4-row');
  await expect(rows).toHaveCount(8);
  for (let index = 0; index < 4; index += 1) await rows.nth(index).click();
  await expect(check).toBeEnabled();
  await check.click();
  await expect(question.locator('.fb-box')).toBeVisible();
});

test('English Paper 1 Q1 offers four three-choice parts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto(`${BASE}/english/practice?paper=1&type=short`, { waitUntil: 'networkidle' });
  await expect(page.locator('.mcq4-item')).toHaveCount(4);
  for (const item of await page.locator('.mcq4-item').all()) {
    await expect(item.locator('button')).toHaveCount(3);
    await item.locator('button').first().click();
  }
  await expect(page.locator('.q-pos')).toContainText('1 answered');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('English Paper 2 Q1 allows four of eight statements', async ({ page }) => {
  await signIn(page);
  await page.goto(`${BASE}/english/practice?paper=2&type=short`, { waitUntil: 'networkidle' });
  const rows = page.locator('.choose4-row');
  await expect(rows).toHaveCount(8);
  for (let index = 0; index < 4; index += 1) await rows.nth(index).click();
  await expect(rows.nth(4)).toBeDisabled();
  await expect(page.locator('.q-pos')).toContainText('1 answered');
});

test('the app can be installed: manifest, icons and service worker are served', async ({ page }) => {
  const manifest = await (await page.request.get(`${BASE}/manifest.webmanifest`)).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('/?source=app');
  expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBeTruthy();
  for (const icon of manifest.icons) {
    expect((await page.request.get(`${BASE}${icon.src}`)).ok(), icon.src).toBeTruthy();
  }
  const worker = await page.request.get(`${BASE}/sw.js`);
  expect(worker.ok()).toBeTruthy();
  expect(await worker.text()).toContain("url.pathname.startsWith('/api/')");
  await signIn(page);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
});

test('the subject switcher keeps you signed in and on the same tab', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto(`${BASE}/maths/practice`, { waitUntil: 'networkidle' });
  await page.locator('.app-header .subject-pill').click();
  const sheet = page.getByRole('dialog', { name: 'Your subjects' });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.subject-option')).toHaveCount(3);
  await expect(sheet.locator('.subject-option.current')).toContainText('Maths Foundation');
  await expect(sheet.getByRole('link', { name: /English Language/ })).toHaveAttribute('href', '/english/practice');
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(page.locator('.app-header .subject-pill')).toBeFocused();
});

test('Ask Pip opens over Today and keeps the tab bar hidden behind it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto(`${BASE}/maths/`, { waitUntil: 'networkidle' });
  await page.locator('.pip-row').click();
  const sheet = page.getByRole('dialog', { name: 'Ask Pip' });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('.chat-box')).toBeVisible();
  await expect(sheet.getByRole('textbox', { name: 'Message Pip' })).toBeVisible();
  await expect(sheet.locator('.suggest-chip').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
});

test('lessons run one step at a time with Ask Pip on the question', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto(`${BASE}/maths/learn/fractions`, { waitUntil: 'networkidle' });
  // Focus mode: no tab bar while a lesson is open.
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('.lesson-step.current')).toHaveAttribute('aria-label', /Step 1: Watch/);
  await page.getByRole('button', { name: /^Next: Learn the notes/ }).click();
  await expect(page.locator('#stage-learn .notes')).toBeVisible();
  await page.getByRole('button', { name: /^Next: Practise/ }).click();
  await page.getByRole('button', { name: 'Start 5 questions' }).click();
  await expect(page.locator('.quiz-progress-count')).toHaveText('Question 1 of 5');
  await page.locator('.lesson-bar .ask-pip').click();
  const sheet = page.getByRole('dialog', { name: 'Ask Pip' });
  await expect(sheet.locator('.pip-context')).toContainText('Fractions');
  await expect(sheet.getByRole('button', { name: 'Give me a hint' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: /Close lesson/ }).click();
  await expect(page).toHaveURL(/\/maths\/learn$/);
  await expect(page.locator('.sidebar')).toBeVisible();
});

test('due mistakes can be retried one at a time from the notebook', async ({ page }) => {
  const username = `retry${Date.now()}`;
  const signup = await page.request.post(`${BASE}/api/auth/signup`, {
    data: { username, password: 'revision-pass-1' },
  });
  expect(signup.ok()).toBeTruthy();
  const issued = await (await page.request.post(`${BASE}/api/maths/practice`, { data: { topicId: 'fractions', count: 1 } })).json();
  const question = issued.questions[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const later = [3, 7, 21].map((days) => new Date(Date.now() + days * 86400000).toISOString());
  const saved = await page.request.put(`${BASE}/api/maths/personal/mistakes`, {
    data: {
      rows: [{
        id: `maths:test:${question.id}`,
        qid: question.id,
        topicId: 'fractions',
        topicName: 'Fractions',
        prompt: question.text,
        capturedAt: yesterday,
        dueDates: [yesterday, ...later],
        reviewIndex: 0,
        mastered: false,
      }],
    },
  });
  expect(saved.ok()).toBeTruthy();

  await skipWelcome(page, username);
  await page.goto(`${BASE}/maths/notebook?retry=1`, { waitUntil: 'networkidle' });
  const card = page.locator('.retry-card');
  await expect(card).toContainText(question.text.split('\n')[0]);
  await expect(page.locator('.sidebar')).toBeHidden();
  const choices = card.locator('.choice');
  if (await choices.count()) await choices.first().click();
  else await card.locator('.answer-input').fill('1');
  await card.getByRole('button', { name: 'Check answer' }).click();
  const feedback = page.locator('.quiz-feedback');
  await expect(feedback).toBeVisible();
  if (await feedback.getByRole('button', { name: /Good/ }).count()) await feedback.getByRole('button', { name: /Good/ }).click();
  else await feedback.getByRole('button', { name: /^Next/ }).click();
  await expect(page.locator('.quiz-done')).toContainText('Retries done');
  await expect.poll(async () => {
    const personal = await (await page.request.get(`${BASE}/api/maths/personal`)).json();
    return personal.mistakes[0].lastReviewedAt ? 'graded' : 'not yet';
  }).toBe('graded');
});

test('mixed practice asks one question at a time and saves misses for a retry', async ({ page }) => {
  const username = `round${Date.now()}`;
  const signup = await page.request.post(`${BASE}/api/auth/signup`, {
    data: { username, password: 'revision-pass-1' },
  });
  expect(signup.ok()).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  await skipWelcome(page, username);
  await page.goto(`${BASE}/maths/practice`, { waitUntil: 'networkidle' });
  await page.getByRole('radio', { name: '10' }).click();
  await page.getByRole('button', { name: 'Start 10 questions' }).click();
  for (let index = 0; index < 10; index += 1) {
    await expect(page.locator('.quiz-progress-count')).toHaveText(`Question ${index + 1} of 10`);
    const question = page.locator('.quiz-flow .quiz-q');
    const choices = question.locator('.choice');
    if (await choices.count()) await choices.last().click();
    else await question.locator('.answer-input').fill('999999');
    await question.getByRole('button', { name: 'Check answer' }).click();
    await page.getByRole('button', { name: index === 9 ? 'Finish & score' : 'Next question' }).click();
  }
  await expect(page.locator('.quiz-done')).toContainText('You scored');
  await expect.poll(async () => {
    const personal = await (await page.request.get(`${BASE}/api/maths/personal`)).json();
    return personal.mistakes.length;
  }).toBeGreaterThan(0);
});

for (const [name, url] of [
  ['mobile-selector', '/'],
  ['mobile-support', '/support.html'],
  ['mobile-subjects', '/subjects'],
  ['mobile-maths-foundation-guide', '/gcse-maths-foundation'],
  ['mobile-maths-higher-guide', '/gcse-maths-higher'],
  ['mobile-english-language-guide', '/gcse-english-language'],
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
