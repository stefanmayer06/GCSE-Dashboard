// MathsMate explainer library. Each entry is a script module (pure data).
// `topics` lists the topic ids it teaches; the lesson page shows the first
// match, and topics without an authored script fall back to the
// auto-generated talk-through (../../autoscript.js).
import fractionsOfAnAmount from './fractions-of-an-amount.js';

export const MATHS_EXPLAINERS = [
  fractionsOfAnAmount,
];

export function explainerForTopic(topicId) {
  return MATHS_EXPLAINERS.find((script) => script.topics.includes(topicId)) || null;
}
