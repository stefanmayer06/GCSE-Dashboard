import { Link } from 'react-router-dom';
import IsoTile from './circuit/IsoTile.jsx';
import Icon from './circuit/Icon.jsx';
import Pip from './circuit/Pip.jsx';
import { Stars } from './circuit/bits.jsx';
import { StrandScene } from './circuit/Scenes.jsx';
import { StrandBadge } from './circuit/Emblem.jsx';
import { hueVar, starsFor, strandInfo } from './circuit/palette.js';
import { masteryStage } from './next-step.js';

// Course map — each strand/section is a "world" with a winding path of
// isometric level tiles joined by circuit traces (Brilliant path × Shapez
// belts). Nothing is locked: revision is free-roam, the map just shows the
// suggested next tile with a light beam. Tiles show emblem layers + stars
// earned from marked answers, so replaying a topic visibly upgrades it.

const X_WIDE = [50, 76, 50, 24];
const ROW = 176;

function tileState(topic, recommendedId) {
  if (topic.id === recommendedId) return 'current';
  const stage = masteryStage(topic.accuracy, topic.answered);
  if (stage.id === 'mastered') return 'mastered';
  if (topic.completed) return 'done';
  if (stage.id !== 'new') return 'started';
  return 'new';
}

function PathTrace({ topics, states }) {
  const height = topics.length * ROW;
  const pts = topics.map((_, index) => [X_WIDE[index % 4], index * ROW + 62]);
  return (
    <svg className="map-trace" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {pts.slice(1).map(([x, y], index) => {
        const [px, py] = pts[index];
        const live = states[index] !== 'new' && states[index + 1] !== 'new';
        const d = `M${px} ${py} L${px} ${py + ROW * 0.42} L${x} ${y - ROW * 0.18} L${x} ${y}`;
        return (
          <g key={index}>
            <path d={d} className="trace-base" vectorEffect="non-scaling-stroke" />
            {live ? <path d={d} className="trace-live" vectorEffect="non-scaling-stroke" /> : null}
          </g>
        );
      })}
    </svg>
  );
}

function World({ group, index, recommendedId, learnBase }) {
  const info = strandInfo(group.id);
  const topics = group.topics || [];
  const states = topics.map((topic) => tileState(topic, recommendedId));
  const stars = topics.reduce((sum, topic) => sum + starsFor(topic.accuracy, topic.answered), 0);
  const completed = topics.filter((topic) => topic.completed).length;
  const hue = info.hue;
  return (
    <section className="panel strand-panel world" id={`world-${group.id}`} style={{ '--strand': hueVar(hue), '--strand-alt': hueVar(info.alt) }} aria-labelledby={`world-title-${group.id}`}>
      <header className="world-head">
        <div className="world-art"><StrandScene strand={group.id} /></div>
        <div className="world-copy">
          <p className="eyebrow">Unit {index + 1}</p>
          <h2 id={`world-title-${group.id}`}>{group.name}</h2>
          {group.blurb ? <p className="sub">{group.blurb}</p> : null}
          <div className="world-stats">
            <span className="world-stat"><Icon name="star" size={16} /> {stars}/{topics.length * 3} stars</span>
            <span className="world-stat"><Icon name="check" size={16} strokeWidth={3} /> {completed}/{topics.length} lessons</span>
          </div>
          <div className="world-meter" role="img" aria-label={`${stars} of ${topics.length * 3} stars earned`}>
            <span style={{ width: `${topics.length ? (stars / (topics.length * 3)) * 100 : 0}%` }} />
          </div>
        </div>
      </header>
      <div className="map-path-wrap" style={{ height: topics.length * ROW + 10 }}>
        <PathTrace topics={topics} states={states} />
        <ol className="map-path">
          {topics.map((topic, nodeIndex) => {
            const state = states[nodeIndex];
            const stage = masteryStage(topic.accuracy, topic.answered);
            const topicStars = starsFor(topic.accuracy, topic.answered);
            const label = `${topic.name}. ${stage.text}${topic.accuracy != null ? `, ${topic.accuracy}% accuracy` : ''}. ${topicStars} of 3 stars.${topic.completed ? ' Lesson completed.' : ''}${state === 'current' ? ' Suggested next.' : ''}`;
            return (
              <li
                key={topic.id}
                className={`map-node node-${state}`}
                style={{ '--x': `${X_WIDE[nodeIndex % 4]}%`, top: nodeIndex * ROW }}
              >
                <Link to={`${learnBase}/${topic.id}`} className="topic-card map-tile" aria-label={label}>
                  {state === 'current' ? (
                    <span className="map-bubble" aria-hidden="true">{topic.accuracy == null ? 'Start' : 'Next'}</span>
                  ) : null}
                  <IsoTile topicId={topic.id} strand={group.id} hue={hue} state={state} stage={stage.id} size={136} />
                  <span className="map-label" aria-hidden="true">
                    <span className="topic-name">{topic.name}</span>
                    <span className="map-meta">
                      <Stars count={topicStars} size={13} label={false} />
                      {topic.accuracy != null ? <span className="map-acc">{topic.accuracy}%</span> : <span className="map-acc new">new</span>}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default function CourseMap({ groups = [], title, sub, recommendedId = null, learnBase = '/learn', bossHref = '/practice', bossLabel = 'Sit a timed paper' }) {
  const allTopics = groups.flatMap((group) => group.topics || []);
  const totalStars = allTopics.reduce((sum, topic) => sum + starsFor(topic.accuracy, topic.answered), 0);
  const built = allTopics.filter((topic) => masteryStage(topic.accuracy, topic.answered).id !== 'new').length;
  const completed = allTopics.filter((topic) => topic.completed).length;
  return (
    <div className="course-map">
      <header className="page-head map-head">
        <div>
          <p className="eyebrow">Your map</p>
          <h1>{title}</h1>
          <p className="sub">{sub}</p>
        </div>
        <div className="map-summary" aria-label="Map progress">
          <div><b>{totalStars}</b><span>of {allTopics.length * 3} stars</span></div>
          <div><b>{built}</b><span>emblems started</span></div>
          <div><b>{completed}</b><span>lessons done</span></div>
        </div>
      </header>

      <nav className="world-jump" aria-label="Jump to a unit">
        {groups.map((group) => (
          <a key={group.id} href={`#world-${group.id}`} className="world-chip" style={{ '--strand': hueVar(strandInfo(group.id).hue) }}>
            <StrandBadge strand={group.id} size={26} />
            <span>{group.name}</span>
          </a>
        ))}
      </nav>

      <div className="map-legend" aria-label="What the tiles mean">
        <span><i className="lg lg-new" /> Blueprint: not tried</span>
        <span><i className="lg lg-started" /> Emblem layers: built from your marks</span>
        <span><i className="lg lg-done" /> Tick: lesson done</span>
        <span><i className="lg lg-mastered" /> Volt: mastered</span>
      </div>

      {groups.map((group, index) => (
        <World key={group.id} group={group} index={index} recommendedId={recommendedId} learnBase={learnBase} />
      ))}

      <section className="boss-card" aria-labelledby="boss-title">
        <IsoTile topicId="boss" hue="purple" state="boss" size={120} beam />
        <div>
          <p className="eyebrow">Boss level</p>
          <h2 id="boss-title">{bossLabel}</h2>
          <p className="sub">Mix everything from the map under real exam timing. Every miss lands in your notebook for a scheduled retry.</p>
        </div>
        <Link className="btn btn-go" to={bossHref}>Enter the exam hall →</Link>
        <Pip mood="wow" size={70} className="boss-pip" />
      </section>
    </div>
  );
}

// Suggested tile: the weakest practised topic under 70%, otherwise the
// first topic not tried yet. Mirrors next-step.js priorities 3 and 4.
export function recommendTile(groups = []) {
  const topics = groups.flatMap((group) => group.topics || []);
  const weak = topics
    .filter((topic) => topic.accuracy != null && topic.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)[0];
  if (weak) return weak.id;
  return topics.find((topic) => topic.accuracy == null)?.id || null;
}
