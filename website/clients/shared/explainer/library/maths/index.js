// MathsMate explainer library. Each entry is a script module (pure data).
// `topics` lists the topic ids it teaches; the lesson page shows the first
// match, and topics without an authored script fall back to the
// auto-generated talk-through (../../autoscript.js).
// Adding one? See website/design/VIDEO_AUTHORING.md, then run
// `npm run explainers:check` from website/.
import fractionsOfAnAmount from './fractions-of-an-amount.js';
import percentages from './percentages.js';
import equations from './equations.js';
import straightLineGraphs from './straight-line-graphs.js';
import sequences from './sequences.js';
import ratioSharing from './ratio-sharing.js';
import triangleAngles from './triangle-angles.js';
import pythagoras from './pythagoras.js';
import trigonometry from './trigonometry-sohcahtoa.js';
import probabilityScale from './probability-scale.js';
import averages from './averages.js';
import quadraticRoots from './quadratic-roots.js';
import circleTheoremCentre from './circle-theorem-centre.js';
import surds from './surds.js';
import withoutReplacement from './without-replacement.js';

export const MATHS_EXPLAINERS = [
  // Foundation (also shown in Higher, which includes every Foundation topic)
  fractionsOfAnAmount,
  percentages,
  equations,
  straightLineGraphs,
  sequences,
  ratioSharing,
  triangleAngles,
  pythagoras,
  trigonometry,
  probabilityScale,
  averages,
  // Higher only
  quadraticRoots,
  circleTheoremCentre,
  surds,
  withoutReplacement,
];

export function explainerForTopic(topicId) {
  return MATHS_EXPLAINERS.find((script) => script.topics.includes(topicId)) || null;
}
