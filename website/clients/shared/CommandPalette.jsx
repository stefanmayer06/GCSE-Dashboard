import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 2.1 — Global quick jump (Ctrl/⌘+K).
//
// Dependency-free command palette over routes the learner can already
// reach. Topics are passed in by the shell (already cached); filtering
// is a local substring match capped for speed. Fully keyboard
// operable, announces result counts, respects reduced motion via CSS.
export default function CommandPalette({ items = [] }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 9);
    return items
      .filter((item) => `${item.label} ${item.group || ''} ${item.keywords || ''}`.toLowerCase().includes(q))
      .slice(0, 9);
  }, [items, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setActive(0);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [open ]);

  useEffect(() => {
    const onKey = (event) => {
      const isJump = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
      if (isJump) {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        className="palette-trigger"
        onClick={() => setOpen(true)}
        aria-label="Quick jump to any page or topic (Control K)"
      >
        <span aria-hidden="true">⌘K</span>
        <span className="palette-trigger-label">Quick jump</span>
      </button>
    );
  }

  const go = (href) => {
    setOpen(false);
    if (href) navigate(href);
  };

  return (
    <div className="palette-backdrop" onClick={() => setOpen(false)}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Quick jump"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="palette-head">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive((index) => Math.min(index + 1, Math.max(0, results.length - 1)));
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));
              } else if (event.key === 'Enter') {
                event.preventDefault();
                const pick = results[active] || results[0];
                if (pick) go(pick.href);
              }
            }}
            placeholder="Jump to practice, a lesson, notebook…"
            aria-label="Jump to a page or topic"
            aria-expanded="true"
            aria-controls="palette-list"
            role="combobox"
            aria-autocomplete="list"
          />
          <button type="button" className="palette-esc" onClick={() => setOpen(false)} aria-label="Close quick jump">
            Esc
          </button>
        </div>
        <p className="palette-count" role="status">
          {results.length === 0 ? 'No matches — try a topic or page name.' : `${results.length} match${results.length === 1 ? '' : 'es'}`}
        </p>
        <ul id="palette-list" ref={listRef} role="listbox" aria-label="Matches" className="palette-list">
          {results.map((item, index) => (
            <li key={`${item.group || ''}:${item.href}:${item.label}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                className={`palette-item${index === active ? ' active' : ''}`}
                onClick={() => go(item.href)}
                onMouseEnter={() => setActive(index)}
              >
                <span className="palette-item-label">{item.label}</span>
                <span className="palette-item-meta">{item.group}{item.hint ? ` · ${item.hint}` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
