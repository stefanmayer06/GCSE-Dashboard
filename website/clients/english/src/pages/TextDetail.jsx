import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useResource } from '../../../shared/resource-cache.js';

export default function TextDetail() {
  const { textId } = useParams();
  const { data: text } = useResource(textId ? `text:${textId}` : null, () => api.text(textId));
  const [tab, setTab] = useState('A');

  useEffect(() => {
    setTab('A');
  }, [textId]);

  if (!text) return <div className="page"><div className="loading">Loading…</div></div>;

  const isPair = !!text.textB;

  return (
    <div className="page topic-page">
      <Link to="/texts" className="back-link">← All texts</Link>
      <header className="page-head">
        <div>
          <h1>{text.title}</h1>
          <p className="sub">{text.paper} · {text.kind} · {text.century}</p>
        </div>
        {text.gutenberg && (
          <a className="btn" href={text.gutenberg} target="_blank" rel="noreferrer">
            📖 Full text on Project Gutenberg
          </a>
        )}
      </header>

      {isPair ? (
        <>
          <div className="source-tabs">
            <button className={`source-tab ${tab === 'A' ? 'on' : ''}`} onClick={() => setTab('A')}>
              Source A · {text.textMetaA.title} ({text.textMetaA.century})
            </button>
            <button className={`source-tab ${tab === 'B' ? 'on' : ''}`} onClick={() => setTab('B')}>
              Source B · {text.textMetaB.title} ({text.textMetaB.century})
            </button>
          </div>
          <section className="panel">
            <div className="source-meta">
              <span className="source-title">
                {tab === 'A' ? text.textMetaA.title : text.textMetaB.title}
              </span>
              <span className="source-byline">
                {tab === 'A'
                  ? `${text.textMetaA.author}, ${text.textMetaA.year}`
                  : `${text.textMetaB.author}, ${text.textMetaB.year}`}
              </span>
              <span className="source-flag">{text.source}</span>
            </div>
            <div className="text-detail-source">
              {(tab === 'A' ? text.textA : text.textB).split('\n\n').map((p, i) => (
                <p key={i} style={{ marginBottom: 14 }}>{p}</p>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="source-meta">
            <span className="source-title">{text.title}</span>
            <span className="source-byline">{text.author}, {text.year}</span>
            <span className="source-flag">{text.source}</span>
          </div>
          <div className="text-detail-source">
            {text.text.split('\n\n').map((p, i) => (
              <p key={i} style={{ marginBottom: 14 }}>{p}</p>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Practise with this text</h2>
        <p className="sub">
          This text appears in the practice papers and quick-fire rounds — start a paper and you
          may meet it there.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn btn-primary" to="/practice">Start a paper →</Link>
          <Link className="btn" to="/practice#adhoc">Quick-fire round →</Link>
        </div>
      </section>
    </div>
  );
}