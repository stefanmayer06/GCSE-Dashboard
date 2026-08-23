import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { SECTION_NAMES } from '../colors.js';

export default function Dashboard({ health, progress }) {
  const navigate = useNavigate();
  const recent = progress?.history?.slice(0, 10).reverse() || [];
  const maxBar = Math.max(1, ...recent.map((h) => h.percent ?? 0));
  const overall = progress?.overallPercent;
  const [topics, setTopics] = useState(null);

  useEffect(() => {
    api.topics().then(setTopics).catch(() => {});
  }, []);

  const mastery = useMemo(() => {
    if (!topics || !progress) return null;
    const stats = progress.topicStats || {};
    return Object.entries(SECTION_NAMES).map(([id, name]) => {
      let correct = 0;
      let total = 0;
      for (const t of topics.sections[id]?.topics || []) {
        const st = stats[t.id];
        if (st) {
          correct += st.correct;
          total += st.total;
        }
      }
      return {
        id,
        name,
        color: id === 'reading' ? '#7c5cff' : '#e8b44c',
        percent: total ? Math.round((100 * correct) / total) : null,
        answered: total,
      };
    });
  }, [topics, progress]);

  const anyMastery = mastery?.some((m) => m.answered > 0);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Your English revision</h1>
          <p className="sub">AQA GCSE English Language (8700) — both papers, real timings, real mark schemes.</p>
        </div>
        {health && (
          <div className="head-chip">
            <span className="dot-live" /> {health.texts} source texts · {health.aiMarking ? 'AI marking ready' : 'AI marking needs a key'}
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
          <div className="stat-label">Questions attempted</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{progress?.streak ?? '—'}</div>
          <div className="stat-label">Day streak</div>
        </div>
      </section>

      <section className="panel start-panel">
        <h2>Start a practice paper</h2>
        <p className="sub">
          Two papers, exactly like the real exam: 1 hour 45 minutes each, five questions from 4 to
          40 marks. Your reading answers are AI-marked against summarised AQA mark schemes; the
          40-mark writing tasks get full AO5 + AO6 marking with model answers and targets.
        </p>
        <div className="papers-grid two">
          <div className="paper-card pick">
            <div className="paper-top">
              <span className="paper-type">8700/1</span>
              <span className="calc-badge yes">Fiction extract</span>
            </div>
            <div className="paper-desc">
              Explorations in Creative Reading and Writing. Q1 list (4) · Q2 language (8) ·
              Q3 structure (8) · Q4 evaluate (20) · Q5 creative writing (40).
            </div>
            <div className="paper-actions">
              <button className="btn btn-primary" onClick={() => navigate('/practice?paper=1&type=full')}>
                Full · 80 marks · 1h45
              </button>
              <button className="btn" onClick={() => navigate('/practice?paper=1&type=short')}>
                Quick · Q1+Q5 · 50 min
              </button>
            </div>
          </div>
          <div className="paper-card pick">
            <div className="paper-top">
              <span className="paper-type">8700/2</span>
              <span className="calc-badge yes">Two sources</span>
            </div>
            <div className="paper-desc">
              Writers&apos; Viewpoints and Perspectives. Q1 true/false (4) · Q2 summary (8) ·
              Q3 language (12) · Q4 compare (16) · Q5 writing to argue (40).
            </div>
            <div className="paper-actions">
              <button className="btn btn-primary" onClick={() => navigate('/practice?paper=2&type=full')}>
                Full · 80 marks · 1h45
              </button>
              <button className="btn" onClick={() => navigate('/practice?paper=2&type=short')}>
                Quick · Q1+Q5 · 50 min
              </button>
            </div>
          </div>
        </div>
        <div className="adhoc-cta">
          <div>
            <div className="adhoc-cta-title">Quick-fire practice</div>
            <div className="sub">Quick-fire rounds: list four things, true/false and language analysis from any text in the bank.</div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/practice#adhoc')}>Quick-fire round →</button>
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
                <div key={h.id} className="chart-col" title={`${h.percent ?? '—'}% — ${h.type}`}>
                  <div className="chart-bar-wrap">
                    <div
                      className={`chart-bar ${(h.percent ?? 0) >= 50 ? 'ok' : 'bad'}`}
                      style={{ height: `${Math.max(6, ((h.percent ?? 0) / maxBar) * 100)}%` }}
                    />
                  </div>
                  <div className="chart-pct">{h.percent ?? '—'}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="panel">
          <h2>Skill accuracy</h2>
          {!mastery ? (
            <div className="loading">Loading your accuracy…</div>
          ) : !anyMastery ? (
            <>
              <p className="empty">No accuracy data yet — it appears here once you answer questions in papers, drills or quick-fire rounds.</p>
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
                Built from every question you answer. Drill a weak skill in{' '}
                <button type="button" className="link link-button" onClick={() => navigate('/learn')}>Learn</button>.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
