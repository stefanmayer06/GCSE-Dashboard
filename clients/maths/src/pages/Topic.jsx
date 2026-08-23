import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Topic() {
  const higherTier = window.location.pathname.startsWith('/maths-higher');
  const { topicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTopic(null);
    setQuiz(null);
    setAnswers({});
    setFeedback({});
    setDone(null);
    api.topic(topicId).then(setTopic).catch(() => {});
  }, [topicId]);

  async function startQuiz() {
    setBusy(true);
    try {
      const q = await api.practice(topicId, 5);
      setQuiz(q.questions);
      setAnswers({});
      setFeedback({});
      setDone(null);
    } finally {
      setBusy(false);
    }
  }

  async function checkOne(qid, value) {
    const res = await api.check(qid, value);
    setFeedback((f) => ({ ...f, [qid]: res }));
    return res;
  }

  async function finishQuiz() {
    const list = quiz.map((q) => ({ qid: q.id, value: answers[q.id] ?? null }));
    const res = await api.practiceSubmit(topicId, list);
    setDone({ correct: res.correctMarks, total: res.totalMarks });
    setFeedback((f) => {
      const out = { ...f };
      for (const row of res.perQ) {
        out[row.qid] = { correct: row.correct, answerText: row.answerText, solution: row.solution };
      }
      return out;
    });
  }

  if (!topic) return <div className="page"><div className="loading">Loading…</div></div>;

  return (
    <div className="page topic-page">
      <Link to="/learn" className="back-link">← All topics</Link>
      <header className="page-head">
        <div>
          <h1>{topic.name}</h1>
          <p className="sub">
             {topic.strandName} · roughly {topic.examWeight}% of your {higherTier ? 'Higher' : 'Foundation'} paper
            {topic.accuracy != null ? ` · your accuracy so far: ${topic.accuracy}%` : ''}
          </p>
        </div>
      </header>

      <section className="panel">
        <h2>Notes</h2>
        <div className="notes">
          {topic.notes.map((n, i) => {
            if (n.t === 'p') return <p key={i} className="note-p">{n.text}</p>;
            if (n.t === 'b')
              return (
                <ul key={i} className="note-bullets">
                  {n.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              );
            if (n.t === 'f')
              return (
                <div key={i} className="formula-card">
                  <div className="formula-title">{n.title}</div>
                  <div className="formula-body">{n.text}</div>
                </div>
              );
            if (n.t === 'e')
              return (
                <div key={i} className="example-card">
                  <div className="example-q">Worked example: {n.q}</div>
                  <div className="example-a">{n.a}</div>
                </div>
              );
            return null;
          })}
        </div>
      </section>

      <section className="panel">
        <div className="quiz-head">
          <div>
            <h2>Quick practice</h2>
            <p className="sub">5 questions on this topic. Instant marking with worked solutions.</p>
          </div>
          {!quiz && (
            <button className="btn btn-primary" onClick={startQuiz} disabled={busy}>
              {busy ? 'Loading…' : 'Start 5 questions'}
            </button>
          )}
        </div>

        {quiz && (
          <div className="quiz">
            {quiz.map((q, i) => {
              const fb = feedback[q.id];
              return (
                <div key={q.id} className={`quiz-q ${fb ? (fb.correct ? 'right' : 'wrong') : ''}`}>
                  <div className="quiz-q-meta">
                    <span>Q{i + 1}</span>
                    <span>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
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
                      <div className="quiz-fb-line">{fb.correct ? '✅ Correct!' : '❌ Not quite.'} Answer: <b>{fb.answerText}</b></div>
                      <div className="review-sol">
                        {fb.solution.map((s, j) => <div key={j} className="sol-step">{s}</div>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {done ? (
              <div className="quiz-done">
                <h3>You scored {done.correct}/{done.total} 🎉</h3>
                <button className="btn btn-primary" onClick={startQuiz}>Another 5</button>
              </div>
            ) : (
              <button
                className="btn btn-finish"
                disabled={Object.keys(feedback).length < quiz.length}
                onClick={finishQuiz}
              >
                Finish & score
              </button>
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Free external resources</h2>
        <p className="sub">More lessons and practice on this exact topic — all free.</p>
        <div className="res-grid">
          {topic.resources.map((res) => (
            <a key={res.label} className="res-card" href={res.url} target="_blank" rel="noreferrer">
              <div className="res-name">🔗 {res.label}</div>
              <div className="res-why">{res.why}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Want a hand with this topic?</h2>
        <p className="sub">Ask the AI tutor to explain {topic.name} your way.</p>
        <Link className="btn btn-primary" to="/chat">Open AI tutor →</Link>
      </section>
    </div>
  );
}
