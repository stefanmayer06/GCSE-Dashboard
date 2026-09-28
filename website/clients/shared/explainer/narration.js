// Narration — reads beats aloud with the browser's speech engine. No audio
// files ship with explainers: the script text IS the voiceover, so every
// explainer stays editable, translatable and captioned by construction.
// Voices differ by device; when none is available the player simply runs
// on its caption timing.

const PREFERRED = [
  /Libby.*Natural/i,
  /Sonia.*Natural/i,
  /Ryan.*Natural/i,
  /Google UK English Female/i,
  /Google UK English Male/i,
  /Serena/i,
  /Daniel/i,
  /Kate/i,
];

let cachedVoice = null;

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
}

function pickVoice() {
  if (!speechSupported()) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices() || [];
  const british = voices.filter((voice) => /en[-_]GB/i.test(voice.lang));
  for (const pattern of PREFERRED) {
    const match = british.find((voice) => pattern.test(voice.name)) || voices.find((voice) => pattern.test(voice.name) && /^en/i.test(voice.lang));
    if (match) {
      cachedVoice = match;
      return match;
    }
  }
  cachedVoice = british[0] || voices.find((voice) => /^en/i.test(voice.lang)) || null;
  return cachedVoice;
}

if (speechSupported()) {
  try {
    window.speechSynthesis.addEventListener?.('voiceschanged', () => {
      cachedVoice = null;
    });
  } catch {}
}

// Make maths read naturally ("3/4" → "3 over 4", "x²" → "x squared").
export function spokenText(text = '') {
  return String(text)
    .replace(/(\d)\s*\/\s*(\d)/g, '$1 over $2')
    .replace(/²/g, ' squared')
    .replace(/³/g, ' cubed')
    .replace(/√/g, 'root ')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/−/g, ' minus ')
    .replace(/≤/g, ' is less than or equal to ')
    .replace(/≥/g, ' is greater than or equal to ')
    .replace(/π/g, ' pi ')
    .replace(/°/g, ' degrees');
}

export function speak(text, { rate = 1, onStart, onEnd } = {}) {
  if (!speechSupported() || !text) {
    onEnd?.();
    return () => {};
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new window.SpeechSynthesisUtterance(spokenText(text));
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || 'en-GB';
  utterance.rate = Math.max(0.6, Math.min(1.7, rate));
  utterance.pitch = 1;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onEnd?.();
  };
  utterance.onstart = () => onStart?.();
  utterance.onend = finish;
  utterance.onerror = finish;
  synth.speak(utterance);
  return () => {
    done = true;
    synth.cancel();
  };
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}
