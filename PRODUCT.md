# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

The primary users are independent Year 10 and Year 11 learners preparing for AQA GCSE exams. They use the product to decide what to revise next, practise under realistic conditions, understand mistakes, and return to weak material until it is secure.

Parents and teachers are secondary audiences for evaluation, feedback, and future product development. The current product does not provide parent, teacher, or class-management workflows.

## Product Purpose

GCSE Study Desk is a revision coach for AQA GCSE Maths Foundation, Maths Higher, and English Language. It gives learners one place to plan revision, complete exam-style work, receive transparent marking or feedback, record why an answer went wrong, and retry it on a schedule.

Success means a learner can move from uncertainty about what to do next to a completed, reviewable revision session, then turn identified mistakes into demonstrated mastery. A readiness score supports this process but is not a predicted grade.

## Positioning

GCSE Study Desk is a personal AQA revision desk, not an AI tutor or a generic learning platform. Its defining mechanism is a continuous mistake-to-mastery loop:

`exam date -> diagnostic -> daily mission -> timed attempt -> transparent marking -> mistake reason -> scheduled retry -> mastery`

The combination of exam-date-aware planning, subject-specific practice, explicit mistake diagnosis, and scheduled retries is the product's core position. Question-bank breadth and AI-assisted features support this mechanism rather than define the category.

## Operating Context

- Learners begin from a subject selector and work within Maths Foundation, Maths Higher, or English Language.
- A typical cycle includes setting an exam date and target, taking a diagnostic, following a seven-day plan or daily mission, completing lessons, practice, or papers, reviewing results, and revisiting mistakes after 1, 3, 7, and 21 days.
- Maths work uses deterministic marking and worked solutions. English work uses AQA-aligned rubrics and feedback, with AI assistance where configured and a non-AI fallback.
- Accounts, progress, attempts, plans, mistakes, and retries persist through a shared Express and Supabase backend. User and subject scopes remain explicit.
- The responsive website is the current beta focus. The same product also has pre-release iOS and Android clients built with Expo.

## Capabilities and Constraints

- Supported subjects are AQA GCSE Maths Foundation (8300), Maths Higher (8300H), and English Language (8700).
- Implemented learner capabilities include authentication, diagnostics, seven-day plans, daily missions, lessons, question practice, timed and resumable papers, marking and worked solutions, XP and streaks, readiness, a mistake notebook, scheduled retries, weekly summaries, and feedback submission.
- English AI feedback is guidance, not an official mark or grade. The product must not imply AQA endorsement.
- The product must not claim complete specification coverage, guaranteed outcomes, grade improvements, examiner credentials, or production capabilities that are not evidenced.
- Current roles are `student` and `admin`. Parent and teacher dashboards, classes, billing, entitlements, multiple exam boards, and additional subjects are not implemented.
- Public application writes are restricted to authentication and rate-limited feedback; user data is protected by Supabase Row Level Security. Service credentials must never reach clients.
- Durable terminology includes diagnostic, mission, seven-day plan, practice, paper, mistake notebook, error type, retry, mastery, and readiness score. Use UK English, including "Maths" and "revision".
- Commercial model, paid-tier timing, production domain, monitored support address, legal owner details, and mobile release timing remain open decisions. Current public framing is a free beta and must not be replaced with unimplemented pricing or availability claims.

## Brand Commitments

- The product name is GCSE Study Desk, with MathsMate and EnglishMate used as subject identities in the current clients.
- The creator's honest, independent origin is part of the product story; language should remain direct, useful, and transparent rather than institutional or inflated.
- Describe content as AQA-style or aligned to the AQA specification. Never present GCSE Study Desk as endorsed by AQA.
- Preserve the distinction between transparent product evidence and marketing claims. Do not invent testimonials, customer logos, attainment results, benchmarks, or credentials.

## Evidence on Hand

- The Foundation question bank currently contains 1,730 generated questions; keep public quantity claims synchronized with the relevant health endpoint and content source.
- Higher Maths generators include graph stimuli and grade-boundary support. English includes source texts, exemplars, topic lessons, and both papers.
- Coverage and quality evidence is documented in `website/FOUNDATION_AUDIT.md`, `website/HIGHER_AUDIT.md`, and `website/ENGLISH_AUDIT.md`.
- Product behavior is covered by server tests and the learner-loop Playwright suite at `website/ui-tests/app.spec.js`.
- The product icon source is `app/assets/icon-source.svg`. Public privacy, support, account-deletion, and feedback pages are implemented under `website/selector/` and `website/public/`.
- `MARKET_COMPARISON.md`, `BETA_POSTING_PLAN.md`, and `website/ANALYTICS.md` contain current category research, beta goals, event definitions, and the activation definition.
- There are no approved testimonials, attainment outcomes, examiner endorsements, customer logos, or paid-plan entitlements. Store and legal drafts still contain owner-controlled placeholders that must not be published as facts.

## Product Principles

1. Close the loop: every meaningful mistake should lead to explanation, classification, a scheduled retry, and evidence of mastery.
2. Make the next useful action obvious: planning, readiness, and missions should reduce revision uncertainty rather than add administration.
3. Earn trust through transparency: show how work is marked, distinguish guidance from grades, and keep every claim within the available evidence.
4. Respect subject reality: preserve exam-board, qualification, tier, paper, topic, and learner boundaries throughout content, data, and workflows.
5. Support independent progress: build for a learner completing real revision without requiring a parent, teacher, class, or paid gate.

## Accessibility & Inclusion

- The product serves learners aged 13 and over and must remain usable across desktop and mobile-sized screens.
- Preserve semantic structure, keyboard-visible focus states, reduced-motion support, accessible names, live status announcements, and light/dark theme parity already established on the web.
- Do not rely on colour alone to communicate subject, state, correctness, readiness, or progress.
- Mobile accessibility has not yet received a dedicated audit and remains an explicit verification need before public native release.
