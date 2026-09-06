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

async function setSubjectStatus(subject, endpoint, update) {
  const status = document.getElementById(`${subject}-status`);
  if (!status) return;
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('unavailable');
    const data = await response.json();
    status.classList.add('ready');
    status.lastChild.textContent = ' Ready';
    update(data);
  } catch {
    status.lastChild.textContent = ' Offline';
  }
}

setSubjectStatus('maths', '/api/maths/health', (data) => {
  if (data.bankSize) document.getElementById('maths-bank').textContent = `${data.bankSize.toLocaleString()} questions`;
});

setSubjectStatus('higher', '/api/maths-higher/health', (data) => {
  const el = document.getElementById('higher-bank');
  if (el && data.bankSize) el.textContent = `${data.bankSize.toLocaleString()} questions`;
});

setSubjectStatus('english', '/api/english/health', (data) => {
  if (data.texts) document.getElementById('english-texts').textContent = `${data.texts} source texts`;
});

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
        const href = a.getAttribute('href');
        if (['/maths/', '/maths-higher/', '/english/'].includes(href)) localStorage.setItem('gcse-last-subject', href);
      } catch {}
    });
  }
} catch {}
