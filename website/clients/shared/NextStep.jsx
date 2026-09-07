import { Link } from 'react-router-dom';
import { masteryStage } from './next-step.js';

// V4 Desk Edition — the "Your next move" hero. Answers "What should I do
// now?" in one glance, like a note pinned to the front of a folder:
// big step, sticker facts (streak · readiness · exams), weakest topics
// flagged underneath. State is never colour-alone: ring + facts + stage
// chips all carry text. Kind copy (no punishment): streaks pause, rest
// is part of the plan. Class contract stays frozen for Playwright.
function examLabelFor(examDays, examDate) {
  if (examDays == null) return 'Set date';
  if (examDays < 0) return 'Passed';
  if (examDays === 0) return 'Today';
  if (examDays > 365) {
    const at = Date.parse(examDate ? `${examDate}T12:00:00` : '');
    if (Number.isFinite(at)) return new Date(at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    return 'Set';
  }
  return `${examDays}d`;
}

export function NextStepCard({ step, weak = [], dueCount = 0, streak = null, readinessScore = null, examDays = null, examDate = null }) {
  if (!step) return null;
  const tone =
    step.kind === 'retry' ? 'urgent'
    : step.kind === 'diagnostic' ? 'start'
    : step.kind === 'weak-topic' ? 'focus'
    : 'steady';
  const ringPct = readinessScore != null ? Math.max(0, Math.min(100, readinessScore)) : null;
  const ringC = 2 * Math.PI * 26;
  const ringOff = ringPct == null ? ringC : ringC - (ringC * ringPct) / 100;
  const examLabel = examLabelFor(examDays, examDate);
  const streakLabel = streak == null ? '—' : streak === 0 ? 'Fresh start' : `${streak} day${streak === 1 ? '' : 's'}`;
  return (
    <section className={`panel nextstep-card tone-${tone}`} aria-labelledby="next-step-title">
      <div className="nextstep-hero">
        <div className="nextstep-copy">
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
          </div>
          <p className="hero-scrawl" aria-hidden="true">One step is enough today.</p>
        </div>
        <div className="nextstep-side">
          <div className="nextstep-ring" role="img" aria-label={ringPct != null ? `Readiness ${ringPct} percent, calculated from marked work` : 'Complete marked work to build your readiness score'}>
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <circle className="ring-bg" cx="32" cy="32" r="26" fill="none" strokeWidth="7" />
              <circle
                className="ring-fg"
                cx="32" cy="32" r="26" fill="none" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringOff}
                transform="rotate(-90 32 32)"
              />
              <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="800" fill="currentColor">
                {ringPct != null ? `${ringPct}` : '–'}
              </text>
            </svg>
          </div>
          <span className="nextstep-ring-cap" aria-hidden="true">readiness</span>
        </div>
      </div>
      <dl className="nextstep-facts" aria-label="Your revision progress">
        <div>
          <dt>Streak</dt>
          <dd>{streakLabel}</dd>
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
          <p className="eyebrow">Keep an eye on</p>
          <ul>
            {weak.map((topic) => {
              const stage = masteryStage(topic.accuracy, topic.answered);
              return (
                <li key={topic.id}>
                  <Link to={`/learn/${topic.id}`} className="nextstep-weak-link">
                    <span className="nextstep-weak-name">{topic.name}</span>
                    <span className={`strength strength-${stage.tone}`}>
                      {topic.accuracy != null ? `${topic.accuracy}% · ` : ''}{stage.text}
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
