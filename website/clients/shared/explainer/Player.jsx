import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Icon from '../circuit/Icon.jsx';
import Pip from '../circuit/Pip.jsx';
import { SegmentBar } from '../circuit/bits.jsx';
import { STAGE_H, STAGE_W, beatAt, chapterAt, checkAnswer, compile, formatTime, frameAt } from './engine.js';
import { StageItem } from './primitives.jsx';
import { speak, speechSupported, stopSpeaking } from './narration.js';

// Interactive explainer player — Khan-style narrated "video" that is
// actually live SVG, so the learner can pause and poke it, answer
// checkpoints that stop the story, scrub, change speed, read captions or
// the full transcript. Scripts live in shared/explainer/library/.

const PREFS_KEY = 'gcse-explainer-prefs';
const RATES = [0.75, 1, 1.25, 1.5];

function loadPrefs() {
  const base = { voice: true, captions: true, rate: 1 };
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (saved && typeof saved === 'object') return { ...base, ...saved };
  } catch {}
  return base;
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    let query;
    try {
      query = window.matchMedia('(prefers-reduced-motion: reduce)');
    } catch {
      return undefined;
    }
    const onChange = () => setReduced(query.matches);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function Checkpoint({ cp, record, onSubmit, onContinue, onReveal, sliderValue, onSlider, tapChoice }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const status = record?.status;
  const done = status === 'correct' || status === 'revealed';
  const wrong = record?.last === 'wrong' && !done;
  const promptId = useId();

  useEffect(() => {
    if (!done) inputRef.current?.focus?.();
  }, [cp.id, done]);

  return (
    <div className={`xp-check${done ? ' is-done' : ''}${wrong ? ' is-wrong' : ''}${status === 'correct' ? ' is-right' : ''}`} role="group" aria-labelledby={promptId}>
      <div className="xp-check-head">
        <Pip mood={status === 'correct' ? 'cheer' : wrong ? 'think' : 'wow'} size={44} />
        <div>
          <p className="xp-check-kicker">{cp.kind === 'tap' ? 'Tap to answer' : cp.kind === 'reflect' ? 'Try it first' : 'Your turn'}</p>
          <p className="xp-check-prompt" id={promptId}>{cp.prompt}</p>
        </div>
      </div>

      {!done && cp.kind === 'choice' ? (
        <div className="xp-check-options">
          {(cp.options || []).map((option, index) => (
            <button
              key={option}
              ref={index === 0 ? inputRef : undefined}
              type="button"
              className={`xp-option${record?.tried?.includes(option) ? ' tried' : ''}`}
              onClick={() => onSubmit(option)}
              disabled={record?.tried?.includes(option)}
            >
              <span className="xp-option-key" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              {option}
            </button>
          ))}
        </div>
      ) : null}

      {!done && cp.kind === 'number' ? (
        <form className="xp-check-input" onSubmit={(event) => { event.preventDefault(); onSubmit(value); }}>
          <input
            ref={inputRef}
            className="answer-input"
            inputMode="decimal"
            aria-label={cp.prompt}
            placeholder={cp.placeholder || 'Type your answer'}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          {cp.unit ? <span className="xp-unit">{cp.unit}</span> : null}
          <button type="submit" className="btn btn-go" disabled={!String(value).trim()}>Check</button>
        </form>
      ) : null}

      {!done && cp.kind === 'slider' ? (
        <form className="xp-check-input slider" onSubmit={(event) => { event.preventDefault(); onSubmit(sliderValue); }}>
          <input
            ref={inputRef}
            type="range"
            min={cp.min ?? 0}
            max={cp.max ?? 1}
            step={cp.step ?? 0.05}
            value={sliderValue ?? cp.start ?? cp.min ?? 0}
            aria-label={cp.prompt}
            aria-valuetext={cp.format ? cp.format.replace('{v}', sliderValue) : String(sliderValue)}
            onChange={(event) => onSlider(Number(event.target.value))}
          />
          <output className="xp-slider-value">{cp.format ? cp.format.replace('{v}', sliderValue) : sliderValue}</output>
          <button type="submit" className="btn btn-go">Lock it in</button>
        </form>
      ) : null}

      {!done && cp.kind === 'reflect' ? (
        <form className="xp-check-input" onSubmit={(event) => { event.preventDefault(); onReveal(); }}>
          <input
            ref={inputRef}
            className="answer-input"
            aria-label="Your answer (optional, not saved)"
            placeholder="Your answer (optional)"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <button type="submit" className="btn btn-go">Reveal the method</button>
        </form>
      ) : null}

      {!done && cp.kind === 'tap' ? <p className="xp-check-hint">Tap your choice on the board{tapChoice ? '' : ' — or use Tab and Enter'}.</p> : null}

      <div className="xp-check-feedback" aria-live="polite">
        {status === 'correct' ? (
          <p className="xp-fb right"><Icon name="check" size={18} /> <b>{cp.right || 'Yes!'}</b> {cp.explain || ''}</p>
        ) : status === 'revealed' && cp.kind === 'reflect' ? (
          <p className="xp-fb reveal"><b>Watch the method.</b> {value ? `You wrote “${value}” — compare it step by step.` : 'Compare it with your own working, step by step.'}</p>
        ) : status === 'revealed' ? (
          <p className="xp-fb reveal"><b>Answer: {Array.isArray(cp.answer) ? cp.answer[0] : (cp.answerText || cp.answer)}.</b> {cp.explain || ''}</p>
        ) : wrong ? (
          <p className="xp-fb wrong"><b>Not quite.</b> {cp.hint || 'Have another look at the board.'}</p>
        ) : null}
      </div>

      <div className="xp-check-actions">
        {done ? (
          <button type="button" className="btn btn-go" onClick={onContinue} autoFocus>Continue <Icon name="arrowRight" size={18} /></button>
        ) : cp.kind === 'reflect' ? null : (
          <button type="button" className="btn small" onClick={onReveal}>{(record?.attempts || 0) >= 1 ? 'Show me' : 'Skip'}</button>
        )}
      </div>
    </div>
  );
}

export default function ExplainerPlayer({ script, onComplete = null, onContinue = null, continueLabel = 'Continue', className = '' }) {
  const compiled = useMemo(() => compile(script), [script]);
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [answers, setAnswers] = useState({});
  const [active, setActive] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [panel, setPanel] = useState(null);
  const [sliderValue, setSliderValue] = useState(null);
  const tRef = useRef(0);
  const answersRef = useRef({});
  const speakingRef = useRef(false);
  const speechStartRef = useRef(0);
  const lastSpokenRef = useRef(-1);
  const wrapRef = useRef(null);
  const completedRef = useRef(false);
  const voiceAvailable = speechSupported();
  // Re-render once web fonts arrive so measured text (words, chips) uses
  // the real metrics even when the player is paused.
  const [, setFontsReady] = useState(false);
  useEffect(() => {
    let live = true;
    document.fonts?.ready?.then(() => { if (live) setFontsReady(true); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => () => stopSpeaking(), []);

  // Reset when the script changes.
  useEffect(() => {
    stopSpeaking();
    tRef.current = 0;
    setT(0);
    setPlaying(false);
    setStarted(false);
    setEnded(false);
    setAnswers({});
    setActive(null);
    setOverrides({});
    completedRef.current = false;
    lastSpokenRef.current = -1;
  }, [compiled]);

  const setTime = useCallback((value) => {
    tRef.current = value;
    setT(value);
  }, []);

  const updatePrefs = (patch) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      savePrefs(next);
      return next;
    });
  };

  const stats = useCallback(() => {
    const graded = compiled.checkpoints.filter((cp) => cp.kind !== 'reflect');
    const rows = graded.map((cp) => answersRef.current[cp.id]).filter(Boolean);
    return {
      total: graded.length,
      correct: rows.filter((row) => row.status === 'correct').length,
      firstTry: rows.filter((row) => row.status === 'correct' && row.attempts === 1).length,
    };
  }, [compiled]);

  // Playback clock.
  useEffect(() => {
    if (!playing) return undefined;
    let last = performance.now();
    let frame;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000) * prefs.rate;
      last = now;
      const current = tRef.current;
      let next = current + dt;
      const cp = compiled.checkpoints.find((item) => !answersRef.current[item.id] && item.t >= current - 1e-6 && item.t <= next);
      const beat = beatAt(compiled, current);
      const holdAllowed = speakingRef.current && beat && (performance.now() - speechStartRef.current) / 1000 < Math.max(10, beat.dur * 2.6);
      if (prefs.voice && holdAllowed && next > beat.end - 0.04 && (!cp || cp.t >= beat.end - 0.04)) {
        next = Math.max(current, beat.end - 0.04);
        setTime(next);
        frame = requestAnimationFrame(tick);
        return;
      }
      if (cp) {
        setTime(cp.t);
        setPlaying(false);
        setActive(cp);
        if (cp.kind === 'slider') setSliderValue(cp.start ?? cp.min ?? 0);
        return;
      }
      if (next >= compiled.duration) {
        setTime(compiled.duration);
        setPlaying(false);
        setEnded(true);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.(stats());
        }
        return;
      }
      setTime(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, prefs.rate, prefs.voice, compiled, onComplete, setTime, stats]);

  // Narration follows the current beat while playing.
  const beat = beatAt(compiled, t);
  const beatIndex = beat ? beat.index : -1;
  useEffect(() => {
    if (!playing || !prefs.voice || beatIndex < 0) return;
    if (lastSpokenRef.current === beatIndex) return;
    lastSpokenRef.current = beatIndex;
    const say = compiled.beats[beatIndex]?.say;
    if (!say) return;
    // Only hold the clock for speech that actually started: devices with no
    // voice installed never fire onstart, and captions timing takes over.
    speakingRef.current = false;
    speak(say, {
      rate: prefs.rate,
      onStart: () => {
        speakingRef.current = true;
        speechStartRef.current = performance.now();
      },
      onEnd: () => {
        speakingRef.current = false;
      },
    });
  }, [beatIndex, playing, prefs.voice, prefs.rate, compiled]);

  const haltSpeech = () => {
    stopSpeaking();
    speakingRef.current = false;
    lastSpokenRef.current = -1;
  };

  const play = () => {
    if (active) return;
    if (ended || tRef.current >= compiled.duration) {
      setTime(0);
      setEnded(false);
    }
    setStarted(true);
    setOverrides({});
    setPanel((current) => (current === 'play' ? null : current));
    setPlaying(true);
  };

  const pause = () => {
    setPlaying(false);
    haltSpeech();
  };

  const toggle = () => (playing ? pause() : play());

  const seek = (value) => {
    const next = Math.max(0, Math.min(compiled.duration, value));
    haltSpeech();
    setActive(null);
    setEnded(false);
    setStarted(true);
    setOverrides({});
    setTime(next);
  };

  const openCheckpoint = (cp) => {
    pause();
    setTime(cp.t);
    setStarted(true);
    setEnded(false);
    setAnswers((current) => {
      const next = { ...current };
      if (next[cp.id] && next[cp.id].status !== 'correct') delete next[cp.id];
      return next;
    });
    setActive(cp);
    if (cp.kind === 'slider') setSliderValue(cp.start ?? cp.min ?? 0);
  };

  const record = active ? answers[active.id] : null;

  const submit = (value) => {
    if (!active) return;
    const correct = checkAnswer(active, value);
    setAnswers((current) => {
      const prev = current[active.id] || { attempts: 0, tried: [] };
      const attempts = prev.attempts + 1;
      const tried = [...(prev.tried || []), String(value)];
      let status = correct ? 'correct' : attempts >= 2 ? 'revealed' : undefined;
      const row = { attempts, tried, status, last: correct ? 'right' : 'wrong' };
      if (!status) delete row.status;
      return { ...current, [active.id]: row };
    });
  };

  const reveal = () => {
    if (!active) return;
    setAnswers((current) => ({ ...current, [active.id]: { ...(current[active.id] || { attempts: 0, tried: [] }), status: 'revealed' } }));
  };

  const continueAfter = () => {
    setActive(null);
    setOverrides({});
    setPlaying(true);
  };

  // Tap checkpoints make targets on the board clickable.
  const tap = useMemo(() => {
    if (!active || active.kind !== 'tap') return null;
    const done = record?.status === 'correct' || record?.status === 'revealed';
    const state = {};
    for (const tried of record?.tried || []) state[tried] = checkAnswer(active, tried) ? 'right' : 'wrong';
    if (record?.status === 'revealed') {
      const answer = Array.isArray(active.answer) ? active.answer[0] : active.answer;
      state[answer] = 'right';
    }
    return {
      targets: new Set(done ? [] : active.targets || []),
      state,
      onTap: (id) => submit(id),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, record]);

  // Slider checkpoints and sandbox controls drive element props live.
  const liveOverrides = useMemo(() => {
    if (active?.kind === 'slider' && active.bind && sliderValue != null) {
      return { ...overrides, [active.bind.id]: { ...(overrides[active.bind.id] || {}), [active.bind.prop]: sliderValue } };
    }
    return overrides;
  }, [overrides, active, sliderValue]);

  const frame = frameAt(compiled, t, { overrides: liveOverrides, reducedMotion: reduced });
  const chapter = chapterAt(compiled, t);
  const cam = frame.camera;
  const board = script.board || 'night';
  const progress = compiled.duration ? t / compiled.duration : 0;
  const answeredCount = Object.values(answers).filter((row) => row.status).length;
  const sandbox = !playing && !active && started && !ended && chapter?.play?.length ? chapter.play : null;

  const onKeyDown = (event) => {
    if (event.target.closest('input, textarea, select, .xp-check')) return;
    if (event.key === ' ' || event.key === 'k') {
      event.preventDefault();
      toggle();
    } else if (event.key === 'ArrowRight' || event.key === 'l') {
      event.preventDefault();
      seek(tRef.current + (event.key === 'l' ? 10 : 5));
    } else if (event.key === 'ArrowLeft' || event.key === 'j') {
      event.preventDefault();
      seek(tRef.current - (event.key === 'j' ? 10 : 5));
    } else if (event.key === 'c') {
      updatePrefs({ captions: !prefs.captions });
    } else if (event.key === 'm') {
      updatePrefs({ voice: !prefs.voice });
      haltSpeech();
    }
  };

  const fullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => {});
  };

  const st = stats();

  return (
    <section
      ref={wrapRef}
      className={`xp-player board-${board} ${className}`.trim()}
      aria-label={`Interactive explainer: ${script.title}`}
      style={{ '--xp-hue': `var(--hue-${script.hue || 'blue'})` }}
      onKeyDown={onKeyDown}
    >
      <div className="xp-stage-wrap">
        <svg
          className="xp-stage"
          viewBox={`${cam.x} ${cam.y} ${cam.w} ${cam.h}`}
          role="img"
          aria-label={beat?.caption || script.title}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id={`xp-dots-${script.id}`} width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill="var(--b-grid)" />
            </pattern>
          </defs>
          <rect x={-STAGE_W} y={-STAGE_H} width={STAGE_W * 3} height={STAGE_H * 3} fill="var(--b-bg)" />
          <rect x={-STAGE_W} y={-STAGE_H} width={STAGE_W * 3} height={STAGE_H * 3} fill={`url(#xp-dots-${script.id})`} />
          {frame.items.map((item) => <StageItem key={item.id} item={item} tap={tap} />)}
        </svg>


        {!started ? (
          <div className="xp-poster">
            <div className="xp-poster-card">
              <Pip mood="happy" size={64} bob />
              <p className="xp-kicker"><Icon name="play" size={14} /> Interactive explainer · {formatTime(compiled.duration)}</p>
              <h3>{script.title}</h3>
              {script.summary ? <p className="xp-summary">{script.summary}</p> : null}
              <p className="xp-meta">
                {compiled.chapters.length} part{compiled.chapters.length === 1 ? '' : 's'} · {compiled.checkpoints.length} checkpoint{compiled.checkpoints.length === 1 ? '' : 's'}
                {voiceAvailable ? ' · narrated' : ' · captioned'}
              </p>
              <button type="button" className="btn btn-go xp-play-big" onClick={play}>
                <Icon name="play" size={20} /> Watch &amp; play
              </button>
            </div>
          </div>
        ) : null}

        {active && active.kind !== 'tap' ? (
          <div className={`xp-check-layer kind-${active.kind}`}>
            <Checkpoint
              cp={active}
              record={record}
              onSubmit={submit}
              onContinue={continueAfter}
              onReveal={reveal}
              sliderValue={sliderValue}
              onSlider={setSliderValue}
              tapChoice={false}
            />
          </div>
        ) : null}

        {ended ? (
          <div className="xp-poster xp-end">
            <div className="xp-poster-card">
              <Pip mood="cheer" size={64} />
              <p className="xp-kicker">Explainer complete</p>
              <h3>{st.total ? `${st.firstTry}/${st.total} checkpoints first try` : 'Nice watching!'}</h3>
              <p className="xp-summary">{st.total && st.firstTry === st.total ? 'Flawless. Lock it in with some practice.' : 'Replay any part from the chapters below, or move on and practise.'}</p>
              <div className="xp-end-actions">
                <button type="button" className="btn" onClick={() => { answersRef.current = {}; setAnswers({}); seek(0); setPlaying(true); }}>
                  <Icon name="replay" size={18} /> Replay
                </button>
                {onContinue ? (
                  <button type="button" className="btn btn-go" onClick={onContinue}>{continueLabel} <Icon name="arrowRight" size={18} /></button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {active?.kind === 'tap' ? (
        <div className="xp-check-layer kind-tap">
          <Checkpoint
            cp={active}
            record={record}
            onSubmit={submit}
            onContinue={continueAfter}
            onReveal={reveal}
            sliderValue={sliderValue}
            onSlider={setSliderValue}
            tapChoice={false}
          />
        </div>
      ) : null}

      {prefs.captions ? (
        <p className="xp-caption" aria-hidden="true">{started && beat?.caption ? beat.caption : '\u00a0'}</p>
      ) : null}

      <div className="xp-controls">
        <button type="button" className="xp-btn xp-btn-main" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} disabled={!!active}>
          <Icon name={playing ? 'pause' : 'play'} size={22} />
        </button>
        <button type="button" className="xp-btn" onClick={() => seek(tRef.current - 10)} aria-label="Back 10 seconds">
          <Icon name="back10" size={20} />
        </button>
        <span className="xp-time" aria-hidden="true">{formatTime(t)} / {formatTime(compiled.duration)}</span>
        <div className="xp-scrub">
          <div className="xp-track" aria-hidden="true">
            {compiled.chapters.map((item, index) => {
              const next = compiled.chapters[index + 1]?.t ?? compiled.duration;
              const left = (item.t / compiled.duration) * 100;
              const width = ((next - item.t) / compiled.duration) * 100;
              const fill = Math.max(0, Math.min(1, (t - item.t) / Math.max(0.001, next - item.t)));
              return (
                <span key={item.id} className="xp-seg" style={{ left: `${left}%`, width: `calc(${width}% - 3px)` }}>
                  <span className="xp-seg-fill" style={{ width: `${fill * 100}%` }} />
                </span>
              );
            })}
          </div>
          <input
            type="range"
            className="xp-range"
            min={0}
            max={compiled.duration}
            step={0.05}
            value={t}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Seek"
            aria-valuetext={`${formatTime(t)} of ${formatTime(compiled.duration)}, ${chapter?.title || ''}`}
          />
          {compiled.checkpoints.map((cp) => {
            const row = answers[cp.id];
            return (
              <button
                key={cp.id}
                type="button"
                className={`xp-diamond${row?.status === 'correct' ? ' right' : row?.status ? ' seen' : ''}`}
                style={{ left: `${(cp.t / compiled.duration) * 100}%` }}
                onClick={() => openCheckpoint(cp)}
                aria-label={`Checkpoint: ${cp.prompt}${row?.status === 'correct' ? ' (answered)' : ''}`}
              />
            );
          })}
        </div>
        <div className="xp-tools">
          <button type="button" className="xp-btn xp-rate" onClick={() => updatePrefs({ rate: RATES[(RATES.indexOf(prefs.rate) + 1) % RATES.length] || 1 })} aria-label={`Playback speed ${prefs.rate} times`}>
            {prefs.rate}×
          </button>
          <button type="button" className={`xp-btn${prefs.captions ? ' on' : ''}`} onClick={() => updatePrefs({ captions: !prefs.captions })} aria-pressed={prefs.captions} aria-label="Captions">
            <Icon name="captions" size={20} />
          </button>
          {voiceAvailable ? (
            <button type="button" className={`xp-btn${prefs.voice ? ' on' : ''}`} onClick={() => { updatePrefs({ voice: !prefs.voice }); haltSpeech(); }} aria-pressed={prefs.voice} aria-label="Narration voice">
              <Icon name={prefs.voice ? 'speaker' : 'mute'} size={20} />
            </button>
          ) : null}
          <button type="button" className={`xp-btn${panel === 'transcript' ? ' on' : ''}`} onClick={() => setPanel((current) => (current === 'transcript' ? null : 'transcript'))} aria-expanded={panel === 'transcript'} aria-label="Transcript">
            <Icon name="transcript" size={20} />
          </button>
          <button type="button" className="xp-btn xp-full" onClick={fullscreen} aria-label="Full screen">
            <Icon name="expand" size={20} />
          </button>
        </div>
      </div>

      <div className="xp-chapters" role="list" aria-label="Chapters">
        {compiled.chapters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="listitem"
            className={`xp-chapter${chapter?.id === item.id && started ? ' current' : ''}${t > (compiled.chapters[item.index + 1]?.t ?? compiled.duration) - 0.01 ? ' done' : ''}`}
            onClick={() => seek(item.t)}
          >
            <span className="xp-chapter-n">{item.index + 1}</span>
            {item.title}
          </button>
        ))}
        <span className="xp-score" aria-label={`${answeredCount} of ${compiled.checkpoints.length} checkpoints answered`}>
          <SegmentBar total={Math.max(1, compiled.checkpoints.length)} done={answeredCount} label="Checkpoints answered" />
        </span>
      </div>

      {sandbox ? (
        <div className="xp-sandbox">
          <p className="xp-sandbox-title"><Icon name="sparkle" size={16} /> Play with it — the board is live while paused</p>
          {sandbox.map((control) => {
            const current = overrides[control.id]?.[control.prop] ?? control.value ?? control.min;
            return (
              <label key={`${control.id}.${control.prop}`} className="xp-sandbox-row">
                <span>{control.label}</span>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step ?? 1}
                  value={current}
                  onChange={(event) => setOverrides((all) => ({ ...all, [control.id]: { ...(all[control.id] || {}), [control.prop]: Number(event.target.value) } }))}
                />
                <output>{control.format ? control.format.replace('{v}', current) : current}</output>
              </label>
            );
          })}
        </div>
      ) : null}

      {panel === 'transcript' ? (
        <ol className="xp-transcript" aria-label="Transcript">
          {compiled.beats.map((item) => (
            <li key={item.index} className={item.index === beatIndex ? 'current' : ''}>
              <button type="button" onClick={() => seek(item.t)}>
                <span className="xp-ts">{formatTime(item.t)}</span>
                <span>{item.say}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}

      <p className="sr-only" aria-live="polite">{active ? `Checkpoint. ${active.prompt}` : ''}</p>
      <span className="xp-progress-sr sr-only">{Math.round(progress * 100)}% watched</span>
    </section>
  );
}
