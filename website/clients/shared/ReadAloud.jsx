import { useEffect, useRef, useState } from 'react';

// Read-aloud for long English sources: free speech synthesis with an en-GB
// voice where available, normal rate, stop-on-unmount. Deliberately absent
// from timed exams — this is a library aid, not exam assistance.
function supported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

function pickVoice() {
  try {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.lang?.toLowerCase().startsWith('en-gb'))
      || voices.find((v) => v.lang?.toLowerCase().startsWith('en'))
      || null;
  } catch {
    return null;
  }
}

export function ReadAloud({ text, label = 'Listen to this extract' }) {
  const [speaking, setSpeaking] = useState(false);
  const [available] = useState(supported);
  const utterRef = useRef(null);

  useEffect(() => {
    if (!available) return undefined;
    // Voices load asynchronously in some browsers; no-op listener warms them.
    window.speechSynthesis.getVoices();
    return () => {
      try { window.speechSynthesis.cancel(); } catch {}
      utterRef.current = null;
    };
  }, [available, text]);

  if (!available || !text || !String(text).trim()) return null;

  function toggle() {
    try {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(String(text).slice(0, 8000));
      utter.rate = 1;
      const voice = pickVoice();
      if (voice) utter.voice = voice;
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
      setSpeaking(true);
    } catch {
      setSpeaking(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn small read-aloud${speaking ? ' on' : ''}`}
      onClick={toggle}
      aria-pressed={speaking}
      aria-label={speaking ? 'Stop reading aloud' : label}
    >
      {speaking ? '■ Stop listening' : '▶ Listen'}
    </button>
  );
}
