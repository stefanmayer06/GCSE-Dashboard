import { Link, useNavigate } from 'react-router-dom';
import { ExpertisePath } from './rewards.jsx';
import { MemRiCard, StudyDashboard } from './StudyTools.jsx';
import { MilestoneShelf } from './Milestones.jsx';
import { NextStepCard } from './NextStep.jsx';
import { masteryStage } from './next-step.js';

// V3 Trailhead — Today view shared by Maths + English.
//
// One hierarchy for every subject:
//   01 Up next (hero: readiness ring, streak, exam countdown, weakest-3)
//   02 Today (mission + readiness + 7-day trail via StudyDashboard)
//   03 Mastery path (journey nodes, weakest-first, labelled stages)
//   04 Timed papers (exam dockets + mixed practice)
//   05 Evidence (expertise, memory, milestones)
// Class names stay on the frozen contract (.page, .page-head, .stat-row,
// .stat-card, .panel, .paper-card, .btn) so Playwright keeps passing.

function examTone(days) {
  if (days == null || days < 0) return '';
  if (days <= 14) return 'urgent';
  if (days <= 45) return 'soon';
  return 'settled';
}

function formatExamMonth(dateStr) {
  const at = Date.parse(dateStr ? `${dateStr}T12:00:00` : '');
  if (!Number.isFinite(at)) return null;
  return new Date(at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function examCopy(days, dateStr) {
  if (days == null) return 'Set your exam date to start the countdown';
  if (days < 0) return 'Exam date passed. Keep your results for resits or next steps';
  if (days === 0) return 'Exam today. Good luck. Keep your warm-up short';
  if (days === 1) return '1 day to go. Do one short review';
  if (days <= 14) return `${days} days to go. Every session counts`;
  // Far-future dates (e.g. a placeholder year) would read as absurd day
  // counts — show the month instead. Plenty of runway is the message.
  if (days > 365) {
    const month = formatExamMonth(dateStr);
    return month ? `Exams ${month}. Build a steady weekly habit` : 'Exam date set. Keep your practice steady';
  }
  return `${days} days to go. Keep your practice steady`;
}

function ContinueStrip({ subjectKey, learnBase = '/learn' }) {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(`gcse-continue:${subjectKey}`) || 'null');
  } catch {}
  if (!saved?.href || !saved?.label) return null;
  return (
    <div className="continue-strip" role="note" aria-label="Continue where you left off">
      <div>
        <strong>Pick up where you left off</strong>
        <span>{saved.label}{saved.detail ? ` · ${saved.detail}` : ''}</span>
      </div>
      <Link className="btn btn-primary" to={saved.href}>Continue →</Link>
    </div>
  );
}

export default function DashboardHome({
  subjectKey,
  title,
  subtitle,
  headChip = null,
  progress = null,
  topics = [],
  nextStep = { step: null, weak: [], dueCount: 0, examDays: null, readinessScore: null },
  userId = null,
  api = null,
  diagnosticUrl = '/practice?diagnostic=1#adhoc',
  foundation = false,
  masteryRows = null,
  masteryLoading = false,
  masteryEmptyHint = '',
  masteryTitle = 'Mastery by strand',
  papers = [],
  adhoc = null,
  learnBase = '/learn',
}) {
  const navigate = useNavigate();
  const overall = progress?.overallPercent;
  const days = nextStep.examDays;
  const tone = examTone(days);

  const streakCap = progress?.streak > 0
    ? 'A streak freeze protects one missed day'
    : 'Complete one mission to start your streak';
  const stats = [
    { value: progress?.testsTaken ?? '—', label: 'Timed papers sat', cap: 'Marked, reviewable, with worked methods' },
    { value: overall != null ? `${overall}%` : '—', label: 'Average paper score', cap: 'Calculated from your marked papers' },
    { value: progress?.practiceAnswered ?? '—', label: 'Questions answered', cap: 'Lessons, drills and mixed rounds' },
    { value: progress?.streak > 0 ? progress.streak : '—', label: 'Day streak', cap: streakCap },
  ];

  const ranked = (masteryRows || [])
    .slice()
    .sort((a, b) => (a.percent ?? 101) - (b.percent ?? 101));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
          <p className={`exam-countdown ${tone}`} role="status">{examCopy(days, nextStep.examDate)}</p>
        </div>
        {headChip}
      </header>

      <ContinueStrip subjectKey={subjectKey} learnBase={learnBase} />

      <p className="section-label"><span className="section-num">01</span> Your trail so far</p>
      <section className="stat-row" aria-label="Your revision numbers">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-num">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-cap">{s.cap}</div>
          </div>
        ))}
      </section>

      <p className="section-label"><span className="section-num">02</span> Your next task</p>
      <p className="sub" style={{ marginTop: -6 }}>One clear step. Everything else can wait.</p>
      <NextStepCard
        step={nextStep.step}
        weak={nextStep.weak}
        dueCount={nextStep.dueCount}
        streak={progress?.streak}
        readinessScore={nextStep.readinessScore}
        examDays={nextStep.examDays}
        examDate={nextStep.examDate}
      />

      <p className="section-label"><span className="section-num">03</span> Today&apos;s plan</p>
      <StudyDashboard
        userId={userId}
        subject={subjectKey}
        topics={topics}
        progress={progress}
        diagnosticUrl={diagnosticUrl}
        foundation={foundation}
        api={api}
      />

      <p className="section-label"><span className="section-num">04</span> Mastery path</p>
      <section className="panel" aria-labelledby="mastery-title">
        <h2 id="mastery-title">{masteryTitle}</h2>
        <p className="sub">Work through New → Learning → Developing → Secure → Mastered. Each level is based on your answers.</p>
        {masteryLoading ? (
          <div className="skeleton-block" role="status" aria-label="Loading mastery"> </div>
        ) : !ranked.some((m) => m.answered > 0) ? (
          <div className="empty-state">
            <h3>Your trail starts here</h3>
            <p>{masteryEmptyHint || 'Answer questions in papers, lessons or mixed rounds and your path appears here, weakest first.'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/practice')}>Start a paper</button>
          </div>
        ) : (
          <div>
            <div className="v3-mastery">
              {ranked.map((m) => {
                const stage = masteryStage(m.percent, m.answered);
                return (
                  <Link key={m.id} to={`${learnBase}`} className="v3-mastery-row" aria-label={`${m.name}: ${m.percent != null ? `${m.percent} percent over ${m.answered} questions` : 'not tried yet'}, stage ${stage.text}`}>
                    <span className="v3-mastery-name">{m.name}</span>
                    <span className={`v3-stage ${stage.id}`}>{stage.text}</span>
                    <span className="v3-mastery-track" role="img" aria-hidden="true">
                      <span className="v3-mastery-fill" style={{ width: `${m.percent ?? 0}%` }} />
                    </span>
                    <span className="v3-mastery-meta">{m.percent != null ? `${m.percent}% · ${m.answered} answered` : 'Not tried yet'}</span>
                  </Link>
                );
              })}
            </div>
            <p className="sub small">
              Built from every answer across papers, lessons and mixed rounds. Drill a weak step in{' '}
              <button type="button" className="link link-button" onClick={() => navigate(learnBase)}>Learn</button>.
            </p>
          </div>
        )}
      </section>

      <p className="section-label"><span className="section-num">05</span> Sit a timed paper</p>
      <section className="panel start-panel" aria-labelledby="papers-title">
        <h2 id="papers-title">Start a practice paper</h2>
        <p className="sub">{papers.blurb}</p>
        <div className={`papers-grid${papers.items?.length === 2 ? ' two' : ''}`}>
          {(papers.items || []).map((p) => (
            <div key={p.id} className={`paper-card pick ${p.calc ? 'calc' : 'noncalc'}`}>
              <div className="paper-top">
                <span className="paper-type">{p.code}</span>
                <span className={`calc-badge ${p.calc ? 'yes' : 'no'}`}>
                  {p.calcLabel || (p.calc ? 'Calculator' : 'No calculator')}
                </span>
              </div>
              <div className="paper-desc">{p.blurb}</div>
              <div className="paper-meta-line">{p.meta}</div>
              <div className="paper-actions">
                <button className="btn btn-primary" onClick={() => navigate(p.fullHref)}>
                  {p.fullLabel}
                </button>
                <button className="btn" onClick={() => navigate(p.shortHref)}>
                  {p.shortLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
        {adhoc ? (
          <div className="adhoc-cta">
            <div>
              <div className="adhoc-cta-title">{adhoc.title}</div>
              <div className="sub">{adhoc.copy}</div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate(adhoc.href)}>{adhoc.cta}</button>
          </div>
        ) : null}
      </section>

      <p className="section-label"><span className="section-num">06</span> Levels and milestones</p>
      <ExpertisePath progress={progress} onChooseLesson={() => navigate(learnBase)} />

      <MemRiCard userId={userId} subject={subjectKey} api={api} />

      <MilestoneShelf progress={progress} subjectName={title.replace('Your ', '')} api={api} />
    </div>
  );
}
