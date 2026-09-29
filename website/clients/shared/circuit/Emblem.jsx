import { emblemLayers, hueVar, layersForStage } from './palette.js';

// Shapez-style layered emblem. Every topic owns a unique four-quadrant
// shape (layer 0). Mastery stacks smaller layers on top, so the emblem is a
// collectible that visibly "builds" as marked evidence improves:
//   new → blueprint outline · learning → 1 layer · developing → 2
//   secure → 3 · mastered → 4 layers + volt ring.
// Quadrant order is Shapez's: top-right, bottom-right, bottom-left, top-left.

const LAYER_SCALE = [1, 0.72, 0.48, 0.28];
const BASE_R = 40;

export function quadrantPath(shape, r) {
  const f = (n) => Math.round(n * 100) / 100;
  switch (shape) {
    case 'R':
      return `M0 0 L0 ${f(-r * 0.9)} L${f(r * 0.9)} ${f(-r * 0.9)} L${f(r * 0.9)} 0 Z`;
    case 'S':
      return `M0 0 L0 ${f(-r * 0.6)} L${f(r)} ${f(-r)} L${f(r * 0.6)} 0 Z`;
    case 'W':
      return `M0 0 L0 ${f(-r * 0.6)} L${f(r)} ${f(-r)} L${f(r)} 0 Z`;
    case 'C':
    default:
      return `M0 0 L0 ${f(-r)} A${f(r)} ${f(r)} 0 0 1 ${f(r)} 0 Z`;
  }
}

export function EmblemLayer({ quads, scale = 1, blueprint = false, strokeWidth = 3.2 }) {
  const r = BASE_R * scale;
  return (
    <g className={blueprint ? 'emblem-layer blueprint' : 'emblem-layer'}>
      {quads.map((quad, index) => (
        <path
          key={index}
          d={quadrantPath(quad.s, r)}
          transform={`rotate(${index * 90})`}
          fill={blueprint ? 'none' : hueVar(quad.h)}
          stroke={blueprint ? hueVar(quad.h) : 'var(--emblem-line)'}
          strokeWidth={blueprint ? strokeWidth * 0.8 : strokeWidth}
          strokeDasharray={blueprint ? '4 3' : undefined}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

export default function Emblem({
  topicId = 'topic',
  strand = null,
  stage = 'new',
  layers: layerOverride = null,
  size = 48,
  ring = null,
  title = null,
  className = '',
  spin = false,
}) {
  const built = layerOverride ?? layersForStage(stage);
  const codes = emblemLayers(topicId, strand, 4);
  const showRing = ring ?? built >= 4;
  const label = title || null;
  return (
    <svg
      className={`emblem${spin ? ' emblem-spin' : ''}${built === 0 ? ' is-blueprint' : ''} ${className}`.trim()}
      viewBox="-50 -50 100 100"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {showRing ? (
        <circle className="emblem-ring" r="47" fill="none" stroke="var(--hue-volt)" strokeWidth="3" strokeDasharray="6 5" />
      ) : null}
      {built === 0 ? (
        <>
          <circle r="44" className="emblem-blueprint-bg" fill="var(--emblem-ghost)" />
          <EmblemLayer quads={codes[0]} blueprint />
        </>
      ) : (
        codes.slice(0, built).map((quads, index) => (
          <g key={index} className={`emblem-tier tier-${index}`} style={{ '--tier': index }}>
            <EmblemLayer quads={quads} scale={LAYER_SCALE[index]} />
          </g>
        ))
      )}
    </svg>
  );
}

// A strand/subject badge: the signature shape of a strand in its colours,
// fully built. Used on world banners, filters and course cards.
export function StrandBadge({ strand, size = 40, title = null }) {
  return <Emblem topicId={`strand:${strand}`} strand={strand} layers={2} ring={false} size={size} title={title} />;
}
