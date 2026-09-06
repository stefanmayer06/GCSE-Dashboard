import { Link } from 'react-router-dom';
import { strengthLabel } from './next-step.js';

// 2.1 — Learning command centre card.
//
// Answers "What should I study next?" in one glance using data the
// dashboard already holds. State is never colour-alone: every meter
// carries a text label (Secure / Developing / Focus) alongside its fill.
export function NextStepCard({ step, weak = [], dueCount = 0, streak = null, readinessScore = null, examDays = null }) {
  if (!step) return null;
  return (
    <section className="panel nextstep-card" aria-labelledby="next-step-title">
      <div className="nextstep-main">
        <div>
          <p className="eyebrow">{step.eyebrow || 'Up next'}</p>
          <h2 id="next-step-title">{step.title}</h2>
          <p className="sub">{step.detail}</p>
          <div className="study-actions">
            <Link className="btn btn-primary" to={step.href}>{step.cta || 'Continue'}</Link>
            {step.kind !== 'retry' && dueCount > 0 && (
              <Link className="btn" to="/notebook">
                {dueCount === 1 ? '1 mistake due' : `${dueCount} due`} · retry
              </Link>
            )}
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
            <dd>{examDays == null ? 'Set date' : examDays < 0 ? 'Passed' : `${examDays}d`}</dd>
          </div>
        </dl>
      </div>
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
