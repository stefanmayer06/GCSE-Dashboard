import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { invalidateResources, useResource } from '../../../shared/resource-cache.js';
import { RewardSummary } from '../../../shared/rewards.jsx';

const LS_KEY = 'englishmate-active-test';

function fmtTime(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.test?.id || !Array.isArray(data.test.questions) || data.secondsLeft <= 0) {
      localStorage.removeItem(LS_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(LS_KEY);
    return null;
  }
}

export default function Practice({ health, onProgress, userId }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const saved = useRef(loadSaved());
  const [phase, setPhase] = useState(saved.current ? 'restoring' : 'setup');
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [error, setError] = useState('');
  const { data: papersData } = useResource(userId ? `papers:${userId}` : null, () => api.papers());
  const papersMeta = papersData?.papers ?? null;
  const submitting = useRef(false);

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
      setAnswers(s.answers || {});
      setSecondsLeft(s.secondsLeft);
      setElapsed(s.elapsed || 0);
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
    localStorage.removeItem(LS_KEY);
    saved.current = null;
    autoStart.current = { paper: null, type: null };
    setTest(null);
    setAnswers({});
    setCurrent(0);
    setSecondsLeft(null);
    setElapsed(0);
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
      setElapsed((e) => {
        const next = e + 1;
        setSecondsLeft((sl) => {
          const nsl = (sl ?? test.minutes * 60) - 1;
          if (nsl <= 0) {
            clearInterval(t);
            doSubmit({}, next, true);
          }
          return Math.max(0, nsl);
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [test, phase]);

  useEffect(() => {
    if (test && phase === 'running') {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({ test, answers, current, secondsLeft, elapsed })
      );
    }
  }, [test, answers, current, secondsLeft, elapsed, phase]);

  async function start(type, paperId) {
    setError('');
    try {
      const t = await api.newTest(type, paperId);
      localStorage.removeItem(LS_KEY);
      saved.current = null;
      setTest(t);
      setAnswers({});
      setCurrent(0);
      setSecondsLeft(t.minutes * 60);
      setElapsed(0);
      setPhase('running');
    } catch (e) {
      setError(e.message);
    }
  }

  const autoStart = useRef({ paper: params.get('paper'), type: params.get('type') });
  useEffect(() => {
    if (window.location.hash === '#adhoc') {
      document.getElementById('adhoc')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (autoStart.current.paper && autoStart.current.type && !saved.current && phase === 'setup' && papersMeta) {
      const next = autoStart.current;
      autoStart.current = { paper: null, type: null };
      start(next.type === 'short' ? 'short' : 'full', Number(next.paper));
    }
  }, [papersMeta]);

  function setAnswer(qid, value) {
    setAnswers((a) => ({ ...a, [qid]: value }));
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
      const list = test.questions.map((q) => ({
        qid: q.id,
        value: ansOverride[q.id] ?? answers[q.id] ?? null,
      }));
      const result = await api.submitTest(test.id, list, dur ?? elapsed);
      onProgress?.(result.progress);
      invalidateResources('attempts');
      invalidateResources('topics:');
      invalidateResources('personal:');
      localStorage.removeItem(LS_KEY);
      localStorage.setItem('englishmate-last-result', JSON.stringify(result));
      navigate('/results');
    } catch (e) {
      if (e.code === 'TEST_EXPIRED') clearExpiredTest(e.message);
      else {
        submitting.current = false;
        setError(e.message);
        setPhase('running');
        if (auto) setSecondsLeft(30);
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
    localStorage.removeItem(LS_KEY);
    saved.current = null;
    autoStart.current = { paper: null, type: null };
    setTest(null);
    setAnswers({});
    setCurrent(0);
    setSecondsLeft(null);
    setElapsed(0);
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
        onSubmit={(auto) => (auto ? doSubmit({}, null, true) : setConfirmOpen(true))}
        confirmOpen={confirmOpen}
        setConfirmOpen={setConfirmOpen}
        doConfirm={() => doSubmit({}, null, false)}
        quitOpen={quitOpen}
        setQuitOpen={setQuitOpen}
        doQuit={doQuit}
        quitting={quitting}
        error={error}
        markingReady={health?.aiMarking}
        busy={phase === 'submitting'}
      />
    );
  }

  const paperCards = papersMeta || [
    { id: 1, code: '8700/1', name: 'Paper 1', blurb: 'Explorations in Creative Reading and Writing' },
    { id: 2, code: '8700/2', name: 'Paper 2', blurb: 'Writers\u2019 Viewpoints and Perspectives' },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Practice papers</h1>
          <p className="sub">
            Both AQA 8700 papers, freshly assembled from the text bank with real mark totals,
            real timings, and a question-by-question target time.
          </p>
        </div>
      </header>

      <section className="panel">
        <h2>Pick your paper</h2>
        <div className="papers-grid two">
          {papersMeta ? (
            paperCards.map((p) => (
              <div key={p.id} className="paper-card pick">
                <div className="paper-top">
                  <span className="paper-type">{p.code}</span>
                  <span className="calc-badge yes">{p.id === 1 ? '📖 Fiction extract' : '📰 Two sources'}</span>
                </div>
                <div className="paper-desc">{p.blurb}</div>
                <div className="paper-actions">
                  <button className="btn btn-primary" onClick={() => start('full', p.id)}>
                    Full · 80 marks · 1h 45m
                  </button>
                  <button className="btn" onClick={() => start('short', p.id)}>
                    Quick · Q1 + Q5 · 50m
                  </button>
                </div>
              </div>
            ))
          ) : (
            [1, 2].map((p) => <div key={p} className="skeleton" aria-hidden="true" />)
          )}
        </div>
        <p className="sub small" style={{ marginTop: 12 }}>
           Long answers are marked by the AI tutor (Qwen 3.7 Flash) against summarised AQA mark
          schemes. {health?.aiMarking ? 'AI marking is ready.' : 'No OpenRouter key set — you\u2019ll self-mark against model answers and rubrics instead.'}
        </p>
        {error && (
          <div className="error-banner">
            {error}
            {saved.current && <button className="btn" onClick={resumeSaved}>Retry saved paper</button>}
          </div>
        )}
      </section>

      <AdhocSection onProgress={onProgress} diagnostic={params.get('diagnostic') === '1'} />
    </div>
  );
}

/* ---------------- ad-hoc quick fire ---------------- */

function AdhocSection({ onProgress, diagnostic = false }) {
  const diagnosticStarted = useRef(false);
  const [kinds, setKinds] = useState(['listing', 'truefalse', 'analysis']);
  const [count, setCount] = useState(10);
  const [running, setRunning] = useState(null);
  const [busy, setBusy] = useState(false);

  async function startAdhoc(countOverride) {
    setBusy(true);
    try {
      const set = await api.adhoc(typeof countOverride === 'number' ? countOverride : count, kinds);
      setRunning(set);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!diagnostic || diagnosticStarted.current) return;
    diagnosticStarted.current = true;
    setCount(10);
    startAdhoc(10);
  }, [diagnostic]);

  function toggleKind(k) {
    setKinds((s) => {
      if (s.includes(k)) {
        if (s.length === 1) return s;
        return s.filter((x) => x !== k);
      }
      return [...s, k];
    });
  }

  if (running) {
    return <AdhocRunner key={running.sessionId} set={running} onExit={() => setRunning(null)} onNew={startAdhoc} onProgress={onProgress} />;
  }

  const labels = { listing: 'List four things', truefalse: 'True or false', analysis: 'Language analysis' };

  return (
    <section className="panel" id="adhoc">
      <div className="quiz-head">
        <div>
          <h2>🎲 Quick-fire round</h2>
          <p className="sub">
            Mixed mini-questions drawn from any text in the bank. Instant feedback; language
            analysis gets AI marking when a key is configured.
          </p>
        </div>
      </div>
      <div className="adhoc-controls">
        <div className="adhoc-row">
          <span className="adhoc-label">Question types</span>
          <div className="chip-row">
            {Object.entries(labels).map(([k, label]) => (
              <button key={k} className={`suggest-chip source kind-chip ${kinds.includes(k) ? 'on' : ''}`} onClick={() => toggleKind(k)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="adhoc-row">
          <span className="adhoc-label">How many?</span>
          <div className="chip-row">
            {[5, 10, 15].map((c) => (
              <button key={c} className={`suggest-chip source ${count === c ? 'on' : ''}`} onClick={() => setCount(c)}>
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

/* Shared extended-answer checking for ad-hoc and topic practice */
export function useExtendedCheck(sessionId) {
  const [feedback, setFeedback] = useState({});
  const [aiResults, setAiResults] = useState({});

  async function checkText(q, value) {
    const answer = typeof value === 'object' ? value?.text ?? '' : value;
    const res = await api.mark(sessionId, q.id, answer);
    setFeedback((f) => ({ ...f, [q.id]: res }));
    if (res.ai) setAiResults((a) => ({ ...a, [q.id]: res }));
    return res;
  }

  async function checkAuto(sessionId, q, value) {
    const res = await api.check(sessionId, q.id, value);
    setFeedback((f) => ({ ...f, [q.id]: res }));
    return res;
  }

  return { feedback, setFeedback, aiResults, checkText, checkAuto };
}

function AdhocRunner({ set, onExit, onNew, onProgress }) {
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(null);
  const { feedback, aiResults, checkText, checkAuto } = useExtendedCheck(set.sessionId);
  const sessionId = set.sessionId;

  async function checkOne(q, value) {
    if (q.type === 'list' || q.type === 'truefalse') return checkAuto(sessionId, q, value);
    return checkText(q, value);
  }

  async function finish() {
    const res = await api.adhocSubmit(sessionId, set.questions.map((q) => ({ qid: q.id, value: answers[q.id] ?? null })), aiResults);
    onProgress?.(res.progress);
    invalidateResources('attempts');
    invalidateResources('topics:');
    invalidateResources('personal:');
    setDone({ correct: res.correctMarks, total: res.totalMarks, reward: res.reward, progress: res.progress });
  }

  const allDone = set.questions.every((q) => feedback[q.id]);

  return (
    <section className="panel">
      <div className="quiz-head">
        <div>
          <h2>🎲 Quick-fire round</h2>
          <p className="sub">{set.questions.length} questions from the text bank</p>
        </div>
        <button className="btn" onClick={onExit}>Back to setup</button>
      </div>
      <AdhocSourcePanel questions={set.questions} />
      <div className="quiz">
        {set.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={i}
            value={answers[q.id]}
            fb={feedback[q.id]}
            onAnswer={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
            onCheck={(v) => checkOne(q, v)}
          />
        ))}
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
          <button className="btn btn-finish" disabled={!allDone} onClick={finish}>Finish & score</button>
        )}
      </div>
    </section>
  );
}

function sourceRefKey(ref_) {
  return [ref_.paperId, ref_.title, ref_.titleA, ref_.titleB].filter(Boolean).join('|');
}

function sourceRefsFor(questions) {
  const seen = new Set();
  return questions.reduce((sources, question) => {
    if (!question.sourceRef) return sources;
    const key = sourceRefKey(question.sourceRef);
    if (seen.has(key)) return sources;
    seen.add(key);
    sources.push(question.sourceRef);
    return sources;
  }, []);
}

function sourceRefLabel(ref_, index) {
  const title = ref_.title || (ref_.titleA && ref_.titleB ? `${ref_.titleA} / ${ref_.titleB}` : 'Extract');
  return `${index + 1}. ${title}`;
}

function AdhocSourcePanel({ questions }) {
  const sources = sourceRefsFor(questions);
  const [active, setActive] = useState(0);
  if (!sources.length) return null;
  const current = sources[Math.min(active, sources.length - 1)];

  return (
    <div className="adhoc-source-panel" aria-label="Extracts for this quick-fire round">
      <div className="adhoc-source-heading">
        <div>
          <span className="source-flag">Extracts for this round</span>
          <h3>Read before you answer</h3>
        </div>
        <span className="adhoc-source-count">{sources.length} {sources.length === 1 ? 'extract' : 'extracts'}</span>
      </div>
      {sources.length > 1 && (
        <div className="source-tabs adhoc-source-tabs" role="tablist" aria-label="Round extracts">
          {sources.map((ref_, index) => (
            <button
              key={sourceRefKey(ref_)}
              role="tab"
              aria-selected={active === index}
              className={`source-tab ${active === index ? 'on' : ''}`}
              onClick={() => setActive(index)}
            >
              {sourceRefLabel(ref_, index)}
            </button>
          ))}
        </div>
      )}
      <SourceBox key={sourceRefKey(current)} ref_={current} />
    </div>
  );
}

/* ---------------- shared question card ---------------- */

export function QuestionCard({ q, index, value, fb, onAnswer, onCheck, showSource = false }) {
  const [checked, setChecked] = useState(false);
  const [attempt, setAttempt] = useState(1);
  const [previousMark, setPreviousMark] = useState(null);
  const [resubmitting, setResubmitting] = useState(false);

  async function resubmit() {
    setResubmitting(true);
    const before = fb?.marks ?? previousMark;
    try {
      const next = await onCheck(value);
      setPreviousMark(before);
      setAttempt(next.attemptNo ?? next.attemptNumber ?? next.attempt ?? attempt + 1);
    } finally { setResubmitting(false); }
  }

  function answerReady() {
    if (q.type === 'truefalse') {
      return q.input?.statements?.every((_, i) => Object.prototype.hasOwnProperty.call(value || {}, i));
    }
    if (q.type === 'list') return Boolean(String(value ?? '').trim());
    if (typeof value === 'object' && value !== null) {
      return Boolean(String(value.text || '').trim()) || value.option !== undefined;
    }
    return Boolean(String(value ?? '').trim());
  }

  function answerControl() {
    if (q.type === 'list') {
      return (
        <>
          <textarea
            className="answer-area list"
            placeholder={q.input?.placeholder || 'One point per line…'}
            disabled={!!fb && !fb.ai}
            value={value ?? ''}
            onChange={(e) => onAnswer(e.target.value)}
          />
          <div className="word-watch">{(value || '').split(/\n+/).filter(Boolean).length} point(s) listed</div>
        </>
      );
    }
    if (q.type === 'truefalse') {
      const v = value || {};
      return (
        <div className="tf-grid">
          {q.input.statements.map((s, i) => (
            <div key={i} className="tf-row">
              <span className="tf-text">{s.text}</span>
              <div className="tf-buttons">
                <button
                  className={`tf-btn ${v[i] === true ? 'on-true' : ''}`}
                  disabled={!!fb}
                  onClick={() => onAnswer({ ...v, [i]: true })}
                >
                  TRUE
                </button>
                <button
                  className={`tf-btn ${v[i] === false ? 'on-false' : ''}`}
                  disabled={!!fb}
                  onClick={() => onAnswer({ ...v, [i]: false })}
                >
                  FALSE
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <>
        {q.options?.length > 0 && (
          <div className="option-cards">
            {q.options.map((o) => (
              <button
                key={o.id}
                className={`option-card ${value?.option === o.id ? 'selected' : ''}`}
                disabled={!!fb && !fb.ai}
                onClick={() => onAnswer({ ...(value || {}), option: o.id, optionText: o.text })}
              >
                <div className="option-label">{o.label}</div>
                <div>{o.text}</div>
              </button>
            ))}
          </div>
        )}
        <textarea
          className={`answer-area ${q.type === 'essay' ? 'essay' : ''}`}
          placeholder={q.input?.placeholder || 'Write your answer here…'}
          disabled={!!fb && !fb.ai}
          value={value?.text ?? ''}
          onChange={(e) => onAnswer({ ...(value || {}), text: e.target.value })}
        />
        <div className="word-watch">
          {((value?.text || '').match(/\S+/g) || []).length} words
          {q.type === 'essay' ? ' · aim for 500+ for the full marks' : ' · 2–3 developed points'}
        </div>
      </>
    );
  }

  function feedbackBlock() {
    if (!fb) return null;
    if (fb.ai === false && (fb.modelAnswer || q.modelAnswer)) {
      return (
        <div className="fb-box">
          <div className="fb-head">
            <span className="mark-chip off">AI offline — self-mark against the rubric</span>
          </div>
          <div>
            <div className="fb-model">Model answer</div>
            <div className="model-answer">{(fb.modelAnswer || q.modelAnswer).split('\n').map((l, j) => <p key={j}>{l}</p>)}</div>
          </div>
          <RubricBands rubric={fb.rubric} />
        </div>
      );
    }
    if (fb.matched !== undefined || fb.points) {
      return (
        <div className="fb-box">
          <div className="fb-head">
            <span className="fb-marks">{fb.got}<span className="outof"> / {fb.max ?? 4}</span></span>
            <span className="mark-chip auto">auto-marked</span>
          </div>
          {fb.matched?.map((m, j) => (
            <div key={j} className="fb-text">✅ Your point “{m.line}” matches “{m.point}”.</div>
          ))}
          {fb.missed?.map((m, j) => (
            <div key={`m${j}`} className="fb-text" style={{ color: 'var(--muted)' }}>· You could also have said: “{m}”</div>
          ))}
        </div>
      );
    }
    if (fb.rows) {
      return (
        <div className="fb-box">
          <div className="fb-head">
            <span className="fb-marks">{fb.got}<span className="outof"> / {fb.max ?? 4}</span></span>
            <span className="mark-chip auto">auto-marked</span>
          </div>
          {fb.rows.map((r, j) => (
            <div key={j} className="fb-text">
              {r.right ? '✅' : '❌'} “{r.text}” → {r.answer ? 'TRUE' : 'FALSE'}
            </div>
          ))}
        </div>
      );
    }
    if (fb.ai) {
      return (
        <div className="fb-box">
          <div className="fb-head">
            <span className="fb-marks">{fb.marks}<span className="outof"> / {fb.marksTotal}</span></span>
            {fb.level && <span className="fb-level">Level {fb.level}</span>}
            <span className="mark-chip ai">AI-marked</span>
            {fb.content != null && (
              <span className="fb-text" style={{ fontSize: 12 }}>
                AO5 content {fb.content} · AO6 accuracy {fb.accuracy}
              </span>
            )}
          </div>
          <div className="fb-col">
            <div className="fb-label">Strengths</div>
            <div className="fb-text">{fb.strengths}</div>
          </div>
          <div className="fb-col">
            <div className="fb-label">Targets</div>
            <div className="fb-text">{fb.improvements}</div>
          </div>
          <div>
            <div className="fb-model">Model answer</div>
            <div className="model-answer">{fb.modelAnswer.split('\n').map((l, j) => <p key={j}>{l}</p>)}</div>
          </div>
          <RubricBands rubric={fb.rubric} level={fb.level} />
        </div>
      );
    }
    if (fb.answerText) {
      return (
        <div className="fb-box">
          <div className="fb-head"><span className="mark-chip auto">model answer</span></div>
          <div className="model-answer">{fb.answerText.split('\n').map((l, j) => <p key={j}>{l}</p>)}</div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`quiz-q ${fb ? (fb.ai && fb.marks >= fb.marksTotal * 0.7 ? 'right' : 'wrong') : ''}`}>
      <div className="quiz-q-meta">
        <span>Q{index + 1}</span>
        <span>{q.marks} marks</span>
        {q.targetMins && <span>~{q.targetMins} min</span>}
        <span>{q.title?.replace('Practice · ', '') || ''}</span>
        {q.markType === 'ai' && <span className="mark-chip ai">AI-marked</span>}
        {q.markType === 'auto' && <span className="mark-chip auto">auto-marked</span>}
        {q.markType === 'self' && <span className="mark-chip off">self-check</span>}
      </div>
      <div className="quiz-q-text">{q.text.split('\n').map((l, j) => <p key={j}>{l}</p>)}</div>

      <ImagePrompt image={q.image} />

      {showSource && q.sourceRef && <SourceBox ref_={q.sourceRef} />}

      {q.type === 'text' && !q.sourceRef && q.input?.hint && (
        <div className="input-hint">💡 {q.input.hint}</div>
      )}
      {answerControl()}

      {!fb ? (
        <div className="quiz-actions">
          <button
            className="btn small"
            disabled={!answerReady()}
            onClick={() => onCheck(value)}
          >
            Check answer
          </button>
          {q.type !== 'truefalse' && q.type !== 'list' && (
            <span className="hint-inline">{q.markType === 'ai' ? '🤖 AI will mark this against the AQA rubric' : 'Show the model answer when you\u2019re done'}</span>
          )}
        </div>
      ) : (
        <>{feedbackBlock()}{fb.ai && <div className="resubmit-box"><div className="fb-label">Attempt {fb.attemptNo ?? fb.attemptNumber ?? fb.attempt ?? attempt}{(fb.markDelta != null || previousMark != null) && <span className="mark-delta"> · {(fb.markDelta ?? fb.marks - previousMark) >= 0 ? '+' : ''}{fb.markDelta ?? fb.marks - previousMark} marks</span>}</div>{fb.canResubmit !== false ? <><p className="sub small">Improve your answer using the target above, then submit it for marking again.</p><button className="btn btn-primary" disabled={!answerReady() || resubmitting} onClick={resubmit}>{resubmitting ? 'Marking again…' : 'Improve and resubmit'}</button></> : <p className="sub small">You have completed all marking attempts for this answer.</p>}</div>}</>
      )}
    </div>
  );
}

export function ImagePrompt({ image }) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) return null;
  return (
    <figure className="q-image">
      <img src={image.url} alt={image.alt || ''} loading="lazy" onError={() => setFailed(true)} />
      {image.credit && <figcaption className="q-image-cap">{image.credit}</figcaption>}
    </figure>
  );
}

export function RubricBands({ rubric, level }) {
  if (!rubric?.bands) return null;
  return (
    <div className="rubric-bands">
      <div className="fb-label">Mark scheme (summarised)</div>
      {rubric.bands.map((b) => (
        <div key={b.level} className={`rubric-band ${b.level === level ? 'me' : ''}`}>
          <span className="lvl">L{b.level} · {b.range}</span>
          <span>{b.desc}</span>
        </div>
      ))}
    </div>
  );
}

export function SourceBox({ ref_ }) {
  const [tab, setTab] = useState(ref_.paperId === 2 ? 'B' : 'A');
  const p2 = ref_.paperId === 2 && Boolean(ref_.textA && ref_.textB);
  const title = p2 ? (tab === 'A' ? ref_.titleA : ref_.titleB) : ref_.title;
  const text = p2 ? (tab === 'A' ? ref_.textA : ref_.textB) : (ref_.text || '');
  return (
    <div className="source-panel">
      <div className="source-meta">
        <span className="source-flag">Source</span>
        {p2 && (
          <div className="source-tabs">
            <button className={`source-tab ${tab === 'A' ? 'on' : ''}`} onClick={() => setTab('A')}>Source A (19thC)</button>
            <button className={`source-tab ${tab === 'B' ? 'on' : ''}`} onClick={() => setTab('B')}>Source B (modern)</button>
          </div>
        )}
      </div>
      <div className="source-title">{title}</div>
      <div className="source-text">
        {text.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div>
  );
}

/* ---------------- exam runner ---------------- */

function TestScreen(props) {
  const {
    test, answers, current, secondsLeft, elapsed, onAnswer, onGo, onSubmit,
    confirmOpen, setConfirmOpen, doConfirm, quitOpen, setQuitOpen, doQuit, quitting,
    error, markingReady, busy,
  } = props;
  const q = test.questions[current];
  const lowTime = secondsLeft < 600;
  const elapsedMins = elapsed / 60;
  const doneBefore = test.questions.slice(0, current).reduce((a, x) => a + x.targetMins, 0);
  const answeredCount = test.questions.filter((x) => {
    const v = answers[x.id];
    if (x.type === 'truefalse') return v && Object.keys(v).length === x.input.statements.length;
    return v && String(typeof v === 'object' ? v.text ?? '' : v).trim().length > 0;
  }).length;
  const unanswered = test.questions.length - answeredCount;
  const behind = elapsedMins > doneBefore + q.targetMins * 0.6 && elapsedMins > doneBefore;

  return (
    <div className="exam" aria-busy={busy}>
      <header className="exam-bar">
        <div className="exam-title">
          <span className="exam-paper">{test.paperCode} · {test.paperName}</span>
          <span className="calc-badge yes">✍️ {test.paperTitle}</span>
        </div>
        <div className="exam-timers">
          <div className={`timer big ${lowTime ? 'low' : ''}`}>
            <span className="timer-label">Paper time</span>
            <span className="timer-value">{fmtTime(secondsLeft)}</span>
          </div>
          <div className={`timer ${behind ? 'behind' : 'ahead'}`}>
            <span className="timer-label">This question · target {q.targetMins} min</span>
            <span className="timer-value">
              {elapsed < 60 ? `${elapsed}s` : fmtTime(elapsed)}
              <span className="pace-badge">{behind ? ' slow' : ' on pace'}</span>
            </span>
          </div>
          <div className="timer">
            <span className="timer-label">Answered</span>
            <span className="timer-value">{answeredCount} / {test.questions.length}</span>
          </div>
        </div>
        <div className="exam-bar-actions">
          <button className="btn btn-quit" disabled={busy} onClick={() => { setConfirmOpen(false); setQuitOpen(true); }}>Quit paper</button>
          <button className="btn btn-submit" disabled={busy} onClick={() => onSubmit(false)}>{busy ? 'Submitting...' : 'Submit paper'}</button>
        </div>
      </header>

      <div className="exam-with-source">
        <div className="exam-source-col">
          <div className="source-panel tall">
            <div className="source-meta">
              <span className="source-flag">{test.paperId === 1 ? 'Fiction extract' : 'Two sources'}</span>
            </div>
            {test.paperId === 1 ? (
              <>
                <div className="source-title">{test.source.title} — {test.source.author}, {test.source.year}</div>
                <div className="source-text">{test.source.text.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
              </>
            ) : (
              <SourcePair source={test.source} />
            )}
          </div>
        </div>

        <div className="q-main">
          <aside className="q-nav">
            {test.questions.map((x, i) => {
              const v = answers[x.id];
              const done = v && (x.type === 'truefalse'
                ? Object.keys(v).length === x.input.statements.length
                : String(typeof v === 'object' ? v.text ?? '' : v).trim().length > 0);
              let cls = 'q-dot';
              if (i === current) cls += ' current';
              else if (done) cls += ' done';
              return (
                <button
                  key={x.id}
                  className={cls}
                  onClick={() => onGo(i)}
                  title={`Question ${i + 1} · ${x.marks} marks`}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={i === current ? 'true' : undefined}
                >
                  <span className="q-num">{i + 1}</span>
                  <span className="q-marks">{x.marks}m</span>
                </button>
              );
            })}
            <div className="q-nav-legend">
              <span><i className="dot done" /> answered</span>
              <span><i className="dot" /> to do</span>
            </div>
          </aside>

          <div className="q-card">
            <div className="q-meta">
              <span className="q-tag">Q{current + 1}</span>
              <span className="q-tag marks">{q.marks} marks</span>
              <span className="q-tag topic">~{q.targetMins} min</span>
              {q.markType === 'ai' && <span className="q-tag stretch">🤖 AI-marked</span>}
              {q.markType === 'auto' && <span className="q-tag">auto-marked</span>}
            </div>
            <div className="q-text">{q.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>

            <ImagePrompt image={q.image} />

            {q.type === 'list' && (
              <>
                <textarea
                  className="answer-area list"
                  placeholder="Write one thing per line…"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => onAnswer(q.id, e.target.value)}
                />
                <div className="input-hint">💡 {q.input?.hint}</div>
              </>
            )}

            {q.type === 'truefalse' && (
              <TrueFalseBlock q={q} value={answers[q.id]} onAnswer={(v) => onAnswer(q.id, v)} />
            )}

            {q.type === 'text' && (
              <>
                {q.statement && (
                  <div className="fb-box" style={{ marginBottom: 12 }}>
                    <div className="fb-text" style={{ fontWeight: 700 }}>{q.statement}</div>
                  </div>
                )}
                <textarea
                  className="answer-area"
                  placeholder="Write your answer here…"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => onAnswer(q.id, e.target.value)}
                />
                <div className="input-hint">💡 {q.input?.hint}</div>
              </>
            )}

            {q.type === 'essay' && (
              <>
                <EssayOptions q={q} value={answers[q.id]} onAnswer={(v) => onAnswer(q.id, v)} />
                <textarea
                  className="answer-area essay"
                  placeholder="Plan first, then write your response…"
                  value={answers[q.id]?.text ?? ''}
                  onChange={(e) => onAnswer(q.id, { ...(answers[q.id] || {}), text: e.target.value })}
                />
                <div className="word-watch">
                  {((answers[q.id]?.text || '').match(/\S+/g) || []).length} words · aim 500+
                </div>
                <div className="input-hint">💡 {q.input?.hint}</div>
              </>
            )}
          </div>

          <div className="q-actions">
            <button className="btn" disabled={current === 0} onClick={() => onGo(current - 1)}>← Previous</button>
            <span className="q-pos">{current + 1} of {test.questions.length}</span>
            {current < test.questions.length - 1 ? (
              <button className="btn btn-primary" onClick={() => onGo(current + 1)}>Next →</button>
            ) : (
              <button className="btn btn-finish" disabled={busy} onClick={() => onSubmit(false)}>Finish & submit ✓</button>
            )}
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="modal-back">
          <div className="modal">
            <h3>Submit your paper?</h3>
            <p>
              {unanswered === 0
                ? 'All questions answered. Time to see your mark.'
                : `You still have ${unanswered} question${unanswered === 1 ? '' : 's'} unanswered. Submit anyway?`}
            </p>
            <div className="marking-note">
              <span>{markingReady
                ? '🤖 Your long answers will be marked by the AI examiner against summarised AQA mark schemes.'
                : '⚠️ No OpenRouter key is configured — long answers will be returned with model answers and rubrics so you can self-mark.'}</span>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmOpen(false)}>Keep working</button>
              <button className="btn btn-primary" disabled={busy} onClick={doConfirm}>Submit</button>
            </div>
          </div>
        </div>
      )}
      {quitOpen && (
        <div className="modal-back">
          <div className="modal">
            <h3>Quit this paper?</h3>
            <p>Your answers on this unfinished paper will be discarded. Quitting will not affect your scores or progress.</p>
            <div className="modal-actions">
              <button className="btn" disabled={quitting} onClick={() => setQuitOpen(false)}>Keep working</button>
              <button className="btn btn-submit" disabled={quitting} onClick={doQuit}>{quitting ? 'Quitting...' : 'Quit paper'}</button>
            </div>
          </div>
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}

function TrueFalseBlock({ q, value, onAnswer }) {
  const v = value || {};
  return (
    <div className="tf-grid">
      {q.input.statements.map((s, i) => (
        <div key={i} className="tf-row">
          <span className="tf-text">{s.text}</span>
          <div className="tf-buttons">
            <button
              className={`tf-btn ${v[i] === true ? 'on-true' : ''}`}
              aria-pressed={v[i] === true}
              onClick={() => onAnswer({ ...v, [i]: true })}
            >
              TRUE
            </button>
            <button
              className={`tf-btn ${v[i] === false ? 'on-false' : ''}`}
              aria-pressed={v[i] === false}
              onClick={() => onAnswer({ ...v, [i]: false })}
            >
              FALSE
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EssayOptions({ q, value, onAnswer }) {
  return (
    <div className="option-cards">
      {q.options.map((o) => (
        <button
          key={o.id}
          className={`option-card ${value?.option === o.id ? 'selected' : ''}`}
          onClick={() => onAnswer({ ...(value || {}), option: o.id })}
        >
          <div className="option-label">{o.label}</div>
          <div>{o.text}</div>
        </button>
      ))}
    </div>
  );
}

function SourcePair({ source }) {
  const [tab, setTab] = useState('A');
  const s = tab === 'A' ? source.sourceA : source.sourceB;
  return (
    <>
      <div className="source-tabs" role="tablist" aria-label="Sources">
        <button
          role="tab"
          aria-selected={tab === 'A'}
          className={`source-tab ${tab === 'A' ? 'on' : ''}`}
          onClick={() => setTab('A')}
        >
          Source A ({source.sourceA.century})
        </button>
        <button
          role="tab"
          aria-selected={tab === 'B'}
          className={`source-tab ${tab === 'B' ? 'on' : ''}`}
          onClick={() => setTab('B')}
        >
          Source B ({source.sourceB.century})
        </button>
      </div>
      <div className="source-title">{s.title} — {s.author}, {s.year}</div>
      <div className="source-text">{s.text.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
    </>
  );
}
