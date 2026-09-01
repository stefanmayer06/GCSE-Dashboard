import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { advanceMistake, loadMistakes, loadPlan, loadStudy, priorityTopics, readiness, saveStudy, startPlanDay } from './study.js';

export function StudyDashboard({ userId, subject, topics, progress, diagnosticUrl, foundation = false }) {
  const [settings, setSettings] = useState(() => loadStudy(userId, subject));
  const [plan, setPlan] = useState(() => loadPlan(userId, subject, [], foundation && settings.passMode));
  const evidence = readiness(progress);
  const priority = priorityTopics(topics, progress, foundation && settings.passMode);
  useEffect(() => {
    if (!topics.length) return;
    setPlan((current) => loadPlan(userId, subject, priority, foundation && settings.passMode));
    // Plan seeding runs when topics arrive; loadPlan keeps an existing plan for today stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, subject, topics.length, foundation, settings.passMode]);
  const mission = plan?.days.find((day) => day.status === 'todo') || null;
  const doneCount = plan?.days.filter((day) => day.status === 'done').length || 0;
  const days = settings.examDate ? Math.ceil((new Date(`${settings.examDate}T12:00:00`) - new Date()) / 86400000) : null;
  function update(patch) { const next = { ...settings, ...patch }; setSettings(next); saveStudy(userId, subject, next); }
  function startMission(date, topicId) {
    startPlanDay(userId, subject, date, topicId);
    setPlan((current) => (current ? { ...current, intent: { date, ...(topicId ? { topicId } : {}) } } : current));
  }
  return (
    <section className="study-grid" aria-label="Revision planner">
      <div className="panel mission-card">
        <div className="eyebrow">{mission ? 'Today&apos;s mission' : 'This week&apos;s plan'}</div>
        <h2>{mission ? mission.task : doneCount === 7 ? 'Every mission done' : 'Pick your next mission'}</h2>
        <p className="sub">{mission ? `${mission.minutes} focused minutes · part of your saved 7-day exam plan` : doneCount === 7 ? 'Enjoy the break, or keep practising freely. The plan rolls over tomorrow.' : 'Open the exam plan below and start any unfinished day.'}</p>
        <div className="study-actions">
          {mission?.topicId && <Link className="btn btn-primary" to={`/learn/${mission.topicId}`} onClick={() => startMission(mission.date, mission.topicId)}>Start mission</Link>}
          <Link className="btn" to={diagnosticUrl}>Fast diagnostic · 10 questions</Link>
        </div>
      </div>
      <div className="panel readiness-card">
        <div className="eyebrow">Readiness score</div>
        <div className="readiness-number">{evidence.ready ? `${evidence.score}%` : 'Not enough evidence'}</div>
        <p className="sub">{evidence.ready ? `Based on ${evidence.answered} marked answers across ${evidence.topics} topics. Accuracy is a guide, not a predicted grade.` : `${evidence.answered}/20 marked answers across ${evidence.topics}/3 topics. The score appears only when both thresholds are met.`}</p>
      </div>
      <div className="panel plan-card">
        <div className="plan-head"><div><div className="eyebrow">Exam plan</div><h2>{days == null ? 'Set your exam date' : days < 0 ? 'Exam date passed' : `${days} day${days === 1 ? '' : 's'} to go`}</h2></div><input aria-label="Exam date" type="date" value={settings.examDate} onChange={(e) => update({ examDate: e.target.value })} /></div>
        {foundation && <label className="pass-toggle"><input type="checkbox" checked={settings.passMode} onChange={(e) => update({ passMode: e.target.checked })} /><span><strong>Pass mode · grade 4 goal</strong><small>Prioritise core and weak Foundation topics.</small></span></label>}
        <div className="week-plan">{plan?.days.length ? plan.days.map((day) => { const done = day.status === 'done'; return (<Link key={day.date} to={day.topicId ? `/learn/${day.topicId}` : '/practice'} className={done ? 'done' : ''} onClick={() => !done && day.topicId && startMission(day.date, day.topicId)} title={done && day.result ? `Done: ${day.result.percent}% · ${day.result.correctMarks}/${day.result.totalMarks} marks` : undefined}><b>{done ? '✓ ' : ''}{day.label}</b><span>{day.task}</span>{done && day.result ? <small>{day.result.percent}%{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''}</small> : null}</Link>); }) : <p className="empty">Loading your plan…</p>}</div>
        <p className="plan-note">{doneCount}/7 days done this week · the plan is saved in this browser and only rolls over on a new day.</p>
      </div>
    </section>
  );
}

export function Notebook({ userId, subject }) {
  const [rows, setRows] = useState(() => loadMistakes(userId, subject));
  const now = Date.now();
  const active = rows.filter((row) => !row.completed);
  return <div className="page"><header className="page-head"><div><h1>Mistake notebook</h1><p className="sub">Marked mistakes stay in this account&apos;s browser record. Retry them after 1, 3, 7 and 21 days.</p></div></header><section className="panel notebook-list">{!active.length ? <p className="empty">No active mistakes. Complete and mark a paper to begin.</p> : active.sort((a,b) => a.due-b.due).map((row) => <article key={row.id} className="notebook-row"><div><span className={`due-chip ${row.due <= now ? 'due' : ''}`}>{row.due <= now ? 'Due now' : `Due ${new Date(row.due).toLocaleDateString()}`}</span><h3>{row.topic}</h3><p>{row.question}</p><small>Last mark: {row.marks}/{row.max}</small></div><div className="study-actions"><Link className="btn btn-primary" to={row.url}>Retry topic</Link><button className="btn" onClick={() => setRows(advanceMistake(userId, subject, row.id))}>{row.interval >= 3 ? 'Mark mastered' : 'I retried this'}</button></div></article>)}</section></div>;
}

export function WeeklySummary({ userId, subject, progress }) {
  const evidence = readiness(progress); const mistakes = loadMistakes(userId, subject); const due = mistakes.filter((row) => !row.completed && row.due <= Date.now()).length; const settings = loadStudy(userId, subject); const plan = loadPlan(userId, subject, [], false); const donePlan = plan?.days.filter((day) => day.status === 'done') || [];
  return <div className="page weekly-summary"><header className="page-head"><div><div className="eyebrow">Student-controlled</div><h1>Weekly summary</h1><p className="sub">Generated on {new Date().toLocaleDateString()} · stored only in this browser.</p></div><button className="btn btn-primary no-print" onClick={() => window.print()}>Print summary</button></header><section className="stat-row"><div className="stat-card"><div className="stat-num">{progress?.testsTaken ?? 0}</div><div className="stat-label">Papers completed</div></div><div className="stat-card"><div className="stat-num">{progress?.practiceAnswered ?? 0}</div><div className="stat-label">Questions attempted</div></div><div className="stat-card"><div className="stat-num">{evidence.ready ? `${evidence.score}%` : '—'}</div><div className="stat-label">Readiness accuracy</div></div><div className="stat-card"><div className="stat-num">{due}</div><div className="stat-label">Mistakes due</div></div></section><section className="panel"><h2>This week&apos;s exam plan</h2>{plan?.days.length ? <div className="week-plan">{plan.days.map((day) => { const done = day.status === 'done'; return (<Link key={day.date} to={day.topicId ? `/learn/${day.topicId}` : '/practice'} className={done ? 'done' : ''}><b>{done ? '✓ ' : ''}{day.label}</b><span>{day.task}</span>{done && day.result ? <small>{day.result.percent}%{day.result.xpEarned != null ? ` · +${day.result.xpEarned} XP` : ''}</small> : null}</Link>); })}</div> : <p className="empty">Open the dashboard to build your 7-day plan.</p>}<p className="sub">{donePlan.length}/7 missions complete this week.</p></section><section className="panel"><h2>Next focus</h2><p>{settings.passMode ? 'Pass mode is on: working towards a grade 4 goal through core and weak topics.' : 'Follow the saved exam plan on the dashboard and clear due notebook mistakes.'}</p><p className="sub">This is a revision snapshot, not an official grade prediction.</p></section></div>;
}
