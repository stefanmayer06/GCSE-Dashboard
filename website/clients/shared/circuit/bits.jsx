import { quadrantPath } from './Emblem.jsx';
import Icon from './Icon.jsx';

// Small reward + progress graphics shared by every screen.

export function Stars({ count = 0, max = 3, size = 18, label = true, className = '' }) {
  const safe = Math.max(0, Math.min(max, count));
  return (
    <span
      className={`c-stars ${className}`.trim()}
      role={label ? 'img' : undefined}
      aria-label={label ? `${safe} of ${max} stars` : undefined}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: max }, (_, index) => (
        <svg key={index} className={index < safe ? 'star on' : 'star'} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
          <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4l-5.8 3 1.1-6.4-4.7-4.6 6.5-.9z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

// HUD chip: icon + value + tiny label. Used in the rail and lesson header.
export function HudChip({ icon, value, label, tone = '', title }) {
  return (
    <span className={`hud-chip ${tone}`.trim()} title={title || label} aria-label={title || `${value} ${label}`}>
      <Icon name={icon} size={18} />
      <b aria-hidden="true">{value}</b>
      <small aria-hidden="true">{label}</small>
    </span>
  );
}

export function ProgressRing({ value = null, size = 72, stroke = 8, label = '', children = null, tone = 'var(--hue-volt)' }) {
  const r = (64 - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <span className="c-ring" style={{ width: size, height: size }} role="img" aria-label={label || (value == null ? 'Not enough evidence yet' : `${pct} percent`)}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle
          className="c-ring-fg"
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="c-ring-label" aria-hidden="true">{children ?? (value == null ? '–' : `${pct}`)}</span>
    </span>
  );
}

// Segmented progress (lesson steps / video chapters / exam questions).
export function SegmentBar({ total = 1, done = 0, current = null, className = '', label = 'Progress' }) {
  const safeTotal = Math.max(1, total);
  return (
    <div
      className={`c-segments ${className}`.trim()}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuenow={Math.min(done, safeTotal)}
    >
      {Array.from({ length: safeTotal }, (_, index) => (
        <span key={index} className={index < done ? 'seg done' : index === current ? 'seg current' : 'seg'} />
      ))}
    </div>
  );
}

// Celebration burst: emblem quadrants fly out of the centre. Pure CSS
// animation; hidden entirely under prefers-reduced-motion.
const CONFETTI_HUES = ['volt', 'blue', 'purple', 'amber', 'green', 'coral', 'cyan', 'rose'];
const CONFETTI_SHAPES = ['C', 'R', 'S', 'W'];

export function Confetti({ pieces = 26, className = '' }) {
  return (
    <div className={`c-confetti ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: pieces }, (_, index) => {
        const angle = (index / pieces) * 360 + (index % 3) * 9;
        const distance = 120 + ((index * 37) % 110);
        const hue = CONFETTI_HUES[index % CONFETTI_HUES.length];
        const shape = CONFETTI_SHAPES[(index * 5) % 4];
        return (
          <svg
            key={index}
            className="piece"
            viewBox="-12 -12 24 24"
            width="18"
            height="18"
            style={{
              '--angle': `${angle}deg`,
              '--distance': `${distance}px`,
              '--spin': `${(index % 2 ? 1 : -1) * (180 + index * 23)}deg`,
              '--delay': `${(index % 6) * 30}ms`,
            }}
          >
            <path d={quadrantPath(shape, 11)} transform="translate(-5 5)" fill={`var(--hue-${hue})`} stroke="var(--emblem-line)" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        );
      })}
    </div>
  );
}

// Seven-day streak strip (Mon→Sun), filled days are study days.
export function WeekStrip({ days = [], todayIndex = null }) {
  const names = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <ol className="c-week" aria-label="This week">
      {names.map((name, index) => {
        const state = days[index] === 'done' || days[index] === 'rest' ? days[index] : 'open';
        return (
          <li key={index} className={`c-day ${state}${index === todayIndex ? ' today' : ''}`} aria-label={`${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]}: ${state === 'done' ? 'studied' : state === 'rest' ? 'rest day' : 'not yet'}`}>
            <span className="c-day-dot" aria-hidden="true">
              {state === 'done' ? <Icon name="flame" size={16} /> : null}
            </span>
            <span className="c-day-name" aria-hidden="true">{name}</span>
          </li>
        );
      })}
    </ol>
  );
}
