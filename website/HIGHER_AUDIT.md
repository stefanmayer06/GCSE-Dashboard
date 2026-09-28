# Higher Maths Audit

## Scope

This audit covers the generated Higher bank against the AQA 8300H structure, reviewing tier
weighting, paper constraints, calculator eligibility and generated-answer correctness. It is a
structure-and-correctness audit: it does not yet claim one-to-one coverage of every Higher
specification statement. Statement-level references ship only when a documented audit supports
them, so topic metadata currently publishes verified spec *sections* (3.1–3.6) rather than
guessed statement codes.

## Coverage in This Pass

Higher-only topic families, each with generated questions, exact answers, worked solutions and
deterministic marking metadata:

- Number: standard form, negative and fractional indices, surd simplification and
  rationalisation, bounds and error intervals.
- Algebra: simple algebraic fractions, quadratics (factorising and formula), simultaneous
  equations (linear and linear/quadratic), linear function values, graph reading and
  introductory proof questions.
- Ratio, proportion and rates of change: repeated percentage growth or decay and
  inverse-square proportion.
- Geometry and measures: similar lengths, vector-component sums, the angle-at-centre
  theorem, sector area, cosine rule and the non-right-angle triangle area formula.
- Probability: without-replacement and independent-event questions with tree diagrams.
- Statistics: frequency density, histograms, cumulative-frequency medians and
  interquartile range from box-plot values.

Every Higher question also draws on the Foundation-shared families (`TOPICS` in
`server/src/subjects/maths/bank/topics.js`) because AQA 8300H assumes the full Foundation content
base. Foundation and Higher progress, mastery and paper history remain stored separately
(`maths` vs `maths-higher`).

## Paper Constraints (enforced by tests)

`server/test/higher-bank.test.js` verifies:

- Generated papers satisfy the hard assessment constraints (80 marks, three papers, difficulty
  ramp, at least one accessible graph stimulus per paper).
- Paper 1 (8300/1H) contains no calculator-required items.
- Exactly one item per paper is marked as an exceptional synoptic challenge.
- Decimal algebra and probability calculations require a calculator where intended.
- Every generated question accepts its canonical answer (deterministic marking regression).

## Remaining Specification Backlog

1. Algebra: completing the square, iteration, quadratic inequalities, tangent and normal to
   a circle, areas under curves, gradients of curves and transformations of graphs.
2. Geometry: vector geometry proofs, sine rule (including ambiguity), further circle theorems
   and constructions, frustums and composite solids.
3. Probability: Venn and set notation, fuller conditional-probability methods and distributions.
4. Statistics: sampling methods, capture-recapture and comparing distributions.
5. Number: recurring decimals, further surd manipulation and the product rule for counting.
6. Ratio: direct and graphical proportion, compound measures and real-life graph gradients.

## Verification

`npm test` checks Higher bank constraints, calculator eligibility and known mathematical
regressions. `npm run test:ui` checks the main routes and browser-error checks. `npm run build`
verifies both production clients. Every topic displays its spec section, reviewer and last
review month on the lesson page, with an issue-reporting route.
