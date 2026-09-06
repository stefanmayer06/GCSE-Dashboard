import { useState } from 'react';
import { milestonesFor } from './study.js';

// Milestone shelf: reached eras pay out (streak eras bank a freeze
// server-side) and every reached milestone is shareable. Locked ones show
// the next target so the shelf pulls rather than decorates.
export function MilestoneShelf({ progress = null, subjectName = 'Study Desk', api = null }) {
  const [sharing, setSharing] = useState(null);
  const milestones = milestonesFor(progress);
  const reached = milestones.filter((m) => m.reached);
  const next = milestones.find((m) => !m.reached) || null;
  if (!reached.length && !next) return null;
  return (
    <section className="panel milestone-shelf" aria-labelledby="milestones-title">
      <h2 id="milestones-title">Milestones</h2>
      {reached.length ? (
        <ul className="milestone-list">
          {reached.map((m) => (
            <li key={m.id} className="milestone reached">
              <span className="milestone-seal" aria-hidden="true">★</span>
              <span className="milestone-text">
                <strong>{m.label}</strong>
                <small>{m.detail}</small>
              </span>
              <button type="button" className="btn small" onClick={() => setSharing(m)}>Share</button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">No milestones yet — your first timed paper earns the first seal.</p>
      )}
      {next && (
        <p className="sub small">
          Next seal: <strong>{next.label}</strong> — {next.value}/{next.at}
          {next.kind === 'streak' ? ' days' : next.kind === 'papers' ? ' papers' : ' lessons'}.
        </p>
      )}
      {sharing && (
        <ShareCard
          milestone={sharing}
          progress={progress}
          subjectName={subjectName}
          api={api}
          onClose={() => setSharing(null)}
        />
      )}
    </section>
  );
}

function shareText(milestone, progress, subjectName) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const bits = [
    `I just earned “${milestone.label}” revising ${subjectName} on GCSE Study Desk.`,
    progress?.testsTaken ? `${progress.testsTaken} timed papers` : null,
    progress?.streak ? `${progress.streak}-day streak` : null,
  ].filter(Boolean);
  return `${bits.join(' · ')}. Free AQA practice, worked solutions and a mistake notebook that brings misses back until they stick. ${origin}`.trim();
}

function ShareCard({ milestone, progress, subjectName, api, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = shareText(milestone, progress, subjectName);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function share() {
    try {
      await navigator.share({ title: 'GCSE Study Desk milestone', text });
      api?.track?.('milestone_shared', { milestone: milestone.id });
      onClose();
    } catch {
      // Dismissed share sheets throw — copying is the fallback below.
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      api?.track?.('milestone_shared', { milestone: milestone.id, channel: 'clipboard' });
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div
        className="modal share-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="share-stamp" aria-hidden="true">
          <span>GCSE Study Desk</span>
          <strong>★</strong>
        </div>
        <h3 id="share-title">{milestone.label}</h3>
        <p className="sub">{subjectName} · {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p className="share-proof">
          {[progress?.testsTaken != null && `${progress.testsTaken} papers`,
            progress?.streak != null && `${progress.streak}-day streak`,
            progress?.lessonsCompleted != null && `${progress.lessonsCompleted} lessons`]
            .filter(Boolean).join(' · ')}
        </p>
        <div className="modal-actions">
          {canShare && <button type="button" className="btn btn-primary" onClick={share}>Share</button>}
          <button type="button" className="btn" onClick={copy}>{copied ? 'Copied ✓' : 'Copy text'}</button>
          <button type="button" className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
