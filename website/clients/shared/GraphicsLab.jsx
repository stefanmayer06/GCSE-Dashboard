import { useState } from 'react';
import Emblem, { StrandBadge } from './circuit/Emblem.jsx';
import IsoTile from './circuit/IsoTile.jsx';
import Icon, { ICON_NAMES } from './circuit/Icon.jsx';
import Pip from './circuit/Pip.jsx';
import { CircuitHero, StrandScene, SubjectScene } from './circuit/Scenes.jsx';
import { Confetti, HudChip, ProgressRing, SegmentBar, Stars, WeekStrip } from './circuit/bits.jsx';
import { STRANDS } from './circuit/palette.js';
import ExplainerPlayer from './explainer/Player.jsx';
import { MATHS_EXPLAINERS } from './explainer/library/maths/index.js';
import { ENGLISH_EXPLAINERS } from './explainer/library/english/index.js';

const ALL_EXPLAINERS = [...MATHS_EXPLAINERS, ...ENGLISH_EXPLAINERS];

// Graphics lab — a living catalogue of every Circuit graphic, reachable at
// /<subject>/lab (signed in, not in the nav). Use it to eyeball new emblems,
// tiles and scenes in both themes before shipping them. See
// website/design/GRAPHICS.md.

const STAGES = ['new', 'learning', 'developing', 'secure', 'mastered'];
const TILE_STATES = ['new', 'current', 'started', 'done', 'mastered', 'boss'];

export default function GraphicsLab({ subject = 'maths' }) {
  const [burst, setBurst] = useState(0);
  const [video, setVideo] = useState(0);
  return (
    <div className="page lab-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Circuit design system</p>
          <h1>Graphics lab</h1>
          <p className="sub">Every custom graphic in one place. Toggle dark mode in the rail to check both themes.</p>
        </div>
      </header>

      <section className="lab-video">
        <h2>Explainers</h2>
        <label className="lab-pick">Script{' '}
          <select value={video} onChange={(event) => setVideo(Number(event.target.value))}>
            {ALL_EXPLAINERS.map((script, index) => <option key={script.id} value={index}>{script.title}</option>)}
          </select>
        </label>
        <ExplainerPlayer script={ALL_EXPLAINERS[video] || ALL_EXPLAINERS[0]} />
      </section>

      <section className="panel">
        <h2>Emblems · mastery layers</h2>
        <div className="lab-grid">
          {Object.keys(STRANDS).map((strand) => (
            <div key={strand} className="lab-row">
              <strong>{strand}</strong>
              {STAGES.map((stage) => <Emblem key={stage} topicId={`${strand}-demo`} strand={strand} stage={stage} size={64} title={`${strand} ${stage}`} />)}
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Isometric tiles</h2>
        <div className="lab-tiles">
          {TILE_STATES.map((state, index) => (
            <figure key={state}>
              <IsoTile topicId={`tile-${index}`} strand={['number', 'algebra', 'geometry', 'reading', 'writing', 'statistics'][index]} hue={['blue', 'purple', 'green', 'tangerine', 'rose', 'coral'][index]} state={state} stage={STAGES[Math.min(4, index)]} size={120} />
              <figcaption>{state}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Scenes</h2>
        <div className="lab-scenes">
          {['maths', 'maths-higher', 'english'].map((key) => <SubjectScene key={key} subject={key} title={`${key} scene`} />)}
        </div>
        <div className="lab-scenes small">
          {Object.keys(STRANDS).map((strand) => <StrandScene key={strand} strand={strand} title={`${strand} scene`} />)}
        </div>
        <CircuitHero title="Circuit hero" />
      </section>

      <section className="panel">
        <h2>Pip</h2>
        <div className="lab-row">
          {['happy', 'think', 'cheer', 'wow', 'calm'].map((mood) => <Pip key={mood} mood={mood} size={88} title={`Pip ${mood}`} />)}
        </div>
      </section>

      <section className="panel">
        <h2>Icons</h2>
        <div className="lab-icons">
          {ICON_NAMES.map((name) => (
            <span key={name}><Icon name={name} size={28} /><small>{name}</small></span>
          ))}
        </div>
      </section>

      <section className="panel lab-bits">
        <h2>Reward bits</h2>
        <div className="lab-row">
          <Stars count={0} /><Stars count={1} /><Stars count={2} /><Stars count={3} />
          <ProgressRing value={64} label="64 percent" />
          <span className="lab-night"><HudChip icon="flame" tone="flame" value={4} label="days" /><HudChip icon="gem" tone="gem" value={320} label="XP" /><HudChip icon="bolt" tone="bolt" value={3} label="lvl" /></span>
          {Object.keys(STRANDS).slice(0, 3).map((strand) => <StrandBadge key={strand} strand={strand} size={44} />)}
        </div>
        <SegmentBar total={6} done={3} current={3} />
        <WeekStrip days={['done', 'done', 'rest', 'done', 'open', 'open', 'open']} todayIndex={4} />
        <div style={{ position: 'relative', height: 60 }}>
          <button type="button" className="btn btn-go" onClick={() => setBurst((n) => n + 1)}>Burst confetti</button>
          {burst ? <Confetti key={burst} /> : null}
        </div>
        <p className="sub">Subject: {subject}</p>
      </section>
    </div>
  );
}
