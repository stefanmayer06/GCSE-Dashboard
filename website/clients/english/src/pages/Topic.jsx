import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { invalidateResources, useResource } from '../../../shared/resource-cache.js';
import { QuestionCard } from './Practice.jsx';
import { RewardCelebration, RewardSummary } from '../../../shared/rewards.jsx';
import { recordLessonResult } from '../../../shared/study-personal.js';
import { flattenTopics } from '../../../shared/study.js';
import { ComboMeter, LessonExplainer, LessonHeader, MasteryPanel, NotesDeck, ResourceGrid, StageSection, TutorPromo, useStages } from '../../../shared/LessonKit.jsx';
import { explainerForTopic } from '../../../shared/explainer/library/english/index.js';

export default function Topic({ onProgress, userId }) {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { data: fetchedTopic } = useResource(
    userId && topicId ? `topic:${userId}:${topicId}` : null,
    () => api.topic(topicId),
  );
  const [topicOverride, setTopicOverride] = useState(null);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [aiResults, setAiResults] = useState({});
  const [done, setDone] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [busy, setBusy] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [combo, setCombo] = useState(0);
  const [stagesDone, markStage] = useStages(topicId);
  const { data: catalog } = useResource(userId ? `topics:english:${userId}` : null, () => api.topics());
  const topic = topicOverride && topicOverride.topicId === topicId ? topicOverride.value : fetchedTopic;

  useEffect(() => {
    setTopicOverride(null);
    setSession(null);
    setAnswers({});
    setFeedback({});
    setAiResults({});
    setDone(null);
    setCelebration(null);
    setCombo(0);
  }, [topicId]);

  // v3 continue-strip: remember the last skill per subject.
  useEffect(() => {
    try {
      if (topicId) {
        const name = topic?.name || topic?.title || topicId;
        localStorage.setItem(
          'gcse-continue:english',
          JSON.stringify({ href: `/learn/${topicId}`, label: String(name), detail: 'Skill lesson', at: Date.now() }),
        );
      }
    } catch {}
  }, [topicId, topic?.name, topic?.title]);

  async function startQuiz() {
    setBusy(true);
    setQuizError('');
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
      setCombo((current) => (res.correct ? current + 1 : 0));
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
    setBusy(true);
    setQuizError('');
    try {
      const list = (session?.questions || []).map((q) => ({ qid: q.id, value: answers[q.id] ?? null }));
      const res = await api.practiceSubmit(session.sessionId, list, aiResults);
      onProgress?.(res.progress);
      if (userId) {
        try {
          await recordLessonResult(api, userId, 'english', topicId, topic?.name, res, answers);
        } catch (error) {
          console.error('[personal] lesson result could not be saved', error);
          setQuizError(error.personalDomain === 'mistakes'
            ? 'Today\'s mission is complete, but missed questions could not be added to your notebook.'
            : 'Your score was recorded, but today\'s mission could not be updated. Return to the dashboard and try again.');
        }
      }
      setDone({ correct: res.correctMarks, total: res.totalMarks, reward: res.reward, progress: res.progress });
      markStage('practise');
      invalidateResources(`topic:${userId}:${topicId}`);
      invalidateResources(`topics:english:${userId}`);
      if (res.reward?.firstCompletion) {
        setTopicOverride({ topicId, value: { ...(topicOverride?.value ?? fetchedTopic), completed: true } });
      }
      if (res.reward?.firstCompletion || res.reward?.levelAfter > res.reward?.levelBefore) {
        setCelebration(res.reward);
      }
    } catch (error) {
      setQuizError(error.message || 'Could not score this practice. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!topic) return <div className="page"><div className="loading">Loading…</div></div>;

  const sectionTopics = flattenTopics(catalog, 'sections').filter((t) => (t.section || t.strand) === topic.section);
  const position = sectionTopics.findIndex((t) => t.id === topicId);
  const nextTopic = position >= 0 ? sectionTopics[position + 1] || null : null;
  const authored = explainerForTopic(topicId);

  return (
    <div className="page topic-page lesson-page english-lesson">
      <LessonHeader
        topic={topic}
        strand={topic.section}
        eyebrow={`${topic.sectionName} · AQA 8700`}
        backLabel="All skills"
        sub={`${topic.sectionName} · AQA 8700 revision${topic.accuracy != null ? ` · your accuracy so far: ${topic.accuracy}%` : ''}`}
        stagesDone={stagesDone}
      >
        {topic.completed && <div className="lesson-stamp topic-complete-stamp">Lesson completed</div>}
      </LessonHeader>

      <div className="editorial-note" aria-label="Editorial metadata">
        <span>AQA 8700{topic.specRefs?.length ? ` · ${topic.specRefs.join(', ')}` : ''}</span>
        <span>·</span>
        <span>Reviewed {topic.reviewed ? new Date(topic.reviewed).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'recently'} by {topic.editorial?.reviewer || 'the Study Desk content team'}</span>
        <span>·</span>
        <a href={topic.editorial?.reportIssueUrl || '/support.html'}>Report an issue</a>
      </div>

      <StageSection id="watch" index={1} title={authored ? 'Watch & play' : 'Watch the talk-through'} sub={authored ? 'A narrated explainer that zooms into real sentences and stops for you to answer.' : 'A narrated run through the skill, with an example to plan before the model is revealed.'}>
        <LessonExplainer topic={topic} subject="english" authored={authored} onDone={() => markStage('watch')} />
      </StageSection>

      <StageSection id="learn" index={2} title="Learn the skill" sub="Frameworks, examples and exam moves — plan your own answer before revealing each model.">
        <NotesDeck notes={topic.notes} english onSeen={() => markStage('learn')} />
      </StageSection>

      <StageSection id="practise" index={3} title="Practise" sub="Real-bank questions. Short answers are checked instantly; longer ones get AQA-style feedback.">
      <section className="panel quiz-panel">
        <div className="quiz-head">
          <div>
            <h2>Quick practice</h2>
            <p className="sub">
              Real-bank questions, instant checking — AI-marked against the AQA rubric when a key is set.
            </p>
          </div>
          <ComboMeter streak={combo} />
          {!session && (
            <button className="btn btn-go" onClick={startQuiz} disabled={busy}>
              {busy ? 'Loading…' : 'Start 3 questions'}
            </button>
          )}
        </div>

        {session && (
          <div className="quiz">
            {session.questions.map((q, i) => (
              <QuestionCard
                key={`${session.sessionId}:${q.id}`}
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
                {quizError && <div className="error-banner" role="alert">{quizError}</div>}
                <button className="btn btn-primary" onClick={startQuiz}>Another 3</button>
              </div>
            ) : (
              <button
                className="btn btn-finish"
                disabled={busy || Object.keys(feedback).length < session.questions.length}
                onClick={finishQuiz}
              >
                {busy ? 'Scoring…' : 'Finish & score'}
              </button>
            )}
          </div>
        )}
      </section>

      </StageSection>

      <StageSection id="master" index={4} title="Master it" sub="Stars and emblem layers are earned from marked answers. Replay the practice to build them up.">
        <MasteryPanel topic={topic} strand={topic.section} nextTopic={nextTopic} result={done} />
        <section className="panel">
          <h2>Free external resources</h2>
          <p className="sub">More lessons and practice on this exact skill — all free.</p>
          <ResourceGrid resources={topic.resources} />
        </section>
        <TutorPromo text={`Ask the AI tutor to walk you through ${topic.name.toLowerCase()} step by step.`} />
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
