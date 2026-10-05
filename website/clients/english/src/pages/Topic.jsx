import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { invalidateResources, preloadResource, useResource } from '../../../shared/resource-cache.js';
import { QuestionCard } from './Practice.jsx';
import { LessonComplete } from '../../../shared/rewards.jsx';
import { useHoldEvolutions } from '../../../shared/creatures.jsx';
import { recordLessonResult } from '../../../shared/study-personal.js';
import { flattenTopics } from '../../../shared/study.js';
import {
  EditorialNote,
  LessonExplainer,
  LessonFlow,
  MasteryPanel,
  NotesDeck,
  PipPromo,
  QuizDone,
  QuizProgress,
  QuizStart,
  ResourceGrid,
  WhyChips,
  useStages,
} from '../../../shared/LessonKit.jsx';
import { AskPipButton } from '../../../shared/PipChat.jsx';
import { explainerForTopic } from '../../../shared/explainer/library/english/index.js';
import Icon from '../../../shared/circuit/Icon.jsx';

const topicKey = (userId, topicId) => `topic:${userId}:${topicId}`;
const QUIZ_SIZE = 3;

// Loads the lesson behind the sign-in splash when it is the landing page.
export function preload({ userId, params }) {
  return preloadResource(topicKey(userId, params.topicId), () => api.topic(params.topicId));
}

// Full marks, some marks or self-checked: decides the tone of the card and
// whether "What went wrong?" is offered.
function verdict(fb) {
  if (!fb) return null;
  if (fb.correct === true) return 'right';
  if (fb.correct === false) return 'wrong';
  if (fb.ai && fb.marksTotal) return fb.marks >= fb.marksTotal ? 'right' : 'wrong';
  if (fb.got != null && (fb.max ?? 4)) return fb.got >= (fb.max ?? 4) ? 'right' : 'wrong';
  return 'self';
}

export default function Topic({ onProgress, userId, progress = null }) {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { data: fetchedTopic } = useResource(
    userId && topicId ? topicKey(userId, topicId) : null,
    () => api.topic(topicId),
  );
  const [topicOverride, setTopicOverride] = useState(null);
  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [aiResults, setAiResults] = useState({});
  const [whys, setWhys] = useState({});
  const [done, setDone] = useState(null);
  const [before, setBefore] = useState(null);
  const [celebration, setCelebration] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [combo, setCombo] = useState(0);
  const [stagesDone, markStage] = useStages(topicId);
  const { data: catalog } = useResource(userId ? `topics:english:${userId}` : null, () => api.topics());
  const topic = topicOverride && topicOverride.topicId === topicId ? topicOverride.value : fetchedTopic;
  // An evolution earned by this round waits while it is scored and while
  // the lesson-complete card is open, then plays.
  useHoldEvolutions(busy || (celebration && Boolean(done)));

  useEffect(() => {
    setTopicOverride(null);
    setSession(null);
    setCurrent(0);
    setAnswers({});
    setFeedback({});
    setAiResults({});
    setWhys({});
    setDone(null);
    setCelebration(false);
    setCombo(0);
  }, [topicId]);

  useEffect(() => {
    if (!session || done) return;
    const card = document.querySelector('.quiz-flow .quiz-q');
    if (card) {
      card.setAttribute('tabindex', '-1');
      card.focus({ preventScroll: true });
      card.scrollIntoView?.({ block: 'nearest' });
    }
  }, [current, session, done]);

  // Remember the last skill per subject.
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
      const p = await api.practice(topicId, QUIZ_SIZE);
      setSession(p);
      setCurrent(0);
      setAnswers({});
      setFeedback({});
      setAiResults({});
      setWhys({});
      setDone(null);
      setCelebration(false);
      setBefore(progress);
    } catch (error) {
      setQuizError(error.message || 'Could not start practice. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function checkOne(q, value) {
    if (q.type === 'list' || q.type === 'truefalse') {
      const res = await api.check(session.sessionId, q.id, value);
      setFeedback((f) => ({ ...f, [q.id]: res }));
      setCombo((streak) => (res.correct ? streak + 1 : 0));
      return res;
    }
    if (q.markType === 'self') {
      const res = { answerText: q.modelAnswer };
      setFeedback((f) => ({ ...f, [q.id]: res }));
      return res;
    }
    const answer = typeof value === 'object' ? value?.text ?? '' : value;
    const res = await api.mark(session.sessionId, q.id, answer);
    setFeedback((f) => ({ ...f, [q.id]: res }));
    if (res.ai) setAiResults((a) => ({ ...a, [q.id]: res }));
    return res;
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
          await recordLessonResult(api, userId, 'english', topicId, topic?.name, res, answers, { errorTypes: whys });
        } catch (error) {
          console.error('[personal] lesson result could not be saved', error);
          setQuizError(error.personalDomain === 'mistakes'
            ? 'Today’s task is complete, but missed questions could not be added to your notebook.'
            : 'Your score was recorded, but today’s task could not be updated. Go back to Today and try again.');
        }
      }
      setDone({ correct: res.correctMarks, total: res.totalMarks, progress: res.progress });
      markStage('practise');
      invalidateResources(`topic:${userId}:${topicId}`);
      invalidateResources(`topics:english:${userId}`);
      if (res.reward?.firstCompletion) {
        setTopicOverride({ topicId, value: { ...(topicOverride?.value ?? fetchedTopic), completed: true } });
        setCelebration(true);
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
  const questions = session?.questions || [];
  const q = questions[current] || null;
  const fb = q ? feedback[q.id] : null;
  const tone = verdict(fb);
  const last = current === questions.length - 1;
  const inRound = Boolean(session) && !done;
  const pipContext = q && !done
    ? { kind: 'question', label: topic.name, question: String(q.text || '').trim(), answer: fb ? (answers[q.id]?.text ?? answers[q.id]) : null, wrong: tone === 'wrong' }
    : { kind: 'lesson', label: topic.name };

  function practiseContent() {
    if (!session) {
      return (
        <QuizStart
          count={QUIZ_SIZE}
          title="Quick practice"
          detail="Three real-bank questions, one at a time. Short answers are checked straight away; longer ones get AQA-style feedback."
          busy={busy}
          error={quizError}
          onStart={startQuiz}
        />
      );
    }
    if (done) {
      return (
        <QuizDone
          correct={done.correct}
          total={done.total}
          before={before}
          after={done.progress}
          error={quizError}
          againLabel={`Another ${QUIZ_SIZE}`}
          againQuiet
          onAgain={startQuiz}
        />
      );
    }
    return (
      <div className="quiz-flow">
        <QuizProgress
          total={questions.length}
          index={current}
          results={questions.map((item) => {
            const result = verdict(feedback[item.id]);
            return result === 'right' ? true : result === 'wrong' ? false : undefined;
          })}
          combo={combo}
        />
        <QuestionCard
          key={`${session.sessionId}:${q.id}`}
          q={q}
          index={current}
          value={answers[q.id]}
          fb={fb}
          onAnswer={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
          onCheck={(value) => checkOne(q, value)}
          showSource
        />
        {fb ? (
          <div className={`quiz-feedback ${tone}`}>
            <p className="quiz-feedback-title" role="status">
              <span className="quiz-feedback-mark" aria-hidden="true"><Icon name={tone === 'right' ? 'check' : tone === 'wrong' ? 'close' : 'pen'} size={18} strokeWidth={3} /></span>
              {tone === 'right' ? 'Full marks!' : tone === 'wrong' ? 'Check the feedback above, then move on.' : 'Compare your answer with the model above.'}
            </p>
            {tone === 'wrong' ? (
              <WhyChips
                value={whys[q.id] || null}
                onChange={(type) => setWhys((map) => ({ ...map, [q.id]: type }))}
                types={['knowledge', 'method', 'misread', 'incomplete']}
              />
            ) : null}
            {quizError ? <div className="error-banner" role="alert">{quizError}</div> : null}
            <div className="quiz-feedback-actions">
              {tone === 'wrong' ? (
                <AskPipButton
                  context={{ kind: 'question', label: topic.name, question: String(q.text || '').trim(), answer: answers[q.id]?.text ?? answers[q.id], wrong: true }}
                  label="Ask Pip why"
                  className="btn"
                />
              ) : null}
              <button
                type="button"
                className="btn btn-go"
                disabled={busy}
                onClick={() => (last ? finishQuiz() : setCurrent((index) => index + 1))}
              >
                {busy ? 'Scoring…' : last ? 'Finish & score' : 'Next question'} {busy ? null : <Icon name="arrowRight" size={18} />}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const stages = [
    {
      id: 'watch',
      title: authored ? 'Watch & play' : 'Watch the talk-through',
      sub: authored ? 'A narrated explainer that zooms into real sentences and stops for you to answer.' : 'A narrated run through the skill, with an example to plan before the model is revealed.',
      content: ({ go }) => (
        <LessonExplainer topic={topic} subject="english" authored={authored} onDone={() => markStage('watch')} onNext={() => go('learn')} />
      ),
    },
    {
      id: 'learn',
      title: 'Learn the skill',
      sub: 'Frameworks, examples and exam moves. Plan your own answer before revealing each model.',
      content: <NotesDeck notes={topic.notes} english onSeen={() => markStage('learn')} />,
    },
    {
      id: 'practise',
      title: 'Practise',
      sub: inRound ? null : 'Real-bank questions. Short answers are checked instantly; longer ones get AQA-style feedback.',
      hideNav: inRound,
      content: practiseContent,
    },
    {
      id: 'master',
      title: 'Master it',
      sub: 'Stars come from your marked answers. Replay the practice to earn more.',
      content: (
        <>
          <MasteryPanel topic={topic} nextTopic={nextTopic} result={done} />
          <PipPromo text={`Ask Pip to walk you through ${topic.name.toLowerCase()} step by step.`} context={{ kind: 'lesson', label: topic.name }} />
          {topic.resources?.length ? (
            <section className="panel">
              <h2>Free external resources</h2>
              <p className="sub">More lessons and practice on this exact skill, all free.</p>
              <ResourceGrid resources={topic.resources} />
            </section>
          ) : null}
          <EditorialNote
            spec={`AQA 8700${topic.specRefs?.length ? ` · ${topic.specRefs.join(', ')}` : ''}`}
            reviewed={topic.reviewed}
            reviewer={topic.editorial?.reviewer}
            reportUrl={topic.editorial?.reportIssueUrl}
          />
        </>
      ),
    },
  ];

  return (
    <div className="page topic-page lesson-page english-lesson">
      <LessonFlow
        topic={topic}
        strand={topic.section}
        eyebrow={`${topic.sectionName} · AQA 8700`}
        backLabel="All skills"
        sub={`${topic.sectionName} · AQA 8700 revision${topic.accuracy != null ? ` · your accuracy so far: ${topic.accuracy}%` : ''}`}
        completed={topic.completed}
        stages={stages}
        stagesDone={stagesDone}
        pipContext={pipContext}
      />

      {celebration && done ? (
        <LessonComplete
          lessonName={topic.name}
          before={before}
          after={done.progress}
          onClose={() => setCelebration(false)}
          onPracticeAgain={() => {
            setCelebration(false);
            startQuiz();
          }}
          onChooseLesson={() => navigate('/learn')}
        />
      ) : null}
    </div>
  );
}
