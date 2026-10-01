// Design-doc art — renders every Circuit graphic (and the explainer
// library summary) for website/design/design-doc.html.
// Run through: npm run design:doc
import { renderToStaticMarkup } from 'react-dom/server';
import { CircuitHero, StrandScene, SubjectScene } from '../../clients/shared/circuit/Scenes.jsx';
import Emblem from '../../clients/shared/circuit/Emblem.jsx';
import IsoTile from '../../clients/shared/circuit/IsoTile.jsx';
import Pip from '../../clients/shared/circuit/Pip.jsx';
import { CritterBadge, CRITTER_ART_IDS } from '../../clients/shared/circuit/Critter.jsx';
import { CRITTERS } from '../../clients/shared/critters.js';
import Icon, { ICON_NAMES } from '../../clients/shared/circuit/Icon.jsx';
import { Stars, WeekStrip, ProgressRing, SegmentBar, HudChip } from '../../clients/shared/circuit/bits.jsx';
import { HUES, STRANDS, SUBJECTS } from '../../clients/shared/circuit/palette.js';
import { compile, ELEMENT_TYPES, CHECKPOINT_KINDS } from '../../clients/shared/explainer/engine.js';
import { MATHS_EXPLAINERS } from '../../clients/shared/explainer/library/maths/index.js';
import { ENGLISH_EXPLAINERS } from '../../clients/shared/explainer/library/english/index.js';

let n = 0;
const render = (element) => renderToStaticMarkup(element, { identifierPrefix: `doc${(n += 1)}-` });

const STAGES = ['new', 'learning', 'developing', 'secure', 'mastered'];
const TILE_STATES = ['new', 'current', 'started', 'done', 'mastered', 'boss'];

export const DOC = {
  hues: HUES,
  strands: Object.fromEntries(Object.entries(STRANDS).map(([id, row]) => [id, { ...row }])),
  subjects: SUBJECTS,
  elementTypes: ELEMENT_TYPES,
  checkpointKinds: CHECKPOINT_KINDS,
  art: {
    hero: render(<CircuitHero />),
    subjects: Object.fromEntries(['maths', 'maths-higher', 'english'].map((id) => [id, render(<SubjectScene subject={id} />)])),
    strandScenes: Object.fromEntries(Object.keys(STRANDS).map((id) => [id, render(<StrandScene strand={id} />)])),
    emblems: Object.fromEntries(Object.keys(STRANDS).map((id) => [id, STAGES.map((stage) => render(<Emblem topicId={`${id}-doc`} strand={id} stage={stage} size={64} />))])),
    tiles: TILE_STATES.map((state, index) => ({
      state,
      svg: render(<IsoTile topicId={`doc-tile-${index}`} strand={['number', 'algebra', 'geometry', 'reading', 'writing', 'statistics'][index]} hue={['blue', 'purple', 'green', 'tangerine', 'rose', 'coral'][index]} state={state} stage={STAGES[Math.min(4, index)]} size={120} />),
    })),
    pip: ['happy', 'think', 'cheer', 'wow', 'calm'].map((mood) => ({ mood, svg: render(<Pip mood={mood} size={84} />) })),
    critters: CRITTER_ART_IDS.map((id) => {
      const critter = CRITTERS.find((row) => row.id === id);
      return {
        id,
        family: critter.family,
        track: critter.track,
        forms: critter.forms,
        badges: [0, 1, 2, 3, 4].map((tier) => render(<CritterBadge id={id} tier={tier} toNext={0.66} size={96} />)),
      };
    }),
    icons: ICON_NAMES.map((name) => ({ name, svg: render(<Icon name={name} size={28} />) })),
    stars: [0, 1, 2, 3].map((count) => render(<Stars count={count} size={20} />)),
    week: render(<WeekStrip days={['done', 'done', 'rest', 'done', 'open', 'open', 'open']} todayIndex={4} />),
    ring: render(<ProgressRing value={64} size={84} stroke={8} label="64 percent" />),
    segments: render(<SegmentBar total={4} done={2} current={2} label="Lesson stages" />),
    hud: render(<>
      <HudChip icon="flame" tone="flame" value={6} label="days" />
      <HudChip icon="gem" tone="gem" value={420} label="XP" />
      <HudChip icon="bolt" tone="bolt" value={4} label="lvl" />
    </>),
  },
  library: [...MATHS_EXPLAINERS.map((s) => ['maths', s]), ...ENGLISH_EXPLAINERS.map((s) => ['english', s])].map(([subject, script]) => {
    const compiled = compile(script);
    return {
      subject,
      id: script.id,
      title: script.title,
      topics: script.topics,
      board: script.board || 'night',
      hue: script.hue,
      parts: compiled.chapters.map((chapter) => chapter.title),
      checkpoints: compiled.checkpoints.map((cp) => cp.kind),
      seconds: Math.round(compiled.duration),
      sandbox: (script.scenes || []).some((scene) => scene.play?.length),
    };
  }),
};
