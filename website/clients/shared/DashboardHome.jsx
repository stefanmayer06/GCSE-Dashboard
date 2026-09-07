import { Link, useNavigate } from 'react-router-dom';
import { ExpertisePath } from './rewards.jsx';
import { MemRiCard, StudyDashboard } from './StudyTools.jsx';
import { MilestoneShelf } from './Milestones.jsx';
import { NextStepCard } from './NextStep.jsx';
import { masteryStage } from './next-step.js';

// V4 Desk Edition — Today view shared by Maths + English.
//
// One hierarchy for every subject, ordered by what a learner needs:
//   01 Your next move (hero: readiness ring, streak/readiness/exam stickers)
//   02 Where you stand (four honest numbers, each with its own hue + so-what)
//   03 This week (mission + readiness + the 7-day trail via StudyDashboard)
//   04 The mastery trail (strand-coloured scoreboard, weakest first)
//   05 Exam practice (paper tickets + mixed practice)
//   06 Proof it's sticking (level, badges, memory checks, milestones)
// Class names stay on the frozen contract (.page, .page-head, .stat-row,
// .stat-card, .panel, .paper-card, .btn, .v3-mastery, .week-plan…) so
// Playwright keeps passing. Visuals live in v4-dashboard.css.

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

const STAT_TONES = ['tone-paper', 'tone-score', 'tone-answered', 'tone-streak'];

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
    ? (progress.streakFreezes > 0
      ? 'You have a streak freeze banked for rainy days'
      : 'Rest days pause it — a streak never shatters here')
    : 'Fresh start. Day one is whenever you open this';
  const stats = [
    { value: progress?.testsTaken ?? '—', label: 'Timed papers', cap: 'Each one makes the real thing feel familiar' },
    { value: overall != null ? `${overall}%` : '—', label: 'Average paper score', cap: 'From papers you have marked. No guessing' },
    { value: progress?.practiceAnswered ?? '—', label: 'Questions answered', cap: 'Every one decides what comes back for review' },
    { value: progress?.streak > 0 ? progress.streak : '—', label: 'Day streak', cap: streakCap },
  ];

  const ranked = (masteryRows || [])
    .slice()
    .sort((a, b) => (a.percent ?? 101) - (b.percent ?? 101));

  return (
    <div className="page v3-dashboard">
      <header className="page-head dash-head">
        <div>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
          <div className="dash-head-meta">
            <p className={`exam-countdown ${tone}`} role="status">{examCopy(days, nextStep.examDate)}</p>
            {headChip}
          </div>
        </div>
      </header>

      <ContinueStrip subjectKey={subjectKey} learnBase={learnBase} />

      <p className="section-label"><span className="section-num">01</span> Your next move</p>
      <NextStepCard
        step={nextStep.step}
        weak={nextStep.weak}
        dueCount={nextStep.dueCount}
        streak={progress?.streak}
        readinessScore={nextStep.readinessScore}
        examDays={nextStep.examDays}
        examDate={nextStep.examDate}
      />

      <p className="section-label"><span className="section-num">02</span> Where you stand</p>
      <section className="stat-row" aria-label="Your revision numbers">
        {stats.map((s, index) => (
          <div className={`stat-card ${STAT_TONES[index % STAT_TONES.length]}`} key={s.label}>
            <div className="stat-num">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-cap">{s.cap}</div>
          </div>
        ))}
      </section>

      <p className="section-label"><span className="section-num">03</span> This week</p>
      <StudyDashboard
        userId={userId}
        subject={subjectKey}
        topics={topics}
        progress={progress}
        diagnosticUrl={diagnosticUrl}
        foundation={foundation}
        api={api}
      />

      <p className="section-label"><span className="section-num">04</span> The mastery trail</p>
      <section className="panel mastery-panel" aria-labelledby="mastery-title">
        <h2 id="mastery-title">{masteryTitle}</h2>
        <p className="sub">A scoreboard you earn — built only from questions you have actually answered.</p>
        <div className="mastery-legend" aria-label="What the stage labels mean">
          <span><span className="v3-stage new">New</span> not tried yet</span>
          <span><span className="v3-stage learning">Learning</span> just started</span>
          <span><span className="v3-stage developing">Developing</span> getting there</span>
          <span><span className="v3-stage secure">Secure</span> it&rsquo;s sticking</span>
          <span><span className="v3-stage mastered">Mastered</span> yours for good</span>
        </div>
        {masteryLoading ? (
          <div className="skeleton-block" role="status" aria-label="Loading mastery"> </div>
        ) : !ranked.some((m) => m.answered > 0) ? (
          <div className="empty-state">
            <h3>Start with a few questions</h3>
            <p>{masteryEmptyHint || 'Once you have answered a few questions, your topic scores will appear here.'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/practice')}>Start a paper</button>
          </div>
        ) : (
          <div>
            <div className="v3-mastery">
              {ranked.map((m) => {
                const stage = masteryStage(m.percent, m.answered);
                const strand = m.color || 'var(--accent)';
                return (
                  <Link
                    key={m.id}
                    to={`${learnBase}`}
                    className="v3-mastery-row"
                    style={{ '--strand': strand }}
                    aria-label={`${m.name}: ${m.percent != null ? `${m.percent} percent over ${m.answered} questions` : 'not tried yet'}, stage ${stage.text}`}
                  >
                    <span className="v3-mastery-name">
                      <i className="strand-dot" aria-hidden="true" style={{ background: strand }} />
                      {m.name}
                    </span>
                    <span className={`v3-stage ${stage.id}`}>{stage.text}</span>
                    <span className="v3-mastery-track" role="img" aria-hidden="true">
                      <span className="v3-mastery-fill" style={{ width: `${m.percent ?? 0}%`, background: strand }} />
                    </span>
                    <span className="v3-mastery-meta">{m.percent != null ? `${m.percent}% · ${m.answered} answered` : 'Not tried yet'}</span>
                  </Link>
                );
              })}
            </div>
            <p className="sub small">
              These scores update whenever you answer a question. Pick a topic to practise in{' '}
              <button type="button" className="link link-button" onClick={() => navigate(learnBase)}>Learn</button>.
            </p>
          </div>
        )}
      </section>

      <p className="section-label"><span className="section-num">05</span> Exam practice</p>
      <section className="panel start-panel" aria-labelledby="papers-title">
        <h2 id="papers-title">Sit a timed paper</h2>
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

      <p className="section-label"><span className="section-num">06</span> Proof it&rsquo;s sticking</p>
      <ExpertisePath progress={progress} onChooseLesson={() => navigate(learnBase)} />

      <MemRiCard userId={userId} subject={subjectKey} api={api} />

      <MilestoneShelf progress={progress} subjectName={title.replace('Your ', '')} api={api} />
    </div>
  );
}
