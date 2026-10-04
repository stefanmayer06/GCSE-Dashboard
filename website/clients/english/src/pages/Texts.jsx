import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { preloadResource, useResource } from '../../../shared/resource-cache.js';

const TEXTS_KEY = 'texts:english';

// Loads the library behind the sign-in splash when Texts is the landing page.
export function preload() {
  return preloadResource(TEXTS_KEY, () => api.texts());
}

export default function Texts() {
  // Static course content: cached for the whole session, no user scope needed.
  const { data, error } = useResource(TEXTS_KEY, () => api.texts());
  const texts = data?.texts ?? null;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>The Texts</h1>
          <p className="sub">
            Current practice sources: six original contemporary fiction passages for Paper 1,
            and Paper 2 pairs of 19th-century non-fiction and modern original non-fiction in either order.
            Read them before or after a practice set. These are independent practice materials;
            use official AQA samples as well for published exam passages.
          </p>
        </div>
      </header>
      {!texts && !error && <div className="loading">Loading texts…</div>}
      {error && !texts && <div className="loading">Could not load the text library. Check your connection and try again.</div>}
      {texts && (
        <div className="texts-grid">
          {texts.map((t) => (
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
