import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, SUBJECT } from '../api.js';
import { invalidateResources, preloadResource, useResource } from '../../../shared/resource-cache.js';
import LessonVisual from '../components/LessonVisual.jsx';
import MathsQuestion from '../components/MathsQuestion.jsx';
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
  QuizFeedback,
  QuizProgress,
  QuizStart,
  ResourceGrid,
  WhyChips,
  useStages,
} from '../../../shared/LessonKit.jsx';
import { AskPipButton } from '../../../shared/PipChat.jsx';
import { explainerForTopic } from '../../../shared/explainer/library/maths/index.js';
import Icon from '../../../shared/circuit/Icon.jsx';

const topicKey = (userId, topicId) => `topic:${SUBJECT}:${userId}:${topicId}`;
const QUIZ_SIZE = 5;

// Loads the lesson behind the sign-in splash when it is the landing page.
export function preload({ userId, params }) {
  return preloadResource(topicKey(userId, params.topicId), () => api.topic(params.topicId));
}

function questionText(q) {
  return String(q?.text || '').trim();
}

export default function Topic({ onProgress, userId, progress = null }) {
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
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [whys, setWhys] = useState({});
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState(null);
  const [before, setBefore] = useState(null);
  const [celebration, setCelebration] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [combo, setCombo] = useState(0);
  const [stagesDone, markStage] = useStages(topicId);
  const { data: catalog } = useResource(userId ? `topics:${subject}:${userId}` : null, () => api.topics());
  const topic = topicOverride && topicOverride.topicId === topicId ? topicOverride.value : fetchedTopic;
  // An evolution earned by this round waits while it is scored and while
  // the lesson-complete card is open, then plays.
  useHoldEvolutions(busy || (celebration && Boolean(done)));

  useEffect(() => {
    setTopicOverride(null);
    setQuiz(null);
    setSessionId(null);
    setCurrent(0);
    setAnswers({});
    setFeedback({});
    setWhys({});
    setDone(null);
    setCelebration(false);
    setCombo(0);
  }, [topicId]);

  // A new question takes focus (not its input, so phones keep the
  // keyboard down until the learner taps in).
  useEffect(() => {
    if (!quiz || done) return;
    const card = document.querySelector('.quiz-flow .quiz-q');
    card?.focus({ preventScroll: true });
    card?.scrollIntoView?.({ block: 'nearest' });
  }, [current, quiz, done]);

  // Remember the last lesson per subject.
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
      const q = await api.practice(topicId, QUIZ_SIZE);
      setQuiz(q.questions);
      setSessionId(q.sessionId);
      setCurrent(0);
      setAnswers({});
      setFeedback({});
      setWhys({});
      setDone(null);
      setCelebration(false);
      setBefore(progress);
    } catch (e) {
      setQuizError(e.message || 'Could not start practice. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function checkOne(qid, value) {
    setChecking(true);
    setQuizError('');
    try {
      const res = await api.check(qid, value);
      setFeedback((f) => ({ ...f, [qid]: res }));
      setCombo((streak) => (res.correct ? streak + 1 : 0));
    } catch (e) {
      setQuizError(e.message || 'Could not check that answer. Try again.');
    } finally {
      setChecking(false);
    }
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
          await recordLessonResult(api, userId, subject, topicId, topic?.name, res, answers, { errorTypes: whys });
        } catch (error) {
          console.error('[personal] lesson result could not be saved', error);
          setQuizError(error.personalDomain === 'mistakes'
            ? 'Today’s task is complete, but missed questions could not be added to your notebook.'
            : 'Your score was recorded, but today’s task could not be updated. Go back to Today and try again.');
        }
      }
      setDone({ correct: res.correctMarks, total: res.totalMarks, progress: res.progress });
      markStage('practise');
      invalidateResources(`topic:${subject}:${userId}:${topicId}`);
      invalidateResources(`topics:${subject}:${userId}`);
      if (res.reward?.firstCompletion) {
        setTopicOverride({ topicId, value: { ...(topicOverride?.value ?? fetchedTopic), completed: true } });
        setCelebration(true);
      }
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
  const tierName = higherTier ? 'Higher' : 'Foundation';
  const q = quiz?.[current] || null;
  const fb = q ? feedback[q.id] : null;
  const answer = q ? answers[q.id] : null;
  const last = quiz ? current === quiz.length - 1 : false;
  const inRound = Boolean(quiz) && !done;
  const pipContext = q && !done
    ? { kind: 'question', label: topic.name, question: questionText(q), answer: fb ? answer : null, wrong: fb ? !fb.correct : false }
    : { kind: 'lesson', label: topic.name };

  function nextQuestion() {
    if (last) finishQuiz();
    else setCurrent((index) => index + 1);
  }

  function practiseContent() {
    if (!quiz) {
      return (
        <QuizStart
          count={QUIZ_SIZE}
          title="Quick practice"
          detail="Five questions on this topic, one at a time. Each one is marked straight away with the worked method. Misses go to your notebook for a retry."
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
          right={quiz.filter((item) => feedback[item.id]?.correct).length}
          questions={quiz.length}
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
        <QuizProgress total={quiz.length} index={current} results={quiz.map((item) => feedback[item.id]?.correct)} combo={combo} />
        <div key={`${sessionId}:${q.id}`} className={`quiz-q ${fb ? (fb.correct ? 'right' : 'wrong') : ''}`} tabIndex={-1} role="group" aria-label={`Question ${current + 1} of ${quiz.length}`}>
          <div className="quiz-q-meta">
            <span>Q{current + 1}</span>
            <span>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
          </div>
          <MathsQuestion
            q={q}
            value={answer}
            index={current}
            disabled={Boolean(fb)}
            onChange={(value) => setAnswers((a) => ({ ...a, [q.id]: value }))}
            onSubmit={() => checkOne(q.id, answer)}
          />

          {!fb ? (
            <div className="quiz-actions">
              {q.hint ? (
                <details className="quiz-hint">
                  <summary><Icon name="bulb" size={16} /> Hint</summary>
                  <p>{q.hint}</p>
                </details>
              ) : null}
              {quizError ? <div className="error-banner" role="alert">{quizError}</div> : null}
              <button
                type="button"
                className="btn btn-go btn-block quiz-check"
                disabled={checking || answer == null || answer === ''}
                onClick={() => checkOne(q.id, answer)}
              >
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
            onNext={nextQuestion}
            busy={busy}
            extra={fb.correct ? null : (
              <AskPipButton
                context={{ kind: 'question', label: topic.name, question: questionText(q), answer, wrong: true }}
                label="Ask Pip why"
                className="btn"
              />
            )}
          >
            <p className="quiz-feedback-answer">Answer: <b>{fb.answerText}</b></p>
            {fb.solution?.length ? (
              <details className="quiz-method" open={!fb.correct}>
                <summary>Worked method</summary>
                <div className="review-sol">
                  {fb.solution.map((step, j) => <div key={j} className="sol-step">{step}</div>)}
                </div>
              </details>
            ) : null}
            {fb.correct ? null : (
              <WhyChips value={whys[q.id] || null} onChange={(type) => setWhys((map) => ({ ...map, [q.id]: type }))} />
            )}
            {quizError ? <div className="error-banner" role="alert">{quizError}</div> : null}
          </QuizFeedback>
        ) : null}
      </div>
    );
  }

  const stages = [
    {
      id: 'watch',
      title: authored ? 'Watch & play' : 'Watch the talk-through',
      sub: authored ? 'A narrated explainer that stops for you to answer. Pause any time and play with the board.' : 'A narrated run through the notes, with a worked example to try before the reveal.',
      content: ({ go }) => (
        <LessonExplainer topic={topic} subject={subject} authored={authored} onDone={() => markStage('watch')} onNext={() => go('learn')} />
      ),
    },
    {
      id: 'learn',
      title: 'Learn the notes',
      sub: 'Bite-size cards. Try every worked example before you reveal it.',
      content: (
        <NotesDeck
          notes={topic.notes}
          visual={<LessonVisual key={topicId} topicId={topicId} />}
          onSeen={() => markStage('learn')}
        />
      ),
    },
    {
      id: 'practise',
      title: 'Practise',
      sub: inRound ? null : 'Five questions, marked instantly with worked solutions.',
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
          <PipPromo text={`Ask Pip to explain ${topic.name} your way, one step at a time.`} context={{ kind: 'lesson', label: topic.name }} />
          {topic.resources?.length ? (
            <section className="panel">
              <h2>Free external resources</h2>
              <p className="sub">More lessons and practice on this exact topic, all free.</p>
              <ResourceGrid resources={topic.resources} />
            </section>
          ) : null}
          <EditorialNote
            spec={`AQA 8300${higherTier ? 'H' : ''}${topic.specSection ? ` · spec section ${topic.specSection} ${topic.specArea}` : ''}`}
            reviewed={topic.reviewed}
            reviewer={topic.editorial?.reviewer}
            reportUrl={topic.editorial?.reportIssueUrl}
          />
        </>
      ),
    },
  ];

  return (
    <div className="page topic-page lesson-page">
      <LessonFlow
        topic={topic}
        strand={topic.strand}
        eyebrow={`${topic.strandName} · ${tierName}`}
        sub={`${topic.strandName} · AQA 8300 ${tierName} revision${topic.accuracy != null ? ` · your accuracy so far: ${topic.accuracy}%` : ''}`}
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
