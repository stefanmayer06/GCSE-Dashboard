# English Language Audit

## Scope

This audit covers EnglishMate's generated questions, source texts, marking and feedback against
the AQA GCSE English Language 8700 structure. It documents what is covered and how it is marked;
it does not claim AQA endorsement and does not promise official marks or guaranteed grades from
AI feedback.

## Structure Coverage

- **Paper 1 (8700/1), Explorations in creative reading and writing**: reading section with
  four-part multiple-choice retrieval (2026 Q1), language analysis, structural analysis and evaluation; writing
  section with a description task tied to an appropriate image stimulus (Wikimedia Commons,
  resolved via `Special:FilePath`) and a story-opening choice. Six original 21st-century fiction
  passages now replace the active classic extracts. Q3 names a structural effect to explore;
  Q4 specifies a later part of the source and does not invent a student speaker. These are
  independent practice passages, not published literature or official exam sources.
- **Paper 2 (8700/2), Writers' viewpoints and perspectives**: linked source texts, a four-from-eight
  true-statement selection (Q1), summary (Q2), non-fiction language analysis (Q3), comparing
  writers' ideas (Q4), and an argument/persuasive writing task (Q5). The education, weather and city
  and work pairs now use 19th-century non-fiction or literary non-fiction: John Stuart Mill's
  *Autobiography* (1873), Max Schlesinger's *Saunterings in and about London* (1853), and
  Friedrich Engels's *The Condition of the Working-Class in England in 1844* (1892 English
  translation), and Henry Mayhew's *London Labour and the London Poor* (1851). A fifth set
  presents the city pair in the reverse order, with the modern text as Source A. Each Q1
  refers only to Source A, while Q3 refers only to Source B. AQA requires one older and one
  modern non-fiction source, so learners can now practise both source orders.
- Both question sets preserve the 80-mark total, suggested timings and a 44-mark "quick paper"
  format for shorter sessions. Original passages and uncalibrated extended-response marking
  still prevent describing the library as validated mock exams.
- The text library stores full source displays; questions assemble per paper with deterministic
  objective marking and rubric-led marking for extended responses.

## Paper 2 Source Verification (September 2026)

The four older passages were checked against the full public-domain editions below.
The modern passages are original texts written for practice. The city pair has a second
question set with the sources reversed; it does not add a fifth distinct pair of texts.

- [Mill, *Autobiography*, 1873](https://www.gutenberg.org/ebooks/10378): childhood education;
  Q2/Q4 prompts and models now concern independent thought and the learning experience.
- [Schlesinger, *Saunterings in and about London*, 1853 English edition](https://www.gutenberg.org/ebooks/46571):
  London weather; Otto Wenckstern's translation is credited in the source display.
- [Engels, *The Condition of the Working-Class in England in 1844*, 1892 English edition](https://www.gutenberg.org/ebooks/17306):
  London crowds; Florence Kelley's translation is credited. The original was published in 1845.
- [Mayhew, *London Labour and the London Poor*, 1851](https://www.gutenberg.org/ebooks/55998):
  a cutlery seller's weekly earnings. A bracketed context note distinguishes editorial context
  from the historical words. The paired modern article no longer depends on *Oliver Twist*.

Each set retains eight Q1 statements, exactly four true, and an 80-mark full paper. The
text reader now shows provenance and the full-text link for the selected source. New paper
sessions also save the source text used at the start, so later editorial changes cannot
change the source sent for their marking. Older Paper 2 sessions without a snapshot
use the retained pre-replacement text in `texts/p2-legacy.js`; their stored questions
remain unchanged. Keep that compatibility until the final old session reaches its
24-hour expiry after rollout.

## Paper 1 Original Practice (September 2026)

The six passages are *The Last Crossing*, *A Signal on the Moor*, *The Spare Room*,
*Captain for a Morning*, *The Road Home* and *The Test Run*. Each is 482–523 words,
labelled as original fiction written for practice in 2026. They vary the setting,
tone and question focus, including suspense, discomfort, humour and reassurance.

All 24 Q1 correct choices have supporting phrases within the specified first part.
Every quotation in the Q2 and Q4 models was checked against its specified part;
Q3 models use references to the whole extract. Each set retains an 80-mark full
paper, a 44-mark quick paper and both writing options. Description tasks allow
imagination and an optional picture; narrative tasks request a story opening.
Rubric guidance follows the named structural effect, bounded evaluation and the
chosen writing task, without requiring a complete plot or forced disagreement.

The six classic IDs remain readable and resolvable for older links and sessions,
but are labelled as archived skills practice and excluded from new paper and drill
selection. New source IDs prevent existing Paper 1 sessions from changing text.

This resolves the active source-period mismatch. It does not substitute for
subject review: AQA uses published literature by established writers. The original
texts and models need an English teacher's review for quality, demand and accuracy,
and learners should also work with official AQA source passages. No human reviewer
or examiner calibration is claimed for these new drafts.

## Marking Coverage and Limits

- **Deterministic marking**: the current Paper 1 Q1 has four original single-answer multiple-choice
  items worth one mark each; Paper 2 Q1 awards one mark for each correctly selected true
  statement, up to four. These never depend on AI availability. Legacy in-progress list and
  true/false sessions retain their original marking routes until expiry.
- **Extended responses**: when `OPENROUTER_API_KEY` is configured, answers are marked against
  AQA-style rubric prompts with AO5/AO6 (writing) or AO-skill (reading) splits, level
  indications, strengths, targets and a model answer. Marks from this route are indicative
  feedback, not official marks.
- **Older-source skill drill**: uses a custom, explicitly labelled eight-mark practice rubric
  for understanding one source and decoding two phrases. It does not use the Paper 2 Q2
  comparison rubric or require the modern source.
- **When AI is offline**: learners still receive rubrics, level descriptors and model answers
  for self-marking; the result is flagged `incomplete`. No English practice paper now issues a
  predicted grade because the source library and AI marks have not been calibrated to exams.
- **Known limit**: AI feedback is not yet calibrated against double-marked examiner samples.
  Agreement ranges and rubric-led self-review routing for uncertain answers are the documented
  next step (roadmap, months 4–9).

## Skills (Assessment Objectives) Coverage

Every learning topic maps to published AQA 8700 assessment objectives, shown on the lesson page:

- AO1 (identify and interpret): multiple-choice retrieval, summarising and synthesis topics.
- AO2 (language and structure analysis): language, structure and 19th-century reading topics.
- AO3 (compare writers' ideas): comparison topic and Paper 2 synthesis work.
- AO4 (evaluate): evaluation topic.
- AO5/AO6 (communicate / technical accuracy): creative writing, argument writing and accuracy
  topics.

## Remaining Specification Backlog

1. Obtain subject review of the six original Paper 1 sets and Paper 2 replacements. Add
   rights-cleared published contemporary fiction if validated mock simulation is offered.
   Broaden Paper 2's modern-first practice beyond the one reversed city pair.
2. Reading: more varied source families and additional structural-analysis
   question shapes beyond the current generated set.
3. Writing: additional image-led description stimuli rotation and model-answer depth for
  weaker-ability bands.
4. Feedback: double-marked examiner calibration samples for the AI rubric marking route.
5. Coverage statement: a full question-bank audit mapping every generated item to spec
   statements, published once statement-level references are verified.

Sources: [AQA 8700 scheme of assessment](https://www.aqa.org.uk/subjects/english/gcse/english-8700/specification/scheme-of-assessment),
[AQA Paper 1 updates for first exam 2026](https://www.aqa.org.uk/files/2a0165d2-2b01-4d08-8c02-51c5d4ee9926/0a5054aa567b82159c3e8a59c58e78202f6f8760.pdf),
[AQA Paper 2 specimen question paper](https://store.aqa.org.uk/resources/english/AQA-87002-SQP.PDF).

## Verification

`npm test` covers English attempt marking behaviour (including the rule that failed marks do
not consume attempts). `npm run test:ui` checks the English routes. `npm run build` verifies the
production client. Every topic page displays its AOs, reviewer and last review month with an
issue-reporting route.

On 28 September 2026, all 84 server tests, the production build and eight targeted
Chrome checks passed. Browser checks covered the Paper 1 paper, active text library,
archived classic link and course guide, including 390px mobile layouts. The reviewer
field explicitly reports that subject review is pending; editorial checks do not
claim a teacher or examiner sign-off.
