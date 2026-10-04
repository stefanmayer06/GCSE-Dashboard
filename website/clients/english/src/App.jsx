import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { clearSupabaseSession } from '../../shared/supabase.js';
import { clearResourceCache, preloadResource, useResource } from '../../shared/resource-cache.js';
import { preloadablePage, preloadRoute } from '../../shared/page-preload.js';
import { flattenTopics } from '../../shared/study.js';
import { dueMistakeRows, hydratePersonal } from '../../shared/study-personal.js';
import AppShell from '../../shared/AppShell.jsx';
import LoginScreen from '../../shared/login.jsx';
import Pip from '../../shared/circuit/Pip.jsx';

// Route pages are code-split. The page a learner lands on is loaded while
// the sign-in splash is up; the core revision loop is prefetched during
// idle time on capable connections; save-data and 2G users stay on demand.
const Dashboard = preloadablePage(() => import('./pages/Dashboard.jsx'));
const Practice = preloadablePage(() => import('./pages/Practice.jsx'));
const Results = preloadablePage(() => import('./pages/Results.jsx'));
const Learn = preloadablePage(() => import('./pages/Learn.jsx'));
const Topic = preloadablePage(() => import('./pages/Topic.jsx'));
const Texts = preloadablePage(() => import('./pages/Texts.jsx'));
const TextDetail = preloadablePage(() => import('./pages/TextDetail.jsx'));
const Chat = preloadablePage(() => import('./pages/Chat.jsx'));
const GraphicsLab = preloadablePage(() => import('../../shared/GraphicsLab.jsx'));
const Notebook = preloadablePage(() => import('../../shared/StudyTools.jsx').then((m) => ({ default: m.Notebook })));
const WeeklySummary = preloadablePage(() => import('../../shared/StudyTools.jsx').then((m) => ({ default: m.WeeklySummary })));

const PREFETCH_PAGES = [Practice, Results, Learn];

// Mirrors <Routes> below so the landing page can be preloaded.
const PAGE_ROUTES = [
  { path: '/', page: Dashboard },
  { path: '/practice', page: Practice },
  { path: '/results', page: Results },
  { path: '/learn', page: Learn },
  { path: '/learn/:topicId', page: Topic },
  { path: '/texts', page: Texts },
  { path: '/texts/:textId', page: TextDetail },
  { path: '/notebook', page: Notebook },
  { path: '/summary', page: WeeklySummary },
  { path: '/chat', page: Chat },
  { path: '/lab', page: GraphicsLab },
];

// A request that never answers must not trap the learner on the splash;
// after this long the page renders and finishes loading in place.
const BOOT_TIMEOUT_MS = 10000;

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
  // The account whose first screen has finished loading.
  const [readyFor, setReadyFor] = useState(null);
  const bootedFor = useRef(null);
  const location = useLocation();
  const userId = auth?.id || auth?.username;
  const ready = Boolean(userId) && readyFor === userId;

  // Shared with Dashboard via resource-cache: no extra network request.
  const { data: topicCatalog } = useResource(ready ? `topics:english:${userId}` : null, () => api.topics());
  // Same personal cache as the dashboard: feeds the Notebook due badge.
  const { data: personal } = useResource(ready ? `personal:${userId}:english` : null, () => hydratePersonal(api, userId, 'english'));
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
    if (!userId) {
      bootedFor.current = null;
      setReadyFor(null);
      return undefined;
    }
    let active = true;
    let timer;
    const booting = bootedFor.current !== userId;
    if (booting) {
      // A fresh identity must never inherit another session's cached
      // resources or shell counters.
      clearResourceCache();
      setProgress(null);
      setHealth(null);
    }
    const shell = Promise.allSettled([api.progress(), api.health()]).then(([p, h]) => {
      if (!active) return;
      if (p.status === 'fulfilled') setProgress(p.value);
      if (h.status === 'fulfilled') setHealth(h.value);
    });
    if (booting) {
      // Sign-in and page load fetch everything the first screen shows in
      // parallel and keep the splash up until it has all arrived, so the
      // page appears complete rather than filling in section by section.
      const firstScreen = Promise.allSettled([
        shell,
        preloadResource(`topics:english:${userId}`, () => api.topics()),
        preloadResource(`personal:${userId}:english`, () => hydratePersonal(api, userId, 'english')),
        preloadRoute(PAGE_ROUTES, location.pathname, { userId }),
      ]);
      const timeout = new Promise((resolve) => { timer = window.setTimeout(resolve, BOOT_TIMEOUT_MS); });
      Promise.race([firstScreen, timeout]).then(() => {
        window.clearTimeout(timer);
        if (!active) return;
        bootedFor.current = userId;
        setReadyFor(userId);
      });
    }
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [location.pathname, userId]);

  useEffect(() => {
    if (!ready) return undefined;
    const schedule = window.requestIdleCallback ?? ((cb) => window.setTimeout(cb, 250));
    const cancel = window.cancelIdleCallback ?? ((id) => window.clearTimeout(id));
    const handle = schedule(() => {
      if (!shouldPrefetchRoutes()) return;
      for (const page of PREFETCH_PAGES) page.preload().catch(() => {});
    });
    return () => cancel(handle);
  }, [ready]);

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
    setReadyFor(null);
    setAuth(false);
  };

  if (auth === null || (auth && !ready)) {
    return (
      <div className="login-loading">
        <Pip mood="calm" size={72} bob />
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
      tierClass="english-tier"
      brand={{ letter: 'E', name: 'EnglishMate', sub: 'AQA English Language', strand: 'reading' }}
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
          <Route path="/lab" element={<GraphicsLab subject="english" />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
