# GCSE Study Desk 2.0 — implementation and verification

Implementation branch: `2.0`. The production branch and backend schemas are unchanged. This is an implemented frontend generation with local regression evidence, not production launch certification. Remaining release validation and parity limits are explicit below.

## Product architecture

The learning studio organises the product around **Today → Learn → Practice → Reflect → Tutor**. These are shared concepts across browser and native, with a desktop navigation rail, mobile-web bottom navigation, and native tabs.

- **Today** answers what to do next: diagnostic for learners without evidence, a saved daily mission for returning learners, due mistakes, topic suggestions and paper practice. Optional web setup and the week plan expand on demand. Rewards follow useful learning actions.
- **Learn** is a searchable topic evidence map, separated into curriculum areas. Learners can filter for topics needing attention, topics not practised and strong topics. Lessons connect reading, retrieval and practice without losing authored content or interactive visuals.
- **Practice** retains the subject-specific paper runners, mixed questions, diagnostics, timers, draft recovery and marking. Focus mode on web reduces surrounding navigation.
- **Reflect** brings mistakes, scheduled retries, marked papers, weekly summaries and topic evidence together. Detailed web statistics remain available rather than disappearing during navigation changes.
- **Tutor** retains the real server AI integration, adds contextual explanation prompts on web and uses learner-facing language. Suggestions populate a draft; they do not silently send it.

The audience remains independent AQA GCSE learners, primarily ages 14–16 and resit learners. Foundation, Higher and English retain explicit course context, content, marking and account isolation. Learning claims describe answer evidence; readiness is not a predicted grade.

## Existing features and destinations

The complete preservation register is [feature-audit.md](feature-audit.md), including retain/redesign/merge/relocate decisions and backend flows. It covers public guides, both auth models, account recovery, course selection, preferences, diagnostics, weekly plans, every paper family, mixed questions, drafts, timers, visuals, lessons, sources, tutors, results, mistakes, spaced retries, progress, rewards, offline cache and account controls.

Important retained routes:

| Capability | Web (relative to course basename) | Native |
|---|---|---|
| Personal learning home | `/` | Today tab |
| Topic discovery | `/learn` | Learn tab |
| Topic lesson and quiz | `/learn/:id` | `/lesson/[id]` |
| Papers, mixed questions, diagnostic | `/practice` and existing exam routes | Practice tab and existing practice routes |
| Reflection hub | `/reflect` | Reflect tab |
| Mistake notebook / due reviews | `/notebook` | `/notebook` |
| Weekly reflection | `/summary` | `/weekly-summary` |
| Marked papers | `/results`, existing result routes | `/history`, `/results/[id]` |
| Detailed subject statistics | `/insights` | Today evidence, Learn map, weekly summary |
| AI tutor | `/chat` | Tutor tab |
| English source library | `/texts`, existing text detail routes | Existing text library and `/text/[id]` |
| Search | `/search`, Ctrl/Cmd+K | `/search` |
| Profile, goals, appearance, support, logout | `/settings` | `/settings` |
| Password recovery | Sign-in recovery request and recovery state | `/auth/forgot`, `/auth/recover` |

Course basenames remain `/maths`, `/maths-higher` and `/english`. Public course guides retain their existing SEO addresses. No standalone flashcard authoring or payment/subscription product existed to migrate.

## Added or substantially improved experiences

| Change | Learning purpose |
|---|---|
| Action-first home and diagnostic entry | Reduces the decision burden before the first study session. |
| Evidence map with explicit filters | Helps learners choose where practice is useful; distinguishes lesson completion from answer accuracy. |
| Retrieval prompts and lesson journey | Encourages recalling an idea before rereading, then testing it. |
| Shared Reflect destination | Makes incorrect answers and saved feedback useful material for the next session. |
| Search across topics, tools, English texts and mistake prompts | Makes previously buried material discoverable. It is not exhaustive search of past conversations or all attempts. |
| Contextual tutor drafts and explanation choices | Makes an explanation specific to the current learning task. |
| Web focus mode, keyboard search and Escape | Supports concentrated desktop study and efficient navigation. |
| Native durable attempt history | Lets users reopen server-saved feedback, rather than depending solely on the device's latest result. |
| Explicit saved preferences and recovery errors | Gives users truthful feedback when their goals or plan cannot be saved. |
| Web Supabase password recovery | Provides a route back into the same account without relying on native recovery. |

Spaced mistake retries, diagnostics and weekly plans already existed. V2 surfaces and repairs them; it does not claim a new validated adaptive algorithm, confidence-based scheduling or automatic exam-date optimisation.

## Design system

[DESIGN.md](../../DESIGN.md) records the actual system. [direction.md](direction.md) records the product direction. Shared source tokens live in `design-tokens/studio.json`; `node scripts/sync-studio-tokens.mjs` generates web CSS and native TypeScript.

- Separate light and dark green-neutral palettes, with semantic positive, warning, negative and information states.
- Locally bundled DM Sans and Fraunces with licences. Sans serves reading and controls; serif provides learning invitations.
- Shared spacing anchors, 8px control and 14px surface radii, restrained borders and flat working surfaces.
- 120ms/180ms motion guidance and reduced-motion web rules.
- Shared button, field, navigation, topic, lesson, progress and feedback patterns; loading, empty, error and offline states.
- Web and native retain platform-specific layouts and some compatibility styles around complex exam content. Native primary actions retain subject accents; web primary actions use teal.

## Accessibility

Changes include visible focus, skip navigation, labelled controls, dialog keyboard behaviour, status/error announcements, named progress indicators, tutor live output, non-colour topic states and large touch controls. Shared targets are 44px web and 48px native. Web responsive behaviour was exercised on desktop, tablet and narrow viewports.

Native large text revealed an overly narrow Today heading. The header and course controls now reflow above the normal font scale; display headings use a limited multiplier while body text continues to scale. The corrected Today heading was inspected at the largest iOS accessibility text setting, and the original text setting restored. This is a focused check, not a claim that every native screen has passed large-text QA.

Automated axe checks pass on eight core web routes in light and dark themes using WCAG 2 A/AA, 2.1 AA and 2.2 AA tags. Automated coverage cannot establish full WCAG 2.2 AA compliance. Actual VoiceOver/TalkBack, native tablet and complete large-text journey testing remain release checks.

## Web/mobile parity

| Core capability | Status |
|---|---|
| Same authenticated account, course APIs and stored progress | Shared production account/data model retained. Live cross-device production verification still required. |
| Lessons, topic practice, diagnostics and papers | Available on both; subject-specific execution retained. |
| English sources and rubric/self-marking | Available on both. |
| AI tutor | Available on both; web has the richer new contextual explanation controls. |
| Mistakes, scheduled reviews and weekly plans | Available on both; new native plans use calendar weeks and preserve valid existing rolling plans. |
| Saved paper feedback | Web results and new native history use durable attempts. |
| Topic evidence, weekly reflection and goals | Available on both; desktop statistics and expertise presentation remain richer. |
| Search and appearance | Available on both, with platform-appropriate navigation. |
| Exact unfinished answers across devices | **Not supported** by existing draft storage. Durable results/plans sync; exact in-progress answer drafts remain device-local. |
| Public SEO pages, browser printing and optional web OAuth | Web-specific presentation/integration retained; native password auth remains the primary native route. |

Core study capabilities are present on both platforms. Identical depth of analytics, onboarding and contextual tutor controls is not yet achieved; this report does not label those remaining presentation differences as complete parity.

## Engineering changes

- Shared web V2 shell and feature components replace duplicated navigation and discovery presentation while keeping separate Maths and English runners.
- Lazy route modules remain in use. Fonts are local, avoiding a runtime font-service dependency.
- The normal web build now builds Foundation, Higher and English explicitly, fixing stale Higher local output.
- The shared resource cache now exposes its existing refresh operation so recovery controls work.
- Web onboarding remains open through preference changes and receives its API dependency correctly.
- Native readiness uses the same minimum evidence rule as web: 20 marked answers across at least three topics.
- Native plans use server-confirmed completion dates/topics, preserve current stored plans and avoid overwriting a web calendar plan with a rolling plan.
- Native settings save explicitly, report errors and guard account/subject identity during asynchronous saves.
- Native personal hydration failures block plan generation. Retry reloads account data; pull-to-refresh also reapplies personal data. A component regression test proves failed hydration cannot seed/save a replacement.
- Native results load durable attempts with a guarded local fallback.
- Existing API routes, Supabase account/storage contracts, production data and deterministic/self-marking fallbacks are preserved. No database migration or backend rewrite was required.

## Tests and evidence

| Check | Result |
|---|---|
| Express/server tests | 59 passed |
| Full Playwright browser suite | 71 passed |
| Automated accessibility | Eight routes × light/dark passed within browser suite |
| Native Jest | 81 passed across 19 suites after final recovery fix |
| Native ESLint / TypeScript | Passed |
| Web production builds | Foundation, Higher and English passed |
| Hosting build (`build:vercel`) | Passed locally; no deployment performed |
| Expo iOS and Android export | Passed; approximately 3.8MB/4.1MB Hermes bundles |
| iPhone simulator | Today, topic map, Reflect, history and settings inspected; dark theme and largest-text heading checked |

Browser coverage includes local signup/login/logout, invalid credentials, course context, search, settings persistence, onboarding, focus/Escape, topic filters, paper cancellation/expiry/recovery, modal focus, lesson visuals, rewards, today-only mission completion, English quick-fire, sources and responsive layouts. Tests used isolated local server data, not production learner records. The iPhone inspection used its existing session without submitting learner answers or altering account goals.

Screenshots are in [screenshots/](screenshots/), including desktop/mobile web, dark home, native map, native dark home and corrected large-text Today. The visual reviewer found actionable issues in home hierarchy, weekly navigation, save/load recovery and copy; these were addressed. The design detector's Fraunces advisory was retained deliberately because the type pairing is part of the chosen direction, not a correctness failure.

## Remaining release validation and technical debt

1. Verify production signup confirmation, recovery email delivery/redirect allowlists, OAuth, account deletion and Supabase RLS with dedicated test accounts. Local auth and mocked auth tests do not substitute for this.
2. Run full native learning sessions on Android and an iPad, VoiceOver/TalkBack, enlarged text across all specialist screens and slow/failed network scenarios on devices.
3. Exact draft continuity needs a backend-supported, versioned draft contract with conflict handling. Do not advertise seamless unfinished-answer handoff yet.
4. Detailed web analytics, native onboarding and contextual tutor controls need further parity work. Some specialist exam/result/legal surfaces retain compatibility styling rather than a complete component rewrite.
5. Search is course-local and bounded; it does not index every historical AI explanation or question inside saved attempts. Native results are limited to the existing API retention window.
6. Native icon fonts contribute to bundle weight. The existing InteractionManager scheduling call emits a deprecation warning; replace it in a focused performance update with measured behaviour.
7. Formal learner usability research, accessibility certification and learning-outcome evaluation were not performed. Performance has build-level evidence, not real-device field measurements.

## Recommended 2.1 work

Prioritise release device/accessibility validation, then complete analytics/tutor/onboarding presentation parity. Add account-synchronised drafts only with a documented data contract. Evaluate plan recommendations with actual GCSE learners before adding confidence-weighted scheduling or new mastery claims. Measure native font/icon bundle costs and long-list performance before expanding search and visualisation density.
