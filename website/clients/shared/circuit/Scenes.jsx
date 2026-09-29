import { makeIso, shadeOf } from './iso.js';
import { quadrantPath } from './Emblem.jsx';
import { hueVar, strandInfo } from './palette.js';

// Circuit illustrations — isometric "floating island" scenes built from the
// iso kit. Every scene is pure SVG, theme-aware (hues via CSS vars) and
// decorative (aria-hidden) unless a title is passed. See
// website/design/GRAPHICS.md for the construction rules.

const LINE = 'var(--emblem-line)';

function Box({ b, color, stroke = LINE, sw = 1.6, className = '' }) {
  return (
    <g className={className}>
      <polygon points={b.left} style={{ fill: shadeOf(color, 74) }} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <polygon points={b.right} style={{ fill: shadeOf(color, 54) }} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <polygon points={b.top} style={{ fill: color }} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    </g>
  );
}

function Island({ iso, w, d, color = 'var(--scene-ground)', depth = 1.2 }) {
  return (
    <g className="scene-island">
      <Box b={iso.box(0, 0, -depth, w, d, depth)} color={color} />
      <polygon points={iso.pts([[0.6, 0.6, 0], [w - 0.6, 0.6, 0], [w - 0.6, d - 0.6, 0], [0.6, d - 0.6, 0]])} fill="var(--scene-ground-inset)" />
    </g>
  );
}

function FaceText({ matrix, x, y, children, size = 1.1, color = LINE, weight = 800 }) {
  return (
    <g transform={matrix}>
      <text x={x} y={y} fontSize={size} fontWeight={weight} fill={color} fontFamily="var(--font-display)" textAnchor="middle" dominantBaseline="central">
        {children}
      </text>
    </g>
  );
}

function Frame({ viewBox, title, className, children }) {
  return (
    <svg
      className={`c-scene ${className}`.trim()}
      viewBox={viewBox}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
    </svg>
  );
}

// ---------- Subject scenes (selector cards, login, dashboard hero) ----------

function FoundationScene() {
  const iso = makeIso({ ox: 205, oy: 70, u: 17 });
  const blue = hueVar('blue');
  const belt = iso.box(4.5, 1.2, 0, 7, 1.6, 0.5);
  return (
    <>
      <Island iso={iso} w={12.5} d={8.5} />
      {/* conveyor belt with riding shapes */}
      <Box b={belt} color="var(--scene-metal)" />
      <g transform={iso.topMatrix(4.5, 1.2, 0.5)}>
        <path className="scene-belt" d="M0 0.8 H7" stroke="var(--scene-belt)" strokeWidth="0.9" strokeDasharray="0.35 0.35" fill="none" />
        {[1.2, 3.4, 5.6].map((x, index) => (
          <g key={x} transform={`translate(${x} 0.8)`}>
            <g className="scene-rider" style={{ '--i': index }}>
              <path d={quadrantPath(['C', 'R', 'C'][index], 0.6)} fill={hueVar(['blue', 'cyan', 'amber'][index])} stroke={LINE} strokeWidth="0.12" />
              <path d={quadrantPath(['C', 'R', 'C'][index], 0.6)} transform="rotate(180)" fill={hueVar(['cyan', 'blue', 'coral'][index])} stroke={LINE} strokeWidth="0.12" />
            </g>
          </g>
        ))}
      </g>
      {/* machine */}
      <Box b={iso.box(9.2, 0.6, 0.5, 2.6, 2.8, 2.4)} color="var(--scene-machine)" />
      <polygon points={iso.pts([[9.2, 1.4, 1.1], [9.2, 2.6, 1.1], [9.2, 2.6, 2.1], [9.2, 1.4, 2.1]])} fill="var(--tile-shade)" />
      <circle className="scene-light" cx={iso.P(10.5, 2, 3.2)[0]} cy={iso.P(10.5, 2, 3.2)[1]} r="4.5" fill="var(--hue-volt)" stroke={LINE} strokeWidth="1.4" />
      {/* number tower */}
      {[0, 1, 2].map((level) => {
        const b = iso.box(1.2, 4.6, level * 1.9, 1.9, 1.9, 1.9);
        return (
          <g key={level}>
            <Box b={b} color={level === 1 ? hueVar('cyan') : blue} />
            <FaceText matrix={iso.leftMatrix(1.2, 6.5, level * 1.9 + 1.9)} x={0.95} y={0.95}>{[1, 2, 3][level]}</FaceText>
          </g>
        );
      })}
      {/* fraction pie slab */}
      <Box b={iso.box(6.2, 5, 0, 3.4, 3.4, 0.5)} color="var(--scene-paper)" />
      <g transform={iso.topMatrix(7.9, 6.7, 0.5)}>
        <circle r="1.4" fill="var(--scene-paper)" stroke={LINE} strokeWidth="0.1" />
        <path d="M0 0 L0 -1.4 A1.4 1.4 0 1 1 -1.4 0 Z" fill={hueVar('amber')} stroke={LINE} strokeWidth="0.1" />
      </g>
    </>
  );
}

function HigherScene() {
  const iso = makeIso({ ox: 200, oy: 72, u: 17 });
  const purple = hueVar('purple');
  const wall = iso.box(1, 0.8, 0, 7.5, 0.8, 5);
  return (
    <>
      <Island iso={iso} w={12.5} d={8.5} />
      <Box b={wall} color="var(--scene-paper)" />
      <g transform={iso.leftMatrix(1, 1.6, 5)}>
        {Array.from({ length: 8 }, (_, i) => <path key={`v${i}`} d={`M${i + 0.25} 0.3 V4.7`} stroke="var(--scene-grid)" strokeWidth="0.05" />)}
        {Array.from({ length: 5 }, (_, i) => <path key={`h${i}`} d={`M0.2 ${i + 0.3} H7.3`} stroke="var(--scene-grid)" strokeWidth="0.05" />)}
        <path d="M0.4 0.8 Q3.75 8.2 7.1 0.8" fill="none" stroke={purple} strokeWidth="0.28" strokeLinecap="round" />
        <circle className="scene-ball" cx="2.1" cy="3.2" r="0.42" fill="var(--hue-volt)" stroke={LINE} strokeWidth="0.1" />
        <path d="M3.75 4.5 V4.25" stroke={LINE} strokeWidth="0.1" />
      </g>
      {/* wedge (right-angled prism) */}
      <g>
        <polygon points={iso.pts([[7.5, 4.5, 0], [11, 4.5, 0], [11, 7, 0], [7.5, 7, 0]])} fill="var(--tile-shade)" opacity="0.15" />
        <polygon points={iso.pts([[7.5, 7, 0], [11, 7, 0], [11, 7, 2.6]])} style={{ fill: shadeOf(purple, 74) }} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
        <polygon points={iso.pts([[11, 4.5, 0], [11, 7, 0], [11, 7, 2.6], [11, 4.5, 2.6]])} style={{ fill: shadeOf(purple, 54) }} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
        <polygon points={iso.pts([[7.5, 4.5, 0], [11, 4.5, 2.6], [11, 7, 2.6], [7.5, 7, 0]])} style={{ fill: purple }} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
        <g transform={iso.leftMatrix(7.5, 7, 0)}>
          <path d="M3.1 0 V-0.4 H3.5" fill="none" stroke={LINE} strokeWidth="0.1" transform="translate(0 0)" />
        </g>
      </g>
      {/* vector arrow */}
      <g transform={iso.topMatrix(2, 3.5, 0)}>
        <path d="M0.5 3.4 L3.6 1.2" stroke={hueVar('cyan')} strokeWidth="0.32" strokeLinecap="round" />
        <path d="M3.9 1 L2.9 1.1 L3.5 1.9 Z" fill={hueVar('cyan')} stroke={LINE} strokeWidth="0.08" />
      </g>
    </>
  );
}

function EnglishScene() {
  const iso = makeIso({ ox: 200, oy: 76, u: 17 });
  const tang = hueVar('tangerine');
  return (
    <>
      <Island iso={iso} w={12.5} d={8.5} />
      {/* book base */}
      <Box b={iso.box(2, 2, 0, 7.5, 5, 0.6)} color={tang} />
      {/* pages (two slight planes) */}
      <polygon points={iso.pts([[2.3, 2.3, 0.6], [5.75, 2.3, 1.1], [5.75, 6.7, 1.1], [2.3, 6.7, 0.6]])} fill="var(--scene-paper)" stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points={iso.pts([[5.75, 2.3, 1.1], [9.2, 2.3, 0.6], [9.2, 6.7, 0.6], [5.75, 6.7, 1.1]])} fill="var(--scene-paper-2)" stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
      <g transform={iso.topMatrix(2.3, 2.3, 0.85)}>
        {[0.8, 1.6, 2.4, 3.2].map((y, index) => (
          <path key={y} d={`M0.5 ${y} H${index === 3 ? 2.2 : 3}`} stroke="var(--scene-grid)" strokeWidth="0.16" strokeLinecap="round" />
        ))}
        <path d="M0.5 1.6 H1.9" stroke={tang} strokeWidth="0.3" strokeLinecap="round" opacity="0.8" />
      </g>
      {/* rising quote bubbles */}
      {[[4.2, 3.4, 3.6, 'tangerine'], [7.4, 4.4, 5, 'rose'], [9.8, 1.4, 3.2, 'amber']].map(([x, y, z, hue], index) => {
        const [cx, cy] = iso.P(x, y, z);
        return (
          <g key={index} transform={`translate(${cx} ${cy})`}>
            <g className="scene-float" style={{ '--i': index }}>
              <path d="M-17 -12 h34 a6 6 0 0 1 6 6 v12 a6 6 0 0 1 -6 6 h-18 l-8 7 v-7 h-8 a6 6 0 0 1 -6 -6 v-12 a6 6 0 0 1 6 -6z" fill={hueVar(hue)} stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
              <text x="0" y="8" textAnchor="middle" fontSize="22" fontWeight="800" fill={LINE} fontFamily="var(--font-read)">&ldquo;&rdquo;</text>
            </g>
          </g>
        );
      })}
      {/* pen */}
      <Box b={iso.box(10, 5.2, 0, 0.7, 2.6, 0.7)} color={hueVar('rose')} />
    </>
  );
}

export function SubjectScene({ subject = 'maths', title = null, className = '' }) {
  const Scene = subject === 'english' ? EnglishScene : subject === 'maths-higher' ? HigherScene : FoundationScene;
  return (
    <Frame viewBox="0 0 400 290" title={title} className={`scene-${subject} ${className}`}>
      <Scene />
    </Frame>
  );
}

// ---------- Strand banner scenes (map worlds, dashboard rows) ----------

function StrandArt({ strand }) {
  const iso = makeIso({ ox: 110, oy: 40, u: 13 });
  const info = strandInfo(strand);
  const main = hueVar(info.hue);
  const alt = hueVar(info.alt);
  const base = <Island iso={iso} w={8} d={6} depth={0.9} />;
  switch (info.scene) {
    case 'algebra': {
      const [px, py] = iso.P(4, 3, 2.9);
      return (
        <>
          {base}
          <polygon points={iso.pts([[3.2, 2.2, 0], [4.8, 2.2, 0], [4, 3.8, 2.4]])} style={{ fill: shadeOf(main, 60) }} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
          <g transform={`translate(${px} ${py}) rotate(-8)`}>
            <rect x="-62" y="-3" width="124" height="6" rx="3" fill="var(--scene-metal)" stroke={LINE} strokeWidth="1.4" />
            <rect x="-58" y="-26" width="24" height="23" rx="4" fill={main} stroke={LINE} strokeWidth="1.4" />
            <text x="-46" y="-9" textAnchor="middle" fontSize="16" fontWeight="800" fill={LINE} fontFamily="var(--font-display)">x</text>
            {[30, 42, 54].map((x) => <rect key={x} x={x - 6} y="-14" width="11" height="11" rx="2" fill={alt} stroke={LINE} strokeWidth="1.2" />)}
          </g>
        </>
      );
    }
    case 'ratio':
      return (
        <>
          {base}
          <Box b={iso.box(1, 2, 0, 6, 1.6, 0.9)} color="var(--scene-paper)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Box key={i} b={iso.box(1 + i * 1.2, 2, 0.9, 1.2, 1.6, 0.9)} color={i < 2 ? main : alt} />
          ))}
          <g transform={`translate(${iso.P(5.5, 4.6, 0.2)[0]} ${iso.P(5.5, 4.6, 0.2)[1]})`}>
            <circle r="15" fill={main} stroke={LINE} strokeWidth="1.4" />
            {Array.from({ length: 8 }, (_, i) => <rect key={i} x="-3" y="-20" width="6" height="7" rx="1.5" fill={main} stroke={LINE} strokeWidth="1.2" transform={`rotate(${i * 45})`} />)}
            <circle r="5" fill="var(--scene-paper)" stroke={LINE} strokeWidth="1.2" />
          </g>
        </>
      );
    case 'geometry':
      return (
        <>
          {base}
          <polygon points={iso.pts([[1.5, 1.5, 0], [4.5, 1.5, 0], [3, 3, 3.4]])} style={{ fill: shadeOf(main, 80) }} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
          <polygon points={iso.pts([[4.5, 1.5, 0], [4.5, 4.5, 0], [3, 3, 3.4]])} style={{ fill: shadeOf(main, 56) }} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
          <polygon points={iso.pts([[1.5, 4.5, 0], [4.5, 4.5, 0], [3, 3, 3.4]])} style={{ fill: main }} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
          <Box b={iso.box(5.2, 2.6, 0, 2, 2, 2)} color={alt} />
          <g transform={iso.topMatrix(1.2, 5, 0.05)}>
            <path d="M0 0.6 A2.2 2.2 0 0 1 4.4 0.6 Z" fill="var(--scene-paper)" stroke={LINE} strokeWidth="0.1" />
          </g>
        </>
      );
    case 'probability':
      return (
        <>
          {base}
          <Box b={iso.box(1.4, 1.6, 0, 2.6, 2.6, 2.6)} color="var(--scene-paper)" />
          <g transform={iso.topMatrix(1.4, 1.6, 2.6)}>
            {[[0.65, 0.65], [1.3, 1.3], [1.95, 1.95]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="0.26" fill={LINE} />)}
          </g>
          <g transform={iso.leftMatrix(1.4, 4.2, 2.6)}>
            {[[0.7, 0.7], [1.9, 0.7], [0.7, 1.9], [1.9, 1.9]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="0.24" fill={LINE} />)}
          </g>
          <g transform={iso.topMatrix(5.6, 3.3, 0.1)}>
            <circle r="1.9" fill={main} stroke={LINE} strokeWidth="0.1" />
            <path d="M0 0 L0 -1.9 A1.9 1.9 0 0 1 1.9 0 Z" fill={alt} stroke={LINE} strokeWidth="0.1" />
            <path d="M0 0 L-1.9 0 A1.9 1.9 0 0 1 0 -1.9 Z" fill="var(--hue-volt)" stroke={LINE} strokeWidth="0.1" />
            <path className="scene-spinner" d="M0 0 L1.1 1.1" stroke={LINE} strokeWidth="0.2" strokeLinecap="round" />
          </g>
        </>
      );
    case 'statistics':
      return (
        <>
          {base}
          {[1.8, 3.4, 2.4, 4.4].map((h, i) => <Box key={i} b={iso.box(1 + i * 1.6, 2.6, 0, 1.1, 1.1, h)} color={i % 2 ? alt : main} />)}
        </>
      );
    case 'reading': {
      const [mx, my] = iso.P(5, 2.5, 3);
      return (
        <>
          {base}
          <Box b={iso.box(1.2, 1.4, 0, 5.4, 3.8, 0.4)} color="var(--scene-paper)" />
          <g transform={iso.topMatrix(1.2, 1.4, 0.4)}>
            {[0.8, 1.6, 2.4, 3.1].map((y) => <path key={y} d={`M0.6 ${y} H4.6`} stroke="var(--scene-grid)" strokeWidth="0.22" strokeLinecap="round" />)}
            <path d="M1.6 1.6 H3.4" stroke={main} strokeWidth="0.45" strokeLinecap="round" />
          </g>
          <g transform={`translate(${mx} ${my})`}>
            <path d="M14 14 L30 30" stroke={LINE} strokeWidth="7" strokeLinecap="round" />
            <path d="M14 14 L30 30" stroke={alt} strokeWidth="3.5" strokeLinecap="round" />
            <circle r="19" fill="var(--scene-glass)" stroke={LINE} strokeWidth="3" />
            <circle r="19" fill="none" stroke={main} strokeWidth="1.4" />
          </g>
        </>
      );
    }
    case 'writing':
      return (
        <>
          {base}
          <Box b={iso.box(1, 1.4, 0, 5.6, 3.8, 0.4)} color="var(--scene-paper)" />
          <g transform={iso.topMatrix(1, 1.4, 0.4)}>
            <path d="M0.6 1 q0.6 -0.6 1.2 0 t1.2 0 t1.2 0" fill="none" stroke={main} strokeWidth="0.28" strokeLinecap="round" />
            {[1.9, 2.7].map((y) => <path key={y} d={`M0.6 ${y} H4.8`} stroke="var(--scene-grid)" strokeWidth="0.22" strokeLinecap="round" />)}
          </g>
          <polygon points={iso.pts([[4.6, 2.2, 0.4], [5.4, 1.4, 3.6], [6.2, 2.2, 3.6]])} style={{ fill: alt }} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
          <Box b={iso.box(5.2, 1.2, 3.6, 1.2, 1.2, 1.8)} color={main} />
        </>
      );
    case 'number':
    default:
      return (
        <>
          {base}
          {[[1.2, 1.4, 0], [3.4, 1.4, 0], [1.2, 1.4, 2]].map(([x, y, z], index) => (
            <g key={index}>
              <Box b={iso.box(x, y, z, 2, 2, 2)} color={index === 1 ? alt : main} />
              <FaceText matrix={iso.leftMatrix(x, y + 2, z + 2)} x={1} y={1} size={1.2}>{[7, 3, 5][index]}</FaceText>
            </g>
          ))}
          <g transform={iso.topMatrix(5.6, 3.6, 0.05)}>
            <circle r="1.4" fill="var(--scene-paper)" stroke={LINE} strokeWidth="0.1" />
            <path d="M0 0 L0 -1.4 A1.4 1.4 0 0 1 1.4 0 Z" fill={main} stroke={LINE} strokeWidth="0.1" />
          </g>
        </>
      );
  }
}

export function StrandScene({ strand, title = null, className = '' }) {
  return (
    <Frame viewBox="0 0 220 150" title={title} className={`strand-scene ${className}`}>
      <StrandArt strand={strand} />
    </Frame>
  );
}

// ---------- Circuit board hero (login, landing, empty states) ----------

export function CircuitHero({ title = null, className = '' }) {
  const iso = makeIso({ ox: 250, oy: 60, u: 15 });
  const tiles = [
    { x: 1, y: 7, hue: 'blue' },
    { x: 5, y: 5, hue: 'purple' },
    { x: 9, y: 3, hue: 'tangerine' },
    { x: 13, y: 1, hue: 'volt' },
  ];
  return (
    <Frame viewBox="0 0 500 330" title={title} className={`circuit-hero ${className}`}>
      <Island iso={iso} w={17} d={12} depth={1.4} />
      <g transform={iso.topMatrix(0, 0, 0.02)}>
        <path className="scene-trace" d="M2.3 8.3 H6.3 V6.3 H10.3 V4.3 H14.3 V2.3" fill="none" stroke="var(--scene-belt)" strokeWidth="0.5" strokeLinejoin="round" strokeDasharray="0.5 0.4" />
        <path d="M2.3 8.3 H6.3 V6.3 H10.3 V4.3 H14.3 V2.3" fill="none" stroke="var(--scene-trace)" strokeWidth="0.16" strokeLinejoin="round" />
      </g>
      {tiles.map((tile, index) => {
        const b = iso.box(tile.x, tile.y, 0, 2.6, 2.6, 0.9 + index * 0.5);
        const color = hueVar(tile.hue);
        return (
          <g key={index} className="hero-tile" style={{ '--i': index }}>
            <Box b={b} color={color} />
            <g transform={iso.topMatrix(tile.x + 1.3, tile.y + 1.3, 0.9 + index * 0.5)}>
              {index < 3 ? (
                <path d="M-0.55 0 L-0.15 0.4 L0.6 -0.35" fill="none" stroke={LINE} strokeWidth="0.22" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M-0.7 0.45 V-0.25 L-0.35 0.1 L0 -0.55 L0.35 0.1 L0.7 -0.25 V0.45 Z" fill="var(--hue-amber)" stroke={LINE} strokeWidth="0.1" strokeLinejoin="round" />
              )}
            </g>
          </g>
        );
      })}
      {/* shapes riding the trace */}
      {['C', 'W', 'S'].map((shape, index) => {
        const [cx, cy] = iso.P(4 + index * 4, 7.3 - index * 2, 0.5);
        return (
          <g key={shape} transform={`translate(${cx} ${cy - 22})`}>
            <g className="scene-float" style={{ '--i': index }}>
              <path d={quadrantPath(shape, 13)} fill={hueVar(['blue', 'purple', 'tangerine'][index])} stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
              <path d={quadrantPath(shape, 13)} transform="rotate(180)" fill={hueVar(['cyan', 'blue', 'amber'][index])} stroke={LINE} strokeWidth="1.8" strokeLinejoin="round" />
            </g>
          </g>
        );
      })}
    </Frame>
  );
}
