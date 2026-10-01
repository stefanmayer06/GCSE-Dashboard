import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import Critter, { CritterBadge } from './circuit/Critter.jsx';
import { Confetti } from './circuit/bits.jsx';
import Icon from './circuit/Icon.jsx';
import {
  MAX_TIER,
  RANKS,
  collectorRank,
  critterCollection,
  newEvolutions,
  progressLabel,
  readSeen,
  remainingCopy,
  shareText,
  writeSeen,
} from './critters.js';

// Milestones are a creature collection. Eight study creatures, each fed by
// one real evidence track (streak, marked answers, timed papers, paper
// average, topics explored, 3-star topics, mistakes fixed, memory checks),
// hatch from eggs and evolve Bronze → Silver → Gold → Legend. Tap one to
// meet it, pet it, see its evolution line and the one action that grows it.
// Evolutions since the last visit replay as a celebration.

function formName(critter, tier) {
  return tier > 0 ? critter.forms[tier - 1] : `${critter.family} egg`;
}

function resolveHref(to, { learnBase, nextHref }) {
  if (to === 'learn') return learnBase;
  if (to === 'next') return nextHref || learnBase;
  return to;
}

// Dialogs render into <body>: the page wrapper keeps a transform from its
// entrance animation, which would pin position:fixed to the page instead of
// the viewport.
function Overlay({ children }) {
  return typeof document === 'undefined' ? children : createPortal(children, document.body);
}

// Focus trap + Escape + scroll lock + focus restore for the dialogs here.
function useDialog(onClose) {
  const firstRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const dialog = firstRef.current?.closest('[role="dialog"]');
      const controls = dialog?.querySelectorAll('button:not(:disabled), a[href]');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.setTimeout(() => {
        if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus();
      }, 0);
    };
  }, []);
  return firstRef;
}

function Meter({ value, legend = false }) {
  return (
    <span className={`critter-meter${legend ? ' is-full' : ''}`} aria-hidden="true">
      <i style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} />
    </span>
  );
}

function nextCopy(state) {
  const { critter, tier, next, value } = state;
  if (next == null) return 'Fully evolved. Legend rank';
  const verb = tier === 0 ? 'to hatch' : `to ${critter.forms[tier]}`;
  if (critter.id === 'rexam') return `${value}% of ${next}% ${verb}`;
  return `${progressLabel(state)} ${verb}`;
}

function speechLines(state) {
  const { critter, tier, value } = state;
  if (tier === 0) {
    return [
      'Something is wiggling in here…',
      critter.goal(state.next) + ' and I hatch!',
      'Tap again. I can hear you!',
    ];
  }
  const lines = [`Hi! I'm ${state.form}.`, `${critter.count(value)}. We did that together!`];
  if (state.next != null) lines.push(`${remainingCopy(state).replace(/\.$/, '')}!`);
  else lines.push('Legend rank. Nothing left to prove, but I still love a revision session.');
  return lines;
}

function CritterCard({ state, isNew, onOpen }) {
  const { critter, tier, rank, toNext } = state;
  return (
    <li>
      <button
        type="button"
        className={`critter-card rank-${rank.id}${isNew ? ' is-new' : ''}`}
        style={{ '--i': critter.id.length % 5 }}
        onClick={() => onOpen(state.id)}
      >
        {isNew ? <span className="critter-new">{tier === 1 ? 'Hatched!' : 'Evolved!'}</span> : null}
        <CritterBadge id={critter.id} tier={tier} toNext={toNext} size={104} />
        <span className="critter-card-name">{state.form}</span>
        <span className="critter-card-rank">{tier > 0 ? `${rank.name} · ` : ''}{critter.track}</span>
        <Meter value={toNext} legend={tier === MAX_TIER} />
        <span className="critter-card-next">{nextCopy(state)}</span>
      </button>
    </li>
  );
}

function Hearts() {
  return (
    <span className="critter-hearts" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width="20" height="20" style={{ '--i': i }}>
          {i % 2 ? (
            <path d="M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z" fill="var(--hue-volt)" stroke="var(--emblem-line)" strokeWidth="1.6" strokeLinejoin="round" />
          ) : (
            <path d="M12 20s-8-4.6-8-10.2A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.8C20 15.4 12 20 12 20z" fill="var(--hue-coral)" stroke="var(--emblem-line)" strokeWidth="1.6" strokeLinejoin="round" />
          )}
        </svg>
      ))}
    </span>
  );
}

function CritterDialog({ state, links, onClose, onShare }) {
  const titleId = useId();
  const closeRef = useDialog(onClose);
  const { critter, tier } = state;
  const [viewTier, setViewTier] = useState(tier);
  const [pets, setPets] = useState(0);
  const [joy, setJoy] = useState(false);
  const lines = speechLines(state);
  const line = lines[pets % lines.length];
  const href = resolveHref(critter.action.to, links);

  useEffect(() => {
    if (!pets) return undefined;
    setJoy(true);
    const timer = window.setTimeout(() => setJoy(false), 1100);
    return () => window.clearTimeout(timer);
  }, [pets]);

  return (
    <Overlay>
      <div className="modal-back" onClick={onClose}>
        <div
          className={`modal critter-dialog rank-${state.rank.id}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => event.stopPropagation()}
        >
          <button ref={closeRef} type="button" className="critter-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
          <div className="critter-stage">
            <p className="critter-speech" aria-live="polite">{line}</p>
            <button
              type="button"
              className="critter-pet"
              onClick={() => setPets((n) => n + 1)}
              aria-label={viewTier === 0 ? `Tap the ${critter.family} egg` : `Pet ${formName(critter, viewTier)}`}
            >
              <span key={pets} className={pets ? 'critter-pet-anim' : ''}>
                <Critter
                  id={critter.id}
                  tier={viewTier}
                  progress={state.toNext}
                  mood={joy && viewTier > 0 ? 'joy' : 'happy'}
                  size={176}
                />
              </span>
              {pets ? <Hearts key={pets} /> : null}
            </button>
          </div>
          <p className="eyebrow">{tier > 0 ? `${state.rank.name} rank · ` : ''}{critter.track}</p>
          <h3 id={titleId}>{viewTier === tier ? state.form : formName(critter, viewTier)}</h3>
          <p className="critter-lore">{critter.lore}</p>

          <div className="critter-progress">
            <div className="critter-progress-copy">
              <strong>{critter.count(state.value)}</strong>
              <span>{state.next == null ? 'Fully evolved' : tier === 0 ? `Hatches at ${state.next}${critter.id === 'rexam' ? '%' : ''}` : `Evolves at ${state.next}${critter.id === 'rexam' ? '%' : ''}`}</span>
            </div>
            <Meter value={state.toNext} legend={tier === MAX_TIER} />
            {state.next != null ? <p className="critter-remaining">{remainingCopy(state)}</p> : null}
          </div>

          <ol className="evo-chain" aria-label={`${critter.family} evolution line`}>
            {critter.forms.map((form, index) => {
              const formTier = index + 1;
              const reached = tier >= formTier;
              const at = state.tiers[index];
              const label = reached
                ? `${form}, ${RANKS[formTier].name} rank. Show this form`
                : `Locked evolution, ${RANKS[formTier].name} rank: ${critter.goal(at)}`;
              return (
                <li key={form} className={`evo-step${reached ? ' reached' : ' locked'}${viewTier === formTier ? ' viewing' : ''}`}>
                  <button type="button" onClick={() => reached && setViewTier(formTier)} aria-label={label} aria-disabled={!reached || undefined} aria-pressed={reached ? viewTier === formTier : undefined}>
                    <Critter id={critter.id} tier={formTier} size={62} silhouette={!reached} />
                    <span className="evo-name">{reached ? form : '???'}</span>
                    <span className={`evo-rank rank-${RANKS[formTier].id}`}>{RANKS[formTier].name}</span>
                    {!reached ? <span className="evo-goal">{critter.id === 'rexam' ? `${at}%` : at}</span> : null}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="modal-actions">
            {href ? <Link className="btn btn-go" to={href} onClick={onClose}>{critter.action.label} <Icon name="arrowRight" size={16} /></Link> : null}
            {tier > 0 ? <button type="button" className="btn" onClick={() => onShare(state)}>Share</button> : null}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function EvolutionDialog({ event, state, count, onNext, onClose, onMeet }) {
  const titleId = useId();
  const closeRef = useDialog(onClose);
  const [burst, setBurst] = useState(false);
  const { critter } = state;
  const hatched = event.from === 0;
  const fromName = formName(critter, event.from);
  const toName = formName(critter, event.to);

  useEffect(() => {
    setBurst(false);
    const timer = window.setTimeout(() => setBurst(true), 1500);
    return () => window.clearTimeout(timer);
  }, [event.id, event.to]);

  return (
    <Overlay>
      <div className="reward-backdrop">
        <div className="reward-dialog critter-evolve" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          {burst ? <Confetti /> : null}
          <button ref={closeRef} type="button" className="reward-close" onClick={onClose} aria-label="Close evolution">x</button>
          <div className="evolve-stage" key={`${event.id}-${event.to}`} aria-hidden="true">
            <span className="evolve-glow" />
            <span className="evolve-old"><Critter id={critter.id} tier={event.from} progress={1} size={168} /></span>
            <span className="evolve-new"><Critter id={critter.id} tier={event.to} mood="joy" size={168} /></span>
          </div>
          <div className="eyebrow">{hatched ? 'An egg hatched' : `${RANKS[event.to].name} rank reached`}</div>
          <h2 id={titleId}>{hatched ? `${critter.family} hatched into ${toName}!` : `${fromName} evolved into ${toName}!`}</h2>
          <p>{critter.count(state.value)}. {state.next == null ? 'That is Legend rank: fully evolved.' : remainingCopy(state)}</p>
          <div className="reward-dialog-actions">
            <button type="button" className="btn btn-primary" onClick={() => onMeet(critter.id)}>Meet {toName}</button>
            {count > 1 ? <button type="button" className="btn" onClick={onNext}>Next evolution ({count - 1})</button> : null}
          </div>
        </div>
      </div>
    </Overlay>
  );
}

function ShareCard({ state, subjectName, api, onClose }) {
  const titleId = useId();
  const closeRef = useDialog(onClose);
  const [copied, setCopied] = useState(false);
  const text = shareText(state, subjectName);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const milestone = `${state.id}-${state.tier}`;

  async function share() {
    try {
      await navigator.share({ title: 'GCSE Study Desk milestone', text });
      api?.track?.('milestone_shared', { milestone });
      onClose();
    } catch {
      // Dismissed share sheets throw. Copying is the fallback below.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      api?.track?.('milestone_shared', { milestone, channel: 'clipboard' });
    } catch {
      setCopied(false);
    }
  }

  return (
    <Overlay>
      <div className="modal-back" onClick={onClose}>
        <div className="modal share-card" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(event) => event.stopPropagation()}>
          <CritterBadge id={state.id} tier={state.tier} size={150} className="share-badge" title={`${state.form}, ${state.rank.name} rank badge`} />
          <h3 id={titleId}>{state.form}</h3>
          <p className="sub">{state.rank.name} rank · {subjectName} · {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="share-proof">{state.critter.count(state.value)}</p>
          <div className="modal-actions">
            {canShare && <button type="button" className="btn btn-primary" onClick={share}>Share</button>}
            <button type="button" className="btn" onClick={copy}>{copied ? 'Copied ✓' : 'Copy text'}</button>
            <button ref={closeRef} type="button" className="btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

export function MilestoneShelf({
  progress = null,
  mistakes = null,
  topicCount = 0,
  subject = 'maths',
  userId = null,
  subjectName = 'Study Desk',
  learnBase = '/learn',
  nextHref = null,
  api = null,
}) {
  const [openId, setOpenId] = useState(null);
  const [sharing, setSharing] = useState(null);
  const [queue, setQueue] = useState([]);
  const [fresh, setFresh] = useState([]);
  const states = useMemo(
    () => critterCollection({ progress, mistakes: mistakes || [], topicCount }),
    [progress, mistakes, topicCount],
  );
  const byId = useMemo(() => Object.fromEntries(states.map((state) => [state.id, state])), [states]);
  const rank = collectorRank(states);
  const signature = states.map((state) => state.tier).join('');
  // Only diff once every evidence source has loaded, so a notebook that is
  // still fetching never looks like a brand-new evolution.
  const ready = Boolean(progress && Array.isArray(mistakes) && topicCount > 0);

  useEffect(() => {
    if (!ready) return;
    const seen = readSeen(subject, userId);
    const events = seen ? newEvolutions(seen, states) : [];
    writeSeen(subject, userId, states);
    if (events.length) {
      setQueue(events);
      setFresh(events.map((event) => event.id));
    }
  }, [ready, signature, subject, userId]);

  const closest = states
    .filter((state) => state.next != null)
    .sort((a, b) => b.toNext - a.toNext)[0] || null;
  const links = { learnBase, nextHref };
  const open = openId ? byId[openId] : null;
  const event = queue[0] || null;

  return (
    <section className="panel critter-shelf" aria-labelledby="critters-title">
      <div className="critter-shelf-head">
        <div>
          <p className="eyebrow">Milestones</p>
          <h2 id="critters-title">Creature collection</h2>
          <p className="sub">Each creature is fed by one kind of real work. Marked answers, papers and fixed mistakes hatch and evolve them. Opening a page never does.</p>
        </div>
        <div className="collector" aria-label={`${rank.name}: ${rank.total} of ${rank.max} evolutions`}>
          <span className="collector-count"><b>{rank.total}</b>/{rank.max}</span>
          <span className="collector-copy">
            <strong>{rank.name}</strong>
            <small>{rank.next ? `${Math.max(0, rank.next.at - rank.total)} more ${rank.next.at - rank.total === 1 ? 'evolution' : 'evolutions'} to ${rank.next.name}` : 'Every creature at Legend rank'}</small>
          </span>
          <Meter value={rank.total / rank.max} legend={rank.total === rank.max} />
        </div>
      </div>

      {closest ? (
        <button type="button" className="critter-closest" onClick={() => setOpenId(closest.id)}>
          <Critter id={closest.id} tier={closest.tier} progress={closest.toNext} size={44} />
          <span>
            <strong>{closest.tier === 0 ? `${closest.critter.family} egg is closest to hatching` : `${closest.form} is closest to evolving`}</strong>
            <small>{remainingCopy(closest)}</small>
          </span>
          <Icon name="arrowRight" size={18} />
        </button>
      ) : null}

      <ul className="critter-grid">
        {states.map((state) => (
          <CritterCard
            key={state.id}
            state={state}
            isNew={fresh.includes(state.id)}
            onOpen={(id) => {
              setOpenId(id);
              setFresh((list) => list.filter((item) => item !== id));
            }}
          />
        ))}
      </ul>

      {open && !event ? (
        <CritterDialog
          key={open.id}
          state={open}
          links={links}
          onClose={() => setOpenId(null)}
          onShare={(state) => {
            setOpenId(null);
            setSharing(state);
          }}
        />
      ) : null}
      {event ? (
        <EvolutionDialog
          event={event}
          state={byId[event.id]}
          count={queue.length}
          onNext={() => setQueue((list) => list.slice(1))}
          onClose={() => setQueue([])}
          onMeet={(id) => {
            setQueue([]);
            setFresh((list) => list.filter((item) => item !== id));
            setOpenId(id);
          }}
        />
      ) : null}
      {sharing ? <ShareCard state={sharing} subjectName={subjectName} api={api} onClose={() => setSharing(null)} /> : null}
    </section>
  );
}

