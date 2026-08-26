import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Learn() {
  const higherTier = window.location.pathname.startsWith('/maths-higher');
  const [data, setData] = useState(null);
  const [open, setOpen] = useState({ number: true });

  useEffect(() => {
    api.topics().then(setData).catch(() => {});
  }, []);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Learn</h1>
          <p className="sub">
             Every AQA {higherTier ? 'Higher' : 'Foundation'} topic: bite-size notes, worked examples, practice questions and
            free external resources.
          </p>
        </div>
      </header>
      {!data && <div className="loading">Loading topics…</div>}
      {data &&
        Object.values(data.strands).map((s) => (
          <section key={s.id} className="panel strand-panel">
            <button
              className="strand-head"
              onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
            >
              <span className="strand-dot" style={{ background: s.color }} />
              <h2>{s.name}</h2>
              <span className="strand-blurb">{s.blurb}</span>
              <span className="strand-weight">{s.weight}% of exam</span>
              <span className="chev">{open[s.id] ? '▾' : '▸'}</span>
            </button>
            {open[s.id] && (
              <div className="topic-grid">
                {s.topics.map((t) => (
                  <Link key={t.id} to={`/learn/${t.id}`} className="topic-card">
                    <div className="topic-name">{t.name}</div>
                    <div className="topic-blurb">{t.blurb}</div>
                    {t.completed && <div className="lesson-stamp">Lesson completed</div>}
                    <div className="topic-foot">
                      <span className="topic-acc">
                        {t.accuracy != null ? (
                          <span className={`acc-pill ${t.accuracy >= 70 ? 'good' : t.accuracy >= 40 ? 'mid' : 'low'}`}>
                            {t.accuracy}%
                          </span>
                        ) : (
                          <span className="acc-pill new">not practised</span>
                        )}
                      </span>
                      <span className="topic-go">Study →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ))}
    </div>
  );
}
