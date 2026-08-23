import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { STRAND_COLORS } from '../colors.js';

const LS_KEY = 'mathsmate-active-test';

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
    if (!data?.test?.id) return null;
    return data;
  } catch {
    return null;
  }
}

export default function Practice() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [papers, setPapers] = useState(null);
  const [phase, setPhase] = useState('setup'); // setup | running | submitting
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [perQStart, setPerQStart] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const saved = useRef(loadSaved());

  useEffect(() => {
    api.papers().then((r) => setPapers(r.papers)).catch(() => {});
  }, []);

  // Deep links: /practice?paper=2&type=full starts that paper; /practice#adhoc scrolls to ad-hoc.
  const autoStart = useRef({ paper: params.get('paper'), type: params.get('type') });
  useEffect(() => {
    if (window.location.hash === '#adhoc') {
      document.getElementById('adhoc')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (
      autoStart.current.paper &&
      autoStart.current.type &&
      !saved.current &&
      phase === 'setup' &&
      papers
    ) {
      start(autoStart.current.type === 'short' ? 'short' : 'full', Number(autoStart.current.paper));
    }
  }, [papers]);

  // Offer resume if a test was left mid-flight
  useEffect(() => {
    const s = saved.current;
    if (s && s.secondsLeft > 0) {
      setTest(s.test);
      setAnswers(s.answers || {});
      setSecondsLeft(s.secondsLeft);
      setElapsed(s.elapsed || 0);
      setPerQStart(s.perQStart || {});
      setPhase('running');
      setCurrent(s.current || 0);
    }
  }, []);

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
        JSON.stringify({ test, answers, current, secondsLeft, elapsed, perQStart })
      );
    }
  }, [test, answers, current, secondsLeft, elapsed, perQStart, phase]);

  async function start(type, paperId) {
    setError('');
    try {
      const t = await api.newTest(type, paperId);
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
    setAnswers((a) => ({ ...a, [qid]: value }));
  }

  function goTo(i) {
    setCurrent(Math.max(0, Math.min(test.questions.length - 1, i)));
  }

  async function doSubmit(ansOverride, dur, auto = false) {
    setPhase('submitting');
    try {
      const list = test.questions.map((q) => ({
        qid: q.id,
        value: ansOverride[q.id] ?? answers[q.id] ?? null,
      }));
      const result = await api.submitTest(test.id, list, dur ?? elapsed);
      localStorage.removeItem(LS_KEY);
      localStorage.setItem('mathsmate-last-result', JSON.stringify(result));
      navigate('/results');
    } catch (e) {
      setError(e.message);
      setPhase('running');
      if (auto) setSecondsLeft(30);
    }
  }

  if (phase === 'running' && test) {
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
        error={error}
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
            All three AQA foundation papers — 8300/1F (non-calculator), 8300/2F and 8300/3F
            (calculator) — built fresh from the question bank every time.
          </p>
        </div>
      </header>

      <section className="panel">
        <h2>Pick your paper</h2>
        <p className="sub">
          Each paper follows AQA&apos;s published topic allocation, with a difficulty ramp
          (easier questions first) and stretch questions ⚡ at the end.
        </p>
        <div className="papers-grid">
          {(papers || [1, 2, 3]).map((p) =>
            papers ? (
              <div key={p.id} className={`paper-card pick ${p.calculator ? 'calc' : 'noncalc'}`}>
                <div className="paper-top">
                  <span className="paper-type">{p.code}</span>
                  <span className={`calc-badge ${p.calculator ? 'yes' : 'no'}`}>
                    {p.calculator ? '🧮 Calculator' : '🚫 No calculator'}
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
        {error && <div className="error-banner">{error}</div>}
      </section>

      <AdhocSection />
    </div>
  );
}

/* ---------------- Ad-hoc: mixed questions from any papers ---------------- */

function AdhocSection() {
  const [sources, setSources] = useState([1, 2, 3]);
  const [count, setCount] = useState(15);
  const [running, setRunning] = useState(null);
  const [busy, setBusy] = useState(false);

  async function startAdhoc() {
    setBusy(true);
    try {
      const set = await api.adhoc(count, sources);
      setRunning(set);
    } finally {
      setBusy(false);
    }
  }

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
    return <AdhocRunner set={running} onExit={() => setRunning(null)} onNew={startAdhoc} />;
  }

  return (
    <section className="panel" id="adhoc">
      <div className="quiz-head">
        <div>
          <h2>🎲 Ad-hoc questions</h2>
          <p className="sub">
            A quick mixed bag drawn from any combination of the three papers — great for keeping
            every topic sharp between full mocks.
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
                {id === 1 ? '8300/1F' : id === 2 ? '8300/2F' : '8300/3F'}
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

function AdhocRunner({ set, onExit, onNew }) {
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [done, setDone] = useState(null);

  async function checkOne(qid, value) {
    const res = await api.check(qid, value);
    setFeedback((f) => ({ ...f, [qid]: res }));
  }

  async function finish() {
    const res = await api.adhocSubmit(
      set.questions.map((q) => ({ qid: q.id, value: answers[q.id] ?? null }))
    );
    setFeedback((f) => {
      const out = { ...f };
      for (const row of res.perQ) {
        out[row.qid] = { correct: row.correct, answerText: row.answerText };
      }
      return out;
    });
    setDone({ correct: res.correctMarks, total: res.totalMarks });
  }

  const allChecked = Object.keys(feedback).length >= set.questions.length;

  return (
    <section className="panel">
      <div className="quiz-head">
        <div>
          <h2>🎲 Ad-hoc round</h2>
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
                {q.stretch && <span className="q-tag stretch">⚡ Stretch</span>}
              </div>
              <div className="quiz-q-text">{q.text.split('\n').map((l, j) => <p key={j}>{l}</p>)}</div>

              {q.input.type === 'mcq' ? (
                <div className="choices">
                  {q.input.choices.map((c) => (
                    <button
                      key={c.label}
                      disabled={!!fb}
                      className={`choice ${answers[q.id] === c.label ? 'selected' : ''}`}
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
                  type="text"
                  inputMode="decimal"
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
                  {q.hint && <span className="hint-inline">💡 {q.hint}</span>}
                </div>
              ) : (
                <div className="quiz-fb">
                  <div className="quiz-fb-line">
                    {fb.correct ? '✅ Correct!' : '❌ Not quite.'} Answer: <b>{fb.answerText}</b>
                  </div>
                  {fb.solution && (
                    <div className="review-sol">
                      {fb.solution.map((s, j) => <div key={j} className="sol-step">{s}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {done ? (
          <div className="quiz-done">
            <h3>You scored {done.correct}/{done.total} 🎉</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={onNew}>Another round</button>
              <button className="btn" onClick={onExit}>Back to setup</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-finish" disabled={!allChecked} onClick={finish}>
            Finish & score
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------------- Exam runner ---------------- */

function TestScreen(props) {
  const {
    test, answers, current, secondsLeft, elapsed, onAnswer, onGo,
    onSubmit, confirmOpen, setConfirmOpen, doConfirm, error, marksAnswered,
  } = props;
  const q = test.questions[current];
  const lowTime = secondsLeft < 300;
  const paceMins = elapsed / 60;
  const paceTargetMarks = Math.min(test.totalMarks, paceMins);
  const answeredMarks = test.questions.filter((x) => answers[x.id] != null && answers[x.id] !== '').reduce((a, x) => a + x.marks, 0);
  const behind = answeredMarks < paceTargetMarks - 0.5;
  const unanswered = test.questions.length - marksAnswered;

  return (
    <div className="exam">
      <header className="exam-bar">
        <div className="exam-title">
          <span className="exam-paper">{test.paperCode} · {test.paperName}</span>
          <span className={`calc-badge ${test.calculator ? 'yes' : 'no'}`}>
            {test.calculator ? '🧮 Calculator allowed' : '🚫 Non-calculator — no calculator!'}
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
        <button className="btn btn-submit" onClick={() => onSubmit(false)}>Submit paper</button>
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
                {x.stretch && <span className="q-stretch">⚡</span>}
              </button>
            );
          })}
          <div className="q-nav-legend">
            <span><i className="dot done" /> answered</span>
            <span><i className="dot" /> to do</span>
            <span>⚡ stretch</span>
          </div>
        </aside>

        <div className="q-main">
          <div className="q-card">
            <div className="q-meta">
              <span className="q-tag">Q{current + 1}</span>
              <span className="q-tag marks">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
              <span className="q-tag topic">{q.topic}</span>
              {q.stretch && <span className="q-tag stretch">⚡ Stretch</span>}
            </div>
            <div className="q-text">{q.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}</div>

            {q.input.type === 'mcq' ? (
              <div className="choices">
                {q.input.choices.map((c) => (
                  <button
                    key={c.label}
                    className={`choice ${answers[q.id] === c.label ? 'selected' : ''}`}
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
                type="text"
                inputMode="decimal"
                placeholder={q.input.placeholder || 'Your answer'}
                value={answers[q.id] ?? ''}
                onChange={(e) => onAnswer(q.id, e.target.value)}
              />
            )}
          </div>

          <div className="q-actions">
            <button className="btn" disabled={current === 0} onClick={() => onGo(current - 1)}>← Previous</button>
            <span className="q-pos">{current + 1} of {test.questions.length}</span>
            {current < test.questions.length - 1 ? (
              <button className="btn btn-primary" onClick={() => onGo(current + 1)}>Next →</button>
            ) : (
              <button className="btn btn-finish" onClick={() => onSubmit(false)}>Finish & submit ✓</button>
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
                ? 'All questions answered. Ready to see your grade?'
                : `You still have ${unanswered} question${unanswered === 1 ? '' : 's'} unanswered. Submit anyway?`}
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmOpen(false)}>Keep working</button>
              <button className="btn btn-primary" onClick={doConfirm}>Submit</button>
            </div>
          </div>
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}