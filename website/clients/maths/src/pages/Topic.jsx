import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, SUBJECT } from '../api.js';
import { invalidateResources, preloadResource, useResource } from '../../../shared/resource-cache.js';
import LessonVisual from '../components/LessonVisual.jsx';
import MathsVisual from '../components/MathsVisual.jsx';
import { RewardCelebration, RewardSummary } from '../../../shared/rewards.jsx';
import { recordLessonResult } from '../../../shared/study-personal.js';
import { flattenTopics } from '../../../shared/study.js';
import { ComboMeter, LessonExplainer, LessonHeader, MasteryPanel, NotesDeck, ResourceGrid, StageSection, TutorPromo, useStages } from '../../../shared/LessonKit.jsx';
import { explainerForTopic } from '../../../shared/explainer/library/maths/index.js';
import Mark from '../../../shared/circuit/Mark.jsx';
import Icon from '../../../shared/circuit/Icon.jsx';

const topicKey = (userId, topicId) => `topic:${SUBJECT}:${userId}:${topicId}`;

// Loads the lesson behind the sign-in splash when it is the landing page.
export function preload({ userId, params }) {
  return preloadResource(topicKey(userId, params.topicId), () => api.topic(params.topicId));
}

export default function Topic({ onProgress, userId }) {
  const higherTier = window.location.pathname.startsWith('/maths-higher');
  const subject = higherTier ? 'maths-higher' : 'maths';
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { data: fetchedTopic } = useResource(
    userId && topicId ? topicKey(userId, topicId) : null,
    () => api.topic(topicId),
  );
  const [topicOverride, setTopicOverride] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [done, setDone] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [busy, setBusy] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [combo, setCombo] = useState(0);
  const [stagesDone, markStage] = useStages(topicId);
  const { data: catalog } = useResource(userId ? `topics:${subject}:${userId}` : null, () => api.topics());
  const topic = topicOverride && topicOverride.topicId === topicId ? topicOverride.value : fetchedTopic;

  useEffect(() => {
    setTopicOverride(null);
    setQuiz(null);
    setSessionId(null);
    setAnswers({});
    setFeedback({});
    setDone(null);
    setCelebration(null);
    setCombo(0);
  }, [topicId]);

  // v3 continue-strip: remember the last lesson per subject.
  useEffect(() => {
    try {
      if (topicId) {
        const name = topic?.name || topic?.title || topicId;
        localStorage.setItem(
          `gcse-continue:${subject}`,
          JSON.stringify({ href: `/learn/${topicId}`, label: String(name), detail: 'Lesson', at: Date.now() }),
        );
      }
    } catch {}
  }, [topicId, topic?.name, topic?.title, subject]);

  async function startQuiz() {
    setBusy(true);
    setQuizError('');
    try {
      const q = await api.practice(topicId, 5);
      setQuiz(q.questions);
      setSessionId(q.sessionId);
      setAnswers({});
      setFeedback({});
      setDone(null);
      setCelebration(null);
    } catch (e) {
      setQuizError(e.message || 'Could not start practice. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function checkOne(qid, value) {
    const res = await api.check(qid, value);
    setFeedback((f) => ({ ...f, [qid]: res }));
    setCombo((current) => (res.correct ? current + 1 : 0));
    return res;
  }

  async function finishQuiz() {
    setBusy(true);
    setQuizError('');
    try {
      const list = quiz.map((q) => ({ qid: q.id, value: answers[q.id] ?? null }));
      const res = await api.practiceSubmit(sessionId, topicId, list);
      onProgress?.(res.progress);
      if (userId) {
        try {
          await recordLessonResult(api, userId, higherTier ? 'maths-higher' : 'maths', topicId, topic?.name, res, answers);
        } catch (error) {
          console.error('[personal] lesson result could not be saved', error);
          setQuizError(error.personalDomain === 'mistakes'
            ? 'Today\'s mission is complete, but missed questions could not be added to your notebook.'
            : 'Your score was recorded, but today\'s mission could not be updated. Return to the dashboard and try again.');
        }
      }
      setDone({ correct: res.correctMarks, total: res.totalMarks, reward: res.reward, progress: res.progress });
      markStage('practise');
      invalidateResources(`topic:${subject}:${userId}:${topicId}`);
      invalidateResources(`topics:${subject}:${userId}`);
      if (res.reward?.firstCompletion) {
        setTopicOverride({ topicId, value: { ...(topicOverride?.value ?? fetchedTopic), completed: true } });
      }
      if (res.reward?.firstCompletion || res.reward?.levelAfter > res.reward?.levelBefore) {
        setCelebration(res.reward);
      }
      setFeedback((f) => {
        const out = { ...f };
        for (const row of res.perQ) {
          out[row.qid] = { correct: row.correct, answerText: row.answerText, solution: row.solution };
        }
        return out;
      });
    } catch (e) {
      setQuizError(e.message || 'Could not score this practice. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!topic) return <div className="page"><div className="loading">Loading…</div></div>;

  const strandTopics = flattenTopics(catalog, 'strands').filter((t) => t.strand === topic.strand);
  const position = strandTopics.findIndex((t) => t.id === topicId);
  const nextTopic = position >= 0 ? strandTopics[position + 1] || null : null;
  const authored = explainerForTopic(topicId);

  return (
    <div className="page topic-page lesson-page">
      <LessonHeader
        topic={topic}
        strand={topic.strand}
        eyebrow={`${topic.strandName} · ${higherTier ? 'Higher' : 'Foundation'}`}
        sub={`${topic.strandName} · AQA 8300 ${higherTier ? 'Higher' : 'Foundation'} revision${topic.accuracy != null ? ` · your accuracy so far: ${topic.accuracy}%` : ''}`}
        stagesDone={stagesDone}
      >
        {topic.completed && <div className="lesson-stamp topic-complete-stamp">Lesson completed</div>}
      </LessonHeader>

      <div className="editorial-note" aria-label="Editorial metadata">
        <span>AQA 8300{higherTier ? 'H' : ''}{topic.specSection ? ` · spec section ${topic.specSection} ${topic.specArea}` : ''}</span>
        <span>·</span>
        <span>Reviewed {topic.reviewed ? new Date(topic.reviewed).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'recently'} by {topic.editorial?.reviewer || 'the Study Desk content team'}</span>
        <span>·</span>
        <a href={topic.editorial?.reportIssueUrl || '/support.html'}>Report an issue</a>
      </div>

      <StageSection id="watch" index={1} title={authored ? 'Watch & play' : 'Watch the talk-through'} sub={authored ? 'A narrated explainer that stops for you to answer. Pause any time and play with the board.' : 'A narrated run through the notes, with a worked example to try before the reveal.'}>
        <LessonExplainer topic={topic} subject={subject} authored={authored} onDone={() => markStage('watch')} />
      </StageSection>

      <StageSection id="learn" index={2} title="Learn the notes" sub="Bite-size cards. Try every worked example before you reveal it.">
        <NotesDeck
          notes={topic.notes}
          visual={<LessonVisual key={topicId} topicId={topicId} />}
          onSeen={() => markStage('learn')}
        />
      </StageSection>

      <StageSection id="practise" index={3} title="Practise" sub="Five questions, marked instantly with worked solutions. Misses go to your notebook for a later retry.">
      <section className="panel quiz-panel">
        <div className="quiz-head">
          <div>
            <h2>Quick practice</h2>
            <p className="sub">5 questions on this topic. Instant marking with worked solutions.</p>
          </div>
          <ComboMeter streak={combo} />
          {!quiz && (
            <button className="btn btn-go" onClick={startQuiz} disabled={busy}>
              {busy ? 'Loading…' : 'Start 5 questions'}
            </button>
          )}
        </div>

        {quiz && (
          <div className="quiz">
            {quiz.map((q, i) => {
              const fb = feedback[q.id];
              return (
                <div key={`${sessionId}:${q.id}`} className={`quiz-q ${fb ? (fb.correct ? 'right' : 'wrong') : ''}`}>
                  <div className="quiz-q-meta">
                    <span>Q{i + 1}</span>
                    <span>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                  </div>
                  <div className="quiz-q-text">{q.text.split('\n').map((l, j) => <p key={j}>{l}</p>)}</div>
                   <MathsVisual key={`${sessionId}:${q.id}`} stimulus={q.stimulus} />

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
                      {q.hint && <span className="hint-inline"><Icon name="bulb" size={16} /> {q.hint}</span>}
                    </div>
                  ) : (
                    <div className="quiz-fb">
                      <div className="quiz-fb-line">{fb.correct ? <><Mark ok /> Correct!</> : <><Mark /> Not quite.</>} Answer: <b>{fb.answerText}</b></div>
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
                <h3>You scored {done.correct}/{done.total}</h3>
                <RewardSummary reward={done.reward} progress={done.progress} />
                {quizError && <div className="error-banner" role="alert">{quizError}</div>}
                <button className="btn btn-primary" onClick={startQuiz}>Another 5</button>
              </div>
            ) : (
              <>
                {quizError && <div className="error-banner" role="alert">{quizError}</div>}
                <button
                  className="btn btn-finish"
                  disabled={busy || Object.keys(feedback).length < quiz.length}
                  onClick={finishQuiz}
                >
                  {busy ? 'Scoring…' : 'Finish & score'}
                </button>
              </>
            )}
          </div>
        )}
      </section>

      </StageSection>

      <StageSection id="master" index={4} title="Master it" sub="Stars and emblem layers are earned from marked answers. Replay the practice to build them up.">
        <MasteryPanel topic={topic} strand={topic.strand} nextTopic={nextTopic} result={done} />
        <section className="panel">
          <h2>Free external resources</h2>
          <p className="sub">More lessons and practice on this exact topic — all free.</p>
          <ResourceGrid resources={topic.resources} />
        </section>
        <TutorPromo text={`Ask the AI tutor to explain ${topic.name} your way, one step at a time.`} />
      </StageSection>

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
