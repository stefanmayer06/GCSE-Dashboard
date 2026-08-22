# MathsMate — AQA GCSE Foundation Maths Dashboard

A training dashboard for AQA GCSE Foundation Maths (grades 1–5): realistic practice papers, a
1,700+ question bank, a full learning section with free external resources, and an AI maths tutor
powered by a cheap DeepSeek model on OpenRouter.

## Features

### 🧪 Practice exams
- **1,730-question bank**, procedurally generated across all 27 AQA foundation topics.
- **All three AQA papers**, each built with AQA's published per-paper topic allocation:
  - **8300/1F · Paper 1** (non-calculator): Number 25%, Algebra 25%, Ratio 20%, Probability 14%, Statistics 16% — no geometry.
  - **8300/2F · Paper 2** (calculator): Algebra 25%, Ratio 20%, Geometry 30%, Probability 12%, Statistics 13%.
  - **8300/3F · Paper 3** (calculator): Number 25%, Ratio 20%, Geometry 30%, Probability 12%, Statistics 13%.
- Every paper is **fresh each time**, has a **difficulty ramp** (easier questions first, stretch ⚡ at the
  end) and comes in **Full** (80 marks / 90 min) and **Quick** (40 marks / 45 min) sizes.
- **Two timers**: a paper countdown plus a **1 mark-per-minute pace timer** with per-question time targets.
- **Instant marking** with a score, a **predicted grade** from averaged past AQA grade boundaries
  (2018–2024, shown on the results page), strand-by-strand breakdown, worked solutions for every
  missed question, and links to internal lessons + free external resources (Corbettmaths, Maths
  Genie, BBC Bitesize, Khan Academy) for your weakest topics.

### 🎲 Ad-hoc questions
- Mixed rounds of 10/15/20 questions drawn from **any combination of the three papers** (or all
  three at once) — instant feedback per question with worked solutions and a score at the end.

### 📚 Learn
- All 27 foundation topics grouped by strand, with bite-size revision notes, formula cards,
  worked examples, and quick 5-question drills with instant feedback.
- Per-topic accuracy tracked from your practice and papers.
- Free external resources for every topic.

### 🤖 AI Tutor
- Chat with **DeepSeek V4 Flash** (`deepseek/deepseek-v4-flash-0731`) via OpenRouter — one of the
  cheapest models available. The tutor is prompted to be Socratic: hints before answers, always
  foundation-tier appropriate.
- Swap the model with `OPENROUTER_MODEL` (any OpenRouter model id).
- No API key? The app still runs — the tutor falls back to a built-in offline revision helper.

### 🎮 Progress
XP, levels, a daily streak and a recent-papers chart keep training motivating.

## Quick start (Docker)

```bash
docker compose up --build
# open http://localhost:3000
```

For the live AI tutor, add your OpenRouter key (free account, pay-per-use at
https://openrouter.ai/keys):

```bash
echo "OPENROUTER_API_KEY=sk-or-..." > .env
docker compose up --build
```

Run without Docker Compose:

```bash
docker build -t maths-dashboard .
docker run -p 3000:3000 -e OPENROUTER_API_KEY=sk-or-... maths-dashboard
```

## Development

```bash
npm install
npm run dev          # server on :3000, client (Vite) on :5173
npm run build        # build the client
npm start            # production-style: serve everything on :3000
```

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | (empty) | OpenRouter key for the AI tutor. Empty = offline tutor mode. |
| `OPENROUTER_MODEL` | `deepseek/deepseek-v4-flash-0731` | Any OpenRouter model id. |
| `PORT` | `3000` | Server port. |
| `DATA_DIR` | `server/data` | Where progress/history is stored (JSON). |

## How the question bank works

Questions live in `server/src/bank/q/*.js` — 27 generator modules, one per AQA foundation topic.
Each generator deterministically produces dozens of exam-style variants (numeric-entry and AQA-style
multiple-choice) with marks, difficulty, hints and worked solutions. On startup the server expands
them into a 1,730-question in-memory bank.

Papers are assembled in `server/src/bank/index.js`: each of the three papers samples the topics
AQA assigns to it (Paper 1 = N/A/R/P/S, Paper 2 = A/R/G/P/S, Paper 3 = N/R/G/P/S) using the
per-paper mark budgets above, reserves ~12% of marks for stretch questions, then orders the paper
as a difficulty ramp (level 1 → 2 → 3). Ad-hoc rounds mix questions from any subset of the papers.

Grade boundaries in `server/src/grades.js` are rounded averages of published AQA 8300F boundaries
from 2018–2024 for a single 80-mark paper (foundation is capped at grade 5). Real boundaries drift
a few marks per series — treat the prediction as guidance.

## Structure

```
client/   React (Vite) front end — dashboard, exam runner, results, learn, chat
server/   Express API — question bank, paper builder, marking, grade prediction, chat proxy
  src/bank/q/      27 per-topic question generators
  src/bank/topics.js  topic metadata, notes & resources
```

## Tech

- **Front end:** React 18 + React Router (Vite build, no other heavy deps)
- **Back end:** Node + Express, JSON-file persistence (no database to run)
- **AI:** OpenRouter chat completions API (DeepSeek by default)
- **Deploy:** multi-stage Docker image (~small, Alpine-based)
