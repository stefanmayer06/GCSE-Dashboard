let theme = 'light';
try {
  const stored = localStorage.getItem('gcse-theme');
  if (stored === 'dark' || stored === 'light') theme = stored;
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
} catch (e) {}

function applyTheme(next) {
  theme = next;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('gcse-theme', theme);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    const icon = toggle.querySelector('.theme-toggle-icon');
    const label = toggle.querySelector('span:last-child');
    if (icon) icon.textContent = theme === 'dark' ? '◑' : '◐';
    if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}

document.documentElement.setAttribute('data-theme', theme);

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));
}

async function loadSubjectFact(endpoint, update) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) return;
    const data = await response.json();
    update(data);
  } catch {}
}

loadSubjectFact('/api/maths/health', (data) => {
  if (data.bankSize) document.getElementById('maths-bank').textContent = `${data.bankSize.toLocaleString()} questions`;
});

loadSubjectFact('/api/maths-higher/health', (data) => {
  const el = document.getElementById('higher-bank');
  if (el && data.bankSize) el.textContent = `${data.bankSize.toLocaleString()} questions`;
});

loadSubjectFact('/api/english/health', (data) => {
  if (data.texts) document.getElementById('english-texts').textContent = `${data.texts} source texts`;
});

const exampleForm = document.getElementById('example-form');
if (exampleForm) {
  const prompt = document.getElementById('example-prompt');
  const result = document.getElementById('example-result');
  const outcome = document.getElementById('example-outcome');
  exampleForm.addEventListener('change', () => {
    prompt.hidden = true;
    result.hidden = true;
  });
  exampleForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const answer = new FormData(exampleForm).get('example-answer');
    if (!answer) {
      prompt.hidden = false;
      result.hidden = true;
      return;
    }
    prompt.hidden = true;
    const correct = answer === '5';
    result.dataset.correct = String(correct);
    outcome.textContent = correct
      ? 'Correct. You have the method.'
      : `Not quite. You chose ${answer}; x = 5.`;
    result.hidden = false;
  });
}

// v3 — "Pick up where you left off": the last subject desk visited.
// The banner is injected only when a previous visit exists, so the static
// selector keeps exactly one link per subject (Playwright asserts this).
try {
  const last = localStorage.getItem('gcse-last-subject');
  const names = {
    '/maths/': ['MathsMate — Foundation', 'AQA 8300 · Number, Algebra, Ratio and more'],
    '/maths-higher/': ['Higher Maths — 8300H', 'Grade 4–9 stretch, proof and graphs'],
    '/english/': ['EnglishMate — Language', 'AQA 8700 · both papers, real timings'],
  };
  const slot = document.getElementById('continue-slot');
  if (last && names[last] && slot) {
    const banner = document.createElement('div');
    banner.className = 'continue-banner';
    banner.setAttribute('role', 'note');
    banner.setAttribute('aria-label', 'Continue where you left off');
    const text = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `Continue in ${names[last][0]}`;
    const sub = document.createElement('span');
    sub.textContent = names[last][1];
    text.append(title, sub);
    const link = document.createElement('a');
    link.className = 'continue-link';
    link.href = last;
    link.textContent = 'Continue →';
    banner.append(text, link);
    slot.replaceWith(banner);
  }
  for (const a of document.querySelectorAll('a.enter-link')) {
    a.addEventListener('click', () => {
      try {
        const href = new URL(a.href).pathname;
        if (['/maths/', '/maths-higher/', '/english/'].includes(href)) localStorage.setItem('gcse-last-subject', href);
      } catch {}
    });
  }
} catch {}

// Keep a campaign source with the course link until signup. An internal source
// labels the entry point when there is no campaign tag. No learner data is sent
// by the public example itself.
const querySource = new URLSearchParams(window.location.search).get('src') || '';
const campaignSource = /^[a-z0-9][a-z0-9_-]{0,59}$/i.test(querySource) ? querySource : '';
for (const anchor of document.querySelectorAll('a[href]')) {
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin || !/^\/(?:maths|maths-higher|english|subjects|gcse-maths-foundation|gcse-maths-higher|gcse-english-language)(?:\/|$)/.test(url.pathname)) continue;
  const source = campaignSource || anchor.dataset.acquisition || (anchor.classList.contains('continue-link') ? 'home-return' : '');
  if (!source) continue;
  url.searchParams.set('src', source);
  anchor.href = `${url.pathname}${url.search}${url.hash}`;
}
