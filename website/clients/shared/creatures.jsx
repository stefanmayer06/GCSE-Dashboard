import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Critter from './circuit/Critter.jsx';
import Icon from './circuit/Icon.jsx';
import { EvolutionDialog } from './Milestones.jsx';
import {
  MAX_TIER,
  collectorRank,
  critterById,
  critterCollection,
  newEvolutions,
  readSeen,
  remainingCopy,
  writeSeen,
} from './critters.js';

// Study creatures are the one progression system. Every other reward the
// app used to show (XP, levels, rank names, badge shelves) is folded into
// them: work feeds a creature's evidence track and the creature grows.
// Tiers are recomputed from server evidence on every render, so nothing
// here can grant progress. The provider also plays evolutions the moment
// they happen, on whichever screen the learner is.

const CreatureContext = createContext(null);

// Starter eggs offered on the welcome screen: each hatches from a different
// kind of real work, so the choice sets the learner's first goal.
export const STARTERS = ['ember', 'quill', 'tock'];

const partnerKey = (userId) => `gcse-partner:${encodeURIComponent(userId || 'guest')}`;

export function readPartner(userId) {
  try {
    const id = localStorage.getItem(partnerKey(userId));
    return id && critterById(id) ? id : null;
  } catch {
    return null;
  }
}

export function writePartner(userId, id) {
  try {
    if (critterById(id)) localStorage.setItem(partnerKey(userId), id);
  } catch {
    // Display preference only: without storage the default partner shows.
  }
}

// Without a chosen partner, the most evolved creature keeps you company.
function defaultPartner(states) {
  return [...states].sort((a, b) => (b.tier - a.tier) || (b.toNext - a.toNext) || (a.id === 'quill' ? -1 : 1))[0] || null;
}

function closestToEvolving(states) {
  return states
    .filter((state) => state.next != null && state.value > 0)
    .sort((a, b) => b.toNext - a.toNext)[0]
    || states.filter((state) => state.next != null).sort((a, b) => b.toNext - a.toNext)[0]
    || null;
}

export function CreatureProvider({ subject, userId, progress = null, mistakes = null, topicCount = 0, children }) {
  const navigate = useNavigate();
  const states = useMemo(
    () => critterCollection({ progress, mistakes: Array.isArray(mistakes) ? mistakes : [], topicCount }),
    [progress, mistakes, topicCount],
  );
  const byId = useMemo(() => Object.fromEntries(states.map((state) => [state.id, state])), [states]);
  const rank = useMemo(() => collectorRank(states), [states]);
  const signature = states.map((state) => state.tier).join('');
  // Only diff once every evidence source has loaded, so data that is still
  // arriving never looks like a brand-new evolution.
  const ready = Boolean(progress && Array.isArray(mistakes) && topicCount > 0);
  const [queue, setQueue] = useState([]);
  const [fresh, setFresh] = useState([]);
  const [chosen, setChosen] = useState(() => readPartner(userId));
  // Another celebration on screen (a finished lesson) holds evolutions back
  // until it closes, so two dialogs never stack.
  const [holds, setHolds] = useState(0);

  useEffect(() => {
    setChosen(readPartner(userId));
    setQueue([]);
    setFresh([]);
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    const seen = readSeen(subject, userId);
    const events = seen ? newEvolutions(seen, states) : [];
    writeSeen(subject, userId, states);
    if (events.length) {
      setQueue((list) => [...list, ...events]);
      setFresh((list) => [...new Set([...list, ...events.map((event) => event.id)])]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signature, subject, userId]);

  const setPartner = useCallback((id) => {
    writePartner(userId, id);
    setChosen(id);
  }, [userId]);

  const clearFresh = useCallback((id) => setFresh((list) => list.filter((item) => item !== id)), []);

  const partner = (chosen && byId[chosen]) || defaultPartner(states);
  const value = useMemo(() => ({
    ready,
    states,
    byId,
    rank,
    partner,
    partnerChosen: Boolean(chosen),
    setPartner,
    closest: closestToEvolving(states),
    fresh,
    clearFresh,
    mistakes: Array.isArray(mistakes) ? mistakes : [],
    topicCount,
    setHolds,
  }), [ready, states, byId, rank, partner, chosen, setPartner, fresh, clearFresh, mistakes, topicCount]);

  const event = holds > 0 ? null : queue[0] || null;
  return (
    <CreatureContext.Provider value={value}>
      {children}
      {event && byId[event.id] ? (
        <EvolutionDialog
          event={event}
          state={byId[event.id]}
          count={queue.length}
          onNext={() => setQueue((list) => list.slice(1))}
          onClose={() => setQueue([])}
          onMeet={(id) => {
            setQueue([]);
            clearFresh(id);
            navigate(`/creatures?open=${encodeURIComponent(id)}`);
          }}
        />
      ) : null}
    </CreatureContext.Provider>
  );
}

const EMPTY = {
  ready: false,
  states: [],
  byId: {},
  rank: { total: 0, max: 32, name: 'Egg hunter', next: null },
  partner: null,
  partnerChosen: false,
  setPartner: () => {},
  closest: null,
  fresh: [],
  clearFresh: () => {},
  mistakes: [],
  topicCount: 0,
  setHolds: () => {},
};

export function useCreatures() {
  return useContext(CreatureContext) || EMPTY;
}

// Keeps evolution dialogs waiting while the calling celebration is shown.
export function useHoldEvolutions(active = true) {
  const { setHolds } = useCreatures();
  useEffect(() => {
    if (!active) return undefined;
    setHolds((count) => count + 1);
    return () => setHolds((count) => Math.max(0, count - 1));
  }, [active, setHolds]);
}

export function formName(state) {
  if (!state) return '';
  return state.tier > 0 ? state.critter.forms[state.tier - 1] : `${state.critter.family} egg`;
}

// "Grows from marked answers": the evidence track in a learner's words.
export function trackCopy(state) {
  return state ? state.critter.track.toLowerCase() : '';
}

// The progress row under a creature: "83 / 150" plus what is left.
export function GrowthMeter({ state, light = false }) {
  if (!state) return null;
  const done = state.next == null;
  const label = done
    ? 'Fully evolved'
    : state.critter.id === 'rexam'
      ? `${state.value}% of ${state.next}%`
      : `${state.value} / ${state.next}`;
  return (
    <div className={`growth-meter${light ? ' light' : ''}`}>
      <div className="growth-meter-copy">
        <span>{done ? `${formName(state)} is fully evolved` : remainingCopy(state)}</span>
        <b>{label}</b>
      </div>
      <span className="growth-meter-track" aria-hidden="true">
        <i style={{ width: `${Math.round((done ? 1 : state.toNext) * 100)}%` }} />
      </span>
    </div>
  );
}

export function PartnerAvatar({ size = 44, to = '/me', className = '' }) {
  const { partner } = useCreatures();
  const label = partner ? `Me. Your partner is ${formName(partner)}` : 'Me';
  return (
    <Link to={to} className={`partner-avatar ${className}`.trim()} aria-label={label} style={{ '--size': `${size}px` }}>
      {partner ? <Critter id={partner.id} tier={partner.tier} progress={partner.toNext} size={size} viewBox="14 20 92 92" /> : <Icon name="user" size={22} />}
    </Link>
  );
}

function plural(count, one, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function gainLabel(id, delta, after) {
  if (id === 'ember') return `Streak +${plural(delta, 'day')}`;
  if (id === 'quill') return `+${plural(delta, 'marked answer')}`;
  if (id === 'tock') return `+${plural(delta, 'timed paper')}`;
  if (id === 'rexam') return `Paper average ${after.value}%`;
  if (id === 'tortile') return `+${plural(delta, 'topic')} explored`;
  if (id === 'prismo') return `+${plural(delta, '3-star topic')}`;
  if (id === 'redo') return `+${plural(delta, 'mistake')} fixed`;
  if (id === 'memmoth') return `+${plural(delta, 'memory check')}`;
  return `+${delta}`;
}

// What a finished lesson, round or paper fed. Compares the creature states
// for the progress before and after the work; only real evidence moves.
export function creatureGains(before, after, { mistakes = [], topicCount = 0, mistakesAfter = null } = {}) {
  if (!after) return [];
  const prior = critterCollection({ progress: before, mistakes, topicCount });
  const next = critterCollection({ progress: after, mistakes: mistakesAfter ?? mistakes, topicCount });
  return next
    .map((state, index) => {
      const old = prior[index];
      const delta = Math.round((state.value - old.value) * 100) / 100;
      const evolved = state.tier > old.tier;
      if (!(delta > 0) && !evolved) return null;
      return { state, before: old, delta, evolved, label: gainLabel(state.id, delta, state) };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.evolved) - Number(a.evolved) || (b.state.id === 'quill') - (a.state.id === 'quill'));
}

export function CreatureGains({ before, after, mistakesAfter = null, title = 'Your creatures grew', compact = false, dark = false }) {
  const { mistakes, topicCount } = useCreatures();
  const gains = useMemo(
    () => creatureGains(before, after, { mistakes, topicCount, mistakesAfter }),
    [before, after, mistakes, topicCount, mistakesAfter],
  );
  if (!after) return null;
  if (!gains.length) {
    return (
      <div className={`creature-gains empty${dark ? ' dark' : ''}`} aria-live="polite">
        <p>Every marked answer feeds Quillby. Keep going and your creatures will grow.</p>
      </div>
    );
  }
  const shown = compact ? gains.slice(0, 2) : gains;
  return (
    <section className={`creature-gains${dark ? ' dark' : ''}`} aria-live="polite" aria-label={title}>
      {title ? <p className="creature-gains-title">{title}</p> : null}
      <ul>
        {shown.map(({ state, label, evolved, before: old }) => (
          <li key={state.id} className={evolved ? 'evolved' : ''}>
            <Critter id={state.id} tier={state.tier} progress={state.toNext} size={60} />
            <div className="creature-gain-copy">
              <strong>{evolved ? (old.tier === 0 ? `${state.critter.family} hatched into ${formName(state)}!` : `${formName(old)} evolved into ${formName(state)}!`) : formName(state)}</strong>
              <span className="creature-gain-label">{label}</span>
              {state.tier < MAX_TIER ? (
                <span className="growth-meter-track" aria-hidden="true"><i style={{ width: `${Math.round(state.toNext * 100)}%` }} /></span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
