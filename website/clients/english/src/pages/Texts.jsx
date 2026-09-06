import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useResource } from '../../../shared/resource-cache.js';

export default function Texts() {
  // Static course content: cached for the whole session, no user scope needed.
  const { data, error } = useResource('texts:english', () => api.texts());
  const [query,setQuery] = useState('');
  const texts = data?.texts ?? null;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>The source library</h1>
          <p className="sub">
            Every source used in the practice papers: Paper 1 fiction extracts and Paper 2
            source pairs (19th century + modern). Read them here before or after you meet them
            in an exam.
          </p>
        </div>
      </header>
      <label className="studio-search"><span>Find a source or author</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the source library…"/></label>
      {!texts && !error && <div className="loading">Loading texts…</div>}
      {error && !texts && <div className="loading">Could not load the text library. Check your connection and try again.</div>}
      {texts && (
        <div className="texts-grid">
          {texts.filter(t=>`${t.title} ${t.author}`.toLowerCase().includes(query.toLowerCase())).map((t) => (
            <Link key={t.id} to={`/texts/${t.id}`} className="text-card">
              <div className="text-card-paper">{t.paper}</div>
              <div className="text-card-title">{t.title}</div>
              <div className="text-card-author">{t.author}</div>
              <div className="text-card-excerpt">{t.excerpt}…</div>
              <div className="topic-go">Read →</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
