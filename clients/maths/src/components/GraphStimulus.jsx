import { useId } from 'react';

function CartesianGraph({ graph }) {
  const clipId = `graph-${useId().replace(/:/g, '')}`;
  const width = 640;
  const height = 380;
  const pad = 46;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;
  const sx = (x) => pad + ((x - graph.xMin) / (graph.xMax - graph.xMin)) * plotW;
  const sy = (y) => height - pad - ((y - graph.yMin) / (graph.yMax - graph.yMin)) * plotH;
  const xTicks = Array.from({ length: graph.xMax - graph.xMin + 1 }, (_, i) => graph.xMin + i);
  const yStep = Math.max(1, Math.ceil((graph.yMax - graph.yMin) / 12));
  const yTicks = [];
  for (let y = graph.yMin; y <= graph.yMax; y += yStep) yTicks.push(y);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${graph.title || 'Coordinate graph'}. ${(graph.series || []).map((series) => series.label).join('. ')}`}>
      <defs><clipPath id={clipId}><rect x={pad} y={pad} width={plotW} height={plotH} /></clipPath></defs>
      <rect className="graph-paper" x={pad} y={pad} width={plotW} height={plotH} />
      {xTicks.map((x) => <line key={`x-${x}`} className="graph-grid" x1={sx(x)} y1={pad} x2={sx(x)} y2={height - pad} />)}
      {yTicks.map((y) => <line key={`y-${y}`} className="graph-grid" x1={pad} y1={sy(y)} x2={width - pad} y2={sy(y)} />)}
      {graph.xMin <= 0 && graph.xMax >= 0 && <line className="graph-axis" x1={sx(0)} y1={pad} x2={sx(0)} y2={height - pad} />}
      {graph.yMin <= 0 && graph.yMax >= 0 && <line className="graph-axis" x1={pad} y1={sy(0)} x2={width - pad} y2={sy(0)} />}
      {xTicks.filter((x) => x !== 0).map((x) => <text key={`xt-${x}`} className="graph-label" x={sx(x)} y={sy(0) + 18} textAnchor="middle">{x}</text>)}
      {yTicks.filter((y) => y !== 0).map((y) => <text key={`yt-${y}`} className="graph-label" x={sx(0) - 10} y={sy(y) + 4} textAnchor="end">{y}</text>)}
      <g clipPath={`url(#${clipId})`}>
        {(graph.series || []).map((series, index) => (
          <polyline key={`${series.label}-${index}`} className={`graph-series ${series.kind || 'line'}`} points={series.points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} />
        ))}
      </g>
      {graph.xLabel && <text className="graph-axis-title" x={width / 2} y={height - 8} textAnchor="middle">{graph.xLabel}</text>}
      {graph.yLabel && <text className="graph-axis-title" x={14} y={height / 2} textAnchor="middle" transform={`rotate(-90 14 ${height / 2})`}>{graph.yLabel}</text>}
    </svg>
  );
}

function Histogram({ graph }) {
  const width = 640;
  const height = 380;
  const pad = 52;
  const maxX = Math.max(...graph.bars.map((bar) => bar.to));
  const maxY = Math.max(...graph.bars.map((bar) => bar.height)) * 1.2;
  const sx = (x) => pad + (x / maxX) * (width - pad * 2);
  const sy = (y) => height - pad - (y / maxY) * (height - pad * 2);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${graph.title || 'Histogram'}. Bars show class intervals and frequency density.`}>
      <rect className="graph-paper" x={pad} y={pad} width={width - pad * 2} height={height - pad * 2} />
      {[0, 0.5, 1, 1.5, 2, 2.5].filter((y) => y <= maxY).map((y) => <line key={y} className="graph-grid" x1={pad} y1={sy(y)} x2={width - pad} y2={sy(y)} />)}
      {graph.bars.map((bar) => <rect key={`${bar.from}-${bar.to}`} className="histogram-bar" x={sx(bar.from)} y={sy(bar.height)} width={sx(bar.to) - sx(bar.from)} height={sy(0) - sy(bar.height)} />)}
      <line className="graph-axis" x1={pad} y1={sy(0)} x2={width - pad} y2={sy(0)} />
      <line className="graph-axis" x1={pad} y1={pad} x2={pad} y2={sy(0)} />
      {[...new Set(graph.bars.flatMap((bar) => [bar.from, bar.to]))].map((x) => <text key={x} className="graph-label" x={sx(x)} y={sy(0) + 20} textAnchor="middle">{x}</text>)}
      {[0.5, 1, 1.5, 2, 2.5].filter((y) => y <= maxY).map((y) => <text key={y} className="graph-label" x={pad - 10} y={sy(y) + 4} textAnchor="end">{y}</text>)}
      <text className="graph-axis-title" x={width / 2} y={height - 8} textAnchor="middle">{graph.xLabel}</text>
      <text className="graph-axis-title" x={14} y={height / 2} textAnchor="middle" transform={`rotate(-90 14 ${height / 2})`}>{graph.yLabel}</text>
    </svg>
  );
}

export default function GraphStimulus({ stimulus }) {
  if (!stimulus) return null;
  return (
    <figure className="graph-stimulus">
      <figcaption>{stimulus.title}</figcaption>
      {stimulus.type === 'histogram' ? <Histogram graph={stimulus} /> : <CartesianGraph graph={stimulus} />}
    </figure>
  );
}
