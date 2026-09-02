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

- Number: standard form and index laws, surds and exact values, bounds and error intervals.
- Algebra: algebraic fractions, quadratics (factorising, formula, completing the square,
  iteration), simultaneous equations (linear and linear/quadratic), functions, graphs and
  graphical methods, mathematical proof.
- Ratio, proportion and rates of change: growth and decay, direct and inverse proportion,
  compound measures.
- Geometry and measures: similarity and vectors, circle theorems and measures, advanced
  trigonometry (cosine rule, area formula).
- Probability: conditional probability, tree diagrams, distributions.
- Statistics: histograms, cumulative frequency, box plots and sampling.

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

1. Algebra: quadratic inequalities, tangent and normal to a circle, areas under curves and
   gradients of curves beyond generated cases, transformations of graphs.
2. Geometry: further vector geometry proofs, sine rule ambiguity cases, frustums and composite
   solids, further exact triangle geometry.
3. Probability: Venn and set notation beyond the generated families, conditional expectation.
4. Statistics: capture-recapture, further hypothesis-style reasoning and comparing distributions.
5. Number: further surd manipulation families and product rule for counting at Higher depth.
6. Ratio: further graphical proportion and gradients of real-life graphs.

## Verification

`npm test` checks Higher bank constraints, calculator eligibility and known mathematical
regressions. `npm run test:ui` checks the main routes and browser-error checks. `npm run build`
verifies both production clients. Every topic displays its spec section, reviewer and last
review month on the lesson page, with an issue-reporting route.
