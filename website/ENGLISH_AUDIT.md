# English Language Audit

## Scope

This audit covers EnglishMate's generated questions, source texts, marking and feedback against
the AQA GCSE English Language 8700 structure. It documents what is covered and how it is marked;
it does not claim AQA endorsement and does not promise official marks or guaranteed grades from
AI feedback.

## Structure Coverage

- **Paper 1 (8700/1), Explorations in creative reading and writing**: reading section with
  retrieval (Q1-style lists), language analysis, structural analysis and evaluation; writing
  section with a description task tied to an appropriate image stimulus (Wikimedia Commons,
  resolved via `Special:FilePath`) and a narrative choice.
- **Paper 2 (8700/2), Writers' viewpoints and perspectives**: linked source texts (including a
  19th-century text per requirements), retrieval and synthesis (Q1/Q2), language comparison
  (Q3-style), comparing writers' ideas (Q4), and an argument/persuasive writing task (Q5).
- Both papers preserve AQA marks, suggested timings and the "quick paper" 40-mark format for
  shorter sessions.
- The text library stores full source displays; questions assemble per paper with deterministic
  objective marking and rubric-led marking for extended responses.

## Marking Coverage and Limits

- **Deterministic marking**: list questions (4 marks) match against fixed acceptable points;
  true/false questions mark against fixed answers. These never depend on AI availability.
- **Extended responses**: when `OPENROUTER_API_KEY` is configured, answers are marked against
  AQA-style rubric prompts with AO5/AO6 (writing) or AO-skill (reading) splits, level
  indications, strengths, targets and a model answer. Marks from this route are indicative
  feedback, not official marks.
- **When AI is offline**: learners still receive rubrics, level descriptors and model answers
  for self-marking; the result is flagged `incomplete` and the predicted grade is withheld
  rather than guessed. Self-marking unlocks the grade; nothing is invented.
- **Known limit**: AI feedback is not yet calibrated against double-marked examiner samples.
  Agreement ranges and rubric-led self-review routing for uncertain answers are the documented
  next step (roadmap, months 4–9).

## Skills (Assessment Objectives) Coverage

Every learning topic maps to published AQA 8700 assessment objectives, shown on the lesson page:

- AO1 (identify and interpret): listing, summarising and synthesis topics.
- AO2 (language and structure analysis): language, structure and 19th-century reading topics.
- AO3 (compare writers' ideas): comparison topic and Paper 2 synthesis work.
- AO4 (evaluate): evaluation topic.
- AO5/AO6 (communicate / technical accuracy): creative writing, argument writing and accuracy
  topics.

## Remaining Specification Backlog

1. Reading: more varied 19th-century source families and additional structural-analysis
   question shapes beyond the current generated set.
2. Writing: additional image-led description stimuli rotation and model-answer depth for
  weaker-ability bands.
3. Feedback: double-marked examiner calibration samples for the AI rubric marking route.
4. Coverage statement: a full question-bank audit mapping every generated item to spec
   statements, published once statement-level references are verified.

## Verification

`npm test` covers English attempt marking behaviour (including the rule that failed marks do
not consume attempts). `npm run test:ui` checks the English routes. `npm run build` verifies the
production client. Every topic page displays its AOs, reviewer and last review month with an
issue-reporting route.
