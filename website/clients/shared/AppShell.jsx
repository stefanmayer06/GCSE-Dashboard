import { NavLink } from 'react-router-dom';
import CommandPalette from './CommandPalette.jsx';

// 2.1 — Shared application shell for MathsMate + EnglishMate.
//
// One DOM contract, two subject identities. Class names are frozen:
// Playwright (`website/ui-tests/app.spec.js`) asserts on `.sidebar`,
// `.subject-switch`, `.sign-out` and `.nav-item`, and the responsive
// stylesheet repurposes this exact structure into the sticky top bar +
// bottom tab bar below 760px. Keep the hierarchy; theme the accents.
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
  children = null,
}) {
  const dark = theme === 'dark';
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
        </div>
        <a className="subject-switch" href="/" aria-label="Return to all subjects">
          <span aria-hidden="true">←</span><span className="subject-switch-label">All subjects</span>
        </a>
        <nav aria-label="Study sections">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              aria-label={item.label}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
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
            <div className="level-card" aria-label={`Level ${progress.level}, ${progress.streak} day streak`}>
              <div className="level-row">
                <span>Level {progress.level}</span>
                <span className="streak-mark">
                  <span className="streak-dot" aria-hidden="true" />
                  {progress.streak} day{progress.streak === 1 ? '' : 's'}
                </span>
              </div>
              <div className="xp-bar" role="img" aria-label={`${progress.xpInto} of ${progress.xpNeeded} XP to next level`}>
                <div className="xp-fill" style={{ width: `${Math.min(100, (progress.xpInto / progress.xpNeeded) * 100)}%` }} />
              </div>
              <div className="xp-note">{progress.xpInto}/{progress.xpNeeded} XP to next level</div>
            </div>
          ) : null}
          {healthNote ? <div className="bank-note">{healthNote}</div> : null}
        </div>
      </aside>
      <main className="content" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
