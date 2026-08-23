import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
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
  const [topics, setTopics] = useState(null);

  useEffect(() => {
    api.topics().then(setTopics).catch(() => {});
  }, []);

  const mastery = useMemo(() => {
    if (!topics || !progress) return null;
    const stats = progress.topicStats || {};
    const out = [];
    for (const s of STRAND_NAMES_LIST) {
      let correct = 0;
      let total = 0;
      for (const t of topics.strands[s.id]?.topics || []) {
        const st = stats[t.id];
        if (st) {
          correct += st.correct;
          total += st.total;
        }
      }
      out.push({
        id: s.id,
        name: s.name,
        color: STRAND_COLORS[s.id],
        percent: total ? Math.round((100 * correct) / total) : null,
        answered: total,
      });
    }
    return out;
  }, [topics, progress]);

  const anyMastery = mastery?.some((m) => m.answered > 0);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Your Maths revision</h1>
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
          <div className="stat-num">{progress?.streak ?? '—'}</div>
          <div className="stat-label">Day streak</div>
        </div>
      </section>

      <section className="panel start-panel">
        <h2>Start a practice paper</h2>
        <p className="sub">
          All three AQA foundation papers — built from the bank of {health?.bankSize?.toLocaleString() ?? '1000+'} questions with
          AQA&apos;s per-paper topic allocation, a difficulty ramp and stretch questions. Predicted grade
          from averaged past boundaries, worked solutions and revision links for everything you miss.
        </p>
        <div className="papers-grid">
          {[
            { id: 1, code: '8300/1F', name: 'Paper 1', calc: false, blurb: 'Non-calculator. Number, Algebra, Ratio, Probability & Statistics.' },
            { id: 2, code: '8300/2F', name: 'Paper 2', calc: true, blurb: 'Calculator. Algebra, Ratio, Geometry, Probability & Statistics.' },
            { id: 3, code: '8300/3F', name: 'Paper 3', calc: true, blurb: 'Calculator. Number, Ratio, Geometry, Probability & Statistics.' },
          ].map((p) => (
            <div key={p.id} className={`paper-card pick ${p.calc ? 'calc' : 'noncalc'}`}>
              <div className="paper-top">
                <span className="paper-type">{p.code}</span>
                <span className={`calc-badge ${p.calc ? 'yes' : 'no'}`}>
                  {p.calc ? 'Calculator' : 'No calculator'}
                </span>
              </div>
              <div className="paper-desc">{p.blurb}</div>
              <div className="paper-actions">
                <button className="btn btn-primary" onClick={() => navigate(`/practice?paper=${p.id}&type=full`)}>
                  Full · 80 marks
                </button>
                <button className="btn" onClick={() => navigate(`/practice?paper=${p.id}&type=short`)}>
                  Quick · 40 marks
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="adhoc-cta">
          <div>
            <div className="adhoc-cta-title">Mixed practice</div>
            <div className="sub">Ad-hoc questions mixed from all three papers — 10, 15 or 20 at a time.</div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/practice#adhoc')}>Ad-hoc round →</button>
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
          <h2>Topic mastery by strand</h2>
          {!mastery ? (
            <div className="loading">Loading mastery…</div>
          ) : !anyMastery ? (
            <>
              <p className="empty">No mastery data yet — accuracy appears here once you answer questions in papers, practice or ad-hoc rounds.</p>
              <button className="btn btn-primary" onClick={() => navigate('/practice')}>Start a paper</button>
            </>
          ) : (
            <div>
              {mastery.map((m) => (
                <div key={m.id} className="mastery-row">
                  <span className="strand-dot" style={{ background: m.color }} />
                  <span className="mastery-name">{m.name}</span>
                  <div className="mastery-bar">
                    <div
                      className="mastery-fill"
                      style={{
                        width: `${m.percent ?? 0}%`,
                        background: m.percent != null && m.percent >= 70 ? 'var(--green)' : m.percent != null && m.percent >= 40 ? 'var(--amber)' : 'var(--red)',
                      }}
                    />
                  </div>
                  <span className="mastery-pct">{m.percent != null ? `${m.percent}%` : '—'}</span>
                </div>
              ))}
              <p className="sub small">
                Built from your answers across papers, topic practice and ad-hoc rounds. Drill a
                weak strand in <button type="button" className="link link-button" onClick={() => navigate('/learn')}>Learn</button>.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
