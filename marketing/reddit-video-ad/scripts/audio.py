"""Music, sound effects and the final mix for the 25-second Reddit ad.

Everything here is synthesised from scratch (no samples, no stock music), so
the soundtrack is original and cleared for use:

  * music  - a relaxed felt-piano and pad piece in F major at 80 bpm; bars
             land on the shot changes (0, 3, 12, 18 and 21 s) and the piece
             resolves on the end card.
  * sfx    - soft UI ticks, screen taps, pencil strokes, a two-note chime
             for the correct answer and a paper "stamp" for SECURE. Cue
             times come from the animation itself (build/sfx.json).
  * mix    - voiceover on top, music ducked under speech, loudness set to
             -16 LUFS integrated with true peak below -1.5 dBTP.

Inputs:  build/vo.wav, build/vo.json (scripts/tts.py), build/sfx.json
         (scripts/render.mjs)
Outputs: build/mix.wav plus stems build/stem_{vo,music,sfx}.wav
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, lfilter, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build"
SR = 48000
DUR = 25.0
N = int(SR * DUR)
RNG = np.random.default_rng(20260928)

TARGET_LUFS = -16.0
TRUE_PEAK_CEILING = -1.5  # dBTP
MUSIC_BELOW_VO = 9.0      # LU, undducked music bed relative to the voice
DUCK_DB = -8.0            # extra music reduction while someone is speaking
SFX_BELOW_VO = 12.0       # LU, loudness of the effects track relative to the voice


# ---------------------------------------------------------------- utilities
def bs1770_blocks(x, block=0.4, overlap=0.75):
    """Mean-square power per block after BS.1770 K-weighting (48 kHz)."""
    if x.ndim == 1:
        x = x[:, None]
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
    size, hop = int(block * SR), int(block * SR * (1 - overlap))
    starts = range(0, max(1, len(y) - size + 1), hop)
    return np.array([np.sum(np.mean(y[s:s + size] ** 2, axis=0)) for s in starts])


def lufs(x):
    """Integrated loudness (BS.1770-4 gating)."""
    z = bs1770_blocks(x)
    lk = -0.691 + 10 * np.log10(z + 1e-12)
    z = z[lk > -70]
    if len(z) == 0:
        return -np.inf
    rel = -0.691 + 10 * np.log10(np.mean(z)) - 10
    z = z[(-0.691 + 10 * np.log10(z)) > rel]
    return -0.691 + 10 * np.log10(np.mean(z))


def true_peak_db(x):
    up = resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def compress(x, threshold_db, ratio=2.5, knee=6.0, rms_ms=8.0, smooth_ms=25.0):
    """Gentle feed-forward RMS compressor for the voice (soft knee)."""
    a = np.exp(-1 / (rms_ms / 1000 * SR))
    level = 10 * np.log10(lfilter([1 - a], [1, -a], x ** 2) + 1e-12)
    over = level - threshold_db
    slope = 1 - 1 / ratio
    gr = np.where(over <= -knee / 2, 0.0,
                  np.where(over >= knee / 2, over * slope, slope * (over + knee / 2) ** 2 / (2 * knee)))
    b = np.exp(-1 / (smooth_ms / 1000 * SR))
    return x * 10 ** (-lfilter([1 - b], [1, -b], gr) / 20)


def limit(x, ceiling_db, lookahead_ms=3.0, release_ms=80.0):
    """Look-ahead true-peak limiter: 4x oversampled detection, smooth gain."""
    up = np.abs(resample_poly(x, 4, 1, axis=0)).max(axis=1)
    peak = up[: len(x) * 4].reshape(-1, 4).max(axis=1)
    need = np.minimum(1.0, 10 ** (ceiling_db / 20) / np.maximum(peak, 1e-9))
    look = int(lookahead_ms / 1000 * SR)
    held = minimum_filter1d(need, size=2 * look + 1)
    r = 1 - np.exp(-1 / (release_ms / 1000 * SR))
    gain = np.empty_like(held)
    cur = 1.0
    for i, v in enumerate(held):
        cur = v if v < cur else cur + (v - cur) * r
        gain[i] = cur
    gain = uniform_filter1d(gain, size=look + 1)
    return x * gain[:, None], float(20 * np.log10(gain.min()))


def db(g):
    return 10 ** (g / 20)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lowpass(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def highpass(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def reverb_ir(rt60, length, bright=5000, predelay=0.012, seed=1):
    """Stereo, decorrelated exponentially-decaying noise with early taps."""
    rng = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for ch in range(2):
        tail = lowpass(rng.standard_normal(n), bright, order=1) * np.exp(-6.91 * t / rt60)
        tail[: int(predelay * SR)] = 0
        for d, g in [(0.011, 0.5), (0.019, 0.35), (0.027, 0.3), (0.037, 0.22)]:
            tail[int((d + 0.003 * ch) * SR)] += g * (1 if rng.random() > 0.5 else -1) * 3
        ir[:, ch] = tail
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def place(bus, sig, t, pan=0.0):
    """Add a mono signal to a stereo bus at time t with constant-power pan."""
    i0 = int(round(t * SR))
    if i0 < 0:
        sig, i0 = sig[-i0:], 0
    if i0 >= len(bus):
        return
    sig = sig[: len(bus) - i0]
    left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[i0:i0 + len(sig), 0] += sig * left * np.sqrt(2)
    bus[i0:i0 + len(sig), 1] += sig * right * np.sqrt(2)


# ---------------------------------------------------------------- music
NOTE = {"C": 0, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}


def midi(name):
    pitch, octave = name[:-1], int(name[-1])
    return 12 * (octave + 1) + NOTE[pitch]


def hz(name):
    return 440.0 * 2 ** ((midi(name) - 69) / 12)


def felt_piano(f0, hold, vel):
    """Soft, dark piano tone: inharmonic partials, felt attack, damper release."""
    ring = 2.8
    n = int((hold + ring) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    inharm = 0.00035
    for k in range(1, 11):
        fk = k * f0 * np.sqrt(1 + inharm * k * k)
        if fk > 9000:
            break
        amp = (1 / k ** 1.9) * (0.55 + 0.45 * vel) ** (k - 1)
        decay = 2.6 / (1 + 0.7 * (k - 1)) * (262 / f0) ** 0.25
        out += amp * np.sin(2 * np.pi * fk * t + RNG.uniform(0, 2 * np.pi)) * np.exp(-t / decay)
    out *= 1 - np.exp(-t / 0.006)  # felt hammer: no hard click
    damper = np.where(t < hold, 1.0, np.exp(-(t - hold) / 0.28))
    thump = lowpass(RNG.standard_normal(n), 600, order=2) * np.exp(-t / 0.012) * 0.05
    return (out * damper + thump) * vel


def pad_tone(f0, length, attack=0.9, release=1.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for detune in (-0.0035, 0.0, 0.0041):
        for k, a in ((1, 1.0), (2, 0.28), (3, 0.1)):
            out += a * np.sin(2 * np.pi * f0 * k * (1 + detune) * t + RNG.uniform(0, 6.28))
    env = np.minimum(1, t / attack) * np.minimum(1, np.maximum(0, (length - t) / release))
    return out * env / 3


# (bar start in bars, chord voicing, bass, melody [(beat, note)])
BARS = [
    (0, ["F3", "A3", "C4", "D4"], "Bb2", [(1, "F4"), (2, "A4"), (3, "C5")]),   # Bbmaj9  - the question
    (1, ["E3", "A3", "C4", "G4"], "F2", [(1, "E5"), (2, "C5"), (3, "A4")]),    # Fmaj9   - GCSE Study Desk
    (2, ["F3", "A3", "C4", "E4"], "D3", [(1, "F4"), (2, "A4"), (3, "E5")]),    # Dm9     - choose a subject
    (3, ["D4", "F4", "A4"], "Bb2", [(1, "D5"), (2, "A4"), (3, "F4")]),         # Bbmaj7  - one step
    (4, ["Bb3", "D4", "F4", "A4"], "G2", [(1, "Bb4"), (2, "D5"), (3, "A4")]),  # Gm9     - practise
    (5, ["Bb3", "D4", "F4", "G4"], "C3", [(1, "G4"), (2, "Bb4"), (3, "D5")]),  # C9sus4  - worked method
    (6, ["A3", "C4", "E4", "G4"], "F2", [(1, "E5"), (2, "G5"), (3, "C5")]),    # Fmaj9   - retry, correct
    (7, ["F3", "A3", "C4", "D4"], "Bb2", [(1, "D5")]),                         # Bbmaj9  - end card...
    (7.5, ["A3", "C4", "F4", "G4"], "F2", [(0.75, "C5"), (1.5, "A4")]),        # ...Fadd9, home
]
BPM = 80
BEAT = 60 / BPM
BAR = 4 * BEAT


def music():
    piano = np.zeros((N, 2))
    pad = np.zeros((N, 2))
    for idx, (bar, voicing, bass, melody) in enumerate(BARS):
        t0 = bar * BAR
        nxt = BARS[idx + 1][0] * BAR if idx + 1 < len(BARS) else DUR
        hold = nxt - t0
        human = lambda: RNG.uniform(-0.008, 0.008)
        place(piano, felt_piano(hz(bass), hold - 0.05, 0.62), t0 + human(), pan=-0.05)
        for j, name in enumerate(voicing):  # a gentle roll, low to high
            place(piano, felt_piano(hz(name), hold - 0.1, 0.40 + 0.03 * j), t0 + 0.022 * (j + 1) + human(), pan=-0.25 + 0.5 * j / max(1, len(voicing) - 1))
        for beat, name in melody:
            place(piano, felt_piano(hz(name), 1.1, 0.36 + RNG.uniform(-0.03, 0.03)), t0 + beat * BEAT + human(), pan=RNG.uniform(-0.3, 0.3))
        for j, name in enumerate(voicing):
            f = hz(name) * 2
            place(pad, pad_tone(f, hold + 1.0), max(0.0, t0 - 0.3), pan=-0.4 + 0.8 * j / max(1, len(voicing) - 1))
    piano = lowpass(piano.T, 3200).T
    pad = lowpass(pad.T, 1400).T * 0.06
    dry = piano + pad
    wet = np.stack([fftconvolve(dry[:, c], reverb_ir(2.1, 3.0, 4500, seed=7)[:, c])[:N] for c in range(2)], axis=1)
    mix = dry * 0.78 + wet * 0.30
    # Soft start, and let the last chord settle to silence by the final frame.
    t = np.arange(N) / SR
    mix *= np.minimum(1, t / 0.03)[:, None]
    mix *= np.clip((DUR - t) / 0.9, 0, 1)[:, None] ** 1.5
    return highpass(mix.T, 45).T


# ---------------------------------------------------------------- sfx
def env_exp(n, tau):
    return np.exp(-np.arange(n) / SR / tau)


def sfx_tick():
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    s = 0.6 * np.sin(2 * np.pi * 1480 * t) * env_exp(n, 0.016)
    s += 0.2 * np.sin(2 * np.pi * 2960 * t) * env_exp(n, 0.007)
    s += 0.35 * np.sin(2 * np.pi * 240 * t) * env_exp(n, 0.028)
    return highpass(s * (1 - np.exp(-t / 0.0015)), 120)


def sfx_tap():
    n = int(0.2 * SR)
    t = np.arange(n) / SR
    click = bandpass(RNG.standard_normal(n), 1200, 6000) * env_exp(n, 0.0018) * 0.9
    body = 0.55 * np.sin(2 * np.pi * 540 * t) * env_exp(n, 0.045) + 0.25 * np.sin(2 * np.pi * 1080 * t) * env_exp(n, 0.022)
    low = 0.4 * np.sin(2 * np.pi * 150 * t) * env_exp(n, 0.035)
    return highpass((click + body + low) * (1 - np.exp(-t / 0.001)), 90)


def sfx_pencil(dur, circle=False):
    n = int((dur + 0.08) * SR)
    t = np.arange(n) / SR
    grit = bandpass(RNG.standard_normal(n), 1800, 7500, order=2)
    grain = bandpass(RNG.standard_normal(n), 300, 1000, order=1) * 0.25
    flutter = 0.65 + 0.35 * lowpass(RNG.standard_normal(n), 28, order=1) / 0.12
    shape = np.zeros(n)
    if circle:
        shape[: int(dur * SR)] = 1.0
    else:  # handwriting: separate strokes with tiny lifts of the pencil
        pos = 0.0
        while pos < dur:
            seg = RNG.uniform(0.05, 0.11)
            a, b = int(pos * SR), int(min(dur, pos + seg) * SR)
            shape[a:b] = RNG.uniform(0.7, 1.0)
            pos += seg + RNG.uniform(0.018, 0.045)
    shape = lowpass(shape, 60, order=1)
    return (grit + grain) * np.clip(flutter, 0.2, 1.4) * shape * 0.5


def bell(f, n):
    t = np.arange(n) / SR
    s = np.zeros(n)
    for ratio, amp, tau in ((1.0, 1.0, 0.9), (2.0, 0.22, 0.45), (3.01, 0.07, 0.25), (4.2, 0.04, 0.18)):
        s += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t / tau)
    return s * (1 - np.exp(-t / 0.003))


def sfx_chime():
    n = int(1.8 * SR)
    s = bell(hz("C6"), n) * 0.55
    d = int(0.11 * SR)
    s[d:] += bell(hz("F6"), n - d) * 0.6
    return s


def sfx_stamp():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f = 140 * np.exp(-t / 0.08) + 70
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.07)
    tack = bandpass(RNG.standard_normal(n), 600, 2600) * env_exp(n, 0.012) * 0.35
    return (thump + tack) * (1 - np.exp(-t / 0.002))


def sfx_paper():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    s = bandpass(RNG.standard_normal(n), 900, 5200)
    s *= np.minimum(1, t / 0.07) * np.exp(-np.maximum(0, t - 0.07) / 0.18)
    s *= 0.6 + 0.4 * np.abs(lowpass(RNG.standard_normal(n), 40, order=1)) / 0.1
    return s * 0.25


def effects(cues):
    bus = np.zeros((N, 2))
    make = {
        "tick": lambda c: sfx_tick() * 0.55,
        "tap": lambda c: sfx_tap(),
        "pencil": lambda c: sfx_pencil(c["dur"], c.get("circle", False)),
        "chime": lambda c: sfx_chime(),
        "stamp": lambda c: sfx_stamp() * 0.9,
        "paper": lambda c: sfx_paper(),
    }
    for c in cues:
        pan = {"pencil": -0.12, "tap": 0.08}.get(c["kind"], 0.0)
        place(bus, make[c["kind"]](c) * c.get("gain", 1.0), c["t"], pan=pan)
    room = reverb_ir(0.45, 0.8, 6000, predelay=0.006, seed=3)
    wet = np.stack([fftconvolve(bus[:, ch], room[:, ch])[:N] for ch in range(2)], axis=1)
    return bus + wet * 0.12


# ---------------------------------------------------------------- mix
def speech_mask(vo_lines):
    t = np.arange(N) / SR
    mask = np.zeros(N)
    for line in vo_lines:
        a, b = line["words"][0]["start"] - 0.12, line["words"][-1]["end"] + 0.1
        mask[(t >= a) & (t < b)] = 1.0
    # Smooth: quick duck (120 ms), slow recovery (450 ms).
    out = np.zeros(N)
    up, down = 1 - np.exp(-1 / (0.12 * SR)), 1 - np.exp(-1 / (0.45 * SR))
    lookahead = int(0.12 * SR)
    m = np.concatenate([mask[lookahead:], np.zeros(lookahead)])
    level = 0.0
    for i in range(N):
        level += (m[i] - level) * (up if m[i] > level else down)
        out[i] = level
    return out


def main():
    vo, sr = sf.read(BUILD / "vo.wav", dtype="float64")
    assert sr == SR and len(vo) == N, (sr, len(vo))
    vo_meta = json.loads((BUILD / "vo.json").read_text())
    cues = json.loads((BUILD / "sfx.json").read_text())

    vo = highpass(vo, 80)
    speech_rms = 10 * np.log10(np.mean(vo[np.abs(vo) > 0.002] ** 2))
    vo = compress(vo, speech_rms + 1.0)
    vo_st = np.stack([vo, vo], axis=1)
    mus = music()
    fx = effects(cues)

    l_vo = lufs(vo_st)
    mus *= db((l_vo - MUSIC_BELOW_VO) - lufs(mus))
    fx *= db((l_vo - SFX_BELOW_VO) - lufs(fx))
    duck = db(DUCK_DB * speech_mask(vo_meta["lines"]))
    mus_ducked = mus * duck[:, None]

    bus = vo_st + mus_ducked + fx
    gain = TARGET_LUFS - lufs(bus)
    for _ in range(3):  # limiting shaves loudness a touch; converge on target
        mix, reduction = limit(bus * db(gain), TRUE_PEAK_CEILING - 0.1)
        miss = TARGET_LUFS - lufs(mix)
        if abs(miss) < 0.1:
            break
        gain += miss

    for name, stem in (("vo", vo_st), ("music", mus_ducked), ("sfx", fx)):
        sf.write(BUILD / f"stem_{name}.wav", stem * db(gain), SR, subtype="PCM_24")
    sf.write(BUILD / "mix.wav", mix, SR, subtype="PCM_24")

    speech = speech_mask(vo_meta["lines"]) > 0.5
    report = {
        "integrated_lufs": round(lufs(mix), 2),
        "max_limiter_reduction_db": round(reduction, 2),
        "true_peak_dbtp": round(true_peak_db(mix), 2),
        "voice_lufs": round(lufs(vo_st * db(gain)), 2),
        "music_lufs_under_speech": round(lufs((mus_ducked * db(gain))[speech]), 2),
        "music_lufs_between_lines": round(lufs((mus_ducked * db(gain))[~speech]), 2),
        "sfx_lufs": round(lufs(fx * db(gain)), 2),
    }
    (BUILD / "mix_report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
