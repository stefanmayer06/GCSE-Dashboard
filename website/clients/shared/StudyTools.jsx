import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  advanceMistakeRows,
  classifyMistake,
  dueMistakeRows,
  ERROR_TYPES,
  errorTypeCounts,
  hydratePersonal,
  markWarmupDone,
  masteredSince,
  PERSONAL_UPDATED_EVENT,
  startPlanDayInState,
} from './study-personal.js';
import { buildWeekPlan, dateKey, priorityTopics, readiness } from './study.js';

const defaultPreferences = { examDate: '', targetGrade: '', passMode: 'balanced' };
const DAY = 86400000;

function formatDate(iso) {
  const at = Date.parse(iso);
  return Number.isFinite(at) ? new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '';
}

// One return ping per local calendar day, deduplicated in localStorage
// (see ANALYTICS.md: week_return feeds the retention model).
function noteReturn(api) {
  try {
    const key = `gcse-week-return-noted:${dateKey()}`;
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
      body: 'Your 7-day plan counts down to the real date and keeps the last week for full-paper practice.',
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
      body: 'Your target shapes which topics the plan prioritises. You can change it any time.',
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
      body: 'It samples every strand and sets your first week of missions. It takes about ten minutes.',
      control: null,
      canNext: false,
    },
  ];
  const current = steps[step];

  return (
    <section className="panel onboarding-card" aria-label="Set up your revision">
      <div className="eyebrow">Welcome · three quick steps</div>
      <h2>{current.title}</h2>
      <p className="sub">{current.body}</p>
      {current.control && <div className="onboarding-control">{current.control}</div>}
      <div className="study-actions">
        {step > 0 && <button type="button" className="btn" onClick={() => setStep(step - 1)}>Back</button>}
        {step === 1 && <button type="button" className="btn" onClick={() => setStep(step + 1)}>Skip for now</button>}
        {current.canNext && step < steps.length - 1 && (
          <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>Next</button>
        )}
        {step === steps.length - 1 && (
          <>
            <Link
              className="btn btn-primary"
              to={diagnosticUrl}
              onClick={() => { setDismissed(true); api.track?.('onboarding_complete', { withExamDate: Boolean(preferences.examDate), targetGrade: preferences.targetGrade || null }); }}
            >Start diagnostic</Link>
            <button type="button" className="btn" onClick={() => setDismissed(true)}>I&apos;ll do it later</button>
          </>
        )}
      </div>
      <p className="sub small">Step {step + 1} of {steps.length} · saved to your account, not shared with anyone.</p>
    </section>
  );
}

/* ---------------- Dashboard: mission, readiness, plan, notebook ---------------- */

export function StudyDashboard({ userId, subject, topics, progress, diagnosticUrl, foundation = false, api }) {
  const [personal, setPersonal] = useState(null);
  const [error, setError] = useState('');
  const evidence = readiness(progress);
  const priority = priorityTopics(topics, progress, foundation && (personal?.preferences ?? defaultPreferences).passMode === 'foundation-pass');

  useEffect(() => {
    let active = true;
    const refresh = () => hydratePersonal(api, userId, subject)
      .then((value) => { if (active) setPersonal(value); })
      .catch((cause) => { if (active) setError(cause?.message || 'Could not load your saved study data.'); });
    const onPersonalUpdated = (event) => {
      if (event.detail?.userId === userId && event.detail?.subject === subject) refresh();
    };
    setPersonal(null);
    setError('');
    refresh();
    noteReturn(api);
    window.addEventListener(PERSONAL_UPDATED_EVENT, onPersonalUpdated);
    return () => { active = false; window.removeEventListener(PERSONAL_UPDATED_EVENT, onPersonalUpdated); };
  }, [api, userId, subject]);

  useEffect(() => {
    if (!personal || personal.plan || !topics.length) return;
    persistPlan(buildWeekPlan(priority, subject, foundation && preferences.passMode === 'foundation-pass'));
    // Seed a first plan once topics are available; the plan stays stable for the whole day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal, topics.length, foundation]);

  const preferences = personal?.preferences ?? defaultPreferences;
  const plan = personal?.plan ?? null;
  const today = dateKey();
  const todayDay = plan?.days.find((day) => day.date === today) || null;
  const mission = todayDay && todayDay.status === 'todo' ? todayDay : null;
  const todayDone = todayDay && todayDay.status === 'done' ? todayDay : null;
  const doneCount = plan?.days.filter((day) => day.status === 'done').length || 0;
  const days = preferences.examDate ? Math.ceil((new Date(`${preferences.examDate}T12:00:00`) - new Date()) / 86400000) : null;
  const mistakes = personal?.mistakes ?? [];
  const dueCount = dueMistakeRows(mistakes).length;
  const masteredWeek = masteredSince(mistakes).length;

  function updatePreferences(patch) {
    const next = { ...preferences, ...patch };
    setPersonal((current) => (current ? { ...current, preferences: next } : current));
    api.savePreferences(next).catch((cause) => setError(`Preferences could not be saved: ${cause.message}`));
  }

  function persistPlan(next) {
    setPersonal((current) => (current ? { ...current, plan: next } : current));
    api.savePlan(next).catch((cause) => setError(`Plan could not be saved: ${cause.message}`));
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
          <div className="eyebrow">Today&apos;s mission</div>
          <h2>{mission ? mission.task : todayDone ? `✓ ${todayDone.task} done` : doneCount === 7 ? 'Every mission done' : 'Pick your first mission'}</h2>
          <p className="sub">{mission ? (mission.topicId ? `${mission.minutes} focused minutes · learn it, then finish the short practice to lock today in.` : mission.task === 'Mistake retry' ? 'No lesson today. Clear the mistakes that are due, then the day is yours.' : 'This day has no lesson — use the practice desk to keep your plan on track.') : todayDone ? (todayDone.result ? `Score ${todayDone.result.percent}% · ${todayDone.result.correctMarks}/${todayDone.result.totalMarks} marks${todayDone.result.xpEarned != null ? ` · +${todayDone.result.xpEarned} XP` : ''} recorded. Come back tomorrow — the rest of the week stays locked.` : 'Come back tomorrow — the rest of the week stays locked.') : doneCount === 7 ? 'Enjoy the break, or keep practising freely. The plan rolls over tomorrow.' : 'Complete today\u2019s row in the exam plan below; future days stay locked until then.'}</p>
          <div className="study-actions">
            {mission?.topicId && <Link className="btn btn-primary" to={`/learn/${mission.topicId}`} onClick={() => startMission(mission.date, mission.topicId)}>Start mission</Link>}
            {mission && !mission.topicId && <Link className="btn btn-primary" to={mission.task === 'Mistake retry' ? '/notebook' : '/practice'}>Open {mission.task}</Link>}
            <Link className="btn" to={diagnosticUrl}>Fast diagnostic · 10 questions</Link>
          </div>
        </div>
        <div className="panel readiness-card">
          <div className="eyebrow">Readiness score</div>
          <div className="readiness-number">{evidence.ready ? `${evidence.score}%` : 'Not enough evidence'}</div>
          <p className="sub">{evidence.ready ? `Based on ${evidence.answered} marked answers across ${evidence.topics} topics. Accuracy is a guide, not a predicted grade.` : `${evidence.answered}/20 marked answers across ${evidence.topics}/3 topics. The score appears only when both thresholds are met.`}</p>
        </div>
        <div className="panel plan-card">
          <div className="plan-head"><div><div className="eyebrow">Exam plan</div><h2>{days == null ? 'Set your exam date' : days < 0 ? 'Exam date passed' : `${days} day${days === 1 ? '' : 's'} to go`}</h2></div><input aria-label="Exam date" type="date" value={preferences.examDate} onChange={(e) => updatePreferences({ examDate: e.target.value })} /></div>
          {foundation && <label className="pass-toggle"><input type="checkbox" checked={preferences.passMode === 'foundation-pass'} onChange={(e) => updatePreferences({ passMode: e.target.checked ? 'foundation-pass' : 'balanced' })} /><span><strong>Pass mode · grade 4 goal</strong><small>Prioritise core and weak Foundation topics.</small></span></label>}
          <div className="week-plan">{!personal ? <p className="empty">Loading your plan…</p> : plan?.days.length ? plan.days.map((day) => { const done = day.status === 'done'; const canStart = !done && day.topicId && day.date === today; const locked = !done && !canStart; return (done ? <Link key={day.date} to={day.topicId ? `/learn/${day.topicId}` : '/practice'} className="done" title={day.result ? `Done: ${day.result.percent}% · ${day.result.correctMarks}/${day.result.totalMarks} marks` : undefined}><b>✓ {day.label}</b><span>{day.task}</span>{day.result ? <small>{day.result.percent}%{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''}</small> : null}</Link> : canStart ? <Link key={day.date} to={`/learn/${day.topicId}`} onClick={() => startMission(day.date, day.topicId)} title="Today's mission"><b>{day.label}</b><span>{day.task}</span><small>Start ★</small></Link> : <span key={day.date} className="locked" title={locked ? 'Completes when a new day starts' : undefined}><b>{day.label}</b><span>{day.task}</span>{locked ? <small>Locked</small> : null}</span>); }) : <p className="empty">Complete a lesson to build your 7-day plan.</p>}</div>
          {error && <p className="plan-note error" role="alert">{error}</p>}
          <p className="plan-note">{doneCount}/7 days done this week · the plan is saved to your account and only rolls over on a new day.</p>
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
          <b>{days == null || days < 0 ? '—' : days}</b>
          <span>days until your exam</span>
        </Link>
      </section>
    </>
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
  const [personal, setPersonal] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState({});
  const now = Date.now();

  useEffect(() => {
    let active = true;
    setPersonal(null);
    setError('');
    hydratePersonal(api, userId, subject)
      .then((value) => { if (active) setPersonal(value); })
      .catch((cause) => { if (active) setError(cause?.message || 'Could not load the notebook.'); });
    return () => { active = false; };
  }, [api, userId, subject]);

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
    setPersonal((current) => (current ? { ...current, mistakes: next } : current));
    try {
      await api.saveMistakes(next);
      if (event) api.track?.(event, metadata);
    } catch (cause) {
      setError(`Notebook could not be saved: ${cause.message}`);
    }
  }

  function reviewed(row) {
    save(advanceMistakeRows(rows, row.id), 'mistake_retry', { qid: row.qid, reviewIndex: (row.reviewIndex ?? 0) + 1 });
  }

  function classify(id, errorType) {
    save(classifyMistake(rows, id, errorType));
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
              Retry {row.reviewIndex ?? 0}/4{row.errorType ? ` · ${ERROR_TYPES.find((type) => type.id === row.errorType)?.label}` : ''}
            </small>
          </span>
          <span className="chev" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
        </button>
        {expanded && (
          <div className="notebook-body">
            <MistakeDetail row={row} />
            <ClassificationChips row={row} onClassify={classify} />
            <div className="study-actions">
              {row.topicId && <Link className="btn btn-primary" to={`/learn/${row.topicId}`}>{row.warmupCount ? 'Micro-practice again' : 'Warm-up micro-practice'}</Link>}
              {row.topicId && <button type="button" className="btn" onClick={() => warmupDone(row)}>Warm-up done</button>}
              <button type="button" className="btn" onClick={() => reviewed(row)}>{row.reviewIndex >= 3 ? 'Mark mastered' : 'I retried this'}</button>
            </div>
            <p className="sub small">
              {row.warmupCount
                ? 'Warm-up logged — the full retry counts when you can get this right cold.'
                : 'Do the warm-up first, then retry the question cold. Mastery is proving it, not recognising it.'}
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
          <p className="sub">Every missed question is saved to your account, classified by you, and retried after 1, 3, 7 and 21 days until you prove it twice.</p>
        </div>
      </header>
      {error && <p className="plan-note error" role="alert">{error}</p>}
      <section className="stat-row">
        <div className="stat-card"><div className="stat-num">{dueRows.length}</div><div className="stat-label">Due for retry</div></div>
        <div className="stat-card"><div className="stat-num">{upcoming.length}</div><div className="stat-label">Scheduled</div></div>
        <div className="stat-card"><div className="stat-num">{masteredWeek.length}</div><div className="stat-label">Mastered this week</div></div>
        <div className="stat-card"><div className="stat-num">{rows.filter((row) => row.mastered).length}</div><div className="stat-label">Mastered all-time</div></div>
      </section>
      {topReasonLabel && (
        <p className="sub notebook-insight">Most common reason so far: <b>{topReasonLabel}</b> — {ERROR_TYPES.find((type) => type.id === topReason[0])?.hint}</p>
      )}
      <section className="panel notebook-list">
        <h2>Due now</h2>
        {!personal ? <p className="empty">Loading your notebook…</p>
          : dueRows.length ? dueRows.map((row) => renderRow(row, true))
            : <p className="empty">Nothing due right now. Come back when a review date arrives.</p>}
      </section>
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
      <h2>Paper triage — what to do next</h2>
      <p className="sub">
        {pace != null && pace > 110
          ? `You used about ${Math.round(pace)}% of the intended time. Pace cost you marks before ability did — try the timing budget on the next paper.`
          : pace != null && pace < 75
            ? `You finished in about ${Math.round(pace)}% of the intended time — check the rushed answers below before moving on.`
            : 'Your pacing was in a healthy range. Focus the next session on the biggest mark losses.'}
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
  const [personal, setPersonal] = useState(null);
  const [error, setError] = useState('');
  const evidence = readiness(progress);
  const now = Date.now();

  useEffect(() => {
    let active = true;
    setPersonal(null);
    setError('');
    hydratePersonal(api, userId, subject)
      .then((value) => { if (active) setPersonal(value); })
      .catch((cause) => { if (active) setError(cause?.message || 'Could not load your summary data.'); });
    return () => { active = false; };
  }, [api, userId, subject]);

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
          <div className="eyebrow">Revision evidence report</div>
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
        <div className="stat-card"><div className="stat-num">{masteredWeek.length}</div><div className="stat-label">Mistakes mastered (7 days)</div></div>
        <div className="stat-card"><div className="stat-num">{due}</div><div className="stat-label">Mistakes due</div></div>
      </section>
      <section className="panel">
        <h2>This week&apos;s exam plan</h2>
        {plan?.days.length ? <div className="week-plan">{plan.days.map((day) => { const done = day.status === 'done'; return (done ? <Link key={day.date} to={day.topicId ? `/learn/${day.topicId}` : '/practice'} className="done"><b>✓ {day.label}</b><span>{day.task}</span>{day.result ? <small>{day.result.percent}%{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''}</small> : null}</Link> : <span key={day.date} className="locked"><b>{day.label}</b><span>{day.task}</span></span>); })}</div> : <p className="empty">Open the dashboard to build your 7-day plan.</p>}
        <p className="sub">{donePlan.length}/7 missions complete this week.</p>
      </section>
      <section className="panel">
        <h2>Mistake-to-mastery evidence</h2>
        {rows.length ? (
          <>
            <p className="sub">
              {masteredWeek.length} mistake{masteredWeek.length === 1 ? '' : 's'} mastered in the last 7 days · {activeRows.length} still in rotation
              {topReasonLabel(rows) ? ` · most common reason: ${topReasonLabel(rows)}` : ''}.
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
        ) : <p className="empty">No mistakes saved yet — complete a marked paper or practice set and missed questions land here automatically.</p>}
      </section>
      <section className="panel">
        <h2>Next focus</h2>
        <p>{preferences.passMode === 'foundation-pass' ? 'Pass mode is on: working towards a grade 4 goal through core and weak topics.' : 'Follow the saved exam plan on the dashboard and clear due notebook mistakes.'}</p>
        <p className="sub">This is a revision snapshot, not an official grade prediction.</p>
        <div className="evidence-signature no-print" aria-hidden="true">
          <span>Share with a teacher or parent: print or save as PDF — no second account needed.</span>
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
