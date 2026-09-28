# Graph Report - GCSE-Dashboard  (2026-09-14)

## Corpus Check
- 383 files · ~433,336 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2806 nodes · 5996 edges · 178 communities (139 shown, 33 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 181 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Mobile App Shell
- Supabase Storage Backend
- JSON File Storage
- Higher Maths Bank
- UI Data Quality Tests
- Shared Study Planning
- Mobile Planning Engine
- Design CIP Search
- Design Tokens Core
- Maths Question Generators
- Mobile Notebook System
- Slide Search Engine
- Web Client Shell
- English Practice Page
- English Client Navigation
- Server Auth Routes
- UI Search Core
- Study Personalization Shared
- Mobile Maths Visuals
- Design System Generator
- Design Data Contracts
- Expo App Config
- Stack Freshness Tests
- Tailwind Generator Tests
- Personal Model Server
- Server Rewards Database
- Website Dependencies Config
- Mobile Practice Core
- HTML Token Validator
- English Router Grades
- Mobile API Client
- UI Search Domain Tests
- Logo Search Engine
- Mobile Learning Module
- BM25 Search Algorithm
- Mobile Tutor Module
- Mobile App Dependencies
- English Client Dependencies
- Maths Client Dependencies
- Web Maths Visuals
- Maths Practice Page
- Maths Bank Questions
- Mobile Practice Screen
- Expo Dependencies
- Mobile Auth Providers
- Design Tokens Extended
- Tailwind Config API
- Design System Engine
- Mobile Auth Screens
- Mobile API Auth
- Slide Deck Generator
- Dark Mode Logic
- English Question Bank
- Server App Bootstrap
- Maths Bank Index
- Background Image Fetcher
- Design Color Palette
- Relevance Evaluator Tests
- Shared Supabase Client
- Opencode Agent Config
- Icon Generator Script
- Catalog Refresh Tests
- Lesson Visuals Shared
- Design Tokens Fragment
- Shadcn Installer Tests
- Server Dependencies Config
- Domain Detection Tests
- Reasoning Contract Engine
- Dark Palette Coherence
- Shared Dashboard Home
- English Server Utilities
- Mobile Review Formatter
- Brand Color Extractor
- Brand Asset Validator
- Design Radius Tokens
- Tailwind Test Helpers
- Practice Submission Flow
- Design Semantic Tokens
- Palette Selection Tests
- Mobile Settings Module
- Token Validator Script
- Design Card Tokens
- Shadcn Component API
- Tailwind Config Writer
- Maths Chat Page
- Probability Question Bank
- Brand Context Injector
- Logo Generator Script
- Token Embedder Script
- Shadcn Installer Core
- Shadcn Add Tests
- Text Layout Tests
- Server Feedback Routes
- English AI Marking
- Vercel Deployment Config
- Tailwind Base Config
- Token CSS Generator
- Design Button Tokens
- Design Motion Durations
- Storage Factory Server
- English Topics Registry
- Maths Visual Stimuli
- Mobile Practice Storage
- Mobile NPM Scripts
- Token Validator Tests
- Brand Token Sync
- Mobile Dev Dependencies
- Link Child Test
- Mobile Secure Storage
- Mobile TS Config
- Design Input Tokens
- Style Identity Resolver
- Vercel Build Script
- Serverless API Entry
- Mobile Jest Config
- Shared App Shell
- Mobile Deep Linking
- Design Border Tokens
- Design Radius Scale
- Design Size Large
- Design Size Small
- Shared Read Aloud
- English Marker Engine
- Slide Validator Wrapper
- Design Spacing Y
- Design Size XL
- Design Empty Tokens
- UI Search CLI
- Selector Theme Script
- Subjects Theme Script
- Operations Question Bank
- Transformations Questions
- Mobile ESLint Config
- Auth Form Test
- Shadcn Test Fixture
- Brand Sync Test
- Design Spacing 16
- Design Spacing Unit
- Design Spacing Small
- Design Spacing Medium
- Design Destructive Tokens
- Design Destructive Foreground
- Design Muted Tokens
- Design Primary Foreground
- Design Ring Tokens
- Design Secondary Foreground
- Shadcn Installer Init
- Server Entry Auth
- Inequalities Questions
- Shadcn No Config Test
- Shadcn Init Default Test
- Shadcn Dry Run Test
- Shadcn Missing Config Test
- Shadcn Empty Install Test
- Shadcn Files Exist Test
- Shadcn List No Config Test
- Shadcn Empty Add Test
- Tailwind Colors Retest
- Tailwind Fonts Test
- Tailwind Spacing Test
- Tailwind Breakpoints Test
- Tailwind Plugin Dedup Test
- Tailwind Plugin Recommend Test
- Tailwind Nextjs Plugins Test
- Tailwind TS Config Test
- Tailwind JS Config Test
- Tailwind Colors Config Test
- Tailwind Write Config Test
- Tailwind Write Content Test
- Tailwind React Paths Test
- Tailwind Nextjs Paths Test
- Tailwind Add Colors Test

## God Nodes (most connected - your core abstractions)
1. `makeRand()` - 67 edges
2. `shuffle()` - 59 edges
3. `TailwindConfigGenerator` - 58 edges
4. `ApiClient` - 55 edges
5. `createJsonStorage()` - 54 edges
6. `useTheme()` - 49 edges
7. `createSupabaseStorage()` - 48 edges
8. `ri()` - 47 edges
9. `search()` - 43 edges
10. `useResource()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `TestBm25CoreBehavior` --uses--> `BM25`  [INFERRED]
  .opencode/skills/ui-ux-pro-max/scripts/tests/test_core.py → .opencode/skills/design/scripts/cip/core.py
- `TestTokenizer` --uses--> `BM25`  [INFERRED]
  .opencode/skills/ui-ux-pro-max/scripts/tests/test_core.py → .opencode/skills/design/scripts/cip/core.py
- `TestShadcnInstaller` --uses--> `ShadcnInstaller`  [INFERRED]
  .opencode/skills/ui-styling/scripts/tests/test_shadcn_add.py → .opencode/skills/ui-styling/scripts/shadcn_add.py
- `TestGeneratedConfigIsValidJs` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .opencode/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .opencode/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestTailwindConfigGenerator` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .opencode/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .opencode/skills/ui-styling/scripts/tailwind_config_gen.py

## Import Cycles
- None detected.

## Communities (178 total, 33 thin omitted)

### Community 0 - "Mobile App Shell"
Cohesion: 0.08
Nodes (49): authRedirect(), Navigation(), Note(), styles, appearances, styles, subjects, icon() (+41 more)

### Community 1 - "Supabase Storage Backend"
Cohesion: 0.10
Nodes (65): cloneJson(), compactState(), createSupabaseStorage(), claimStudySession(), completeLegacyClaim(), createAuthUser(), createStudySession(), deleteAuthUser() (+57 more)

### Community 2 - "JSON File Storage"
Cohesion: 0.14
Nodes (64): atomicWrite(), cloneJson(), completedOutcome(), createJsonStorage(), assertUniqueOAuth(), claimStudySession(), consumeOAuthState(), createStudySession() (+56 more)

### Community 3 - "Higher Maths Bank"
Cohesion: 0.06
Nodes (46): buildHigherAdhoc(), buildHigherPaper(), buildHigherPractice(), chooseForMarks(), generators, HIGHER_PAPERS, HIGHER_REVIEWED, higherBankSize() (+38 more)

### Community 4 - "UI Data Quality Tests"
Cohesion: 0.07
Nodes (47): Semantic quality contracts for the core UI/UX datasets., read_rows(), TestAccessibilityGuidance, TestChartsTypographyAndIcons, TestCurrentReactGuidance, TestSemanticColors, _catalog_date(), _check_app_interface_contract() (+39 more)

### Community 5 - "Shared Study Planning"
Cohesion: 0.07
Nodes (51): Notebook, WeeklySummary, Notebook, WeeklySummary, buildWeekPlan(), dateKey(), ENGLISH_WRITING_SKILLS, FALLBACK_TASKS (+43 more)

### Community 6 - "Mobile Planning Engine"
Cohesion: 0.09
Nodes (50): Progress, buildPlan(), dateKey(), daysToExam(), ENGLISH_WRITING, fallbackTasks, finite(), fixupEnglishPlan() (+42 more)

### Community 7 - "Design CIP Search"
Cohesion: 0.06
Nodes (46): BM25, detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection (+38 more)

### Community 8 - "Design Tokens Core"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 9 - "Maths Question Generators"
Cohesion: 0.09
Nodes (34): gen(), gen(), mcq(), gen(), mcq(), gen(), mcq(), gen() (+26 more)

### Community 10 - "Mobile Notebook System"
Cohesion: 0.10
Nodes (42): CLASSIFY_REASONS, fixupTargets(), Notebook(), classify(), correction(), grade(), resurrect(), save() (+34 more)

### Community 11 - "Slide Search Engine"
Cohesion: 0.08
Nodes (38): format_context(), format_result(), main(), Format a single search result for display, Slide Search CLI - Search slide design databases for strategies, layouts, copy,…, Format contextual recommendations for display., BM25, calculate_pattern_break() (+30 more)

### Community 12 - "Web Client Shell"
Cohesion: 0.10
Nodes (32): App(), initialTheme(), shouldPrefetchRoutes(), SECTION_NAMES, STRAND_COLORS, Dashboard(), api, App() (+24 more)

### Community 13 - "English Practice Page"
Cohesion: 0.06
Nodes (22): Practice, activeTestKey(), AdhocRunner(), checkOne(), AdhocSection(), AdhocSourcePanel(), fmtTime(), lastResultKey() (+14 more)

### Community 14 - "English Client Navigation"
Cohesion: 0.11
Nodes (27): api, Chat, Dashboard, Learn, NAV, PAGE_LOADERS, TextDetail, Texts (+19 more)

### Community 15 - "Server Auth Routes"
Cohesion: 0.11
Nodes (37): adminPasswordForSeed(), asyncRoute(), authRoutes(), bearerTokenFrom(), clearSessionCookie(), configuredAppUrl(), __dirname, fetchOAuthJson() (+29 more)

### Community 16 - "UI Search Core"
Cohesion: 0.09
Nodes (37): _contains_phrase(), _domain_keywords(), _exact_match_diagnostic(), _exact_stack_identifier(), _file_signature(), _get_bm25(), _legacy_successor_guidance(), _load_csv() (+29 more)

### Community 17 - "Study Personalization Shared"
Cohesion: 0.11
Nodes (33): Results, finish(), Results(), finishQuiz(), AdhocRunner(), finish(), Results(), finishQuiz() (+25 more)

### Community 18 - "Mobile Maths Visuals"
Cohesion: 0.12
Nodes (29): BarVisual(), Cartesian(), Colors, Coordinate(), CountersVisual(), DotPattern(), Histogram(), label() (+21 more)

### Community 19 - "Design System Generator"
Cohesion: 0.09
Nodes (29): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides() (+21 more)

### Community 20 - "Design Data Contracts"
Cohesion: 0.10
Nodes (9): Cross-file semantic contracts for curated design data., read_rows(), split_values(), style_identities(), TestGeneratedCatalogContract, TestLandingAndStackContract, TestReasoningContract, TestStyleIdentityContract (+1 more)

### Community 21 - "Expo App Config"
Cohesion: 0.06
Nodes (31): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled (+23 more)

### Community 22 - "Stack Freshness Tests"
Cohesion: 0.10
Nodes (8): Search stack-specific guidelines, search_stack(), Freshness and migration contracts for native, desktop, and 3D stacks., _rows(), TestNativeDesktopStackFreshness, Freshness and generation-isolation contracts for web stack guidance., _rows(), TestWebStackFreshness

### Community 23 - "Tailwind Generator Tests"
Cohesion: 0.06
Nodes (16): Test TailwindConfigGenerator class., Test initialization with default settings., Test generating config with plugins., Test validating valid configuration., Test validating config with no content paths., Test validating config with empty theme extensions., Test initialization for JavaScript config., Test writing config to invalid path. (+8 more)

### Community 24 - "Personal Model Server"
Cohesion: 0.15
Nodes (25): ShareCard(), copy(), share(), shareText(), asyncRoute(), attachPersonalRoutes(), mistakeEvents(), attemptLimit (+17 more)

### Community 25 - "Server Rewards Database"
Cohesion: 0.14
Nodes (26): applyActivity(), applyPractice(), applyPracticeRecords(), applyReward(), applyTest(), createDb(), addXp(), clearChat() (+18 more)

### Community 26 - "Website Dependencies Config"
Cohesion: 0.07
Nodes (25): concurrently, @playwright/test, supabase, description, devDependencies, concurrently, @playwright/test, supabase (+17 more)

### Community 27 - "Mobile Practice Core"
Cohesion: 0.17
Nodes (26): restore(), rec(), Results(), show(), styles, label(), PracticeHome(), AnswerValue (+18 more)

### Community 28 - "HTML Token Validator"
Cohesion: 0.12
Nodes (25): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+17 more)

### Community 29 - "English Router Grades"
Cohesion: 0.11
Nodes (22): allTexts(), getTextDetail(), paperList(), BOUNDARIES, gradeLabel(), nextBoundaryGap(), predictGrade(), markTrueFalse() (+14 more)

### Community 30 - "Mobile API Client"
Cohesion: 0.14
Nodes (3): ApiClient, warmSubjectCache(), shareMilestone()

### Community 31 - "UI Search Domain Tests"
Cohesion: 0.11
Nodes (8): Resolve a deprecated in-domain alias, or expose a cross-domain redirect., Main search function with auto-domain detection, search(), _style_search_destination(), TestSearchDomains, Regression tests for the public style taxonomy and search contract., read_rows(), TestStyleTaxonomy

### Community 32 - "Logo Search Engine"
Cohesion: 0.10
Nodes (21): BM25, detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+13 more)

### Community 33 - "Mobile Learning Module"
Cohesion: 0.19
Nodes (20): Lesson(), Learn(), styles, TextReader(), asRecord(), asText(), filterTopicGroups(), LearnTopic (+12 more)

### Community 34 - "BM25 Search Algorithm"
Cohesion: 0.10
Nodes (10): BM25, BM25 ranking algorithm for text search, Lowercase, normalize synonyms, split, remove punctuation, filter stopwords, Build BM25 index from documents, Score all documents against query, All indexed terms, for suggestion/typo-recovery purposes., Stdlib-only regression tests for core.py / design_system.py (unittest, not…, TestBm25CoreBehavior (+2 more)

### Community 35 - "Mobile Tutor Module"
Cohesion: 0.17
Nodes (22): greeting(), makeId(), one(), STARTERS, styles, Tutor(), clearConversation(), send() (+14 more)

### Community 36 - "Mobile App Dependencies"
Cohesion: 0.08
Nodes (24): react, react-dom, @supabase/supabase-js, main, name, private, version, eslint (+16 more)

### Community 37 - "English Client Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, @vercel/analytics, devDependencies, vite (+16 more)

### Community 38 - "Maths Client Dependencies"
Cohesion: 0.08
Nodes (24): dependencies, react, react-dom, react-router-dom, @supabase/supabase-js, @vercel/analytics, devDependencies, vite (+16 more)

### Community 39 - "Web Maths Visuals"
Cohesion: 0.09
Nodes (6): GraphStimulus(), controlLabel(), CoordinateVisual(), extent(), regularPolygon(), ShapeVisual()

### Community 40 - "Maths Practice Page"
Cohesion: 0.11
Nodes (13): Practice, STRAND_COLORS, STRAND_NAMES, activeTestKey(), AdhocSection(), fmtTime(), lastResultKey(), loadSaved() (+5 more)

### Community 41 - "Maths Bank Questions"
Cohesion: 0.15
Nodes (16): gen(), mcq(), gen(), mcq(), gen(), mcq(), gcd2(), gen() (+8 more)

### Community 42 - "Mobile Practice Screen"
Cohesion: 0.24
Nodes (19): checkCurrent(), update(), display(), EssayEditor(), Feedback(), hasQuestionAnswer(), MathsHints(), mergeEssayAnswer() (+11 more)

### Community 43 - "Expo Dependencies"
Cohesion: 0.09
Nodes (22): dependencies, expo, expo-asset, expo-build-properties, expo-constants, expo-font, expo-linking, expo-network (+14 more)

### Community 44 - "Mobile Auth Providers"
Cohesion: 0.13
Nodes (17): defaultPlanningPreferences, PlanningPreferences, AppProviders(), AuthContext, AuthProvider(), AuthPublisher, isConfirmedAuthRejection(), NetworkContext (+9 more)

### Community 45 - "Design Tokens Extended"
Cohesion: 0.09
Nodes (22): $type, $value, $type, $value, $type, $value, $type, $value (+14 more)

### Community 46 - "Tailwind Config API"
Cohesion: 0.09
Nodes (12): Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Generate Tailwind CSS configuration files., Validate configuration. Returns: Tuple of (valid, message), Add custom colors to theme. Args: colors: Dict of color_name: color_value Value… (+4 more)

### Community 47 - "Design System Engine"
Cohesion: 0.13
Nodes (10): DesignSystemGenerator, Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Execute searches across multiple domains., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Bucket a 1-10 dial value into its tier config. Returns None if value is None. (+2 more)

### Community 48 - "Mobile Auth Screens"
Cohesion: 0.11
Nodes (8): Page(), ApiAuthResponse, applyApiAuthResponse(), AuthForm(), submit(), validate(), first(), recoveryParams

### Community 49 - "Mobile API Auth"
Cohesion: 0.15
Nodes (16): ApiError, ApiOptions, authFetch(), authRequest(), clearLocalSession(), deleteAccount(), DeleteAccountResponse, errorFromResponse() (+8 more)

### Community 50 - "Slide Deck Generator"
Cohesion: 0.14
Nodes (20): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+12 more)

### Community 51 - "Dark Mode Logic"
Cohesion: 0.14
Nodes (11): _filter_anti_patterns_for_mode(), _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., Drop "avoid dark mode" advice once dark mode is the resolved answer., _resolve_color_mode(), _style_is_dark_primary() (+3 more)

### Community 52 - "English Question Bank"
Cohesion: 0.20
Nodes (17): ACCURACY_DRILLS, baseQ(), buildAdhoc(), buildPaper(), buildPractice(), buildPracticeQ(), fullSetFor(), p1QuestionSet() (+9 more)

### Community 53 - "Server App Bootstrap"
Cohesion: 0.17
Nodes (18): express, analyticsRoutes(), availableDist(), createApp(), __dirname, errorStatus(), isApiRequest(), logRequestError() (+10 more)

### Community 54 - "Maths Bank Index"
Cohesion: 0.19
Nodes (18): bankCache, bigFirst(), buildAdhoc(), buildPaper(), buildPractice(), checkAnswer(), genMods, loadBank() (+10 more)

### Community 55 - "Background Image Fetcher"
Cohesion: 0.16
Nodes (18): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+10 more)

### Community 56 - "Design Color Palette"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 57 - "Relevance Evaluator Tests"
Cohesion: 0.12
Nodes (4): Unit tests for metric math and relevance fixture validation., TestFixtureValidation, TestMetricMath, TestThresholdGate

### Community 58 - "Shared Supabase Client"
Cohesion: 0.22
Nodes (15): authReq(), eventReq(), req(), authReq(), eventReq(), req(), SUBJECT, LoginScreen() (+7 more)

### Community 59 - "Opencode Agent Config"
Cohesion: 0.12
Nodes (16): agent, explore, general, REDDIT_AUTH_MODE, REDDIT_SAFE_MODE, model, variant, model (+8 more)

### Community 60 - "Icon Generator Script"
Cohesion: 0.18
Nodes (16): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+8 more)

### Community 62 - "Lesson Visuals Shared"
Cohesion: 0.18
Nodes (11): Topic, LESSON_VISUALS, LessonVisual(), MathsVisual(), Topic(), EXPERTISE_RANKS, ExpertisePath(), progressPercent() (+3 more)

### Community 63 - "Design Tokens Fragment"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 64 - "Shadcn Installer Tests"
Cohesion: 0.12
Nodes (9): Test adding components in dry run mode., Test ShadcnInstaller class., Test adding all components without config., Test adding all components in dry run mode., Test listing installed components without config., Test listing installed components when none exist., Test listing installed components when they exist., Test checking for existing shadcn config. (+1 more)

### Community 65 - "Server Dependencies Config"
Cohesion: 0.12
Nodes (15): @supabase/server, dependencies, express, @supabase/server, @supabase/supabase-js, @supabase/supabase-js, main, name (+7 more)

### Community 66 - "Domain Detection Tests"
Cohesion: 0.23
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, TestDomainDetection

### Community 67 - "Reasoning Contract Engine"
Cohesion: 0.17
Nodes (9): Find matching reasoning rule for a category., Apply reasoning rules to search results., apply_decision_rules(), _object_without_duplicates(), parse_decision_rules(), Return deterministic mutations and an audit trail; never execute data., Closed, non-executable grammar for design-system decision rules., Parse the canonical condition -> action-array representation. (+1 more)

### Community 68 - "Dark Palette Coherence"
Cohesion: 0.18
Nodes (7): _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., _relative_luminance(), The exact reproduction from issue #428., TestEndToEndCoherence, TestLuminance

### Community 69 - "Shared Dashboard Home"
Cohesion: 0.23
Nodes (11): DashboardHome(), examCopy(), examTone(), formatExamMonth(), STAT_TONES, MilestoneShelf(), masteryStage(), strengthLabel() (+3 more)

### Community 70 - "English Server Utilities"
Cohesion: 0.17
Nodes (8): fracStr(), gcd(), hashStr(), makeRand(), mulberry32(), pick(), pickWord(), WORDS

### Community 71 - "Mobile Review Formatter"
Cohesion: 0.34
Nodes (12): asArray(), formatAnswerValue(), joinNumbers(), ListResultLine, listResultLines(), prettifyKey(), record(), rubricLines() (+4 more)

### Community 72 - "Brand Color Extractor"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 73 - "Brand Asset Validator"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 74 - "Design Radius Tokens"
Cohesion: 0.19
Nodes (14): $type, $value, $type, $value, $type, $value, primitive, radius (+6 more)

### Community 75 - "Tailwind Test Helpers"
Cohesion: 0.16
Nodes (10): main(), Tailwind CSS Configuration Generator Generate tailwind.config.js/ts with custom…, Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object() (+2 more)

### Community 76 - "Practice Submission Flow"
Cohesion: 0.24
Nodes (12): ActivePractice(), confirmDiscard(), confirmSubmit(), discard(), removeLocalOnly(), submit(), formatTime(), completeMission() (+4 more)

### Community 77 - "Design Semantic Tokens"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 78 - "Palette Selection Tests"
Cohesion: 0.22
Nodes (7): _contrast_ratio(), _derive_dark_palette(), WCAG contrast ratio for two hex colors, or None if either is invalid., Keep product brand tokens while deriving accessible dark surfaces., Pick the highest-ranked palette matching the resolved mode. Only the dark case…, _select_palette_for_mode(), TestPaletteSelection

### Community 79 - "Mobile Settings Module"
Cohesion: 0.27
Nodes (9): Settings(), confirmSignOut(), removeAccount(), signOut(), AccountLink, accountLinks(), isDisposableAppStorageKey(), paths (+1 more)

### Community 80 - "Token Validator Script"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 81 - "Design Card Tokens"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 82 - "Shadcn Component API"
Cohesion: 0.21
Nodes (6): Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…

### Community 83 - "Tailwind Config Writer"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 84 - "Maths Chat Page"
Cohesion: 0.26
Nodes (10): Chat, Chat(), reset(), send(), setMessages(), SUGGESTIONS, toMessages(), inlineMarkdown() (+2 more)

### Community 85 - "Probability Question Bank"
Cohesion: 0.30
Nodes (9): gen(), mcq(), gen(), mcq(), round1(), gen(), mcq(), mulFrac() (+1 more)

### Community 86 - "Brand Context Injector"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 87 - "Logo Generator Script"
Cohesion: 0.25
Nodes (10): enhance_prompt(), generate_batch(), generate_logo(), load_env(), main(), Enhance the logo prompt with style and industry modifiers, Generate a logo using Gemini models with image generation Args: aspect_ratio:…, Generate multiple logo variants with different styles (+2 more)

### Community 88 - "Token Embedder Script"
Cohesion: 0.18
Nodes (8): args, fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath, wrapStyle

### Community 89 - "Shadcn Installer Core"
Cohesion: 0.22
Nodes (7): main(), Handle shadcn/ui component installation., shadcn/ui Component Installer Add shadcn/ui components to project with…, ShadcnInstaller, Tests for shadcn_add.py, Test adding components that are already installed., Test initialization with custom project root.

### Community 90 - "Shadcn Add Tests"
Cohesion: 0.18
Nodes (6): Test adding components with overwrite flag., Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 91 - "Text Layout Tests"
Cohesion: 0.20
Nodes (4): Canonical regression contracts for resilient UI text layouts., read_rows(), TestTextLayoutDataContracts, TestTextLayoutRetrieval

### Community 92 - "Server Feedback Routes"
Cohesion: 0.24
Nodes (6): clientKey(), feedbackRoutes(), optionalText(), ROLES, SUBJECTS, temporaryStorage()

### Community 93 - "English AI Marking"
Cohesion: 0.36
Nodes (8): aiConfig(), askTutor(), callOpenRouter(), contentText(), markAnswer(), parseJsonLoose(), rubricFor(), RUBRICS

### Community 94 - "Vercel Deployment Config"
Cohesion: 0.18
Nodes (10): maxDuration, buildCommand, framework, functions, api/index.js, headers, outputDirectory, redirects (+2 more)

### Community 95 - "Tailwind Base Config"
Cohesion: 0.22
Nodes (6): Any, Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework.

### Community 96 - "Token CSS Generator"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 97 - "Design Button Tokens"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 98 - "Design Motion Durations"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 99 - "Storage Factory Server"
Cohesion: 0.22
Nodes (4): createStorage(), DEFAULT_DATA_DIR, defaultStorage, __dirname

### Community 100 - "English Topics Registry"
Cohesion: 0.20
Nodes (5): RES, REVIEWED, SECTIONS, SPEC_REFS, TOPICS

### Community 101 - "Maths Visual Stimuli"
Cohesion: 0.49
Nodes (9): buildStimulus(), coordinateStimulus(), dataStimulus(), geometryStimulus(), inequalityStimulus(), label(), numbers(), scaleStimulus() (+1 more)

### Community 102 - "Mobile Practice Storage"
Cohesion: 0.25
Nodes (4): start(), PreparationPanel(), persistNewSession(), PracticeStorage

### Community 103 - "Mobile NPM Scripts"
Cohesion: 0.22
Nodes (9): scripts, android, doctor, ios, lint, start, test, typecheck (+1 more)

### Community 104 - "Token Validator Tests"
Cohesion: 0.28
Nodes (8): CompletedProcess, Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation()

### Community 105 - "Brand Token Sync"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 106 - "Mobile Dev Dependencies"
Cohesion: 0.25
Nodes (8): devDependencies, eslint, eslint-config-expo, jest, jest-expo, @types/jest, @types/react, typescript

### Community 107 - "Link Child Test"
Cohesion: 0.25
Nodes (5): { expect, test }, { join }, { readdirSync, readFileSync }, ts, typescript

### Community 108 - "Mobile Secure Storage"
Cohesion: 0.36
Nodes (5): createChunkedStorage(), KeyValueStore, secureStorage, memory(), expo-secure-store

### Community 109 - "Mobile TS Config"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, types, extends, include, expo/tsconfig.base

### Community 110 - "Design Input Tokens"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 111 - "Style Identity Resolver"
Cohesion: 0.25
Nodes (8): _exact_row_identity(), Suggest complete public identities so a retry can bypass score thresholds., Return non-empty public identities from ordinary and alias fields., Resolve an explicit style identity without opening generic variant ranking., Return one row whose stable public identity exactly matches the query., _row_identities(), _style_identity(), _suggest_identities()

### Community 112 - "Vercel Build Script"
Cohesion: 0.25
Nodes (4): publicDir, root, selectorDir, siteUrl

### Community 113 - "Serverless API Entry"
Cohesion: 0.43
Nodes (3): handler(), initializeApp(), startupCode()

### Community 114 - "Mobile Jest Config"
Cohesion: 0.33
Nodes (6): jest, moduleNameMapper, preset, setupFiles, testPathIgnorePatterns, ^expo-modules-core(.*)$

### Community 115 - "Shared App Shell"
Cohesion: 0.60
Nodes (4): AppShell(), CommandPalette(), readRecent(), writeRecent()

### Community 116 - "Mobile Deep Linking"
Cohesion: 0.60
Nodes (3): recoveryKeys, recoveryRedirect(), redirectSystemPath()

### Community 117 - "Design Border Tokens"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 118 - "Design Radius Scale"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 119 - "Design Size Large"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 120 - "Design Size Small"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 121 - "Shared Read Aloud"
Cohesion: 0.60
Nodes (4): pickVoice(), ReadAloud(), toggle(), supported()

### Community 122 - "English Marker Engine"
Cohesion: 0.60
Nodes (4): markList(), score(), STOP, tokens()

### Community 123 - "Slide Validator Wrapper"
Cohesion: 0.50
Nodes (3): main(), Slide Token Validator (Legacy Wrapper) Now delegates to html-token-validator.py…, Delegate to unified html-token-validator.py with --type slides.

### Community 124 - "Design Spacing Y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 125 - "Design Size XL"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 126 - "Design Empty Tokens"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 127 - "UI Search CLI"
Cohesion: 0.50
Nodes (3): format_output(), UI/UX Pro Max Search - BM25 search engine for UI/UX style guides Usage: python…, Format results for Claude consumption (token-optimized)

### Community 131 - "Operations Question Bank"
Cohesion: 0.67
Nodes (3): gen(), mcq(), money()

### Community 132 - "Transformations Questions"
Cohesion: 0.83
Nodes (3): fmtPt(), gen(), mcq()

### Community 137 - "Design Spacing 16"
Cohesion: 0.67
Nodes (3): $type, $value, 16

### Community 138 - "Design Spacing Unit"
Cohesion: 0.67
Nodes (3): $type, $value, 1

### Community 139 - "Design Spacing Small"
Cohesion: 0.67
Nodes (3): $type, $value, 3

### Community 140 - "Design Spacing Medium"
Cohesion: 0.67
Nodes (3): $type, $value, 8

### Community 141 - "Design Destructive Tokens"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 142 - "Design Destructive Foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 143 - "Design Muted Tokens"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 144 - "Design Primary Foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 145 - "Design Ring Tokens"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 146 - "Design Secondary Foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

## Knowledge Gaps
- **461 isolated node(s):** `fs`, `path`, `fs`, `path`, `fs` (+456 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 934 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `text()` connect `Personal Model Server` to `Shared Read Aloud`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `toggle()` connect `Shared Read Aloud` to `Personal Model Server`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `ReadAloud()` connect `Shared Read Aloud` to `English Client Navigation`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 34 inferred relationships involving `createJsonStorage()` (e.g. with `claimStudySession()` and `close()`) actually correct?**
  _`createJsonStorage()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `fs` to the rest of the system?**
  _461 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Mobile App Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.08405797101449275 - nodes in this community are weakly interconnected._