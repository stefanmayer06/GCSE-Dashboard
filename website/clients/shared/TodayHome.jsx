import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader, useFocusMode } from './AppShell.jsx';
import { GrowthMeter, STARTERS, formName, useCreatures } from './creatures.jsx';
import { creatureForStep, masteryStage } from './next-step.js';
import { usePip } from './PipChat.jsx';
import { examMonthLabel, useStudyPlan } from './StudyTools.jsx';
import { dateKey, readiness } from './study.js';
import Critter from './circuit/Critter.jsx';
import IsoTile from './circuit/IsoTile.jsx';
import Icon from './circuit/Icon.jsx';
import Pip from './circuit/Pip.jsx';
import { strandInfo } from './circuit/palette.js';
import { critterById } from './critters.js';

// Today — the home tab, shared by Maths (Foundation + Higher) and English.
// It answers one question: what should I do now? One card with one button
// (and the creature that button grows), this week at a glance, and Pip.
// Everything else lives on its own tab. First-time learners get a short
// welcome (exam timing, first egg) and a day-one version of the screen.

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function daysUntil(examDate) {
  if (!examDate) return null;
  return Math.ceil((new Date(`${examDate}T12:00:00`) - new Date()) / 86400000);
}

function ExamLine({ examDate }) {
  const days = daysUntil(examDate);
  if (days == null) {
    return (
      <Link className="exam-line set" to="/me#exam">
        <Icon name="calendar" size={18} /> Set your exam date <Icon name="arrowRight" size={16} />
      </Link>
    );
  }
  const month = examMonthLabel(examDate);
  const text = days < 0 ? 'Exam date passed. Update it in Me'
    : days === 0 ? 'Exam today. Good luck!'
      : days > 365 ? `Exams ${month}`
        : `Exams in ${days} day${days === 1 ? '' : 's'} · ${month}`;
  return <p className="exam-line"><Icon name="calendar" size={18} /> {text}</p>;
}

function weekStates(plan) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const today = dateKey(now);
  const rows = plan?.days || [];
  return WEEKDAY_NAMES.map((name, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = dateKey(date);
    const row = rows.find((day) => day.date === key) || null;
    const state = row?.status === 'done' ? 'done' : row?.rest ? 'rest' : key === today ? 'today' : 'open';
    return { key, name, letter: WEEKDAY_LETTERS[index], state, row, isToday: key === today, missed: state === 'open' && key < today };
  });
}

function stateText(day) {
  if (day.state === 'done') return `${day.row?.task || 'Revision'} done`;
  if (day.state === 'rest') return 'rest day';
  if (day.missed) return day.row?.task ? `${day.row.task} not done` : 'no task';
  if (day.isToday) return day.row?.task ? `today: ${day.row.task}` : 'today';
  return day.row?.task || 'no task';
}

function WeekStrip({ plan }) {
  const days = weekStates(plan);
  return (
    <ol className="week-strip" aria-label="This week, Monday to Sunday">
      {days.map((day) => (
        <li key={day.key} className={`week-day ${day.state}${day.isToday ? ' is-today' : ''}${day.missed ? ' missed' : ''}`} aria-label={`${day.name}: ${stateText(day)}`}>
          <span className="week-dot" aria-hidden="true">
            {day.state === 'done' ? <Icon name="check" size={18} strokeWidth={3} />
              : day.state === 'rest' ? <Icon name="moon" size={16} />
                : day.isToday ? 'Today' : null}
          </span>
          <span className="week-letter" aria-hidden="true">{day.letter}</span>
        </li>
      ))}
    </ol>
  );
}

function TodayTask({ plan, topics, onStart }) {
  const today = dateKey();
  const day = plan?.days?.find((row) => row.date === today) || null;
  if (!day) return null;
  const topic = day.topicId ? topics.find((item) => item.id === day.topicId) : null;
  const strand = topic ? (topic.strand || topic.section) : null;
  const art = topic ? (
    <IsoTile topicId={topic.id} strand={strand} hue={strandInfo(strand).hue} state={day.status === 'done' ? 'done' : 'current'} stage={masteryStage(topic.accuracy, topic.answered).id} size={64} />
  ) : (
    <span className="today-task-icon" aria-hidden="true"><Icon name={day.rest ? 'moon' : day.task === 'Mistake retry' ? 'notebook' : 'practice'} size={26} /></span>
  );
  if (day.rest) {
    return (
      <div className="today-task rest">
        {art}
        <span className="today-task-copy">
          <span className="today-task-eyebrow">Today</span>
          <span className="today-task-name">Rest day</span>
          <span className="today-task-meta">Recovery is part of the plan. Your streak is safe.</span>
        </span>
      </div>
    );
  }
  if (day.status === 'done') {
    return (
      <div className="today-task done">
        {art}
        <span className="today-task-copy">
          <span className="today-task-eyebrow">Today</span>
          <span className="today-task-name">✓ {day.task} done</span>
          <span className="today-task-meta">{day.result ? `${day.result.percent}% (${day.result.correctMarks}/${day.result.totalMarks} marks). ` : ''}Come back tomorrow for the next one.</span>
        </span>
      </div>
    );
  }
  const href = day.topicId ? `/learn/${day.topicId}` : day.task === 'Mistake retry' ? '/notebook' : '/practice';
  return (
    <Link className="today-task" to={href} onClick={() => day.topicId && onStart(day.date, day.topicId)}>
      {art}
      <span className="today-task-copy">
        <span className="today-task-eyebrow">{day.topicId ? 'Today’s lesson' : 'Today'}</span>
        <span className="today-task-name">{day.task}</span>
        <span className="today-task-meta">{day.topicId ? `Watch, learn, practise · ${day.minutes || 15} min` : day.task === 'Mistake retry' ? 'Retry what is due · a few minutes' : `A short mixed set · ${day.minutes || 15} min`}</span>
      </span>
      <Icon name="chevronRight" size={22} />
    </Link>
  );
}

function FirstSteps() {
  const steps = [
    ['Do the check', '10 questions from across the course.'],
    ['Get your week', 'A short task for each day, built from your answers.'],
    ['Fix what you miss', 'Wrong answers come back after 1, 3, 7 and 21 days.'],
  ];
  return (
    <section className="first-steps" aria-labelledby="first-steps-title">
      <h2 id="first-steps-title" className="section-title">What happens next</h2>
      <ol>
        {steps.map(([title, copy], index) => (
          <li key={title} className={index === 0 ? 'current' : ''}>
            <span className="first-step-n" aria-hidden="true">{index + 1}</span>
            <span><b>{title}</b><span>{copy}</span></span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PartnerCard() {
  const { partner, rank } = useCreatures();
  if (!partner) return null;
  return (
    <section className="partner-card" aria-labelledby="partner-title">
      <Link to="/creatures" className="partner-card-art" aria-hidden="true" tabIndex={-1}>
        <Critter id={partner.id} tier={partner.tier} progress={partner.toNext} size={150} />
      </Link>
      <p className="eyebrow">Your partner</p>
      <h2 id="partner-title">{formName(partner)}</h2>
      <p className="sub">{rank.name} · grows from {partner.critter.track.toLowerCase()}</p>
      <GrowthMeter state={partner} />
      <Link className="btn small" to="/creatures">All creatures <Icon name="arrowRight" size={16} /></Link>
    </section>
  );
}

function welcomeKey(subject, userId) {
  return `gcse-welcome:${subject}:${encodeURIComponent(userId || 'guest')}`;
}

function welcomeDone(subject, userId) {
  try {
    return localStorage.getItem(welcomeKey(subject, userId)) === '1';
  } catch {
    return false;
  }
}

function markWelcomeDone(subject, userId) {
  try {
    localStorage.setItem(welcomeKey(subject, userId), '1');
  } catch {
    // Without storage the welcome can show again; nothing is lost.
  }
}

// The summer exam season for this school year and the next.
export function examSeasons(now = new Date()) {
  const first = now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
  return [
    { year: first, label: `Summer ${first}`, sub: 'Year 11', date: `${first}-05-15` },
    { year: first + 1, label: `Summer ${first + 1}`, sub: 'Year 10', date: `${first + 1}-05-15` },
  ];
}

const STARTER_COPY = {
  ember: { label: 'Streak', hatch: 'Hatches when you revise 3 days in a row' },
  quill: { label: 'Answers', hatch: 'Hatches after 25 marked answers' },
  tock: { label: 'Papers', hatch: 'Hatches after your first timed paper' },
};

function WelcomeFlow({ subject, userId, preferences, updatePreferences, needsEgg, onDone }) {
  useFocusMode(true);
  const { setPartner } = useCreatures();
  const [step, setStep] = useState(preferences.examDate ? 1 : 0);
  const [exam, setExam] = useState(preferences.examDate || '');
  const [custom, setCustom] = useState(false);
  const [egg, setEgg] = useState('quill');
  const seasons = examSeasons();
  const steps = needsEgg ? 2 : 1;

  function finish() {
    markWelcomeDone(subject, userId);
    onDone();
  }

  async function next() {
    if (exam && exam !== preferences.examDate) await updatePreferences({ examDate: exam });
    if (needsEgg) setStep(1);
    else finish();
  }

  const starter = critterById(egg);
  return (
    <div className="page welcome-page">
      <div className="welcome-top">
        <div className="welcome-progress" aria-label={`Step ${step + 1} of ${steps}`}>
          {Array.from({ length: steps }, (_, index) => <span key={index} className={index <= step ? 'on' : ''} />)}
        </div>
        <button type="button" className="link-button" onClick={finish}>Skip</button>
      </div>

      {step === 0 ? (
        <section className="welcome-step" aria-labelledby="welcome-exam">
          <h1 id="welcome-exam">When are your exams?</h1>
          <p className="sub">We use this to plan each week. You can change it any time in Me.</p>
          <div className="choice-grid" role="radiogroup" aria-labelledby="welcome-exam">
            {seasons.map((season) => (
              <button
                key={season.year}
                type="button"
                role="radio"
                aria-checked={!custom && exam === season.date}
                className={`choice-tile${!custom && exam === season.date ? ' on' : ''}`}
                onClick={() => { setCustom(false); setExam(season.date); }}
              >
                <b>{season.label}</b>
                <span>{season.sub}</span>
              </button>
            ))}
            <button
              type="button"
              role="radio"
              aria-checked={custom}
              className={`choice-tile${custom ? ' on' : ''}`}
              onClick={() => setCustom(true)}
            >
              <b>Pick a date</b>
              <span>Exact day</span>
            </button>
          </div>
          {custom ? (
            <label className="field">
              <span>Exam date</span>
              <input type="date" aria-label="Exam date" value={exam} onChange={(event) => setExam(event.target.value)} />
            </label>
          ) : exam ? (
            <p className="sub small">We’ll count down to mid-May {exam.slice(0, 4)}. Set the exact day in Me when you know it.</p>
          ) : null}
          <div className="welcome-actions">
            <button type="button" className="btn btn-go btn-block" onClick={next} disabled={!exam}>Continue</button>
          </div>
        </section>
      ) : (
        <section className="welcome-step" aria-labelledby="welcome-egg">
          <h1 id="welcome-egg">Pick your first egg</h1>
          <p className="sub">It becomes your study partner. Each egg hatches from a different kind of revision.</p>
          <div className="egg-picker" role="radiogroup" aria-labelledby="welcome-egg">
            {STARTERS.map((id) => {
              const critter = critterById(id);
              return (
                <button key={id} type="button" role="radio" aria-checked={egg === id} className={`egg-choice${egg === id ? ' on' : ''}`} onClick={() => setEgg(id)}>
                  <span className={`egg-choice-art egg-${id}`}><Critter id={id} tier={0} progress={0.35} size={92} /></span>
                  <b>{critter.family}</b>
                  <span>{STARTER_COPY[id].label}</span>
                </button>
              );
            })}
          </div>
          <div className="egg-detail" aria-live="polite">
            <h2>{starter.family} egg</h2>
            <p className="egg-detail-hatch">{STARTER_COPY[egg].hatch}</p>
            <p className="sub">{starter.lore}</p>
            <div className="egg-silhouettes" aria-label="Four forms to discover">
              {[1, 2, 3, 4].map((tier) => <Critter key={tier} id={egg} tier={tier} size={56} silhouette />)}
            </div>
          </div>
          <p className="sub small">The other five eggs are hidden around the app. Keep revising to find them.</p>
          <div className="welcome-actions">
            <button type="button" className="btn btn-go btn-block" onClick={() => { setPartner(egg); finish(); }}>Choose {starter.family}</button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function TodayHome({ subjectKey, progress = null, topics = [], nextStep = {}, userId = null, api = null }) {
  const { openPip } = usePip();
  const { byId, partner, partnerChosen } = useCreatures();
  const { personal, preferences, plan, error, updatePreferences, startMission } = useStudyPlan({ userId, subject: subjectKey, api, topics, progress });
  const [welcomeClosed, setWelcomeClosed] = useState(() => welcomeDone(subjectKey, userId));
  const step = nextStep.step;
  const studied = Boolean(progress && (progress.testsTaken > 0 || progress.practiceAnswered > 0));

  const showWelcome = Boolean(personal && progress) && !welcomeClosed && !studied && (!preferences.examDate || !partnerChosen);
  if (showWelcome) {
    return (
      <WelcomeFlow
        subject={subjectKey}
        userId={userId}
        preferences={preferences}
        updatePreferences={updatePreferences}
        needsEgg={!partnerChosen}
        onDone={() => setWelcomeClosed(true)}
      />
    );
  }

  const firstDay = step?.kind === 'diagnostic';
  const fedId = firstDay ? partner?.id : creatureForStep(step);
  const fed = fedId ? byId[fedId] : null;
  const dueCount = nextStep.dueCount || 0;
  const evidence = readiness(progress);

  return (
    <div className="page today-page">
      <AppHeader />
      <div className="today-head">
        <h1>{firstDay ? 'Welcome in' : greeting()}</h1>
        <ExamLine examDate={preferences.examDate || nextStep.examDate} />
      </div>
      {error ? <p className="plan-note error" role="alert">{error}</p> : null}

      <div className="today-grid">
        <div className="today-main">
          {step ? (
            <section className={`upnext-card kind-${step.kind}`} aria-labelledby="up-next-title">
              <div className="upnext-top">
                <div className="upnext-copy">
                  <p className="upnext-eyebrow">{step.eyebrow || 'Up next'}</p>
                  <h2 id="up-next-title">{step.title}</h2>
                  <p className="upnext-detail">{step.detail}</p>
                </div>
                {fed ? (
                  <span className="upnext-creature" aria-hidden="true">
                    <Critter id={fed.id} tier={fed.tier} progress={fed.toNext} size={112} />
                  </span>
                ) : null}
              </div>
              <Link className="btn btn-go upnext-go" to={step.href}>
                {step.cta || 'Continue'} <Icon name="arrowRight" size={18} />
              </Link>
              {fed ? <GrowthMeter state={fed} light /> : null}
              {dueCount > 0 && step.kind !== 'retry' ? (
                <Link className="upnext-also" to="/notebook">
                  <Icon name="notebook" size={16} /> {dueCount === 1 ? '1 retry due' : `${dueCount} retries due`}
                </Link>
              ) : null}
            </section>
          ) : (
            <div className="upnext-card skeleton-block" role="status" aria-label="Loading your next step" />
          )}

          {firstDay ? (
            <FirstSteps />
          ) : (
            <section className="week-card" aria-labelledby="week-title">
              <div className="section-head">
                <h2 id="week-title" className="section-title">This week</h2>
                <span className="section-meta">
                  {plan?.days?.length
                    ? `${plan.days.filter((day) => day.status === 'done').length} of ${plan.days.filter((day) => !day.rest).length} days done`
                    : ''}
                </span>
              </div>
              <WeekStrip plan={plan} />
              <TodayTask plan={plan} topics={topics} onStart={startMission} />
            </section>
          )}

          <button type="button" className="pip-row" onClick={() => openPip()}>
            <Pip mood="happy" size={40} />
            <span>Stuck on homework? Ask Pip</span>
            <Icon name="chevronRight" size={20} />
          </button>
        </div>

        <aside className="today-side" aria-label="Your partner and exam">
          <PartnerCard />
          <section className="exam-card" aria-labelledby="exam-card-title">
            <p className="eyebrow">Your exams</p>
            <h2 id="exam-card-title">
              {daysUntil(preferences.examDate) == null ? 'No date yet'
                : daysUntil(preferences.examDate) > 365 ? examMonthLabel(preferences.examDate)
                  : `${Math.max(0, daysUntil(preferences.examDate))} days`}
            </h2>
            <p className="sub">{evidence.ready ? `Readiness ${evidence.score}% from ${evidence.answered} marked answers.` : `Readiness appears after 20 marked answers across 3 topics (${evidence.answered} so far).`}</p>
            <div className="exam-card-links">
              <Link to="/me#exam">Exam date and rest days</Link>
              <Link to="/summary">Weekly summary</Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
