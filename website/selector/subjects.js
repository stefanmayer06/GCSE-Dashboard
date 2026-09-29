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

async function refreshStats() {
  const subjectsEl = document.getElementById('spec-subjects');
  const papersEl = document.getElementById('spec-papers');
  const bankEl = document.getElementById('spec-bank');

  const fetchJson = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const [maths, higher, english] = await Promise.all([
    fetchJson('/api/maths/health'),
    fetchJson('/api/maths-higher/health'),
    fetchJson('/api/english/health'),
  ]);

  let subjects = 3;
  let papers = 8;
  let bank = '4,600+';

  if (maths && maths.bankSize) {
     subjects = 3;
     papers = 8;
    const q = document.getElementById('dir-maths-q');
    if (q) q.textContent = maths.bankSize.toLocaleString();
  }
  if (higher && higher.bankSize) {
    const q = document.getElementById('dir-maths-higher-q');
    if (q) q.textContent = higher.bankSize.toLocaleString();
    const card = document.getElementById('maths-higher-bank');
    if (card) card.textContent = `${higher.bankSize.toLocaleString()}+ questions`;
    if (maths?.bankSize) bank = `${(maths.bankSize + higher.bankSize).toLocaleString()}+`;
  }
  if (english && english.texts) {
    const texts = document.getElementById('dir-english-texts');
    if (texts) texts.textContent = english.texts;
  }

  if (subjectsEl) subjectsEl.textContent = String(subjects).padStart(2, '0');
  if (papersEl) papersEl.textContent = String(papers).padStart(2, '0');
  if (bankEl) bankEl.textContent = bank;
}

refreshStats();

const querySource = new URLSearchParams(window.location.search).get('src') || '';
if (/^[a-z0-9][a-z0-9_-]{0,59}$/i.test(querySource)) {
  for (const anchor of document.querySelectorAll('a[href]')) {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || !/^\/(?:maths|maths-higher|english|gcse-maths-foundation|gcse-maths-higher|gcse-english-language)(?:\/|$)/.test(url.pathname)) continue;
    url.searchParams.set('src', querySource);
    anchor.href = `${url.pathname}${url.search}${url.hash}`;
  }
}
