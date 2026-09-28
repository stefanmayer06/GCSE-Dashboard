# GCSE Study Desk — 25-second Reddit video ad

A vertical, sound-off-first ad that turns "What should I revise next?" into one
manageable next step, then teases the app and upcoming features as *coming
soon*. It is built in the Trailhead design language (see `DESIGN.md` at the
repo root) and rendered from code, so every frame, caption and sound cue comes
from one timeline and can be re-rendered exactly.

| Deliverable | File |
| --- | --- |
| Final ad (upload this) | [`out/gcse-study-desk-reddit-ad-25s-1080x1920.mp4`](out/gcse-study-desk-reddit-ad-25s-1080x1920.mp4) |
| Caption sidecar (same text and timing as the burned-in captions) | [`out/captions.srt`](out/captions.srt) |
| Custom thumbnail (frame at 10.4 s) | [`out/thumbnail.png`](out/thumbnail.png) |
| 12-panel storyboard rendered from the same source | [`out/storyboard.png`](out/storyboard.png) |

## Technical spec

| | |
| --- | --- |
| Frame | 1080 × 1920 (9:16), 30 fps, exactly 25.000 s (750 frames) |
| Video | H.264 High @ L4.2, CRF 14, yuv420p, BT.709, `+faststart` |
| Audio | AAC-LC 192 kb/s, 48 kHz stereo |
| Loudness | −16 LUFS integrated, −1.6 dBTP true peak, LRA 5.8 LU (measured on the encoded file) |
| Captions | Burned in, verbatim voiceover, word-timed; also supplied as SRT |
| Safe area | Every word of copy and all key UI sits inside the centred 4:5 band (y = 285–1635 px), so nothing is lost if Reddit shows the video cropped to 4:5 in the feed. Captions sit at y ≈ 1432–1608. |
| Motion | One continuous camera that scrolls down the trail five times (1.1 s sine ease, 180° motion blur while moving). No hard cuts. |

## Storyboard

Times are seconds on the final timeline. VO lines are the approved script,
verbatim; the caption for each line appears 0.12 s before the first word.

| Time | Picture and animation | On-screen text | Voiceover (= captions) | Sound |
| --- | --- | --- | --- | --- |
| **0.0–3.0** Hook | Warm paper `#F7F4EC`. Six handwritten revision notes — *Fractions?*, *4x + 6 = 30*, *Quadratics*, *Ratio?*, *Language Paper 1*, *Creative writing?* — pop into place around frame 0 (slight rotations, white pebble cards, hairline borders). A trailhead node appears (0.85 s) and a trail of connected dots draws down through the pile (0.9–3.3 s); the notes ease aside to clear the path. The camera scrolls down the trail (2.45–3.55 s). | **WHAT SHOULD I REVISE NEXT?** (Fraunces 600 capitals, 112 px, visible from frame 0) | 0.35 s "Not sure what to revise next?" | Soft paper rustle 0.05 s; tick 0.85 s. Music bar 1: B♭maj9 |
| **3.0–7.4** Three subjects | The trail reaches the left margin and becomes a timeline. Three pebble cards rise onto its nodes in sequence (3.3, 3.8, 4.3 s): **Maths Foundation**, **Maths Higher**, **English** (letter badges M, H, E as on the landing page). Each card lights in its own subject colour only while it is the newest — indigo, then teal, then amber — and settles to neutral when the next arrives, so only one subject colour is on screen at a time. | — | 3.00 s "GCSE Study Desk helps you find one useful next step." | Soft tick as each card lands. Bar 2: Fmaj9 |
| **7.4–12.0** One step | A tap lands on Maths Foundation exactly as the voice says "Foundation" (7.95 s): the card lights indigo and the trail continues in indigo. The other cards lift away as the camera scrolls (8.6–9.7 s). The **Today** card (V4 hero style: ink border, indigo rule, cut-paper lift) settles onto the trail (9.2–9.9 s): TODAY · MATHS FOUNDATION / *Solving Equations* / Short practice · 5 questions / **Start today's revision →**. The learner taps Start (10.95 s); the card presses to 98 %. | **ONE STEP IS ENOUGH TODAY.** (105 px, 9.55–11.7 s) | 7.40 s "Choose Maths Foundation, Maths Higher, or English." | Screen tap 7.95 s; tick 9.45 s; tap 10.95 s. Bars 3–4: Dm9, B♭maj7 |
| **12.0–16.9** Practise, then the method | Question card rises: QUESTION 1 OF 5 · 2 MARKS / **Solve 4x + 6 = 30**. A beat, then the learner's handwritten working appears stroke by stroke: *4x = 36* (12.85 s), *x = 9* (13.6 s). A soft indigo pencil circle marks where it slipped, round the *36* (14.3 s). A calm worked-method card rises beneath (14.5 s): WORKED METHOD / ① Subtract 6 from both sides → **4x = 24** / ② Divide both sides by 4 → **x = 6**, with marker highlights on 24 and 6, then a dashed chip: SAVED FOR A RETRY · 1 DAY (16.0 s). No red, no crosses, no "wrong". | — | 12.30 s "Practise exam-style questions, see a worked method, and revisit mistakes as you learn." (captioned in two cards, switching at "and") | Pencil strokes 12.85, 13.6 s; pencil circle 14.3 s; ticks. Bars 5–6: Gm9, C9sus4 |
| **16.9–20.3** Come back to it | The trail curls into a loop in the margin and arrives at a retry point (16.85–17.75 s). Retry card: RETRY · 1 DAY LATER / Solve 4x + 6 = 30; the learner writes *x = 6* (18.15 s). Correct: a small green wash behind the answer, a green hairline border and a ✓ CORRECT pill pop in (18.8 s). A mastery trail card rises: *Solving Equations*; the indigo progress bar fills 52 → 80 % (19.45–20.15 s) and the stage pill stamps from DEVELOPING to ✓ SECURE (20.1 s). | **LEARN IT. / COME BACK TO IT. / MAKE IT STICK.** (88 px, one line at a time: 17.45, 18.0, 18.55 s) | — (no voice; the on-screen line carries it) | Pencil 18.15 s; two-note chime C6→F6 18.8 s; soft stamp 20.1 s. Bar 7: Fmaj9 (the lift) |
| **20.3–25.0** End card | The world fades while the trail sweeps from the margin into the SD mark (ink rounded square, as in the app's sidebar logo), which stamps in (21.05 s). **GCSE STUDY DESK** rises (21.25 s), then a dashed pill **APP & NEW FEATURES COMING SOON** (21.65 s) — dashed means "not yet" in the Trailhead language — and *Thanks for being here.* (23.1 s). Hold to the last frame. | GCSE STUDY DESK / APP & NEW FEATURES COMING SOON / Thanks for being here. | 20.95 s "App and new features coming soon." · 23.20 s "Thanks for being here." | Stamp 21.05 s. B♭maj9 → Fadd9; music settles to silence by 25.0 s |

## Voiceover

> Not sure what to revise next? GCSE Study Desk helps you find one useful next
> step. Choose Maths Foundation, Maths Higher, or English. Practise exam-style
> questions, see a worked method, and revisit mistakes as you learn. App and new
> features coming soon. Thanks for being here.

| Line | Starts | Ends |
| --- | --- | --- |
| Not sure what to revise next? | 0.35 | 2.07 |
| GCSE Study Desk helps you find one useful next step. | 3.00 | 6.46 |
| Choose Maths Foundation, Maths Higher, or English. | 7.40 | 10.06 |
| Practise exam-style questions, see a worked method, and revisit mistakes as you learn. | 12.30 | 16.78 |
| App and new features coming soon. | 20.95 | 22.78 |
| Thanks for being here. | 23.20 | 24.31 |

**Voice used:** Kokoro-82M, British English voice `bf_emma` (Apache-2.0),
synthesised line by line with no pitch or time effects, then lightly compressed.
"GCSE" is spoken as letters and "Maths" with a British *a*. An independent
Whisper transcription of the final mix matches the script word for word ("Practise"
is heard as its homophone "practice").

**This is a synthetic voice.** For the paid campaign, a human British
voiceover (warm, unhurried, about 150 words per minute, no "hype" lift at the
ends of lines) will sound more natural. To swap one in:

1. Record each line to start at the times above (a line may run up to 0.3 s
   long before it collides with the next beat).
2. Replace `build/vo.wav` with a 48 kHz mono, 25.000 s file.
3. Update the word timings in `src/vo-data.js` (for example with Whisper word
   timestamps) so the captions and music ducking follow the new take.
4. Run `SKIP_TTS=1 scripts/build.sh`.

## Captions

Inter SemiBold 50 px, ink on a white pebble card with a hairline border, at most
two lines, centred, bottom edge 312 px above the frame. Text is the spoken
script verbatim. `src/ad.js` refuses to render if the caption text or the words
timing each card ever drift from the voiceover.

| # | In → out | Text |
| --- | --- | --- |
| 1 | 0.24 → 2.57 | Not sure what to revise next? |
| 2 | 2.87 → 6.96 | GCSE Study Desk helps you / find one useful next step. |
| 3 | 7.26 → 10.56 | Choose Maths Foundation, / Maths Higher, or English. |
| 4 | 12.16 → 15.13 | Practise exam-style questions, / see a worked method, |
| 5 | 15.13 → 17.28 | and revisit mistakes / as you learn. |
| 6 | 20.83 → 22.98 | App and new features / coming soon. |
| 7 | 23.06 → 24.81 | Thanks for being here. |

## Music and sound

Everything is synthesised in `scripts/audio.py`. There are no samples or stock
tracks, so there is nothing to license.

- **Music:** soft felt piano and a quiet pad in F major at 80 bpm. One bar lasts
  3 s, so bar lines land on the shot changes at 0, 3, 12, 18 and 21 s. Chords:
  B♭maj9 · Fmaj9 · Dm9 · B♭maj7 · Gm9 · C9sus4 · Fmaj9 · B♭maj9 → Fadd9 (a warm
  plagal close on the end card).
- **Effects:** soft ticks when cards and trail nodes land, a screen tap for the
  subject choice and Start, pencil strokes for the learner's working, a two-note
  chime for the correct answer and a paper stamp for SECURE and the logo. The
  cue times come from the animation itself (`window.SFX` in `src/ad.js`).
- **Mix:** the voice leads. Music is ducked 8 dB under speech, sitting about
  16 LU below the voice while it speaks and about 11 LU below between lines.
  Effects sit about 12 LU below the voice. The master is set to −16 LUFS
  integrated, with a look-ahead true-peak limiter at −1.5 dBTP.

## How the brief maps to Trailhead

- **Palette:** paper `#F7F4EC`, ink `#191C17`, white pebble cards with 2 px
  `#D9D3C0` hairlines, soft lift shadows. Subject hues: indigo `#4338CA`
  (Maths Foundation), teal/pine `#0F766E` (Maths Higher), amber/ember `#B45309`
  (English), each with its tint and ink. Green `#15803D` / wash `#DCF0E3` is kept
  for the correct answer and SECURE only.
- **One subject colour at a time:** each subject lights only while it is the
  active card. From the choice onwards the ad is indigo (Maths Foundation), and
  the end card is neutral ink.
- **Type:** Fraunces for headlines and titles (SOFT and WONK axes, as in the V4
  dashboard), Inter for body and UI, IBM Plex Mono for trail-marker labels. The
  smallest label is 30 px. Caveat handwriting is used only for the learner's
  own marks (notes, working, retry answer), so printed type always means "the
  product".
- **Motion:** cards rise into place (Trailhead ease-out), the trail draws
  forward, progress fills gradually, the correct answer gets a small green
  highlight, and SECURE and the logo stamp in with the spring ease.

## Checks against the brief

- [x] 25 s, 9:16, 1080 × 1920, built for phones and fully understandable with
      the sound off: headline text and burned-in captions carry every beat.
- [x] Large, readable text: headlines are 88–112 px, captions 50 px and labels
      at least 30 px. All copy is inside the 4:5 safe band.
- [x] Captions are accurate: verbatim and word-timed, checked with speech
      recognition on the final mix.
- [x] Every shot-plan beat is present: notes and a forming trail; three subject
      cards in sequence; the Today card on the trail and a practice session
      starting; an exam-style question, attempt and worked method; a loop back
      to a retry and SECURE; the exact end-card text.
- [x] No red crosses, no shame or failure language, no guilt about exams, no
      mascots, stock photos, neon, glass, confetti, fast cuts, testimonials or
      grade promises.
- [x] AQA is not named and no logo appears, so no endorsement is implied.
- [x] The app and new features appear only as "coming soon". There are no store
      badges and no download prompt.
- [x] No invented features. Every UI string mirrors current product copy:

| On screen | Source in this repo |
| --- | --- |
| Start today's revision | `website/clients/shared/next-step.js` (mission CTA) |
| Solving Equations | `website/server/src/subjects/maths/bank/topics.js` |
| Solve 4x + 6 = 30 · 2 marks · "Subtract 6 from both sides" · "Divide both sides by 4" | `website/server/src/subjects/maths/bank/q/equations.js` (template 2, a = 4, x = 6, b = 6) |
| Worked method | `website/clients/shared/StudyTools.jsx` (mistake notebook) |
| Retry · 1 day | `website/clients/maths/src/pages/Results.jsx` ("ready for the 1-day retry"); `PRODUCT.md` (retries after 1, 3, 7 and 21 days) |
| Developing → Secure | `website/clients/shared/next-step.js` (`masteryStage`) |
| 5 questions | `DESIGN.md` ("one lesson, five questions") |
| M / H / E subject letters | `website/selector/index.html` |
| SD mark | `website/clients/shared/v3.css` (`.logo-icon`) |

## Decisions to sign off

1. **Voiceover placement.** The VOICEOVER section is used word for word. The
   shot plan's VO lines paraphrase it, so they guided where each line falls.
   "Choose Maths Foundation, Maths Higher, or English" runs 7.4–10.1 s, so the
   7–12 s beat opens with the subject choice, timed to the spoken
   "Foundation", and the Today card settles at about 9.3 s rather than at 7 s.
2. **One question, end to end.** The practice question, worked method and
   retry all use the same real Foundation question, so the retry visibly proves
   the same skill came back and stuck.
3. **18–21 s has no voice.** "LEARN IT. COME BACK TO IT. MAKE IT STICK." carries
   the beat, with the chime and stamp.
4. **The voice is synthetic** (see above). Check Reddit's current ad policy on
   synthetic media before launch, or record a human take.

## Rebuild

Requirements: Node 18+, a Chromium binary (set `CHROMIUM=/path/to/chrome`),
ffmpeg with libx264, and Python 3.10+.

```bash
cd marketing/reddit-video-ad
npm install                        # playwright-core
pip install -r requirements.txt    # kokoro, soundfile, numpy, scipy
scripts/build.sh                   # fonts → voiceover → frames → audio → mux → stills
```

Useful while iterating:

```bash
node scripts/preview.mjs 4.4 10.4 19.2 --guides   # stills with the 4:5 safe band outlined
SUBFRAMES=1 node scripts/render.mjs              # fast draft render, no motion blur
node scripts/storyboard.mjs                      # regenerate out/storyboard.png
```

| Source | Purpose |
| --- | --- |
| `src/ad.html` | Layout, Trailhead tokens and every piece of on-screen copy |
| `src/ad.js` | The timeline: `renderFrame(t)`, trail, camera, captions and SFX cues |
| `src/vo-data.js` | Voiceover line and word timings (generated by `scripts/tts.py`) |
| `scripts/fetch_fonts.py` | Downloads Fraunces, Inter, IBM Plex Mono and Caveat (SIL OFL) to `src/fonts/` |
| `scripts/tts.py` | Synthesises and places the voiceover (`build/vo.wav`) |
| `scripts/render.mjs` | Captures 750 frames in headless Chromium and encodes the picture; writes `captions.srt` |
| `scripts/audio.py` | Music, effects and the loudness-managed mix (`build/mix.wav` and stems) |
| `scripts/build.sh` | Runs everything and muxes `out/*.mp4` |

## Asset checklist

- [x] Master video, H.264/AAC MP4, 1080 × 1920, 25 s
- [x] Captions: burned in, plus an SRT sidecar
- [x] Custom thumbnail (1080 × 1920 PNG)
- [x] Storyboard sheet (12 annotated stills)
- [x] Editable source and a one-command rebuild
- [x] Fonts: Fraunces, Inter, IBM Plex Mono, Caveat (all SIL OFL 1.1; fetched, not committed)
- [x] Voice: Kokoro-82M `bf_emma` (Apache-2.0)
- [x] Music and effects: original, generated in code
- [x] Audio stems (voice, music, effects) are regenerated in `build/` by `scripts/audio.py` for remixing
- [ ] Owner review: spelling, claims and the target subreddit's ad rules
- [ ] Optional: human British voiceover recorded to the timings above
