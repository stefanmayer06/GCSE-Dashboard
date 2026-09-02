import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { api } from './api.js';
import { clearSupabaseSession } from '../../shared/supabase.js';
import { clearResourceCache } from '../../shared/resource-cache.js';
import LoginScreen from '../../shared/login.jsx';

// Route pages are code-split: the app shell renders first and each page
// chunk streams in on demand. Chunks are prefetched during idle time after
// sign-in so the first visit to a page never waits on the network either.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Practice = lazy(() => import('./pages/Practice.jsx'));
const Results = lazy(() => import('./pages/Results.jsx'));
const Learn = lazy(() => import('./pages/Learn.jsx'));
const Topic = lazy(() => import('./pages/Topic.jsx'));
const Texts = lazy(() => import('./pages/Texts.jsx'));
const TextDetail = lazy(() => import('./pages/TextDetail.jsx'));
const Chat = lazy(() => import('./pages/Chat.jsx'));
const Notebook = lazy(() => import('../../shared/StudyTools.jsx').then((m) => ({ default: m.Notebook })));
const WeeklySummary = lazy(() => import('../../shared/StudyTools.jsx').then((m) => ({ default: m.WeeklySummary })));

const PAGE_LOADERS = [
  () => import('./pages/Dashboard.jsx'),
  () => import('./pages/Practice.jsx'),
  () => import('./pages/Results.jsx'),
  () => import('./pages/Learn.jsx'),
  () => import('./pages/Topic.jsx'),
  () => import('./pages/Texts.jsx'),
  () => import('./pages/TextDetail.jsx'),
  () => import('./pages/Chat.jsx'),
  () => import('../../shared/StudyTools.jsx'),
];

function PageFallback() {
  return <div className="page"><div className="loading">Loading…</div></div>;
}

const NAV = [
  { to: '/', label: 'Dashboard', icon: '01' },
  { to: '/practice', label: 'Papers', icon: '02' },
  { to: '/learn', label: 'Learn', icon: '03' },
  { to: '/texts', label: 'Texts', icon: '04' },
  { to: '/notebook', label: 'Notebook', icon: '05' },
  { to: '/summary', label: 'Summary', icon: '06' },
  { to: '/chat', label: 'AI Tutor', icon: '07' },
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
  const [auth, setAuth] = useState(null);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    api.auth
      .me()
      .then((data) => setAuth(data.user))
      .catch(() => {
        clearSupabaseSession();
        setAuth(false);
      });
  }, []);

  useEffect(() => {
    if (!auth) return;
    Promise.allSettled([api.progress(), api.health()]).then(([p, h]) => {
      if (p.status === 'fulfilled') setProgress(p.value);
      if (h.status === 'fulfilled') setHealth(h.value);
    });
  }, [location.pathname, auth]);

  useEffect(() => {
    if (!auth) return undefined;
    // A fresh identity must never inherit another session's cached resources.
    clearResourceCache();
    const schedule = window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 250));
    const cancel = window.cancelIdleCallback ?? ((id) => window.clearTimeout(id));
    const handle = schedule(() => {
      for (const load of PAGE_LOADERS) load().catch(() => {});
    });
    return () => cancel(handle);
  }, [auth]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gcse-theme', next);
    setTheme(next);
  };

  const signOut = async () => {
    try {
      await api.auth.logout();
    } catch {}
    clearResourceCache();
    for (const key of ['mathsmate-active-test', 'mathsmate-higher-active-test', 'mathsmate-last-result', 'mathsmate-higher-last-result', 'englishmate-active-test', 'englishmate-last-result']) {
      localStorage.removeItem(key);
    }
    setProgress(null);
    setHealth(null);
    setAuth(false);
  };

  if (auth === null) {
    return (
      <div className="login-loading">
        <div className="loading-mark" aria-hidden="true">E</div>
        <p className="login-loading-text">Loading Study Desk…</p>
      </div>
    );
  }

  if (!auth) {
    return (
      <LoginScreen
        subjectName="EnglishMate"
        tag="AQA GCSE English Language"
        letter="E"
        authApi={api.auth}
        onSignedIn={(user) => setAuth(user)}
      />
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon" aria-hidden="true">E</span>
          <div>
            <div className="logo-name">EnglishMate</div>
            <div className="logo-sub">AQA English Language</div>
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
          <button type="button" className="sign-out" onClick={signOut}>
            <span className="sign-out-label">Sign out</span>
            <span className="sign-out-user">&middot; {auth.username}</span>
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
              {health.texts} source texts · {health.aiMarking ? 'AI marking on' : 'AI marking off (no key)'}
            </div>
          )}
        </div>
      </aside>
      <main className="content">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard health={health} progress={progress} userId={auth.id || auth.username} />} />
            <Route path="/practice" element={<Practice health={health} onProgress={setProgress} userId={auth.id || auth.username} />} />
            <Route path="/results" element={<Results userId={auth.id || auth.username} />} />
            <Route path="/learn" element={<Learn userId={auth.id || auth.username} />} />
            <Route path="/learn/:topicId" element={<Topic onProgress={setProgress} userId={auth.id || auth.username} />} />
            <Route path="/texts" element={<Texts />} />
            <Route path="/texts/:textId" element={<TextDetail />} />
            <Route path="/notebook" element={<Notebook userId={auth.id || auth.username} subject="english" api={api} />} />
            <Route path="/summary" element={<WeeklySummary userId={auth.id || auth.username} subject="english" progress={progress} api={api} username={auth.username} />} />
            <Route path="/chat" element={<Chat health={health} userId={auth.id || auth.username} />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
