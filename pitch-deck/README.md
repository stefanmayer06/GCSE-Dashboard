# GCSE Study Desk seed deck

The seed-round deck for GCSE Study Desk, built in the Circuit look of the public
site (Unbounded, Atkinson Hyperlegible Next and Mono, night `#191b30`, paper
`#f2f3fa`, volt `#c3f53c`).

- **Live deck:** https://claude.ai/artifact/VqjmUNa81q56ugWbEfsWRM (private until
  you share it from the deck's Share menu; export to PDF or PowerPoint from there)
- **Source:** `project/deck.json` (slide order and fonts) and one
  `project/slides/<id>.html` per slide
- **Art:** `assets/` holds the hero, subject scenes, logo mark and Pip, rendered
  at 2x from `website/selector/art.js` with reduced motion. Product screens come
  from `website/design/shots/`.

## Slide order

| # | Slide | Job |
| --- | --- | --- |
| 1 | Cover | Name, promise and round |
| 2 | High stakes, unequal help | The problem, with four sourced numbers |
| 3 | Our insight | The one sentence to remember |
| 4 | One loop from exam date to mastery | The mechanism as one diagram |
| 5 | Every topic is a level to replay | Course map and explainer screens |
| 6 | Every mistake gets a retry date | Timed paper and the mistake notebook |
| 7 | Three AQA courses, live in beta | What is already built |
| 8 | Beta traction to date | Funnel metrics (fill in) |
| 9 | Three shifts open this market now | Why now |
| 10 | Beachhead: 837k AQA results a year | Market size, bottom-up |
| 11 | Comparable companies show the path | Market validation |
| 12 | Free to start, paid for the routine | Business model hypotheses |
| 13 | Go-to-market follows the exam year | First audience, calendar, channels |
| 14 | How learners revise today | Competition |
| 15 | What the seed unlocks in 18 months | Roadmap and milestones |
| 16 | Founder-built from day one | Team and first hires |
| 17 | Raising £[__] to scale the loop | The ask |
| 18 | Sources | Every figure, linked |

## Fill in before sending

Every bracketed `[__]` is a figure or name only you can supply. Nothing in the
deck invents traction, quotes, prices or results.

- **Slide 8, traction.** Sign-ups since launch, week-one activation, day-7
  return and mistakes scheduled for retry. `npm run acquisition:report -- 90`
  in `website/` (with production credentials, privately) gives the first three.
  Add a quote only with written permission from the learner or parent.
- **Slide 10, market.** The revenue illustration once a price is chosen.
- **Slide 12, business model.** Family plan and exam-pass prices after the
  interviews described in `website/GO_TO_MARKET.md`.
- **Slide 15, roadmap.** Milestone targets and the next subject.
- **Slide 16, team.** Your photo (the empty frame; click it in the editor to
  add an image), your story, relevant experience and any advisers. Check the
  founder name.
- **Slide 17, the ask.** Amount, use-of-funds split, target date, runway and
  your contact details. Swap the demo link if you move to a custom domain.

## How the structure was chosen

The deck follows the arc the best-known seed decks share, with one idea per
slide and a specific number early:

- **Airbnb (2009):** problem, solution, market validation, market size,
  product, business model, competition, team, ask. Its "market validation"
  slide used comparable companies' numbers; slide 11 does the same with
  Seneca, Atom Learning, Knowunity and Quizlet.
- **Sequoia's business-plan outline:** adds "why now" (slide 9) and a
  bottom-up market (slide 10).
- **Y Combinator's seed-deck advice:** a clear unique insight (slide 3) and
  slides that are legible, simple and obvious at a glance.
- **LinkedIn (2004):** one diagram for the compounding mechanism; here, the
  mistake-to-mastery loop (slide 4).
- **Duolingo (Series A, Union Square Ventures, 2011):** free for learners,
  with a separate way to earn; here, a free path plus a paid routine (slide 12).
- **Quizlet (started by a 15-year-old, bootstrapped for ten years, then a
  $12m Series A in 2015):** the founder's own story as evidence of insight;
  slide 16 leaves room for yours.

## Sources

1. [JCQ, summer 2026 results press notice](https://www.jcq.org.uk/wp-content/uploads/sites/2/2026/08/JCQ-2026-Level-1_2-Press-Notice.pdf): 1,130,316 GCSE students; 6,199,256 entries.
2. [Ofqual, Qualification results in England: summer 2026](https://www.gov.uk/government/publications/qualification-results-in-england-summer-2026/qualification-results-in-england-summer-2026).
3. [Ofqual, Annual qualifications market report 2023/24](https://www.gov.uk/government/statistics/annual-qualifications-market-report-academic-year-2023-to-2024/annual-qualifications-market-report-academic-year-2023-to-2024), Table 11: AQA 622,995 English Language and 213,790 Maths certificates; Pearson 544,565 Maths.
4. [Ofqual, Provisional November 2025 entries](https://www.gov.uk/government/statistics/provisional-november-2025-exam-entries-gcse-english-language-and-mathematics): 82,900 English (+7.7%); 78,580 Maths (+3.9%).
5. [DfE, 16 to 19 funding: maths and English condition of funding](https://www.gov.uk/guidance/16-to-19-funding-maths-and-english-condition-of-funding).
6. [Sutton Trust, Private Tutoring 2026](https://www.suttontrust.com/our-research/private-tutoring-2026/): 29% overall (18% twenty years earlier); London 45% vs 27% elsewhere in England; best-off 30% vs worst-off 23%.
7. [Oxford University Press survey, October 2025](https://www.edtechinnovationhub.com/news/eight-in-ten-young-people-in-the-uk-are-using-ai-tools-for-their-schoolwork-oup-study-finds): 8 in 10 UK students aged 13–18 use AI tools in schoolwork.
8. [Tutorperch, UK Private Tutoring Rate Report 2026](https://tutorperch.com/research/uk-tuition-rate-report-2026): GCSE Maths tutors £25–£40 an hour (archive-based data; nominal prices).
9. [GoStudent on Seneca Learning, 2022](https://www.gostudent.org/en-gb/press-releases/gostudent-expands-through-acquisitions-of-seneca-learning-and-tus-media-group/) · [UKTN on Atom Learning, 2021](https://www.uktech.news/education/atom-learning-london-edtech-funding-20211210) · [Tech.eu on Knowunity, 2025](https://tech.eu/2025/06/13/knowunity-raises-eur27m-to-bring-ai-tutor-to-1-billion-students/) · [EdSurge on Quizlet, 2015](https://www.edsurge.com/news/2015-11-23-bootstrapped-since-2005-quizlet-raises-12-million-to-reach-1-billion-learners).
10. Product figures: the live course health endpoints (1,850 Foundation and 2,810 Higher questions) and the public site, 29 September 2026.
