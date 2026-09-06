import { Link } from 'react-router-dom';
import { strengthLabel } from './next-step.js';

// 2.1 — Learning command centre card (v3 Command Desk).
//
// Answers "What should I study next?" in one glance using data the
// dashboard already holds. State is never colour-alone: every meter
// carries a text label (Secure / Developing / Focus) alongside its fill.
// v3: progress ring (readiness), urgency tone (exam countdown / due load),
// secondary retry action, and ⌘K discoverability hint.
export function NextStepCard({ step, weak = [], dueCount = 0, streak = null, readinessScore = null, examDays = null }) {
  if (!step) return null;
  const tone =
    step.kind === 'retry' ? 'urgent'
    : step.kind === 'diagnostic' ? 'start'
    : step.kind === 'weak-topic' ? 'focus'
    : 'steady';
  const ringPct = readinessScore != null ? Math.max(0, Math.min(100, readinessScore)) : null;
  const ringC = 2 * Math.PI * 26;
  const ringOff = ringPct == null ? ringC : ringC - (ringC * ringPct) / 100;
  const examLabel = examDays == null ? 'Set date' : examDays < 0 ? 'Passed' : examDays === 0 ? 'Today' : `${examDays}d`;
  return (
    <section className={`panel nextstep-card tone-${tone}`} aria-labelledby="next-step-title">
      <div className="nextstep-top">
        <div className="nextstep-ring" role="img" aria-label={ringPct != null ? `Readiness ${ringPct} percent` : 'Readiness still building'}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle className="ring-bg" cx="32" cy="32" r="26" fill="none" strokeWidth="7" />
            <circle
              className="ring-fg"
              cx="32" cy="32" r="26" fill="none" strokeWidth="7" strokeLinecap="butt"
              strokeDasharray={ringC} strokeDashoffset={ringOff}
              transform="rotate(-90 32 32)"
            />
            <text x="32" y="36" textAnchor="middle" fontSize="14" fontWeight="800" fill="currentColor">
              {ringPct != null ? `${ringPct}` : '–'}
            </text>
          </svg>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="eyebrow">{step.eyebrow || 'Up next'}</p>
          <h2 id="next-step-title">{step.title}</h2>
          <p className="sub">{step.detail}</p>
          <div className="nextstep-cta-row">
            <Link className="btn btn-primary" to={step.href}>{step.cta || 'Continue'}</Link>
            {step.kind !== 'retry' && dueCount > 0 && (
              <Link className="btn" to="/notebook">
                {dueCount === 1 ? '1 mistake due' : `${dueCount} due`} · retry
              </Link>
            )}
            <span className="nextstep-kbd" title="Press Control or Command and K to jump anywhere">⌘K jump</span>
          </div>
        </div>
      </div>
        <dl className="nextstep-facts" aria-label="Your position">
          <div>
            <dt>Streak</dt>
            <dd>{streak != null ? `${streak} day${streak === 1 ? '' : 's'}` : '—'}</dd>
          </div>
          <div>
            <dt>Readiness</dt>
            <dd>{readinessScore != null ? `${readinessScore}%` : 'Building'}</dd>
          </div>
          <div>
            <dt>Exams in</dt>
            <dd>{examLabel}</dd>
          </div>
        </dl>
      {weak.length > 0 && (
        <div className="nextstep-weak">
          <p className="eyebrow">Weakest right now</p>
          <ul>
            {weak.map((topic) => {
              const strength = strengthLabel(topic.accuracy);
              return (
                <li key={topic.id}>
                  <Link to={`/learn/${topic.id}`} className="nextstep-weak-link">
                    <span className="nextstep-weak-name">{topic.name}</span>
                    <span className={`strength strength-${strength.tone}`}>
                      {topic.accuracy != null ? `${topic.accuracy}% · ` : ''}{strength.text}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
