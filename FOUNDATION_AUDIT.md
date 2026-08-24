# Foundation Maths Audit

## Scope

This audit covers the current generated Foundation bank against the AQA 8300 structure, with a
specific review of paper allocation, visual-question density, diagram accuracy and generated-answer
correctness. It does not yet claim one-to-one coverage of every Foundation specification statement.

Recent Foundation papers typically contain 8 to 13 numbered questions that depend on a graph,
shape, chart, table or probability diagram. The paper builder now enforces that range on an 80-mark
paper and 4 to 7 visual questions on a 40-mark paper.

## Corrected In This Pass

- All six strands can now appear on Papers 1, 2 and 3. Paper 1 differs by calculator access rather
  than invented content exclusions.
- Foundation strand budgets now use Number 25%, Algebra 20%, Ratio 25%, Geometry 15%, Probability
  8% and Statistics 7% (whole-mark approximations of the tier balance).
- Explicit inverse-trigonometry questions are excluded from generated Paper 1 papers.
- Structured stimuli now cover coordinate graphs, transformations, angle and shape diagrams,
  circles, solids, maps and bearings, charts, tables, scatter graphs, probability representations,
  frequency tables and visual sequences.
- Diagrams flow through timed papers, ad-hoc rounds, topic practice and result review. Interactive
  models are also present in the relevant learning topics.
- Wrong answers or ambiguous choices were corrected in operations, equations, fractions,
  percentages, averages, graph gradients, probability, symmetry and angle generators.
- Colloquial Z/F/C angle terminology was removed from teaching and marking language.

## Remaining Specification Backlog

The following areas are missing or materially underrepresented and should be treated as the next
bank-expansion programme:

1. Number: factors, multiples, prime factorisation, HCF/LCM, standard form, roots and indices,
   systematic listing, broader fraction arithmetic and formal written methods.
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

`npm test` checks stimulus coverage, paper strand and visual constraints, calculator eligibility and
known mathematical regressions. `npm run test:ui` checks the main routes, visual interactions,
accessibility basics and desktop/mobile overflow. `npm run build` verifies the production client.
