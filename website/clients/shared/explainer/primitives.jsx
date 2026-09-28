import Emblem from '../circuit/Emblem.jsx';
import Pip from '../circuit/Pip.jsx';
import { wrapWords } from './engine.js';

// Explainer primitives — every visual an explainer script can place on
// the 960×540 stage. Each renderer is pure: (props, enter 0→1, exit 0→1,
// pulse 0→1|null) → SVG. Add new primitives here and document them in
// website/design/VIDEO_AUTHORING.md (the table of element types).

const FONTS = {
  display: 'var(--font-display)',
  ui: 'var(--font-ui)',
  mono: 'var(--font-mono)',
  hand: 'var(--font-hand)',
  read: 'var(--font-read)',
};

export function col(name, fallback = 'var(--b-ink)') {
  if (!name) return fallback;
  if (name === 'ink') return 'var(--b-ink)';
  if (name === 'muted') return 'var(--b-muted)';
  if (name === 'bg') return 'var(--b-bg)';
  if (name === 'panel') return 'var(--b-panel)';
  if (name === 'good') return 'var(--b-good)';
  if (name === 'bad') return 'var(--b-bad)';
  if (/^[a-z]+$/.test(name)) return `var(--hue-${name})`;
  return name;
}

const font = (key) => FONTS[key] || FONTS.ui;

// Canvas can't resolve CSS variables, so measurement uses the concrete
// family stacks behind the --font-* tokens (see circuit/tokens.css).
const MEASURE_FAMILIES = {
  display: '"Unbounded Variable", "Unbounded", sans-serif',
  ui: '"Atkinson Hyperlegible Next Variable", "Atkinson Hyperlegible Next", sans-serif',
  mono: '"Atkinson Hyperlegible Mono Variable", "Atkinson Hyperlegible Mono", monospace',
  hand: '"Kalam", cursive',
  read: '"Literata Variable", "Literata", Georgia, serif',
};
const widthCache = new Map();
let measureCtx = null;

// Real text width in stage units (the stage is 1:1 with SVG user units).
// Falls back to an estimate where canvas is unavailable (tests, SSR).
export function textWidth(text, size, fontKey = 'ui', weight = 400) {
  const family = MEASURE_FAMILIES[fontKey] || MEASURE_FAMILIES.ui;
  const spec = `${weight} ${size}px ${family}`;
  let loaded = true;
  try {
    loaded = typeof document === 'undefined' || !document.fonts || document.fonts.check(spec);
  } catch {}
  const key = `${spec}|${loaded ? 1 : 0}|${text}`;
  if (widthCache.has(key)) return widthCache.get(key);
  let width = String(text).length * size * (fontKey === 'read' ? 0.5 : 0.55);
  try {
    if (!measureCtx && typeof document !== 'undefined') measureCtx = document.createElement('canvas').getContext('2d');
    if (measureCtx) {
      measureCtx.font = spec;
      width = measureCtx.measureText(String(text)).width;
    }
  } catch {}
  widthCache.set(key, width);
  return width;
}

function measuredLines(text, maxWidth, size, fontKey) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const space = textWidth(' ', size, fontKey) * 1.15;
  const lines = [];
  let line = [];
  let cursor = 0;
  words.forEach((word, index) => {
    const w = textWidth(word, size, fontKey);
    if (line.length && cursor + space + w > maxWidth) {
      lines.push(line);
      line = [];
      cursor = 0;
    }
    const x = line.length ? cursor + space : 0;
    line.push({ word, index, x, w });
    cursor = x + w;
  });
  if (line.length) lines.push(line);
  return lines;
}

function Label({ x, y, text, size = 22, color = 'ink', fontKey = 'mono', anchor = 'middle', weight = 700, opacity = 1 }) {
  if (text == null || text === '') return null;
  return (
    <text x={x} y={y} fontSize={size} fill={col(color)} fontFamily={font(fontKey)} fontWeight={weight} textAnchor={anchor} dominantBaseline="central" opacity={opacity}>
      {text}
    </text>
  );
}

// ---------------------------------------------------------------- text
function TextEl({ props, enter, anim }) {
  const { x = 480, y = 270, text = '', size = 40, fontKey = 'display', color = 'ink', anchor = 'middle', weight = 700, italic = false, lh = 1.25 } = props;
  const full = String(text);
  const shown = anim === 'write' ? full.slice(0, Math.max(0, Math.round(full.length * enter))) : full;
  const lines = shown.split('\n');
  const offset = ((lines.length - 1) * size * lh) / 2;
  return (
    <text
      x={x}
      y={y - (props.valign === 'top' ? 0 : offset)}
      fontSize={size}
      fill={col(color)}
      fontFamily={font(props.font || fontKey)}
      fontWeight={weight}
      fontStyle={italic ? 'italic' : undefined}
      textAnchor={anchor}
      dominantBaseline="central"
    >
      {lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : size * lh}>{line || ' '}</tspan>
      ))}
    </text>
  );
}

// ---------------------------------------------------------------- fraction
function FracEl({ props }) {
  const { x = 480, y = 270, n = 1, d = 2, size = 48, color = 'ink', fontKey = 'display' } = props;
  const width = Math.max(String(n).length, String(d).length) * size * 0.62 + 12;
  return (
    <g>
      <Label x={x} y={y - size * 0.62} text={String(n)} size={size} color={color} fontKey={props.font || fontKey} />
      <line x1={x - width / 2} x2={x + width / 2} y1={y} y2={y} stroke={col(color)} strokeWidth={Math.max(3, size / 14)} strokeLinecap="round" />
      <Label x={x} y={y + size * 0.66} text={String(d)} size={size} color={color} fontKey={props.font || fontKey} />
    </g>
  );
}

// ---------------------------------------------------------------- shapes
function RectEl({ props, enter, anim }) {
  const { x = 0, y = 0, w = 100, h = 60, r = 14, fill = 'panel', stroke = 'ink', sw = 3, opacity = 1, dash } = props;
  const draw = anim === 'draw';
  return (
    <rect
      x={x}
      y={y}
      width={Math.max(0, w)}
      height={Math.max(0, h)}
      rx={r}
      fill={fill === 'none' ? 'none' : col(fill)}
      fillOpacity={draw ? enter * opacity : opacity}
      stroke={stroke === 'none' ? 'none' : col(stroke)}
      strokeWidth={sw}
      strokeDasharray={draw ? 1 : dash}
      strokeDashoffset={draw ? 1 - enter : undefined}
      pathLength={draw ? 1 : undefined}
    />
  );
}

function CircleEl({ props, enter, anim }) {
  const { x = 480, y = 270, r = 40, fill = 'none', stroke = 'ink', sw = 3, opacity = 1, dash } = props;
  const draw = anim === 'draw';
  return (
    <circle
      cx={x}
      cy={y}
      r={Math.max(0, r)}
      fill={fill === 'none' ? 'none' : col(fill)}
      fillOpacity={opacity}
      stroke={stroke === 'none' ? 'none' : col(stroke)}
      strokeWidth={sw}
      strokeDasharray={draw ? 1 : dash}
      strokeDashoffset={draw ? 1 - enter : undefined}
      pathLength={draw ? 1 : undefined}
      transform={draw ? `rotate(-90 ${x} ${y})` : undefined}
    />
  );
}

function ArrowHead({ x, y, angle, color, size = 14 }) {
  return (
    <path
      d={`M0 0 L${-size} ${-size * 0.55} L${-size * 0.72} 0 L${-size} ${size * 0.55} Z`}
      transform={`translate(${x} ${y}) rotate(${angle})`}
      fill={col(color)}
      stroke={col(color)}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  );
}

function LineEl({ props, enter, anim, type }) {
  const { x1 = 0, y1 = 0, x2 = 100, y2 = 0, color = 'ink', sw = 4, dash, label, labelDx = 0, labelDy = -18, labelColor } = props;
  const p = anim === 'draw' ? enter : 1;
  const ex = x1 + (x2 - x1) * p;
  const ey = y1 + (y2 - y1) * p;
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const head = type === 'arrow' || props.head;
  return (
    <g>
      <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={col(color)} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash} />
      {head && p > 0.85 ? <ArrowHead x={ex} y={ey} angle={angle} color={color} size={sw * 3.4} /> : null}
      {label ? <Label x={(x1 + x2) / 2 + labelDx} y={(y1 + y2) / 2 + labelDy} text={label} color={labelColor || color} size={props.labelSize || 24} opacity={p} /> : null}
    </g>
  );
}

function PathEl({ props, enter, anim }) {
  const { d = '', color = 'ink', sw = 4, fill = 'none', opacity = 1, dash } = props;
  const draw = anim === 'draw';
  return (
    <path
      d={d}
      fill={fill === 'none' ? 'none' : col(fill)}
      fillOpacity={draw ? enter * opacity : opacity}
      stroke={col(color)}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={draw ? 1 : undefined}
      strokeDasharray={draw ? 1 : dash}
      strokeDashoffset={draw ? 1 - enter : undefined}
    />
  );
}

function PointEl({ props }) {
  const { x = 0, y = 0, r = 8, color = 'volt', label, labelDx = 16, labelDy = -16, labelColor = 'ink', anchor = 'start' } = props;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={col(color)} stroke="var(--b-line)" strokeWidth="3" />
      {label ? <Label x={x + labelDx} y={y + labelDy} text={label} color={labelColor} anchor={anchor} size={props.labelSize || 22} /> : null}
    </g>
  );
}

function ArcEl({ props, enter, anim }) {
  const { cx = 480, cy = 270, r = 40, a0 = 0, a1 = 90, color = 'volt', sw = 4, label, labelR, fill = true } = props;
  const p = anim === 'draw' ? enter : 1;
  const end = a0 + (a1 - a0) * p;
  const rad = (deg) => (deg * Math.PI) / 180;
  const sx = cx + r * Math.cos(rad(a0));
  const sy = cy + r * Math.sin(rad(a0));
  const ex = cx + r * Math.cos(rad(end));
  const ey = cy + r * Math.sin(rad(end));
  const large = Math.abs(end - a0) > 180 ? 1 : 0;
  const sweep = end > a0 ? 1 : 0;
  const mid = rad((a0 + end) / 2);
  const lr = labelR ?? r + 26;
  return (
    <g>
      {fill ? <path d={`M${cx} ${cy} L${sx} ${sy} A${r} ${r} 0 ${large} ${sweep} ${ex} ${ey} Z`} fill={col(color)} fillOpacity="0.28" /> : null}
      <path d={`M${sx} ${sy} A${r} ${r} 0 ${large} ${sweep} ${ex} ${ey}`} fill="none" stroke={col(color)} strokeWidth={sw} strokeLinecap="round" />
      {label && p > 0.9 ? <Label x={cx + lr * Math.cos(mid)} y={cy + lr * Math.sin(mid)} text={label} color={props.labelColor || color} size={props.labelSize || 24} /> : null}
    </g>
  );
}

// ---------------------------------------------------------------- bar model
function BarEl({ props, enter }) {
  const { x = 160, y = 220, w = 640, h = 72, parts = 1, fill = 0, color = 'blue', label, labelColor = 'ink', r = 14, fillColors, total = null, each = false } = props;
  const count = Math.max(1, Math.ceil(parts - 1e-6));
  // `each: true` + `total` labels every part with total ÷ parts, so the bar
  // stays correct when a sandbox slider changes the number of parts.
  const eachValue = total != null ? Math.round((total / Math.max(1, Math.round(parts))) * 100) / 100 : null;
  const labels = each && eachValue != null ? Array.from({ length: count }, () => String(eachValue)) : props.labels || [];
  const partW = w / Math.max(1, parts);
  const whole = Math.max(0, Math.min(count, fill));
  const cells = [];
  for (let index = 0; index < count; index += 1) {
    const amount = Math.max(0, Math.min(1, whole - index));
    if (amount <= 0) continue;
    cells.push(
      <rect
        key={`f${index}`}
        x={x + index * partW + 3}
        y={y + 3}
        width={Math.max(0, partW * amount - 6)}
        height={h - 6}
        rx={Math.max(2, r - 4)}
        fill={col(fillColors?.[index] || color)}
      />,
    );
  }
  const dividers = [];
  for (let index = 1; index < count; index += 1) {
    const visible = Math.max(0, Math.min(1, parts - index));
    dividers.push(<line key={`d${index}`} x1={x + index * partW} x2={x + index * partW} y1={y} y2={y + h} stroke="var(--b-line)" strokeWidth="4" opacity={visible} />);
  }
  return (
    <g opacity={enter}>
      <rect x={x} y={y} width={w} height={h} rx={r} fill="var(--b-panel)" stroke="var(--b-line)" strokeWidth="4" />
      {cells}
      {dividers}
      {labels.map((text, index) => (text == null || text === '' ? null : (
        <Label key={`l${index}`} x={x + partW * index + partW / 2} y={y + h / 2} text={text} size={Math.min(34, h * 0.42)} color={index < whole ? 'bg' : labelColor} fontKey="display" />
      )))}
      {label ? (
        <g>
          <path d={`M${x} ${y - 16} v-10 H${x + w} v10`} fill="none" stroke={col('muted')} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <Label x={x + w / 2} y={y - 46} text={label} size={30} fontKey="display" />
        </g>
      ) : null}
    </g>
  );
}

// ---------------------------------------------------------------- number line
function NumberLineEl({ props, enter, anim }) {
  const { x = 120, y = 300, w = 720, min = 0, max = 10, step = 1, labelEvery = 1, marks = [], jumps = [], point = null, pointLabel, color = 'ink', format } = props;
  const span = max - min || 1;
  const px = (value) => x + ((value - min) / span) * w;
  const draw = anim === 'draw' ? enter : 1;
  const ticks = [];
  const steps = Math.round(span / step);
  for (let index = 0; index <= steps; index += 1) {
    const value = min + index * step;
    const tx = px(value);
    if (tx > x + w * draw + 0.5) continue;
    const labelled = Math.abs((value - min) / step) % labelEvery < 1e-6;
    const text = format === 'decimal1' ? value.toFixed(1) : format === 'decimal2' ? value.toFixed(2) : Number(value.toFixed(4)).toString();
    ticks.push(
      <g key={index}>
        <line x1={tx} x2={tx} y1={y - (labelled ? 14 : 8)} y2={y + (labelled ? 14 : 8)} stroke={col(color)} strokeWidth="3" strokeLinecap="round" />
        {labelled ? <Label x={tx} y={y + 38} text={text} size={22} color="muted" /> : null}
      </g>,
    );
  }
  return (
    <g>
      <line x1={x - 12} x2={x + (w + 24) * draw - 12} y1={y} y2={y} stroke={col(color)} strokeWidth="4" strokeLinecap="round" />
      {ticks}
      {jumps.map((jump, index) => {
        const a = px(jump.from);
        const b = px(jump.to);
        const top = y - 40 - Math.min(60, Math.abs(b - a) * 0.28);
        return (
          <g key={`j${index}`}>
            <path d={`M${a} ${y - 10} Q${(a + b) / 2} ${top} ${b} ${y - 10}`} fill="none" stroke={col(jump.color || 'volt')} strokeWidth="4" strokeLinecap="round" />
            <ArrowHead x={b} y={y - 10} angle={b > a ? 60 : 120} color={jump.color || 'volt'} size={12} />
            {jump.label ? <Label x={(a + b) / 2} y={top - 8} text={jump.label} color={jump.color || 'volt'} size={24} fontKey="display" /> : null}
          </g>
        );
      })}
      {marks.map((mark, index) => (
        <g key={`m${index}`}>
          <circle cx={px(mark.v)} cy={y} r="9" fill={col(mark.color || 'blue')} stroke="var(--b-line)" strokeWidth="3" />
          {mark.label ? <Label x={px(mark.v)} y={y - 34} text={mark.label} color={mark.color || 'blue'} size={24} fontKey="display" /> : null}
        </g>
      ))}
      {point != null ? (
        <g>
          <circle cx={px(point)} cy={y} r="13" fill={col(props.pointColor || 'volt')} stroke="var(--b-line)" strokeWidth="4" />
          {pointLabel ? <Label x={px(point)} y={y - 40} text={pointLabel} size={26} fontKey="display" color={props.pointColor || 'volt'} /> : null}
        </g>
      ) : null}
    </g>
  );
}

function signed(value, lead = false) {
  const n = Math.round(value * 100) / 100;
  if (lead) return String(n);
  return n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`;
}

// equation: 'line' → y = mx + c, 'quad' → y = ax² + bx + c, else literal.
function equationText(props) {
  if (props.equation === 'line') {
    const m = Math.round((props.m ?? 0) * 100) / 100;
    const c = props.c ?? 0;
    const mx = m === 0 ? '' : m === 1 ? 'x' : m === -1 ? '−x' : `${signed(m, true)}x`;
    if (!mx) return `y = ${signed(c, true)}`;
    return Math.abs(c) < 1e-9 ? `y = ${mx}` : `y = ${mx} ${signed(c)}`;
  }
  if (props.equation === 'quad') {
    const a = Math.round((props.qa ?? 1) * 100) / 100;
    const b = props.qb ?? 0;
    const c = props.qc ?? 0;
    let out = `y = ${a === 1 ? '' : a === -1 ? '−' : a}x²`;
    if (Math.abs(b) > 1e-9) out += ` ${signed(b)}x`.replace(/([+−]) 1x/, '$1 x');
    if (Math.abs(c) > 1e-9) out += ` ${signed(c)}`;
    return out;
  }
  return String(props.equation);
}

// ---------------------------------------------------------------- axes + graphs
function AxesEl({ id, props, enter }) {
  const { x = 180, y = 60, w = 600, h = 420, xmin = -5, xmax = 5, ymin = -5, ymax = 5, step = 1, grid = true, points = [], labels = true } = props;
  // Shorthands so sandbox sliders and tweens can drive ONE line (m, c) or
  // ONE quadratic (qa, qb, qc) through top-level numeric props.
  const lines = [...(props.lines || []), ...(props.m != null ? [{ m: props.m, c: props.c ?? 0, color: props.lineColor || 'volt' }] : [])];
  const curves = [...(props.curves || []), ...(props.qa != null ? [{ a: props.qa, b: props.qb ?? 0, c: props.qc ?? 0, color: props.curveColor || 'purple' }] : [])];
  const riseRun = props.riseRun === true && props.m != null
    ? { x1: props.runFrom ?? 0, x2: (props.runFrom ?? 0) + (props.run ?? 1), m: props.m, c: props.c ?? 0, color: props.riseColor || 'coral' }
    : props.riseRun && typeof props.riseRun === 'object' ? props.riseRun : null;
  const rootPoints = [];
  if (props.showRoots && props.qa) {
    const disc = props.qb ** 2 - 4 * props.qa * (props.qc ?? 0);
    if (disc >= 0) {
      const r1 = (-props.qb - Math.sqrt(disc)) / (2 * props.qa);
      const r2 = (-props.qb + Math.sqrt(disc)) / (2 * props.qa);
      for (const root of disc === 0 ? [r1] : [r1, r2]) {
        if (root >= xmin && root <= xmax) rootPoints.push({ x: root, y: 0, label: `x = ${Math.round(root * 100) / 100}`, color: 'volt' });
      }
    }
  }
  if (props.showIntercept && props.m != null && (props.c ?? 0) >= ymin && (props.c ?? 0) <= ymax) {
    rootPoints.push({ x: 0, y: props.c ?? 0, label: `(0, ${Math.round((props.c ?? 0) * 100) / 100})`, color: 'cyan' });
  }
  const sx = (value) => x + ((value - xmin) / (xmax - xmin)) * w;
  const sy = (value) => y + h - ((value - ymin) / (ymax - ymin)) * h;
  const clip = `ax-${id}`;
  const gridLines = [];
  if (grid) {
    for (let v = Math.ceil(xmin / step) * step; v <= xmax + 1e-9; v += step) gridLines.push(<line key={`gx${v}`} x1={sx(v)} x2={sx(v)} y1={y} y2={y + h} stroke="var(--b-grid)" strokeWidth="1.5" />);
    for (let v = Math.ceil(ymin / step) * step; v <= ymax + 1e-9; v += step) gridLines.push(<line key={`gy${v}`} x1={x} x2={x + w} y1={sy(v)} y2={sy(v)} stroke="var(--b-grid)" strokeWidth="1.5" />);
  }
  const axisX = Math.min(Math.max(0, ymin), ymax);
  const axisY = Math.min(Math.max(0, xmin), xmax);
  const tickLabels = [];
  if (labels) {
    for (let v = Math.ceil(xmin / step) * step; v <= xmax + 1e-9; v += step) {
      if (Math.abs(v) < 1e-9) continue;
      tickLabels.push(<Label key={`lx${v}`} x={sx(v)} y={sy(axisX) + 20} text={String(Math.round(v * 100) / 100)} size={16} color="muted" />);
    }
    for (let v = Math.ceil(ymin / step) * step; v <= ymax + 1e-9; v += step) {
      if (Math.abs(v) < 1e-9) continue;
      tickLabels.push(<Label key={`ly${v}`} x={sx(axisY) - 16} y={sy(v)} text={String(Math.round(v * 100) / 100)} size={16} color="muted" anchor="end" />);
    }
  }
  const sample = (fn) => {
    const pts = [];
    for (let index = 0; index <= 80; index += 1) {
      const vx = xmin + ((xmax - xmin) * index) / 80;
      pts.push(`${index ? 'L' : 'M'}${sx(vx).toFixed(1)} ${sy(fn(vx)).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  return (
    <g opacity={enter}>
      <defs>
        <clipPath id={clip}><rect x={x} y={y} width={w} height={h} /></clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx="10" fill="var(--b-panel)" />
      {gridLines}
      <line x1={x} x2={x + w} y1={sy(axisX)} y2={sy(axisX)} stroke="var(--b-ink)" strokeWidth="3" />
      <line x1={sx(axisY)} x2={sx(axisY)} y1={y} y2={y + h} stroke="var(--b-ink)" strokeWidth="3" />
      <Label x={x + w - 12} y={sy(axisX) - 18} text="x" size={20} fontKey="hand" />
      <Label x={sx(axisY) + 18} y={y + 14} text="y" size={20} fontKey="hand" />
      {tickLabels}
      <g clipPath={`url(#${clip})`}>
        {lines.map((line, index) => (
          <path key={`ln${index}`} d={sample((vx) => line.m * vx + line.c)} fill="none" stroke={col(line.color || 'volt')} strokeWidth="5" strokeLinecap="round" />
        ))}
        {curves.map((curve, index) => (
          <path key={`cv${index}`} d={sample((vx) => (curve.a ?? 1) * vx * vx + (curve.b ?? 0) * vx + (curve.c ?? 0))} fill="none" stroke={col(curve.color || 'purple')} strokeWidth="5" strokeLinecap="round" />
        ))}
        {riseRun ? (() => {
          const { x1: rx1 = 0, x2: rx2 = 1, m = 1, c = 0, color = 'coral' } = riseRun;
          const ya = m * rx1 + c;
          const yb = m * rx2 + c;
          return (
            <g>
              <path d={`M${sx(rx1)} ${sy(ya)} H${sx(rx2)} V${sy(yb)}`} fill="none" stroke={col(color)} strokeWidth="4" strokeDasharray="10 8" strokeLinecap="round" />
              <Label x={(sx(rx1) + sx(rx2)) / 2} y={sy(ya) + (m >= 0 ? 22 : -22)} text={`run ${Math.round((rx2 - rx1) * 100) / 100}`} color={color} size={20} fontKey="hand" />
              <Label x={sx(rx2) + 12} y={(sy(ya) + sy(yb)) / 2} text={`rise ${Math.round((yb - ya) * 100) / 100}`} color={color} size={20} fontKey="hand" anchor="start" />
            </g>
          );
        })() : null}
      </g>
      {[...points, ...rootPoints].map((point, index) => (
        <PointEl key={`pt${index}`} props={{ x: sx(point.x), y: sy(point.y), color: point.color || 'volt', label: point.label, labelColor: point.labelColor || 'ink', r: 8 }} />
      ))}
      {props.equation ? <Label x={x + 16} y={y + 26} text={equationText(props)} anchor="start" size={24} fontKey="mono" color={props.equationColor || 'ink'} /> : null}
    </g>
  );
}

// ---------------------------------------------------------------- right triangle
function TriEl({ props, enter, anim }) {
  const { x = 300, y = 400, a = 240, b = 180, color = 'green', labels = {}, squares = 0, areas = {}, right = true } = props;
  const A = [x, y];
  const B = [x + a, y];
  const C = [x, y - b];
  const draw = anim === 'draw' ? enter : 1;
  const hyp = Math.hypot(a, b);
  // outward normal for hypotenuse square
  const nx = b / hyp;
  const ny = -a / hyp;
  // hypotenuse runs C→B; outward normal points up-right (away from A)
  const sqC = [
    C,
    B,
    [B[0] + nx * hyp, B[1] + ny * hyp],
    [C[0] + nx * hyp, C[1] + ny * hyp],
  ];
  return (
    <g>
      {squares > 0 ? (
        <g opacity={squares}>
          <rect x={x} y={y} width={a} height={a} fill={col('blue')} fillOpacity="0.25" stroke={col('blue')} strokeWidth="3" />
          <rect x={x - b} y={y - b} width={b} height={b} fill={col('amber')} fillOpacity="0.25" stroke={col('amber')} strokeWidth="3" />
          <polygon points={sqC.map((p) => p.join(',')).join(' ')} fill={col('purple')} fillOpacity="0.25" stroke={col('purple')} strokeWidth="3" />
          {areas.a ? <Label x={x + a / 2} y={y + a / 2} text={areas.a} color="blue" size={30} fontKey="display" /> : null}
          {areas.b ? <Label x={x - b / 2} y={y - b / 2} text={areas.b} color="amber" size={30} fontKey="display" /> : null}
          {areas.c ? <Label x={(sqC[0][0] + sqC[2][0]) / 2} y={(sqC[0][1] + sqC[2][1]) / 2} text={areas.c} color="purple" size={30} fontKey="display" /> : null}
        </g>
      ) : null}
      <polygon
        points={`${A.join(',')} ${B.join(',')} ${C.join(',')}`}
        fill={col(color)}
        fillOpacity={0.22 * draw}
        stroke={col(color)}
        strokeWidth="5"
        strokeLinejoin="round"
        pathLength={anim === 'draw' ? 1 : undefined}
        strokeDasharray={anim === 'draw' ? 1 : undefined}
        strokeDashoffset={anim === 'draw' ? 1 - enter : undefined}
      />
      {right ? <path d={`M${x + 22} ${y} V${y - 22} H${x}`} fill="none" stroke={col(color)} strokeWidth="3" /> : null}
      {labels.a ? <Label x={x + a / 2} y={squares > 0.5 ? y + a + 26 : y + 30} text={labels.a} size={26} fontKey="display" color={labels.aColor || 'ink'} /> : null}
      {labels.b ? <Label x={squares > 0.5 ? x - b - 14 : x - 30} y={y - b / 2} text={labels.b} size={26} fontKey="display" anchor={squares > 0.5 ? 'end' : 'middle'} color={labels.bColor || 'ink'} /> : null}
      {labels.c ? <Label x={squares > 0.5 ? (sqC[0][0] + sqC[2][0]) / 2 : x + a / 2 + nx * 34} y={squares > 0.5 ? (sqC[0][1] + sqC[2][1]) / 2 + 40 : y - b / 2 + ny * 34} text={labels.c} size={26} fontKey="display" color={labels.cColor || 'ink'} /> : null}
    </g>
  );
}

// ---------------------------------------------------------------- dots / grid
function DotsEl({ props, enter }) {
  const { x = 300, y = 200, rows = 3, cols = 4, gap = 40, r = 13, color = 'blue', alt = 'muted', highlight = null, groupEvery = 0 } = props;
  const dots = [];
  let n = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < cols; column += 1) {
      const lit = highlight == null ? true : n < highlight;
      const gx = groupEvery ? Math.floor(column / groupEvery) * 18 : 0;
      const visible = Math.min(1, Math.max(0, enter * rows * cols - n));
      dots.push(<circle key={n} cx={x + column * gap + gx} cy={y + row * gap} r={r * (0.6 + 0.4 * visible)} fill={col(lit ? color : alt)} opacity={visible} stroke="var(--b-line)" strokeWidth="2" />);
      n += 1;
    }
  }
  return <g>{dots}</g>;
}

function GridEl({ props, enter }) {
  const { x = 300, y = 150, cols = 5, rows = 4, cell = 44, fill = 0, color = 'green' } = props;
  const cells = [];
  for (let index = 0; index < cols * rows; index += 1) {
    const cx = index % cols;
    const cy = Math.floor(index / cols);
    cells.push(<rect key={index} x={x + cx * cell} y={y + cy * cell} width={cell} height={cell} fill={index < fill ? col(color) : 'var(--b-panel)'} fillOpacity={index < fill ? 0.75 : 1} stroke="var(--b-line)" strokeWidth="2" />);
  }
  return <g opacity={enter}>{cells}</g>;
}

// ---------------------------------------------------------------- words (English)
function WordsEl({ id, props, enter, tap }) {
  const { x = 120, y = 120, w = 720, text = '', size = 32, fontKey = 'read', lh = 1.55, highlights = [], dim = false, color = 'ink', underline = [] } = props;
  const family = props.font || fontKey;
  const lines = measuredLines(text, w, size, family);
  const lineH = size * lh;
  const hlFor = (index) => highlights.find((h) => index >= h.from && index <= h.to) || null;
  const out = [];
  lines.forEach((line, lineIndex) => {
    line.forEach(({ word, index, x: offset, w: wordW }) => {
      const hl = hlFor(index);
      const targetId = `${id}:${index}`;
      const tappable = tap?.targets?.has(targetId);
      const state = tap?.state?.[targetId];
      const baseY = y + lineIndex * lineH;
      const left = x + offset;
      out.push(
        <g
          key={index}
          className={tappable ? `xp-tap${state ? ` is-${state}` : ''}` : undefined}
          role={tappable ? 'button' : undefined}
          tabIndex={tappable ? 0 : undefined}
          aria-label={tappable ? `Choose the word ${word}` : undefined}
          onClick={tappable ? () => tap.onTap(targetId) : undefined}
          onKeyDown={tappable ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tap.onTap(targetId); } } : undefined}
        >
          {hl ? <rect x={left - 5} y={baseY - size * 0.64} width={(wordW + 10) * Math.min(1, enter * 1.4)} height={size * 1.22} rx="6" fill={col(hl.color || 'volt')} opacity="0.42" /> : null}
          {tappable ? <rect className="xp-tap-box" x={left - 7} y={baseY - size * 0.68} width={wordW + 14} height={size * 1.32} rx="8" /> : null}
          <text x={left} y={baseY} fontSize={size} fill={col(color)} fontFamily={font(family)} dominantBaseline="central" opacity={dim && !hl ? 0.35 : 1}>
            {word}
          </text>
          {underline.includes(index) ? <path d={`M${left} ${baseY + size * 0.55} q${wordW / 4} 6 ${wordW / 2} 0 t${wordW / 2} 0`} fill="none" stroke={col('coral')} strokeWidth="3" strokeLinecap="round" /> : null}
        </g>,
      );
    });
  });
  return <g opacity={Math.min(1, enter * 1.5)}>{out}</g>;
}

// ---------------------------------------------------------------- chips + callouts
function ChipEl({ id, props, enter, tap }) {
  const { x = 480, y = 270, text = '', color = 'blue', size = 24, solid = true, fontKey = 'ui' } = props;
  const width = textWidth(String(text), size, props.font || fontKey, 800) + size * 1.3;
  const height = size * 1.7;
  const tappable = tap?.targets?.has(id);
  const state = tap?.state?.[id];
  return (
    <g
      opacity={enter}
      className={tappable ? `xp-tap${state ? ` is-${state}` : ''}` : undefined}
      role={tappable ? 'button' : undefined}
      tabIndex={tappable ? 0 : undefined}
      aria-label={tappable ? `Choose ${text}` : undefined}
      onClick={tappable ? () => tap.onTap(id) : undefined}
      onKeyDown={tappable ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tap.onTap(id); } } : undefined}
    >
      <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx={height / 2} fill={solid ? col(color) : 'var(--b-panel)'} stroke={solid ? 'var(--b-line)' : col(color)} strokeWidth="3" />
      {tappable ? <rect className="xp-tap-box" x={x - width / 2 - 6} y={y - height / 2 - 6} width={width + 12} height={height + 12} rx={height / 2 + 6} /> : null}
      <Label x={x} y={y + 1} text={text} size={size} color={solid ? '#15172b' : color} fontKey={props.font || fontKey} weight={800} />
    </g>
  );
}

function CalloutEl({ props, enter }) {
  const { x = 600, y = 120, text = '', tx = 480, ty = 270, color = 'volt', size = 28, anchor = 'middle' } = props;
  const sx = x + (tx > x ? 20 : -20) * (anchor === 'middle' ? 0 : 1);
  const sy = y + (ty > y ? size * 0.8 : -size * 0.8);
  const mx = (sx + tx) / 2 + (ty - sy) * 0.25;
  const my = (sy + ty) / 2 - (tx - sx) * 0.25;
  const angle = (Math.atan2(ty - my, tx - mx) * 180) / Math.PI;
  return (
    <g>
      <text x={x} y={y} fontSize={size} fill={col(color)} fontFamily={font('hand')} fontWeight="700" textAnchor={anchor} dominantBaseline="central" opacity={Math.min(1, enter * 2)}>
        {text}
      </text>
      <path d={`M${sx} ${sy} Q${mx} ${my} ${tx} ${ty}`} fill="none" stroke={col(color)} strokeWidth="3.5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - enter} />
      {enter > 0.9 ? <ArrowHead x={tx} y={ty} angle={angle} color={color} size={12} /> : null}
    </g>
  );
}

// ---------------------------------------------------------------- pie / spinner
function PieEl({ props, enter }) {
  const { x = 480, y = 270, r = 120, sectors = [], needle = null } = props;
  const total = sectors.reduce((sum, sector) => sum + (sector.v || 0), 0) || 1;
  let angle = -90;
  const rad = (deg) => (deg * Math.PI) / 180;
  const pieces = sectors.map((sector, index) => {
    const sweep = (360 * (sector.v || 0)) / total;
    const a0 = angle;
    const a1 = angle + sweep * enter;
    angle += sweep;
    const large = a1 - a0 > 180 ? 1 : 0;
    const p0 = [x + r * Math.cos(rad(a0)), y + r * Math.sin(rad(a0))];
    const p1 = [x + r * Math.cos(rad(a1)), y + r * Math.sin(rad(a1))];
    const mid = rad((a0 + a1) / 2);
    return (
      <g key={index}>
        <path d={`M${x} ${y} L${p0[0]} ${p0[1]} A${r} ${r} 0 ${large} 1 ${p1[0]} ${p1[1]} Z`} fill={col(sector.color || 'blue')} stroke="var(--b-line)" strokeWidth="3" strokeLinejoin="round" />
        {sector.label ? <Label x={x + r * 0.62 * Math.cos(mid)} y={y + r * 0.62 * Math.sin(mid)} text={sector.label} size={24} color="#15172b" fontKey="display" /> : null}
      </g>
    );
  });
  return (
    <g>
      {pieces}
      {needle != null ? (
        <g transform={`rotate(${needle} ${x} ${y})`}>
          <path d={`M${x} ${y} L${x} ${y - r * 0.86}`} stroke="var(--b-line)" strokeWidth="9" strokeLinecap="round" />
          <path d={`M${x} ${y} L${x} ${y - r * 0.86}`} stroke={col('volt')} strokeWidth="5" strokeLinecap="round" />
          <circle cx={x} cy={y} r="11" fill={col('volt')} stroke="var(--b-line)" strokeWidth="3" />
        </g>
      ) : null}
    </g>
  );
}

// ---------------------------------------------------------------- balance scale
// A two-pan balance. `tilt` (degrees, + = right side down) rotates the beam;
// the pans hang level from the beam ends. Letter labels are unknown blocks
// (subject colour), everything else is a number block (amber).
function BalanceEl({ props, enter }) {
  const { x = 480, y = 250, width = 620, left = [], right = [], tilt = 0, color = 'purple' } = props;
  const hw = width / 2;
  const rad = (tilt * Math.PI) / 180;
  const ends = {
    left: [x - hw * Math.cos(rad), y - hw * Math.sin(rad)],
    right: [x + hw * Math.cos(rad), y + hw * Math.sin(rad)],
  };
  const drop = 70;
  const size = 62;
  const pan = (side, items) => {
    const [ex, ey] = ends[side];
    const trayW = Math.max(190, items.length * (size + 6) + 24);
    const trayY = ey + drop;
    const startX = ex - ((items.length * (size + 6)) - 6) / 2;
    return (
      <g key={side}>
        <path d={`M${ex} ${ey} L${ex - trayW / 2 + 10} ${trayY} M${ex} ${ey} L${ex + trayW / 2 - 10} ${trayY}`} stroke="var(--b-muted)" strokeWidth="2.5" />
        <rect x={ex - trayW / 2} y={trayY} width={trayW} height="12" rx="6" fill="var(--b-ink)" />
        {items.map((label, index) => {
          const letter = /[a-z]/i.test(label);
          const bx = startX + index * (size + 6);
          return (
            <g key={`${side}${index}`}>
              <rect x={bx} y={trayY - size - 2} width={size} height={size} rx="10" fill={col(letter ? color : 'amber')} stroke="var(--b-line)" strokeWidth="3" />
              <Label x={bx + size / 2} y={trayY - size / 2 - 2} text={label} size={label.length > 2 ? 22 : 28} color="#15172b" fontKey="display" />
            </g>
          );
        })}
      </g>
    );
  };
  return (
    <g opacity={enter}>
      <path d={`M${x} ${y} L${x - 58} ${y + 190} L${x + 58} ${y + 190} Z`} fill="var(--b-panel)" stroke="var(--b-ink)" strokeWidth="4" strokeLinejoin="round" />
      <line x1={ends.left[0]} y1={ends.left[1]} x2={ends.right[0]} y2={ends.right[1]} stroke="var(--b-ink)" strokeWidth="12" strokeLinecap="round" />
      <circle cx={x} cy={y} r="11" fill={col('volt')} stroke="var(--b-line)" strokeWidth="3" />
      {pan('left', left)}
      {pan('right', right)}
    </g>
  );
}

// ---------------------------------------------------------------- graphics
function EmblemEl({ props }) {
  const { x = 480, y = 270, size = 120, topic = 'topic', strand = 'number', layers = 2 } = props;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2})`}>
      <Emblem topicId={topic} strand={strand} layers={layers} size={size} ring={layers >= 4} />
    </g>
  );
}

function PipEl({ props }) {
  const { x = 820, y = 420, size = 120, mood = 'happy' } = props;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2})`}>
      <Pip mood={mood} size={size} />
    </g>
  );
}

function CardEl({ id, props, enter, tap }) {
  const { x = 240, y = 150, w = 480, h = 200, title, body, color = 'blue', size = 30, fontKey = 'mono' } = props;
  const lines = String(body || '').split('\n');
  const tappable = tap?.targets?.has(id);
  const state = tap?.state?.[id];
  return (
    <g
      opacity={enter}
      className={tappable ? `xp-tap${state ? ` is-${state}` : ''}` : undefined}
      role={tappable ? 'button' : undefined}
      tabIndex={tappable ? 0 : undefined}
      aria-label={tappable ? `Choose: ${title || body}` : undefined}
      onClick={tappable ? () => tap.onTap(id) : undefined}
      onKeyDown={tappable ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); tap.onTap(id); } } : undefined}
    >
      {tappable ? <rect className="xp-tap-box" x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx="28" /> : null}
      <rect x={x} y={y} width={w} height={h} rx="22" fill="var(--b-panel)" stroke={col(color)} strokeWidth="4" />
      <rect x={x} y={y} width={w} height="10" rx="5" fill={col(color)} />
      {title ? <Label x={x + 28} y={y + 30} text={title} anchor="start" size={16} color={color} /> : null}
      {lines.map((line, index) => (
        <Label key={index} x={x + 28} y={y + (title ? 46 : 20) + size * 0.75 + index * size * 1.3} text={line} anchor="start" size={size} fontKey={props.font || fontKey} weight={props.weight ?? 700} />
      ))}
    </g>
  );
}

const RENDERERS = {
  text: TextEl,
  frac: FracEl,
  rect: RectEl,
  circle: CircleEl,
  line: LineEl,
  arrow: LineEl,
  path: PathEl,
  point: PointEl,
  arc: ArcEl,
  bar: BarEl,
  numberline: NumberLineEl,
  axes: AxesEl,
  tri: TriEl,
  dots: DotsEl,
  grid: GridEl,
  words: WordsEl,
  chip: ChipEl,
  callout: CalloutEl,
  pie: PieEl,
  balance: BalanceEl,
  emblem: EmblemEl,
  pip: PipEl,
  card: CardEl,
};

export const PRIMITIVE_TYPES = Object.keys(RENDERERS);

// Wrapper: entrance/exit envelope + pulse glow, then the renderer.
export function StageItem({ item, tap }) {
  const Renderer = RENDERERS[item.type];
  if (!Renderer) return null;
  const { anim, enter, exit, props } = item;
  const opacityBase = anim === 'draw' || anim === 'write' || anim === 'none' ? 1 : enter;
  const opacity = opacityBase * (1 - exit) * (props.opacity ?? 1);
  const ox = props.x ?? props.cx ?? 480;
  const oy = props.y ?? props.cy ?? 270;
  let transform;
  if (anim === 'pop' && enter < 1) {
    const s = 0.4 + 0.6 * (1 - (1 - enter) ** 3) + Math.sin(enter * Math.PI) * 0.08;
    transform = `translate(${ox} ${oy}) scale(${s}) translate(${-ox} ${-oy})`;
  } else if (anim === 'slide' && enter < 1) {
    transform = `translate(0 ${(1 - enter) * 24})`;
  } else if (anim === 'drop' && enter < 1) {
    transform = `translate(0 ${-(1 - enter) * 60})`;
  }
  const glow = item.pulse != null ? Math.sin(item.pulse * Math.PI) : 0;
  return (
    <g opacity={opacity} transform={transform} data-el={item.id} style={glow ? { filter: `drop-shadow(0 0 ${8 + glow * 14}px color-mix(in srgb, var(--hue-volt) ${Math.round(glow * 90)}%, transparent))` } : undefined}>
      <Renderer id={item.id} type={item.type} props={props} enter={enter} exit={exit} anim={anim} tap={tap} />
    </g>
  );
}
