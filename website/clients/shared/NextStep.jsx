import { Link } from 'react-router-dom';
import IsoTile from './circuit/IsoTile.jsx';
import Icon from './circuit/Icon.jsx';
import { ProgressRing } from './circuit/bits.jsx';
import { SubjectScene } from './circuit/Scenes.jsx';
import { strandInfo } from './circuit/palette.js';
import { masteryStage } from './next-step.js';

// Circuit "Up next" hero — the Brilliant continue card. Answers "What do I
// do now?" in one glance: the step, one big button, and the three facts
// that matter (streak, readiness, exam countdown). If the step is a lesson
// the art is that lesson's own level tile, beam on. State is never
// colour-alone: every fact carries text.
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

export function NextStepCard({ step, weak = [], dueCount = 0, streak = null, readinessScore = null, examDays = null, examDate = null, topics = [], subject = 'maths' }) {
  if (!step) return null;
  const tone =
    step.kind === 'retry' ? 'urgent'
    : step.kind === 'diagnostic' ? 'start'
    : step.kind === 'weak-topic' ? 'focus'
    : 'steady';
  const ringPct = readinessScore != null ? Math.max(0, Math.min(100, readinessScore)) : null;
  const examLabel = examLabelFor(examDays, examDate);
  const streakLabel = streak == null ? '—' : streak === 0 ? 'Fresh start' : `${streak} day${streak === 1 ? '' : 's'}`;
  const lessonId = step.href?.startsWith('/learn/') ? step.href.slice('/learn/'.length).split(/[?#]/)[0] : null;
  const lesson = lessonId ? topics.find((topic) => topic.id === lessonId) : null;
  const strand = lesson ? (lesson.strand || lesson.section) : null;

  return (
    <section className={`panel nextstep-card tone-${tone}`} aria-labelledby="next-step-title">
      <div className="nextstep-hero">
        <div className="nextstep-copy">
          <p className="eyebrow">{step.eyebrow || 'Up next'}</p>
          <h2 id="next-step-title">{step.title}</h2>
          <p className="sub">{step.detail}</p>
          <div className="nextstep-cta-row">
            <Link className="btn btn-go nextstep-go" to={step.href}>
              {step.cta || 'Continue'} <Icon name="arrowRight" size={18} />
            </Link>
            {step.kind !== 'retry' && dueCount > 0 && (
              <Link className="btn nextstep-due" to="/notebook">
                <Icon name="notebook" size={18} /> {dueCount === 1 ? '1 mistake due' : `${dueCount} due`} · retry
              </Link>
            )}
          </div>
        </div>
        <div className="nextstep-art" aria-hidden="true">
          {lesson ? (
            <IsoTile topicId={lesson.id} strand={strand} hue={strandInfo(strand).hue} state="current" stage={masteryStage(lesson.accuracy, lesson.answered).id} size={220} />
          ) : (
            <SubjectScene subject={subject} />
          )}
        </div>
      </div>
      <dl className="nextstep-facts" aria-label="Your revision progress">
        <div className="fact-streak">
          <dt><Icon name="flame" size={16} /> Streak</dt>
          <dd>{streakLabel}</dd>
        </div>
        <div className="fact-ready">
          <dt><Icon name="target" size={16} /> Readiness</dt>
          <dd>
            <ProgressRing
              value={ringPct}
              size={34}
              stroke={9}
              label={ringPct != null ? `Readiness ${ringPct} percent, calculated from marked work` : 'Complete marked work to build your readiness score'}
            >
              {''}
            </ProgressRing>
            {readinessScore != null ? `${readinessScore}%` : 'Building'}
          </dd>
        </div>
        <div className="fact-exam">
          <dt><Icon name="calendar" size={16} /> Exams in</dt>
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
