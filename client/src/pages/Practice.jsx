import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

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
  const [phase, setPhase] = useState('setup'); // setup | running | submitting
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [perQStart, setPerQStart] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const saved = useRef(loadSaved());

  // Offer resume if a test was left mid-flight
  useEffect(() => {
    const s = saved.current;
    if (s && s.secondsLeft > 0) {
      setTest(s.test);
      setAnswers(s.answers || {});
      setSecondsLeft(s.secondsLeft);
      setStartedAt(Date.now());
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

  async function start(type) {
    setError('');
    try {
      const t = await api.newTest(type);
      setTest(t);
      setAnswers({});
      setCurrent(0);
      setSecondsLeft(t.minutes * 60);
      setElapsed(0);
      setStartedAt(Date.now());
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
    const q = test.questions[current];
    setPerQStart((p) => {
      const out = { ...p };
      if (q && !out[q.id]) out[q.id] = Date.now() - startedAt;
      else if (q) out[q.id] = (out[q.id] || 0) + 0;
      return out;
    });
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
        perQStart={perQStart}
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
        marksEarned={null}
      />
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Practice exam</h1>
          <p className="sub">Fresh questions every time, marked instantly with a predicted grade.</p>
        </div>
      </header>
      <div className="setup-grid">
        <button className="paper-card full" onClick={() => start('full')}>
          <div className="paper-type">FULL PAPER</div>
          <div className="paper-meta">80 marks · 90 minutes · 34 questions</div>
          <div className="paper-desc">
            One complete AQA 8300/1F-style foundation paper, built from the question bank with the
            exact strand weightings AQA uses, plus a few stretch questions. Timer included —
            aim for a mark a minute.
          </div>
          <span className="paper-go">Start →</span>
        </button>
        <button className="paper-card short" onClick={() => start('short')}>
          <div className="paper-type">QUICK PAPER</div>
          <div className="paper-meta">40 marks · 45 minutes · ~20 questions</div>
          <div className="paper-desc">
            A half-length paper for when time is short. Same AQA weightings, same marking,
            same predicted grade.
          </div>
          <span className="paper-go">Start →</span>
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="panel how">
        <h2>How it works</h2>
        <ul className="how-list">
          <li><b>1 mark a minute.</b> The big timer counts down the whole paper; a pace timer tracks you against the 1-mark-per-minute target.</li>
          <li><b>Every question is auto-marked.</b> You&apos;ll see a score out of 80 and a predicted grade using averaged past AQA boundaries.</li>
          <li><b>Solutions + fixes.</b> For everything you miss you get worked solutions and links to lessons & free revision resources for that exact topic.</li>
          <li><b>Stretch questions</b> are flagged with a ⚡ so you know the harder ones are coming.</li>
        </ul>
      </div>
    </div>
  );
}

function TestScreen(props) {
  const {
    test, answers, current, secondsLeft, elapsed, perQStart, onAnswer, onGo,
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
            const target = x.marks * 60;
            const spent = perQStart[x.id] != null ? elapsed * 1000 : 0;
            let cls = 'q-dot';
            if (i === current) cls += ' current';
            else if (done) cls += ' done';
            const over = done && false;
            return (
              <button key={x.id} className={cls} onClick={() => onGo(i)}>
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