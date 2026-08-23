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
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/practice', label: 'Practice Exam', icon: '⏱' },
  { to: '/learn', label: 'Learn', icon: '📚' },
  { to: '/chat', label: 'AI Tutor', icon: '🤖' },
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
          <span className="logo-icon">🧮</span>
          <div>
            <div className="logo-name">MathsMate</div>
            <div className="logo-sub">AQA Foundation</div>
          </div>
        </div>
        <a className="subject-switch" href="/">← All subjects</a>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
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
