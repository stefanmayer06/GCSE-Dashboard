/**
 * AQA GCSE English Language (8700) marking rubrics — summarised from the
 * official mark schemes, except the clearly labelled skill-practice rubric.
 * Used by the configured OpenRouter model to award
 * marks, and shown to students for self-marking in offline mode.
 */
export const RUBRICS = {
  reading19c: {
    key: 'reading19c',
    name: 'Older-source reading practice — not an exam question',
    marks: 8,
    ao: 'AO1 + AO2 skill practice',
    bands: [
      { level: 1, range: '1–2', desc: 'Names a basic idea or mood; little accurate support from the older source; phrase explanations are missing or guesses.' },
      { level: 2, range: '3–4', desc: 'Explains some of the source’s meaning and attitude; gives a plausible meaning for at least one unfamiliar phrase.' },
      { level: 3, range: '5–6', desc: 'Clear account of the writer’s message and attitude; accurately explains two phrases using their context.' },
      { level: 4, range: '7–8', desc: 'Precise, well-supported understanding of the writer’s message and attitude; insightfully decodes two phrases from context.' },
    ],
    guidance: 'Assess only the older source named in the question. Reward accurate gist, supported inference about attitude, and contextual explanation of two phrases. Do not require comparison with the modern source. This is an original skill drill, not an AQA Paper 2 question or official mark scheme.',
  },
  p1q2: {
    key: 'p1q2',
    name: 'Paper 1 Q2 — Language analysis',
    marks: 8,
    ao: 'AO2',
    bands: [
      { level: 1, range: '1–2', desc: 'Simple comments on language; mostly restates or paraphrases; may pick out a single word without developing its effect.' },
      { level: 2, range: '3–4', desc: 'Begins to explain the effects of some words or features; uses some relevant terminology (adjective, simile); evidence used, though sometimes briefly.' },
      { level: 3, range: '5–6', desc: 'Clear explanations of the effects of language choices; a range of accurately-named features; quotations support every point; links choices to the question focus.' },
      { level: 4, range: '7–8', desc: 'Detailed, perceptive analysis; judiciously chosen quotations; connects individual words to patterns and to the reader\u2019s response; thoughtful, focused throughout.' },
    ],
    guidance: 'Reward: word classes and connotations, simile/metaphor/personification, sentence forms, sound effects (alliteration, sibilance). Every point must quote and explain the effect on the reader, linked to the question focus. Penalise: device-spotting without effect, retelling, unsupported claims.',
  },
  p1q3: {
    key: 'p1q3',
    name: 'Paper 1 Q3 — Structure analysis',
    marks: 8,
    ao: 'AO2 (structure)',
    bands: [
      { level: 1, range: '1–2', desc: 'Simple comments; may simply retell the order of events ("first, then, next") without comment on effect.' },
      { level: 2, range: '3–4', desc: 'Some structural terms (opening, ending, focus, shift); begins to comment on the effect of structural choices.' },
      { level: 3, range: '5–6', desc: 'Clear structural terminology; explains how focus, pace, tension or perspective shifts affect the reader; uses reference to whole text.' },
      { level: 4, range: '7–8', desc: 'Perceptive analysis of structure as a deliberate sequence (foreshadowing, juxtaposition, cyclical features); explores how structure shapes meaning.' },
    ],
    guidance: 'Reward: openings, endings, focus shifts, perspective, time, tension/pace, juxtaposition, motifs, cyclical structure. Focus on the effect named in the question, where specified. Analyses of sentence-level structure count if linked to the whole. Penalise: pure chronology ("it starts, next, finally"), retelling, language techniques analysed instead of structure.',
  },
  p1q4: {
    key: 'p1q4',
    name: 'Paper 1 Q4 — Evaluation ("to what extent")',
    marks: 20,
    ao: 'AO4',
    bands: [
      { level: 1, range: '1–5', desc: 'Little engagement with the statement; simple opinions with little or no text evidence; may retell.' },
      { level: 2, range: '6–10', desc: 'Some evaluation of the statement; relevant text evidence included; some evaluative language; uneven development.' },
      { level: 3, range: '11–15', desc: 'Clear, sustained critical response (agree/partly/ranged); well-chosen quotations; evaluative vocabulary used deliberately; developed and coherent.' },
      { level: 4, range: '16–20', desc: 'Compelling, critical evaluation; explores nuance and ambivalence; compelling use of evidence; convincing judgement that develops across the response.' },
    ],
    guidance: 'Reward: a clear supported position, well-chosen evidence and evaluation of the writer’s choices. Use the part of the source specified in the question. Credit justified nuance, but do not require disagreement or a fixed balance of views. Penalise: retelling, agreeing or disagreeing with no reasoning, listing points without judgement.',
  },
  p2q2: {
    key: 'p2q2',
    name: 'Paper 2 Q2 — Summary',
    marks: 8,
    ao: 'AO1',
    bands: [
      { level: 1, range: '1–2', desc: 'Simple statements about the texts; may copy from one text only; limited relevance to the focus.' },
      { level: 2, range: '3–4', desc: 'Some relevant details from both texts; begins to make inferences; some similarity/difference noticed.' },
      { level: 3, range: '5–6', desc: 'Clear, relevant ideas from both texts; makes and develops inferences; differences/similarities summarised with precision.' },
      { level: 4, range: '7–8', desc: 'Perceptive synthesis of both texts; ideas combined fluently (whereas/although); details are apt, concise and incisively interpreted.' },
    ],
    guidance: 'Reward: accurate detail from BOTH texts, precision, inference, comparison through connectives. Penalise: analysis of language/methods (that is Q3/Q4 territory), copying without interpretation, using only one source.',
  },
  p2q3: {
    key: 'p2q3',
    name: 'Paper 2 Q3 — Language analysis (single source)',
    marks: 12,
    ao: 'AO2',
    bands: [
      { level: 1, range: '1–3', desc: 'Simple comments; mostly paraphrase; a feature or two named without development.' },
      { level: 2, range: '4–6', desc: 'Some explanation of effects of language; some terminology; quotations used, sometimes without development.' },
      { level: 3, range: '7–9', desc: 'Clear, developed explanations; accurate range of terminology; quotations support points; consistent focus on the question.' },
      { level: 4, range: '10–12', desc: 'Detailed, perceptive analysis; explores word-level texture and effects; compelling selection of evidence; reads the voice/tone of the writer.' },
    ],
    guidance: 'Same skill as Paper 1 Q2 but 12 marks and usually on non-fiction: also reward identification of tone, voice, exaggeration, figurative devices in persuasive writing. Penalise: device-spotting, retelling, no quotations.',
  },
  p2q4: {
    key: 'p2q4',
    name: 'Paper 2 Q4 — Comparing viewpoints and methods',
    marks: 16,
    ao: 'AO3',
    bands: [
      { level: 1, range: '1–4', desc: 'Simple summary of the two texts; little or no comparison; methods absent or named without effect.' },
      { level: 2, range: '5–8', desc: 'Some true comparison of viewpoints; some comment on methods; uneven support from the texts.' },
      { level: 3, range: '9–12', desc: 'Clear comparative analysis: viewpoints AND methods discussed together; well-chosen evidence from both texts; coherent structure.' },
      { level: 4, range: '13–16', desc: 'Insightful comparison; explores how methods create viewpoint; ideas woven together; evaluative and precise.' },
    ],
    guidance: 'Reward: both halves of the task — WHAT each writer thinks and HOW each conveys it, compared (whereas/while/in contrast/both). Methods: tone, irony, humour, anecdote, structure, imagery, statistics, direct address. Penalise: analysing both texts separately with no comparison; comparing only viewpoints; comparing only methods without viewpoint.',
  },
  p1q5: {
    key: 'p1q5',
    name: 'Paper 1 Q5 — Creative writing',
    marks: 40,
    ao: 'AO5 (24) + AO6 (16)',
    split: { content: { name: 'Content & organisation (AO5)', max: 24 }, accuracy: { name: 'Technical accuracy (AO6)', max: 16 } },
    bands: [
      { level: 1, range: 'AO5 1–6 · AO6 1–4', desc: 'Simple, limited communication; little organisation; frequent spelling, punctuation and grammar errors; limited vocabulary.' },
      { level: 2, range: 'AO5 7–12 · AO6 5–8', desc: 'Some success in the task; some organisation (sequence of ideas); simple sentences mostly accurate; varied sentences attempted.' },
      { level: 3, range: 'AO5 13–18 · AO6 9–12', desc: 'Clear, successful communication; coherent and engaging structure; wide vocabulary; mostly accurate SPaG with ambitious techniques.' },
      { level: 4, range: 'AO5 19–24 · AO6 13–16', desc: 'Compelling, convincing writing; sophisticated, deliberate structure; full range of sentence structures; highly accurate; ambitious vocabulary used with flair.' },
    ],
    guidance: 'AO5 rewards: content matched to the chosen description or narrative task, vivid ideas, controlled structure and developed detail. When a story opening is requested, judge an opening; do not require a complete plot or resolution. Descriptive detail within a narrative is valid. An image is an optional stimulus when the task permits imagination. AO6 rewards: sentence variety, vocabulary, spelling, punctuation and paragraphing. Do not reward length alone.',
  },
  p2q5: {
    key: 'p2q5',
    name: 'Paper 2 Q5 — Writing to argue/persuade',
    marks: 40,
    ao: 'AO5 (24) + AO6 (16)',
    split: { content: { name: 'Content & organisation (AO5)', max: 24 }, accuracy: { name: 'Technical accuracy (AO6)', max: 16 } },
    bands: [
      { level: 1, range: 'AO5 1–6 · AO6 1–4', desc: 'Simple, limited communication; little sense of audience or form; frequent accuracy errors; limited vocabulary.' },
      { level: 2, range: 'AO5 7–12 · AO6 5–8', desc: 'Some success; attempts form and audience; some persuasive moves (an opinion, a reason); mostly accurate simple sentences.' },
      { level: 3, range: 'AO5 13–18 · AO6 9–12', desc: 'Clear, successful communication; persuasive devices used with purpose; coherent structure; wide vocabulary; mostly accurate SPaG.' },
      { level: 4, range: 'AO5 19–24 · AO6 13–16', desc: 'Compelling, convincing argument; form and audience handled confidently; rhetorical devices woven in naturally; highly accurate with a full range of sentence structures.' },
    ],
    guidance: 'AO5 rewards: clear position, developed reasoning, counter-arguments addressed, form matched (article/letter/speech), persuasive features used purposefully (rhetorical questions, rule of three, anecdote, direct address). AO6 as for Paper 1 Q5. Penalise: ranting without reasons, ignoring the form, repetition that does not develop.',
  },
};

export function rubricFor(key) {
  return RUBRICS[key] || RUBRICS.p1q2;
}
