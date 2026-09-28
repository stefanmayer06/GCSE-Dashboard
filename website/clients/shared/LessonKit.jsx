import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Emblem from './circuit/Emblem.jsx';
import Icon from './circuit/Icon.jsx';
import Pip from './circuit/Pip.jsx';
import { Stars } from './circuit/bits.jsx';
import { hueVar, starsFor, strandInfo } from './circuit/palette.js';
import { masteryStage } from './next-step.js';
import ExplainerPlayer from './explainer/Player.jsx';
import { autoScript } from './explainer/autoscript.js';

// Lesson kit — the Brilliant-style lesson page shared by Maths + English.
// A lesson is four stages on one scrolling page:
//   01 Watch    interactive explainer (authored script or auto talk-through)
//   02 Learn    the notes as stepped cards (predict-then-reveal examples)
//   03 Practise the subject's quick practice (rendered by the page)
//   04 Master   stars + emblem layers from marked evidence, what next
// Stage completion is session-only UI state (never stored); stars and
// emblem layers come from server topic accuracy.

export const STAGES = [
  { id: 'watch', label: 'Watch', icon: 'play' },
  { id: 'learn', label: 'Learn', icon: 'bulb' },
  { id: 'practise', label: 'Practise', icon: 'target' },
  { id: 'master', label: 'Master', icon: 'trophy' },
];

export function LessonHeader({ topic, strand, eyebrow, backTo = '/learn', backLabel = 'All topics', sub, children, stagesDone = {} }) {
  const stage = masteryStage(topic.accuracy, topic.answered ?? (topic.accuracy != null ? 1 : 0));
  const stars = starsFor(topic.accuracy, topic.answered ?? (topic.accuracy != null ? 5 : 0));
  const info = strandInfo(strand);
  const done = STAGES.filter((item) => stagesDone[item.id]).length;
  return (
    <>
      <div className="lesson-hud" style={{ '--strand': hueVar(info.hue) }}>
        <Link to={backTo} className="lesson-back" aria-label={backLabel}>
          <Icon name="chevronLeft" size={22} />
        </Link>
        <div className="lesson-hud-title">
          <span className="lesson-hud-eyebrow">{eyebrow}</span>
          <span className="lesson-hud-name">{topic.name}</span>
        </div>
        <div className="lesson-hud-progress" role="progressbar" aria-label="Lesson stages complete" aria-valuemin={0} aria-valuemax={STAGES.length} aria-valuenow={done}>
          <span style={{ width: `${(done / STAGES.length) * 100}%` }} />
        </div>
        <Stars count={stars} size={16} />
      </div>

      <Link to={backTo} className="back-link">← {backLabel}</Link>
      <header className="page-head lesson-head" style={{ '--strand': hueVar(info.hue) }}>
        <div className="lesson-head-copy">
          <p className="eyebrow lesson-eyebrow"><span className="strand-pip" aria-hidden="true" />{eyebrow}</p>
          <h1>{topic.name}</h1>
          <p className="sub">{sub}</p>
          {children}
        </div>
        <div className="lesson-head-emblem">
          <Emblem topicId={topic.id} strand={strand} stage={stage.id} size={132} title={`${topic.name} emblem: ${stage.text}`} />
          <span className={`v3-stage ${stage.id}`}>{stage.text}</span>
        </div>
      </header>
      <nav className="stage-rail" aria-label="Lesson stages">
        {STAGES.map((item, index) => (
          <a key={item.id} href={`#stage-${item.id}`} className={`stage-chip${stagesDone[item.id] ? ' done' : ''}`}>
            <span className="stage-chip-n" aria-hidden="true">{stagesDone[item.id] ? <Icon name="check" size={16} strokeWidth={3} /> : `0${index + 1}`}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}

export function StageSection({ id, index, title, sub, children, className = '' }) {
  return (
    <section className={`lesson-stage stage-${id} ${className}`.trim()} id={`stage-${id}`} aria-labelledby={`stage-${id}-title`}>
      <div className="lesson-stage-head">
        <span className="lesson-stage-n" aria-hidden="true">0{index}</span>
        <div>
          <h2 id={`stage-${id}-title`}>{title}</h2>
          {sub ? <p className="sub">{sub}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function LessonExplainer({ topic, subject, authored = null, onDone }) {
  const script = useMemo(() => authored || autoScript(topic, { subject }), [authored, topic, subject]);
  if (!script) return null;
  return (
    <ExplainerPlayer
      script={script}
      onComplete={() => onDone?.()}
      onContinue={() => {
        onDone?.();
        document.getElementById('stage-learn')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <div className="example-a" hidden={!open}>{note.a}</div>
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

export function MasteryPanel({ topic, strand, nextTopic = null, learnBase = '/learn', result = null }) {
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
      <div className="mastery-card-emblem">
        <Emblem topicId={topic.id} strand={strand} stage={stage.id} size={112} spin={stage.id === 'mastered'} />
      </div>
      <div className="mastery-card-copy">
        <p className="eyebrow">Your {topic.name} emblem</p>
        <h3>{stage.id === 'new' ? 'Blueprint — not built yet' : `${stage.text} · layer ${Math.min(4, ['learning', 'developing', 'secure', 'mastered'].indexOf(stage.id) + 1)} of 4`}</h3>
        <Stars count={stars} size={26} />
        <p className="sub">
          {topic.accuracy != null
            ? `Built from your marked answers: ${topic.accuracy}% accuracy so far.`
            : 'Answer practice questions to start building it. Every layer is earned from marked work.'}
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

export function TutorPromo({ text }) {
  return (
    <div className="tutor-promo">
      <Pip mood="happy" size={72} bob />
      <div>
        <h3>Stuck? Ask Pip, the AI tutor</h3>
        <p className="sub">{text}</p>
      </div>
      <Link className="btn btn-primary" to="/chat">Open AI tutor →</Link>
    </div>
  );
}

// Session-only stage progress for the lesson HUD.
export function useStages(topicId) {
  const [done, setDone] = useState({});
  useEffect(() => setDone({}), [topicId]);
  const mark = useCallback((id) => setDone((current) => (current[id] ? current : { ...current, [id]: true })), []);
  return [done, mark];
}
