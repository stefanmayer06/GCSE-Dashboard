import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppHeader } from './AppShell.jsx';
import { CritterCard, CritterDialog, Meter, ShareCard } from './Milestones.jsx';
import { formName, useCreatures } from './creatures.jsx';
import { remainingCopy } from './critters.js';
import Critter from './circuit/Critter.jsx';
import Icon from './circuit/Icon.jsx';

// Creatures tab: the whole progression system. Eight creatures, each fed by
// one kind of real work, hatch from eggs and evolve Bronze → Silver → Gold →
// Legend. Tap one to meet it, see its evolution line, make it your partner
// or share it. Evolutions themselves play app-wide (see creatures.jsx).

export default function CreaturesPage({ subjectName = 'Study Desk', api = null, learnBase = '/learn', nextHref = null }) {
  const { states, byId, rank, partner, setPartner, closest, fresh, clearFresh, ready } = useCreatures();
  const [params, setParams] = useSearchParams();
  const [openId, setOpenId] = useState(() => params.get('open'));
  const [sharing, setSharing] = useState(null);

  useEffect(() => {
    const id = params.get('open');
    if (id && byId[id]) {
      setOpenId(id);
      clearFresh(id);
    }
  }, [params, byId, clearFresh]);

  function close() {
    setOpenId(null);
    if (params.get('open')) {
      const next = new URLSearchParams(params);
      next.delete('open');
      setParams(next, { replace: true });
    }
  }

  const open = openId ? byId[openId] : null;
  const toNextRank = rank.next ? Math.max(0, rank.next.at - rank.total) : 0;

  return (
    <div className="page creatures-page">
      <AppHeader />
      <header className="page-title-row">
        <h1>Creatures</h1>
        <span className="count-pill" aria-label={`${rank.total} of ${rank.max} evolutions`}>{rank.total} / {rank.max}</span>
      </header>
      <p className="sub page-intro">Each one grows from one kind of real work. Opening a page never feeds them.</p>

      <section className="collector-card" aria-labelledby="collector-title">
        <div className="collector-copy">
          <h2 id="collector-title">{rank.name}</h2>
          <p>{rank.next ? `${toNextRank} more ${toNextRank === 1 ? 'evolution' : 'evolutions'} to ${rank.next.name}` : 'Every creature at Legend rank'}</p>
        </div>
        <Meter value={rank.next ? rank.total / rank.next.at : 1} legend={!rank.next} />
      </section>

      {closest && ready ? (
        <button type="button" className="closest-row" onClick={() => setOpenId(closest.id)}>
          <span className="closest-art" aria-hidden="true">
            <Critter id={closest.id} tier={closest.tier} progress={closest.toNext} size={56} />
          </span>
          <span className="closest-copy">
            <span className="closest-eyebrow">Closest to {closest.tier === 0 ? 'hatching' : 'evolving'}</span>
            <span className="closest-name">{formName(closest)}</span>
            <span className="closest-detail">{remainingCopy(closest) || 'Nearly there.'}</span>
          </span>
          <span className="closest-go" aria-hidden="true"><Icon name="arrowRight" size={20} /></span>
        </button>
      ) : null}

      <ul className="critter-grid">
        {states.map((state) => (
          <CritterCard
            key={state.id}
            state={state}
            isNew={fresh.includes(state.id)}
            isPartner={partner?.id === state.id}
            onOpen={(id) => {
              setOpenId(id);
              clearFresh(id);
            }}
          />
        ))}
      </ul>

      {open ? (
        <CritterDialog
          key={open.id}
          state={open}
          links={{ learnBase, nextHref }}
          onClose={close}
          isPartner={partner?.id === open.id}
          onMakePartner={(id) => setPartner(id)}
          onShare={(state) => {
            close();
            setSharing(state);
          }}
        />
      ) : null}
      {sharing ? <ShareCard state={sharing} subjectName={subjectName} api={api} onClose={() => setSharing(null)} /> : null}
    </div>
  );
}
