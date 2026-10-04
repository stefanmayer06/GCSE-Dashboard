// Circuit icon set — drawn for this product, not an icon font.
// Grammar: 24px grid, 2px rounded strokes in currentColor, plus ONE filled
// "accent" shape per icon (class .i-accent) that picks up --icon-accent —
// a small echo of the emblem quadrants. Keep new icons to that grammar.

const ICONS = {
  home: (
    <>
      <path d="M4 11.2 12 4.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z" />
      <path className="i-accent" d="M12 15v5.5H9V15z" />
    </>
  ),
  practice: (
    <>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M10 3h4M12 3v3.5M18.5 7.5l1.3-1.3" />
      <path className="i-accent" d="M12 13.5V8.8a4.7 4.7 0 0 1 4.7 4.7z" />
    </>
  ),
  learn: (
    <>
      <path d="M4.5 19.5 9 15l5 2.5L19.5 7" />
      <circle cx="4.5" cy="19.5" r="1.6" />
      <circle cx="9" cy="15" r="1.6" />
      <circle cx="14" cy="17.5" r="1.6" />
      <path className="i-accent" d="m19.5 3 2.5 4-2.5 4-2.5-4z" />
    </>
  ),
  texts: (
    <>
      <path d="M3.5 5.5c3-1.2 6-.8 8.5 1.5 2.5-2.3 5.5-2.7 8.5-1.5v13c-3-1-6-.6-8.5 1.5-2.5-2.1-5.5-2.5-8.5-1.5z" />
      <path d="M12 7v13" />
      <path className="i-accent" d="M6 9.5h3.5v3.2A2.4 2.4 0 0 1 7.1 15H6z" />
    </>
  ),
  notebook: (
    <>
      <rect x="4.5" y="3" width="15" height="18" rx="3" />
      <path d="M9.2 13.4a3.2 3.2 0 1 0 1-4.6" />
      <path d="M9.4 6.6v2.6h2.6" />
      <path className="i-accent" d="M4.5 7h2v2h-2zM4.5 15h2v2h-2z" />
    </>
  ),
  summary: (
    <>
      <path d="M4 20.5h16" />
      <path d="M6.5 17v-4M11 17V8.5M15.5 17v-6" />
      <path className="i-accent" d="M18.5 3.5h3v13.5h-3z" />
    </>
  ),
  tutor: (
    <>
      <path d="M5.5 4.5h13a2.5 2.5 0 0 1 2.5 2.5v7.5a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 3.5V17H5.5A2.5 2.5 0 0 1 3 14.5V7a2.5 2.5 0 0 1 2.5-2.5z" />
      <circle className="i-accent" cx="9" cy="10.6" r="1.7" />
      <circle className="i-accent" cx="15" cy="10.6" r="1.7" />
    </>
  ),
  flame: (
    <>
      <path d="M12 2.8c.4 3.7 5.8 5.8 5.8 11a5.8 5.8 0 0 1-11.6 0c0-2.8 1.8-4.3 2.4-6.2 1.3 1.1 1.8 2.3 1.9 3.4 1.2-2.3 1.4-5.3 1.5-8.2z" />
      <path className="i-accent" d="M12 20.2a2.8 2.8 0 0 1-2.8-2.8c0-1.9 2-2.7 2.8-4.6.8 1.9 2.8 2.7 2.8 4.6a2.8 2.8 0 0 1-2.8 2.8z" />
    </>
  ),
  gem: (
    <>
      <path d="M7 4h10l4 5-9 11L3 9z" />
      <path d="M3 9h18M9.5 4 12 9l2.5-5" />
      <path className="i-accent" d="M12 9h-5l5 11z" />
    </>
  ),
  bolt: (
    <>
      <path className="i-accent" d="M13.5 2 4.5 13.5h6.8L10 22l9.5-12.5h-6.8z" />
    </>
  ),
  star: (
    <>
      <path className="i-accent" d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3-4.7-4.4 6.4-.8z" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle className="i-accent" cx="12" cy="15.5" r="1.7" />
    </>
  ),
  play: <path className="i-accent" d="M7.5 4.8v14.4a.8.8 0 0 0 1.2.7l11.4-7.2a.8.8 0 0 0 0-1.4L8.7 4.1a.8.8 0 0 0-1.2.7z" />,
  pause: (
    <>
      <rect className="i-accent" x="6" y="4.5" width="4" height="15" rx="1.2" />
      <rect className="i-accent" x="14" y="4.5" width="4" height="15" rx="1.2" />
    </>
  ),
  replay: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
      <path d="M4.5 3.5V8h4.5" />
      <path className="i-accent" d="M10.5 9.2v5.6l4.5-2.8z" />
    </>
  ),
  back10: (
    <>
      <path d="M5 12a7 7 0 1 0 2.2-5.1" />
      <path d="M5 3.8V8h4.2" />
      <path className="i-accent" d="M10 10h1.4v5H10zM13 10h2.4v5H13z" />
    </>
  ),
  captions: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10.5 10.2a2.2 2.2 0 1 0 0 3.6M17 10.2a2.2 2.2 0 1 0 0 3.6" />
    </>
  ),
  speaker: (
    <>
      <path className="i-accent" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  mute: (
    <>
      <path className="i-accent" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </>
  ),
  transcript: (
    <>
      <path d="M4 6h16M4 10.5h10M4 15h16M4 19.5h8" />
      <path className="i-accent" d="M17 9h4v3.5h-4z" />
    </>
  ),
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  chevronLeft: <path d="m14.5 5-7 7 7 7" />,
  chevronRight: <path d="m9.5 5 7 7-7 7" />,
  chevronDown: <path d="m5 9.5 7 7 7-7" />,
  arrowRight: <path d="M4.5 12h14.5M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19.5 12H5M11 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  sparkle: <path className="i-accent" d="M12 2.5c.7 4.8 2.7 6.8 7.5 7.5-4.8.7-6.8 2.7-7.5 7.5-.7-4.8-2.7-6.8-7.5-7.5 4.8-.7 6.8-2.7 7.5-7.5zM19 15.5c.3 2 1.1 2.8 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.2 2.7-1 3-3z" />,
  sun: (
    <>
      <circle className="i-accent" cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </>
  ),
  moon: <path className="i-accent" d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z" />,
  signOut: (
    <>
      <path d="M10 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
      <path d="M15 7.5 19.5 12 15 16.5M19.5 12H9" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
      <path className="i-accent" d="M10.5 6.8a3.7 3.7 0 0 1 3.7 3.7h-3.7z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle className="i-accent" cx="12" cy="12" r="1.8" />
    </>
  ),
  trophy: (
    <>
      <path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z" />
      <path d="M7.5 6H4.5a3 3 0 0 0 3 4M16.5 6h3a3 3 0 0 1-3 4M12 13.5V17M8.5 20.5h7" />
      <path className="i-accent" d="M9.5 17h5l1 3.5h-7z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path className="i-accent" d="M13.5 13h3.5v3.5h-3.5z" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 17.5h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5.9 1.2.9 2v1.7h5.4v-1.7c0-.8.3-1.5.9-2A6 6 0 0 0 12 3z" />
      <path className="i-accent" d="M12 6.5a2.8 2.8 0 0 1 2.8 2.8H12z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  pen: (
    <>
      <path d="m15 4.5 4.5 4.5L9 19.5H4.5V15z" />
      <path className="i-accent" d="M12.8 6.7 17.3 11.2 19.5 9 15 4.5z" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3.5 9 4.5-9 4.5L3 8z" />
      <path d="m3 12 9 4.5 9-4.5M3 16l9 4.5 9-4.5" />
      <path className="i-accent" d="m12 5.8 4.4 2.2L12 10.2 7.6 8z" />
    </>
  ),
  headphones: (
    <>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <rect className="i-accent" x="3.5" y="14" width="4" height="6.5" rx="1.6" />
      <rect className="i-accent" x="16.5" y="14" width="4" height="6.5" rx="1.6" />
    </>
  ),
  freeze: (
    <>
      <path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5" />
      <path d="m9.5 4 2.5 2.5L14.5 4M9.5 20l2.5-2.5 2.5 2.5" />
      <circle className="i-accent" cx="12" cy="12" r="2.2" />
    </>
  ),
  cross: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  warning: (
    <>
      <path d="M12 3.5 21.5 20h-19z" />
      <path d="M12 10v4.5" />
      <circle className="i-accent" cx="12" cy="17.2" r="1.2" />
    </>
  ),
  heart: <path className="i-accent" d="M12 20.3s-8.3-4.9-8.3-11A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.3 2.7c0 6.1-8.3 11-8.3 11z" />,
  flag: (
    <>
      <path d="M5.5 21V4" />
      <path className="i-accent" d="M5.5 4.5h12l-2.8 4 2.8 4h-12z" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.8" />
      <rect x="13" y="13" width="7" height="7" rx="1.8" />
      <rect x="13" y="4" width="7" height="7" rx="1.8" />
      <path className="i-accent" d="M4 15.8A2.8 2.8 0 0 1 6.8 13H11v7H6.8A2.8 2.8 0 0 1 4 17.2z" />
    </>
  ),
  egg: (
    <>
      <path d="M12 3c3.6 0 6.6 5.4 6.6 9.8A6.6 6.6 0 0 1 12 19.6a6.6 6.6 0 0 1-6.6-6.8C5.4 8.4 8.4 3 12 3z" />
      <path d="m5.6 12.6 2.1-1.6 2.1 1.6 2.2-1.6 2.1 1.6 2.1-1.6 2.2 1.6" />
      <circle className="i-accent" cx="9.7" cy="7.6" r="1.3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.2" r="4" />
      <path d="M4.5 20.5c.6-4 3.6-6.5 7.5-6.5s6.9 2.5 7.5 6.5" />
      <path className="i-accent" d="M12 4.2a4 4 0 0 1 4 4h-4z" />
    </>
  ),
  download: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M12 7v7M9.2 11.2 12 14l2.8-2.8M10.5 18.5h3" />
      <path className="i-accent" d="M6.5 5a2.5 2.5 0 0 1 2.5-2.5h6A2.5 2.5 0 0 1 17.5 5z" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" />
      <path d="M5 12v6.5A2 2 0 0 0 7 20.5h10a2 2 0 0 0 2-2V12" />
      <path className="i-accent" d="M9 20.5v-4h6v4z" />
    </>
  ),
};

export const ICON_NAMES = Object.keys(ICONS);

export default function Icon({ name, size = 20, className = '', title = null, strokeWidth = 2 }) {
  const glyph = ICONS[name] || ICONS.sparkle;
  return (
    <svg
      className={`c-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {glyph}
    </svg>
  );
}
