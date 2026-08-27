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

setSubjectStatus('english', '/api/english/health', (data) => {
  if (data.texts) document.getElementById('english-texts').textContent = `${data.texts} source texts`;
});
