#!/usr/bin/env bash
# Build the 25-second Reddit ad end to end.
#
#   scripts/build.sh            full build (fonts, voiceover, frames, audio, mux)
#   SKIP_TTS=1 scripts/build.sh reuse build/vo.wav (e.g. after swapping in a human take)
#
# Needs: Node 18+ with playwright-core, a Chromium binary (CHROMIUM=/path),
# ffmpeg with libx264, and Python 3.10+ with requirements.txt installed.
set -euo pipefail
cd "$(dirname "$0")/.."
PY="${PYTHON:-python3}"
OUT="out/gcse-study-desk-reddit-ad-25s-1080x1920.mp4"

[ -f src/fonts/fonts.css ] || "$PY" scripts/fetch_fonts.py
if [ "${SKIP_TTS:-0}" != "1" ]; then "$PY" scripts/tts.py; fi
node scripts/render.mjs
"$PY" scripts/audio.py

ffmpeg -hide_banner -loglevel error -y \
  -i build/video.mp4 -i build/mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -metadata title="GCSE Study Desk — Reddit ad (25 s)" \
  -movflags +faststart -shortest "$OUT"

# Review aids: a custom thumbnail and the storyboard sheet.
node scripts/preview.mjs 10.4 >/dev/null
ffmpeg -hide_banner -loglevel error -y -i build/preview/t10.40.png -frames:v 1 out/thumbnail.png
node scripts/storyboard.mjs
ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate,sample_rate,channels -of compact "$OUT"
