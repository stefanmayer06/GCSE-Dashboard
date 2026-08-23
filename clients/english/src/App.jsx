import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Practice from './pages/Practice.jsx';
import Results from './pages/Results.jsx';
import Learn from './pages/Learn.jsx';
import Topic from './pages/Topic.jsx';
import Texts from './pages/Texts.jsx';
import TextDetail from './pages/TextDetail.jsx';
import Chat from './pages/Chat.jsx';
import { api } from './api.js';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '01' },
  { to: '/practice', label: 'Practice Papers', icon: '02' },
  { to: '/learn', label: 'Learn', icon: '03' },
  { to: '/texts', label: 'The Texts', icon: '04' },
  { to: '/chat', label: 'AI Tutor', icon: '05' },
];

export default function App() {
  const [progress, setProgress] = useState(null);
  const [health, setHealth] = useState(null);
  const location = useLocation();

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
        <Routes>
          <Route path="/" element={<Dashboard health={health} progress={progress} />} />
          <Route path="/practice" element={<Practice health={health} />} />
          <Route path="/results" element={<Results />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:topicId" element={<Topic />} />
          <Route path="/texts" element={<Texts />} />
          <Route path="/texts/:textId" element={<TextDetail />} />
          <Route path="/chat" element={<Chat health={health} />} />
        </Routes>
      </main>
    </div>
  );
}
