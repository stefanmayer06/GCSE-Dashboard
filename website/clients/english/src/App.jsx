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
const Texts = lazy(() => import('./pages/Texts.jsx'));
const TextDetail = lazy(() => import('./pages/TextDetail.jsx'));
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
  const userId = auth?.id || auth?.username;

  // Shared with Dashboard via resource-cache: no extra network request.
  const { data: topicCatalog } = useResource(userId ? `topics:english:${userId}` : null, () => api.topics());
  // Same personal cache as the dashboard: feeds the Notebook due badge.
  const { data: personal } = useResource(userId ? `personal:${userId}:english` : null, () => hydratePersonal(api, userId, 'english'));
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
      { href: '/practice', label: 'Exam papers', group: 'Go', hint: 'exam desk' },
      { href: '/practice?diagnostic=1#adhoc', label: 'Diagnostic · 10 questions', group: 'Go', hint: 'start here' },
      { href: '/learn', label: 'Learn skills', group: 'Go', hint: 'lessons' },
      { href: '/texts', label: 'Source texts', group: 'Go', hint: 'library' },
      { href: '/notebook', label: 'Mistake notebook', group: 'Go', hint: 'retries' },
      { href: '/summary', label: 'Weekly summary', group: 'Go', hint: 'progress' },
      { href: '/results', label: 'Latest results', group: 'Go', hint: 'marking' },
      { href: '/chat', label: 'AI tutor', group: 'Go', hint: 'help' },
    ];
    const lessons = flattenTopics(topicCatalog, 'sections')
      .slice(0, 60)
      .map((topic) => ({
        href: `/learn/${topic.id}`,
        label: topic.name || topic.id,
        group: 'Skill',
        hint: topic.section || 'English',
        keywords: topic.id,
      }));
    return [...routes, ...lessons];
  }, [topicCatalog]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('gcse-last-subject', '/english/');
    } catch {}
  }, []);

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
    <AppShell
      tierClass=""
      brand={{ letter: 'E', name: 'EnglishMate', sub: 'AQA English Language' }}
      nav={NAV}
      auth={auth}
      progress={progress}
      healthNote={health ? `${health.texts} source texts · ${health.aiMarking ? 'AI marking on' : 'AI marking off (no key)'}` : null}
      theme={theme}
      onToggleTheme={toggleTheme}
      onSignOut={signOut}
      paletteItems={paletteItems}
      notebookDue={notebookDue}
    >
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard health={health} progress={progress} userId={userId} />} />
          <Route path="/practice" element={<Practice health={health} onProgress={setProgress} userId={userId} />} />
          <Route path="/results" element={<Results userId={userId} />} />
          <Route path="/learn" element={<Learn userId={userId} />} />
          <Route path="/learn/:topicId" element={<Topic onProgress={setProgress} userId={userId} />} />
          <Route path="/texts" element={<Texts />} />
          <Route path="/texts/:textId" element={<TextDetail />} />
          <Route path="/notebook" element={<Notebook userId={userId} subject="english" api={api} />} />
          <Route path="/summary" element={<WeeklySummary userId={userId} subject="english" progress={progress} api={api} username={auth.username} />} />
          <Route path="/chat" element={<Chat health={health} userId={userId} />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
