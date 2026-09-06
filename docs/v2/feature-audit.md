# Version 2 discovery and preservation register

Audited 6 September 2026 from clean develop; implementation branch: 2.0.

## Customer and product truth
Independent AQA GCSE revision for primarily 14–16 year olds, also resit learners. Mathematics Foundation (8300, grades 1–5), Higher (8300H, grades 4–9), English Language (8700, no tier). Learners need a credible next action, authentic marking, manageable practice and a way back from errors. Avoid punishment, assumed learning styles, fabricated mastery or claims of official endorsement.

## Traced architecture
`website/server/src/app.js` composes Express auth, subject routers, personal data and static clients. BrowserRouter/Vite keep /maths, /maths-higher, /english basenames. Two clients have different exam runners; keep subject CSS bundles isolated. Expo Router in app uses the same subject API via src/api.ts with bearer JWT refresh. JSON storage is local only; production Supabase remains authoritative. No Neon integration, subscriptions or payment flows found. AI is OpenRouter server-side; no client credentials. Extended English marking must preserve self-assessment when AI is unavailable.

`App.jsx` authenticates then loads progress/health. Dashboard hydrates topics and shared StudyDashboard -> hydratePersonal -> GET personal -> preferences/plan/mistakes. Lessons create server practice sessions, check answers, submit and merge mistakes/mission evidence. Papers create server sessions, keep local answer drafts, check session status on resume, submit for marking, save durable attempts and navigate to Results. Results rehydrate durable attempts; mistakes preserve retry history. Chat history is disposable. Analytics payloads remain scalar and content-free. Active sessions persist server-side, but answer drafts and exact screen context are device-local: no unsupported cross-device-resume claim.

## Feature register and destination
| Existing capability | Decision | V2 destination / retained contract |
|---|---|---|
| Public landing, subjects, course guides, FAQs | Redesign | Public site, subject selection and existing SEO URLs |
| Privacy, support, beta feedback, deletion | Retain / relocate | Public footer and account settings |
| Local username/password and signup | Redesign | Shared web sign-in gate |
| Supabase email/password, confirmation | Redesign | Web gate / native auth routes |
| Optional OAuth and legacy claim | Retain | Web gate; native legacy claim |
| Native password reset/deep link | Retain | /auth/forgot and /auth/recover |
| Logout, cache and draft clearing | Retain | Account controls |
| Subject switching, isolated tiers | Improve | Persistent subject selector |
| Appearance, account, server preferences | Improve | Settings; same theme terminology |
| Exam date, target grade, Foundation pass mode | Redesign | Brief onboarding and editable plan/settings |
| Diagnostic, 10 mixed questions | Retain / surface | Today primary new-learner action; Practice |
| Saved Monday–Sunday missions | Redesign | Today; preserve today-only completion and evidence |
| Full / short Maths papers 1–3 | Retain | Practice; calculator rules, exact marking |
| Full / short English papers 1–2 | Retain | Practice; source pairs, timing, Q5 image, rubric/self-marking |
| Mixed questions, count/source choices | Rename / retain | Mixed practice in Practice |
| Active-paper resume/discard, confirmation | Retain | Practice draft/session recovery |
| Question navigation, timer, answer checks | Improve | Focused study canvas |
| Topic notes, examples, formulas, visuals | Redesign | Learn -> lesson; retain all authored teaching |
| Lesson quizzes and completion | Retain | Understand -> Practice -> Feedback |
| External resources, editorial provenance | Retain | Lesson supporting material |
| English text library and line-numbered sources | Merge navigation | Learn; existing /texts routes remain |
| AI tutors, suggestions, reset, Markdown | Improve | Tutor; contextual explanation prompts |
| Results, marking, worked methods, grade guides | Redesign | Reflect / results, full question review |
| Durable paper history | Surface | Reflect / results; existing retention unchanged |
| Weak topics and strand accuracy | Improve | Topic map and actionable study links |
| Mistake capture/classification and warm-up | Redesign | Reflect -> mistake notebook |
| Scheduled retries, mastery, next review | Retain | Notebook, surfaced from Today |
| Weekly summary, print/share where available | Retain | Reflect |
| XP, levels, streak and expertise milestones | Relocate | Progress context, not main learning objective |
| API error/loading/offline recovery | Improve | Shared accessible states and retry controls |
| Native secure auth, offline session cache | Retain | Providers, SecureStore, query lifecycle |
| Native gestures/back, tablet layout, pull refresh | Retain / improve | Platform-native routes and controls |

No standalone flashcard/deck authoring, subscription checkout or universal search existed. Do not imply flashcards or payment features were removed.

## Discovery defects and limits
- resource-cache defines refresh but omits it from returned state; callers cannot retry.
- web onboarding closes after first exam-date save and references undeclared api in final event.
- web and native readiness definitions diverge; unify educational interpretation where evidence permits.
- Personal writes use optimistic state without rollback in parts of V1; failure must remain visible.
- Exact answer drafts are not synchronized across devices by existing endpoints.
- Remote auth delivery, production RLS and physical-device behavior need credentials/device validation, not simulated claims.
