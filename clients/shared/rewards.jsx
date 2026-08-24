import { useEffect, useId, useRef, useState } from 'react';

export const EXPERTISE_RANKS = [
  'Learner',
  'Knowledge Builder',
  'Method Builder',
  'Confident Practitioner',
  'Exam Strategist',
  'Topic Specialist',
  'Subject Specialist',
  'Exam Expert',
  'Mastery Scholar',
  'Subject Matter Expert',
];

export function rankForLevel(level = 1) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return EXPERTISE_RANKS[Math.min(EXPERTISE_RANKS.length, safeLevel) - 1];
}

function progressPercent(progress) {
  if (!progress?.xpNeeded) return 0;
  return Math.min(100, Math.max(0, (progress.xpInto / progress.xpNeeded) * 100));
}

export function RewardSummary({ reward, progress, label = 'Study XP earned' }) {
  if (!reward) return null;
  const current = progress || reward.progress;
  const level = reward.levelAfter || current?.level || 1;

  return (
    <div className="reward-summary" aria-live="polite">
      <div>
        <span className="reward-summary-label">{label}</span>
        <strong className="reward-xp">+{reward.xpAwarded} XP</strong>
      </div>
      <div className="reward-summary-detail">
        {reward.scoreXp} score XP
        {reward.completionXp > 0 ? ` + ${reward.completionXp} first-completion XP` : ''}
      </div>
      <div className="reward-summary-rank">Level {level} - {rankForLevel(level)}</div>
    </div>
  );
}

export function ExpertisePath({ progress, onChooseLesson }) {
  const [expanded, setExpanded] = useState(false);
  if (!progress) return null;

  const level = Math.max(1, progress.level || 1);
  const rank = rankForLevel(level);
  const nextLevel = level + 1;
  const atSme = level >= EXPERTISE_RANKS.length;

  return (
    <section className="panel expertise-path" aria-labelledby="expertise-path-title">
      <div className="expertise-head">
        <div>
          <div className="eyebrow">Your expertise path</div>
          <h2 id="expertise-path-title">{rank}</h2>
          <p className="sub">
            Level {level} - {progress.lessonsCompleted || 0} lesson{progress.lessonsCompleted === 1 ? '' : 's'} completed
          </p>
        </div>
        <div className="expertise-seal" aria-label={`Study Desk level ${level}`}>
          <span>LEVEL</span>
          <strong>{level}</strong>
        </div>
      </div>

      <div className="expertise-progress">
        <div className="expertise-progress-copy">
          <span>{atSme ? 'Subject Matter Expert reached' : `Next: ${rankForLevel(nextLevel)}`}</span>
          <span>{progress.xpInto}/{progress.xpNeeded} XP</span>
        </div>
        <div className="expertise-track" role="progressbar" aria-valuemin="0" aria-valuemax={progress.xpNeeded} aria-valuenow={progress.xpInto}>
          <span style={{ width: `${progressPercent(progress)}%` }} />
        </div>
      </div>

      <div className="expertise-actions">
        <button type="button" className="btn" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? 'Hide badge collection' : 'View badge collection'}
        </button>
        {onChooseLesson && (
          <button type="button" className="btn btn-primary" onClick={onChooseLesson}>Choose a lesson</button>
        )}
      </div>

      {expanded && (
        <div className="badge-collection" aria-label="Expertise badge collection">
          {EXPERTISE_RANKS.map((name, index) => {
            const badgeLevel = index + 1;
            const unlocked = level >= badgeLevel;
            return (
              <div key={name} className={`expertise-badge ${unlocked ? 'unlocked' : 'locked'}`}>
                <span className="expertise-badge-number">{unlocked ? badgeLevel : '?'}</span>
                <span>
                  <strong>{name}</strong>
                  <small>{unlocked ? `Unlocked at level ${badgeLevel}` : `Unlocks at level ${badgeLevel}`}</small>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function RewardCelebration({ reward, lessonName, onClose, onPracticeAgain, onChooseLesson }) {
  const titleId = useId();
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab') return;
      const dialog = closeRef.current?.closest('[role="dialog"]');
      const controls = dialog?.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled)');
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
        else document.querySelector('.quiz-done button')?.focus();
      }, 0);
    };
  }, []);

  if (!reward) return null;
  const levelUp = reward.levelAfter > reward.levelBefore;
  const rank = rankForLevel(reward.levelAfter);

  return (
    <div className="reward-backdrop">
      <div className="reward-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button ref={closeRef} type="button" className="reward-close" onClick={onClose} aria-label="Close reward">x</button>
        <div className="reward-stamp" aria-hidden="true">
          <span>{levelUp ? 'LEVEL' : 'DONE'}</span>
          <strong>{levelUp ? reward.levelAfter : '+20'}</strong>
        </div>
        <div className="eyebrow">{levelUp ? 'New expertise badge unlocked' : 'Lesson stamp earned'}</div>
        <h2 id={titleId}>{levelUp ? rank : `${lessonName} complete`}</h2>
        <p>
          {levelUp
            ? reward.levelAfter >= EXPERTISE_RANKS.length
              ? `You reached Study Desk level ${reward.levelAfter} and earned the Subject Matter Expert badge.`
              : `You reached Study Desk level ${reward.levelAfter}. Your next lessons now build towards ${rankForLevel(reward.levelAfter + 1)}.`
            : 'The first-completion bonus is yours. Correct answers still earn extra XP every time you practise.'}
        </p>
        <RewardSummary reward={reward} />
        <div className="reward-dialog-actions">
          <button type="button" className="btn btn-primary" onClick={onPracticeAgain}>Practise again</button>
          <button type="button" className="btn" onClick={onChooseLesson}>Choose another lesson</button>
        </div>
      </div>
    </div>
  );
}
