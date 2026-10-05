import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import IsoTile from './circuit/IsoTile.jsx';
import Icon from './circuit/Icon.jsx';
import Pip from './circuit/Pip.jsx';
import { Stars } from './circuit/bits.jsx';
import { StrandBadge } from './circuit/Emblem.jsx';
import { hueVar, starsFor, strandInfo } from './circuit/palette.js';
import { masteryStage } from './next-step.js';
import { AppHeader } from './AppShell.jsx';
import { AskPipButton } from './PipChat.jsx';

// Learn tab: the course map. Each strand/section is a unit you can fold
// away; the unit holding the suggested next topic starts open, so a phone
// shows one unit's path instead of the whole course. Every tile stays in
// the DOM (folded units are `hidden`), so search and tests see them all.
// Nothing is locked: revision is free-roam, the map just marks the
// suggested next tile. Stars come from marked answers.

const X_WIDE = [50, 76, 50, 24];

function tileState(topic, recommendedId) {
  if (topic.id === recommendedId) return 'current';
  const stage = masteryStage(topic.accuracy, topic.answered);
  if (stage.id === 'mastered') return 'mastered';
  if (topic.completed) return 'done';
  if (stage.id !== 'new') return 'started';
  return 'new';
}

function PathTrace({ topics, states }) {
  const ROW = 100;
  const height = topics.length * ROW;
  const pts = topics.map((_, index) => [X_WIDE[index % 4], index * ROW + 35]);
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

function tileLabel(topic, state) {
  const stage = masteryStage(topic.accuracy, topic.answered);
  const stars = starsFor(topic.accuracy, topic.answered);
  return `${topic.name}. ${stage.text}${topic.accuracy != null ? `, ${topic.accuracy}% accuracy` : ''}. ${stars} of 3 stars.${topic.completed ? ' Lesson completed.' : ''}${state === 'current' ? ' Suggested next.' : ''}`;
}

function World({ group, index, recommendedId, learnBase, open, onToggle }) {
  const info = strandInfo(group.id);
  const topics = group.topics || [];
  const states = topics.map((topic) => tileState(topic, recommendedId));
  const stars = topics.reduce((sum, topic) => sum + starsFor(topic.accuracy, topic.answered), 0);
  const completed = topics.filter((topic) => topic.completed).length;
  const hue = info.hue;
  const bodyId = `world-body-${group.id}`;
  return (
    <section
      className={`panel strand-panel world${open ? ' open' : ''}`}
      id={`world-${group.id}`}
      style={{ '--strand': hueVar(hue), '--strand-alt': hueVar(info.alt), '--rows': topics.length }}
      aria-labelledby={`world-title-${group.id}`}
    >
      <h2 className="world-heading">
        <button type="button" className="world-toggle" aria-expanded={open} aria-controls={bodyId} onClick={onToggle} id={`world-title-${group.id}`}>
          <span className="world-badge" aria-hidden="true"><StrandBadge strand={group.id} size={44} /></span>
          <span className="world-copy">
            <span className="world-unit">Unit {index + 1}</span>
            <span className="world-name">{group.name}</span>
            <span className="world-stats">
              <span><Icon name="star" size={14} /> {stars}/{topics.length * 3}</span>
              <span><Icon name="check" size={14} strokeWidth={3} /> {completed}/{topics.length} lessons</span>
            </span>
          </span>
          <span className="world-chevron" aria-hidden="true"><Icon name="chevronDown" size={22} strokeWidth={2.4} /></span>
        </button>
      </h2>
      <div className="world-meter" role="img" aria-label={`${stars} of ${topics.length * 3} stars earned`}>
        <span style={{ width: `${topics.length ? (stars / (topics.length * 3)) * 100 : 0}%` }} />
      </div>
      <div className="world-body" id={bodyId} hidden={!open}>
        {group.blurb ? <p className="sub world-blurb">{group.blurb}</p> : null}
        <div className="map-path-wrap">
          <PathTrace topics={topics} states={states} />
          <ol className="map-path">
            {topics.map((topic, nodeIndex) => {
              const state = states[nodeIndex];
              const stage = masteryStage(topic.accuracy, topic.answered);
              const topicStars = starsFor(topic.accuracy, topic.answered);
              return (
                <li
                  key={topic.id}
                  className={`map-node node-${state}`}
                  style={{ '--x': `${X_WIDE[nodeIndex % 4]}%`, '--i': nodeIndex }}
                >
                  <Link to={`${learnBase}/${topic.id}`} className="topic-card map-tile" aria-label={tileLabel(topic, state)}>
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
      </div>
    </section>
  );
}

export default function CourseMap({
  groups = [],
  title,
  sub,
  recommendedId = null,
  learnBase = '/learn',
  bossHref = '/practice',
  bossLabel = 'Sit a timed paper',
  tabs = null,
  searchLabel = 'Find a topic',
}) {
  const allTopics = useMemo(() => groups.flatMap((group) => (group.topics || []).map((topic) => ({ ...topic, group }))), [groups]);
  const recommended = allTopics.find((topic) => topic.id === recommendedId) || null;
  const startGroup = recommended?.group.id || groups[0]?.id || null;
  const [open, setOpen] = useState(() => new Set(startGroup ? [startGroup] : []));
  const [query, setQuery] = useState('');
  const totalStars = allTopics.reduce((sum, topic) => sum + starsFor(topic.accuracy, topic.answered), 0);
  const completed = allTopics.filter((topic) => topic.completed).length;
  const needle = query.trim().toLowerCase();
  const matches = needle ? allTopics.filter((topic) => `${topic.name} ${topic.group.name}`.toLowerCase().includes(needle)) : null;

  function toggle(id) {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="course-map">
      <AppHeader />
      <header className="page-title-row">
        <h1>{title}</h1>
        <AskPipButton iconOnly context={{ kind: 'topic', label: title }} className="btn" mood="happy" />
      </header>
      {tabs}
      <p className="sub page-intro">{sub}</p>

      <div className="learn-tools">
        <label className="learn-search">
          <Icon name="search" size={20} />
          <span className="sr-only">{searchLabel}</span>
          <input type="search" value={query} placeholder={searchLabel} onChange={(event) => setQuery(event.target.value)} autoComplete="off" />
        </label>
        <p className="map-summary-line" aria-label="Map progress">
          <span><Icon name="star" size={16} /> <b>{totalStars}</b>/{allTopics.length * 3} stars</span>
          <span><Icon name="check" size={16} strokeWidth={3} /> <b>{completed}</b>/{allTopics.length} lessons</span>
        </p>
      </div>

      {matches ? (
        <section className="search-results" aria-live="polite" aria-label="Search results">
          {matches.length ? (
            <ul>
              {matches.map((topic) => (
                <li key={topic.id}>
                  <Link to={`${learnBase}/${topic.id}`} className="search-result" style={{ '--strand': hueVar(strandInfo(topic.group.id).hue) }}>
                    <StrandBadge strand={topic.group.id} size={32} />
                    <span className="search-result-copy">
                      <b>{topic.name}</b>
                      <span>{topic.group.name}</span>
                    </span>
                    <Stars count={starsFor(topic.accuracy, topic.answered)} size={14} label={false} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sub">Nothing matches “{query.trim()}”. Try a shorter word, or ask Pip.</p>
          )}
        </section>
      ) : recommended ? (
        <Link className="map-next" to={`${learnBase}/${recommended.id}`}>
          <span className="map-next-art" aria-hidden="true">
            <IsoTile topicId={recommended.id} strand={recommended.group.id} hue={strandInfo(recommended.group.id).hue} state="current" stage={masteryStage(recommended.accuracy, recommended.answered).id} size={72} />
          </span>
          <span className="map-next-copy">
            <span className="map-next-eyebrow">{recommended.accuracy == null ? 'Up next' : 'Worth another go'} · {recommended.group.name}</span>
            <b>{recommended.name}</b>
          </span>
          <span className="btn btn-go small" aria-hidden="true">{recommended.accuracy == null ? 'Start' : 'Open'}</span>
        </Link>
      ) : null}

      <div className="map-units" hidden={Boolean(matches)}>
        {groups.map((group, index) => (
          <World
            key={group.id}
            group={group}
            index={index}
            recommendedId={recommendedId}
            learnBase={learnBase}
            open={open.has(group.id)}
            onToggle={() => toggle(group.id)}
          />
        ))}
      </div>

      <section className="boss-card" aria-labelledby="boss-title">
        <IsoTile topicId="boss" hue="purple" state="boss" size={120} beam />
        <div>
          <p className="eyebrow">Boss level</p>
          <h2 id="boss-title">{bossLabel}</h2>
          <p className="sub">Mix everything from the map under real exam timing. Every miss lands in your notebook for a retry.</p>
        </div>
        <Link className="btn btn-go" to={bossHref}>Go to Practice <Icon name="arrowRight" size={18} /></Link>
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

// English: Skills and Texts share the Learn tab.
export function LearnTabs({ current = 'skills' }) {
  return (
    <nav className="learn-tabs segmented" aria-label="Learn">
      <Link to="/learn" className={`segment${current === 'skills' ? ' on' : ''}`} aria-current={current === 'skills' ? 'page' : undefined}>Skills</Link>
      <Link to="/texts" className={`segment${current === 'texts' ? ' on' : ''}`} aria-current={current === 'texts' ? 'page' : undefined}>Texts</Link>
    </nav>
  );
}
