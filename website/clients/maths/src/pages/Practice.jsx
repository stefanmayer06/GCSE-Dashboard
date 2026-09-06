import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { STRAND_COLORS } from '../colors.js';
import { invalidateResources, useResource } from '../../../shared/resource-cache.js';
import MathsVisual from '../components/MathsVisual.jsx';
import { RewardSummary } from '../../../shared/rewards.jsx';
import { personalKey } from '../../../shared/study-personal.js';

function activeTestKey(userId, higherTier) {
  return userId ? personalKey(userId, higherTier ? 'maths-higher' : 'maths', 'active-test') : null;
}

function lastResultKey(userId, higherTier) {
  return userId ? personalKey(userId, higherTier ? 'maths-higher' : 'maths', 'last-result') : null;
}

function fmtTime(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function loadSaved(key) {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.test?.id || !Array.isArray(data.test.questions) || data.secondsLeft <= 0) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export default function Practice({ onProgress, userId }) {
  const higherTier = window.location.pathname.startsWith('/maths-higher');
  const storageKey = activeTestKey(userId, higherTier);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const saved = useRef(loadSaved(storageKey));
  const { data: papersData } = useResource(userId ? `papers:${higherTier ? 'maths-higher' : 'maths'}:${userId}` : null, () => api.papers());
  const papers = papersData?.papers ?? null;
  const [phase, setPhase] = useState(saved.current ? 'restoring' : 'setup'); // setup | restoring | running | submitting
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [perQStart, setPerQStart] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const answersRef = useRef({});
  const elapsedRef = useRef(0);
  const secondsLeftRef = useRef(null);

  // Deep links: /practice?paper=2&type=full starts that paper; /practice#adhoc scrolls to ad-hoc.
  const autoStart = useRef({ paper: params.get('paper'), type: params.get('type') });
  useEffect(() => {
    if (window.location.hash === '#adhoc') {
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      document.getElementById('adhoc')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
    if (
      autoStart.current.paper &&
      autoStart.current.type &&
      !saved.current &&
      phase === 'setup' &&
      papers
    ) {
      const next = autoStart.current;
      autoStart.current = { paper: null, type: null };
      start(next.type === 'short' ? 'short' : 'full', Number(next.paper));
    }
  }, [papers]);

  // Resume only while the server still has the private marking context.
  useEffect(() => {
    if (saved.current) resumeSaved();
  }, []);

  async function resumeSaved() {
    const s = saved.current;
    if (!s) return;
    setError('');
    setPhase('restoring');
    try {
      await api.testStatus(s.test.id);
      setTest(s.test);
      const restoredAnswers = s.answers || {};
      answersRef.current = restoredAnswers;
      elapsedRef.current = s.elapsed || 0;
      secondsLeftRef.current = s.secondsLeft;
      setAnswers(restoredAnswers);
      setSecondsLeft(s.secondsLeft);
      setElapsed(s.elapsed || 0);
      setPerQStart(s.perQStart || {});
      setCurrent(s.current || 0);
      setPhase('running');
    } catch (e) {
      if (e.code === 'TEST_EXPIRED') clearExpiredTest(e.message);
      else {
        setError('We could not check your saved paper. Check your connection, then retry.');
        setPhase('setup');
      }
    }
  }

  function clearExpiredTest(message) {
    if (storageKey) localStorage.removeItem(storageKey);
    saved.current = null;
    autoStart.current = { paper: null, type: null };
    setTest(null);
    answersRef.current = {};
    elapsedRef.current = 0;
    secondsLeftRef.current = null;
    setAnswers({});
    setCurrent(0);
    setSecondsLeft(null);
    setElapsed(0);
    setPerQStart({});
    setConfirmOpen(false);
    setQuitOpen(false);
    setQuitting(false);
    submitting.current = false;
    setError(message);
    setPhase('setup');
    navigate('/practice', { replace: true });
  }

  useEffect(() => {
    if (!test || phase !== 'running') return;
    const t = setInterval(() => {
      const next = elapsedRef.current + 1;
      const nsl = Math.max(0, (secondsLeftRef.current ?? test.minutes * 60) - 1);
      elapsedRef.current = next;
      secondsLeftRef.current = nsl;
      setElapsed(next);
      setSecondsLeft(nsl);
      if (nsl <= 0) {
        clearInterval(t);
        doSubmit({}, next, true);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [test, phase]);

  useEffect(() => {
    if (test && phase === 'running' && storageKey) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ test, answers, current, secondsLeft, elapsed, perQStart })
      );
    }
  }, [test, answers, current, secondsLeft, elapsed, perQStart, phase, storageKey]);

  async function start(type, paperId) {
    setError('');
    try {
      const t = await api.newTest(type, paperId);
      if (storageKey) localStorage.removeItem(storageKey);
      saved.current = null;
      answersRef.current = {};
      elapsedRef.current = 0;
      secondsLeftRef.current = t.minutes * 60;
      setTest(t);
      setAnswers({});
      setCurrent(0);
      setSecondsLeft(t.minutes * 60);
      setElapsed(0);
      setPerQStart({});
      setPhase('running');
    } catch (e) {
      setError(e.message);
    }
  }

  function setAnswer(qid, value) {
    const next = { ...answersRef.current, [qid]: value };
    answersRef.current = next;
    setAnswers(next);
  }

  function goTo(i) {
    setCurrent(Math.max(0, Math.min(test.questions.length - 1, i)));
  }

  async function doSubmit(ansOverride, dur, auto = false) {
    if (submitting.current) return;
    submitting.current = true;
    setConfirmOpen(false);
    setPhase('submitting');
    try {
      const currentAnswers = answersRef.current;
      const list = test.questions.map((q) => ({
        qid: q.id,
        value: ansOverride[q.id] ?? currentAnswers[q.id] ?? null,
      }));
      const result = await api.submitTest(test.id, list, dur ?? elapsedRef.current);
      onProgress?.(result.progress);
      invalidateResources('attempts');
      invalidateResources('topics:');
      invalidateResources('personal:');
      if (storageKey) localStorage.removeItem(storageKey);
      const resultKey = lastResultKey(userId, higherTier);
      if (resultKey) localStorage.setItem(resultKey, JSON.stringify(result));
      navigate('/results');
    } catch (e) {
      if (e.code === 'TEST_EXPIRED') clearExpiredTest(e.message);
      else {
        submitting.current = false;
        setError(e.message);
        setPhase('running');
        if (auto) {
          secondsLeftRef.current = 30;
          setSecondsLeft(30);
        }
      }
    }
  }

  async function doQuit() {
    if (submitting.current) return;
    submitting.current = true;
    setQuitting(true);
    try {
      await api.discardTest(test.id);
    } catch {}
    if (storageKey) localStorage.removeItem(storageKey);
    saved.current = null;
    autoStart.current = { paper: null, type: null };
    setTest(null);
    answersRef.current = {};
    elapsedRef.current = 0;
    secondsLeftRef.current = null;
    setAnswers({});
    setCurrent(0);
    setSecondsLeft(null);
    setElapsed(0);
    setPerQStart({});
    setConfirmOpen(false);
    setQuitOpen(false);
    setQuitting(false);
    submitting.current = false;
    setError('');
    setPhase('setup');
    navigate('/practice', { replace: true });
  }

  if (phase === 'restoring') {
    return <div className="page"><div className="loading">Checking your saved paper...</div></div>;
  }

  if ((phase === 'running' || phase === 'submitting') && test) {
    return (
      <TestScreen
        test={test}
        answers={answers}
        current={current}
        secondsLeft={secondsLeft ?? test.minutes * 60}
        elapsed={elapsed}
        onAnswer={setAnswer}
        onGo={goTo}
        onSubmit={(auto) => {
          if (auto) doSubmit({}, null, true);
          else setConfirmOpen(true);
        }}
        confirmOpen={confirmOpen}
        setConfirmOpen={setConfirmOpen}
        doConfirm={() => doSubmit({}, null, false)}
        quitOpen={quitOpen}
        setQuitOpen={setQuitOpen}
        doQuit={doQuit}
        quitting={quitting}
        error={error}
        busy={phase === 'submitting'}
        marksAnswered={test.questions.filter((q) => answers[q.id] != null && answers[q.id] !== '').length}
      />
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Practice exam</h1>
          <p className="sub">
             All three AQA {higherTier ? 'Higher' : 'Foundation'} papers — 8300/{higherTier ? '1H' : '1F'} (non-calculator),
             8300/{higherTier ? '2H' : '2F'} and 8300/{higherTier ? '3H' : '3F'} (calculator) — built fresh from the question bank every time.
          </p>
        </div>
      </header>

      <section className="panel">
        <h2>Pick your paper</h2>
        <p className="sub">
          {higherTier
            ? 'Higher papers use AQA\'s approximate weighting across the qualification; any specification topic can appear on any paper. Each generated paper includes graphical work and one synoptic challenge.'
            : 'Any Foundation topic can appear on any paper. Each generated paper follows the tier weighting, includes exam-style visual questions and keeps Paper 1 non-calculator safe.'}
        </p>
        <div className="papers-grid">
          {(papers || [1, 2, 3]).map((p) =>
            papers ? (
              <div key={p.id} className={`paper-card pick ${p.calculator ? 'calc' : 'noncalc'}`}>
                <div className="paper-top">
                  <span className="paper-type">{p.code}</span>
                  <span className={`calc-badge ${p.calculator ? 'yes' : 'no'}`}>
                    {p.calculator ? 'Calculator' : 'No calculator'}
                  </span>
                </div>
                <div className="paper-desc">{p.blurb}</div>
                <div className="strand-chips">
                  {p.strands.map((s) => (
                    <span key={s.id} className="strand-chip" style={{ borderColor: s.color }}>
                      <i style={{ background: s.color }} /> {s.name} {s.percent}%
                    </span>
                  ))}
                </div>
                <div className="paper-actions">
                  <button className="btn btn-primary" onClick={() => start('full', p.id)}>
                    Full · 80 marks · 90 min
                  </button>
                  <button className="btn" onClick={() => start('short', p.id)}>
                    Quick · 40 marks
                  </button>
                </div>
              </div>
            ) : (
              <div key={p} className="skeleton" aria-hidden="true" />
            )
          )}
        </div>
        {error && (
          <div className="error-banner" role="alert">
            {error}
            {saved.current && <button className="btn" onClick={resumeSaved}>Retry saved paper</button>}
          </div>
        )}
      </section>

       <AdhocSection higherTier={higherTier} onProgress={onProgress} diagnostic={params.get('diagnostic') === '1'} fixup={params.get('fixup') === '1'} memri={params.get('memri') === '1'} userId={userId} />
    </div>
  );
}

/* ---------------- Ad-hoc: mixed questions from any papers ---------------- */

function AdhocSection({ higherTier = false, onProgress, diagnostic = false, fixup = false, memri = false, userId }) {
  const diagnosticStarted = useRef(false);
  const fixupStarted = useRef(false);
  const [sources, setSources] = useState([1, 2, 3]);
  const [count, setCount] = useState(15);
  const [running, setRunning] = useState(null);
  const [fixupMeta, setFixupMeta] = useState(null);
  const [busy, setBusy] = useState(false);

  async function startAdhoc(countOverride, topicIds) {
    setBusy(true);
    try {
      const set = await api.adhoc(typeof countOverride === 'number' ? countOverride : count, sources, topicIds);
      setRunning(set);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!diagnostic || diagnosticStarted.current) return;
    diagnosticStarted.current = true;
    setCount(10);
    api.track?.('diagnostic_start', { questionCount: 10 });
    startAdhoc(10);
  }, [diagnostic]);

  // Fix-Up 5 / memory-check entry: a stored payload names the weak topics.
  useEffect(() => {
    if ((!fixup && !memri) || fixupStarted.current) return;
    fixupStarted.current = true;
    const subject = higherTier ? 'maths-higher' : 'maths';
    let payload = null;
    try {
      payload = JSON.parse(localStorage.getItem(`gcse-fixup:${subject}`) || 'null');
    } catch {}
    try { localStorage.removeItem(`gcse-fixup:${subject}`); } catch {}
    setCount(5);
    setFixupMeta(payload?.mode === 'memri' ? { touchIds: payload?.touchIds || [] } : null);
    startAdhoc(5, payload?.topicIds || []);
  }, [fixup, memri, higherTier]);

  function toggleSource(id) {
    setSources((s) => {
      if (s.includes(id)) {
        if (s.length === 1) return s;
        return s.filter((x) => x !== id);
      }
      return [...s, id].sort();
    });
  }

  if (running) {
    return <AdhocRunner key={running.roundId} set={running} onExit={() => setRunning(null)} onNew={startAdhoc} onProgress={onProgress} diagnostic={diagnostic} fixupMeta={fixupMeta} userId={userId} higherTier={higherTier} />;
  }

  const fixupActive = fixup || memri;

  return (
    <section className="panel" id="adhoc">
      <div className="quiz-head">
        <div>
          <h2>{fixupActive ? 'Fix-Up round' : 'Ad-hoc questions'}</h2>
          <p className="sub">
            {fixupActive
              ? 'Five questions drawn from your due mistakes and weakest topics — grade every retry honestly.'
              : `A quick mixed bag drawn from any combination of the three ${higherTier ? 'Higher' : 'Foundation'} papers — great for keeping every topic sharp between full mocks.`}
          </p>
        </div>
      </div>
      <div className="adhoc-controls">
        <div className="adhoc-row">
          <span className="adhoc-label">Source papers</span>
          <div className="chip-row">
            {[1, 2, 3].map((id) => (
              <button
                key={id}
                className={`suggest-chip source ${sources.includes(id) ? 'on' : ''}`}
                onClick={() => toggleSource(id)}
              >
                 {id === 1 ? `8300/1${higherTier ? 'H' : 'F'}` : id === 2 ? `8300/2${higherTier ? 'H' : 'F'}` : `8300/3${higherTier ? 'H' : 'F'}`}
              </button>
            ))}
          </div>
        </div>
        <div className="adhoc-row">
          <span className="adhoc-label">How many?</span>
          <div className="chip-row">
            {[10, 15, 20].map((c) => (
              <button
                key={c}
                className={`suggest-chip source ${count === c ? 'on' : ''}`}
                onClick={() => setCount(c)}
              >
                {c} questions
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={startAdhoc} disabled={busy}>
          {busy ? 'Loading…' : 'Give me questions →'}
        </button>
      </div>
    </section>
  );
}

function AdhocRunner({ set, onExit, onNew, onProgress, diagnostic = false, fixupMeta = null, userId = null, higherTier = false }) {
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hints, setHints] = useState({});

  async function checkOne(qid, value) {
    const res = await api.check(qid, value);
    setFeedback((f) => ({ ...f, [qid]: res }));
  }

  async function finish() {
    setBusy(true);
    setError('');
    try {
      const res = await api.adhocSubmit(
        set.roundId,
        set.questions.map((q) => ({ qid: q.id, value: answers[q.id] ?? null }))
      );
      onProgress?.(res.progress);
      invalidateResources('attempts');
      invalidateResources('topics:');
      invalidateResources('personal:');
      if (diagnostic) {
        api.track?.('diagnostic_complete', { correctMarks: res.correctMarks, totalMarks: res.totalMarks });
      }
      if (set.targeted) {
        api.track?.('fixup_complete', { correctMarks: res.correctMarks, totalMarks: res.totalMarks, memri: Boolean(fixupMeta?.touchIds?.length) });
      }
      if (fixupMeta?.touchIds?.length) {
        // Memory check evidence: proving faded mastery refreshes the stamp.
        try {
          const subject = higherTier ? 'maths-higher' : 'maths';
          const { hydratePersonal, touchMistakeRows } = await import('../../../shared/study-personal.js');
          const personal = await hydratePersonal(api, userId, subject);
          await api.saveMistakes(touchMistakeRows(personal.mistakes ?? [], fixupMeta.touchIds));
          invalidateResources('personal:');
          api.track?.('memri_complete', { count: fixupMeta.touchIds.length });
        } catch {}
      }
      setFeedback((f) => {
        const out = { ...f };
        for (const row of res.perQ) {
          out[row.qid] = { correct: row.correct, answerText: row.answerText };
        }
        return out;
      });
      setDone({ correct: res.correctMarks, total: res.totalMarks, reward: res.reward, progress: res.progress });
    } catch (e) {
      setError(e.message || 'Could not score this round. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const allChecked = Object.keys(feedback).length >= set.questions.length;

  return (
    <section className="panel">
      <div className="quiz-head">
        <div>
          <h2>Ad-hoc round</h2>
          <p className="sub">Mixed from {set.papersIncluded.join(' + ')} · {set.questions.length} questions</p>
        </div>
        <button className="btn" onClick={onExit}>Back to setup</button>
      </div>
      <div className="quiz">
        {set.questions.map((q, i) => {
          const fb = feedback[q.id];
          return (
            <div key={q.id} className={`quiz-q ${fb ? (fb.correct ? 'right' : 'wrong') : ''}`}>
              <div className="quiz-q-meta">
                <span>Q{i + 1}</span>
                <span>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                <span>{q.topic}</span>
                {q.stretch && !q.exceptional && <span className="q-tag stretch">Stretch</span>}
                {q.exceptional && <span className="q-tag stretch">Synoptic challenge</span>}
              </div>
              <div className="quiz-q-text">{q.text.split('\n').map((l, j) => <p key={j}>{l}</p>)}</div>
              <MathsVisual key={q.id} stimulus={q.stimulus} />

              {q.input.type === 'mcq' ? (
                <div className="choices" role="group" aria-label={`Answer to question ${i + 1}`}>
                  {q.input.choices.map((c) => (
                    <button
                      key={c.label}
                      disabled={!!fb}
                      className={`choice ${answers[q.id] === c.label ? 'selected' : ''}`}
                      aria-pressed={answers[q.id] === c.label}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: c.label }))}
                    >
                      <span className="choice-letter">{c.label}</span>
                      <span>{c.text}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  className="answer-input"
                  aria-label={`Answer to question ${i + 1}`}
                  type="text"
                  inputMode={q.input.type === 'number' ? 'decimal' : 'text'}
                  disabled={!!fb}
                  placeholder={q.input.placeholder || 'Your answer'}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                />
              )}

              {!fb ? (
                <div className="quiz-actions">
                  <button
                    className="btn small"
                    disabled={answers[q.id] == null || answers[q.id] === ''}
                    onClick={() => checkOne(q.id, answers[q.id])}
                  >
                    Check answer
                  </button>
                  {(q.hint || q.solution?.length) && <button className="btn small" onClick={() => setHints((h) => ({ ...h, [q.id]: Math.min((h[q.id] || 0) + 1, 1 + (q.solution?.length || 0)) }))}>Show next hint</button>}
                  {hints[q.id] > 0 && <div className="progressive-hints"><span className="hint-inline">Hint: {q.hint}</span>{q.solution?.slice(0, Math.max(0, hints[q.id] - 1)).map((step, j) => <span className="hint-inline" key={j}>Step {j + 1}: {step}</span>)}</div>}
                </div>
              ) : (
                <div className="quiz-fb">
                  <div className="quiz-fb-line">
                    {fb.correct ? <>Correct! Answer: <b>{fb.answerText}</b></> : 'Not quite. Work through the solution before revealing the answer.'}
                  </div>
                  {!fb.correct && fb.solution && (
                    <div className="review-sol">
                      {fb.solution.slice(0, hints[q.id] || 0).map((s, j) => <div key={j} className="sol-step">Step {j + 1}: {s}</div>)}
                      {(hints[q.id] || 0) < fb.solution.length && <button className="btn small" onClick={() => setHints((h) => ({ ...h, [q.id]: (h[q.id] || 0) + 1 }))}>Show next solution step</button>}
                      {(hints[q.id] || 0) >= fb.solution.length && <div className="review-answer">Answer: <b>{fb.answerText}</b></div>}
                    </div>
                  )}
                  {!fb.correct && !fb.solution && <button className="btn small" onClick={() => setHints((h) => ({ ...h, [q.id]: 1 }))}>{hints[q.id] ? <>Answer: <b>{fb.answerText}</b></> : 'Reveal answer'}</button>}
                </div>
              )}
            </div>
          );
        })}

        {done ? (
          <div className="quiz-done">
            <h3>You scored {done.correct}/{done.total}</h3>
            <RewardSummary reward={done.reward} progress={done.progress} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={onNew}>Another round</button>
              <button className="btn" onClick={onExit}>Back to setup</button>
            </div>
          </div>
        ) : (
          <>
            {error && <div className="error-banner" role="alert">{error}</div>}
            <button className="btn btn-finish" disabled={busy || !allChecked} onClick={finish}>
              {busy ? 'Scoring…' : 'Finish & score'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------------- Exam runner ---------------- */

function TestScreen(props) {
  const {
    test, answers, current, secondsLeft, elapsed, onAnswer, onGo,
    onSubmit, confirmOpen, setConfirmOpen, doConfirm, quitOpen, setQuitOpen, doQuit, quitting,
    error, marksAnswered, busy,
  } = props;
  const submitDialogRef = useRef(null);
  const quitDialogRef = useRef(null);
  const submitTitleId = useId();
  const quitTitleId = useId();
  const q = test.questions[current];
  const lowTime = secondsLeft < 300;
  const paceMins = elapsed / 60;
  const paceTargetMarks = Math.min(test.totalMarks, paceMins);
  const answeredMarks = test.questions.filter((x) => answers[x.id] != null && answers[x.id] !== '').reduce((a, x) => a + x.marks, 0);
  const behind = answeredMarks < paceTargetMarks - 0.5;
  const unanswered = test.questions.length - marksAnswered;

  // v3: arrow-key question navigation (skipped while typing or when a dialog is open).
  useEffect(() => {
    if (confirmOpen || quitOpen) return undefined;
    function onArrows(event) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onGo(current + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onGo(current - 1);
      }
    }
    document.addEventListener('keydown', onArrows);
    return () => document.removeEventListener('keydown', onArrows);
  }, [confirmOpen, quitOpen, current, onGo]);

  useEffect(() => {
    const dialog = confirmOpen ? submitDialogRef.current : quitOpen ? quitDialogRef.current : null;
    if (!dialog) return undefined;
    const previousFocus = document.activeElement;
    const controls = [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled)')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    first?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (confirmOpen) setConfirmOpen(false);
        else setQuitOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !controls.length) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus();
    };
  }, [confirmOpen, quitOpen, setConfirmOpen, setQuitOpen]);

  return (
    <div className="exam" aria-busy={busy}>
      <header className="exam-bar">
        <div className="exam-title">
          <span className="exam-paper">{test.paperCode} · {test.paperName}</span>
          <span className={`calc-badge ${test.calculator ? 'yes' : 'no'}`}>
            {test.calculator ? 'Calculator allowed' : 'Non-calculator'}
          </span>
        </div>
        <div className="exam-timers">
          <div className={`timer big ${lowTime ? 'low' : ''}`}>
            <span className="timer-label">Paper time</span>
            <span className="timer-value">{fmtTime(secondsLeft)}</span>
          </div>
          <div className={`timer ${behind ? 'behind' : 'ahead'}`}>
            <span className="timer-label">Pace (1 mark/min)</span>
            <span className="timer-value">
              {elapsed < 60 ? `${elapsed}s` : fmtTime(elapsed)}
              <span className="pace-badge">{behind ? ' slow' : ' on pace'}</span>
            </span>
          </div>
          <div className="timer">
            <span className="timer-label">Marks banked</span>
            <span className="timer-value">{answeredMarks} / {test.totalMarks}</span>
          </div>
        </div>
        <div className="exam-bar-actions">
          <button className="btn btn-quit" disabled={busy} onClick={() => { setConfirmOpen(false); setQuitOpen(true); }}>Quit paper</button>
          <button className="btn btn-submit" disabled={busy} onClick={() => onSubmit(false)}>{busy ? 'Submitting...' : 'Submit paper'}</button>
        </div>
      </header>

      <div className="exam-body">
        <aside className="q-nav">
          {test.questions.map((x, i) => {
            const val = answers[x.id];
            const done = val != null && val !== '';
            let cls = 'q-dot';
            if (i === current) cls += ' current';
            else if (done) cls += ' done';
            return (
              <button
                key={x.id}
                className={cls}
                onClick={() => onGo(i)}
                title={`Question ${i + 1} · ${x.marks} mark${x.marks > 1 ? 's' : ''}${x.stretch ? ' · stretch' : ''}`}
                aria-label={`Go to question ${i + 1}`}
                aria-current={i === current ? 'true' : undefined}
              >
                <span className="q-num">{i + 1}</span>
                <span className="q-marks">{x.marks}m</span>
                {x.stretch && <span className="q-stretch" aria-hidden="true">★</span>}
              </button>
            );
          })}
          <div className="q-nav-legend">
            <span><i className="dot done" /> answered</span>
            <span><i className="dot" /> to do</span>
            <span>★ stretch</span>
          </div>
        </aside>

        <div className="q-main">
          <div className="q-card">
            <div className="q-meta">
              <span className="q-tag">Q{current + 1}</span>
              <span className="q-tag marks">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
              <span className="q-tag topic">{q.topic}</span>
              {q.stretch && !q.exceptional && <span className="q-tag stretch">Stretch</span>}
              {q.exceptional && <span className="q-tag stretch">Synoptic challenge</span>}
            </div>
            <div className="q-text">{q.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>
            <MathsVisual key={q.id} stimulus={q.stimulus} />

            {q.input.type === 'mcq' ? (
              <div className="choices" role="group" aria-label={`Answer to question ${current + 1}`}>
                {q.input.choices.map((c) => (
                  <button
                     key={c.label}
                     className={`choice ${answers[q.id] === c.label ? 'selected' : ''}`}
                     aria-pressed={answers[q.id] === c.label}
                    onClick={() => onAnswer(q.id, c.label)}
                  >
                    <span className="choice-letter">{c.label}</span>
                    <span>{c.text}</span>
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="answer-input"
                aria-label={`Answer to question ${current + 1}`}
                type="text"
                inputMode={q.input.type === 'number' ? 'decimal' : 'text'}
                placeholder={q.input.placeholder || 'Your answer'}
                value={answers[q.id] ?? ''}
                onChange={(e) => onAnswer(q.id, e.target.value)}
              />
            )}
          </div>

          <div className="q-actions">
            <button className="btn" disabled={current === 0} onClick={() => onGo(current - 1)}>← Previous</button>
            <span className="q-pos">Question {current + 1} of {test.questions.length} · {answeredMarks}/{test.totalMarks} marks banked · autosaved</span>
            {current < test.questions.length - 1 ? (
              <button className="btn btn-primary" onClick={() => onGo(current + 1)}>Next →</button>
            ) : (
              <button className="btn btn-finish" disabled={busy} onClick={() => onSubmit(false)}>Finish & submit ✓</button>
            )}
          </div>
          <p className="autosave-note" aria-hidden="true">Tip: use ← → keys to move between questions.</p>
        </div>
      </div>

      {confirmOpen && (
        <div className="modal-back">
          <div ref={submitDialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={submitTitleId} aria-describedby={`${submitTitleId}-description`}>
            <h3 id={submitTitleId}>Submit your paper?</h3>
            <p id={`${submitTitleId}-description`}>
              {unanswered === 0
                ? 'All questions answered. Ready to see your grade?'
                : `You still have ${unanswered} question${unanswered === 1 ? '' : 's'} unanswered. Submit anyway?`}
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmOpen(false)}>Keep working</button>
              <button className="btn btn-primary" disabled={busy} onClick={doConfirm}>Submit</button>
            </div>
          </div>
        </div>
      )}
      {quitOpen && (
        <div className="modal-back">
          <div ref={quitDialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={quitTitleId} aria-describedby={`${quitTitleId}-description`}>
            <h3 id={quitTitleId}>Quit this paper?</h3>
            <p id={`${quitTitleId}-description`}>Your answers on this unfinished paper will be discarded. Quitting will not affect your scores or progress.</p>
            <div className="modal-actions">
              <button className="btn" disabled={quitting} onClick={() => setQuitOpen(false)}>Keep working</button>
              <button className="btn btn-submit" disabled={quitting} onClick={doQuit}>{quitting ? 'Quitting...' : 'Quit paper'}</button>
            </div>
          </div>
        </div>
      )}
      {error && <div className="error-banner" role="alert">{error}</div>}
    </div>
  );
}
