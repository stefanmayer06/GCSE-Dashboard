import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from './circuit/Icon.jsx';
import Pip from './circuit/Pip.jsx';
import Critter from './circuit/Critter.jsx';
import { Stars } from './circuit/bits.jsx';
import { hueVar, starsFor, strandInfo } from './circuit/palette.js';
import { masteryStage } from './next-step.js';
import { ERROR_TYPES } from './study-personal.js';
import { useFocusMode } from './AppShell.jsx';
import { CreatureGains, nameOf, useCreatures } from './creatures.jsx';
import { AskPipButton } from './PipChat.jsx';
import ExplainerPlayer from './explainer/Player.jsx';
import { autoScript } from './explainer/autoscript.js';

// Lesson kit, shared by Maths and English. A lesson is four steps, shown
// one at a time in focus mode (no tab bar or rail):
//   1 Watch    interactive explainer (authored script or auto talk-through)
//   2 Learn    the notes as stepped cards (predict-then-reveal examples)
//   3 Practise the subject's quick practice, one question at a time
//   4 Master   stars from marked evidence, what next, sources
// The step lives in the URL hash (#watch, #learn, #practise, #master) so
// the back button walks back through the lesson. Step completion is
// session-only UI state; stars come from server topic accuracy.

export const STAGES = [
  { id: 'watch', label: 'Watch', icon: 'play' },
  { id: 'learn', label: 'Learn', icon: 'bulb' },
  { id: 'practise', label: 'Practise', icon: 'target' },
  { id: 'master', label: 'Master', icon: 'trophy' },
];

function scrollToTop() {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const behavior = reduced ? 'auto' : 'instant';
  document.getElementById('main-content')?.scrollTo({ top: 0, behavior });
  window.scrollTo({ top: 0, behavior });
}

// stages: [{ id, title, sub, content, hideNav }] in STAGES order.
export function LessonFlow({
  topic,
  strand,
  eyebrow,
  sub,
  backTo = '/learn',
  backLabel = 'All topics',
  completed = false,
  stages,
  stagesDone = {},
  pipContext = null,
}) {
  useFocusMode(true);
  const location = useLocation();
  const navigate = useNavigate();
  const headingRef = useRef(null);
  const ids = stages.map((stage) => stage.id);
  const requested = location.hash.replace(/^#(stage-)?/, '');
  const current = ids.includes(requested) ? requested : ids[0];
  const index = ids.indexOf(current);
  const stage = stages[index];
  const prev = stages[index - 1] || null;
  const next = stages[index + 1] || null;
  const answered = topic.answered ?? (topic.accuracy != null ? 5 : 0);
  const stars = starsFor(topic.accuracy, answered);
  const mastery = masteryStage(topic.accuracy, answered);
  const info = strandInfo(strand);
  const firstRender = useRef(true);

  const go = useCallback((id) => {
    navigate({ hash: `#${id}` });
  }, [navigate]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    scrollToTop();
    headingRef.current?.focus({ preventScroll: true });
  }, [current]);

  const labelFor = (id) => STAGES.find((item) => item.id === id)?.label || id;

  return (
    <div className="lesson-flow" style={{ '--strand': hueVar(info.hue) }}>
      <div className="lesson-bar">
        <Link to={backTo} className="lesson-close" aria-label={`Close lesson. Back to ${backLabel.toLowerCase()}`}>
          <Icon name="close" size={22} strokeWidth={2.4} />
        </Link>
        <ol className="lesson-steps" aria-label="Lesson steps">
          {stages.map((item, position) => (
            <li key={item.id}>
              <button
                type="button"
                className={`lesson-step${item.id === current ? ' current' : ''}${stagesDone[item.id] ? ' done' : ''}`}
                aria-current={item.id === current ? 'step' : undefined}
                aria-label={`Step ${position + 1}: ${labelFor(item.id)}${stagesDone[item.id] ? ', done' : ''}`}
                onClick={() => go(item.id)}
              >
                <span className="lesson-step-bar" aria-hidden="true" />
                <span className="lesson-step-label" aria-hidden="true">{labelFor(item.id)}</span>
              </button>
            </li>
          ))}
        </ol>
        <AskPipButton iconOnly context={pipContext} className="btn lesson-pip" />
      </div>

      <header className="page-head lesson-head">
        <div className="lesson-head-copy">
          <p className="eyebrow lesson-eyebrow"><span className="strand-pip" aria-hidden="true" />{eyebrow}</p>
          <h1>{topic.name}</h1>
          <p className="sub">{sub}</p>
          {completed ? <div className="lesson-stamp topic-complete-stamp">Lesson completed</div> : null}
        </div>
        <div className="lesson-head-stars" aria-label={`${stars} of 3 stars. ${mastery.text}`}>
          <Stars count={stars} size={22} label={false} />
          <span className={`v3-stage ${mastery.id}`}>{mastery.text}</span>
        </div>
      </header>

      <section className={`lesson-stage stage-${stage.id}`} id={`stage-${stage.id}`} aria-labelledby={`stage-${stage.id}-title`}>
        <div className="lesson-stage-head">
          <span className="lesson-stage-n" aria-hidden="true">{index + 1}</span>
          <div>
            <p className="lesson-step-count">Step {index + 1} of {stages.length}</p>
            <h2 id={`stage-${stage.id}-title`} ref={headingRef} tabIndex={-1}>{stage.title}</h2>
            {stage.sub ? <p className="sub">{stage.sub}</p> : null}
          </div>
        </div>
        {typeof stage.content === 'function' ? stage.content({ go, next }) : stage.content}
      </section>

      {stage.hideNav ? null : (
        <nav className="lesson-stage-nav" aria-label="Lesson navigation">
          {prev ? (
            <button type="button" className="btn" onClick={() => go(prev.id)}>
              <Icon name="chevronLeft" size={18} /> {labelFor(prev.id)}
            </button>
          ) : <span />}
          {next ? (
            <button type="button" className="btn btn-go" onClick={() => go(next.id)}>
              Next: {next.title} <Icon name="arrowRight" size={18} />
            </button>
          ) : (
            <Link className="btn btn-go" to={backTo}>Finish lesson <Icon name="check" size={18} strokeWidth={2.6} /></Link>
          )}
        </nav>
      )}
    </div>
  );
}

export function LessonExplainer({ topic, subject, authored = null, onDone, onNext }) {
  const script = useMemo(() => authored || autoScript(topic, { subject }), [authored, topic, subject]);
  if (!script) return null;
  return (
    <ExplainerPlayer
      script={script}
      onComplete={() => onDone?.()}
      onContinue={() => {
        onDone?.();
        onNext?.();
      }}
      continueLabel="On to the notes"
    />
  );
}

// Notes as stepped cards. Every card stays in the DOM (fast revision
// skimming + search); worked examples hide the method until the learner
// has had a go — predict, then reveal.
function ExampleCard({ note, index, english }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`example-card${open ? ' open' : ''}`}>
      <div className="note-card-tag"><Icon name="pen" size={16} /> {english ? 'Example' : 'Worked example'}</div>
      <div className="example-q">{english ? <><b>Example</b> — {note.q}</> : <>Worked example: {note.q}</>}</div>
      <div className="example-a" id={`ex-${index}`} hidden={!open}>{note.a}</div>
      {!open ? (
        <div className="example-try">
          <Pip mood="think" size={36} />
          <span>{english ? 'Plan your own answer first.' : 'Try it on paper first.'}</span>
          <button type="button" className="btn btn-go small" onClick={() => setOpen(true)} aria-controls={`ex-${index}`}>
            Reveal the {english ? 'model' : 'method'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function NotesDeck({ notes = [], english = false, visual = null, onSeen }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current?.querySelector('.note-card:last-child, .example-card:last-child, .formula-card:last-child');
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onSeen?.();
        observer.disconnect();
      }
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [notes, onSeen]);

  let step = 0;
  return (
    <div className={`notes notes-deck${english ? ' english' : ''}`} ref={ref}>
      {visual}
      {notes.map((note, index) => {
        if (note.t === 'p') {
          step += 1;
          return (
            <div key={index} className="note-card note-idea">
              <span className="note-step" aria-hidden="true">{step}</span>
              <p className="note-p">{note.text}</p>
            </div>
          );
        }
        if (note.t === 'b') {
          step += 1;
          return (
            <div key={index} className="note-card note-list">
              <span className="note-step" aria-hidden="true">{step}</span>
              <ul className="note-bullets">
                {note.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            </div>
          );
        }
        if (note.t === 'f') {
          return (
            <div key={index} className="formula-card">
              <div className="formula-title">{note.title}</div>
              <div className="formula-body">{note.text}</div>
            </div>
          );
        }
        if (note.t === 'e') return <ExampleCard key={index} note={note} index={index} english={english} />;
        return null;
      })}
    </div>
  );
}

export function ComboMeter({ streak = 0 }) {
  if (streak < 2) return null;
  return (
    <div className="combo-meter" role="status" aria-live="polite">
      <Icon name="flame" size={20} />
      <b>{streak} in a row</b>
      <span>{streak >= 5 ? 'Unstoppable' : streak >= 3 ? 'On fire' : 'Nice run'}</span>
    </div>
  );
}

// ---------- One-question-at-a-time practice ----------

// Before the round: what it is and which creature it feeds.
export function QuizStart({ count, title, detail, busy = false, error = '', onStart }) {
  const { byId } = useCreatures();
  const quill = byId.quill;
  return (
    <div className="quiz-start">
      {quill ? (
        <span className="quiz-start-art" aria-hidden="true">
          <Critter id={quill.id} tier={quill.tier} progress={quill.toNext} size={88} />
        </span>
      ) : null}
      <div className="quiz-start-copy">
        <h3>{title}</h3>
        <p className="sub">{detail}</p>
        {quill ? <p className="quiz-start-feeds">Every marked answer feeds {nameOf(quill)}.</p> : null}
      </div>
      {error ? <div className="error-banner" role="alert">{error}</div> : null}
      <button type="button" className="btn btn-go btn-block" onClick={onStart} disabled={busy}>
        {busy ? 'Loading…' : `Start ${count} questions`}
      </button>
    </div>
  );
}

// "Question 2 of 5" with a dot per question: right, wrong, current.
export function QuizProgress({ total, index, results = [], combo = 0 }) {
  return (
    <div className="quiz-progress">
      <span className="quiz-progress-count">Question {Math.min(index + 1, total)} of {total}</span>
      <ol className="quiz-dots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} className={results[i] === true ? 'right' : results[i] === false ? 'wrong' : i === index ? 'current' : ''} />
        ))}
      </ol>
      <ComboMeter streak={combo} />
    </div>
  );
}

// Tag why an answer went wrong; the tag travels with the notebook row so
// the retry can target the cause.
export function WhyChips({ value = null, onChange, types = ['knowledge', 'method', 'misread', 'arithmetic'] }) {
  return (
    <div className="why-chips" role="group" aria-label="What went wrong?">
      <span className="why-chips-label">What went wrong?</span>
      <div className="chip-row">
        {ERROR_TYPES.filter((type) => types.includes(type.id)).map((type) => (
          <button
            key={type.id}
            type="button"
            title={type.hint}
            aria-pressed={value === type.id}
            className={`suggest-chip${value === type.id ? ' on' : ''}`}
            onClick={() => onChange(value === type.id ? null : type.id)}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// After a marked answer: the verdict, then one button on. Focus moves to
// that button so keyboard learners can keep going with Enter.
export function QuizFeedback({ tone = 'right', title, children, nextLabel, onNext, busy = false, extra = null }) {
  const nextRef = useRef(null);
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
    nextRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, []);
  return (
    <div className={`quiz-feedback ${tone}`}>
      <p className="quiz-feedback-title" role="status">
        <span className="quiz-feedback-mark" aria-hidden="true"><Icon name={tone === 'right' ? 'check' : tone === 'wrong' ? 'close' : 'pen'} size={18} strokeWidth={3} /></span>
        {title}
      </p>
      {children}
      <div className="quiz-feedback-actions">
        {extra}
        <button ref={nextRef} type="button" className="btn btn-go" onClick={onNext} disabled={busy}>
          {busy ? 'Scoring…' : nextLabel} {busy ? null : <Icon name="arrowRight" size={18} />}
        </button>
      </div>
    </div>
  );
}

// After the round: the score and what it fed.
export function QuizDone({ correct, total, before = null, after = null, error = '', againLabel = 'Another 5', onAgain, onNext = null, nextLabel = 'Next: Master it' }) {
  return (
    <div className="quiz-done">
      <p className="eyebrow">Round complete</p>
      <h3>You scored {correct}/{total}</h3>
      <CreatureGains before={before} after={after} title="What this round fed" dark />
      {error ? <div className="error-banner" role="alert">{error}</div> : null}
      <div className="quiz-done-actions">
        <button type="button" className="btn btn-go" onClick={onAgain}>{againLabel}</button>
        {onNext ? <button type="button" className="btn" onClick={onNext}>{nextLabel}</button> : null}
      </div>
    </div>
  );
}

// ---------- Master ----------

export function MasteryPanel({ topic, nextTopic = null, learnBase = '/learn', result = null }) {
  const { byId } = useCreatures();
  const prismo = byId.prismo || null;
  const answered = topic.answered ?? (topic.accuracy != null ? 5 : 0);
  const stage = masteryStage(topic.accuracy, answered);
  const stars = starsFor(topic.accuracy, answered);
  const targets = [
    { stars: 1, text: 'Reach 40% accuracy' },
    { stars: 2, text: 'Reach 70% accuracy' },
    { stars: 3, text: '90%+ over 5 or more questions' },
  ];
  return (
    <div className="mastery-card">
      <div className="mastery-card-stars">
        <Stars count={stars} size={34} />
        <span className={`v3-stage ${stage.id}`}>{stage.text}</span>
      </div>
      <div className="mastery-card-copy">
        <p className="eyebrow">Your {topic.name} stars</p>
        <h3>{stars === 3 ? 'All three stars' : stars === 0 ? 'No stars yet' : `${stars} of 3 stars`}</h3>
        <p className="sub">
          {topic.accuracy != null
            ? `Earned from your marked answers: ${topic.accuracy}% accuracy so far.`
            : 'Answer practice questions to earn your first star. Every star comes from marked work.'}
          {result ? ` Last round: ${result.correct}/${result.total}.` : ''}
        </p>
        <ul className="star-targets">
          {targets.map((target) => (
            <li key={target.stars} className={stars >= target.stars ? 'met' : ''}>
              <Stars count={target.stars} max={target.stars} size={14} label={false} />
              <span>{target.text}</span>
            </li>
          ))}
        </ul>
        {prismo ? (
          <Link className="mastery-prismo" to="/creatures?open=prismo">
            <Critter id="prismo" tier={prismo.tier} progress={prismo.toNext} size={44} />
            <span>Three-star topics grow <b>{nameOf(prismo)}</b> · {prismo.value} so far</span>
          </Link>
        ) : null}
      </div>
      {nextTopic ? (
        <Link className="next-topic" to={`${learnBase}/${nextTopic.id}`}>
          <span className="eyebrow">Next on the map</span>
          <strong>{nextTopic.name}</strong>
          <Icon name="arrowRight" size={20} />
        </Link>
      ) : null}
    </div>
  );
}

export function ResourceGrid({ resources = [] }) {
  if (!resources.length) return null;
  return (
    <div className="res-grid">
      {resources.map((res) => (
        <a key={res.label} className="res-card" href={res.url} target="_blank" rel="noreferrer">
          <span className="res-icon" aria-hidden="true"><Icon name="layers" size={20} /></span>
          <div className="res-name">{res.label}</div>
          <div className="res-why">{res.why}</div>
        </a>
      ))}
    </div>
  );
}

// "Stuck? Ask Pip" with the lesson as context. Opens over the lesson.
export function PipPromo({ text, context = null }) {
  return (
    <div className="tutor-promo">
      <Pip mood="happy" size={72} bob />
      <div>
        <h3>Stuck? Ask Pip</h3>
        <p className="sub">{text}</p>
      </div>
      <AskPipButton context={context} label="Ask Pip" className="btn btn-primary" mood="happy" />
    </div>
  );
}

export function EditorialNote({ spec, reviewed, reviewer, reportUrl }) {
  return (
    <p className="editorial-note" aria-label="Editorial metadata">
      <span>{spec}</span>
      <span aria-hidden="true">·</span>
      <span>Reviewed {reviewed ? new Date(reviewed).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'recently'} by {reviewer || 'the Study Desk content team'}</span>
      <span aria-hidden="true">·</span>
      <a href={reportUrl || '/support.html'}>Report an issue</a>
    </p>
  );
}

// Session-only step progress for the lesson bar.
export function useStages(topicId) {
  const [done, setDone] = useState({});
  useEffect(() => setDone({}), [topicId]);
  const mark = useCallback((id) => setDone((current) => (current[id] ? current : { ...current, [id]: true })), []);
  return [done, mark];
}
