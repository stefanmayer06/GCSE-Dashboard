import { CRITTER_HUES, hueVar } from './palette.js';

// Study creatures — the collectible milestone art. Eight original creatures,
// each with four evolutions (tier 1-4) plus an egg (tier 0). The evidence
// that feeds them lives in ../critters.js; this file only draws.
//
// Drawing rules (see design/GRAPHICS.md → Creatures):
// - 120×120 art box, ground line at y≈106, outlines in --emblem-line.
// - Colour comes from the creature's hue keys through --cr-main / --cr-alt
//   (set on the root) and the derived --cr-light / --cr-deep in critters.css.
//   Volt is reserved for Legend (tier 4) accents.
// - Every evolution keeps the base silhouette and adds parts, so a learner
//   can see the same friend growing up.
// - Animated groups carry a className and no transform attribute; position
//   with an outer <g transform>.

const INK = 'var(--emblem-line)';
const MAIN = 'var(--cr-main)';
const ALT = 'var(--cr-alt)';
const LIGHT = 'var(--cr-light)';
const DEEP = 'var(--cr-deep)';
const SIDE = 'var(--cr-side)';
const PAPER = 'var(--scene-paper)';
const VOLT = 'var(--hue-volt)';
const GOLD = 'var(--hue-amber)';
const SHINE = 'var(--tile-inset)';

const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' };
const thin = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round' };

export const CRITTER_SCALE = [0.8, 0.84, 0.92, 1, 1];

// ---------- shared face parts ----------

function Eyes({ l, r, size = 5, mood = 'happy' }) {
  if (mood === 'joy') {
    return (
      <g className="cr-eyes" fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round">
        <path d={`M${l[0] - size} ${l[1] + 1}q${size} -${size * 1.3} ${size * 2} 0`} />
        <path d={`M${r[0] - size} ${r[1] + 1}q${size} -${size * 1.3} ${size * 2} 0`} />
      </g>
    );
  }
  return (
    <g className="cr-eyes">
      <ellipse cx={l[0]} cy={l[1]} rx={size} ry={size * 1.18} fill={INK} />
      <ellipse cx={r[0]} cy={r[1]} rx={size} ry={size * 1.18} fill={INK} />
      <circle cx={l[0] + size * 0.36} cy={l[1] - size * 0.42} r={size * 0.38} fill={SHINE} />
      <circle cx={r[0] + size * 0.36} cy={r[1] - size * 0.42} r={size * 0.38} fill={SHINE} />
    </g>
  );
}

function Cheeks({ l, r, rx = 4.5 }) {
  return (
    <g className="cr-cheeks" fill="var(--hue-coral)" opacity="0.5">
      <ellipse cx={l[0]} cy={l[1]} rx={rx} ry={rx * 0.62} />
      <ellipse cx={r[0]} cy={r[1]} rx={rx} ry={rx * 0.62} />
    </g>
  );
}

function Smile({ x, y, w = 8, mood }) {
  if (mood === 'joy') {
    return <path d={`M${x - w / 2} ${y - 1}q${w / 2} ${w * 0.95} ${w} 0z`} fill={INK} {...thin} />;
  }
  return <path d={`M${x - w / 2} ${y}q${w / 2} ${w * 0.6} ${w} 0`} fill="none" {...thin} />;
}

function sparklePath(x, y, r) {
  const k = r * 0.28;
  return `M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}Z`;
}

function Sparkle({ x, y, r = 6, fill = VOLT, i = 0 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className="cr-sparkle" style={{ '--i': i }} d={sparklePath(0, 0, r)} fill={fill} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
    </g>
  );
}

// Legend creatures shimmer: volt sparkles orbiting the art.
function LegendSparkles() {
  return (
    <g className="cr-legend-sparkles">
      <Sparkle x={14} y={36} r={6} i={0} />
      <Sparkle x={106} y={30} r={7} i={1} />
      <Sparkle x={104} y={82} r={4.5} i={2} />
      <Sparkle x={18} y={86} r={4} i={3} />
    </g>
  );
}

function Crown({ x, y, w = 24 }) {
  const h = w * 0.62;
  const s = w / 2;
  return (
    <path
      d={`M${x - s} ${y}L${x - s - 2} ${y - h}L${x - s / 2} ${y - h * 0.45}L${x} ${y - h - 4}L${x + s / 2} ${y - h * 0.45}L${x + s + 2} ${y - h}L${x + s} ${y}Z`}
      fill={VOLT}
      {...line}
    />
  );
}

function flame(x, y, w, h) {
  // A flame/feather teardrop rising from (x, y).
  return `M${x} ${y}C${x - w} ${y - h * 0.3} ${x - w * 0.6} ${y - h * 0.75} ${x + w * 0.1} ${y - h}C${x} ${y - h * 0.62} ${x + w * 0.95} ${y - h * 0.5} ${x + w * 0.55} ${y - h * 0.18}C${x + w * 0.4} ${y - h * 0.05} ${x + w * 0.2} ${y} ${x} ${y}Z`;
}

// ---------- the eight creatures ----------

// Ember — a fox made of warm light (day streak).
function Ember({ t, mood }) {
  const ear = t >= 2 ? 22 : 30;
  return (
    <>
      {t >= 4 ? (
        <g className="cr-spin-slow">
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d="M60 10l6 13h-12z" transform={`rotate(${i * 36 + 18} 60 56)`} fill={VOLT} {...thin} />
          ))}
        </g>
      ) : null}
      <g className="cr-wag">
        {t >= 3 ? <path d={flame(46, 98, 14, 40)} transform="rotate(-38 46 98)" fill={ALT} {...line} /> : null}
        {t >= 4 ? <path d={flame(60, 96, 13, 44)} transform="rotate(-8 60 96)" fill={VOLT} {...line} /> : null}
        {t >= 2 ? (
          <>
            <path d="M72 98C96 102 110 82 102 56C98 68 92 70 90 58C84 70 72 80 72 98Z" fill={MAIN} {...line} />
            <path d="M98 64C98 74 94 80 88 84C90 76 92 70 98 64Z" fill={ALT} />
          </>
        ) : (
          <path d="M74 98C88 98 96 86 92 72C88 80 84 78 84 70C78 78 72 86 74 98Z" fill={ALT} {...line} />
        )}
      </g>
      <ellipse cx="60" cy="90" rx="20" ry="15" fill={MAIN} {...line} />
      <path d="M52 80q8 9 16 0q-1 13-8 16q-7-3-8-16z" fill={LIGHT} />
      <ellipse cx="50" cy="103" rx="6.5" ry="4" fill={LIGHT} {...thin} />
      <ellipse cx="70" cy="103" rx="6.5" ry="4" fill={LIGHT} {...thin} />
      <path d={`M37 52L40 ${ear}L58 40Z`} fill={MAIN} {...line} />
      <path d={`M83 52L80 ${ear}L62 40Z`} fill={MAIN} {...line} />
      <path d={`M42 46L43 ${ear + 9}L52 42Z`} fill={ALT} />
      <path d={`M78 46L77 ${ear + 9}L68 42Z`} fill={ALT} />
      {t >= 3 ? (
        <>
          <path d={flame(36, 70, 7, 16)} transform="rotate(-70 36 70)" fill={ALT} {...thin} />
          <path d={flame(84, 70, 7, 16)} transform="rotate(70 84 70)" fill={ALT} {...thin} />
        </>
      ) : null}
      <ellipse cx="60" cy="58" rx="26" ry="22" fill={MAIN} {...line} />
      <path d="M42 64q18-8 36 0q-4 14-18 15q-14-1-18-15z" fill={LIGHT} />
      {t >= 4 ? <path d={flame(60, 44, 5, 12)} fill={ALT} {...thin} /> : null}
      <Eyes l={[50, 56]} r={[70, 56]} size={4.8} mood={mood} />
      <ellipse cx="60" cy="64.5" rx="3.2" ry="2.3" fill={INK} />
      <Smile x={60} y={69} w={7} mood={mood} />
      <Cheeks l={[42, 65]} r={[78, 65]} />
    </>
  );
}

// Quillby — a hedgehog with pencil quills (marked answers).
function Pencil({ angle, length, fill }) {
  const start = 22;
  const end = start + length;
  return (
    <g transform={`translate(60 84) rotate(${angle + 90})`}>
      <path d={`M-4.5 ${-start}V${-(end - 9)}H4.5V${-start}Z`} fill={fill} {...thin} />
      <path d={`M-4.5 ${-(end - 9)}L0 ${-end}L4.5 ${-(end - 9)}Z`} fill={PAPER} {...thin} />
      <path d={`M-1.6 ${-(end - 3.2)}L0 ${-end}L1.6 ${-(end - 3.2)}Z`} fill={INK} />
    </g>
  );
}

function Quill({ t, mood }) {
  const counts = [3, 5, 7, 9];
  const n = counts[t - 1];
  const spread = [60, 100, 130, 144][t - 1];
  const length = [16, 21, 24, 26][t - 1];
  const angles = Array.from({ length: n }, (_, i) => -90 - spread / 2 + (spread * i) / Math.max(1, n - 1));
  return (
    <>
      <g className="cr-quills">
        {angles.map((a, i) => (
          <Pencil key={i} angle={a} length={length + (i % 2 ? -3 : 0)} fill={t >= 4 && i === (n - 1) / 2 ? VOLT : i % 2 ? ALT : MAIN} />
        ))}
      </g>
      <path d="M26 101C26 72 42 58 60 58C78 58 94 72 94 101Z" fill={DEEP} {...line} />
      <ellipse cx="60" cy="85" rx="23" ry="17" fill={LIGHT} {...line} />
      <ellipse cx="47" cy="103" rx="7" ry="4" fill={INK} />
      <ellipse cx="73" cy="103" rx="7" ry="4" fill={INK} />
      <Eyes l={[51, 81]} r={[69, 81]} size={4.6} mood={mood} />
      <circle cx="60" cy="88.5" r="3.2" fill={INK} />
      <Smile x={60} y={93} w={6} mood={mood} />
      <Cheeks l={[44, 90]} r={[76, 90]} />
      {t >= 3 ? (
        <g fill="var(--scene-glass)" stroke={INK} strokeWidth="2.2">
          <circle cx="51" cy="81" r="8" />
          <circle cx="69" cy="81" r="8" />
          <path d="M59 80h2" fill="none" />
        </g>
      ) : null}
      {t >= 4 ? (
        <>
          <path d="M50 62h20v7H50z" fill="var(--c-night)" {...thin} />
          <path d="M36 58L60 48L84 58L60 67Z" fill="var(--c-night)" {...line} />
          <path d="M60 58L80 62V74" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <path d="M77 72h6l1 8h-8z" fill={VOLT} {...thin} />
        </>
      ) : null}
    </>
  );
}

// Tock — an owl with a clock for a heart (timed papers).
function Tock({ t, mood }) {
  const tuft = [0, 34, 28, 24][t - 1];
  return (
    <>
      {t >= 4 ? <ellipse className="cr-orbit" cx="60" cy="74" rx="52" ry="14" fill="none" stroke={VOLT} strokeWidth="3" strokeDasharray="7 6" /> : null}
      {t >= 4 ? (
        <>
          <path d="M34 60C14 50 4 58 6 70C14 66 18 70 16 76C24 72 28 76 26 84C30 80 34 78 36 80Z" fill={DEEP} {...line} />
          <path d="M86 60C106 50 116 58 114 70C106 66 102 70 104 76C96 72 92 76 94 84C90 80 86 78 84 80Z" fill={DEEP} {...line} />
          <path d="M18 62l8 4M24 60l6 6M102 62l-8 4M96 60l-6 6" stroke={ALT} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M6 70l6-2M16 76l6-2M114 70l-6-2M104 76l-6-2" stroke={VOLT} strokeWidth="3" strokeLinecap="round" />
        </>
      ) : null}
      {t >= 2 ? (
        <>
          <path d={`M40 46L${34} ${tuft}L52 40Z`} fill={DEEP} {...line} />
          <path d={`M80 46L${86} ${tuft}L68 40Z`} fill={DEEP} {...line} />
        </>
      ) : null}
      <ellipse cx="60" cy="70" rx="28" ry="31" fill={MAIN} {...line} />
      {t >= 2 && t < 4 ? (
        <>
          <path d="M34 62C22 72 24 92 38 98C34 86 36 74 34 62Z" fill={DEEP} {...line} />
          <path d="M86 62C98 72 96 92 82 98C86 86 84 74 86 62Z" fill={DEEP} {...line} />
          {t >= 3 ? <path d="M29 76l6 3M29 85l6 3M91 76l-6 3M91 85l-6 3" stroke={ALT} strokeWidth="3" strokeLinecap="round" /> : null}
        </>
      ) : null}
      {t === 1 ? (
        <>
          <ellipse cx="34" cy="80" rx="5" ry="10" fill={DEEP} {...thin} />
          <ellipse cx="86" cy="80" rx="5" ry="10" fill={DEEP} {...thin} />
        </>
      ) : null}
      <circle cx="49" cy="56" r="12" fill={LIGHT} {...line} />
      <circle cx="71" cy="56" r="12" fill={LIGHT} {...line} />
      <Eyes l={[49, 56]} r={[71, 56]} size={5.4} mood={mood} />
      <path d="M55.5 64h9L60 71z" fill={GOLD} {...thin} />
      <circle cx="60" cy="86" r="12.5" fill={PAPER} {...line} />
      <path d="M60 76v2.6M60 93.4V96M50 86h2.6M67.4 86H70" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <g className="cr-clock-hand">
        <path d="M60 86V79" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <path d="M60 86l5 3" stroke={ALT} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="60" cy="86" r="1.8" fill={INK} />
      <path d="M52 100l-3 4M55 101v4M65 101v4M68 100l3 4" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      {t >= 4 ? (
        <path d="M50 42L54 30L58 39L60 26L62 39L66 30L70 42Z" fill={VOLT} {...line} />
      ) : null}
    </>
  );
}

// Rexam — a tiny dinosaur that grows with your paper average.
function Rexam({ t, mood }) {
  const spikes = [0, 3, 5, 5][t - 1];
  const spikeX = spikes === 3 ? [48, 60, 72] : [38, 48, 60, 72, 82];
  return (
    <>
      <path d="M44 94C30 96 18 90 12 78C24 84 34 84 44 82Z" fill={MAIN} {...line} />
      {spikes ? spikeX.map((x, i) => {
        const dy = Math.abs(x - 60) * 0.35;
        return <path key={i} d={`M${x - 6} ${40 + dy}L${x} ${27 + dy}L${x + 6} ${40 + dy}Z`} fill={t >= 4 ? VOLT : ALT} {...thin} />;
      }) : null}
      <ellipse cx="60" cy="88" rx="22" ry="17" fill={MAIN} {...line} />
      <ellipse cx="60" cy="92" rx="13" ry="11" fill={LIGHT} />
      {t >= 2 ? <path d="M50 88h20M49 94h22M52 100h16" stroke={MAIN} strokeWidth="1.8" strokeLinecap="round" opacity="0.55" /> : null}
      <ellipse cx="47" cy="103" rx="8.5" ry="5" fill={MAIN} {...line} />
      <ellipse cx="73" cy="103" rx="8.5" ry="5" fill={MAIN} {...line} />
      <ellipse cx="40" cy="85" rx="3.6" ry="6" transform="rotate(-30 40 85)" fill={MAIN} {...thin} />
      <ellipse cx="80" cy="85" rx="3.6" ry="6" transform="rotate(30 80 85)" fill={MAIN} {...thin} />
      <ellipse cx="60" cy="56" rx="28" ry="23" fill={MAIN} {...line} />
      {t >= 2 ? <circle cx="42" cy="48" r="3.2" fill={ALT} /> : null}
      {t >= 2 ? <circle cx="78" cy="47" r="4" fill={ALT} /> : null}
      {t >= 3 ? <circle cx="72" cy="40" r="2.6" fill={ALT} /> : null}
      <ellipse cx="60" cy="66" rx="17" ry="9.5" fill={LIGHT} />
      <circle cx="55.5" cy="61" r="1.5" fill={INK} />
      <circle cx="64.5" cy="61" r="1.5" fill={INK} />
      <Eyes l={[48, 51]} r={[72, 51]} size={4.8} mood={mood} />
      {mood === 'joy' ? (
        <path d="M50 67q10 10 20 0z" fill={INK} {...thin} />
      ) : (
        <path d="M50 68q10 6 20 0" fill="none" {...thin} />
      )}
      <path d="M53 69.6l1.6 3 1.6-2.4M64 70.2l1.6 2.4 1.6-3" fill={PAPER} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      <Cheeks l={[40, 60]} r={[80, 60]} />
      {t >= 4 ? (
        <>
          <Crown x={60} y={36} w={22} />
          <path d="M44 76L60 86L76 76" fill="none" stroke={ALT} strokeWidth="5" strokeLinecap="round" />
          <circle cx="60" cy="90" r="7" fill={VOLT} {...thin} />
          <path d={sparklePath(60, 90, 4)} fill={INK} />
        </>
      ) : null}
    </>
  );
}

// Tortile — a tortoise carrying your course map on its shell (topics explored).
function isoPoint(p, q) {
  // Shell top face: rhombus with top (60,30), right (100,50), left (20,50).
  return [60 + 40 * p - 40 * q, 30 + 20 * p + 20 * q];
}
const pts = (list) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

function Tortile({ t, mood }) {
  const n = [1, 2, 3, 3][t - 1];
  const filled = { 1: [], 2: [[1, 0]], 3: [[0, 0], [1, 1], [2, 1]], 4: [[0, 0], [1, 1], [2, 1], [2, 2]] }[t];
  const cell = (i, j) => pts([isoPoint(i / n, j / n), isoPoint((i + 1) / n, j / n), isoPoint((i + 1) / n, (j + 1) / n), isoPoint(i / n, (j + 1) / n)]);
  const mid = (i, j) => isoPoint((i + 0.5) / n, (j + 0.5) / n);
  const flagAt = t >= 4 ? mid(2, 2) : mid(2, 1);
  const trail = [mid(0, 0), mid(1, 0), mid(1, 1), mid(2, 1), mid(2, 2)];
  return (
    <>
      <ellipse cx="26" cy="74" rx="8" ry="7" fill={LIGHT} {...line} />
      <ellipse cx="94" cy="74" rx="8" ry="7" fill={LIGHT} {...line} />
      <ellipse cx="42" cy="100" rx="9" ry="6" fill={LIGHT} {...line} />
      <ellipse cx="78" cy="100" rx="9" ry="6" fill={LIGHT} {...line} />
      <polygon points="20,50 60,70 60,84 20,64" fill={DEEP} {...line} />
      <polygon points="60,70 100,50 100,64 60,84" fill={SIDE} {...line} />
      <polygon points="20,50 60,30 100,50 60,70" fill={MAIN} {...line} />
      {filled.map(([i, j]) => <polygon key={`${i}-${j}`} points={cell(i, j)} fill={ALT} />)}
      {Array.from({ length: n - 1 }, (_, k) => {
        const f = (k + 1) / n;
        const [ax, ay] = isoPoint(f, 0);
        const [bx, by] = isoPoint(f, 1);
        const [cx, cy] = isoPoint(0, f);
        const [dx, dy] = isoPoint(1, f);
        return <path key={k} d={`M${ax} ${ay}L${bx} ${by}M${cx} ${cy}L${dx} ${dy}`} stroke={INK} strokeWidth="1.6" opacity="0.55" />;
      })}
      {t >= 4 ? (
        <polyline className="cr-trail" points={pts(trail)} fill="none" stroke={VOLT} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />
      ) : null}
      {t >= 3 ? (
        <g>
          <path d={`M${flagAt[0]} ${flagAt[1]}v-18`} stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
          <path className="cr-flag" d={`M${flagAt[0]} ${flagAt[1] - 18}l12 4-12 4z`} fill={t >= 4 ? VOLT : 'var(--hue-coral)'} {...thin} />
        </g>
      ) : null}
      {t >= 4 ? (
        <g>
          <path d="M40 50v-8" stroke={INK} strokeWidth="2.2" />
          <circle cx="40" cy="39" r="6" fill="var(--hue-green)" {...thin} />
        </g>
      ) : null}
      {t === 1 ? <path d="M60 50c-4-6 0-10 0-10s4 4 0 10" fill={ALT} {...thin} /> : null}
      <circle cx="60" cy="86" r="15" fill={LIGHT} {...line} />
      <Eyes l={[54, 84]} r={[66, 84]} size={3.8} mood={mood} />
      <Smile x={60} y={91} w={6} mood={mood} />
      <Cheeks l={[49, 90]} r={[71, 90]} rx={3.6} />
    </>
  );
}

// Prismo — a crystal beetle with a gem per 3-star topic.
function Crystal({ x, base, w, h, fill, tilt = 0 }) {
  const s = w / 2;
  return (
    <g transform={`rotate(${tilt} ${x} ${base})`}>
      <path d={`M${x - s} ${base}V${base - h + s}L${x} ${base - h}L${x + s} ${base - h + s}V${base}Z`} fill={fill} {...thin} />
      <path d={`M${x - s} ${base - h + s}L${x} ${base - h}V${base}H${x - s}Z`} fill={SHINE} opacity="0.4" />
      <path d={`M${x} ${base - h}V${base}`} stroke={INK} strokeWidth="1.4" opacity="0.6" />
    </g>
  );
}

function Prismo({ t, mood }) {
  const gems = {
    1: [{ x: 60, h: 24, w: 13, tilt: 0 }],
    2: [{ x: 46, h: 18, w: 11, tilt: -24 }, { x: 60, h: 28, w: 14, tilt: 0 }, { x: 74, h: 18, w: 11, tilt: 24 }],
    3: [{ x: 36, h: 14, w: 10, tilt: -44 }, { x: 47, h: 22, w: 12, tilt: -20 }, { x: 60, h: 30, w: 14, tilt: 0 }, { x: 73, h: 22, w: 12, tilt: 20 }, { x: 84, h: 14, w: 10, tilt: 44 }],
    4: [{ x: 36, h: 16, w: 10, tilt: -44 }, { x: 47, h: 24, w: 12, tilt: -20 }, { x: 60, h: 36, w: 16, tilt: 0 }, { x: 73, h: 24, w: 12, tilt: 20 }, { x: 84, h: 16, w: 10, tilt: 44 }],
  }[t];
  return (
    <>
      {t >= 2 ? (
        <g fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round">
          <path d="M46 62C40 52 34 46 28 44" />
          <path d="M74 62C80 52 86 46 92 44" />
        </g>
      ) : null}
      {t >= 2 ? <path d={sparklePath(27, 43, 5)} fill={ALT} {...thin} /> : null}
      {t >= 2 ? <path d={sparklePath(93, 43, 5)} fill={ALT} {...thin} /> : null}
      {gems.map((g, i) => (
        <Crystal key={i} x={g.x} base={66} w={g.w} h={g.h} tilt={g.tilt} fill={t >= 4 && i === 2 ? VOLT : i % 2 ? ALT : MAIN} />
      ))}
      <path d="M34 101l-6 5M40 103l-3 5M86 101l6 5M80 103l3 5" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <polygon points="42,58 78,58 94,72 94,88 78,104 42,104 26,88 26,72" fill={MAIN} {...line} />
      <polygon points="42,58 60,58 50,72 26,72" fill={SHINE} opacity="0.45" />
      <path d="M26 72H94" stroke={INK} strokeWidth="1.6" opacity="0.4" />
      {t >= 3 ? (
        <>
          <path d={sparklePath(31, 88, 4)} fill={ALT} {...thin} />
          <path d={sparklePath(89, 88, 4)} fill={ALT} {...thin} />
        </>
      ) : null}
      <Eyes l={[50, 82]} r={[70, 82]} size={4.8} mood={mood} />
      <Smile x={60} y={91} w={7} mood={mood} />
      <Cheeks l={[42, 90]} r={[78, 90]} />
    </>
  );
}

// Redo — a phoenix chick hatched from a fixed mistake.
function Redo({ t, mood }) {
  const crest = {
    1: [{ x: 60, w: 5, h: 10, r: 0 }],
    2: [{ x: 54, w: 5, h: 12, r: -20 }, { x: 60, w: 6, h: 16, r: 0 }, { x: 66, w: 5, h: 12, r: 20 }],
    3: [{ x: 52, w: 6, h: 16, r: -26 }, { x: 60, w: 7, h: 22, r: 0 }, { x: 68, w: 6, h: 16, r: 26 }],
    4: [{ x: 48, w: 6, h: 14, r: -40 }, { x: 54, w: 6, h: 20, r: -18 }, { x: 60, w: 8, h: 26, r: 0 }, { x: 66, w: 6, h: 20, r: 18 }, { x: 72, w: 6, h: 14, r: 40 }],
  }[t];
  return (
    <>
      {t >= 3 ? (
        <g className="cr-wag">
          <path d={flame(40, 96, 8, 26)} transform="rotate(-62 40 96)" fill={ALT} {...thin} />
          <path d={flame(80, 96, 8, 26)} transform="rotate(62 80 96)" fill={ALT} {...thin} />
        </g>
      ) : null}
      {t >= 3 ? (
        <g className="cr-flap">
          <path d={t >= 4 ? 'M38 70C22 54 6 52 2 58C10 62 12 66 8 70C16 70 18 74 14 80C22 78 26 82 24 88C30 84 36 84 40 86Z' : 'M38 72C26 62 14 62 10 68C16 70 18 74 14 78C22 78 24 82 22 86C28 84 34 84 38 86Z'} fill={MAIN} {...line} />
          <path d={t >= 4 ? 'M82 70C98 54 114 52 118 58C110 62 108 66 112 70C104 70 102 74 106 80C98 78 94 82 96 88C90 84 84 84 80 86Z' : 'M82 72C94 62 106 62 110 68C104 70 102 74 106 78C98 78 96 82 98 86C92 84 86 84 82 86Z'} fill={MAIN} {...line} />
          {t >= 4 ? <path d="M2 58l7 1M118 58l-7 1" stroke={VOLT} strokeWidth="4" strokeLinecap="round" /> : null}
        </g>
      ) : null}
      {crest.map((c, i) => (
        <path key={i} d={flame(c.x, 50, c.w, c.h)} transform={`rotate(${c.r} ${c.x} 50)`} fill={t >= 4 && i === 2 ? VOLT : i === Math.floor(crest.length / 2) ? ALT : MAIN} {...thin} />
      ))}
      <circle cx="60" cy="75" r="27" fill={MAIN} {...line} />
      <ellipse cx="60" cy="86" rx="16" ry="13" fill={LIGHT} />
      {t === 2 ? (
        <>
          <ellipse cx="34" cy="80" rx="6" ry="11" transform="rotate(20 34 80)" fill={ALT} {...thin} />
          <ellipse cx="86" cy="80" rx="6" ry="11" transform="rotate(-20 86 80)" fill={ALT} {...thin} />
        </>
      ) : null}
      <Eyes l={[51, 69]} r={[69, 69]} size={4.8} mood={mood} />
      <path d="M55 77L60 73.5L65 77L60 82Z" fill={GOLD} {...thin} />
      <Cheeks l={[43, 78]} r={[77, 78]} />
      <path d="M53 101l-2 5M56 102v5M64 102v5M67 101l2 5" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
      {t === 1 ? (
        <>
          <ellipse cx="33" cy="80" rx="4.5" ry="8" fill={ALT} {...thin} />
          <ellipse cx="87" cy="80" rx="4.5" ry="8" fill={ALT} {...thin} />
          <path d="M31 86L37 80L43 88L49 80L55 88L61 80L67 88L73 80L79 88L85 80L90 86C92 100 78 108 60 108C42 108 29 100 31 86Z" fill={PAPER} {...line} />
        </>
      ) : null}
    </>
  );
}

// Memmoth — a mammoth that never forgets (memory checks).
function Memmoth({ t, mood }) {
  const tusk = [8, 14, 20, 22][t - 1];
  return (
    <>
      <ellipse cx="30" cy="62" rx="14" ry="19" fill={DEEP} {...line} />
      <ellipse cx="90" cy="62" rx="14" ry="19" fill={DEEP} {...line} />
      <ellipse cx="31" cy="63" rx="7" ry="11" fill={ALT} opacity="0.7" />
      <ellipse cx="89" cy="63" rx="7" ry="11" fill={ALT} opacity="0.7" />
      <ellipse cx="60" cy="90" rx="24" ry="15" fill={MAIN} {...line} />
      <rect x="40" y="94" width="13" height="12" rx="5" fill={MAIN} {...line} />
      <rect x="67" y="94" width="13" height="12" rx="5" fill={MAIN} {...line} />
      <circle cx="60" cy="62" r="28" fill={MAIN} {...line} />
      {t >= 3 ? (
        <path d="M36 50q4-8 8 0q4-8 8 0q4-8 8 0q4-8 8 0q4-8 8 0q4-8 8 0q-2-18-24-20q-22 2-24 20z" fill={DEEP} {...thin} />
      ) : (
        <path d={t >= 2 ? 'M50 36q2-10 8-6q2-8 8-2q6-4 6 6' : 'M54 36q2-6 6-4q4-4 6 2'} fill={DEEP} {...thin} />
      )}
      {t >= 4 ? <Crown x={60} y={32} w={20} /> : null}
      <g>
        <path d={`M50 74C${50 - tusk * 0.4} ${74 + tusk * 0.5} ${50 - tusk * 0.3} ${74 + tusk} ${50 + 4} ${74 + tusk}`} fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
        <path d={`M50 74C${50 - tusk * 0.4} ${74 + tusk * 0.5} ${50 - tusk * 0.3} ${74 + tusk} ${50 + 4} ${74 + tusk}`} fill="none" stroke={PAPER} strokeWidth="4" strokeLinecap="round" />
        <path d={`M70 74C${70 + tusk * 0.4} ${74 + tusk * 0.5} ${70 + tusk * 0.3} ${74 + tusk} ${70 - 4} ${74 + tusk}`} fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
        <path d={`M70 74C${70 + tusk * 0.4} ${74 + tusk * 0.5} ${70 + tusk * 0.3} ${74 + tusk} ${70 - 4} ${74 + tusk}`} fill="none" stroke={PAPER} strokeWidth="4" strokeLinecap="round" />
        {t >= 4 ? (
          <>
            <circle cx={50 + 4} cy={74 + tusk} r="3" fill={VOLT} {...thin} />
            <circle cx={70 - 4} cy={74 + tusk} r="3" fill={VOLT} {...thin} />
          </>
        ) : null}
      </g>
      <g className="cr-trunk">
        <path d="M60 64C60 80 58 88 62 94C66 98 72 94 69 89" fill="none" stroke={INK} strokeWidth="12" strokeLinecap="round" />
        <path d="M60 64C60 80 58 88 62 94C66 98 72 94 69 89" fill="none" stroke={MAIN} strokeWidth="7" strokeLinecap="round" />
      </g>
      {t >= 3 ? (
        <g>
          <path d="M56 80c-6-4-8 2-2 3M64 80c6-4 8 2 2 3" fill="none" stroke={ALT} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="60" cy="81" r="2.4" fill={ALT} stroke={INK} strokeWidth="1.2" />
        </g>
      ) : null}
      <Eyes l={[49, 58]} r={[71, 58]} size={4.4} mood={mood} />
      <Cheeks l={[42, 67]} r={[78, 67]} />
    </>
  );
}

const ART = { ember: Ember, quill: Quill, tock: Tock, rexam: Rexam, tortile: Tortile, prismo: Prismo, redo: Redo, memmoth: Memmoth };
export const CRITTER_ART_IDS = Object.keys(ART);

// ---------- egg ----------

const EGG_PATH = 'M60 34C78 34 90 60 90 76C90 95 77 106 60 106C43 106 30 95 30 76C30 60 42 34 60 34Z';

function EggArt({ progress = 0 }) {
  const cracks = progress >= 0.9 ? 3 : progress >= 0.6 ? 2 : progress >= 0.3 ? 1 : 0;
  return (
    <g className={`cr-egg${progress >= 0.6 ? ' is-close' : ''}`}>
      <path d={EGG_PATH} fill={LIGHT} {...line} />
      <path d="M31 72L38 66L45 73L52 66L59 73L66 66L73 73L80 66L89 72" fill="none" stroke={MAIN} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="48" cy="52" rx="5" ry="6" fill={ALT} />
      <ellipse cx="72" cy="88" rx="6" ry="5" fill={ALT} />
      <ellipse cx="46" cy="90" rx="3.5" ry="3" fill={MAIN} />
      <ellipse cx="70" cy="48" rx="3" ry="3.5" fill={MAIN} />
      <path d="M44 44q6-8 12-9" fill="none" stroke={SHINE} strokeWidth="3.4" strokeLinecap="round" opacity="0.8" />
      {cracks >= 1 ? <path d="M58 35l3 7-4 5 5 6" fill="none" {...thin} /> : null}
      {cracks >= 2 ? <path d="M89 80l-8 2 2 6-7 4" fill="none" {...thin} /> : null}
      {cracks >= 3 ? <path d="M32 84l8 1-1 7 7 3" fill="none" {...thin} /> : null}
      {cracks >= 3 ? (
        <g className="cr-peek">
          <circle cx="54" cy="60" r="2.4" fill={INK} />
          <circle cx="64" cy="60" r="2.4" fill={INK} />
        </g>
      ) : null}
    </g>
  );
}

function rootStyle(id, style) {
  const hues = CRITTER_HUES[id] || { hue: 'slate', alt: 'blue' };
  return { '--cr-main': hueVar(hues.hue), '--cr-alt': hueVar(hues.alt), ...style };
}

// The creature art as a <g>, for embedding in other SVGs (badges).
export function CritterArt({ id, tier = 1, mood = 'happy', progress = 0 }) {
  const Art = ART[id];
  if (!Art || tier <= 0) return <EggArt progress={progress} />;
  const t = Math.max(1, Math.min(4, tier));
  const s = CRITTER_SCALE[t];
  return (
    <g transform={`translate(${60 - 60 * s} ${106 - 106 * s}) scale(${s})`}>
      <g className="cr-body">
        <Art t={t} mood={mood} />
      </g>
      {t >= 4 ? <LegendSparkles /> : null}
    </g>
  );
}

// A standalone creature. tier 0 draws its egg; `silhouette` hides the
// details for evolutions the learner has not reached yet.
// `viewBox` crops the stage, e.g. for round avatars.
export default function Critter({ id, tier = 1, size = 96, mood = 'happy', progress = 0, silhouette = false, title = null, className = '', style = null, viewBox = '0 0 120 120' }) {
  return (
    <svg
      className={`critter critter-${id} tier-${tier}${silhouette ? ' is-silhouette' : ''} ${className}`.trim()}
      viewBox={viewBox}
      width={size}
      height={size}
      style={rootStyle(id, style)}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <ellipse className="cr-shadow" cx="60" cy="109" rx="30" ry="5" fill="var(--tile-shadow)" />
      <g className="cr-art">
        <CritterArt id={id} tier={tier} mood={mood} progress={progress} />
      </g>
    </svg>
  );
}

// ---------- rank badge ----------

const RANK_IDS = ['egg', 'bronze', 'silver', 'gold', 'legend'];

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');
}

function BadgeStar({ x, y, r = 6 }) {
  const p = Array.from({ length: 10 }, (_, i) => {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(x + rr * Math.cos(a)).toFixed(2)},${(y + rr * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return <polygon points={p} fill="var(--rank)" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />;
}

function Wings({ legend }) {
  const feathers = legend ? 4 : 3;
  const side = (dir) => (
    <g>
      {Array.from({ length: feathers }, (_, i) => {
        const y = 62 + i * 14;
        const len = (legend ? 30 : 25) - i * 4;
        const x0 = 80 + dir * 50;
        return (
          <path
            key={i}
            d={`M${x0} ${y}C${x0 + dir * len * 0.5} ${y - 12} ${x0 + dir * len} ${y - 6} ${x0 + dir * len} ${y - 4}C${x0 + dir * len * 0.7} ${y + 8} ${x0 + dir * len * 0.3} ${y + 12} ${x0} ${y + 12}Z`}
            fill={i === 0 && legend ? VOLT : 'var(--rank)'}
            {...thin}
          />
        );
      })}
    </g>
  );
  return (
    <g className="badge-wings">
      {side(-1)}
      {side(1)}
    </g>
  );
}

// Credly-style rank badge: a hexagon medal whose frame grows with the rank
// (Bronze plain → Silver rivets → Gold wings → Legend crown + halo) with
// the creature breaking out of it. Tier 0 is a dashed nest with the egg and
// a hatch-progress ring.
export function CritterBadge({ id, tier = 0, toNext = 0, size = 120, mood = 'happy', title = null, className = '' }) {
  const rank = RANK_IDS[Math.max(0, Math.min(4, tier))];
  const ringLength = 2 * Math.PI * 60;
  return (
    <svg
      className={`critter-badge rank-${rank} ${className}`.trim()}
      viewBox="0 0 160 172"
      width={size}
      height={(size * 172) / 160}
      style={rootStyle(id, { '--rank': `var(--rank-${rank})` })}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {tier === 0 ? (
        <>
          <circle cx="80" cy="86" r="60" fill="var(--c-surface-2)" stroke="var(--c-line-strong)" strokeWidth="3" strokeDasharray="7 7" />
          <circle
            className="badge-hatch"
            cx="80"
            cy="86"
            r="60"
            fill="none"
            stroke={VOLT}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(ringLength * Math.max(0, Math.min(1, toNext))).toFixed(1)} ${ringLength.toFixed(1)}`}
            transform="rotate(-90 80 86)"
          />
          <g transform="translate(26 30) scale(0.9)">
            <ellipse cx="60" cy="109" rx="26" ry="4.5" fill="var(--tile-shadow)" />
            <CritterArt id={id} tier={0} progress={toNext} />
          </g>
        </>
      ) : (
        <>
          {tier >= 4 ? <circle className="badge-halo" cx="80" cy="84" r="76" fill="none" stroke={VOLT} strokeWidth="3" strokeDasharray="8 7" /> : null}
          {tier >= 3 ? <Wings legend={tier >= 4} /> : null}
          <polygon points={hexPoints(80, 90, 66)} fill={INK} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <polygon points={hexPoints(80, 84, 66)} fill="var(--rank)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <polygon points={hexPoints(80, 84, 59)} fill="none" stroke="var(--rank-shine)" strokeWidth="3" strokeLinejoin="round" />
          <polygon points={hexPoints(80, 84, 52)} fill="var(--cr-wash)" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          {tier >= 2 ? hexPoints(80, 84, 59).split(' ').map((pt, i) => {
            const [x, y] = pt.split(',').map(Number);
            return <circle key={i} cx={x} cy={y} r="3.4" fill="var(--rank-shine)" stroke={INK} strokeWidth="1.4" />;
          }) : null}
          <g transform="translate(23.6 29.6) scale(0.94)">
            <CritterArt id={id} tier={tier} mood={mood} />
          </g>
          <path d="M22 134h16v24l-8-5-8 5zM122 134h16v24l-8-5-8 5z" fill="var(--c-night-3)" {...thin} />
          <path d="M30 128H130L126 139L130 150H30L34 139Z" fill="var(--c-night)" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          {Array.from({ length: tier }, (_, i) => <BadgeStar key={i} x={80 + (i - (tier - 1) / 2) * 17} y={139} r={7.2} />)}
          {tier >= 4 ? <Crown x={80} y={22} w={28} /> : null}
        </>
      )}
    </svg>
  );
}
