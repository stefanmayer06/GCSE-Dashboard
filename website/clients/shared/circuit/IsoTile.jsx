import { useId } from 'react';
import { EmblemLayer } from './Emblem.jsx';
import { emblemLayers, hueVar, layersForStage } from './palette.js';

// Isometric level node — the Brilliant/Mimo path tile. A 2:1 rhombus slab
// with two shaded sides; the topic emblem is projected onto the top face.
//
// state:
//   'new'      neutral slab, blueprint emblem (never locked: revision is free-roam)
//   'current'  subject hue + light beam — the recommended next step
//   'started'  subject hue, emblem layers built from mastery
//   'done'     lesson completed: check medallion on the face
//   'mastered' volt top face + crown ring
//   'boss'     exam paper node: darker slab, crown glyph
//
// Geometry (viewBox 0 0 120 112): top face centre (60,44), half-width 46,
// half-height 23, slab depth 16.

const TOP = '60,21 106,44 60,67 14,44';
const INNER = '60,29 90,44 60,59 30,44';
const LEFT = '14,44 60,67 60,83 14,60';
const RIGHT = '60,67 106,44 106,60 60,83';
// Square [-50,50]² → rhombus on the top face.
const PROJECT = 'matrix(0.3 0.15 -0.3 0.15 60 44)';

function FaceGlyph({ kind }) {
  // Glyphs are drawn in the projected square space so they lie flat.
  if (kind === 'check') {
    return (
      <g transform={PROJECT}>
        <circle r="34" fill="var(--tile-medal)" stroke="var(--emblem-line)" strokeWidth="5" />
        <path d="M-16 2 L-4 14 L18 -12" fill="none" stroke="var(--emblem-line)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  if (kind === 'crown') {
    return (
      <g transform={PROJECT}>
        <path d="M-30 18 L-30 -14 L-14 2 L0 -26 L14 2 L30 -14 L30 18 Z" fill="var(--hue-volt)" stroke="var(--emblem-line)" strokeWidth="5" strokeLinejoin="round" />
      </g>
    );
  }
  if (kind === 'play') {
    return (
      <g transform={PROJECT}>
        <circle r="34" fill="var(--tile-medal)" stroke="var(--emblem-line)" strokeWidth="5" />
        <path d="M-10 -16 L18 0 L-10 16 Z" fill="var(--emblem-line)" strokeLinejoin="round" />
      </g>
    );
  }
  return null;
}

export default function IsoTile({
  topicId = 'tile',
  strand = null,
  hue = 'blue',
  state = 'new',
  stage = 'new',
  glyph = null,
  size = 120,
  beam = null,
  className = '',
}) {
  const gradientId = useId().replace(/:/g, '');
  const built = layersForStage(stage);
  const codes = emblemLayers(topicId, strand, 4);
  const showBeam = beam ?? state === 'current';
  const neutral = state === 'new';
  const top = state === 'mastered' ? 'var(--hue-volt)' : neutral ? 'var(--tile-new-top)' : hueVar(hue);
  const shade = (amount) => (neutral
    ? `color-mix(in srgb, var(--tile-new-top) ${amount}%, var(--tile-shade))`
    : `color-mix(in srgb, ${state === 'mastered' ? 'var(--hue-volt)' : hueVar(hue)} ${amount}%, var(--tile-shade))`);
  const faceGlyph = glyph || (state === 'done' ? 'check' : state === 'boss' ? 'crown' : null);
  const scales = [0.95, 0.68, 0.45, 0.26];

  return (
    <svg
      className={`iso-tile iso-${state} ${className}`.trim()}
      viewBox="0 0 120 112"
      width={size}
      height={(size * 112) / 120}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`beam-${gradientId}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={hueVar(hue)} stopOpacity="0.55" />
          <stop offset="1" stopColor={hueVar(hue)} stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse className="iso-shadow" cx="60" cy="92" rx="44" ry="12" fill="var(--tile-shadow)" />
      {showBeam ? <rect className="iso-beam" x="26" y="-30" width="68" height="76" fill={`url(#beam-${gradientId})`} /> : null}
      <g className="iso-slab">
        <polygon points={LEFT} style={{ fill: shade(72) }} stroke="var(--emblem-line)" strokeWidth="2.2" strokeLinejoin="round" />
        <polygon points={RIGHT} style={{ fill: shade(52) }} stroke="var(--emblem-line)" strokeWidth="2.2" strokeLinejoin="round" />
        <polygon points={TOP} style={{ fill: top }} stroke="var(--emblem-line)" strokeWidth="2.2" strokeLinejoin="round" />
        <polygon points={INNER} fill="var(--tile-inset)" opacity={neutral ? 0.6 : 0.28} />
        {faceGlyph ? (
          <FaceGlyph kind={faceGlyph} />
        ) : (
          <g transform={PROJECT}>
            {built === 0 ? (
              <EmblemLayer quads={codes[0]} scale={0.9} blueprint strokeWidth={5} />
            ) : (
              codes.slice(0, built).map((quads, index) => (
                <EmblemLayer key={index} quads={quads} scale={scales[index]} strokeWidth={5} />
              ))
            )}
          </g>
        )}
      </g>
    </svg>
  );
}
