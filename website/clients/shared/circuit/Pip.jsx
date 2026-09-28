import { useId } from 'react';

// Pip — the Study Desk guide. A round volt "shape" with a quadrant belly
// (the emblem grammar) and a star antenna. Pip appears in the tutor chat,
// empty states, lesson checkpoints and celebrations — never as decoration
// on dense work screens. Moods change the eyes and mouth only, so Pip stays
// recognisable at 24px.
//
// mood: 'happy' | 'think' | 'cheer' | 'wow' | 'calm'

function Eyes({ mood }) {
  if (mood === 'cheer') {
    return (
      <g fill="none" stroke="var(--pip-ink)" strokeWidth="4" strokeLinecap="round">
        <path d="M31 47q6-7 12 0" />
        <path d="M57 47q6-7 12 0" />
      </g>
    );
  }
  if (mood === 'calm') {
    return (
      <g fill="none" stroke="var(--pip-ink)" strokeWidth="4" strokeLinecap="round">
        <path d="M31 47q6 5 12 0" />
        <path d="M57 47q6 5 12 0" />
      </g>
    );
  }
  const look = mood === 'think' ? { x: 3, y: -4 } : { x: 0, y: 0 };
  const r = mood === 'wow' ? 8 : 7;
  return (
    <g>
      <ellipse cx={37 + look.x} cy={46 + look.y} rx={r} ry={r + 1} fill="var(--pip-ink)" />
      <ellipse cx={63 + look.x} cy={46 + look.y} rx={r} ry={r + 1} fill="var(--pip-ink)" />
      <circle cx={39.5 + look.x} cy={43 + look.y} r="2.4" fill="#fff" />
      <circle cx={65.5 + look.x} cy={43 + look.y} r="2.4" fill="#fff" />
    </g>
  );
}

function Mouth({ mood }) {
  if (mood === 'wow') return <ellipse cx="50" cy="62" rx="5" ry="6" fill="var(--pip-ink)" />;
  if (mood === 'think') return <path d="M44 62h11" stroke="var(--pip-ink)" strokeWidth="4" strokeLinecap="round" />;
  if (mood === 'cheer') return <path d="M40 58q10 13 20 0z" fill="var(--pip-ink)" stroke="var(--pip-ink)" strokeWidth="3" strokeLinejoin="round" />;
  return <path d="M42 59q8 8 16 0" fill="none" stroke="var(--pip-ink)" strokeWidth="4" strokeLinecap="round" />;
}

export default function Pip({ mood = 'happy', size = 64, title = null, className = '', bob = false }) {
  const clipId = `pip-belly-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className={`pip pip-${mood}${bob ? ' pip-bob' : ''} ${className}`.trim()}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <ellipse cx="50" cy="94" rx="24" ry="4.5" fill="var(--tile-shadow)" />
      {/* antenna */}
      <path d="M50 20V9" stroke="var(--pip-ink)" strokeWidth="3.5" strokeLinecap="round" />
      <path className="pip-star" d="m50 1.5 2.4 4.6 5 .6-3.7 3.4 1 5-4.7-2.5-4.7 2.5 1-5-3.7-3.4 5-.6z" fill="var(--hue-amber)" stroke="var(--pip-ink)" strokeWidth="2" strokeLinejoin="round" />
      {/* feet */}
      <ellipse cx="38" cy="88" rx="9" ry="5" fill="var(--pip-ink)" />
      <ellipse cx="62" cy="88" rx="9" ry="5" fill="var(--pip-ink)" />
      {/* body */}
      <circle cx="50" cy="52" r="34" fill="var(--pip-body)" />
      {/* two-tone base band with a quadrant buckle: the emblem grammar */}
      <clipPath id={clipId}>
        <circle cx="50" cy="52" r="32" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x="14" y="72" width="72" height="20" fill="var(--hue-blue)" />
      </g>
      <path d="M19.5 72h61" stroke="var(--pip-ink)" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(50 79)" stroke="var(--pip-ink)" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M0 0V-6A6 6 0 0 1 6 0Z" fill="var(--hue-volt)" />
        <path d="M0 0H6A6 6 0 0 1 0 6Z" fill="var(--hue-purple)" />
        <path d="M0 0V6A6 6 0 0 1 -6 0Z" fill="var(--hue-volt)" />
        <path d="M0 0H-6A6 6 0 0 1 0 -6Z" fill="var(--hue-purple)" />
      </g>
      {/* cheeks */}
      <ellipse cx="27" cy="56" rx="5" ry="3" fill="var(--hue-coral)" opacity="0.55" />
      <ellipse cx="73" cy="56" rx="5" ry="3" fill="var(--hue-coral)" opacity="0.55" />
      <circle cx="50" cy="52" r="34" fill="none" stroke="var(--pip-ink)" strokeWidth="4" />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
    </svg>
  );
}
