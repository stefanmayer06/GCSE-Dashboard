import { useEffect, useId, useMemo, useRef } from 'react';
import { Confetti } from './circuit/bits.jsx';
import Critter from './circuit/Critter.jsx';
import { CreatureGains, creatureGains, formName, useCreatures, useHoldEvolutions } from './creatures.jsx';

// Rewards are creatures. Finishing work never pays out points, levels or
// badge names any more: it feeds the creature whose evidence track the work
// counts towards, and the creature grows (see creatures.jsx). This file
// holds the one celebration that is not an evolution: a lesson finished
// for the first time.

// Escape closes, Tab stays inside, and focus returns to where it was (or
// to the first button on the finished-quiz card).
function useDialogFocus(onClose, fallbackSelector) {
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
        else if (fallbackSelector) document.querySelector(fallbackSelector)?.focus();
      }, 0);
    };
  }, [fallbackSelector]);

  return closeRef;
}

// First completion of a lesson: what the lesson fed, then the way on.
// Evolutions this work caused wait until the dialog closes, then play.
export function LessonComplete({ lessonName, before = null, after = null, onClose, onPracticeAgain, onChooseLesson }) {
  const titleId = useId();
  const closeRef = useDialogFocus(onClose, '.quiz-done button');
  const { mistakes, topicCount, partner } = useCreatures();
  useHoldEvolutions(true);
  const gains = useMemo(() => creatureGains(before, after, { mistakes, topicCount }), [before, after, mistakes, topicCount]);
  const star = gains[0]?.state || partner;

  return (
    <div className="reward-backdrop">
      <div className="reward-dialog lesson-complete" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <Confetti />
        <button ref={closeRef} type="button" className="reward-close" onClick={onClose} aria-label="Close">×</button>
        {star ? (
          <div className="reward-creature" aria-hidden="true">
            <Critter id={star.id} tier={star.tier} progress={star.toNext} mood="happy" size={128} />
          </div>
        ) : null}
        <div className="eyebrow">Lesson complete</div>
        <h2 id={titleId}>{lessonName} complete</h2>
        <p>
          {gains.some((gain) => gain.evolved)
            ? 'Something is happening to your creatures…'
            : star
              ? `${formName(star)} grew from this lesson. Keep practising to help it evolve.`
              : 'Your creatures grew from this lesson.'}
        </p>
        <CreatureGains before={before} after={after} title="What this lesson fed" dark />
        <div className="reward-dialog-actions">
          <button type="button" className="btn btn-go" onClick={onPracticeAgain}>Practise again</button>
          <button type="button" className="btn" onClick={onChooseLesson}>Choose another lesson</button>
        </div>
      </div>
    </div>
  );
}
