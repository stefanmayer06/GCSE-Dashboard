import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import CommandPalette from './CommandPalette.jsx';
import Icon from './circuit/Icon.jsx';
import Critter from './circuit/Critter.jsx';
import SubjectSheet, { SubjectEmblem, subjectInfo } from './SubjectSheet.jsx';
import { CreatureProvider, PartnerAvatar, formName, useCreatures } from './creatures.jsx';
import { PipProvider } from './PipChat.jsx';
import { readiness } from './study.js';

// Study Desk app shell, shared by Maths (Foundation + Higher) and English.
//
// Five destinations: Today, Learn, Practice, Creatures and Me.
// Phone: a floating bottom tab bar; each screen draws its own header (subject
// pill, streak, partner). Desktop and tablet: a night rail with the subject
// switcher, the tabs and your partner creature.
// Focus mode hides both while a lesson, paper or retry is on screen.
//
// Class contract (asserted by website/ui-tests/app.spec.js): .sidebar,
// .subject-switch, .nav-item (order + aria-labels), .logo-icon, #main-content.

const NAV_ICONS = { Today: 'home', Learn: 'learn', Practice: 'practice', Creatures: 'egg', Me: 'user' };

const ShellContext = createContext({
  subject: 'maths',
  streak: 0,
  focus: false,
  setFocus: () => {},
  openSubjects: () => {},
});

export function useShell() {
  return useContext(ShellContext);
}

// Hides the tab bar and rail while the calling screen is mounted and active.
export function useFocusMode(active = true) {
  const { setFocus } = useShell();
  useEffect(() => {
    if (!active) return undefined;
    setFocus((count) => count + 1);
    return () => setFocus((count) => Math.max(0, count - 1));
  }, [active, setFocus]);
}

function isActive(item, pathname) {
  return (item.match || [item.to]).some((path) => (path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)));
}

// Header for the tab screens: subject pill (opens the switcher), optional
// page actions, the streak and your partner creature.
export function AppHeader({ children = null, showStreak = true }) {
  const { subject, streak, openSubjects } = useShell();
  const info = subjectInfo(subject);
  return (
    <header className="app-header">
      <button type="button" className="subject-pill" onClick={openSubjects} aria-label={`Switch subject. Now: ${info.name}`}>
        <SubjectEmblem subject={subject} size={30} />
        <span className="subject-pill-name">{info.short}</span>
        <span className="subject-pill-tier">{info.tier}</span>
        <Icon name="chevronDown" size={18} strokeWidth={2.4} />
      </button>
      <span className="app-header-space" />
      {children}
      {showStreak ? (
        <Link to="/creatures" className="streak-chip" aria-label={streak > 0 ? `${streak} day streak` : 'No streak yet'}>
          <Icon name="flame" size={20} />
          <b>{streak}</b>
        </Link>
      ) : null}
      <PartnerAvatar size={44} className="header-partner" />
    </header>
  );
}

function RailPartner() {
  const { partner, rank } = useCreatures();
  if (!partner) return null;
  return (
    <Link to="/creatures" className="rail-partner" aria-label={`Creatures. Your partner ${formName(partner)}, ${rank.name}`}>
      <span className="rail-partner-art" aria-hidden="true">
        <Critter id={partner.id} tier={partner.tier} progress={partner.toNext} size={58} />
      </span>
      <span className="rail-partner-copy">
        <strong>{formName(partner)}</strong>
        <small>{rank.name} · {rank.total}/{rank.max}</small>
        <span className="growth-meter-track" aria-hidden="true"><i style={{ width: `${Math.round((partner.next == null ? 1 : partner.toNext) * 100)}%` }} /></span>
      </span>
    </Link>
  );
}

export default function AppShell({
  tierClass = '',
  subject = 'maths',
  brand = { name: 'Study Desk', sub: '' },
  nav = [],
  progress = null,
  personal = null,
  topicCount = 0,
  health = null,
  api = null,
  userId = null,
  paletteItems = [],
  practiceDue = 0,
  children = null,
}) {
  const location = useLocation();
  const [focusCount, setFocus] = useState(0);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const openSubjects = useCallback(() => setSubjectsOpen(true), []);
  const focus = focusCount > 0;
  const streak = progress?.streak ?? 0;
  const info = subjectInfo(subject);

  useEffect(() => {
    document.documentElement.classList.toggle('in-focus-mode', focus);
    return () => document.documentElement.classList.remove('in-focus-mode');
  }, [focus]);

  const shellValue = useMemo(() => ({ subject, streak, focus, setFocus, openSubjects }), [subject, streak, focus, openSubjects]);

  const examDate = personal?.preferences?.examDate || '';
  const evidence = readiness(progress);
  const status = [
    evidence.ready ? `Readiness ${evidence.score}%` : null,
    examDate ? `exams ${new Date(`${examDate}T12:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` : null,
  ].filter(Boolean).join(' · ').replace(/^./, (letter) => letter.toUpperCase());

  return (
    <ShellContext.Provider value={shellValue}>
      <CreatureProvider subject={subject} userId={userId} progress={progress} mistakes={personal?.mistakes ?? null} topicCount={topicCount}>
        <PipProvider api={api} subject={subject} userId={userId} health={health}>
          <div className={`app ${tierClass}${focus ? ' focus-mode' : ''}`.trim()}>
            <a className="skip-link" href="#main-content">Skip to content</a>
            <aside className="sidebar" aria-label="Study Desk">
              <div className="logo">
                <span className="logo-icon" aria-hidden="true">
                  <SubjectEmblem subject={subject} size={30} />
                </span>
                <div className="logo-text">
                  <div className="logo-name">Study Desk</div>
                  <div className="logo-sub">{brand.sub || info.detail}</div>
                </div>
              </div>

              <button type="button" className="subject-switch" onClick={openSubjects} aria-label={`Switch subject. Now: ${info.name}`}>
                <span className="subject-switch-copy">
                  <span className="subject-switch-name">{info.name}</span>
                  <span className="subject-switch-label">Switch subject</span>
                </span>
                <Icon name="chevronDown" size={18} />
              </button>

              <nav aria-label="Main">
                {nav.map((item) => {
                  const active = isActive(item, location.pathname);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-label={item.label}
                      aria-current={active ? 'page' : undefined}
                      className={`nav-item${active ? ' active' : ''}`}
                    >
                      <span className="nav-icon" aria-hidden="true">
                        <Icon name={NAV_ICONS[item.label] || 'sparkle'} size={22} />
                      </span>
                      <span className="nav-label">{item.label}</span>
                      {item.to === '/practice' && practiceDue > 0 ? (
                        <span className="nav-badge" aria-label={`${practiceDue} ${practiceDue === 1 ? 'retry' : 'retries'} due`}>{practiceDue > 9 ? '9+' : practiceDue}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>

              <div className="sidebar-foot">
                {paletteItems.length > 0 ? (
                  <div className="palette-slot">
                    <CommandPalette items={paletteItems} />
                  </div>
                ) : null}
                <RailPartner />
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
          {subjectsOpen ? (
            <SubjectSheet current={subject} status={status} pathname={location.pathname} onClose={() => setSubjectsOpen(false)} />
          ) : null}
        </PipProvider>
      </CreatureProvider>
    </ShellContext.Provider>
  );
}
