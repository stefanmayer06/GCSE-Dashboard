import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invalidateResources, useResource } from './resource-cache.js';
import {
  classifyMistake,
  dueMistakeRows,
  ERROR_TYPES,
  errorTypeCounts,
  GRADES,
  gradeMistakeRow,
  hydratePersonal,
  markWarmupDone,
  masteredSince,
  memriDueRows,
  PERSONAL_UPDATED_EVENT,
  saveCorrection,
  startPlanDayInState,
  touchMistakeRows,
} from './study-personal.js';
import { buildWeekPlan, dateKey, fixupEnglishPlan, fixupTargets, movePlanDay, priorityTopics, readiness } from './study.js';

const defaultPreferences = { examDate: '', targetGrade: '', passMode: 'balanced', restDays: [], minutesPerDay: null };
const planMinutesDefault = (subject) => (subject === 'english' ? 20 : 15);
const DAY = 86400000;
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FIXUP_KEY = (subject) => `gcse-fixup:${subject}`;

// Shared, cached personal-data hydration for the dashboard, notebook and
// weekly summary. The first component to need it fetches once; every other
// page reuses the cached response instantly and revalidates in the background.
function usePersonal(userId, subject, api) {
  const { data: fetched, error: loadError, refresh } = useResource(
    userId && subject ? `personal:${userId}:${subject}` : null,
    () => hydratePersonal(api, userId, subject),
  );
  const [override, setOverride] = useState(null);
  useEffect(() => {
    setOverride(null);
  }, [fetched]);
  return {
    fetched,
    personal: override ?? fetched,
    loadError,
    refresh,
    setOverride,
  };
}

function formatDate(iso) {
  const at = Date.parse(iso);
  return Number.isFinite(at) ? new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
}

// A far-off exam date (or a placeholder year) must never read as an absurd
// day count — the month plus "plenty of runway" is the honest message.
function examMonthLabel(dateStr) {
  const at = Date.parse(dateStr ? `${dateStr}T12:00:00` : '');
  return Number.isFinite(at) ? new Date(at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : null;
}

function planHeadline(days, examDate) {
  if (days == null) return 'Set your exam date';
  if (days < 0) return 'Exam date passed';
  if (days > 365) {
    const month = examMonthLabel(examDate);
    return month ? `Exams ${month}` : 'Exam date set';
  }
  return `${days} day${days === 1 ? '' : 's'} to go`;
}

// One return ping per local calendar day, deduplicated in localStorage
// (see ANALYTICS.md: week_return feeds the retention model).
function noteReturn(api, userId, subject) {
  try {
    const key = `gcse-${encodeURIComponent(userId || 'anonymous')}-${subject}-week-return-noted:${dateKey()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    api.track?.('week_return');
  } catch { /* bookkeeping only */ }
}

/* ---------------- Onboarding: exam date, target, diagnostic ---------------- */

export function Onboarding({ personal, progress, preferences, updatePreferences, diagnosticUrl, foundation = false }) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !personal) return null;
  const existingStudy = progress && (progress.testsTaken > 0 || progress.practiceAnswered > 0);
  if (preferences.examDate || existingStudy) return null;

  const grades = foundation ? ['4', '5'] : ['4', '5', '6', '7', '8', '9'];
  const steps = [
    {
      title: 'When are your exams?',
      body: 'We’ll use your exam date to plan what to revise each week.',
      control: (
        <input
          aria-label="Exam date"
          type="date"
          value={preferences.examDate}
          onChange={(e) => updatePreferences({ examDate: e.target.value })}
        />
      ),
      canNext: Boolean(preferences.examDate),
    },
    {
      title: 'What grade are you aiming for?',
      body: 'This helps us choose the right topics for you. You can change it later.',
      control: (
        <div className="chip-row">
          {grades.map((grade) => (
            <button
              key={grade}
              type="button"
              className={`suggest-chip source ${preferences.targetGrade === grade ? 'on' : ''}`}
              onClick={() => updatePreferences({ targetGrade: grade })}
            >
              Grade {grade}
            </button>
          ))}
        </div>
      ),
      canNext: true,
      canSkip: true,
    },
    {
      title: 'Take the 10-question diagnostic',
      body: 'It takes about 10 minutes and helps us choose what you should revise first.',
      control: null,
      canNext: false,
    },
  ];
  const current = steps[step];

  return (
    <section className="panel onboarding-card" aria-label="Set up your revision">
      <div className="eyebrow">Getting started · {step + 1} of {steps.length}</div>
      <h2>{current.title}</h2>
      <p className="sub">{current.body}</p>
      {current.control && <div className="onboarding-control">{current.control}</div>}
      <div className="study-actions" role="group" aria-label={`Setup step ${step + 1} of ${steps.length}`}>
        {step > 0 && <button type="button" className="btn" onClick={() => setStep(step - 1)}>Back</button>}
        {step === 1 && <button type="button" className="btn" onClick={() => setStep(step + 1)}>Skip for now</button>}
        {current.canNext && step < steps.length - 1 && (
          <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>Continue →</button>
        )}
        {step === steps.length - 1 && (
          <>
            <Link
              className="btn btn-primary"
              to={diagnosticUrl}
              onClick={() => { setDismissed(true); api.track?.('onboarding_complete', { withExamDate: Boolean(preferences.examDate), targetGrade: preferences.targetGrade || null }); }}
            >Start my diagnostic →</Link>
            <button type="button" className="btn" onClick={() => setDismissed(true)}>I&apos;ll do it later</button>
          </>
        )}
      </div>
      <p className="sub small">Your choices are saved to your account. You can take the diagnostic later from Practice.</p>
    </section>
  );
}

/* ---------------- Dashboard: mission, readiness, plan, notebook ---------------- */

export function StudyDashboard({ userId, subject, topics, progress, diagnosticUrl, foundation = false, api }) {
  const { fetched, personal, loadError, refresh: refreshPersonal, setOverride } = usePersonal(userId, subject, api);
  const [saveError, setSaveError] = useState('');
  const [moveFrom, setMoveFrom] = useState(null);
  const error = [loadError && `Could not load your saved study data: ${loadError}`, saveError].filter(Boolean).join(' ');
  const evidence = readiness(progress);
  const preferences = personal?.preferences ?? defaultPreferences;
  const passMode = foundation && preferences.passMode === 'foundation-pass';
  const priority = priorityTopics(topics, progress, passMode);

  useEffect(() => {
    const onPersonalUpdated = (event) => {
      if (event.detail?.userId === userId && event.detail?.subject === subject) refreshPersonal();
    };
    noteReturn(api, userId, subject);
    window.addEventListener(PERSONAL_UPDATED_EVENT, onPersonalUpdated);
    return () => window.removeEventListener(PERSONAL_UPDATED_EVENT, onPersonalUpdated);
  }, [api, userId, subject, refreshPersonal]);

  useEffect(() => {
    if (!personal || !topics.length) return;
    // The plan covers Monday to Sunday; a fresh week is built the first time
    // the saved plan has no row for today (new account or Monday rollover).
    if (personal.plan?.days.some((day) => day.date === dateKey())) return;
    persistPlan(buildWeekPlan(priority, subject, passMode, undefined, [], preferences));
    // Seed a first plan once topics are available; the plan stays stable for the whole day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal, topics.length, foundation]);

  const plan = personal?.plan ?? null;
  const today = dateKey();
  const todayDay = plan?.days.find((day) => day.date === today) || null;
  const isRestDay = todayDay?.rest === true;
  const mission = todayDay && todayDay.status === 'todo' && !todayDay.rest ? todayDay : null;
  const todayDone = todayDay && todayDay.status === 'done' ? todayDay : null;
  const doneCount = plan?.days.filter((day) => day.status === 'done').length || 0;
  const days = preferences.examDate ? Math.ceil((new Date(`${preferences.examDate}T12:00:00`) - new Date()) / 86400000) : null;
  const mistakes = personal?.mistakes ?? [];
  const dueCount = dueMistakeRows(mistakes).length;
  const masteredWeek = masteredSince(mistakes).length;

  function updatePreferences(patch) {
    const next = { ...preferences, ...patch };
    setOverride((current) => ({ ...(current ?? fetched), preferences: next }));
    api.savePreferences(next)
      .then(() => refreshPersonal())
      .catch((cause) => setSaveError(`Preferences could not be saved: ${cause.message}`));
  }

  function persistPlan(next) {
    setOverride((current) => ({ ...(current ?? fetched), plan: next }));
    api.savePlan(next)
      .then(() => refreshPersonal())
      .catch((cause) => setSaveError(`Plan could not be saved: ${cause.message}`));
  }

  function startMission(date, topicId) {
    const next = startPlanDayInState(plan, date, topicId);
    if (next) {
      persistPlan(next);
      api.track?.('mission_start', { topicId: topicId ?? null });
    }
  }

  return (
    <>
      <Onboarding
        personal={personal}
        progress={progress}
        preferences={preferences}
        updatePreferences={updatePreferences}
        diagnosticUrl={diagnosticUrl}
        foundation={foundation}
      />
      <section className="study-grid" aria-label="Revision planner">
        <div className={`panel mission-card${todayDone ? ' mission-done' : ''}`}>
          <div className="eyebrow">Today&apos;s revision</div>
          <h2>{isRestDay && !todayDone ? 'Rest day' : mission ? mission.task : todayDone ? `✓ ${todayDone.task} done` : doneCount === 7 ? 'You’re done for the week' : 'Choose what to revise'}</h2>
          <p className="sub">{isRestDay && !todayDone ? 'Today is a planned rest day. You can reread one saved note or take the day off.' : mission ? (mission.topicId ? `Spend ${mission.minutes} minutes on the lesson, then try the short practice.` : mission.task === 'Mistake retry' ? 'Retry the questions due today, then you’re done.' : 'Choose a short set of questions from Practice.') : todayDone ? (todayDone.result ? `You scored ${todayDone.result.percent}% (${todayDone.result.correctMarks}/${todayDone.result.totalMarks} marks)${todayDone.result.xpEarned != null ? ` and earned ${todayDone.result.xpEarned} XP` : ''}. Come back tomorrow for your next task.` : 'Come back tomorrow for your next task.') : doneCount === 7 ? 'You’ve finished this week’s plan. The next one starts on Monday.' : 'Choose today’s task from the plan below.'}</p>
          <div className="study-actions">
            {mission?.topicId && <Link className="btn btn-primary" to={`/learn/${mission.topicId}`} onClick={() => startMission(mission.date, mission.topicId)}>Start today&apos;s revision</Link>}
            {mission && !mission.topicId && <Link className="btn btn-primary" to={mission.task === 'Mistake retry' ? '/notebook' : '/practice'}>Open {mission.task}</Link>}
            {!isRestDay && <FixUpButton subject={subject} api={api} topics={topics} progress={progress} personal={personal} />}
            <Link className="btn" to={diagnosticUrl}>Fast diagnostic · 10 questions</Link>
          </div>
        </div>
        <div className="panel readiness-card">
          <div className="eyebrow">Readiness score</div>
          <div className="readiness-number">{evidence.ready ? `${evidence.score}%` : 'More answers needed'}</div>
          <p className="sub">{evidence.ready ? `Based on ${evidence.answered} marked answers across ${evidence.topics} topics.` : `Answer 20 questions across 3 topics to see your score. So far, you’ve answered ${evidence.answered} across ${evidence.topics} topics.`}</p>
          {progress?.streakFreezes > 0 && (
            <p className="sub small freeze-note">
              You have {progress.streakFreezes} streak freeze{progress.streakFreezes === 1 ? '' : 's'}. One freeze protects your {progress?.streak ?? 0}-day streak if you miss a day.
            </p>
          )}
        </div>
        <div className="panel plan-card">
          <div className="plan-head"><div><div className="eyebrow">Exam plan</div><h2>{planHeadline(days, preferences.examDate)}</h2></div><input aria-label="Exam date" type="date" value={preferences.examDate} onChange={(e) => updatePreferences({ examDate: e.target.value })} /></div>
          {foundation && <label className="pass-toggle"><input type="checkbox" checked={preferences.passMode === 'foundation-pass'} onChange={(e) => updatePreferences({ passMode: e.target.checked ? 'foundation-pass' : 'balanced' })} /><span><strong>Pass mode · grade 4 goal</strong><small>Prioritise core and weak Foundation topics.</small></span></label>}
          <div className="plan-flex">
            <div className="plan-rest" role="group" aria-label="Rest days each week">
              <span className="adhoc-label">Rest days</span>
              <div className="chip-row">
                {WEEKDAYS.map((label, index) => {
                  const on = (preferences.restDays || []).includes(index);
                  return (
                    <button
                      key={index}
                      type="button"
                      className={`suggest-chip source${on ? ' on' : ''}`}
                      aria-pressed={on}
                      title={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]}
                      onClick={() => {
                        const current = preferences.restDays || [];
                        const next = on ? current.filter((d) => d !== index) : [...current, index].sort((a, b) => a - b);
                        updatePreferences({ restDays: next });
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="plan-minutes">
              <span className="adhoc-label">Minutes a day</span>
              <span className="minutes-stepper">
                <button type="button" className="btn small" aria-label="Fewer minutes per day" onClick={() => updatePreferences({ minutesPerDay: Math.max(5, (preferences.minutesPerDay ?? planMinutesDefault(subject)) - 5) })}>−</button>
                <strong aria-live="polite">{preferences.minutesPerDay ?? planMinutesDefault(subject)} min</strong>
                <button type="button" className="btn small" aria-label="More minutes per day" onClick={() => updatePreferences({ minutesPerDay: Math.min(120, (preferences.minutesPerDay ?? planMinutesDefault(subject)) + 5) })}>+</button>
              </span>
            </label>
          </div>
          <div className="week-plan">{!personal ? <p className="empty">Loading your plan…</p> : plan?.days.length ? plan.days.map((day) => { const done = day.status === 'done'; const past = !done && day.date < today; const canStart = !done && !past && day.topicId && day.date === today; const locked = !done && !canStart && !past; const rest = day.rest === true; const moveable = !done && !past && !rest && day.date !== today; if (rest) return (<span key={day.date} className={past ? 'past' : 'rest-day'} title="Planned rest — recovery is part of the plan"><b>{day.label}</b><span>Rest day</span>{past ? <small>Rested</small> : <small>Recovery</small>}</span>); if (moveFrom && moveable && moveFrom !== day.date) return (<button key={day.date} type="button" className="move-target" onClick={() => { const next = movePlanDay(plan, moveFrom, day.date, today); setMoveFrom(null); if (next) persistPlan(next); }}><b>{day.label}</b><span>{day.task}</span><small>Move here</small></button>); return (done ? <Link key={day.date} to={day.topicId ? `/learn/${day.topicId}` : '/practice'} className="done" title={day.result ? `Done: ${day.result.percent}% · ${day.result.correctMarks}/${day.result.totalMarks} marks` : undefined}><b>✓ {day.label}</b><span>{day.task}</span>{day.result ? <small>{day.result.percent}%{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''}</small> : null}</Link> : canStart ? <Link key={day.date} to={`/learn/${day.topicId}`} onClick={() => startMission(day.date, day.topicId)} title="Today's mission"><b>{day.label}</b><span>{day.task}</span><small>Start ★</small></Link> : <span key={day.date} className={past ? 'past' : 'locked'} title={past ? 'That day has passed — the trail pauses, it never punishes' : 'Completes when a new day starts'}><b>{day.label}</b><span>{day.task}</span>{past ? <small>Paused</small> : locked ? <small>Locked</small> : null}{moveable && (moveFrom === day.date ? <button type="button" className="link link-button" onClick={() => setMoveFrom(null)}>Cancel move</button> : <button type="button" className="link link-button" onClick={() => setMoveFrom(day.date)}>Move</button>)}</span>); }) : <p className="empty">Complete a lesson to build your 7-day plan.</p>}</div>
          {plan?.days?.length ? (
            <div className="week-track" role="img" aria-label={`${doneCount} of 7 days done this week`}>
              {plan.days.map((day) => (
                <i key={day.date} className={day.status === 'done' ? 'done' : day.date === today ? 'today' : ''} />
              ))}
            </div>
          ) : null}
          {error && <p className="plan-note error" role="alert">{error}</p>}
          <p className="plan-note">You’ve completed {doneCount} of 7 days this week. Your next plan starts on Monday.</p>
        </div>
      </section>
      <section className="evidence-strip" aria-label="Mistake notebook progress">
        <Link to="/notebook" className={`evidence-chip ${dueCount ? 'due' : ''}`}>
          <b>{dueCount}</b>
          <span>{dueCount === 1 ? 'mistake due for retry' : 'mistakes due for retry'}</span>
        </Link>
        <Link to="/notebook" className="evidence-chip mastered">
          <b>{masteredWeek}</b>
          <span>mastered in the last 7 days</span>
        </Link>
        <Link to="/summary" className="evidence-chip">
          <b>{days == null || days < 0 ? '—' : days > 365 ? (examMonthLabel(preferences.examDate) || '—') : days}</b>
          <span>{days != null && days > 0 && days <= 365 ? 'days until your exam' : days != null && days > 365 ? 'your exam month' : 'days until your exam'}</span>
        </Link>
      </section>
    </>
  );
}

/* ---------------- Fix-Up 5 + memory checks ---------------- */

export function readFixupPayload(subject) {
  try {
    const raw = localStorage.getItem(FIXUP_KEY(subject));
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object') return null;
    return payload;
  } catch {
    return null;
  }
}

function clearFixupPayload(subject) {
  try { localStorage.removeItem(FIXUP_KEY(subject)); } catch {}
}

// One-tap repair set: five questions drawn from due mistakes and weakest
// topics (Hegarty proved the Fix-Up-5 shape; ours targets with real data).
// English writing weaknesses can't be quick-fired, so they surface as lesson
// links beside the set instead of pretending otherwise.
export function FixUpButton({ subject, api, topics, progress, personal, mode = 'fixup', touchIds = null, className = 'btn btn-primary' }) {
  const navigate = useNavigate();
  const mistakes = personal?.mistakes ?? [];
  if (subject === 'english') {
    const plan = fixupEnglishPlan({ topics, progress, mistakes });
    if (!plan.skillIds.length) {
      return plan.lessons.length ? (
        <Link className="btn" to={`/learn/${plan.lessons[0]}`}>Review a writing skill</Link>
      ) : null;
    }
    const label = mode === 'memri' ? 'Start memory check' : 'Practise 5 weak areas';
    return (
      <>
        <button
          type="button"
          className={className}
          onClick={() => {
            try {
              localStorage.setItem(FIXUP_KEY(subject), JSON.stringify({ mode, count: 5, skillIds: plan.skillIds, kinds: plan.kinds, touchIds, at: Date.now() }));
            } catch {}
            api?.track?.(mode === 'memri' ? 'memri_start' : 'fixup_start', { skills: plan.skillIds });
            navigate(`/practice?${mode}=1#adhoc`);
          }}
        >
          {label}
        </button>
        {mode === 'fixup' && plan.lessons.map((id) => (
          <Link key={id} className="btn" to={`/learn/${id}`}>Study {id.replace(/-/g, ' ')}</Link>
        ))}
      </>
    );
  }
  const targets = fixupTargets({ topics, progress, mistakes });
  if (!targets.length) return null;
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        try {
          localStorage.setItem(FIXUP_KEY(subject), JSON.stringify({ mode, count: 5, topicIds: targets, touchIds, at: Date.now() }));
        } catch {}
        api?.track?.(mode === 'memri' ? 'memri_start' : 'fixup_start', { topics: targets });
        navigate(`/practice?${mode}=1#adhoc`);
      }}
    >
      {mode === 'memri' ? `Review ${targets.length} topic${targets.length === 1 ? '' : 's'}` : 'Practise 5 weak areas'}
    </button>
  );
}

// Memory check: mastered mistakes whose proof has faded get one mixed
// resurrection set instead of retiring forever.
export function MemRiCard({ userId, subject, api }) {
  const { personal } = usePersonal(userId, subject, api);
  if (!personal) return null;
  const due = memriDueRows(personal.mistakes ?? []);
  if (!due.length) return null;
  return (
    <section className="panel memri-card" aria-labelledby="memri-title">
      <div className="eyebrow">Memory refresh</div>
      <h2 id="memri-title">Try {due.length === 1 ? 'this question' : `these ${due.length} questions`} again</h2>
      <p className="sub">
        You last reviewed {due.slice(0, 3).map((row) => row.topicName).join(' · ')} over a month ago
        {due.length > 3 ? `, plus ${due.length - 3} more` : ''}. A quick check will help you remember them.
      </p>
      <div className="study-actions">
        <FixUpButton
          subject={subject}
          api={api}
          topics={[]}
          progress={null}
          personal={{ mistakes: due.map((row) => ({ ...row, mastered: false, dueDates: [new Date().toISOString()], reviewIndex: 0 })) }}
          mode="memri"
          touchIds={due.map((row) => row.id)}
        />
      </div>
    </section>
  );
}

/* ---------------- Notebook: classification, detail, warm-up, retry ---------------- */

function MistakeDetail({ row }) {
  const solution = Array.isArray(row.workedSolution) ? row.workedSolution : [];
  return (
    <div className="mistake-detail">
      <div className="mistake-facts">
        <div><small>Your answer</small><span>{row.answer === undefined || row.answer === null || row.answer === '' ? '(blank)' : String(row.answer)}</span></div>
        <div><small>Marks</small><span>{row.marks != null && row.maxMarks != null ? `${row.marks}/${row.maxMarks}` : '—'}</span></div>
        <div><small>Captured</small><span>{formatDate(row.capturedAt)}</span></div>
        <div><small>Next review</small><span>{row.dueDates?.[row.reviewIndex ?? 0] ? formatDate(row.dueDates[row.reviewIndex ?? 0]) : '—'}</span></div>
        <div><small>Retries done</small><span>{row.reviewIndex ?? 0}/4{row.lastReviewedAt ? ` · last ${formatDate(row.lastReviewedAt)}` : ''}</span></div>
        <div><small>Warm-ups done</small><span>{row.warmupCount ?? 0}</span></div>
      </div>
      {row.correctAnswer !== undefined && row.correctAnswer !== null && (
        <div className="mistake-answer">
          <small>Correct answer</small>
          <p>{String(row.correctAnswer)}</p>
        </div>
      )}
      {solution.length > 0 && (
        <div className="mistake-solution">
          <small>Worked method</small>
          {solution.map((step, index) => <div key={index} className="sol-step">{step}</div>)}
        </div>
      )}
    </div>
  );
}

function GradeChips({ row, onGrade }) {
  return (
    <div className="classify-row" role="group" aria-label="How did the retry go?">
      <small>Retried it? Grade your recall</small>
      <div className="chip-row">
        {GRADES.map((grade) => (
          <button
            key={grade.id}
            type="button"
            title={grade.hint}
            className={`suggest-chip source${row.lastGrade === grade.id ? ' on' : ''}`}
            onClick={() => onGrade(row, grade.id)}
          >
            {grade.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CorrectionBox({ row, onSave }) {
  const [draft, setDraft] = useState(row.correction || '');
  const [savedTick, setSavedTick] = useState(false);
  useEffect(() => {
    setDraft(row.correction || '');
    setSavedTick(false);
  }, [row.id, row.correction]);
  return (
    <div className="correction-row">
      <label htmlFor={`correction-${row.id}`}>
        <small>Write the correction in your own words</small>
      </label>
      <textarea
        id={`correction-${row.id}`}
        className="answer-area correction-input"
        rows={2}
        maxLength={500}
        placeholder="e.g. Cross-multiply first, then solve — I forgot the first step."
        value={draft}
        onChange={(e) => { setDraft(e.target.value); setSavedTick(false); }}
      />
      <div className="study-actions">
        <button
          type="button"
          className="btn small"
          disabled={!draft.trim() || draft.trim() === (row.correction || '')}
          onClick={() => { onSave(row.id, draft); setSavedTick(true); }}
        >
          {savedTick ? 'Correction saved ✓' : row.correction ? 'Update correction' : 'Save correction'}
        </button>
      </div>
    </div>
  );
}

function ClassificationChips({ row, onClassify }) {
  return (
    <div className="classify-row" role="group" aria-label="Why did you miss this?">
      <small>Why did you miss it?</small>
      <div className="chip-row">
        {ERROR_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            title={type.hint}
            className={`suggest-chip source ${row.errorType === type.id ? 'on' : ''}`}
            onClick={() => onClassify(row.id, type.id)}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Notebook({ userId, subject, api }) {
  const { fetched, personal, loadError, setOverride } = usePersonal(userId, subject, api);
  const [saveError, setSaveError] = useState('');
  const [open, setOpen] = useState({});
  const now = Date.now();
  const error = [loadError && `Could not load the notebook: ${loadError}`, saveError].filter(Boolean).join(' ');

  const rows = personal?.mistakes ?? [];
  const active = rows.filter((row) => !row.mastered)
    .sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)));
  const dueIds = new Set(dueMistakeRows(active, now).map((row) => row.id));
  const dueRows = active.filter((row) => dueIds.has(row.id));
  const upcoming = active.filter((row) => !dueIds.has(row.id));
  const masteredWeek = masteredSince(rows, 7 * DAY, now);
  const mix = errorTypeCounts(rows);
  const topReason = Object.entries(mix).sort((a, b) => b[1] - a[1])[0];
  const topReasonLabel = topReason ? ERROR_TYPES.find((type) => type.id === topReason[0])?.label : null;

  async function save(next, event, metadata) {
    setOverride((current) => ({ ...(current ?? fetched), mistakes: next }));
    try {
      await api.saveMistakes(next);
      if (event) api.track?.(event, metadata);
      invalidateResources('personal:');
    } catch (cause) {
      setSaveError(`Notebook could not be saved: ${cause.message}`);
    }
  }

  function reviewed(row, grade = 'good') {
    const next = gradeMistakeRow(row, grade);
    save(
      rows.map((r) => (r.id === row.id ? next : r)),
      'mistake_retry',
      { qid: row.qid, reviewIndex: next.reviewIndex ?? 0, grade },
    );
  }

  function classify(id, errorType) {
    save(classifyMistake(rows, id, errorType));
  }

  function saveRowCorrection(id, correction) {
    save(saveCorrection(rows, id, correction), 'mistake_corrected', { id });
  }

  function warmupDone(row) {
    save(markWarmupDone(rows, row.id));
  }

  const renderRow = (row, isDue) => {
    const expanded = open[row.id];
    const dueDate = row.dueDates?.[row.reviewIndex ?? 0];
    return (
      <article key={row.id} className={`notebook-row${expanded ? ' open' : ''}`}>
        <button type="button" className="notebook-main" onClick={() => setOpen((o) => ({ ...o, [row.id]: !o[row.id] }))} aria-expanded={expanded}>
          <span className={`due-chip ${isDue ? 'due' : ''}`}>{isDue ? 'Due now' : dueDate ? `Due ${formatDate(dueDate)}` : 'Scheduled'}</span>
          <span className="notebook-title">
            <h3>{row.topicName}</h3>
            <p>{row.prompt}</p>
            <small>
              {row.marks != null && row.maxMarks != null ? `Last mark: ${row.marks}/${row.maxMarks} · ` : ''}
              Retry {row.reviewIndex ?? 0}/4{row.errorType ? ` · ${ERROR_TYPES.find((type) => type.id === row.errorType)?.label}` : ''}{row.lastGrade ? ` · last try: ${row.lastGrade}` : ''}{row.correction ? ' · correction written' : ''}
            </small>
          </span>
          <span className="chev" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
        </button>
        {expanded && (
          <div className="notebook-body">
            <MistakeDetail row={row} />
            <ClassificationChips row={row} onClassify={classify} />
            <CorrectionBox row={row} onSave={saveRowCorrection} />
            <GradeChips row={row} onGrade={reviewed} />
            <div className="study-actions">
              {row.topicId && <Link className="btn btn-primary" to={`/learn/${row.topicId}`}>{row.warmupCount ? 'Micro-practice again' : 'Warm-up micro-practice'}</Link>}
              {row.topicId && <button type="button" className="btn" onClick={() => warmupDone(row)}>Warm-up done</button>}
            </div>
            <p className="sub small">
              {row.warmupCount
                ? 'Warm-up logged — grade the cold retry honestly: Again sees it tomorrow, Easy pushes it weeks out.'
                : 'Do the warm-up, retry the question from memory, then grade your recall.'}
            </p>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Mistake notebook</h1>
          <p className="sub">Questions you miss are saved here. Add what went wrong, write your correction and try them again when they’re due.</p>
        </div>
      </header>
      {error && <p className="plan-note error" role="alert">{error}</p>}
      <section className="stat-row">
        <div className={`stat-card${dueRows.length ? ' warn' : ''}`}><div className="stat-num">{dueRows.length}</div><div className="stat-label">Due for retry</div></div>
        <div className="stat-card"><div className="stat-num">{upcoming.length}</div><div className="stat-label">Scheduled</div></div>
        <div className={`stat-card${masteredWeek.length ? ' good' : ''}`}><div className="stat-num">{masteredWeek.length}</div><div className="stat-label">Mastered this week</div></div>
        <div className="stat-card"><div className="stat-num">{rows.filter((row) => row.mastered).length}</div><div className="stat-label">Mastered all-time</div></div>
      </section>
      {topReasonLabel && (
        <p className="sub notebook-insight">The reason you choose most often is <b>{topReasonLabel}</b>. {ERROR_TYPES.find((type) => type.id === topReason[0])?.hint}</p>
      )}
      <section className="panel notebook-list">
        <h2>Due now</h2>
        {!personal ? <p className="empty">Loading your notebook…</p>
          : dueRows.length ? (
            <>
              <div className="study-actions fixup-row">
                <FixUpButton subject={subject} api={api} topics={[]} progress={null} personal={{ mistakes: rows }} />
              </div>
              {dueRows.map((row) => renderRow(row, true))}
            </>
          )
            : (
              <div className="empty-state">
                <h3>Nothing due right now</h3>
                <p>You’re up to date. You can do five mixed questions while you wait for the next review.</p>
                <Link className="btn btn-primary" to="/practice#adhoc">Answer 5 mixed questions →</Link>
              </div>
            )}
      </section>
      <MemRiCard userId={userId} subject={subject} api={api} />
      {upcoming.length > 0 && (
        <section className="panel notebook-list">
          <h2>Coming up</h2>
          {upcoming.map((row) => renderRow(row, false))}
        </section>
      )}
      {rows.some((row) => row.mastered) && (
        <section className="panel notebook-list">
          <h2>Mastered</h2>
          {rows.filter((row) => row.mastered).slice(0, 12).map((row) => (
            <article key={row.id} className="notebook-row mastered">
              <div className="notebook-main">
                <span className="due-chip done">✓ Mastered</span>
                <span className="notebook-title">
                  <h3>{row.topicName}</h3>
                  <p>{row.prompt}</p>
                  <small>{row.lastReviewedAt ? `Proven ${formatDate(row.lastReviewedAt)}` : `Captured ${formatDate(row.capturedAt)}`} · {row.reviewIndex ?? 4}/4 retries</small>
                </span>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

/* ---------------- Results: post-paper triage ---------------- */

export function TriagePanel({ result, mistakesNote = null }) {
  const minutes = result.durationSec != null ? result.durationSec / 60 : null;
  const expected = result.minutes ?? (result.type === 'full' ? 90 : 45);
  const pace = minutes != null && expected ? Math.round((minutes / expected) * 100) : null;
  const lost = (result.strandAnalysis || result.skills || [])
    .map((row) => ({ name: row.name, lost: Math.max(0, (row.marks ?? row.max ?? 0) - (row.got ?? 0)), marks: row.marks ?? row.max ?? 0 }))
    .filter((row) => row.lost > 0)
    .sort((a, b) => b.lost - a.lost)
    .slice(0, 4);
  const totalLost = lost.reduce((sum, row) => sum + row.lost, 0);
  const wrongCount = (result.perQuestion || []).filter((q) => q.correct === false || (q.got != null && q.marks != null && q.got < q.marks)).length;

  return (
    <section className="panel triage-panel">
      <h2>What to work on next</h2>
      <p className="sub">
        {pace != null && pace > 110
          ? `You took about ${Math.round(pace)}% of the suggested time. Use the timing guide on your next paper.`
          : pace != null && pace < 75
            ? `You finished in about ${Math.round(pace)}% of the suggested time. Check the answers below in case you rushed them.`
            : 'Your timing looked good. Next, focus on the areas where you lost the most marks.'}
      </p>
      {totalLost > 0 && (
        <div className="triage-lost">
          {lost.map((row) => (
            <div key={row.name} className="bar-row">
              <div className="bar-head"><span>{row.name}</span><span>{row.lost} mark{row.lost === 1 ? '' : 's'} lost of {row.marks}</span></div>
              <div className="bar"><div className="bar-fill lost" style={{ width: `${Math.round((100 * row.lost) / Math.max(1, row.marks))}%` }} /></div>
            </div>
          ))}
        </div>
      )}
      <div className="study-actions">
        <Link className="btn btn-primary" to="/notebook">{wrongCount > 0 ? `Retry the ${wrongCount} missed question${wrongCount === 1 ? '' : 's'}` : 'Open mistake notebook'}</Link>
        <Link className="btn" to="/learn">Study the weakest topics</Link>
      </div>
      {mistakesNote && <p className="sub small">{mistakesNote}</p>}
    </section>
  );
}

/* ---------------- Weekly summary / evidence report ---------------- */

export function WeeklySummary({ userId, subject, progress, api, username }) {
  const { personal, loadError } = usePersonal(userId, subject, api);
  const error = loadError ? `Could not load your summary data: ${loadError}` : '';
  const evidence = readiness(progress);
  const now = Date.now();

  const preferences = personal?.preferences ?? defaultPreferences;
  const plan = personal?.plan ?? null;
  const rows = personal?.mistakes ?? [];
  const due = dueMistakeRows(rows, now).length;
  const masteredWeek = masteredSince(rows, 7 * DAY, now);
  const mix = errorTypeCounts(rows);
  const donePlan = plan?.days.filter((day) => day.status === 'done') || [];
  const activeRows = rows.filter((row) => !row.mastered);
  const evidenceRows = activeRows.slice(0, 8);

  return (
    <div className="page weekly-summary">
      <header className="page-head">
        <div>
          <div className="eyebrow">Your week in review</div>
          <h1>Weekly summary</h1>
          <p className="sub">
            {username ? `${username} · ` : ''}{subject === 'english' ? 'AQA GCSE English Language 8700' : subject === 'maths-higher' ? 'AQA GCSE Mathematics 8300 Higher' : 'AQA GCSE Mathematics 8300 Foundation'}
            {' · '}generated on {new Date().toLocaleDateString()}.
          </p>
        </div>
        <button className="btn btn-primary no-print" onClick={() => { api.track?.('evidence_report'); window.print(); }}>Print / export PDF</button>
      </header>
      {error && <p className="plan-note error" role="alert">{error}</p>}
      <section className="stat-row">
        <div className="stat-card"><div className="stat-num">{progress?.testsTaken ?? 0}</div><div className="stat-label">Papers completed</div></div>
        <div className="stat-card"><div className="stat-num">{progress?.practiceAnswered ?? 0}</div><div className="stat-label">Questions attempted</div></div>
        <div className="stat-card"><div className="stat-num">{evidence.ready ? `${evidence.score}%` : '—'}</div><div className="stat-label">Readiness accuracy</div></div>
        <div className={`stat-card${masteredWeek.length ? ' good' : ''}`}><div className="stat-num">{masteredWeek.length}</div><div className="stat-label">Mistakes mastered (7 days)</div></div>
        <div className={`stat-card${due > 0 ? ' warn' : ''}`}><div className="stat-num">{due}</div><div className="stat-label">Mistakes due</div></div>
      </section>
      <section className="panel">
        <h2>This week&apos;s exam plan</h2>
        {plan?.days.length ? <div className="week-plan">{plan.days.map((day) => { const done = day.status === 'done'; const past = !done && day.date < dateKey(); return (done ? <Link key={day.date} to={day.topicId ? `/learn/${day.topicId}` : '/practice'} className="done"><b>✓ {day.label}</b><span>{day.task}</span>{day.result ? <small>{day.result.percent}%{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''}</small> : null}</Link> : <span key={day.date} className={past ? 'past' : 'locked'}><b>{day.label}</b><span>{day.task}</span></span>); })}</div> : <p className="empty">Open the dashboard to build your 7-day plan.</p>}
          <p className="sub">You completed {donePlan.length} of 7 planned days this week.</p>
      </section>
      <section className="panel">
        <h2>Mistake review</h2>
        {rows.length ? (
          <>
            <p className="sub">
              You mastered {masteredWeek.length} mistake{masteredWeek.length === 1 ? '' : 's'} this week. You still have {activeRows.length} to review.
              {topReasonLabel(rows) ? ` Your most common reason was ${topReasonLabel(rows)}.` : ''}
            </p>
            {Object.keys(mix).length > 0 && (
              <div className="triage-lost">
                {ERROR_TYPES.filter((type) => mix[type.id]).map((type) => (
                  <div key={type.id} className="bar-row">
                    <div className="bar-head"><span>{type.label}</span><span>{mix[type.id]}</span></div>
                    <div className="bar"><div className="bar-fill" style={{ width: `${Math.min(100, Math.round((100 * mix[type.id]) / rows.length))}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
            <table className="bound-table evidence-table">
              <thead><tr><th>Mistake</th><th>Reason</th><th>Retries</th><th>Next review</th></tr></thead>
              <tbody>
                {evidenceRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.topicName}<small>{row.prompt.slice(0, 60)}{row.prompt.length > 60 ? '…' : ''}</small></td>
                    <td>{row.errorType ? ERROR_TYPES.find((type) => type.id === row.errorType)?.label : '—'}</td>
                    <td>{row.reviewIndex ?? 0}/4</td>
                    <td>{row.dueDates?.[row.reviewIndex ?? 0] ? formatDate(row.dueDates[row.reviewIndex ?? 0]) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : <p className="empty">Complete a marked paper or practice set to start your mistake notebook.</p>}
      </section>
      <section className="panel">
        <h2>What to do next</h2>
        <p>{preferences.passMode === 'foundation-pass' ? 'Keep working through the core Foundation topics in your plan.' : 'Check today’s plan on the dashboard and retry any questions that are due.'}</p>
        <p className="sub">This summary is based on your marked work.</p>
        <div className="evidence-signature no-print" aria-hidden="true">
          <span>Print or save this page as a PDF to share it with a teacher or parent.</span>
        </div>
      </section>
    </div>
  );
}

function topReasonLabel(rows) {
  const mix = errorTypeCounts(rows);
  const top = Object.entries(mix).sort((a, b) => b[1] - a[1])[0];
  return top ? ERROR_TYPES.find((type) => type.id === top[0])?.label ?? null : null;
}
