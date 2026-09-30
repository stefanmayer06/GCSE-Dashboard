import { Link, useNavigate } from 'react-router-dom';
import { ExpertisePath, rankForLevel } from './rewards.jsx';
import { MemRiCard, StudyDashboard } from './StudyTools.jsx';
import { MilestoneShelf } from './Milestones.jsx';
import { NextStepCard } from './NextStep.jsx';
import { masteryStage } from './next-step.js';
import { dateKey } from './study.js';
import Emblem, { StrandBadge } from './circuit/Emblem.jsx';
import IsoTile from './circuit/IsoTile.jsx';
import Icon from './circuit/Icon.jsx';
import Pip from './circuit/Pip.jsx';
import { ProgressRing, Stars, WeekStrip } from './circuit/bits.jsx';
import { hueVar, starsFor, strandInfo } from './circuit/palette.js';

// Circuit Home — shared by Maths (Foundation + Higher) and English.
//
// Composition (a bento board, not a stack of equal panels):
//   hero      Up-next continue card  |  streak week + level ring
//   strip     four honest numbers with custom glyphs
//   map       the next five level tiles on your path → the full map
//   week      mission + readiness + 7-day plan (StudyDashboard)
//   shapes    the emblem collection: every topic, built from marks
//   boss      timed papers as boss levels
//   proof     level/badges, memory checks, milestones
// Test contract kept: h1, .stat-card, .mission-card, .week-plan,
// .plan-card, .expertise-path, .papers-grid, .paper-card, .btn.

function examCopy(days, dateStr) {
  if (days == null) return 'Set your exam date to start the countdown';
  if (days < 0) return 'Exam date passed. Keep your results for resits or next steps';
  if (days === 0) return 'Exam today. Good luck. Keep your warm-up short';
  if (days === 1) return '1 day to go. Do one short review';
  if (days <= 14) return `${days} days to go. Every session counts`;
  if (days > 365) {
    const at = Date.parse(dateStr ? `${dateStr}T12:00:00` : '');
    const month = Number.isFinite(at) ? new Date(at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : null;
    return month ? `Exams ${month}. Build a steady weekly habit` : 'Exam date set. Keep your practice steady';
  }
  return `${days} days to go. Keep your practice steady`;
}

function examTone(days) {
  if (days == null || days < 0) return '';
  if (days <= 14) return 'urgent';
  if (days <= 45) return 'soon';
  return 'settled';
}

function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Mon→Sun of this week: 'done' where a plan day was completed.
function weekDays(personal) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const days = personal?.plan?.days || [];
  const states = [];
  for (let index = 0; index < 7; index += 1) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    const key = dateKey(day);
    const row = days.find((item) => item.date === key);
    states.push(row?.status === 'done' ? 'done' : row?.status === 'rest' || row?.rest ? 'rest' : 'open');
  }
  return { states, today: (now.getDay() + 6) % 7 };
}

function ContinueStrip({ subjectKey }) {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(`gcse-continue:${subjectKey}`) || 'null');
  } catch {}
  if (!saved?.href || !saved?.label) return null;
  return (
    <div className="continue-strip" role="note" aria-label="Continue where you left off">
      <span className="continue-icon" aria-hidden="true"><Icon name="replay" size={40} strokeWidth={1.5} /></span>
      <div>
        <strong>Pick up where you left off</strong>
        <span>{saved.label}{saved.detail ? ` · ${saved.detail}` : ''}</span>
      </div>
      <Link className="btn btn-primary" to={saved.href}>Continue →</Link>
    </div>
  );
}

function SectionTitle({ num, children, action = null }) {
  return (
    <div className="home-section-title">
      <p className="section-label"><span className="section-num">{num}</span> {children}</p>
      {action}
    </div>
  );
}

function PathPreview({ topics, learnBase }) {
  const ordered = topics.slice();
  const start = Math.max(0, ordered.findIndex((topic) => topic.accuracy == null || topic.accuracy < 70));
  const upcoming = ordered.slice(start, start + 5);
  if (!upcoming.length) return null;
  return (
    <ol className="path-preview">
      {upcoming.map((topic, index) => {
        const strand = topic.strand || topic.section;
        const stage = masteryStage(topic.accuracy, topic.answered);
        const state = index === 0 ? 'current' : topic.completed ? 'done' : stage.id === 'new' ? 'new' : 'started';
        return (
          <li key={topic.id} className={`path-step step-${state}`}>
            <Link to={`${learnBase}/${topic.id}`} aria-label={`${topic.name}: ${stage.text}${index === 0 ? ', up next' : ''}`}>
              <IsoTile topicId={topic.id} strand={strand} hue={strandInfo(strand).hue} state={state} stage={stage.id} size={index === 0 ? 118 : 96} />
              <span className="path-step-name">{topic.name}</span>
              <Stars count={starsFor(topic.accuracy, topic.answered)} size={12} label={false} />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function ShapeCollection({ topics, learnBase }) {
  const built = topics.filter((topic) => masteryStage(topic.accuracy, topic.answered).id !== 'new').length;
  return (
    <div className="shape-collection">
      <p className="sub">{built} of {topics.length} emblems started. Each one gains a layer as your marked answers improve — replay a lesson to upgrade it.</p>
      <ul className="shape-grid">
        {topics.map((topic) => {
          const stage = masteryStage(topic.accuracy, topic.answered);
          const strand = topic.strand || topic.section;
          return (
            <li key={topic.id}>
              <Link to={`${learnBase}/${topic.id}`} className={`shape-cell stage-${stage.id}`} style={{ '--strand': hueVar(strandInfo(strand).hue) }} aria-label={`${topic.name}: ${stage.text}`}>
                <Emblem topicId={topic.id} strand={strand} stage={stage.id} size={54} />
                <span className="shape-name">{topic.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const STAT_ICONS = ['practice', 'target', 'check', 'flame'];

export default function DashboardHome({
  subjectKey,
  title,
  subtitle,
  headChip = null,
  progress = null,
  topics = [],
  personal = null,
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
  const week = weekDays(personal);
  const level = progress?.level ?? 1;
  const xpPct = progress?.xpNeeded ? Math.round((progress.xpInto / progress.xpNeeded) * 100) : 0;

  const stats = [
    { value: progress?.testsTaken ?? '—', label: 'Timed papers', cap: 'Each one makes the real thing feel familiar' },
    { value: overall != null ? `${overall}%` : '—', label: 'Average paper score', cap: 'From papers you have marked. No guessing' },
    { value: progress?.practiceAnswered ?? '—', label: 'Questions answered', cap: 'Every one decides what comes back for review' },
    {
      value: progress?.streak > 0 ? progress.streak : '—',
      label: 'Day streak',
      cap: progress?.streak > 0
        ? (progress.streakFreezes > 0 ? 'A streak freeze is banked for rainy days' : 'Rest days pause it — a streak never shatters here')
        : 'Fresh start. Day one is whenever you open this',
    },
  ];

  const ranked = (masteryRows || []).slice().sort((a, b) => (a.percent ?? 101) - (b.percent ?? 101));

  return (
    <div className="page home-page">
      <header className="page-head dash-head">
        <div>
          <p className="eyebrow">{greeting()}{progress ? ` · level ${level} ${rankForLevel(level).toLowerCase()}` : ''}</p>
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
          <div className="dash-head-meta">
            <p className={`exam-countdown ${tone}`} role="status"><Icon name="calendar" size={16} /> {examCopy(days, nextStep.examDate)}</p>
            {headChip}
          </div>
        </div>
      </header>

      <ContinueStrip subjectKey={subjectKey} />

      <div className="home-hero">
        <NextStepCard
          step={nextStep.step}
          weak={nextStep.weak}
          dueCount={nextStep.dueCount}
          streak={progress?.streak}
          readinessScore={nextStep.readinessScore}
          examDays={nextStep.examDays}
          examDate={nextStep.examDate}
          topics={topics}
          subject={subjectKey}
        />
        <aside className="home-side" aria-label="Streak and level">
          <div className="streak-card">
            <div className="streak-top">
              <span className="streak-flame" aria-hidden="true"><Icon name="flame" size={30} /></span>
              <div>
                <b>{progress?.streak ?? 0}</b>
                <span>day streak</span>
              </div>
              {progress?.streakFreezes ? <span className="freeze-chip" title="Streak freezes banked"><Icon name="freeze" size={14} /> {progress.streakFreezes}</span> : null}
            </div>
            <WeekStrip days={week.states} todayIndex={week.today} />
            <p className="streak-note">{progress?.streak > 0 ? 'Rest days pause the streak — they never break it.' : 'One short session starts it. No pressure.'}</p>
          </div>
          <div className="level-ring-card">
            <ProgressRing value={xpPct} size={84} stroke={8} label={`${xpPct}% of the way to level ${level + 1}`}>
              <span className="ring-level"><small>LVL</small>{level}</span>
            </ProgressRing>
            <div>
              <p className="eyebrow">Level {level}</p>
              <strong>{rankForLevel(level)}</strong>
              <span className="sub">{progress ? `${progress.xpInto}/${progress.xpNeeded} XP to ${rankForLevel(level + 1)}` : 'Earn XP from lessons and papers'}</span>
            </div>
          </div>
        </aside>
      </div>

      <section className="stat-row" aria-label="Your revision numbers">
        {stats.map((s, index) => (
          <div className={`stat-card tone-${index}`} key={s.label}>
            <span className="stat-icon" aria-hidden="true"><Icon name={STAT_ICONS[index]} size={20} /></span>
            <div className="stat-num">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-cap">{s.cap}</div>
          </div>
        ))}
      </section>

      {topics.length ? (
        <>
          <SectionTitle num="01" action={<Link className="btn small" to={learnBase}>Open the map <Icon name="arrowRight" size={16} /></Link>}>Your path</SectionTitle>
          <section className="panel path-panel" aria-label="Next levels on your map">
            <PathPreview topics={topics} learnBase={learnBase} />
          </section>
        </>
      ) : null}

      <SectionTitle num="02">This week</SectionTitle>
      <StudyDashboard
        userId={userId}
        subject={subjectKey}
        topics={topics}
        progress={progress}
        diagnosticUrl={diagnosticUrl}
        foundation={foundation}
        api={api}
      />

      <SectionTitle num="03">Shape collection</SectionTitle>
      <section className="panel mastery-panel" aria-labelledby="mastery-title">
        <div className="mastery-panel-head">
          <div>
            <h2 id="mastery-title">{masteryTitle}</h2>
            <p className="sub">A scoreboard you earn — built only from questions you have actually answered.</p>
          </div>
          <Pip mood={ranked.some((m) => m.answered > 0) ? 'happy' : 'calm'} size={56} />
        </div>
        {masteryLoading ? (
          <div className="skeleton-block" role="status" aria-label="Loading mastery"> </div>
        ) : !ranked.some((m) => m.answered > 0) ? (
          <div className="empty-state">
            <h3>Start with a few questions</h3>
            <p>{masteryEmptyHint || 'Once you have answered a few questions, your topic scores will appear here.'}</p>
            <button className="btn btn-primary" onClick={() => navigate(diagnosticUrl)}>Take the 10-question check</button>
          </div>
        ) : (
          <div className="strand-bars">
            {ranked.map((m) => {
              const stage = masteryStage(m.percent, m.answered);
              return (
                <Link key={m.id} to={learnBase} className="strand-bar" style={{ '--strand': hueVar(strandInfo(m.id).hue) }} aria-label={`${m.name}: ${m.percent != null ? `${m.percent} percent over ${m.answered} questions` : 'not tried yet'}, stage ${stage.text}`}>
                  <StrandBadge strand={m.id} size={34} />
                  <span className="strand-bar-name">{m.name}</span>
                  <span className={`v3-stage ${stage.id}`}>{stage.text}</span>
                  <span className="strand-bar-track" aria-hidden="true"><span style={{ width: `${m.percent ?? 0}%` }} /></span>
                  <span className="strand-bar-meta">{m.percent != null ? `${m.percent}% · ${m.answered}` : 'Not tried'}</span>
                </Link>
              );
            })}
          </div>
        )}
        {topics.length ? <ShapeCollection topics={topics} learnBase={learnBase} /> : null}
      </section>

      <SectionTitle num="04">Boss levels</SectionTitle>
      <section className="panel start-panel boss-panel" aria-labelledby="papers-title">
        <h2 id="papers-title">Sit a timed paper</h2>
        <p className="sub">{papers.blurb}</p>
        <div className={`papers-grid${papers.items?.length === 2 ? ' two' : ''}`}>
          {(papers.items || []).map((p, index) => (
            <div key={p.id} className={`paper-card pick ${p.calc ? 'calc' : 'noncalc'}`}>
              <div className="paper-top">
                <span className="paper-type">{p.code}</span>
                <span className={`calc-badge ${p.calc ? 'yes' : 'no'}`}>{p.calcLabel || (p.calc ? 'Calculator' : 'No calculator')}</span>
              </div>
              <div className="paper-boss" aria-hidden="true">
                <IsoTile topicId={`${subjectKey}-paper-${p.id}`} hue={['blue', 'purple', 'coral'][index % 3]} state="boss" size={78} />
                <span className="paper-level">Boss {index + 1}</span>
              </div>
              <div className="paper-desc">{p.blurb}</div>
              <div className="paper-meta-line"><Icon name="clock" size={14} /> {p.meta}</div>
              <div className="paper-actions">
                <button className="btn btn-primary" onClick={() => navigate(p.fullHref)}>{p.fullLabel}</button>
                <button className="btn" onClick={() => navigate(p.shortHref)}>{p.shortLabel}</button>
              </div>
            </div>
          ))}
        </div>
        {adhoc ? (
          <div className="adhoc-cta">
            <Icon name="sparkle" size={24} />
            <div>
              <div className="adhoc-cta-title">{adhoc.title}</div>
              <div className="sub">{adhoc.copy}</div>
            </div>
            <button className="btn btn-go" onClick={() => navigate(adhoc.href)}>{adhoc.cta}</button>
          </div>
        ) : null}
      </section>

      <SectionTitle num="05">Proof it&rsquo;s sticking</SectionTitle>
      <div className="proof-grid">
        <ExpertisePath progress={progress} onChooseLesson={() => navigate(learnBase)} />
        <MemRiCard userId={userId} subject={subjectKey} api={api} />
        <MilestoneShelf progress={progress} subjectName={title.replace('Your ', '')} api={api} />
      </div>
    </div>
  );
}
