import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { QuestionCard } from './Practice.jsx';
import { RewardCelebration, RewardSummary } from '../../../shared/rewards.jsx';
import { recordLessonResult } from '../../../shared/study-personal.js';

export default function Topic({ onProgress, userId }) {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [aiResults, setAiResults] = useState({});
  const [done, setDone] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTopic(null);
    setSession(null);
    setAnswers({});
    setFeedback({});
    setAiResults({});
    setDone(null);
    setCelebration(null);
    api.topic(topicId).then(setTopic).catch(() => {});
  }, [topicId]);

  async function startQuiz() {
    setBusy(true);
    try {
      const p = await api.practice(topicId, 3);
      setSession(p);
      setAnswers({});
      setFeedback({});
      setAiResults({});
      setDone(null);
      setCelebration(null);
    } finally {
      setBusy(false);
    }
  }

  async function checkOne(q, value) {
    if (q.type === 'list' || q.type === 'truefalse') {
      const res = await api.check(session.sessionId, q.id, value);
      setFeedback((f) => ({ ...f, [q.id]: res }));
      return;
    }
    if (q.markType === 'self') {
      setFeedback((f) => ({ ...f, [q.id]: { answerText: q.modelAnswer } }));
      return;
    }
    const answer = typeof value === 'object' ? value?.text ?? '' : value;
    const res = await api.mark(session.sessionId, q.id, answer);
    setFeedback((f) => ({ ...f, [q.id]: res }));
    if (res.ai) setAiResults((a) => ({ ...a, [q.id]: res }));
  }

  async function finishQuiz() {
    const list = (session?.questions || []).map((q) => ({ qid: q.id, value: answers[q.id] ?? null }));
    const res = await api.practiceSubmit(session.sessionId, list, aiResults);
    setDone({ correct: res.correctMarks, total: res.totalMarks, reward: res.reward, progress: res.progress });
    onProgress?.(res.progress);
    if (userId) {
      recordLessonResult(api, userId, 'english', topicId, topic?.name, res, answers)
        .catch((error) => console.error('[personal] lesson result could not be saved', error));
    }
    if (res.reward?.firstCompletion) setTopic((current) => ({ ...current, completed: true }));
    if (res.reward?.firstCompletion || res.reward?.levelAfter > res.reward?.levelBefore) {
      setCelebration(res.reward);
    }
  }

  if (!topic) return <div className="page"><div className="loading">Loading…</div></div>;

  return (
    <div className="page topic-page">
      <Link to="/learn" className="back-link">← All skills</Link>
      <header className="page-head">
        <div>
          <h1>{topic.name}</h1>
          <p className="sub">
            {topic.sectionName} · worth roughly {topic.examWeight} marks across the two papers
            {topic.accuracy != null ? ` · your accuracy so far: ${topic.accuracy}%` : ''}
          </p>
          {topic.completed && <div className="lesson-stamp topic-complete-stamp">Lesson completed</div>}
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
                  <div className="example-q"><b>Example</b> — {n.q}</div>
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
            <p className="sub">
              Real-bank questions, instant checking — AI-marked against the AQA rubric when a key is set.
            </p>
          </div>
          {!session && (
            <button className="btn btn-primary" onClick={startQuiz} disabled={busy}>
              {busy ? 'Loading…' : 'Start 3 questions'}
            </button>
          )}
        </div>

        {session && (
          <div className="quiz">
            {session.questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={i}
                value={answers[q.id]}
                fb={feedback[q.id]}
                onAnswer={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                onCheck={(v) => checkOne(q, v)}
                showSource
              />
            ))}
            {done ? (
              <div className="quiz-done">
                <h3>You scored {done.correct}/{done.total}</h3>
                <RewardSummary reward={done.reward} progress={done.progress} />
                <button className="btn btn-primary" onClick={startQuiz}>Another 3</button>
              </div>
            ) : (
              <button
                className="btn btn-finish"
                disabled={Object.keys(feedback).length < session.questions.length}
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
        <p className="sub">More lessons and practice on this exact skill — all free.</p>
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
        <h2>Want a hand with this skill?</h2>
        <p className="sub">Ask the AI tutor to walk you through {topic.name.toLowerCase()} step by step.</p>
        <Link className="btn btn-primary" to="/chat">Open AI tutor →</Link>
      </section>

      {celebration && (
        <RewardCelebration
          reward={celebration}
          lessonName={topic.name}
          onClose={() => setCelebration(null)}
          onPracticeAgain={() => {
            setCelebration(null);
            startQuiz();
          }}
          onChooseLesson={() => navigate('/learn')}
        />
      )}
    </div>
  );
}
