#!/usr/bin/env bash
# One-time setup for a fresh clone. Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")"
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: apt-get install -y ffmpeg"; exit 1; }
npm install --silent --no-audit --no-fund
node -e "require('playwright')" 2>/dev/null || npm install --silent --no-audit --no-fund playwright
pip install --quiet --break-system-packages kokoro-onnx soundfile faster-whisper numpy pillow 2>/dev/null \
  || pip install --quiet kokoro-onnx soundfile faster-whisper numpy pillow
mkdir -p cache
base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
for f in kokoro-v1.0.onnx voices-v1.0.bin; do
  [ -s "cache/$f" ] || curl -fsSL -o "cache/$f" "$base/$f"
done
echo "setup done"
