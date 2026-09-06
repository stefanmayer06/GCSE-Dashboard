import { Link, useNavigate } from 'react-router-dom';
import { ExpertisePath } from './rewards.jsx';
import { StudyDashboard } from './StudyTools.jsx';
import { NextStepCard } from './NextStep.jsx';
import { strengthLabel } from './next-step.js';

// v3 Command Desk — shared dashboard home for Maths + English.
//
// One hierarchy for every subject:
//   01 Up next (NextStep command card with readiness ring)
//   02 Today (mission + readiness + 7-day plan via StudyDashboard)
//   03 Papers (timed exam dockets + mixed practice CTA)
//   04 Mastery (single ranked panel — replaces the duplicated
//      "Current focus" + "Topic mastery" pair)
// Class names stay on the frozen contract (.page, .page-head, .stat-row,
// .stat-card, .panel, .paper-card, .btn) so Playwright keeps passing.

function examTone(days) {
  if (days == null || days < 0) return '';
  if (days <= 14) return 'urgent';
  if (days <= 45) return 'soon';
  return 'settled';
}

function examCopy(days) {
  if (days == null) return 'Set your exam date to start the countdown';
  if (days < 0) return 'Exam date passed — keep evidence for resits or next steps';
  if (days === 0) return 'Exams today — good luck. Warm up, don’t cram';
  if (days === 1) return '1 day to go — short, sharp review only';
  if (days <= 14) return `${days} days to go — every session counts now`;
  return `${days} days to go — steady progress beats last-minute rush`;
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

  const stats = [
    { value: progress?.testsTaken ?? '—', label: 'Practice papers completed', cap: 'Full timed attempts, marked and reviewable' },
    { value: overall != null ? `${overall}%` : '—', label: 'Average paper score', cap: 'Across marked papers, not a predicted grade' },
    { value: progress?.practiceAnswered ?? '—', label: 'Topic questions answered', cap: 'Lessons, drills and mixed rounds' },
    { value: progress?.streak ?? '—', label: 'Day streak', cap: progress?.streak > 1 ? 'Keep it alive with today’s mission' : 'One mission a day keeps it alive' },
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
          <p className={`exam-countdown ${tone}`} role="status">{examCopy(days)}</p>
        </div>
        {headChip}
      </header>

      <ContinueStrip subjectKey={subjectKey} learnBase={learnBase} />

      <p className="section-label"><span className="section-num">01</span> Your numbers</p>
      <section className="stat-row" aria-label="Your revision numbers">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-num">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-cap">{s.cap}</div>
          </div>
        ))}
      </section>

      <p className="section-label"><span className="section-num">02</span> Up next — do this first</p>
      <NextStepCard
        step={nextStep.step}
        weak={nextStep.weak}
        dueCount={nextStep.dueCount}
        streak={progress?.streak}
        readinessScore={nextStep.readinessScore}
        examDays={nextStep.examDays}
      />

      <p className="section-label"><span className="section-num">03</span> Today — mission, readiness, week</p>
      <StudyDashboard
        userId={userId}
        subject={subjectKey}
        topics={topics}
        progress={progress}
        diagnosticUrl={diagnosticUrl}
        foundation={foundation}
        api={api}
      />

      <ExpertisePath progress={progress} onChooseLesson={() => navigate(learnBase)} />

      <p className="section-label"><span className="section-num">04</span> Sit a timed paper</p>
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

      <p className="section-label"><span className="section-num">05</span> Mastery — weakest first</p>
      <section className="panel" aria-labelledby="mastery-title">
        <h2 id="mastery-title">{masteryTitle}</h2>
        {masteryLoading ? (
          <div className="skeleton-block" role="status" aria-label="Loading mastery"> </div>
        ) : !ranked.some((m) => m.answered > 0) ? (
          <div className="empty-state">
            <h3>No mastery data yet</h3>
            <p>{masteryEmptyHint || 'Answer questions in papers, lessons or mixed rounds and your accuracy appears here, weakest first.'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/practice')}>Start a paper</button>
          </div>
        ) : (
          <div>
            <div className="mastery-leader">
              {ranked.map((m) => {
                const strength = strengthLabel(m.percent);
                return (
                  <div key={m.id} className="mastery-leader-row">
                    <span className="mastery-leader-name">{m.name}</span>
                    <span className="mastery-leader-bar" role="img" aria-label={`${m.name}: ${m.percent != null ? `${m.percent} percent` : 'not tried'}, ${strength.text}`}>
                      <i style={{ width: `${m.percent ?? 0}%` }} />
                    </span>
                    <span className="mastery-leader-pct">{m.percent != null ? `${m.percent}%` : '—'}</span>
                    <Link className="mastery-leader-cta" to={`${learnBase}`}>Practise →</Link>
                  </div>
                );
              })}
            </div>
            <p className="sub small">
              Built from every answer across papers, lessons and mixed rounds. Labels never rely on colour alone —{' '}
              <strong>Secure / Developing / Focus</strong> is always written out. Drill a weak row in{' '}
              <button type="button" className="link link-button" onClick={() => navigate(learnBase)}>Learn</button>.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
