# GCSE Study Desk: Market Comparison and Growth Strategy

Research date: 1 September 2026

## Executive summary

GCSE Study Desk should not position itself as another revision-content library. Free and established products already win on breadth. Its best position is:

> The AQA revision desk that tells you what to do next, gives you realistic exam practice, explains the mistake, and brings it back at the right time until you can do it.

The product already has most of that loop for AQA Maths Foundation, Maths Higher and English Language: exam-date planning, lessons, generated practice, timed sessions, marking, progress, a mistake notebook, scheduled reviews, readiness indicators and an AI tutor. Few competitors foreground the complete plan-to-mastery loop.

The main risks are not a missing chatbot or a missing flashcard feature. They are incomplete specification coverage, only one exam board and two subject families, no durable production paper history, no commercial analytics, no payments, limited content provenance, and no parent or school distribution loop.

The recommended strategy is:

1. Finish and validate the current AQA promise before adding more subjects.
2. Make the mistake-to-mastery trail the main product and marketing proposition.
3. Launch a generous free product and a simple `£39.99/year` Plus plan, with `£5.99/month` and a seasonal exam-sprint option to test willingness to pay.
4. Acquire learners through search-friendly topic and question pages, useful free diagnostics, student creators, referrals and small school pilots, not broad paid advertising.
5. Add AQA Combined Science only after the current product reaches measurable activation and retention thresholds.
6. Treat the forecast as a set of validation gates. The base scenario reaches about 150,000 newly activated users, 3,504 year-end payers and `£140,160` gross annual billings in 2029, before VAT and operating costs.

## Scope and interpretation

The GCSE market is fragmented across public-service resources, free libraries, freemium apps, paid consumer subscriptions, tutors and school-funded homework platforms. It is not practical to enumerate every tutor, worksheet shop or small app. This review covers the major UK offerings that most directly compete for the same learner time or parent/school budget.

Public prices below were checked on official provider pages. Some suppliers reveal a price only after sign-in or quote individually; these are marked rather than estimated from old articles. Prices and product bundles can change.

## Current product

### Target user and current scope

- Independent GCSE learners, primarily Years 10 and 11.
- AQA Mathematics 8300 Foundation, grades 1-5.
- AQA Mathematics 8300H Higher, grades 4-9.
- AQA English Language 8700, grades 1-9.
- Responsive website plus Expo iOS and Android application sharing one API and Supabase backend.

### Implemented strengths

- Separate learner progress for Foundation Maths, Higher Maths and English.
- Searchable lessons, topic practice and recommended next steps.
- Ten-question diagnostic, quick practice and full-paper modes.
- Timed, resumable, server-created sessions.
- Deterministic Maths marking, worked answers and graph/diagram stimuli.
- English paper structures, deterministic objective marking, optional AI rubric feedback and model answers.
- Rolling seven-day plans based on weaker topics.
- Exam date, target grade and Foundation pass-mode preferences.
- Mistake notebook with reviews after 1, 3, 7 and 21 days.
- XP, streaks, topic accuracy, readiness, weekly summaries and retry routes.
- Subject-aware tutor with useful non-AI fallbacks.
- Account-synced plans and mistakes with authenticated, user-scoped storage.

### Current product limitations

- The Foundation audit explicitly does not claim complete one-to-one specification coverage and lists material gaps across all six strands.
- Only AQA is covered, and only Maths and English Language.
- Production Supabase does not durably retain paper history or tutor conversations.
- No billing, entitlements, trial, subscription, paywall or school procurement workflow exists.
- Product analytics are limited to Vercel Insights; there is no activation, retention, funnel or cohort event model.
- No parent account, teacher dashboard, class import, assignments or school reporting.
- Mobile release, physical-device QA, store setup and final legal/privacy review remain incomplete.
- Content credibility is not yet supported by public examiner/teacher authorship, an editorial methodology or outcomes evidence.

## Market map

### Direct consumer products

| Product | Current public consumer price | Relevant coverage and features | Competitive implication |
| --- | --- | --- | --- |
| Seneca | Unlimited free tier. Premium exists, but its current checkout price was not public. | Very broad subjects and boards, adaptive retrieval, rewards, exam questions, AI marking, Amelia tutor, parent and teacher reporting. Claims 14 million students. | Sets the free-tier, breadth and brand benchmark. Generic AI assistance is not enough to differentiate. |
| Cognito | Substantial free access. Pro price was not publicly verifiable. | 300+ courses, 15 subjects, 10 boards, videos, notes, quizzes, flashcards, exam questions, past papers, AI marking and progress. | Stronger instructional video and subject breadth. GCSE Study Desk needs a better guided exam workflow. |
| Save My Exams | Free account and partial resources. Live public membership price was unavailable. | Broad board-specific notes, topic questions, target tests, mock exams, flashcards and past papers. Claims over 2.5 million students per month. | The strongest content-library and organic-search competitor. Do not compete by merely adding more notes. |
| MME Premium | `£29/month`; `£149/year`, shown against a crossed-out `£348`, so the annual amount may be promotional. | 22 Maths, English and Science courses, timed past papers, AI long-answer marking, progress and large question banks. | Closest current feature and subject-scope competitor. Study Desk must be clearly better at planning, feedback and mistake recovery. |
| Tassomai Families | `£44.99/month` for Years 9-11 after a seven-day trial; 10% family discount. | Broad GCSE bundle, adaptive daily goals, AI tutor, exam timetable, parent dashboard and weekly reports. | Closest workflow competitor and evidence that parents pay for structured revision, but at a high price. |
| Quizlet Plus | UK App Store lists `£9.99` and `£44.99` in-app purchases, strongly indicating monthly and annual plans, though periods are not mapped in the listing. | User-generated flashcards, spaced learning, tests, AI study-material generation and a very large content network. | Strong mobile habit and low annual price, but weak guaranteed board alignment and variable content quality. |
| Knowunity | Free/ad-supported. UK page displayed `€69.99/year`; GBP price was not verified. | Community notes, AI companion, plans, mocks, quizzes, flashcards, homework scan, voice and offline use. | Strong mobile/community proposition; curated AQA correctness is an opportunity because community accuracy is not guaranteed. |
| Educake at Home | `£30/month` per child after seven days. | Personalised quizzes, parent reports and Science study guides; AQA English and Edexcel Maths in the consumer bundle. | Strong parent loop but expensive and quiz-led. |
| My GCSE Science | Free taster; `£24.95` Combined Science or `£49.90` Triple Science, one-off to 30 June 2027. | AQA, Edexcel and OCR Science, videos, exam questions and progress checking. | Demonstrates an attractive low-cost, exam-season access model for a narrow specialist course. |

### Free learner alternatives

| Product | Access model | Strength relative to GCSE Study Desk | Gap GCSE Study Desk can exploit |
| --- | --- | --- | --- |
| BBC Bitesize | Free public-service resource. | Trusted, broad, video-rich and available without payment. | Limited adaptive planning, realistic session management, mistake recovery and individual feedback. |
| Oak National Academy | Free, DfE-funded, no paywall. | Complete quality-assured lesson sequences across many subjects. | Curriculum delivery rather than a personal exam-preparation operating system. |
| Maths Genie | Free GCSE resources; premium toolkit price not public on the GCSE page. | Multiple Maths boards, past and predicted papers, videos, worksheets, tests and calculators. | Maths only and less integrated planning, tutoring and cross-subject progress. |
| Corbettmaths | Core site free; paid physical resources. | Huge volume of simple, accessible Maths videos, worksheets and 5-a-day practice. | No integrated adaptive account, English, tutor or paper-to-mistake workflow. |
| Physics & Maths Tutor | Free resource library supported by ads; separate paid tutoring/courses. | Broad notes, topic questions, past papers and strong search visibility. | Fragmented PDF/resource journey with limited personalisation and no integrated marking loop. |
| Dr Frost, individual | Core independent learner account is free. | Large multi-board Maths corpus, auto-marking, generators and worked videos. | Maths only; no integrated English or cross-subject personal revision desk. |

### School-funded products

| Product | Published school access or price | Principal strength | Implication |
| --- | --- | --- | --- |
| Dr Frost schools | `£650 + VAT` per UK school/year, unlimited users. | Maths assignments, class management, automatic marking, curriculum mapping and analytics. | A low-priced, mature benchmark makes a school product difficult without teacher workflows. |
| Educake schools | `£880 + VAT/year` for each of Science, English or Maths; `£550` for several other subjects; multi-subject discounts. | Board-mapped quiz banks, assignment and class analytics across multiple subjects. | Schools pay for teacher time saved and intervention data, not access to content alone. |
| Tassomai schools | Whole Years 7-11 advertised at no more than `£5/student` for two core subjects; selected cohorts can be up to `£15/student`. | Habit formation, adaptive homework and teacher/parent/leadership reporting. | A viable later benchmark, but only after Study Desk has class, assignment and safeguarding operations. |
| Sparx Maths | Quote-based. | Deep whole-school implementation and personalised compulsory homework. | Competes on implementation and teacher oversight, not only software features. |
| GCSEPod | Quote-based; app access normally requires a subscribing school. | 13,000+ mapped videos across 30+ subjects, assignments, parent visibility and teacher tooling. | Much broader multimedia and institutional distribution. |
| Cognito for Schools | Quote-based by school size and term. | Video estate plus progress tracking and lightweight rollout. | School distribution extends a strong free consumer funnel. |

## Feature comparison

`Strong` means the feature is central and publicly evident, `Some` means it exists but is narrower or less central, and `No/unclear` means it was not evident in the reviewed public proposition. This is not a claim that an internal feature does not exist.

| Capability | Study Desk | Seneca | Cognito | Save My Exams | MME | Tassomai | Quizlet | Free libraries |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AQA Maths Foundation/Higher | Strong | Strong | Strong | Strong | Strong | Strong | No/unclear | Varies |
| AQA English Language | Strong | Strong | Strong | Strong | Strong | Strong | No/unclear | Varies |
| Multiple boards | No | Strong | Strong | Strong | Strong | Strong | No | Varies |
| Broad GCSE subjects | No | Strong | Strong | Strong | Some | Strong | Generic | Varies |
| Full timed exam workflow | Strong | Some | Some | Strong | Strong | Some | Some | Static papers |
| Deterministic Maths marking | Strong | Strong | Strong | Some | Strong | Strong | No | Varies |
| AI written-answer feedback | Strong | Strong | Strong | Some/unclear | Strong | Some | Generic | No |
| Conversational tutor | Strong | Strong | No/unclear | No/unclear | No/unclear | Strong | Some | No |
| Personal study plan | Strong | Some | Some | Some | Some | Strong | No | No |
| Exam-date-aware schedule | Strong | No/unclear | No/unclear | No/unclear | No/unclear | Strong | No | No |
| Explicit mistake-to-retry notebook | Strong | No/unclear | No/unclear | No/unclear | No/unclear | No/unclear | No | No |
| Parent reporting | Printable summary only | Strong | No/unclear | Some | No/unclear | Strong | No | No |
| Teacher/class workflows | No | Strong | Strong | Some | Some | Strong | Strong | Some |
| Learner web and native mobile | Strong once released | Strong | Web-led | Strong | Web-led | Strong | Strong | Varies |

## Positioning and differentiation

### Recommended category

Use **personal GCSE revision desk** or **AQA revision coach**, not “learning platform” or “AI tutor.” The latter terms are broad and crowded.

### Product promise

The product should answer four questions on the first screen:

1. What should I revise today?
2. Why is this the right task for me?
3. What exactly did I get wrong?
4. When will I prove I can now do it?

### Defensible evidence trail

The most defensible experience is:

`exam date -> diagnostic -> daily mission -> authentic timed attempt -> transparent marking -> mistake reason -> scheduled retry -> later mastery`

Competitors provide many individual pieces, but few market the persistent trail as one product. Every feature should strengthen this trail. Avoid adding generic flashcards, social feeds or AI generation unless they improve a measured step in it.

### Claims to avoid

- Do not imply AQA endorsement.
- Do not present AI English feedback as an official mark or guaranteed grade.
- Do not claim complete specification coverage until a documented audit supports it.
- Do not call readiness a predicted grade without calibration against real outcomes.
- Do not claim learning impact from engagement metrics alone.

## Product roadmap

### Priority 0: make the current promise trustworthy, months 0-3

1. Close and test the documented Foundation specification backlog.
2. Produce equivalent public coverage audits for Higher Maths and English Language.
3. Add editorial metadata: specification reference, reviewer, last review date, source/marking rationale and issue-reporting route.
4. Persist full paper attempts, question-level responses, feedback and retry links in production. Define a retention/deletion policy rather than retaining tutor text by default.
5. Add product events for acquisition source, signup, diagnostic start/completion, first mission, first marked session, first saved mistake, retry, week-one return, paywall and purchase.
6. Define activation as completing a diagnostic and one marked study session within seven days. Track D1, D7, D30 and exam-season cohorts.
7. Finish production mobile release requirements, physical-device QA, accessibility, privacy, safeguarding and AI disclosures.
8. Improve onboarding so a learner chooses exam date, tier and target, then completes a short diagnostic before seeing a tailored plan.

Release gate: do not charge for “complete AQA revision” until coverage claims and production data durability are supportable.

### Priority 1: own the mistake-to-mastery loop, months 2-6

1. Ask learners to classify each error: knowledge, method, misread question, arithmetic, timing or incomplete explanation.
2. Show the original answer, marked issue, corrected method, next review and later retry evidence together.
3. Generate a short micro-practice set around each mistake before the scheduled retry.
4. For English, show assessment objective, indicative band, evidence from the response, uncertainty, one rewrite task and a before/after comparison.
5. Add a weekly “mistakes mastered” outcome rather than emphasising XP alone.
6. Send optional student-controlled reminders and weekly summaries. Add parent email sharing only with clear consent and age-appropriate privacy design.
7. Let learners export or print a revision evidence report for a teacher or parent without requiring a second account.

Success gate: at least 35% of activated learners return in week one, at least 25% save a mistake, and at least 30% of due mistakes receive a retry. These are initial product targets, not external benchmarks.

### Priority 2: improve learning depth, months 4-9

1. Add concise worked-example video or animated explanations only for topics where text/diagrams underperform.
2. Add real-paper navigation practice, timing allocation and a post-paper triage view.
3. Calibrate English feedback with double-marked examiner samples. Report agreement ranges and route uncertain answers to rubric-led self-review.
4. Add targeted accessibility improvements for diagrams, calculator notation, text scaling, keyboard navigation and screen readers.
5. Add past-paper links where licensing permits, while keeping original generated questions as the repeatable-practice advantage.
6. Add an AI usage budget, caching and safety monitoring before making unlimited AI a paid promise.

### Priority 3: expand only after retention, months 8-15

The next subject should be **AQA Combined Science**, because 2026 England had 951,510 entries, albeit double-counted because the qualification awards two GCSEs, and major competitors are strong in Science. It also supports more deterministic marking than English essays.

After Science, choose expansion from observed demand:

- English Literature if current English users show strong cross-sell intent; it had 620,420 England entries in 2026.
- Edexcel Maths if non-AQA demand is the main signup loss reason.
- Separate Sciences after Combined Science if existing users request them.

Do not launch many shallow subject shells. Breadth competitors already win that game.

### Priority 4: school channel, only after consumer proof

Start with teacher-shareable reports and a small pilot dashboard, then add:

- Teacher accounts and verified school domains.
- Class import, invitations and role/consent controls.
- Assignment setting and due dates.
- Question-, topic- and misconception-level class views.
- Intervention groups and export.
- Safeguarding, audit, data-processing and deletion administration.

A school licence is not merely a different price on the consumer app. It is a separate workflow and operational commitment.

## Pricing and monetisation

### Recommended launch architecture

| Tier | Suggested price | Purpose and proposed access |
| --- | --- | --- |
| Free | `£0` | All current subjects and core lessons, diagnostic, today plan, deterministic marking, mistake capture, limited custom/quick sessions and a small monthly AI allowance. It must be useful enough to earn trust against Seneca, Cognito and free libraries. |
| Plus monthly | `£5.99/month` | Unlimited generated practice and papers, richer history/analytics, unlimited plan customization, higher but fair-use AI feedback/tutor allowance, exports and advanced mistake review. |
| Plus annual | `£39.99/year` | Default and best-value plan. This sits near Quizlet’s indicated annual price and far below MME or Tassomai. Access should end cleanly after GCSEs rather than relying on accidental renewal. |
| Exam Sprint | Test `£14.99` for 90 days | Seasonal February-June offer for families unwilling to start an annual subscription. Test against annual, because it can cannibalise rather than add revenue. |
| Founding offer | Test `£29.99` first year | Limited cohort used to validate willingness to pay and collect structured feedback, not a permanent crossed-out-price promotion. |

Prices should be tested, not treated as facts. Show the full renewal price and end date clearly. Avoid a hard paywall: a median freemium app converts fewer users than a hard-paywall app, but a new GCSE brand needs free proof and organic distribution.

### What should remain free

- Specification access, core explanations and basic accessibility.
- A meaningful diagnostic and daily recommendation.
- Deterministic answer marking and basic worked solutions.
- Saving and correcting mistakes.
- Limited AI feedback with transparent quotas.

Charging for basic correctness or hiding all feedback would weaken trust and make free alternatives more attractive.

### What can credibly be paid

- Volume: unlimited generated papers, practice variants and AI-assisted reviews.
- Depth: complete attempt history, trends, advanced weak-area analysis and richer English feedback.
- Convenience: custom schedules, reminders, exports, cross-device continuation and offline packs where supported.
- Outcomes workflow: unlimited mistake micro-sets, review queues and exam-sprint programmes.
- Multi-user value later: parent summaries and school/class workflows.

### Additional future revenue

1. School licences: pilot at `£500-£750/year`; later test `£3-£5/student/year` with a minimum contract after teacher value is proven.
2. One-off examiner-reviewed English response packs or live group clinics. Keep human services operationally separate from AI feedback.
3. Ethical affiliate links for approved calculators or revision materials, clearly labelled and never allowed to influence learning recommendations.
4. Bursary-sponsored school access funded by employers, charities or local partners.

Do not use behavioural advertising in a product for teenagers. It would conflict with the current privacy posture and damage trust for limited likely revenue.

### Payment economics

- Apple Small Business Program: 15% commission while eligible and enrolled, subject to Apple’s terms and `US$1m` proceeds threshold.
- New UK Google Play subscription transactions: model 15% based on the 10% service fee plus 5% billing fee effective 30 June 2026, subject to implementation and programme terms.
- Stripe standard UK cards: 1.5% + 20p; Stripe Billing pay-as-you-go adds 0.7% of billing volume.
- A `£39.99` annual web subscription paid by standard UK card costs approximately `£1.08` in Stripe Payments plus Billing fees before VAT, refunds, disputes or tax tooling.

Web checkout has better unit economics, but native purchase implementation must comply with the current store rules in each territory.

## User acquisition plan

### Acquisition principles

- Optimise for an **activated learner**, not a visit, download or account.
- Make useful free learning pages indexable without exposing personal data.
- Build loops around a learner’s real result: diagnostic, marked answer, improvement and shareable progress.
- Concentrate acquisition from September to November and January to May; GCSE demand is seasonal.
- Do not buy scale until activation, retention and AI unit cost are known.

### Channel 1: topic and question search

Create high-quality public landing pages for specific intent, for example:

- “AQA GCSE Maths Foundation bounds questions.”
- “AQA English Language Paper 1 Question 5 feedback.”
- “Grade 4 Maths diagnostic.”
- “90-day AQA GCSE revision plan.”

Each page should contain a genuinely useful explanation or question, answer rationale, specification reference and a clear route into a diagnostic or retry set. Save My Exams, PMT and Maths Genie have strong search positions, so compete first on underserved mistake and feedback queries rather than broad “GCSE revision.”

### Channel 2: free diagnostic as the acquisition product

- Offer an ungated short diagnostic, then ask for an account to retain the plan and mistakes.
- Produce a specific result, not a generic score: strongest area, three priority skills and the first seven-day plan.
- Let learners share a privacy-safe result card.
- Build subject/tier landing pages around the diagnostic.

### Channel 3: student creators and worked-answer content

- Partner with small GCSE TikTok, YouTube and Instagram creators whose audiences match one subject and tier.
- Use examiner/teacher review for educational claims.
- Give each creator a diagnostic URL and measure activated users, not views.
- Prefer recurring worked-mistake series over one-off sponsorships.
- Pay only after testing organic fit; use fixed fees plus a capped activated-user bonus rather than commissions aimed at children.

### Channel 4: teacher-led consumer referrals

- Provide a free diagnostic link, printable class QR code and anonymous aggregate worksheet without requiring school procurement.
- Give teachers an exportable individual evidence report learners choose to share.
- Recruit 10-20 design-partner teachers before building a full dashboard.
- Ask teachers which intervention decision the report changes; do not build analytics nobody acts on.

### Channel 5: learner referrals

- Reward both learners with a time-limited Plus trial after the referred learner completes a marked session, not merely signs up.
- Use private codes or links, not a public follower system.
- Cap rewards and protect against duplicate accounts.

### Channel 6: app stores

- Treat App Store Optimization as capture of existing demand, not the main discovery engine.
- Use subject/tier screenshots that show the real workflow: today plan, timed question, feedback, mistake retry and mastery.
- Ask for reviews after a completed retry or paper, never after signup or a poor result.

### Paid acquisition rule

Do not scale paid social/search until:

- Acquisition source is captured reliably.
- At least 35% of activated users return in week one.
- Trial/paid conversion and refund rates are known by channel.
- Contribution after VAT, store/payment fees and AI costs exceeds customer acquisition cost with a safety margin.

At a `£39.99` annual price, broad paid acquisition is unlikely to work if first-year contribution is only around `£25-£30`. Organic, creator, referral and school-assisted distribution should remain primary.

## Market size and planning denominator

Ofqual’s provisional summer 2026 figures for England provide the safest current denominator:

- 718,143 people aged 16.
- 5,840,185 GCSE subject entries, which must not be mistaken for unique learners.
- 876,955 Mathematics entries.
- 844,455 English Language entries.
- 951,510 Combined Science entries, double-counted because it awards two GCSE grades.

The product can also serve Year 10 learners and resitters, while Wales and Northern Ireland add demand, but a precise harmonised UK unique-candidate total was not established. Forecasting from the 5.84 million subject-entry figure would overstate the user market by roughly eight times.

For context, 25.7% of England pupils were eligible for free school meals in January 2025. A generous free tier and funded access are commercially and socially important; it is unsafe to assume all families can pay.

## Three-year projection

### Definitions and formula

An **activated user** is a registered learner who completes a diagnostic and at least one marked session. Payers are modelled from activated users, not downloads.

```text
new payers = annual new activated users x free-to-paid conversion
year-end payers = new payers + prior-year payers x annual renewal
gross billings = year-end payers x realised annual price
net payment receipts = gross billings x (1 - blended payment/store fee)
```

This simplified model treats year-end payers as the billing base. A monthly cohort model will be required once actual purchase dates, plans, churn and VAT treatment are known.

### Assumptions

| Assumption | Conservative | Base | Upside |
| --- | ---: | ---: | ---: |
| New activated users, 2027 | 10,000 | 30,000 | 75,000 |
| New activated users, 2028 | 18,000 | 75,000 | 200,000 |
| New activated users, 2029 | 28,000 | 150,000 | 450,000 |
| Free-to-paid conversion | 1.0% | 2.0% | 4.0% |
| Annual renewal | 20% | 30% | 40% |
| Realised annual price | `£30` | `£40` | `£50` |
| Blended payment/store fees | 10% | 9% | 8% |

The conversion range is consistent with RevenueCat’s app-subscription data, where median freemium download-to-paid conversion was 2.18%. It remains only a directional benchmark: GCSE is seasonal, users age out, and registered activation is not the same denominator as app download.

### Outputs

| Scenario | Year | New payers | Year-end payers | Gross billings | Net after payment/store fees |
| --- | ---: | ---: | ---: | ---: | ---: |
| Conservative | 2027 | 100 | 100 | `£3,000` | `£2,700` |
| Conservative | 2028 | 180 | 200 | `£6,000` | `£5,400` |
| Conservative | 2029 | 280 | 320 | `£9,600` | `£8,640` |
| Base | 2027 | 600 | 600 | `£24,000` | `£21,840` |
| Base | 2028 | 1,500 | 1,680 | `£67,200` | `£61,152` |
| Base | 2029 | 3,000 | 3,504 | `£140,160` | `£127,546` |
| Upside | 2027 | 3,000 | 3,000 | `£150,000` | `£138,000` |
| Upside | 2028 | 8,000 | 9,200 | `£460,000` | `£423,200` |
| Upside | 2029 | 18,000 | 21,680 | `£1,084,000` | `£997,280` |

### Reality check

- Base 2029 activated users equal 20.9% of one England aged-16 cohort.
- Upside 2029 activated users equal 62.7%, which is unlikely without school distribution, major creator reach, search scale or significant Year 10 adoption.
- Base 2029 payers equal about 0.49% of the cohort.
- Upside 2029 payers equal about 3.0%.
- The base case is a demanding acquisition plan despite modest paid penetration.

These values are billings, not profit. They exclude VAT, AI inference, hosting, content/editorial work, salaries, support, safeguarding/compliance, refunds, failed payments, marketing and school-sales costs.

### Validation gates

Replace assumptions with observed data in this order:

1. Visitor to diagnostic start and completion.
2. Diagnostic completion to activation.
3. Activated learner D1, D7 and D30 retention by subject, tier and acquisition source.
4. Mistake saved, due and retried rates.
5. Paywall view to trial and paid conversion.
6. Monthly versus annual mix, refund, churn and renewal.
7. AI cost per activated free user and per payer.
8. Contribution margin and acquisition cost by channel.

## Twelve-month commercial plan

### Months 0-3: trust and measurement

- Finish current content audits and priority coverage gaps.
- Persist attempt history and define retention.
- Implement the event taxonomy and a weekly funnel dashboard.
- Complete production mobile and legal/privacy release work.
- Interview 20 students, 15 parents and 15 teachers using a working diagnostic and mistake flow.
- Recruit a small free beta; do not optimise paid conversion yet.

Target: 500 activated beta learners, enough to identify major activation and content problems rather than claim market fit.

### Months 3-6: retention and proposition

- Ship the stronger mistake-to-mastery workflow and English feedback evidence.
- Publish the first high-intent topic and diagnostic pages.
- Run creator and teacher referral pilots.
- Test weekly learner summaries and ethical reminders.
- Collect support reasons and first-session abandonment causes.

Target: 3,000 cumulative activated learners, 35% week-one activated-user retention and 30% due-mistake retry rate.

### Months 6-9: monetisation test

- Add entitlements and web billing with explicit free limits.
- Test `£39.99/year` against an exam-sprint offer without misleading discounts.
- Give existing beta users a clear founding offer and preserve their data.
- Measure conversion, refunds, AI usage and support before adding native subscriptions.

Target: 1.5-3% activated-to-paid conversion in tested cohorts, with positive first-year contribution before scaling paid acquisition.

### Months 9-12: repeatable acquisition

- Expand only the search pages and creator formats that produce retained activated users.
- Start 10-20 teacher design partnerships and 3-5 small school pilots.
- Decide whether retention supports AQA Combined Science investment.
- Build a monthly cohort forecast from actual data for the next exam season.

Target: one repeatable organic/referral channel where acquisition volume grows without worsening week-one retention, plus evidence for or against school distribution.

## Key decisions

### Do now

- Complete current AQA coverage and prove content quality.
- Persist learning evidence and instrument the funnel.
- Make mistake recovery the product’s centre.
- Launch free first, then test a low-friction annual plan.
- Grow through diagnostics, specific search intent, creators and teachers.

### Do later

- AQA Combined Science.
- Parent accounts beyond consented summaries.
- Full school dashboards and procurement.
- Additional boards based on measured lost demand.

### Do not prioritise

- A generic social feed.
- An uncurated user-content marketplace.
- Broad flashcards without a direct role in the mastery loop.
- More generic AI features before feedback quality is calibrated.
- Behavioural advertising.
- Many incomplete subject shells.

## Sources

All web sources were accessed 1 September 2026.

### Product and competitor sources

- GCSE Study Desk repository: `website/README.md`, `website/FOUNDATION_AUDIT.md`, `website/AGENTS.md`, `app/README.md`, `app/AGENTS.md`, `app/store/release-checklist.md`.
- Seneca: https://senecalearning.com/en-GB/ and https://senecalearning.com/en-gb/parents/
- Cognito: https://cognitoedu.org/ and https://cognitoedu.org/schools
- Save My Exams: https://www.savemyexams.com/ and https://www.savemyexams.com/about-us/
- MME Premium: https://mmerevise.co.uk/shop/online-gcse-courses/
- Tassomai families: https://www.tassomai.com/families
- Tassomai schools: https://www.tassomai.com/teachers
- Quizlet UK App Store: https://apps.apple.com/gb/app/quizlet-ai-powered-flashcards/id546473125
- Quizlet product limits: https://help.quizlet.com/hc/en-gb/articles/360030841732-Upgrading-your-Quizlet-account
- Knowunity: https://knowunity.co.uk/, https://knowunity.co.uk/pro-plan and https://knowunity.co.uk/legal/tos
- Educake: https://www.educake.co.uk/pricing/ and https://www.educake.co.uk/athome/
- My GCSE Science: https://www.my-gcsescience.com/pricing/
- BBC Bitesize: https://www.bbc.co.uk/bitesize/levels/z98jmp3
- Oak National Academy: https://www.thenational.academy/about-us/who-we-are
- Maths Genie: https://www.mathsgenie.co.uk/gcse.html
- Corbettmaths: https://corbettmaths.com/contents/ and https://corbettmaths.com/5-a-day/gcse/
- Physics & Maths Tutor: https://www.physicsandmathstutor.com/
- Dr Frost pricing: https://www.drfrost.org/pricing
- Sparx Maths: https://sparxmaths.com/
- GCSEPod: https://www.gcsepod.com/

### Market and benchmark sources

- Ofqual provisional summer 2026 GCSE entries: https://www.gov.uk/government/statistics/provisional-entries-for-gcse-as-and-a-level-summer-2026-exam-series/provisional-entries-for-gcse-as-and-a-level-summer-2026-exam-series
- DfE school pupils 2024/25: https://explore-education-statistics.service.gov.uk/find-statistics/school-pupils-and-their-characteristics/2024-25
- Sutton Trust private tuition polling, 2019: https://www.suttontrust.com/our-research/private-tuition-polling-2019/
- RevenueCat subscription app benchmarks, 2025: https://www.revenuecat.com/state-of-subscription-apps-2025/
- RevenueCat subscription app benchmarks, 2024: https://www.revenuecat.com/state-of-subscription-apps-2024/
- Apple Small Business Program: https://developer.apple.com/app-store/small-business-program/
- Google Play service fees: https://support.google.com/googleplay/android-developer/answer/112622?hl=en
- Stripe UK pricing: https://stripe.com/gb/pricing
