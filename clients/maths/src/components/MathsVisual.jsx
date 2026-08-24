import { useState } from 'react';
import GraphStimulus from './GraphStimulus.jsx';

const W = 420;
const H = 260;

function controlLabel(type) {
  if (type === 'coordinate' || type === 'scatter') return 'Grid';
  if (type === 'shape') return 'Trace diagram';
  return 'Highlight data';
}

export default function MathsVisual({ stimulus, compact = false }) {
  const [detail, setDetail] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(null);
  if (!stimulus) return null;
  if (stimulus.type === 'cartesian' || stimulus.type === 'histogram') {
    return <GraphStimulus stimulus={stimulus} />;
  }

  return (
    <figure className={`maths-visual ${compact ? 'compact' : ''} ${expanded ? 'expanded' : ''}`}>
      <div className="visual-stage">
        <VisualBody stimulus={stimulus} detail={detail} selected={selected} setSelected={setSelected} />
      </div>
      <figcaption>
        <span className="sr-only">{stimulus.alt}</span>
        {selected && <span className="visual-readout" aria-live="polite">{selected}</span>}
        <span className="visual-controls">
          <button type="button" className={`visual-control ${detail ? 'on' : ''}`} onClick={() => setDetail((value) => !value)} aria-pressed={detail}>
            {controlLabel(stimulus.type)}
          </button>
          <button type="button" className="visual-control" onClick={() => setExpanded((value) => !value)} aria-pressed={expanded}>
            {expanded ? 'Fit' : 'Enlarge'}
          </button>
        </span>
      </figcaption>
    </figure>
  );
}

function VisualBody({ stimulus, detail, selected, setSelected }) {
  if (stimulus.type === 'coordinate' || stimulus.type === 'scatter') {
    return <CoordinateVisual data={stimulus} grid={detail} selected={selected} setSelected={setSelected} />;
  }
  if (stimulus.type === 'shape') return <ShapeVisual data={stimulus} highlighted={detail} />;
  if (stimulus.type === 'bar') return <BarVisual data={stimulus} highlighted={detail} setSelected={setSelected} />;
  if (stimulus.type === 'pie') return <PieVisual data={stimulus} highlighted={detail} />;
  if (stimulus.type === 'table') return <TableVisual data={stimulus} />;
  if (stimulus.type === 'tally') return <TallyVisual count={stimulus.count} highlighted={detail} />;
  if (stimulus.type === 'pictogram') return <PictogramVisual data={stimulus} highlighted={detail} />;
  if (stimulus.type === 'number-line' || stimulus.type === 'range') return <NumberLineVisual data={stimulus} />;
  if (stimulus.type === 'counters') return <CountersVisual data={stimulus} setSelected={setSelected} />;
  if (stimulus.type === 'dice') return <DiceVisual />;
  if (stimulus.type === 'probability-scale') return <ProbabilityScale />;
  if (stimulus.type === 'venn') return <VennVisual data={stimulus} highlighted={detail} />;
  if (stimulus.type === 'tree') return <TreeVisual data={stimulus} highlighted={detail} />;
  if (stimulus.type === 'sample-space') return <SampleSpaceVisual size={stimulus.size} highlighted={detail} setSelected={setSelected} />;
  if (stimulus.type === 'dot-pattern') return <DotPatternVisual patterns={stimulus.patterns} highlighted={detail} />;
  return null;
}

function extent(values, fallback) {
  if (!values.length) return fallback;
  return [Math.min(...values), Math.max(...values)];
}

function CoordinateVisual({ data, grid, selected, setSelected }) {
  const points = data.points || [];
  const line = data.line || [];
  const segmentPoints = (data.segments || []).flatMap((segment) => segment);
  const all = [...points, ...line, ...segmentPoints];
  const xs = all.map((point) => point.x).concat(data.queryX ?? []);
  const ys = all.map((point) => point.y);
  const [rawXMin, rawXMax] = extent(xs, [-6, 8]);
  const [rawYMin, rawYMax] = extent(ys, [-6, 8]);
  const xMin = data.xMin ?? Math.min(-1, Math.floor(rawXMin - 1));
  const xMax = data.xMax ?? Math.max(7, Math.ceil(rawXMax + 1));
  const yMin = data.yMin ?? Math.min(-1, Math.floor(rawYMin - 1));
  const yMax = data.yMax ?? Math.max(7, Math.ceil(rawYMax + 1));
  const pad = 34;
  const sx = (x) => pad + ((x - xMin) / (xMax - xMin || 1)) * (W - pad * 2);
  const sy = (y) => H - pad - ((y - yMin) / (yMax - yMin || 1)) * (H - pad * 2);
  const xStep = Math.max(1, Math.ceil((xMax - xMin) / 10));
  const yStep = Math.max(1, Math.ceil((yMax - yMin) / 8));
  const xTicks = [];
  const yTicks = [];
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) xTicks.push(x);
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) yTicks.push(y);
  const axisX = Math.max(pad, Math.min(W - pad, sx(0)));
  const axisY = Math.max(pad, Math.min(H - pad, sy(0)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.alt}>
      {grid && xTicks.map((x) => <line key={`gx${x}`} className="visual-grid" x1={sx(x)} y1={pad} x2={sx(x)} y2={H - pad} />)}
      {grid && yTicks.map((y) => <line key={`gy${y}`} className="visual-grid" x1={pad} y1={sy(y)} x2={W - pad} y2={sy(y)} />)}
      <line className={`visual-axis ${data.emphasis === 'x' ? 'emphasis' : ''}`} x1={pad} y1={axisY} x2={W - pad + 6} y2={axisY} />
      <line className={`visual-axis ${data.emphasis === 'y' ? 'emphasis' : ''}`} x1={axisX} y1={H - pad} x2={axisX} y2={pad - 6} />
      {grid && xTicks.map((x) => <text key={`tx${x}`} className="visual-tick" x={sx(x)} y={axisY + 17}>{x}</text>)}
      {grid && yTicks.filter((y) => y !== 0).map((y) => <text key={`ty${y}`} className="visual-tick" x={axisX - 10} y={sy(y) + 4}>{y}</text>)}
      {(data.segments || []).map((segment, index) => <line key={index} className="visual-line" x1={sx(segment[0].x)} y1={sy(segment[0].y)} x2={sx(segment[1].x)} y2={sy(segment[1].y)} />)}
      {line.length === 2 && <line className="visual-line best-fit" x1={sx(line[0].x)} y1={sy(line[0].y)} x2={sx(line[1].x)} y2={sy(line[1].y)} />}
      {data.queryX != null && <line className="visual-query" x1={sx(data.queryX)} y1={H - pad} x2={sx(data.queryX)} y2={pad} />}
      {data.vector && points[0] && (
        <g>
          <line className="visual-vector" x1={sx(points[0].x)} y1={sy(points[0].y)} x2={sx(points[0].x + data.vector.x)} y2={sy(points[0].y + data.vector.y)} />
          <path className="visual-vector-head" d={`M ${sx(points[0].x + data.vector.x)} ${sy(points[0].y + data.vector.y)} l -9 -4 l 3 9 z`} />
        </g>
      )}
      {points.map((point, index) => {
        const pointLabel = point.label || `Point (${point.x}, ${point.y})`;
        const active = selected === pointLabel;
        return (
          <g key={`${point.x}-${point.y}-${index}`} className={`visual-point ${active ? 'active' : ''}`} role="button" tabIndex="0" aria-label={pointLabel} onClick={() => setSelected(active ? null : pointLabel)} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setSelected(active ? null : pointLabel);
            }
          }}>
            <circle cx={sx(point.x)} cy={sy(point.y)} r="6" />
            {point.label && <text x={sx(point.x) + 9} y={sy(point.y) - 9}>{point.label}</text>}
          </g>
        );
      })}
      {data.operation && <text className="visual-operation" x="390" y="22">{data.operation}</text>}
      {data.xLabel && <text className="visual-axis-label" x="390" y="250">{data.xLabel}</text>}
      {data.yLabel && <text className="visual-axis-label y" x="15" y="26">{data.yLabel}</text>}
    </svg>
  );
}

function regularPolygon(sides, cx = 210, cy = 140, radius = 92) {
  return Array.from({ length: Math.max(3, Math.min(20, sides || 5)) }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;
    return `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`;
  }).join(' ');
}

function ShapeVisual({ data, highlighted }) {
  const className = `visual-shape ${highlighted ? 'highlighted' : ''}`;
  const rightMark = <path className="visual-mark" d="M 112 205 L 112 188 L 129 188" />;
  let drawing;
  switch (data.kind) {
    case 'straight-angle': drawing = <><line x1="65" y1="190" x2="355" y2="190" /><line x1="210" y1="190" x2="135" y2="70" /><path className="visual-arc" d="M 174 132 A 68 68 0 0 1 210 122" /><path className="visual-arc" d="M 210 122 A 68 68 0 0 1 272 161" /></>; break;
    case 'around-point': drawing = <><line x1="210" y1="140" x2="95" y2="55" /><line x1="210" y1="140" x2="335" y2="65" /><line x1="210" y1="140" x2="210" y2="235" /><circle className="visual-node" cx="210" cy="140" r="4" /></>; break;
    case 'triangle': case 'triangle-height': drawing = <><polygon points="75,210 345,210 235,55" />{data.kind === 'triangle-height' && <><line className="visual-helper" x1="235" y1="55" x2="235" y2="210" /><path className="visual-mark" d="M 235 193 L 252 193 L 252 210" /></>}</>; break;
    case 'right-triangle': drawing = <><polygon points="95,210 340,210 95,55" />{rightMark}</>; break;
    case 'scalene': drawing = <polygon points="65,210 350,210 245,65" />; break;
    case 'isosceles': drawing = <><polygon points="70,210 350,210 210,55" /><line className="visual-tick-mark" x1="132" y1="139" x2="143" y2="132" /><line className="visual-tick-mark" x1="277" y1="132" x2="288" y2="139" /></>; break;
    case 'quadrilateral': drawing = <polygon points="80,205 335,205 300,65 120,55" />; break;
    case 'parallelogram': drawing = <><polygon points="105,205 345,205 300,70 60,70" /><line className="visual-helper" x1="105" y1="205" x2="105" y2="70" /><path className="visual-mark" d="M 105 188 L 122 188 L 122 205" /></>; break;
    case 'trapezium': drawing = <><polygon points="70,210 350,210 285,65 135,65" /><line className="visual-helper" x1="135" y1="65" x2="135" y2="210" /><path className="visual-mark" d="M 135 193 L 152 193 L 152 210" /></>; break;
    case 'rectangle': drawing = <rect x="80" y="70" width="260" height="140" />; break;
    case 'rectangle-diagonal': drawing = <><rect x="80" y="70" width="260" height="140" /><line className="visual-helper strong" x1="80" y1="210" x2="340" y2="70" /></>; break;
    case 'joined-rectangles': drawing = <path d="M 70 70 H 245 V 130 H 350 V 220 H 70 Z" />; break;
    case 'frame': drawing = <><rect x="55" y="45" width="310" height="180" /><rect className="visual-inner" x="105" y="82" width="210" height="106" /></>; break;
    case 'circle': case 'wheel': drawing = <><circle cx="210" cy="140" r="92" />{data.measure !== 'circumference' && <line className="visual-helper" x1={data.measure === 'radius' ? 210 : 118} y1="140" x2="302" y2="140" />}{data.kind === 'wheel' && Array.from({ length: 8 }, (_, index) => <line key={index} className="visual-helper" x1="210" y1="140" x2={210 + Math.cos(index * Math.PI / 4) * 92} y2={140 + Math.sin(index * Math.PI / 4) * 92} />)}</>; break;
    case 'circle-theorem': drawing = <><circle cx="210" cy="140" r="92" /><line className="visual-helper" x1="210" y1="140" x2="135" y2="193" /><line className="visual-helper" x1="210" y1="140" x2="285" y2="193" /><line x1="210" y1="48" x2="135" y2="193" /><line x1="210" y1="48" x2="285" y2="193" /><circle className="visual-node" cx="210" cy="140" r="4" /></>; break;
    case 'semicircle': drawing = <path d="M 80 205 A 130 130 0 0 1 340 205 Z" />; break;
    case 'parallel-lines': drawing = <><line x1="55" y1="80" x2="360" y2="80" /><line x1="55" y1="190" x2="360" y2="190" /><line x1="130" y1="235" x2="285" y2="35" /><path className="visual-arrow-mark" d="M 315 73 l 10 7 l -10 7" /><path className="visual-arrow-mark" d="M 315 183 l 10 7 l -10 7" /></>; break;
    case 'polygon': drawing = <polygon points={regularPolygon(data.sides)} />; break;
    case 'cuboid': drawing = <><rect x="80" y="85" width="225" height="125" /><path d="M 80 85 l 55 -40 h 225 v 125 l -55 40 M 305 85 l 55 -40 M 305 210 l 55 -40" /></>; break;
    case 'triangular-prism': drawing = <><polygon points="70,210 70,80 170,210" /><polygon points="250,175 250,45 350,175" /><line x1="70" y1="210" x2="250" y2="175" /><line x1="70" y1="80" x2="250" y2="45" /><line x1="170" y1="210" x2="350" y2="175" /><line className="visual-helper" x1="120" y1="145" x2="70" y2="145" /></>; break;
    case 'ladder': drawing = <><line x1="90" y1="35" x2="90" y2="220" /><line x1="70" y1="220" x2="355" y2="220" /><line className="visual-ladder" x1="90" y1="55" x2="315" y2="220" />{rightMark}</>; break;
    case 'map': drawing = <><path className="visual-map" d="M 45 65 C 120 25, 155 100, 225 65 S 330 105, 380 45 M 45 205 C 120 165, 175 230, 250 190 S 335 175, 385 215" /><circle className="visual-node" cx="115" cy="135" r="7" /><circle className="visual-node" cx="305" cy="135" r="7" /><line className="visual-helper strong" x1="115" y1="135" x2="305" y2="135" /></>; break;
    case 'plan': drawing = <><rect x="75" y="65" width="270" height="145" /><path className="visual-door" d="M 75 145 h 45 M 120 145 A 45 45 0 0 1 75 190" /></>; break;
    case 'similar-triangles': drawing = <><polygon points="45,210 160,210 85,100" /><polygon points="220,210 385,210 280,55" /></>; break;
    case 'bearing': {
      const angle = ((data.bearing || 0) - 90) * Math.PI / 180;
      const endX = 210 + Math.cos(angle) * 95;
      const endY = 145 + Math.sin(angle) * 95;
      drawing = <><circle cx="210" cy="145" r="100" /><line className="visual-helper" x1="210" y1="235" x2="210" y2="38" /><line className="visual-bearing" x1="210" y1="145" x2={endX} y2={endY} /><text x="210" y="26">N</text><text x="210" y="255">S</text><text x="370" y="150">E</text><text x="50" y="150">W</text></>;
      break;
    }
    default: drawing = <polygon points="80,210 340,210 210,55" />;
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.alt} className={className}>
      <g className="visual-shape-lines">{drawing}</g>
      {(data.labels || []).map((item, index) => <text key={index} className="visual-measure" x={item.x} y={item.y}>{item.text}</text>)}
      <text className="visual-notscale" x="395" y="247">not to scale</text>
    </svg>
  );
}

function BarVisual({ data, highlighted, setSelected }) {
  const max = Math.max(1, ...(data.data || []).map((item) => item.value));
  return (
    <div className={`data-bars ${highlighted ? 'highlighted' : ''}`} role="img" aria-label={data.alt}>
      {(data.data || []).map((item) => (
        <button key={item.label} type="button" className="data-bar-column" onClick={() => setSelected(`${item.label}: ${item.value}`)} aria-label={`${item.label}, ${item.value}`}>
          <span className="data-bar-value">{item.value}</span>
          <span className="data-bar" style={{ height: `${Math.max(12, (item.value / max) * 150)}px` }} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function PieVisual({ data, highlighted }) {
  const angle = data.angle;
  const start = -Math.PI / 2;
  const end = start + ((angle || 0) * Math.PI) / 180;
  const x = 210 + Math.cos(end) * 92;
  const y = 130 + Math.sin(end) * 92;
  const sector = angle ? `M 210 130 L 210 38 A 92 92 0 ${angle > 180 ? 1 : 0} 1 ${x} ${y} Z` : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.alt} className={highlighted ? 'highlighted' : ''}>
      <circle className="pie-base" cx="210" cy="130" r="92" />
      {sector && <path className="pie-sector" d={sector} />}
      <line className="visual-helper strong" x1="210" y1="130" x2="210" y2="38" />
      {angle && <line className="visual-helper strong" x1="210" y1="130" x2={x} y2={y} />}
      <text className="visual-measure" x="210" y="245">{angle ? `${angle}° sector` : data.prompt}</text>
    </svg>
  );
}

function TableVisual({ data }) {
  return (
    <table className="visual-table" aria-label={data.alt}>
      <thead><tr>{data.headings.map((heading, index) => <th key={index}>{heading}</th>)}</tr></thead>
      <tbody>{data.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
    </table>
  );
}

function TallyVisual({ count, highlighted }) {
  const bundles = Math.floor(count / 5);
  const remainder = count % 5;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Tally chart with ${count} marks.`} className={highlighted ? 'highlighted' : ''}>
      {Array.from({ length: bundles }, (_, group) => {
        const x = 55 + group * 95;
        return <g key={group} className="tally-group">{[0, 1, 2, 3].map((index) => <line key={index} x1={x + index * 16} y1="80" x2={x + index * 16} y2="190" />)}<line x1={x - 8} y1="175" x2={x + 58} y2="94" /></g>;
      })}
      <g className="tally-group">{Array.from({ length: remainder }, (_, index) => <line key={index} x1={55 + bundles * 95 + index * 16} y1="80" x2={55 + bundles * 95 + index * 16} y2="190" />)}</g>
    </svg>
  );
}

function PictogramVisual({ data, highlighted }) {
  return <div className={`pictogram ${highlighted ? 'highlighted' : ''}`} role="img" aria-label={data.alt}><strong>Key: {data.symbol} = {data.value}</strong><div>{Array.from({ length: data.count }, (_, index) => <span key={index}>{data.symbol}</span>)}</div></div>;
}

function NumberLineVisual({ data }) {
  const { min, max, lower, upper } = data;
  const sx = (value) => 45 + ((value - min) / (max - min || 1)) * 330;
  const start = lower ?? min;
  const end = upper ?? max;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.alt}>
      <line className="number-axis" x1="35" y1="135" x2="385" y2="135" />
      {Array.from({ length: max - min + 1 }, (_, index) => min + index).map((value) => <g key={value}><line className="number-tick" x1={sx(value)} y1="125" x2={sx(value)} y2="145" /><text className="visual-tick" x={sx(value)} y="165">{value}</text></g>)}
      <line className="number-range" x1={sx(start)} y1="135" x2={sx(end)} y2="135" />
      {lower != null && <circle className={`number-end ${data.lowerClosed ? 'closed' : ''}`} cx={sx(lower)} cy="135" r="9" />}
      {upper != null && <circle className={`number-end ${data.upperClosed ? 'closed' : ''}`} cx={sx(upper)} cy="135" r="9" />}
      {lower == null && <path className="number-arrow" d={`M ${sx(min)} 135 l 15 -9 v 18 z`} />}
      {upper == null && <path className="number-arrow" d={`M ${sx(max)} 135 l -15 -9 v 18 z`} />}
    </svg>
  );
}

function CountersVisual({ data, setSelected }) {
  return <div className="counter-bag" role="img" aria-label={data.alt}>{data.groups.map((group) => <button type="button" key={group.label} className="counter-group" onClick={() => setSelected(`${group.label}: ${group.count}`)}><span className="counter-dots">{Array.from({ length: group.count }, (_, index) => <i key={index} style={{ background: group.color }} />)}</span><span>{group.label}</span></button>)}</div>;
}

function DiceVisual() {
  return <div className="dice-row" role="img" aria-label="The six equally likely outcomes on a fair die.">{[1, 2, 3, 4, 5, 6].map((number) => <span key={number} aria-label={`${number}`}>{number}</span>)}</div>;
}

function ProbabilityScale() {
  return <div className="probability-scale" role="img" aria-label="Probability scale from impossible at zero to certain at one."><div className="probability-track"><i /></div><div><span>0<br />Impossible</span><span>1/2<br />Even chance</span><span>1<br />Certain</span></div></div>;
}

function VennVisual({ data, highlighted }) {
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.alt} className={highlighted ? 'highlighted' : ''}>{data.events.map((event, index) => <g key={event.label}><circle className="venn-circle" cx={data.disjoint ? 130 + index * 160 : 175 + index * 70} cy="130" r="76" /><text className="visual-measure" x={130 + index * 160} y="120">{event.label}</text><text className="visual-measure secondary" x={130 + index * 160} y="148">P = {event.value}</text></g>)}</svg>;
}

function TreeVisual({ data, highlighted }) {
  return <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={data.alt} className={highlighted ? 'highlighted' : ''}><circle className="visual-node" cx="55" cy="130" r="6" />{(data.stages[0] || []).map((item, index) => {
    const shared = data.stages[1] || [];
    const secondStage = Array.isArray(shared[index]) ? shared[index] : shared;
    return <g key={item}><line className="tree-line" x1="55" y1="130" x2="190" y2={75 + index * 110} /><text className="tree-label" x="115" y={88 + index * 88}>{item}</text>{secondStage.map((second, secondIndex) => <g key={second}><line className="tree-line second" x1="190" y1={75 + index * 110} x2="350" y2={45 + index * 90 + secondIndex * 55} /><text className="tree-label" x="285" y={58 + index * 90 + secondIndex * 55}>{second}</text></g>)}</g>;
  })}</svg>;
}

function SampleSpaceVisual({ size, highlighted, setSelected }) {
  return <div className={`sample-space ${highlighted ? 'highlighted' : ''}`} role="grid" aria-label={`Sample-space grid for two ${size}-sided dice.`}>{Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => <button type="button" role="gridcell" key={`${row}-${column}`} onClick={() => setSelected(`Outcome (${row + 1}, ${column + 1}), total ${row + column + 2}`)}>{row + 1},{column + 1}</button>))}</div>;
}

function DotPatternVisual({ patterns, highlighted }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Growing cross patterns containing five, nine and thirteen dots." className={highlighted ? 'highlighted' : ''}>
      {patterns.map((arm, patternIndex) => {
        const cx = 80 + patternIndex * 130;
        const cy = 125;
        const points = [[cx, cy]];
        for (let step = 1; step <= arm; step++) points.push([cx - step * 17, cy], [cx + step * 17, cy], [cx, cy - step * 17], [cx, cy + step * 17]);
        return <g key={arm} className="dot-pattern">{points.map(([x, y], index) => <circle key={index} cx={x} cy={y} r="6" />)}<text x={cx} y="220">Pattern {patternIndex + 1}</text></g>;
      })}
    </svg>
  );
}
