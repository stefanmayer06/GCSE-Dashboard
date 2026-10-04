import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, SUBJECT } from '../api.js';
import { invalidateResources, preloadResource, useResource } from '../../../shared/resource-cache.js';
import MathsVisual from '../components/MathsVisual.jsx';
import MathsQuestion from '../components/MathsQuestion.jsx';
import { AppHeader, useFocusMode } from '../../../shared/AppShell.jsx';
import { useCreatures } from '../../../shared/creatures.jsx';
import { AskPipButton } from '../../../shared/PipChat.jsx';
import { QuizDone, QuizFeedback, QuizProgress, WhyChips } from '../../../shared/LessonKit.jsx';
import { ConfirmSheet, PracticeLinks, RetryCard, RoundBar, Segmented } from '../../../shared/PracticeKit.jsx';
import { dueMistakeRows, personalKey, recordRoundMistakes } from '../../../shared/study-personal.js';
import Icon from '../../../shared/circuit/Icon.jsx';

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

const papersKey = (userId) => `papers:${SUBJECT}:${userId}`;

// Loads the paper list behind the sign-in splash when Practice is the landing page.
export function preload({ userId }) {
  return preloadResource(papersKey(userId), () => api.papers());
}

const ROUND_TITLES = {
  mixed: 'Mixed questions',
  diagnostic: '10-question check',
  fixup: 'Questions to revisit',
  memri: 'Memory check',
};

// Practice tab: retries first, then a mixed round, then timed papers.
// Rounds, papers and retries run in focus mode (no tab bar).
export default function Practice({ onProgress, progress = null, userId }) {
  const higherTier = window.location.pathname.startsWith('/maths-higher');
  const subject = higherTier ? 'maths-higher' : 'maths';
  const storageKey = activeTestKey(userId, higherTier);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const saved = useRef(loadSaved(storageKey));
  const { data: papersData } = useResource(userId ? papersKey(userId) : null, () => api.papers());
  const papers = papersData?.papers ?? null;
  const { mistakes } = useCreatures();
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
  const [paperType, setPaperType] = useState('full');
  const [count, setCount] = useState(15);
  const [sources, setSources] = useState([1, 2, 3]);
  const [round, setRound] = useState(null);
  const [roundBusy, setRoundBusy] = useState(false);
  const [roundError, setRoundError] = useState('');
  const submitting = useRef(false);
  const answersRef = useRef({});
  const elapsedRef = useRef(0);
  const secondsLeftRef = useRef(null);
  const roundStarted = useRef(false);
  const progressAtStart = useRef(null);

  useFocusMode(phase === 'running' || phase === 'submitting' || Boolean(round));

  // Deep links: /practice?paper=2&type=full starts that paper; /practice#adhoc scrolls to the mixed round.
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

  // Entry points that open straight into a round: the first-day check, and
  // Fix-Up / memory-check sets built from the notebook.
  useEffect(() => {
    if (roundStarted.current) return;
    const diagnostic = params.get('diagnostic') === '1';
    const fixup = params.get('fixup') === '1';
    const memri = params.get('memri') === '1';
    if (diagnostic) {
      roundStarted.current = true;
      api.track?.('diagnostic_start', { questionCount: 10 });
      startRound({ count: 10, mode: 'diagnostic' });
    } else if (fixup || memri) {
      roundStarted.current = true;
      let payload = null;
      try {
        payload = JSON.parse(localStorage.getItem(`gcse-fixup:${subject}`) || 'null');
      } catch {}
      try { localStorage.removeItem(`gcse-fixup:${subject}`); } catch {}
      startRound({
        count: 5,
        topicIds: payload?.topicIds || [],
        mode: payload?.mode === 'memri' ? 'memri' : 'fixup',
        fixupMeta: payload?.mode === 'memri' ? { touchIds: payload?.touchIds || [] } : null,
      });
    }
  }, []);

  async function startRound(options) {
    setRoundBusy(true);
    setRoundError('');
    try {
      const set = await api.adhoc(options.count, options.sources || [1, 2, 3], options.topicIds);
      progressAtStart.current = progress;
      setRound({ set, options, before: progress });
    } catch (e) {
      setRoundError(e.message || 'Could not load questions. Try again.');
    } finally {
      setRoundBusy(false);
    }
  }

  function endRound() {
    setRound(null);
    if (params.get('diagnostic') || params.get('fixup') || params.get('memri')) navigate('/practice', { replace: true });
  }

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
      progressAtStart.current = progress;
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
      // The progress before the paper lets Results show what it fed.
      const before = progressAtStart.current ?? progress;
      if (resultKey) localStorage.setItem(resultKey, JSON.stringify({ ...result, ...(before ? { progressBefore: before } : {}) }));
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

  if (round) {
    return (
      <RoundRunner
        key={round.set.roundId}
        round={round}
        subject={subject}
        onExit={endRound}
        onAgain={() => startRound({ ...round.options, mode: round.options.mode === 'diagnostic' ? 'mixed' : round.options.mode })}
        onProgress={onProgress}
        userId={userId}
      />
    );
  }

  const tierName = higherTier ? 'Higher' : 'Foundation';
  const paperLetter = higherTier ? 'H' : 'F';
  let dueCount = 0;
  try {
    dueCount = dueMistakeRows(mistakes.filter((row) => !row.mastered)).length;
  } catch {}
  const openCount = mistakes.filter((row) => !row.mastered).length;

  return (
    <div className="page practice-page">
      <AppHeader />
      <header className="page-title-row">
        <h1>Practice</h1>
      </header>
      <p className="sub page-intro">Questions marked as you go, and timed AQA {tierName} papers.</p>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          {saved.current && <button className="btn" onClick={resumeSaved}>Retry saved paper</button>}
        </div>
      )}

      <div className="practice-grid">
        <div className="practice-main">
          <RetryCard dueCount={dueCount} />

          <section className="practice-card mixed-card" id="adhoc" aria-labelledby="adhoc-title">
            <div className="practice-card-head">
              <span className="practice-card-icon" aria-hidden="true"><Icon name="practice" size={24} /></span>
              <div>
                <h2 id="adhoc-title">Mixed questions</h2>
                <p className="sub">One at a time, marked as you go, with the method when you need it.</p>
              </div>
            </div>
            <Segmented
              label="How many questions?"
              value={count}
              onChange={setCount}
              options={[10, 15, 20].map((value) => ({ value, label: `${value} questions` }))}
            />
            <details className="practice-options">
              <summary>Options</summary>
              <div className="field">
                <span id="source-label">Source papers</span>
                <div className="chip-row" role="group" aria-labelledby="source-label">
                  {[1, 2, 3].map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={sources.includes(id)}
                      className={`choice-chip${sources.includes(id) ? ' on' : ''}`}
                      onClick={() => setSources((list) => (list.includes(id) ? (list.length === 1 ? list : list.filter((x) => x !== id)) : [...list, id].sort()))}
                    >
                      8300/{id}{paperLetter}
                    </button>
                  ))}
                </div>
              </div>
            </details>
            {roundError ? <div className="error-banner" role="alert">{roundError}</div> : null}
            <button type="button" className="btn btn-go btn-block" onClick={() => startRound({ count, sources, mode: 'mixed' })} disabled={roundBusy}>
              {roundBusy ? 'Loading…' : `Start ${count} questions`}
            </button>
          </section>
        </div>

        <section className="papers-section" aria-labelledby="papers-title">
          <div className="section-head">
            <h2 id="papers-title" className="section-title">Timed papers</h2>
            <Segmented
              label="Paper length"
              value={paperType}
              onChange={setPaperType}
              options={[{ value: 'full', label: 'Full · 90 min' }, { value: 'short', label: 'Quick · 40 marks' }]}
            />
          </div>
          <div className="papers-grid">
            {(papers || [1, 2, 3]).map((p) => (papers ? (
              <div key={p.id} className={`paper-card pick ${p.calculator ? 'calc' : 'noncalc'}`}>
                <div className="paper-top">
                  <span className="paper-type">{p.code}</span>
                  <span className={`calc-badge ${p.calculator ? 'yes' : 'no'}`}>
                    {p.calculator ? 'Calculator' : 'No calculator'}
                  </span>
                </div>
                <div className="paper-desc">{p.blurb}</div>
                <div className="paper-actions">
                  <button type="button" className="btn btn-primary" onClick={() => start(paperType, p.id)}>
                    {paperType === 'full' ? 'Start full paper' : 'Start quick paper'} <Icon name="arrowRight" size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div key={p} className="skeleton-block paper-skeleton" aria-hidden="true" />
            )))}
          </div>
          <p className="field-note">
            {higherTier
              ? 'Any specification topic can appear on any paper. Each paper includes graph work and one synoptic challenge.'
              : 'Any Foundation topic can appear on any paper. Paper 1 is non-calculator.'}
          </p>
        </section>
      </div>

      <PracticeLinks notebookCount={openCount} />
    </div>
  );
}

/* ---------------- Mixed rounds: one question at a time ---------------- */

function RoundRunner({ round, subject, onExit, onAgain, onProgress, userId }) {
  const { set, options, before } = round;
  const mode = options.mode || 'mixed';
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [whys, setWhys] = useState({});
  const [hints, setHints] = useState({});
  const [steps, setSteps] = useState({});
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [combo, setCombo] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const total = set.questions.length;
  const q = set.questions[index] || null;
  const fb = q ? feedback[q.id] : null;
  const answer = q ? answers[q.id] : null;
  const last = index === total - 1;
  const title = ROUND_TITLES[mode] || ROUND_TITLES.mixed;

  useEffect(() => {
    if (done) return;
    const card = document.querySelector('.quiz-flow .quiz-q');
    card?.focus({ preventScroll: true });
  }, [index, done]);

  async function checkOne() {
    if (!q || answer == null || answer === '') return;
    setChecking(true);
    setError('');
    try {
      const res = await api.check(q.id, answer);
      setFeedback((f) => ({ ...f, [q.id]: res }));
      setCombo((streak) => (res.correct ? streak + 1 : 0));
    } catch (e) {
      setError(e.message || 'Could not check that answer. Try again.');
    } finally {
      setChecking(false);
    }
  }

  async function finish() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.adhocSubmit(set.roundId, set.questions.map((item) => ({ qid: item.id, value: answers[item.id] ?? null })));
      onProgress?.(res.progress);
      invalidateResources('attempts');
      invalidateResources('topics:');
      invalidateResources('personal:');
      if (mode === 'diagnostic') {
        api.track?.('diagnostic_complete', { correctMarks: res.correctMarks, totalMarks: res.totalMarks });
      }
      if (set.targeted) {
        api.track?.('fixup_complete', { correctMarks: res.correctMarks, totalMarks: res.totalMarks, memri: Boolean(options.fixupMeta?.touchIds?.length) });
      }
      if (options.fixupMeta?.touchIds?.length) {
        // Memory check evidence: proving faded mastery refreshes the stamp.
        try {
          const { hydratePersonal, touchMistakeRows } = await import('../../../shared/study-personal.js');
          const personal = await hydratePersonal(api, userId, subject);
          await api.saveMistakes(touchMistakeRows(personal.mistakes ?? [], options.fixupMeta.touchIds));
          invalidateResources('personal:');
          api.track?.('memri_complete', { count: options.fixupMeta.touchIds.length });
        } catch {}
      }
      if (userId && mode !== 'fixup' && mode !== 'memri') {
        try {
          await recordRoundMistakes(api, subject, set.roundId, res, { questions: set.questions, answers, feedback, errorTypes: whys });
        } catch (cause) {
          console.error('[personal] round mistakes could not be saved', cause);
        }
      }
      setDone({ correct: res.correctMarks, total: res.totalMarks, progress: res.progress });
    } catch (e) {
      setError(e.message || 'Could not score this round. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (last) finish();
    else setIndex((value) => value + 1);
  }

  const answered = Object.keys(feedback).length;
  const solution = fb?.solution || q?.solution || [];
  const stepCount = q ? steps[q.id] || 0 : 0;
  const hintCount = q ? hints[q.id] || 0 : 0;
  const pipContext = q && !done
    ? { kind: 'question', label: q.topic, question: q.text, answer: fb ? answer : null, wrong: fb ? !fb.correct : false }
    : { kind: 'practice', label: title };

  return (
    <div className="page round-page">
      <RoundBar
        title={title}
        detail={done ? 'Finished' : `${Math.min(index + 1, total)} of ${total}`}
        onClose={() => (answered > 0 && !done ? setConfirmExit(true) : onExit())}
        pipContext={pipContext}
      />

      {done ? (
        <QuizDone
          correct={done.correct}
          total={done.total}
          before={before}
          after={done.progress}
          error={error}
          againLabel={mode === 'diagnostic' ? 'Practise more' : 'Another round'}
          onAgain={onAgain}
          onNext={onExit}
          nextLabel="Back to Practice"
        />
      ) : (
        <div className="quiz-flow">
          <QuizProgress total={total} index={index} results={set.questions.map((item) => feedback[item.id]?.correct)} combo={combo} />
          <div key={q.id} className={`quiz-q ${fb ? (fb.correct ? 'right' : 'wrong') : ''}`} tabIndex={-1} role="group" aria-label={`Question ${index + 1} of ${total}`}>
            <div className="quiz-q-meta">
              <span>Q{index + 1} · {q.topic}</span>
              <span>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
              {q.stretch && !q.exceptional ? <span className="q-tag stretch">Stretch</span> : null}
              {q.exceptional ? <span className="q-tag stretch">Synoptic challenge</span> : null}
            </div>
            <MathsQuestion
              q={q}
              value={answer}
              index={index}
              disabled={Boolean(fb)}
              onChange={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
              onSubmit={checkOne}
            />
            {!fb ? (
              <div className="quiz-actions">
                {hintCount > 0 ? (
                  <div className="progressive-hints">
                    {q.hint ? <p className="hint-inline"><Icon name="bulb" size={16} /> {q.hint}</p> : null}
                    {(q.solution || []).slice(0, Math.max(0, hintCount - 1)).map((step, j) => <p className="hint-inline" key={j}>Step {j + 1}: {step}</p>)}
                  </div>
                ) : null}
                {(q.hint || q.solution?.length) && hintCount < 1 + (q.solution?.length || 0) ? (
                  <button type="button" className="link-button hint-button" onClick={() => setHints((h) => ({ ...h, [q.id]: (h[q.id] || 0) + 1 }))}>
                    <Icon name="bulb" size={16} /> {hintCount ? 'Show the next step' : 'Show a hint'}
                  </button>
                ) : null}
                {error ? <div className="error-banner" role="alert">{error}</div> : null}
                <button type="button" className="btn btn-go btn-block quiz-check" disabled={checking || answer == null || answer === ''} onClick={checkOne}>
                  {checking ? 'Checking…' : 'Check answer'}
                </button>
              </div>
            ) : null}
          </div>

          {fb ? (
            <QuizFeedback
              key={`fb:${q.id}`}
              tone={fb.correct ? 'right' : 'wrong'}
              title={fb.correct ? 'Correct!' : 'Not quite.'}
              nextLabel={last ? 'Finish & score' : 'Next question'}
              onNext={next}
              busy={busy}
              extra={fb.correct ? null : (
                <AskPipButton context={{ ...pipContext, answer, wrong: true }} label="Ask Pip why" className="btn" />
              )}
            >
              {fb.correct ? (
                <p className="quiz-feedback-answer">Answer: <b>{fb.answerText}</b></p>
              ) : (
                <>
                  <p className="sub">Work through the method before you look at the answer.</p>
                  {solution.length ? (
                    <div className="review-sol">
                      {solution.slice(0, stepCount).map((step, j) => <div key={j} className="sol-step">Step {j + 1}: {step}</div>)}
                      {stepCount < solution.length ? (
                        <button type="button" className="btn small" onClick={() => setSteps((s) => ({ ...s, [q.id]: (s[q.id] || 0) + 1 }))}>
                          Show the next step
                        </button>
                      ) : (
                        <div className="review-answer">Answer: <b>{fb.answerText}</b></div>
                      )}
                    </div>
                  ) : (
                    <p className="quiz-feedback-answer">Answer: <b>{fb.answerText}</b></p>
                  )}
                  <WhyChips value={whys[q.id] || null} onChange={(type) => setWhys((map) => ({ ...map, [q.id]: type }))} />
                </>
              )}
              {error ? <div className="error-banner" role="alert">{error}</div> : null}
            </QuizFeedback>
          ) : null}
        </div>
      )}

      {confirmExit ? (
        <ConfirmSheet
          title="End this round?"
          confirmLabel="End round"
          danger
          onConfirm={() => { setConfirmExit(false); onExit(); }}
          onClose={() => setConfirmExit(false)}
        >
          <p>Your answers so far won’t be scored. You can start a new round any time.</p>
        </ConfirmSheet>
      ) : null}
    </div>
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
        <button type="button" className="exam-quit" aria-label="Quit paper" disabled={busy} onClick={() => { setConfirmOpen(false); setQuitOpen(true); }}>
          <Icon name="close" size={22} strokeWidth={2.4} />
        </button>
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
          <button className="btn btn-submit" aria-label="Submit paper" disabled={busy} onClick={() => onSubmit(false)}>
            {busy ? 'Submitting…' : <>Submit<span className="submit-more"> paper</span></>}
          </button>
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
