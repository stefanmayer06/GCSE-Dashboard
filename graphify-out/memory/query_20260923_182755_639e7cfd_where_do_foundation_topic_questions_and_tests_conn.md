---
type: "query"
date: "2026-09-23T18:27:55.032890+00:00"
question: "Where do Foundation topic questions and tests connect in the project?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["bank/topics.js", "maths/bank/index.js", "foundation-bank.test.js"]
---

# Q: Where do Foundation topic questions and tests connect in the project?

## Answer

Expanded from graph vocabulary: foundation question generator maths bank test number. The topic registry in website/server/src/subjects/maths/bank/topics.js feeds loadBank in website/server/src/subjects/maths/bank/index.js, which loads generator modules from q and is verified by website/server/test/foundation-bank.test.js. Confirmed against current files on 2026-09-23.

## Outcome

- Signal: useful

## Source Nodes

- bank/topics.js
- maths/bank/index.js
- foundation-bank.test.js