# GCSE Study Desk: Agent Guide

## Product Goal

GCSE Study Desk helps teenagers prepare confidently for their AQA GCSE exams. It combines MathsMate for AQA GCSE Mathematics (8300, Foundation tier) and EnglishMate for AQA GCSE English Language (8700) in one focused revision product.

The app should help a learner answer three questions quickly:

1. What should I revise next?
2. Can I practise it in the same format as the real exam?
3. Can I understand what went wrong and improve the next attempt?

Teaching quality matters more than novelty. Explanations should be clear, encouraging and age-appropriate. Practice should reflect AQA paper structure, marks and timing. The AI tutors should guide students through a method before revealing an answer.

## Application Shape

This is one repository and one deployable Express process with two intentionally isolated React clients:

- `/` serves the subject selector in `selector/`.
- `/maths/*` serves the MathsMate React client from `clients/maths/`.
- `/english/*` serves the EnglishMate React client from `clients/english/`.
- `/api/maths/*` mounts the Maths API router.
- `/api/english/*` mounts the English API router.

The clients remain separate because their question formats, grading logic and global visual themes differ. Do not combine their CSS into one bundle without first scoping every global rule.

## Source Map

- `server/src/index.js`: combined host server, API mounts and static routing.
- `server/src/subjects/maths/`: generated question bank, exact marking, grades, progress and Maths tutor.
- `server/src/subjects/english/`: source texts, question assembly, rubric marking, grades, progress and English tutor.
- `clients/maths/src/pages/`: Maths dashboard, papers, results, topic lessons and tutor.
- `clients/english/src/pages/`: English dashboard, papers, results, lessons, text library and tutor.
- `selector/`: dependency-free root subject selector.
- `ui-tests/`: Playwright route, responsive and browser-error checks.

## Data And Progress

Maths and English progress must never be mixed. The JSON stores are created under:

- `${DATA_DIR}/maths/db.json`
- `${DATA_DIR}/english/db.json`

Each store tracks XP, streak, paper history, topic accuracy and tutor chat for its own subject. Docker sets `DATA_DIR=/app/data` and persists that directory in the `gcse-data` volume.

Active paper and practice sessions are held in memory. Restarting the server expires an active session. The app currently assumes one learner/profile and one Node process; authentication and multi-user storage are outside the current scope.

## Subject Rules

### Maths

- Course: AQA GCSE Mathematics 8300, Foundation tier, grades 1-5.
- Preserve all three papers and calculator rules.
- Automatic marking must use the existing generated question metadata.
- Higher-tier-only techniques should not be presented as Foundation requirements.

### English

- Course: AQA GCSE English Language 8700, grades 1-9; it has no tiers.
- Preserve both papers, source displays, marks and timing.
- List and true/false questions are marked deterministically.
- Extended responses use AQA-style rubric prompts through OpenRouter when configured.
- Without an API key, learners must still receive rubrics and model answers for self-marking.

## AI Configuration

`OPENROUTER_API_KEY` enables both tutors and English extended-answer marking. `OPENROUTER_MODEL` defaults to `deepseek/deepseek-v4-flash-0731`. Never commit keys or log them. Both subjects must retain useful offline behavior when no key is configured.

## Development

```bash
npm install
npm run dev       # server :3000, Maths Vite :5173, English Vite :5174
npm run build     # builds both subject clients
npm start         # serves selector and built clients on :3000
npm run test:ui   # requires the built app running on :3000
docker compose up --build
```

## Change Invariants

- Keep API routes namespaced by subject.
- Keep subject databases and browser storage keys separate.
- Keep `BrowserRouter` basenames and Vite bases aligned with `/maths` and `/english`.
- Preserve direct refreshes on nested routes such as `/maths/learn/fractions` and `/english/texts/p1-great-expectations`.
- Test desktop and 390px mobile layouts for the selector and both dashboards.
- Do not claim official AQA endorsement. AQA course structures can be represented accurately, but the product is an independent revision tool.
- Prefer small, testable changes over cross-subject abstractions that obscure exam-specific behavior.
