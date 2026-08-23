import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Practice from './pages/Practice.jsx';
import Results from './pages/Results.jsx';
import Learn from './pages/Learn.jsx';
import Topic from './pages/Topic.jsx';
import Chat from './pages/Chat.jsx';
import { api } from './api.js';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '01' },
  { to: '/practice', label: 'Practice Exam', icon: '02' },
  { to: '/learn', label: 'Learn', icon: '03' },
  { to: '/chat', label: 'AI Tutor', icon: '04' },
];

function initialTheme() {
  try {
    const stored = localStorage.getItem('gcse-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {}
  return 'light';
}

export default function App() {
  const [progress, setProgress] = useState(null);
  const [health, setHealth] = useState(null);
  const [theme, setTheme] = useState(initialTheme);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gcse-theme', next);
    setTheme(next);
  };

  useEffect(() => {
    Promise.allSettled([api.progress(), api.health()]).then(([p, h]) => {
      if (p.status === 'fulfilled') setProgress(p.value);
      if (h.status === 'fulfilled') setHealth(h.value);
    });
  }, [location.pathname]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon" aria-hidden="true">M</span>
          <div>
            <div className="logo-name">MathsMate</div>
            <div className="logo-sub">AQA Foundation</div>
          </div>
        </div>
        <a className="subject-switch" href="/" aria-label="Return to all subjects">
          <span aria-hidden="true">←</span><span className="subject-switch-label">All subjects</span>
        </a>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="theme-toggle-icon" aria-hidden="true">{theme === 'dark' ? '◑' : '◐'}</span>
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          {progress && (
            <div className="level-card">
              <div className="level-row">
                <span>Level {progress.level}</span>
                <span>🔥 {progress.streak} day{progress.streak === 1 ? '' : 's'}</span>
              </div>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${Math.min(100, (progress.xpInto / progress.xpNeeded) * 100)}%` }} />
              </div>
              <div className="xp-note">{progress.xpInto}/{progress.xpNeeded} XP to next level</div>
            </div>
          )}
          {health && (
            <div className="bank-note">
              {health.bankSize?.toLocaleString()}+ questions in the bank
            </div>
          )}
        </div>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard health={health} progress={progress} />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/results" element={<Results />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:topicId" element={<Topic />} />
          <Route path="/chat" element={<Chat health={health} />} />
        </Routes>
      </main>
    </div>
  );
}
