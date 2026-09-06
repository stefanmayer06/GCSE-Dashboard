import { NavLink } from 'react-router-dom';
import CommandPalette from './CommandPalette.jsx';

// V3 Trailhead — shared shell for MathsMate + EnglishMate.
//
// One DOM contract, two subject identities. Class names are frozen:
// Playwright (`website/ui-tests/app.spec.js`) asserts on `.sidebar`,
// `.subject-switch`, `.sign-out`, `.nav-item` (exact order + aria-labels),
// `.theme-toggle`. Keep the hierarchy; V3 themes the visuals.
// Groups are Journey / Practise / Review. Icons are inline SVG mapped from
// the legacy two-letter codes so NAV data never changes. No new deps.
export default function AppShell({
  tierClass = '',
  brand = { letter: 'S', name: 'Study Desk', sub: '' },
  nav = [],
  auth = null,
  progress = null,
  healthNote = null,
  theme = 'light',
  onToggleTheme = () => {},
  onSignOut = () => {},
  paletteItems = [],
  notebookDue = null,
  children = null,
}) {
  const dark = theme === 'dark';
  // Group nav without changing routes, labels or order (Playwright asserts
  // the exact link order). A group heading is emitted the first time its
  // group appears while walking `nav` in order.
  const groups = [
    { id: 'journey', label: 'Journey', match: ['/'] },
    { id: 'practise', label: 'Practise', match: ['/practice', '/results', '/learn', '/texts'] },
    { id: 'review', label: 'Review', match: ['/notebook', '/summary', '/chat'] },
  ];
  // Legacy two-letter codes → V3 inline glyphs (NAV data untouched).
  const glyphFor = (code, label) => {
    const glyphs = {
      '01': '◈', '02': '◐', '03': '✎', '04': '▤',
      '05': '✓', '06': '✦', '07': '✦',
    };
    if (glyphs[code]) return glyphs[code];
    const fallbacks = {
      Dashboard: '◈', Practice: '◐', Papers: '◐', Learn: '✎',
      Texts: '▤', Notebook: '↻', Summary: '✓', 'AI Tutor': '✦',
    };
    return fallbacks[label] || '·';
  };
  const groupOf = (to) => (groups.find((g) => g.match.includes(to)) || groups[0]).id;
  const groupLabel = (id) => (groups.find((g) => g.id === id) || {}).label || id;
  let lastGroup = null;
  return (
    <div className={`app ${tierClass}`.trim()}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar" aria-label="Study section">
        <div className="logo">
          <span className="logo-icon" aria-hidden="true">{brand.letter}</span>
          <div>
            <div className="logo-name">{brand.name}</div>
            {brand.sub ? <div className="logo-sub">{brand.sub}</div> : null}
          </div>
          {paletteItems.length > 0 ? (
            <button
              type="button"
              className="mobile-palette-btn"
              aria-label="Quick jump to any page or topic (Control K)"
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
            >
              <span aria-hidden="true">⌘K</span>
            </button>
          ) : null}
        </div>
        <a className="subject-switch" href="/" aria-label="Return to all subjects">
          <span aria-hidden="true">←</span><span className="subject-switch-label">All subjects</span>
        </a>
        <nav aria-label="Study sections">
          {nav.map((item) => {
            const g = groupOf(item.to);
            const showLabel = g !== lastGroup;
            lastGroup = g;
            return (
              <div key={item.to} className="nav-group" role="group" aria-label={groupLabel(g)} style={{ display: 'contents' }}>
                {showLabel ? <div className="nav-group-label" aria-hidden="true">{groupLabel(g)}</div> : null}
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  aria-label={item.label}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon" aria-hidden="true">{glyphFor(item.icon, item.label)}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.to === '/notebook' && notebookDue > 0 ? (
                    <span className="nav-badge" aria-label={`${notebookDue} mistakes due`}>{notebookDue > 9 ? '9+' : notebookDue}</span>
                  ) : null}
                </NavLink>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          {paletteItems.length > 0 ? (
            <div className="palette-slot">
              <CommandPalette items={paletteItems} />
            </div>
          ) : null}
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-pressed={dark}
            aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
          >
            <span className="theme-toggle-icon" aria-hidden="true">{dark ? '◑' : '◐'}</span>
            <span>{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button type="button" className="sign-out" onClick={onSignOut} aria-label={`Sign out${auth?.username ? ` (${auth.username})` : ''}`}>
            <span className="sign-out-label">Sign out</span>
            {auth?.username ? <span className="sign-out-user">&middot; {auth.username}</span> : null}
          </button>
          {progress ? (
            <div className="level-card" aria-label={`Level ${progress.level}, ${progress.streak > 0 ? `${progress.streak} day streak` : 'streak paused, rest is part of the plan'}${progress.streakFreezes ? `, ${progress.streakFreezes} streak freezes banked` : ''}`}>
              <div className="level-row">
                <span>Level {progress.level}</span>
                <span className="streak-mark">
                  <span className="streak-dot" aria-hidden="true" />
                  {progress.streak > 0 ? `${progress.streak} day${progress.streak === 1 ? '' : 's'}` : 'Paused'}
                </span>
              </div>
              <div className="xp-bar" role="img" aria-label={`${progress.xpInto} of ${progress.xpNeeded} XP to next level`}>
                <div className="xp-fill" style={{ width: `${Math.min(100, (progress.xpInto / progress.xpNeeded) * 100)}%` }} />
              </div>
              <div className="xp-note">
                {progress.xpInto}/{progress.xpNeeded} XP to next level
                {progress.streakFreezes > 0 ? ` · ${progress.streakFreezes} freeze${progress.streakFreezes === 1 ? '' : 's'} banked` : ''}
              </div>
            </div>
          ) : null}
          {healthNote ? <div className="bank-note">{healthNote}</div> : null}
          <div className="shell-foot-links" aria-label="Support">
            <a href="/support.html">Support</a>
            <a href="/feedback.html">Feedback</a>
          </div>
        </div>
      </aside>
      <main className="content" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
