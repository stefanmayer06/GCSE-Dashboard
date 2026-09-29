export const SECTIONS = {
  reading: {
    id: 'reading',
    name: 'Reading skills',
    blurb: 'The skills behind Papers 1 and 2 reading questions.',
    color: '#7c5cff',
  },
  writing: {
    id: 'writing',
    name: 'Writing skills',
    blurb: 'Everything you need for the two 40-mark writing questions.',
    color: '#ffb020',
  },
};

const RES = {
  bbc: {
    label: 'BBC Bitesize — AQA English Language',
    url: 'https://www.bbc.co.uk/bitesize/examspecs/zcbchv4',
    why: 'Free guides for every question type on the 8700 papers.',
  },
  seneca: {
    label: 'Seneca Learning',
    url: 'https://senecalearning.com/en-GB/',
    why: 'Free interactive English Language revision courses.',
  },
  mrbruff: {
    label: 'Mr Bruff (YouTube)',
    url: 'https://www.youtube.com/@mrbruff',
    why: 'The classic free video walkthroughs of every AQA question.',
  },
  englishbiz: {
    label: 'Englishbiz',
    url: 'https://www.englishbiz.co.uk/',
    why: 'Straight-talking guides to writing and analysis.',
  },
  revisionworld: {
    label: 'Revision World',
    url: 'https://revisionworld.com/gcse-revision/english',
    why: 'Free past questions and essay guidance.',
  },
};

const P = (text) => ({ t: 'p', text });
const B = (items) => ({ t: 'b', items });
const F = (title, text) => ({ t: 'f', title, text });
const E = (q, a) => ({ t: 'e', q, a });

export const TOPICS = [
  {
    id: 'listing',
    section: 'reading',
    name: 'Finding Information (Paper 1 Q1)',
    blurb: 'Find explicit details and choose four answers.',
    examWeight: 4,
    notes: [
      P('From the 2026 exam, Paper 1 Q1 has four multiple-choice questions about a specified part of the source. Each has one correct answer and is worth one mark.'),
      B([
        'Read only the specified lines before choosing each answer.',
        'Check the exact wording of all three options against the source.',
        'Choose one option for each of the four questions.',
        'Look for explicit details; do not add an inference that the text does not support.',
      ]),
      F('The rule', 'One correct choice earns one mark. Four choices earn four marks.'),
      E('When does the footbridge close? A: at six; B: at seven; C: at eight. (The Last Crossing)', 'B: at seven. The notice states this directly; do not confuse it with Nia’s arrival time.'),
    ],
    resources: [RES.bbc, RES.seneca, RES.mrbruff, RES.revisionworld],
  },
  {
    id: 'language',
    section: 'reading',
    name: 'Analysing Language (P1 Q2 & P2 Q3)',
    blurb: 'Word choices, imagery and effects — the classic 8/12-marker.',
    examWeight: 20,
    notes: [
      P('These questions ask HOW the writer uses language. Always quote, name the technique clearly, and explain the EFFECT on the reader.'),
      B([
        'Formula: quote → technique → effect → link back to the question focus.',
        'Word classes: vivid verbs, precise adjectives, adverbs, nouns.',
        'Imagery: simile, metaphor, personification — what do they make you SEE or FEEL?',
        'Sentence forms: short sentences for shock, long lists to overwhelm, questions to involve.',
        'Sound effects: alliteration, sibilance, onomatopoeia.',
        'Aim for 2-3 developed points, each with its own quotation, not a list of twenty devices.',
      ]),
      F('The paragraph frame', 'The writer uses [technique]: "[quote]". The word "..." suggests..., making the reader [feel/see]..., which emphasises [the question focus].'),
      E('How does the writer use language to make the marsh seem unsafe? (The Last Crossing)', 'The mud is "deep and greedy", personifying it as something that could swallow a person. The path resembles "a fraying ribbon", suggesting that the safe route is coming apart. These images make the attractive surface of the water unreliable.'),
    ],
    resources: [RES.bbc, RES.mrbruff, RES.englishbiz, RES.seneca],
  },
  {
    id: 'structure',
    section: 'reading',
    name: 'Analysing Structure (Paper 1 Q3)',
    blurb: 'Openings, shifts, tension and endings.',
    examWeight: 8,
    notes: [
      P('Structure = the order of events and how the writer directs your attention. It is never "it starts, then, next". You must comment on the EFFECT of the choices.'),
      P('From 2026, Q3 names an effect to explore, such as tension. Keep your analysis focused on that effect across the whole source; do not reuse a generic answer about reader interest.'),
      B([
        'Openings: does it start in the middle of action? With a setting? A question?',
        'Focus shifts: where does the writer move your attention, and why?',
        'Perspective changes: wide view → close-up → inside a character\u2019s head.',
        'Time: flashbacks, slowing down, speeding up.',
        'Tension: how the writer builds, releases and re-builds it.',
        'Endings: what feeling or question is the reader left with?',
        'Use the structure vocabulary: focus, shift, juxtaposition, climax, cyclical ending.',
      ]),
      F('Structure vocabulary', 'opening · focus shift · sentence pace · tension · cyclical return · cliffhanger'),
      E('How has the writer organised the extract to build tension? (The Last Crossing)', 'The opening sets a deadline before revealing the stranded man. Description slows Nia’s approach, and her thoughts about leaving delay the decision to help. The first throw fails, making the reader wait again. The ending returns to "Seven o\'clock", resolving the immediate danger while showing how close the deadline has become.'),
    ],
    resources: [RES.bbc, RES.mrbruff, RES.englishbiz, RES.revisionworld],
  },
  {
    id: 'evaluation',
    section: 'reading',
    name: 'Evaluating a Statement (Paper 1 Q4)',
    blurb: '"To what extent do you agree?" — 20 marks.',
    examWeight: 20,
    notes: [
      P('This is the big reading question: you are a critic. You must BUILD an argument about the statement, using the text as evidence, not just list things you noticed.'),
      P('Use the specified part of the source. The 2026 wording no longer puts the judgement in the mouth of a fictional student, but you still need your own supported evaluation.'),
      B([
        'State your position: agree fully, mostly, partly, or disagree — and stick to it.',
        'Select the best evidence (2-4 moments) and write a developed comment on each.',
        'Use evaluative language: effective, convincing, memorable, powerful, surprising, ironic.',
        'Be critical: mention the limits of the statement too — "however…".',
        'Never retell the story. Every sentence should weigh the statement.',
        'Structure: mini-argument per paragraph — point, evidence, evaluation, link back to the statement.',
      ]),
      F('Evaluative bank', 'most effective · deliberately · ironic · manipulates the reader · creates sympathy · undermines'),
      E('"Sana begins to take responsibility instead of protecting her pride." — To what extent do you agree? (The Test Run, later part)', 'I largely agree. Her admission, "I said it was, but it isn\'t", accepts the fault without blaming the storm. Turning the sign face down gives the change a visible form. Moving her chair to make room for Theo also replaces the pretence that she worked alone with cooperation. However, the repair is unfinished, so the writer shows a beginning rather than a complete transformation.'),
    ],
    resources: [RES.bbc, RES.mrbruff, RES.englishbiz, RES.seneca],
  },
  {
    id: 'summarising',
    section: 'reading',
    name: 'Summarising (Paper 2 Q2)',
    blurb: 'Comparing what two texts tell you — 8 marks.',
    examWeight: 8,
    notes: [
      B([
        'Read the question focus carefully (e.g. the differences between the two schools).',
        'Summaries are about IDEAS and details, not language techniques — no analysis here.',
        'Use details from BOTH texts, in the same paragraph where possible: "whereas Source A…, Source B…".',
        'Quote briefly, or paraphrase precisely — either is fine, but be accurate.',
        'Two or three developed comparative points are enough; quality over quantity.',
        'Use connecting words: however, whereas, in contrast, similarly, but.',
      ]),
      F('The frame', 'In Source A… [detail]. In Source B, however… [contrasting detail]. This shows one system… while the other…'),
      E('Summarise the differences between the learning experiences (Mill’s Autobiography / modern feature)', 'In Source A, Mill’s father expects him to find answers by thinking for himself, even though Mill recalls many "failures". In Source B, a school phone ban helps pupils listen to one another and talk more in the dining hall. Mill describes demanding lessons with one teacher; the modern pupil describes a change shared across the school.'),
    ],
    resources: [RES.bbc, RES.seneca, RES.revisionworld, RES.englishbiz],
  },
  {
    id: 'comparing',
    section: 'reading',
    name: 'Comparing Viewpoints (Paper 2 Q4)',
    blurb: 'Compare what writers think AND how they say it — 16 marks.',
    examWeight: 16,
    notes: [
      P('The examiner wants both halves: WHAT each writer believes (their viewpoint) and HOW they put it across (their methods). Balance the two.'),
      B([
        'Start each paragraph with the viewpoint comparison: "Engels sees a social failure… whereas the modern writer describes a personal escape…".',
        'Then name a method each uses: irony, anecdote, humour, statistics, structure, tone.',
        'Use comparative connectives throughout: both, whereas, in contrast, similarly.',
        'Quote briefly from both texts in the same paragraph.',
        'Aim for 3 well-developed comparative paragraphs, or 2 + a short conclusion on the big idea.',
      ]),
      F('The frame', 'Both writers…, but while [A] uses [method] to [effect], [B] chooses [method], which… This matters because…'),
      E('Compare how the writers convey their viewpoints on city life.', 'Both writers see isolation in a crowded city, but their scale differs. Engels begins with the "marvel of England’s greatness" before turning to the "brutal indifference" of strangers in the street. The modern blogger uses a personal joke about learning a neighbour’s name from his post before explaining why village life lets them sleep. Engels criticises a social pattern; the blogger describes an individual choice to leave.'),
    ],
    resources: [RES.bbc, RES.mrbruff, RES.englishbiz, RES.revisionworld],
  },
  {
    id: 'reading-19c',
    section: 'reading',
    name: 'Decoding 19th-Century Texts',
    blurb: 'Read the older source in a Paper 2 pair with confidence.',
    examWeight: 8,
    notes: [
      P('In the AQA exam, Paper 2 pairs a 19th-century non-fiction or literary non-fiction text with a modern one; either period may be Source A. These practice sets include both source orders. Use an official AQA sample paper as well. Slow down, read twice and look for the main idea.'),
      B([
        'Long sentences: find the MAIN clause first; the rest is decoration.',
        'Unfamiliar words: guess from context; you usually only need the gist.',
        'Look for the writer\u2019s STANCE first — mocking, pitying, admiring — everything else follows.',
        'You do not need to understand every word to score. Examiners reward sensible gist.',
        'Expect: dashes, semicolon floods, archaic words (hitherto, whereupon), and heavy irony.',
        'Practise by reading one of the extracts in this app every few days without stopping.',
      ]),
      F('First-read strategy', 'Read the blurb → skim first and last lines → read once for gist → read question → hunt for evidence.'),
      E('"We have half a loaf of bread a day." (Mayhew’s interview)', 'The speaker’s exact amount makes a general claim about poverty concrete. He and his wife must share that bread while paying rent from uncertain daily sales; the detail helps the reader grasp how little margin they have.'),
    ],
    resources: [RES.bbc, RES.englishbiz, { label: 'Project Gutenberg', url: 'https://www.gutenberg.org/', why: 'Public-domain nineteenth-century texts.' }, RES.revisionworld],
  },
  {
    id: 'creative-writing',
    section: 'writing',
    name: 'Creative Writing (Paper 1 Q5)',
    blurb: 'Description or story opening — 40 marks. Since 2026, narrative means an opening, not a whole story.',
    examWeight: 40,
    notes: [
      P('24 marks for content & organisation (AO5), 16 for technical accuracy (AO6). Plan for 5 minutes, write for 35, check for 5. Choose description if you love imagery, narrative opening if you love character and tension — NEVER switch halfway.'),
      B([
        'Open with intention: a striking image, a moment of action, a single telling detail. Avoid "It was a dark and stormy night".',
        'Description structure: 4-5 paragraphs, each doing one job (establish → develop → tension/high point → shift → ending).',
        'Story-opening structure (since 2026): establish atmosphere → convincing character and setting → inciting incident. You do not need to resolve anything — subtle shifts in mood beat plot.',
        'Show, don\u2019t tell: "the gate coughed shut" beats "the gate was old".',
        'Vary sentences: short sentences land punches; long ones build mood.',
        'Fix one mood first (tense, joyful, eerie) and let every word choice pull in that direction — examiners reward typical features like atmosphere shifts, convincing character and precise vocabulary.',
        'AO6: check capitals, full stops, apostrophes, paragraphing. Accuracy IS 16 marks.',
      ]),
      F('Planning in 5 minutes', 'Mood → setting → character → sensory detail bank (5 words per sense) → inciting incident.'),
      E('Opening line exercise', 'Weak: "It was raining and I felt scared."  Strong: "The rain had been practising all night, and by morning the lane had learned to swim."'),
    ],
    resources: [RES.bbc, RES.mrbruff, RES.englishbiz, RES.seneca],
  },
  {
    id: 'argument-writing',
    section: 'writing',
    name: 'Writing to Argue & Persuade (Paper 2 Q5)',
    blurb: 'Articles, letters and speeches — 40 marks.',
    examWeight: 40,
    notes: [
      P('You are given a statement and a FORM (article, letter, speech, leaflet). Argue = build a case with reasons and counter-arguments. Persuade = win the reader over with feeling. The best answers do both.'),
      B([
        'Match the form: article → headline + engaging opening; letter → "Dear…" + sign-off; speech → address the audience directly.',
        'Open with an anecdote, a striking fact or a direct question — never "In this article I will…".',
        'Use persuasive devices WITH purpose: rule of three, rhetorical questions, emotive language, statistics, direct address.',
        'Concede then rebut: "Some say… However…" — it makes you sound fair and smart.',
        'One idea per paragraph; link paragraphs ("And this matters because…").',
        'End with a memorable final line — a call to action or a sharp image.',
      ]),
      F('Persuasive kit', 'anecdote · rhetorical question · triples ("clear, calm and fair") · counter-argument · direct address · emotive verbs'),
      E('Opening a speech against phones in school', '"Hands up if you have ever checked your phone in a lesson. Now keep them up if you remember what the lesson was about. Exactly."'),
    ],
    resources: [RES.bbc, RES.englishbiz, RES.mrbruff, RES.seneca],
  },
  {
    id: 'accuracy',
    section: 'writing',
    name: 'Spelling, Punctuation & Grammar (AO6)',
    blurb: '16 marks are hiding in your SPAG — claim them.',
    examWeight: 16,
    notes: [
      B([
        'Paragraph every time the idea, time, place or speaker changes.',
        'Full stops: if you can hear a natural long pause, it is probably a new sentence.',
        'Apostrophes only for possession (the dog\u2019s bowl) and omission (do not → don\u2019t). NEVER for plurals.',
        'Commas before but/which/who clauses; no comma splices (no joining two sentences with just a comma).',
        'Vary sentence starts: "Slowly, she…", "Behind the door…", "However…".',
        'The classic killer list: there/their/they\u2019re, your/you\u2019re, its/it\u2019s, to/too/two, were/where/we\u2019re.',
        'Leave 5 minutes at the end to proofread ONE more time — it genuinely gains marks.',
      ]),
      F('Proofread routine', 'Read your answer aloud inside your head, one sentence at a time. Your ear catches what your eye misses.'),
      E('Find all 3 errors: "your going to there house to get you\u2019re books"', '"Your" → "you\u2019re" · "there" → "their" · "you\u2019re" → "your" — three different homophone errors in one short clause!'),
    ],
    resources: [RES.bbc, RES.englishbiz, RES.seneca, { label: 'Grammar Monster', url: 'https://www.grammar-monster.com/', why: 'Plain-English explanations of every grammar point.' }],
  },
];
// Editorial review trail. Assessment objectives use the published AQA 8700
// coding: AO1 identify/infer, AO2 language & structure, AO3 compare,
// AO4 evaluate, AO5 communicate, AO6 technical accuracy.
const SPEC_REFS = {
  listing: ['AO1'],
  language: ['AO2'],
  structure: ['AO2'],
  evaluation: ['AO4'],
  summarising: ['AO1', 'AO3'],
  comparing: ['AO3'],
  'reading-19c': ['AO1', 'AO2'],
  'creative-writing': ['AO5', 'AO6'],
  'argument-writing': ['AO5', 'AO6'],
  accuracy: ['AO6'],
};

const REVIEWED = {
  listing: '2026-09-28',
  language: '2026-09-28',
  structure: '2026-09-28',
  evaluation: '2026-09-28',
  summarising: '2026-07-13',
  comparing: '2026-07-13',
  'reading-19c': '2026-09-24',
  'creative-writing': '2026-07-21',
  'argument-writing': '2026-07-22',
  accuracy: '2026-07-23',
};

for (const topic of TOPICS) {
  if (SPEC_REFS[topic.id]) topic.specRefs = SPEC_REFS[topic.id];
  if (REVIEWED[topic.id]) topic.reviewed = REVIEWED[topic.id];
}
