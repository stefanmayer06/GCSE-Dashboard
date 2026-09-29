// Social adverts: four 1080×1350 (4:5) posts for Instagram and Reddit,
// drawn with the real Circuit components so they match the product.
// Copy follows PRODUCT.md and GO_TO_MARKET.md: AQA-style and independent,
// free during the beta, no grade promises, no invented results. Numbers
// arrive as `facts` from scripts/build-social.mjs, never typed here.
// Build: npm run social:build (see design/social/README.md).
import { CircuitHero } from '../../clients/shared/circuit/Scenes.jsx';
import Emblem from '../../clients/shared/circuit/Emblem.jsx';
import Icon from '../../clients/shared/circuit/Icon.jsx';
import IsoTile from '../../clients/shared/circuit/IsoTile.jsx';
import Pip from '../../clients/shared/circuit/Pip.jsx';
import { Stars } from '../../clients/shared/circuit/bits.jsx';
import { STAGE_H, STAGE_W, compile, frameAt } from '../../clients/shared/explainer/engine.js';
import { StageItem } from '../../clients/shared/explainer/primitives.jsx';
import fractionsExplainer from '../../clients/shared/explainer/library/maths/fractions-of-an-amount.js';
import { ERROR_TYPES } from '../../clients/shared/study-personal.js';

const number = (value) => value.toLocaleString('en-GB');

// Subject marks, as on the landing page cards.
const COURSES = [
  { id: 'foundation', hue: 'blue', name: 'Maths', tier: 'Foundation', mark: { topicId: 'subject:MathsMate', strand: 'number' } },
  { id: 'higher', hue: 'purple', name: 'Maths', tier: 'Higher', mark: { topicId: 'subject:Higher Maths', strand: 'algebra' } },
  { id: 'english', hue: 'tangerine', name: 'English', tier: 'Language', mark: { topicId: 'subject:EnglishMate', strand: 'reading' } },
];

function SubjectMark({ course, size = 40 }) {
  return (
    <span className="post-mark" style={{ '--mark': `var(--hue-${course.hue})` }}>
      <Emblem topicId={course.mark.topicId} strand={course.mark.strand} layers={3} ring={false} size={size} />
    </span>
  );
}

function Frame({ id, tone, facts, children }) {
  return (
    <article className={`post post-${id} tone-${tone}`}>
      <header className="post-top">
        <span className="post-brand">
          <span className="post-brand-mark"><Emblem topicId="brand:study-desk" strand="probability" layers={4} ring={false} size={46} /></span>
          GCSE Study Desk
        </span>
        <span className="post-beta"><i aria-hidden="true" /> Free beta</span>
      </header>
      {children}
      <footer className="post-foot">
        <span className="post-foot-copy">
          <b className="post-url">{facts.url}</b>
          <small>Independent revision tool. Not affiliated with AQA.</small>
        </span>
        <span className="post-cta">Try it free <Icon name="arrowRight" size={30} /></span>
      </footer>
    </article>
  );
}

// ---------- 1 · The idea ----------
function LearnPost({ facts }) {
  return (
    <Frame id="learn" tone="night" facts={facts}>
      <div className="learn-art" data-bleed><CircuitHero /></div>
      <div className="learn-copy">
        <p className="post-eyebrow">AQA GCSE Maths &amp; English</p>
        <h1 className="post-title">
          <span>Learn it.</span>
          <span>Play with it.</span>
          <span><em>Fix what</em></span>
          <span><em>you missed.</em></span>
        </h1>
      </div>
      <ul className="learn-courses">
        {COURSES.map((course) => (
          <li key={course.id}>
            <SubjectMark course={course} size={38} />
            <span>
              <i>{course.name}</i>
              <b>{course.tier}</b>
              {/* The Higher bank includes the Foundation questions, so never add the two. */}
              <small>{course.id === 'english' ? 'Both papers' : `${number(facts.questions[course.id])} questions`}</small>
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// ---------- 2 · The map ----------
// A demo learner on the Number unit, using the app's own rules: states as
// CourseMap's tileState, stars as starsFor, and the weakest topic under
// 70% as the suggested tile. The path climbs from mastered (bottom left)
// to not tried yet (top right). x/y place each tile on the canvas.
const TILE = 176;
const MAP_TILES = [
  { topicId: 'place-value', name: 'Place Value & Ordering', state: 'mastered', stage: 'mastered', stars: 3, meta: '96%', x: 72, y: 800 },
  { topicId: 'factors-multiples', name: 'Factors, Multiples & Primes', state: 'started', stage: 'secure', stars: 2, meta: '81%', x: 258, y: 678 },
  { topicId: 'fractions', name: 'Fractions', state: 'done', stage: 'secure', stars: 2, meta: '74%', x: 444, y: 556 },
  { topicId: 'percentages', name: 'Percentages', state: 'current', stage: 'developing', stars: 1, meta: '45%', x: 630, y: 434 },
  { topicId: 'decimals', name: 'Decimals', state: 'new', stage: 'new', stars: 0, meta: 'new', x: 816, y: 312 },
];
// Centre of a tile's top face (IsoTile's viewBox point 60,44).
const faceCentre = (tile) => [tile.x + (TILE * 60) / 120, tile.y + (TILE * 44) / 120];

const STAGES = [
  { n: '01', name: 'Watch', hue: 'blue' },
  { n: '02', name: 'Learn', hue: 'amber' },
  { n: '03', name: 'Practise', hue: 'green' },
  { n: '04', name: 'Master', hue: 'volt' },
];

function MapPost({ facts }) {
  return (
    <Frame id="map" tone="paper" facts={facts}>
      <div className="post-head">
        <p className="post-eyebrow">How it plays</p>
        <h1 className="post-title">
          <span>Every topic</span>
          <span>is a level you</span>
          <span><em>can replay.</em></span>
        </h1>
      </div>
      <div className="map-climb" data-layer style={{ '--strand': 'var(--hue-blue)' }}>
        <svg className="map-trace" viewBox="0 0 1080 1350" data-layer aria-hidden="true">
          {MAP_TILES.slice(1).map((tile, index) => {
            const from = MAP_TILES[index];
            const [x1, y1] = faceCentre(from);
            const [x2, y2] = faceCentre(tile);
            return (
              <g key={tile.topicId}>
                <path d={`M${x1} ${y1} L${x2} ${y2}`} className="trace-base" />
                {tile.state !== 'new' ? <path d={`M${x1} ${y1} L${x2} ${y2}`} className="trace-live" /> : null}
              </g>
            );
          })}
        </svg>
        {/* Each step is 32px wider than its tile on both sides: room for a label. */}
        <ol className="map-steps">
          {MAP_TILES.map((tile) => (
            <li key={tile.topicId} className={`map-step node-${tile.state}`} style={{ left: tile.x - 32, top: tile.y, width: TILE + 64 }}>
              {tile.state === 'current' ? <span className="map-bubble">Next</span> : null}
              <IsoTile topicId={tile.topicId} strand="number" hue="blue" state={tile.state} stage={tile.stage} size={TILE} />
              <span className="map-label">
                <span className="topic-name">{tile.name}</span>
                <span className="map-meta">
                  <Stars count={tile.stars} size={20} label={false} />
                  <span className={`map-acc${tile.meta === 'new' ? ' new' : ''}`}>{tile.meta}</span>
                </span>
              </span>
            </li>
          ))}
        </ol>
        <div className="map-lesson">
          <p>Every level</p>
          <ol>
            {STAGES.map((stage) => (
              <li key={stage.n} style={{ '--stage': `var(--hue-${stage.hue})` }}>
                <span>{stage.n}</span>{stage.name}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="map-note"><Stars count={3} size={26} label={false} /> Stars come only from marked answers. No topic is locked.</p>
    </Frame>
  );
}

// ---------- 3 · Explainers ----------
// The explainer stage at time `at`, drawn by the real engine and
// primitives. `cropTop` trims empty board above the first element and
// `hide` leaves out elements an overlay would half cover.
function Board({ script, at, cropTop = 0, hide = [] }) {
  const frame = frameAt(compile(script), at, { reducedMotion: true });
  const items = frame.items.filter((item) => !hide.includes(item.id));
  const height = STAGE_H - cropTop;
  return (
    <section className={`xp-player board-${script.board || 'night'}`} style={{ '--xp-hue': `var(--hue-${script.hue || 'blue'})` }}>
      <div className="xp-stage-wrap" style={{ aspectRatio: `${STAGE_W} / ${height}` }}>
        <svg className="xp-stage" viewBox={`0 ${cropTop} ${STAGE_W} ${height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <pattern id="post-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill="var(--b-grid)" />
            </pattern>
          </defs>
          <rect y={cropTop} width={STAGE_W} height={height} fill="var(--b-bg)" />
          <rect y={cropTop} width={STAGE_W} height={height} fill="url(#post-dots)" />
          {items.map((item) => <StageItem key={item.id} item={item} />)}
        </svg>
      </div>
    </section>
  );
}

// The checkpoint card as ExplainerPlayer draws an open question, minus
// its Skip button.
function Checkpoint({ cp }) {
  return (
    <div className="xp-check" role="group">
      <div className="xp-check-head">
        <Pip mood="wow" size={44} />
        <div>
          <p className="xp-check-kicker">Your turn</p>
          <p className="xp-check-prompt">{cp.prompt}</p>
        </div>
      </div>
      <div className="xp-check-options">
        {cp.options.map((option, index) => (
          <span key={option} className="xp-option">
            <span className="xp-option-key">{String.fromCharCode(65 + index)}</span>
            {option}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExplainerPost({ facts }) {
  const cp = compile(fractionsExplainer).checkpoints[0];
  return (
    <Frame id="explainers" tone="night" facts={facts}>
      <div className="post-head">
        <p className="post-eyebrow">Interactive explainers</p>
        <h1 className="post-title">
          <span>Explainers that</span>
          <span><em>stop and ask you.</em></span>
        </h1>
      </div>
      <div className="xp-demo">
        {/* The card brings its own Pip, so the board's one stays out. */}
        <Board script={fractionsExplainer} at={cp.t} cropTop={36} hide={['pip']} />
        <div className="xp-demo-check"><Checkpoint cp={cp} /></div>
      </div>
      <ul className="xp-counts">
        {COURSES.map((course) => (
          <li key={course.id}>
            <SubjectMark course={course} size={30} />
            <span><b>{facts.explainers[course.id]}</b> in {course.id === 'english' ? 'English' : course.tier}</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

// ---------- 4 · Mistake notebook ----------
// study-personal.js schedules a new mistake for 1, 3, 7 and 21 days.
const RETRIES = [
  { days: 1, state: 'done' },
  { days: 3, state: 'done' },
  { days: 7, state: 'next' },
  { days: 21, state: 'open' },
];

function NotebookPost({ facts }) {
  return (
    <Frame id="notebook" tone="paper" facts={facts}>
      <div className="post-head">
        <p className="post-eyebrow">Mistake notebook</p>
        <h1 className="post-title">
          <span>Misses come back</span>
          <span><em>until they stick.</em></span>
        </h1>
      </div>
      <section className="nb-card">
        <header className="nb-head">
          <span>Maths Foundation · Solving Equations</span>
          <span className="due-chip due">Retry due</span>
        </header>
        <p className="nb-prompt">Solve 3x + 5 = 20</p>
        <div className="nb-answers">
          <div className="nb-answer no">
            <small>Your answer</small>
            <p><span className="nb-mark"><Icon name="cross" size={22} strokeWidth={3.4} /></span> x = 6</p>
          </div>
          <div className="nb-answer ok">
            <small>Correct answer</small>
            <p><span className="nb-mark"><Icon name="check" size={22} strokeWidth={3.4} /></span> x = 5</p>
          </div>
        </div>
        <div className="mistake-solution">
          <small>Worked method</small>
          <p>
            <span className="sol-step">3x = 20 − 5 = 15</span>
            <Icon name="arrowRight" size={26} strokeWidth={2.6} />
            <span className="sol-step">x = 15 ÷ 3 = 5</span>
          </p>
        </div>
        <div className="nb-reasons">
          <small>Why did you miss it?</small>
          <div className="chip-row">
            {ERROR_TYPES.map((type) => (
              <span key={type.id} className={`suggest-chip${type.id === 'arithmetic' ? ' on' : ''}`}>{type.label}</span>
            ))}
          </div>
        </div>
      </section>
      <div className="nb-ladder">
        <p>Comes back after</p>
        <ol>
          {RETRIES.map((retry) => (
            <li key={retry.days} className={`retry ${retry.state}`}>
              <span className="retry-dot">{retry.state === 'done' ? <Icon name="check" size={26} strokeWidth={3.4} /> : retry.days}</span>
              <small>{retry.days} day{retry.days === 1 ? '' : 's'}</small>
            </li>
          ))}
          <li className="retry mastered">
            <span className="retry-dot"><Emblem topicId="equations" strand="algebra" layers={4} size={78} /></span>
            <small>Mastered</small>
          </li>
        </ol>
      </div>
    </Frame>
  );
}

// Carousel order alternates night and paper and follows a lesson: the
// idea, the map and its four stages, Watch (explainers), Master (retries).
// `alt` is the image description for the platform's alt-text field; the
// build writes them to design/social/alt-text.md.
const DISCLAIMER = 'Independent revision tool, not affiliated with AQA.';
export const POSTS = [
  {
    id: 'learn',
    file: '01-learn-it-play-with-it',
    Component: LearnPost,
    alt: (facts) => `GCSE Study Desk advert on a dark navy background. An isometric board carries four rising tiles in blue, purple, orange and lime. Headline: Learn it. Play with it. Fix what you missed. Three course cards: Maths Foundation, ${number(facts.questions.foundation)} questions; Maths Higher, ${number(facts.questions.higher)} questions; English Language, both papers. Free beta at ${facts.url}. ${DISCLAIMER}`,
  },
  {
    id: 'map',
    file: '02-every-topic-is-a-level',
    Component: MapPost,
    alt: (facts) => `GCSE Study Desk advert on a light background. Headline: Every topic is a level you can replay. A path of isometric level tiles climbs from Place Value, mastered with three stars, through Factors and Fractions to Percentages, marked Next, and Decimals, not tried yet. Every level has four stages: Watch, Learn, Practise and Master. Stars come only from marked answers. No topic is locked. Free beta at ${facts.url}. ${DISCLAIMER}`,
  },
  {
    id: 'explainers',
    file: '03-explainers-that-ask-you',
    Component: ExplainerPost,
    alt: (facts) => `GCSE Study Desk advert on a dark background. Headline: Explainers that stop and ask you. A chalkboard shows three quarters of 28 as a bar cut into 4 equal parts. A card from Pip, the round lime mascot, asks: How much goes into each of the 4 parts? Options: 4, 7, 12, 21. Interactive explainers: ${facts.explainers.foundation} in Foundation, ${facts.explainers.higher} in Higher, ${facts.explainers.english} in English. Free beta at ${facts.url}. ${DISCLAIMER}`,
  },
  {
    id: 'notebook',
    file: '04-misses-come-back',
    Component: NotebookPost,
    alt: (facts) => `GCSE Study Desk advert on a light background. Headline: Misses come back until they stick. A mistake notebook card for Solve 3x + 5 = 20 shows the answer x = 6 marked wrong, the correct answer x = 5, the worked method, and the reason chosen for the miss: arithmetic slip. The question comes back after 1, 3, 7 and 21 days, then counts as mastered. Free beta at ${facts.url}. ${DISCLAIMER}`,
  },
];
