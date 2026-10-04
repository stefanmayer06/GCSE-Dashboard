import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { invalidateResources, useResource } from './resource-cache.js';
import { FoldPanel, RetryFlow, wideScreen } from './PracticeKit.jsx';
import { AskPipButton } from './PipChat.jsx';
import { AppHeader } from './AppShell.jsx';
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
} from './study-personal.js';
import { buildWeekPlan, dateKey, fixupEnglishPlan, fixupTargets, priorityTopics, readiness } from './study.js';

const defaultPreferences = { examDate: '', targetGrade: '', restDays: [], minutesPerDay: null };
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

/* ---------------- Plan, preferences and today's mission ---------------- */

// Shared by Today (week strip + today's task) and Me (exam date, rest days,
// minutes a day). A fresh Monday-to-Sunday plan is built the first time the
// saved plan has no row for today (new account or Monday rollover).
export function useStudyPlan({ userId, subject, api, topics = [], progress = null }) {
  const { fetched, personal, loadError, refresh, setOverride } = usePersonal(userId, subject, api);
  const [saveError, setSaveError] = useState('');
  const preferences = personal?.preferences ?? defaultPreferences;
  const plan = personal?.plan ?? null;
  const error = [loadError && `Could not load your saved study data: ${loadError}`, saveError].filter(Boolean).join(' ');

  useEffect(() => {
    const onPersonalUpdated = (event) => {
      if (event.detail?.userId === userId && event.detail?.subject === subject) refresh();
    };
    if (userId) noteReturn(api, userId, subject);
    window.addEventListener(PERSONAL_UPDATED_EVENT, onPersonalUpdated);
    return () => window.removeEventListener(PERSONAL_UPDATED_EVENT, onPersonalUpdated);
  }, [api, userId, subject, refresh]);

  function persistPlan(next) {
    setOverride((current) => ({ ...(current ?? fetched), plan: next }));
    api.savePlan(next)
      .then(() => refresh())
      .catch((cause) => setSaveError(`Plan could not be saved: ${cause.message}`));
  }

  useEffect(() => {
    if (!personal || !topics.length) return;
    if (personal.plan?.days.some((day) => day.date === dateKey())) return;
    persistPlan(buildWeekPlan(priorityTopics(topics, progress), subject, undefined, [], preferences));
    // Seed once topics are available; the plan stays stable for the whole day.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal, topics.length]);

  function updatePreferences(patch) {
    const next = { ...preferences, ...patch };
    setOverride((current) => ({ ...(current ?? fetched), preferences: next }));
    setSaveError('');
    return api.savePreferences(next)
      .then(() => refresh())
      .catch((cause) => setSaveError(`Preferences could not be saved: ${cause.message}`));
  }

  function startMission(date, topicId) {
    const next = startPlanDayInState(plan, date, topicId);
    if (next) {
      persistPlan(next);
      api.track?.('mission_start', { topicId: topicId ?? null });
    }
  }

  return { personal, preferences, plan, error, updatePreferences, persistPlan, startMission, refresh };
}

export const PLAN_WEEKDAYS = WEEKDAYS;
export { planMinutesDefault, examMonthLabel, usePersonal };

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

// A long due list shows its first few rows; the Retry button takes them all.
const DUE_PREVIEW = 5;

export function Notebook({ userId, subject, api, renderQuestion = null }) {
  const { fetched, personal, loadError, setOverride } = usePersonal(userId, subject, api);
  const [saveError, setSaveError] = useState('');
  const [open, setOpen] = useState({});
  const [params, setParams] = useSearchParams();
  // A snapshot of the due rows, taken when retries start, so grading one
  // does not reshuffle the queue mid-flow.
  const [retrying, setRetrying] = useState(null);
  const [showAllDue, setShowAllDue] = useState(false);
  const now = Date.now();
  const error = [loadError && `Could not load the notebook: ${loadError}`, saveError].filter(Boolean).join(' ');

  const rows = personal?.mistakes ?? [];
  const active = rows.filter((row) => !row.mastered)
    .sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)));
  const dueIds = new Set(dueMistakeRows(active, now).map((row) => row.id));
  const dueRows = active.filter((row) => dueIds.has(row.id));
  const upcoming = active.filter((row) => !dueIds.has(row.id));
  const mastered = rows.filter((row) => row.mastered);
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

  // /notebook?retry=1 (from Today or Practice) opens straight into retries.
  useEffect(() => {
    if (params.get('retry') !== '1' || !personal || retrying) return;
    if (dueRows.length) setRetrying(dueRows);
    const next = new URLSearchParams(params);
    next.delete('retry');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, personal]);

  if (retrying) {
    return (
      <RetryFlow
        rows={retrying}
        api={api}
        renderQuestion={renderQuestion}
        onGrade={(row, grade) => reviewed(row, grade)}
        onExit={() => setRetrying(null)}
      />
    );
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
              <AskPipButton
                context={{ kind: 'mistake', label: row.topicName, question: row.prompt, answer: row.answer == null ? null : String(row.answer), wrong: true }}
                label="Ask Pip about this"
                className="btn"
              />
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
    <div className="page notebook-page">
      <AppHeader />
      <Link to="/practice" className="back-link"><span aria-hidden="true">←</span> Practice</Link>
      <header className="page-head">
        <div>
          <h1>Mistake notebook</h1>
          <p className="sub">Questions you miss are saved here. They come back after 1, 3, 7 and 21 days until you have them for good.</p>
        </div>
        {dueRows.length ? (
          <button type="button" className="btn btn-go" onClick={() => setRetrying(dueRows)}>
            Retry {dueRows.length} due
          </button>
        ) : null}
      </header>
      {error && <p className="plan-note error" role="alert">{error}</p>}
      <section className="stat-row">
        <div className={`stat-card${dueRows.length ? ' warn' : ''}`}><div className="stat-num">{dueRows.length}</div><div className="stat-label">Due for retry</div></div>
        <div className="stat-card"><div className="stat-num">{upcoming.length}</div><div className="stat-label">Scheduled</div></div>
        <div className={`stat-card${masteredWeek.length ? ' good' : ''}`}><div className="stat-num">{masteredWeek.length}</div><div className="stat-label">Mastered this week</div></div>
        <div className="stat-card"><div className="stat-num">{mastered.length}</div><div className="stat-label">Mastered all-time</div></div>
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
              {(showAllDue ? dueRows : dueRows.slice(0, DUE_PREVIEW)).map((row) => renderRow(row, true))}
              {!showAllDue && dueRows.length > DUE_PREVIEW ? (
                <button type="button" className="btn btn-block notebook-more" onClick={() => setShowAllDue(true)}>
                  Show all {dueRows.length} due
                </button>
              ) : null}
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
        <FoldPanel title="Coming up" count={upcoming.length} defaultOpen={wideScreen()} className="notebook-list">
          {upcoming.map((row) => renderRow(row, false))}
        </FoldPanel>
      )}
      {mastered.length > 0 && (
        <FoldPanel title="Mastered" count={mastered.length} className="notebook-list">
          {mastered.slice(0, 12).map((row) => (
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
        </FoldPanel>
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
      <Link to="/me" className="back-link no-print"><span aria-hidden="true">←</span> Me</Link>
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
        {plan?.days.length ? <div className="week-plan">{plan.days.map((day) => { const done = day.status === 'done'; const past = !done && day.date < dateKey(); return (done ? <Link key={day.date} to={day.topicId ? `/learn/${day.topicId}` : '/practice'} className="done"><b>✓ {day.label}</b><span>{day.task}</span>{day.result ? <small>{day.result.percent}%</small> : null}</Link> : <span key={day.date} className={past ? 'past' : 'locked'}><b>{day.label}</b><span>{day.task}</span></span>); })}</div> : <p className="empty">Open Today to build your 7-day plan.</p>}
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
        <p>Check today’s task on Today and retry any questions that are due.</p>
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
