import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from './AppShell.jsx';
import { PartnerAvatar, formName, useCreatures } from './creatures.jsx';
import { PLAN_WEEKDAYS, planMinutesDefault, useStudyPlan } from './StudyTools.jsx';
import { masteredSince } from './study-personal.js';
import { readiness } from './study.js';
import { useInstallPrompt } from './pwa.js';
import Icon from './circuit/Icon.jsx';

// Me tab: you, your week's numbers, getting the app on your home screen,
// exam date and plan settings, appearance, help and signing out.

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function InstallCard() {
  const { canInstall, install, installed, ios } = useInstallPrompt();
  const [showSteps, setShowSteps] = useState(false);
  if (installed) return null;
  return (
    <section className="install-card" aria-labelledby="install-title">
      <span className="install-icon" aria-hidden="true"><Icon name="download" size={24} /></span>
      <div className="install-copy">
        <h2 id="install-title">Add Study Desk to your home screen</h2>
        <p>Opens full screen like an app, with no browser bars.</p>
        {showSteps ? (
          <ol className="install-steps">
            {ios ? (
              <>
                <li>Tap the <b>Share</b> button in Safari.</li>
                <li>Choose <b>Add to Home Screen</b>.</li>
                <li>Tap <b>Add</b>. Study Desk appears with your other apps.</li>
              </>
            ) : (
              <>
                <li>Open your browser menu (⋮ or ⋯).</li>
                <li>Choose <b>Install app</b> or <b>Add to Home screen</b>.</li>
                <li>Confirm. Study Desk appears with your other apps.</li>
              </>
            )}
          </ol>
        ) : null}
      </div>
      {canInstall ? (
        <button type="button" className="btn btn-go small" onClick={install}>Install</button>
      ) : (
        <button type="button" className="btn small" aria-expanded={showSteps} onClick={() => setShowSteps((value) => !value)}>
          {showSteps ? 'Hide steps' : 'How?'}
        </button>
      )}
    </section>
  );
}

function Switch({ checked, onChange, label, className = '' }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${className}`.trim()} onClick={onChange}>
      <span className="switch-knob" aria-hidden="true" />
    </button>
  );
}

export default function MePage({ userId, username = '', subject, api, progress = null, topics = [], theme = 'light', onToggleTheme, onSignOut }) {
  const { partner, rank } = useCreatures();
  const { personal, preferences, error, updatePreferences } = useStudyPlan({ userId, subject, api, topics, progress });
  const evidence = readiness(progress);
  const rows = personal?.mistakes ?? [];
  const fixedWeek = masteredSince(rows).length;
  const minutes = preferences.minutesPerDay ?? planMinutesDefault(subject);
  const grades = subject === 'maths' ? ['3', '4', '5'] : ['4', '5', '6', '7', '8', '9'];
  const dark = theme === 'dark';

  return (
    <div className="page me-page">
      <AppHeader />
      <header className="me-head">
        <PartnerAvatar size={76} to="/creatures" className="me-avatar" />
        <div>
          <h1>{username || 'You'}</h1>
          <p className="sub">{partner ? `Partner: ${formName(partner)} · ${rank.name}` : rank.name}</p>
        </div>
      </header>

      <div className="me-grid">
        <section className="me-card numbers-card" aria-labelledby="numbers-title">
          <div className="section-head">
            <h2 id="numbers-title" className="section-title">Your numbers</h2>
            <Link to="/summary" className="section-link">Weekly summary</Link>
          </div>
          <dl className="number-grid">
            <div><dt>Answers</dt><dd>{progress?.practiceAnswered ?? 0}</dd></div>
            <div><dt>Papers</dt><dd>{progress?.testsTaken ?? 0}</dd></div>
            <div><dt>Fixed this week</dt><dd>{fixedWeek}</dd></div>
            <div><dt>Readiness</dt><dd>{evidence.ready ? `${evidence.score}%` : '—'}</dd></div>
          </dl>
        </section>

        <InstallCard />

        <section className="me-card exam-settings" id="exam" aria-labelledby="exam-title">
          <h2 id="exam-title" className="section-title">Exam and plan</h2>
          <label className="field">
            <span>Exam date</span>
            <input type="date" aria-label="Exam date" value={preferences.examDate || ''} onChange={(event) => updatePreferences({ examDate: event.target.value })} />
          </label>
          <div className="field">
            <span id="grade-label">Target grade</span>
            <div className="chip-row" role="radiogroup" aria-labelledby="grade-label">
              {grades.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  role="radio"
                  aria-checked={preferences.targetGrade === grade}
                  className={`choice-chip${preferences.targetGrade === grade ? ' on' : ''}`}
                  onClick={() => updatePreferences({ targetGrade: grade })}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span id="rest-label">Rest days</span>
            <div className="chip-row days" role="group" aria-labelledby="rest-label">
              {PLAN_WEEKDAYS.map((letter, index) => {
                const on = (preferences.restDays || []).includes(index);
                return (
                  <button
                    key={DAY_NAMES[index]}
                    type="button"
                    aria-pressed={on}
                    aria-label={DAY_NAMES[index]}
                    className={`choice-chip day${on ? ' on' : ''}`}
                    onClick={() => {
                      const current = preferences.restDays || [];
                      updatePreferences({ restDays: on ? current.filter((day) => day !== index) : [...current, index].sort((a, b) => a - b) });
                    }}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field">
            <span>Minutes a day</span>
            <span className="stepper">
              <button type="button" className="stepper-btn" aria-label="Fewer minutes per day" onClick={() => updatePreferences({ minutesPerDay: Math.max(5, minutes - 5) })}>−</button>
              <strong aria-live="polite">{minutes} min</strong>
              <button type="button" className="stepper-btn" aria-label="More minutes per day" onClick={() => updatePreferences({ minutesPerDay: Math.min(120, minutes + 5) })}>+</button>
            </span>
          </div>
          <p className="field-note">Rest days and minutes shape next week’s plan.</p>
          {error ? <p className="plan-note error" role="alert">{error}</p> : null}
        </section>

        <section className="me-card settings-card" aria-label="Settings and help">
          <div className="settings-row">
            <span className="settings-label">
              <Icon name={dark ? 'moon' : 'sun'} size={20} />
              Dark mode
            </span>
            <Switch checked={dark} onChange={onToggleTheme} label="Dark mode" className="theme-toggle" />
          </div>
          <a className="settings-row link" href="/support.html"><span className="settings-label"><Icon name="bulb" size={20} />Help and support</span><Icon name="chevronRight" size={18} /></a>
          <a className="settings-row link" href="/feedback.html"><span className="settings-label"><Icon name="pen" size={20} />Send feedback</span><Icon name="chevronRight" size={18} /></a>
          <a className="settings-row link" href="/privacy.html"><span className="settings-label"><Icon name="lock" size={20} />Privacy</span><Icon name="chevronRight" size={18} /></a>
          <button type="button" className="settings-row sign-out" onClick={onSignOut}>
            <span className="settings-label"><Icon name="signOut" size={20} />Sign out</span>
            {username ? <span className="sign-out-user">{username}</span> : null}
          </button>
        </section>
      </div>
    </div>
  );
}
