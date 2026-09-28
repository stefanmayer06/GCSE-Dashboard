import { NavLink } from 'react-router-dom';
import CommandPalette from './CommandPalette.jsx';
import Icon from './circuit/Icon.jsx';
import Emblem from './circuit/Emblem.jsx';
import { HudChip } from './circuit/bits.jsx';

// Circuit shell — shared by MathsMate (Foundation + Higher) and EnglishMate.
//
// Desktop: a night "control rail" (brand, HUD counters, nav, account).
// Tablet: the same rail collapses to icons and scrolls on its own.
// Mobile: the rail becomes a slim top bar and the nav docks as a bottom
// tab bar (Brilliant/Mimo pattern) — all inside the same DOM.
//
// Class contract (asserted by website/ui-tests/app.spec.js): .sidebar,
// .subject-switch, .sign-out, .nav-item (order + aria-labels), .theme-toggle,
// .logo-icon, #main-content. Keep them when restyling.

const NAV_ICONS = {
  Dashboard: 'home',
  Practice: 'practice',
  Papers: 'practice',
  Learn: 'learn',
  Texts: 'texts',
  Notebook: 'notebook',
  Summary: 'summary',
  'AI Tutor': 'tutor',
};

const GROUPS = [
  { id: 'journey', label: 'Home', match: ['/'] },
  { id: 'practise', label: 'Study', match: ['/practice', '/results', '/learn', '/texts'] },
  { id: 'review', label: 'Review', match: ['/notebook', '/summary', '/chat'] },
];

const SHORT_LABELS = { Dashboard: 'Home', 'AI Tutor': 'Tutor', Notebook: 'Retry' };

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
  const groupOf = (to) => (GROUPS.find((g) => g.match.includes(to)) || GROUPS[0]).id;
  const groupLabel = (id) => (GROUPS.find((g) => g.id === id) || {}).label || id;
  const streak = progress?.streak ?? 0;
  const xpPct = progress?.xpNeeded ? Math.min(100, (progress.xpInto / progress.xpNeeded) * 100) : 0;
  let lastGroup = null;

  return (
    <div className={`app ${tierClass}`.trim()}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar" aria-label="Study section">
        <div className="logo">
          <span className="logo-icon" aria-hidden="true">
            <Emblem topicId={`subject:${brand.name}`} strand={brand.strand || 'number'} layers={3} ring={false} size={30} />
          </span>
          <div className="logo-text">
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
              <Icon name="search" size={20} />
            </button>
          ) : null}
        </div>

        {progress ? (
          <div className="rail-hud" aria-label="Your study counters">
            <HudChip icon="flame" tone="flame" value={streak} label={streak === 1 ? 'day' : 'days'} title={streak > 0 ? `${streak} day streak` : 'Streak paused — rest is part of the plan'} />
            <HudChip icon="gem" tone="gem" value={progress.xp ?? progress.xpInto ?? 0} label="XP" title={`${progress.xp ?? progress.xpInto ?? 0} XP earned`} />
            <HudChip icon="bolt" tone="bolt" value={progress.level ?? 1} label="lvl" title={`Level ${progress.level ?? 1}`} />
          </div>
        ) : null}

        <a className="subject-switch" href="/" aria-label="Return to all subjects">
          <Icon name="arrowLeft" size={18} />
          <span className="subject-switch-label">All subjects</span>
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
                  <span className="nav-icon" aria-hidden="true">
                    <Icon name={NAV_ICONS[item.label] || 'sparkle'} size={22} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-short" aria-hidden="true">{SHORT_LABELS[item.label] || item.label}</span>
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
          {progress ? (
            <div
              className="level-card"
              aria-label={`Level ${progress.level}, ${progress.streak > 0 ? `${progress.streak} day streak` : 'streak paused, rest is part of the plan'}${progress.streakFreezes ? `, ${progress.streakFreezes} streak freezes banked` : ''}`}
            >
              <div className="level-row">
                <span className="level-name">Level {progress.level}</span>
                <span className="streak-mark">
                  <span className="streak-dot" aria-hidden="true" />
                  {progress.streak > 0 ? `${progress.streak} day${progress.streak === 1 ? '' : 's'}` : 'Paused'}
                </span>
              </div>
              <div className="xp-bar" role="img" aria-label={`${progress.xpInto} of ${progress.xpNeeded} XP to next level`}>
                <div className="xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
              <div className="xp-note">
                {progress.xpInto}/{progress.xpNeeded} XP to next level
                {progress.streakFreezes > 0 ? ` · ${progress.streakFreezes} freeze${progress.streakFreezes === 1 ? '' : 's'} banked` : ''}
              </div>
            </div>
          ) : null}
          <div className="rail-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={onToggleTheme}
              aria-pressed={dark}
              aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
            >
              <Icon name={dark ? 'sun' : 'moon'} size={20} />
              <span className="theme-toggle-label">{dark ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <button type="button" className="sign-out" onClick={onSignOut} aria-label={`Sign out${auth?.username ? ` (${auth.username})` : ''}`}>
              <Icon name="signOut" size={20} />
              <span className="sign-out-label">Sign out</span>
              {auth?.username ? <span className="sign-out-user">&middot; {auth.username}</span> : null}
            </button>
          </div>
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
