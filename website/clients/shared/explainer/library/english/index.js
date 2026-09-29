// EnglishMate explainer library. Each entry is a script module (pure data).
// `topics` lists the skill ids it teaches; skills without an authored script
// fall back to the auto-generated talk-through (../../autoscript.js).
// Adding one? See website/design/VIDEO_AUTHORING.md, then run
// `npm run explainers:check` from website/.
import zoomIntoAWord from './zoom-into-a-word.js';
import zoomOutStructure from './zoom-out-structure.js';
import evaluateStatement from './evaluate-statement.js';
import wordLab from './word-lab.js';
import showDontTell from './show-dont-tell.js';
import buildAnArgument from './build-an-argument.js';

export const ENGLISH_EXPLAINERS = [
  zoomIntoAWord,
  zoomOutStructure,
  evaluateStatement,
  wordLab,
  showDontTell,
  buildAnArgument,
];

export function explainerForTopic(topicId) {
  return ENGLISH_EXPLAINERS.find((script) => script.topics.includes(topicId)) || null;
}
