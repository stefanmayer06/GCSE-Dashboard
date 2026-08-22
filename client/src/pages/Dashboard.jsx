import { useNavigate } from 'react-router-dom';
import { STRAND_COLORS } from '../colors.js';

const STRAND_NAMES_LIST = [
  { id: 'number', name: 'Number' },
  { id: 'algebra', name: 'Algebra' },
  { id: 'ratio', name: 'Ratio & Proportion' },
  { id: 'geometry', name: 'Geometry & Measures' },
  { id: 'probability', name: 'Probability' },
  { id: 'statistics', name: 'Statistics' },
];

export default function Dashboard({ health, progress }) {
  const navigate = useNavigate();
  const recent = progress?.history?.slice(0, 10).reverse() || [];
  const maxBar = Math.max(1, ...recent.map((h) => h.percent));
  const overall = progress?.overallPercent;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Welcome back, champ 💪</h1>
          <p className="sub">AQA GCSE Maths Foundation — train like it&apos;s exam day.</p>
        </div>
        {health && (
          <div className="head-chip">
            <span className="dot-live" /> {health.bankSize?.toLocaleString()} questions live
          </div>
        )}
      </header>

      <section className="stat-row">
        <div className="stat-card">
          <div className="stat-num">{progress?.testsTaken ?? '—'}</div>
          <div className="stat-label">Practice papers completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{overall != null ? `${overall}%` : '—'}</div>
          <div className="stat-label">Average paper score</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{progress?.practiceAnswered ?? '—'}</div>
          <div className="stat-label">Topic questions answered</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">🔥 {progress?.streak ?? '—'}</div>
          <div className="stat-label">Day streak</div>
        </div>
      </section>

      <section className="panel start-panel">
        <h2>Start a practice paper</h2>
        <p className="sub">
          Built from the bank of {health?.bankSize?.toLocaleString() ?? '1000+'} questions, weighted exactly like an AQA paper.
          You&apos;ll get a predicted grade from averaged past boundaries, worked solutions and revision links for anything you miss.
        </p>
        <div className="paper-cards">
          <button className="paper-card full" onClick={() => navigate('/practice?type=full')}>
            <div className="paper-type">FULL PAPER</div>
            <div className="paper-meta">80 marks · 90 minutes</div>
            <div className="paper-desc">One full AQA-style foundation paper. 1 mark a minute is the pace to beat.</div>
            <span className="paper-go">Start →</span>
          </button>
          <button className="paper-card short" onClick={() => navigate('/practice?type=short')}>
            <div className="paper-type">QUICK PAPER</div>
            <div className="paper-meta">40 marks · 45 minutes</div>
            <div className="paper-desc">A shorter hit of exam practice when you don&apos;t have a full 90 minutes.</div>
            <span className="paper-go">Start →</span>
          </button>
        </div>
      </section>

      <section className="two-col">
        <div className="panel">
          <h2>Recent papers</h2>
          {recent.length === 0 ? (
            <p className="empty">No papers yet — your results will chart here.</p>
          ) : (
            <div className="chart">
              {recent.map((h) => (
                <div key={h.id} className="chart-col" title={`${h.percent}% — ${h.type}`}>
                  <div className="chart-bar-wrap">
                    <div
                      className={`chart-bar ${h.percent >= 50 ? 'ok' : 'bad'}`}
                      style={{ height: `${Math.max(6, (h.percent / maxBar) * 100)}%` }}
                    />
                  </div>
                  <div className="chart-pct">{h.percent}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel">
          <h2>Topic mastery</h2>
          {STRAND_NAMES_LIST.map((s) => (
            <div key={s.id} className="strand-row">
              <span className="strand-dot" style={{ background: STRAND_COLORS[s.id] }} />
              <span className="strand-name">{s.name}</span>
              <span className="strand-hint">mastery unlocks as you practise</span>
            </div>
          ))}
          <p className="sub small">
            Mastery builds from topic practice and paper questions. Head to{' '}
            <a className="link" onClick={() => navigate('/learn')}>Learn</a> to study and drill each topic.
          </p>
        </div>
      </section>
    </div>
  );
}