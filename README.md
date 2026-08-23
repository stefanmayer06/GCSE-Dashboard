# GCSE Study Desk

One revision dashboard for AQA GCSE Maths and English Language. A clean subject selector opens two complete, isolated study tools while one Express server handles deployment, APIs and persistent progress.

## Subjects

- **MathsMate**: AQA Mathematics 8300 Foundation, three papers, 1,730 generated questions, topic lessons, progress tracking and an AI tutor.
- **EnglishMate**: AQA English Language 8700, both papers, source-text library, skill lessons, AQA-style AI marking, progress tracking and an AI tutor.

Open `http://localhost:3000`, then choose Maths or English. Subject progress is stored separately, and your light or dark theme choice is remembered across the whole site.

## Quick Start

```bash
docker compose up --build
```

To enable AI tutoring and English extended-answer marking:

```bash
cp .env.example .env
# Add your OPENROUTER_API_KEY to .env
docker compose up --build
```

Both apps retain offline support when no key is configured.

## Development

```bash
npm install
npm run dev
```

- Combined server and production app: `http://localhost:3000`
- Maths Vite client: `http://localhost:5173/maths/`
- English Vite client: `http://localhost:5174/english/`

Build and verify:

```bash
npm run build
npm start
npm run test:ui
```

See `AGENTS.md` for architecture, educational goals and change invariants.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Subject selector |
| `/maths/*` | MathsMate client |
| `/english/*` | EnglishMate client |
| `/api/maths/*` | Maths API |
| `/api/english/*` | English API |

Progress is written to `${DATA_DIR}/maths/db.json` and `${DATA_DIR}/english/db.json`. Docker persists both beneath `/app/data`.
