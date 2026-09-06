import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { clearSupabaseSession } from '../../shared/supabase.js';
import { clearResourceCache, useResource } from '../../shared/resource-cache.js';
import { flattenTopics } from '../../shared/study.js';
import { dueMistakeRows, hydratePersonal } from '../../shared/study-personal.js';
import AppShell from '../../shared/AppShell.jsx';
import LoginScreen from '../../shared/login.jsx';

// Route pages are code-split: the app shell renders first and each page
// chunk streams in on demand. The core revision loop is prefetched during
// idle time on capable connections; save-data and 2G users stay on demand.
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

const NAV = [
  { to: '/', label: 'Dashboard', icon: '01' },
  { to: '/practice', label: 'Practice', icon: '02' },
  { to: '/learn', label: 'Learn', icon: '03' },
  { to: '/notebook', label: 'Notebook', icon: '04' },
  { to: '/summary', label: 'Summary', icon: '05' },
  { to: '/chat', label: 'AI Tutor', icon: '06' },
];

// 2.1: the shell contract lives in shared/AppShell.jsx (one DOM for both
// subjects; class names frozen for Playwright + responsive CSS).
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
  const subject = higherTier ? 'maths-higher' : 'maths';

  // Shared with Dashboard via resource-cache: no extra network request.
  const { data: topicCatalog } = useResource(userId ? `topics:${subject}:${userId}` : null, () => api.topics());
  // Same personal cache as the dashboard: feeds the Notebook due badge.
  const { data: personal } = useResource(userId ? `personal:${userId}:${subject}` : null, () => hydratePersonal(api, userId, subject));
  const notebookDue = (() => {
    try {
      return dueMistakeRows(personal?.mistakes ?? []).length;
    } catch {
      return 0;
    }
  })();

  const paletteItems = useMemo(() => {
    const routes = [
      { href: '/', label: 'Dashboard', group: 'Go', hint: 'command centre' },
      { href: '/practice', label: 'Practice papers', group: 'Go', hint: 'exam desk' },
      { href: '/practice?diagnostic=1#adhoc', label: 'Diagnostic · 10 questions', group: 'Go', hint: 'start here' },
      { href: '/learn', label: 'Learn topics', group: 'Go', hint: 'lessons' },
      { href: '/notebook', label: 'Mistake notebook', group: 'Go', hint: 'retries' },
      { href: '/summary', label: 'Weekly summary', group: 'Go', hint: 'progress' },
      { href: '/results', label: 'Latest results', group: 'Go', hint: 'marking' },
      { href: '/chat', label: 'AI tutor', group: 'Go', hint: 'help' },
    ];
    const lessons = flattenTopics(topicCatalog, 'strands')
      .slice(0, 60)
      .map((topic) => ({
        href: `/learn/${topic.id}`,
        label: topic.name || topic.id,
        group: 'Lesson',
        hint: topic.strand || (higherTier ? 'Higher' : 'Foundation'),
        keywords: topic.id,
      }));
    return [...routes, ...lessons];
  }, [topicCatalog, higherTier]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('gcse-last-subject', higherTier ? '/maths-higher/' : '/maths/');
    } catch {}
  }, [higherTier]);

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
    <AppShell
      tierClass={higherTier ? 'higher-tier' : 'foundation-tier'}
      brand={{ letter: higherTier ? 'H' : 'M', name: higherTier ? 'Higher Maths' : 'MathsMate', sub: `AQA ${higherTier ? 'Higher' : 'Foundation'}` }}
      nav={NAV}
      auth={auth}
      progress={progress}
      healthNote={health ? `${health.bankSize?.toLocaleString()}+ questions in the bank` : null}
      theme={theme}
      onToggleTheme={toggleTheme}
      onSignOut={signOut}
      paletteItems={paletteItems}
      notebookDue={notebookDue}
    >
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard health={health} progress={progress} higherTier={higherTier} userId={userId} />} />
          <Route path="/practice" element={<Practice onProgress={setProgress} userId={userId} />} />
          <Route path="/results" element={<Results userId={userId} />} />
          <Route path="/learn" element={<Learn userId={userId} />} />
          <Route path="/learn/:topicId" element={<Topic onProgress={setProgress} userId={userId} />} />
          <Route path="/notebook" element={<Notebook userId={userId} subject={higherTier ? 'maths-higher' : 'maths'} api={api} />} />
          <Route path="/summary" element={<WeeklySummary userId={userId} subject={higherTier ? 'maths-higher' : 'maths'} progress={progress} api={api} username={auth.username} />} />
          <Route path="/chat" element={<Chat health={health} userId={userId} />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
