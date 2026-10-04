import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Sheet from './Sheet.jsx';
import Icon from './circuit/Icon.jsx';
import Critter from './circuit/Critter.jsx';
import { useFocusMode } from './AppShell.jsx';
import { nameOf, useCreatures } from './creatures.jsx';
import { AskPipButton } from './PipChat.jsx';
import { QuizProgress } from './LessonKit.jsx';
import { GRADES } from './study-personal.js';

// Practice kit, shared by Maths and English: the round header for focus
// screens, a confirm sheet, a segmented control, the Practice hub cards and
// the one-at-a-time notebook retry flow.

// Top bar of a practice round or retry: close, what this is, Ask Pip.
export function RoundBar({ title, detail = '', onClose, closeLabel = 'End round', pipContext = null, pip = true }) {
  return (
    <div className="round-bar">
      <button type="button" className="round-close" onClick={onClose} aria-label={closeLabel}>
        <Icon name="close" size={22} strokeWidth={2.4} />
      </button>
      <div className="round-title">
        <b>{title}</b>
        {detail ? <span>{detail}</span> : null}
      </div>
      {pip ? <AskPipButton iconOnly context={pipContext} className="btn round-pip" /> : null}
    </div>
  );
}

export function ConfirmSheet({ title, children, confirmLabel, cancelLabel = 'Keep going', onConfirm, onClose, danger = false }) {
  return (
    <Sheet
      title={title}
      onClose={onClose}
      size="sm"
      className="confirm-sheet"
      footer={(
        <>
          <button type="button" className="btn" onClick={onClose} data-autofocus>{cancelLabel}</button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </>
      )}
    >
      {children}
    </Sheet>
  );
}

export function Segmented({ label, options, value, onChange, className = '' }) {
  return (
    <div className={`segmented ${className}`.trim()} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`segment${value === option.value ? ' on' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Practice hub: retries come first when any are due.
export function RetryCard({ dueCount = 0 }) {
  const { byId } = useCreatures();
  const redo = byId.redo || null;
  if (!dueCount) return null;
  return (
    <Link className="practice-retry" to="/notebook?retry=1">
      {redo ? (
        <span className="practice-retry-art" aria-hidden="true">
          <Critter id="redo" tier={redo.tier} progress={redo.toNext} size={72} />
        </span>
      ) : null}
      <span className="practice-retry-copy">
        <span className="practice-retry-eyebrow">{dueCount === 1 ? '1 retry due' : `${dueCount} retries due`}</span>
        <b>Fix your mistakes</b>
        <span>A few minutes. Each fix grows {redo ? nameOf(redo) : 'Redo'}.</span>
      </span>
      <span className="btn btn-go small" aria-hidden="true">Start</span>
    </Link>
  );
}

export function PracticeLinks({ notebookCount = null }) {
  return (
    <nav className="me-card settings-card practice-links" aria-label="More practice">
      <Link className="settings-row link" to="/notebook">
        <span className="settings-label"><Icon name="notebook" size={20} />Mistake notebook</span>
        <span className="settings-meta">{notebookCount != null ? `${notebookCount} open` : ''}<Icon name="chevronRight" size={18} /></span>
      </Link>
      <Link className="settings-row link" to="/results">
        <span className="settings-label"><Icon name="trophy" size={20} />Paper results</span>
        <Icon name="chevronRight" size={18} />
      </Link>
    </nav>
  );
}

// ---------- Notebook retries, one at a time ----------

const RIGHT_GRADES = GRADES.filter((grade) => grade.id !== 'again');

function GradeButtons({ grades, onGrade, label }) {
  return (
    <div className="grade-buttons" role="group" aria-label={label}>
      <span className="why-chips-label">{label}</span>
      <div className="grade-row">
        {grades.map((grade) => (
          <button key={grade.id} type="button" className={`grade-btn grade-${grade.id}`} onClick={() => onGrade(grade.id)}>
            <b>{grade.label}</b>
            <span>{grade.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// rows: the due notebook rows (a snapshot taken when the flow opened).
// renderQuestion (Maths): draws a live question so the retry is marked;
// without it the learner recalls the answer and grades their own recall.
export function RetryFlow({ rows, api, renderQuestion = null, onGrade, onExit }) {
  useFocusMode(true);
  const { byId } = useCreatures();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef(null);
  const row = rows[index] || null;
  const live = Boolean(renderQuestion && api?.question && row?.qid);

  useEffect(() => {
    setQuestion(null);
    setValue('');
    setChecked(null);
    setRevealed(false);
    setError('');
    if (!row || !live) return undefined;
    let cancelled = false;
    setLoading(true);
    api.question(row.qid)
      .then((out) => { if (!cancelled) setQuestion(out?.question || null); })
      .catch(() => { if (!cancelled) setQuestion(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id]);

  // Move focus to each new retry, but not on arrival (the page already has it).
  const arrived = useRef(false);
  useEffect(() => {
    if (!arrived.current) {
      arrived.current = true;
      return;
    }
    cardRef.current?.focus({ preventScroll: true });
  }, [index]);

  async function check() {
    if (!question || value == null || value === '') return;
    setError('');
    try {
      setChecked(await api.check(question.id, value));
    } catch (cause) {
      setError(cause.message || 'Could not check that answer. Try again.');
    }
  }

  function grade(id) {
    onGrade(row, id);
    setResults((list) => [...list, id]);
    setIndex((value) => value + 1);
  }

  const redo = byId.redo || null;
  if (!row) {
    const fixed = results.filter((id) => id !== 'again').length;
    return (
      <div className="page round-page retry-page">
        <RoundBar title="Retries" detail="Done" onClose={onExit} closeLabel="Back to the notebook" pip={false} />
        <div className="quiz-done">
          <p className="eyebrow">Retries done</p>
          <h3>{fixed} of {results.length} moved up the ladder</h3>
          {redo ? (
            <div className="retry-redo">
              <Critter id="redo" tier={redo.tier} progress={redo.toNext} size={72} />
              <p>Each mistake you get right four times is fixed for good, and every fix grows <b>{nameOf(redo)}</b>. Misses come back tomorrow.</p>
            </div>
          ) : null}
          <div className="quiz-done-actions">
            <button type="button" className="btn btn-go" onClick={onExit}>Back to the notebook</button>
          </div>
        </div>
      </div>
    );
  }

  const showQuestion = live && question;
  const answerShown = Boolean(checked) || revealed;
  const right = checked ? checked.correct : null;
  const pipContext = { kind: 'retry', label: row.topicName, question: question?.text || row.prompt, answer: answerShown ? value : null, wrong: right === false };

  return (
    <div className="page round-page retry-page">
      <RoundBar title="Retries" detail={`${index + 1} of ${rows.length}`} onClose={onExit} closeLabel="Stop retries" pipContext={pipContext} />
      <div className="quiz-flow">
        <QuizProgress
          total={rows.length}
          index={index}
          results={rows.map((_, i) => (i < results.length ? results[i] !== 'again' : undefined))}
        />
        <div className="quiz-q retry-card" ref={cardRef} tabIndex={-1} role="group" aria-label={`Retry ${index + 1} of ${rows.length}`}>
          <div className="quiz-q-meta">
            <span>{row.topicName}</span>
            <span>Retry {Math.min(4, (row.reviewIndex ?? 0) + 1)} of 4</span>
          </div>
          {showQuestion ? (
            renderQuestion({ question, value, onChange: setValue, disabled: answerShown, onSubmit: check, index })
          ) : (
            <>
              <div className="quiz-q-text">{String(row.prompt || '').split('\n').map((line, j) => <p key={j}>{line}</p>)}</div>
              {loading ? <p className="sub">Loading the question…</p> : null}
              {!answerShown && !loading ? (
                <label className="field retry-recall">
                  <span>Your answer (just for you)</span>
                  <textarea className="answer-area" rows={3} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Work it out, then check" />
                </label>
              ) : null}
            </>
          )}
          {!answerShown ? (
            <div className="quiz-actions">
              {error ? <div className="error-banner" role="alert">{error}</div> : null}
              {showQuestion ? (
                <button type="button" className="btn btn-go btn-block quiz-check" disabled={value == null || value === ''} onClick={check}>Check answer</button>
              ) : (
                <button type="button" className="btn btn-go btn-block quiz-check" disabled={loading} onClick={() => setRevealed(true)}>Show the answer</button>
              )}
            </div>
          ) : null}
        </div>

        {answerShown ? (
          <div className={`quiz-feedback ${right === true ? 'right' : right === false ? 'wrong' : 'self'}`}>
            <p className="quiz-feedback-title" role="status">
              <span className="quiz-feedback-mark" aria-hidden="true"><Icon name={right === true ? 'check' : right === false ? 'close' : 'pen'} size={18} strokeWidth={3} /></span>
              {right === true ? 'Correct!' : right === false ? 'Not quite. It comes back tomorrow.' : 'Check your answer'}
            </p>
            {(checked?.answerText ?? row.correctAnswer) != null ? (
              <p className="quiz-feedback-answer">Answer: <b>{String(checked?.answerText ?? row.correctAnswer)}</b></p>
            ) : null}
            {(checked?.solution?.length || row.workedSolution?.length) ? (
              <details className="quiz-method" open={right !== true}>
                <summary>Worked method</summary>
                <div className="review-sol">
                  {(checked?.solution?.length ? checked.solution : row.workedSolution).map((step, j) => <div key={j} className="sol-step">{step}</div>)}
                </div>
              </details>
            ) : null}
            {row.correction ? <p className="retry-correction"><small>Your correction</small>{row.correction}</p> : null}
            {right === false ? (
              <div className="quiz-feedback-actions">
                <AskPipButton context={{ ...pipContext, wrong: true }} label="Ask Pip why" className="btn" />
                <button type="button" className="btn btn-go" onClick={() => grade('again')}>
                  Next <Icon name="arrowRight" size={18} />
                </button>
              </div>
            ) : (
              <GradeButtons
                grades={right === true ? RIGHT_GRADES : GRADES}
                label={right === true ? 'How did it feel?' : 'How did you do?'}
                onGrade={grade}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
