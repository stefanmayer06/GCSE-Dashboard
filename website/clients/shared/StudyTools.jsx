import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { advanceMistakeRows, completePlanDayInState, dueMistakeRows, hydratePersonal, startPlanDayInState } from './study-personal.js';
import { buildWeekPlan, dateKey, priorityTopics, readiness } from './study.js';

const defaultPreferences = { examDate: '', targetGrade: '', passMode: 'balanced' };

export function StudyDashboard({ userId, subject, topics, progress, diagnosticUrl, foundation = false, api }) {
  const [personal, setPersonal] = useState(null);
  const [error, setError] = useState('');
  const evidence = readiness(progress);
  const priority = priorityTopics(topics, progress, foundation && (personal?.preferences ?? defaultPreferences).passMode === 'foundation-pass');

  useEffect(() => {
    let active = true;
    setPersonal(null);
    setError('');
    hydratePersonal(api, userId, subject)
      .then((value) => { if (active) setPersonal(value); })
      .catch((cause) => { if (active) setError(cause?.message || 'Could not load your saved study data.'); });
    return () => { active = false; };
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
    if (next) persistPlan(next);
  }

  return (
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
  );
}

export function Notebook({ userId, subject, api }) {
  const [personal, setPersonal] = useState(null);
  const [error, setError] = useState('');
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
  const active = rows.filter((row) => !row.mastered);
  const due = new Set(dueMistakeRows(active, now).map((row) => row.id));

  async function reviewed(id) {
    const next = advanceMistakeRows(rows, id);
    setPersonal((current) => (current ? { ...current, mistakes: next } : current));
    try {
      await api.saveMistakes(next);
    } catch (cause) {
      setError(`Notebook could not be saved: ${cause.message}`);
    }
  }

  return <div className="page"><header className="page-head"><div><h1>Mistake notebook</h1><p className="sub">Marked mistakes are saved to your account. Retry them after 1, 3, 7 and 21 days.</p></div></header>{error && <p className="plan-note error" role="alert">{error}</p>}<section className="panel notebook-list">{!personal ? <p className="empty">Loading your notebook…</p> : !active.length ? <p className="empty">No active mistakes. Complete and mark a paper to begin.</p> : active.sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt))).map((row) => { const dueDate = row.dueDates?.[row.reviewIndex ?? 0]; const isDue = dueDate && Date.parse(dueDate) <= now; return <article key={row.id} className="notebook-row"><div><span className={`due-chip ${isDue ? 'due' : ''}`}>{isDue ? 'Due now' : dueDate ? `Due ${new Date(dueDate).toLocaleDateString()}` : 'Scheduled'}</span><h3>{row.topicName}</h3><p>{row.prompt}</p><small>{row.marks != null && row.maxMarks != null ? `Last mark: ${row.marks}/${row.maxMarks}` : `Captured ${new Date(row.capturedAt).toLocaleDateString()}`}</small></div><div className="study-actions">{row.topicId && <Link className="btn btn-primary" to={`/learn/${row.topicId}`}>Retry topic</Link>}<button className="btn" onClick={() => reviewed(row.id)}>{row.reviewIndex >= 3 ? 'Mark mastered' : 'I retried this'}</button></div></article>; })}</section></div>;
}

export function WeeklySummary({ userId, subject, progress, api }) {
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
  const donePlan = plan?.days.filter((day) => day.status === 'done') || [];

  return <div className="page weekly-summary"><header className="page-head"><div><div className="eyebrow">Student-controlled</div><h1>Weekly summary</h1><p className="sub">Generated on {new Date().toLocaleDateString()} · stored in your account.</p></div><button className="btn btn-primary no-print" onClick={() => window.print()}>Print summary</button></header>{error && <p className="plan-note error" role="alert">{error}</p>}<section className="stat-row"><div className="stat-card"><div className="stat-num">{progress?.testsTaken ?? 0}</div><div className="stat-label">Papers completed</div></div><div className="stat-card"><div className="stat-num">{progress?.practiceAnswered ?? 0}</div><div className="stat-label">Questions attempted</div></div><div className="stat-card"><div className="stat-num">{evidence.ready ? `${evidence.score}%` : '—'}</div><div className="stat-label">Readiness accuracy</div></div><div className="stat-card"><div className="stat-num">{due}</div><div className="stat-label">Mistakes due</div></div></section><section className="panel"><h2>This week&apos;s exam plan</h2>{plan?.days.length ? <div className="week-plan">{plan.days.map((day) => { const done = day.status === 'done'; return (done ? <Link key={day.date} to={day.topicId ? `/learn/${day.topicId}` : '/practice'} className="done"><b>✓ {day.label}</b><span>{day.task}</span>{day.result ? <small>{day.result.percent}%{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''}</small> : null}</Link> : <span key={day.date} className="locked"><b>{day.label}</b><span>{day.task}</span></span>); })}</div> : <p className="empty">Open the dashboard to build your 7-day plan.</p>}<p className="sub">{donePlan.length}/7 missions complete this week.</p></section><section className="panel"><h2>Next focus</h2><p>{preferences.passMode === 'foundation-pass' ? 'Pass mode is on: working towards a grade 4 goal through core and weak topics.' : 'Follow the saved exam plan on the dashboard and clear due notebook mistakes.'}</p><p className="sub">This is a revision snapshot, not an official grade prediction.</p></section></div>;
}