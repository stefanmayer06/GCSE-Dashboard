# Foundation Maths Audit

## Scope

This audit covers the generated Foundation bank against the AQA 8300 structure, with a specific
review of paper allocation, visual-question density, diagram accuracy and generated-answer
correctness. It does not claim one-to-one coverage of every Foundation specification statement.

Generated full papers contain 8 to 13 numbered questions that depend on a graph, shape, chart,
table or probability diagram. The paper builder enforces 4 to 7 visual questions on a 40-mark paper.

## Corrected In This Pass

- All six strands can appear on Papers 1, 2 and 3. Paper 1 differs by calculator access rather than
  invented content exclusions.
- Foundation strand budgets use Number 25%, Algebra 20%, Ratio 25%, Geometry 15%, Probability 8%
  and Statistics 7% as whole-mark approximations of the tier balance.
- Explicit inverse-trigonometry questions are excluded from generated Paper 1 papers.
- Structured stimuli cover coordinate graphs, transformations, angle and shape diagrams, circles,
  solids, maps and bearings, charts, tables, scatter graphs, probability representations, frequency
  tables and visual sequences.
- Diagrams flow through timed papers, ad-hoc rounds, topic practice and result review. Interactive
  models are also present in the relevant learning topics.
- Wrong answers or ambiguous choices were corrected in operations, equations, fractions,
  percentages, averages, graph gradients, probability, ratio and angle generators.
- Colloquial Z/F/C angle terminology was removed from teaching and marking language.
- Original N4 practice and a worked lesson now cover factors, multiples, primes, prime
  factorisation in index form, HCF, LCM and shared-multiple/grouping problems. This maps to
  [AQA 8300 Number N4](https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/specification/subject-content/3.1-number).
- Original N9 practice and a worked lesson now cover writing and interpreting standard form,
  calculator E notation, comparing values and multiplying powers of ten. This maps to the
  same AQA Number specification and includes positive and negative integer powers.
- Topic-level `examWeight` values are relative priorities for the study planner, not
  published AQA percentages. The learner-facing lesson header no longer describes them as
  a fraction of an exam paper.
- Finance teaching now uses only tax rules supplied in a question. The tax exercises are
  explicitly fictional, so a learner is not taught a changing UK allowance or National
  Insurance calculation as a general fact.

## Remaining Specification Backlog

1. Number: roots and indices beyond the current BIDMAS examples, systematic listing,
   broader fraction arithmetic and formal written methods.
2. Rates and proportion: unit conversion, compound measures, density and pressure, inverse
   proportion, growth and decay, and graphical proportion.
3. Algebra: identities and functions, simultaneous equations, factorising and solving Foundation
   quadratics, and inequalities requiring sign reversal.
4. Graphs: plotting in four quadrants, quadratic graphs, real-life and conversion graphs,
   distance-time graphs and graphical equation solving.
5. Accuracy and measures: estimation, truncation, error intervals, bounds and limits of accuracy.
6. Geometry: constructions and loci, congruence, plans and elevations, circle vocabulary, arc and
   sector measures, cylinders and non-trivial bearings.
7. Transformations: complete shapes, non-origin centres, fractional enlargements and identifying a
   transformation from an image.
8. Probability: frequency trees, Venn and set notation, empirical versus theoretical probability,
   exhaustive distributions and systematic possibility spaces.
9. Statistics: sampling and bias, time series, grouped data, comparing distributions and data types.

## Verification

`npm test` checks Foundation and Higher bank constraints, calculator eligibility and known
mathematical regressions. `npm run test:ui` checks the main routes, visual interactions,
accessibility basics and desktop/mobile overflow. `npm run build` verifies both production clients.
