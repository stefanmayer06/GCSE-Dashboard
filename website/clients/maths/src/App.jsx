import StudioShell from '../../shared/v2/StudioShell.jsx';
import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { api } from './api.js';
import { clearSupabaseSession } from '../../shared/supabase.js';
import { clearResourceCache } from '../../shared/resource-cache.js';
import LoginScreen from '../../shared/login.jsx';

// Route pages are code-split: the app shell renders first and each page
// chunk streams in on demand. The core revision loop is prefetched during
// idle time on capable connections; save-data and 2G users stay on demand.
const LearningHome = lazy(() => import('../../shared/v2/LearningHome.jsx'));
const Reflect = lazy(() => import('../../shared/v2/Reflect.jsx'));
const Search = lazy(() => import('../../shared/v2/Search.jsx'));
const Settings = lazy(() => import('../../shared/v2/Settings.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Practice = lazy(() => import('./pages/Practice.jsx'));
const Results = lazy(() => import('./pages/Results.jsx'));
const Learn = lazy(() => import('./pages/Learn.jsx'));
const Topic = lazy(() => import('./pages/Topic.jsx'));
const Chat = lazy(() => import('./pages/Chat.jsx'));
const Notebook = lazy(() => import('../../shared/StudyTools.jsx').then((m) => ({ default: m.Notebook })));
const WeeklySummary = lazy(() => import('../../shared/StudyTools.jsx').then((m) => ({ default: m.WeeklySummary })));

const PAGE_LOADERS = [
  () => import('./pages/Practice.jsx'),
  () => import('./pages/Results.jsx'),
  () => import('./pages/Learn.jsx'),
];

function shouldPrefetchRoutes() {
  const connection = navigator.connection;
  return !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType);
}

function PageFallback() {
  return <div className="page"><div className="loading">Loading…</div></div>;
}

function initialTheme() {
  try {
    const stored = localStorage.getItem('gcse-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {}
  return 'light';
}

export default function App() {
  const higherTier = window.location.pathname.startsWith('/maths-higher');
  const [progress, setProgress] = useState(null);
  const [health, setHealth] = useState(null);
  const [theme, setTheme] = useState(initialTheme);
  const [auth, setAuth] = useState(null);
  const location = useLocation();
  const userId = auth?.id || auth?.username;

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
    if (!userId) return undefined;
    let active = true;
    Promise.allSettled([api.progress(), api.health()]).then(([p, h]) => {
      if (!active) return;
      if (p.status === 'fulfilled') setProgress(p.value);
      if (h.status === 'fulfilled') setHealth(h.value);
    });
    return () => { active = false; };
  }, [location.pathname, userId]);

  useEffect(() => {
    // Do not let the previous account's shell data remain visible during a
    // sign-in transition while its replacement is loading.
    setProgress(null);
    setHealth(null);
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    // A fresh identity must never inherit another session's cached resources.
    clearResourceCache();
    const schedule = window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 250));
    const cancel = window.cancelIdleCallback ?? ((id) => window.clearTimeout(id));
    const handle = schedule(() => {
      if (!shouldPrefetchRoutes()) return;
      for (const load of PAGE_LOADERS) load().catch(() => {});
    });
    return () => cancel(handle);
  }, [userId]);

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
    for (const key of [
      'mathsmate-active-test',
      'mathsmate-higher-active-test',
      'mathsmate-last-result',
      'mathsmate-higher-last-result',
      'englishmate-active-test',
      'englishmate-last-result',
      `gcse-${encodeURIComponent(userId || 'anonymous')}-maths-active-test`,
      `gcse-${encodeURIComponent(userId || 'anonymous')}-maths-higher-active-test`,
      `gcse-${encodeURIComponent(userId || 'anonymous')}-maths-last-result`,
      `gcse-${encodeURIComponent(userId || 'anonymous')}-maths-higher-last-result`,
      `gcse-${encodeURIComponent(userId || 'anonymous')}-english-active-test`,
      `gcse-${encodeURIComponent(userId || 'anonymous')}-english-last-result`,
    ]) {
      localStorage.removeItem(key);
    }
    setProgress(null);
    setHealth(null);
    setAuth(false);
  };

  if (auth === null) {
    return (
      <div className="login-loading">
        <div className="loading-mark" aria-hidden="true">M</div>
        <p className="login-loading-text">Loading Study Desk…</p>
      </div>
    );
  }

  if (!auth) {
    return (
      <LoginScreen
        subjectName="MathsMate"
        tag={`AQA GCSE Mathematics · ${higherTier ? 'Higher' : 'Foundation'}`}
        letter="M"
        authApi={api.auth}
        onSignedIn={(user) => setAuth(user)}
      />
    );
  }

  return (
    <div className={`app ${higherTier ? 'higher-tier' : 'foundation-tier'}`}>
      <StudioShell subject={higherTier ? 'maths-higher' : 'maths'} auth={auth} theme={theme} toggleTheme={toggleTheme} signOut={signOut}>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LearningHome api={api} subject={higherTier ? 'maths-higher' : 'maths'} userId={userId} progress={progress} />} />
            <Route path="/reflect" element={<Reflect progress={progress} />} />
            <Route path="/search" element={<Search api={api} subject={higherTier ? 'maths-higher' : 'maths'} userId={userId} />} />
            <Route path="/settings" element={<Settings api={api} subject={higherTier ? 'maths-higher' : 'maths'} userId={userId} auth={auth} theme={theme} toggleTheme={toggleTheme} signOut={signOut} />} />
            <Route path="/insights" element={<Dashboard health={health} progress={progress} higherTier={higherTier} userId={userId} />} />
            <Route path="/practice" element={<Practice onProgress={setProgress} userId={userId} />} />
            <Route path="/results" element={<Results userId={userId} />} />
            <Route path="/learn" element={<Learn userId={userId} />} />
            <Route path="/learn/:topicId" element={<Topic onProgress={setProgress} userId={userId} />} />
            <Route path="/notebook" element={<Notebook userId={userId} subject={higherTier ? 'maths-higher' : 'maths'} api={api} />} />
            <Route path="/summary" element={<WeeklySummary userId={userId} subject={higherTier ? 'maths-higher' : 'maths'} progress={progress} api={api} username={auth.username} />} />
            <Route path="/chat" element={<Chat health={health} userId={userId} />} />
          </Routes>
        </Suspense>
      </StudioShell>
    </div>
  );
}
