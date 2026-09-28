// EnglishMate explainer library. Each entry is a script module (pure data).
// `topics` lists the skill ids it teaches; skills without an authored script
// fall back to the auto-generated talk-through (../../autoscript.js).
export const ENGLISH_EXPLAINERS = [];

export function explainerForTopic(topicId) {
  return ENGLISH_EXPLAINERS.find((script) => script.topics.includes(topicId)) || null;
}
