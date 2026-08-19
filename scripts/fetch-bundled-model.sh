#!/usr/bin/env bash
# Download the bundled on-device model into android assets so the release build
# ships it (preloaded). The binary is gitignored (see .gitignore) — this fetches
# it on demand. Run it after `expo prebuild` (which regenerates android/) and
# before building. The `noCompress 'gguf'` gradle rule is applied by the
# plugins/withBundledModel config plugin, so it survives prebuild on its own.
set -euo pipefail
DEST="android/app/src/main/assets/models/smollm2-360m-instruct-q8_0.gguf"
URL="https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct-GGUF/resolve/main/smollm2-360m-instruct-q8_0.gguf"
mkdir -p "$(dirname "$DEST")"
if [ -f "$DEST" ] && [ "$(stat -c%s "$DEST" 2>/dev/null || echo 0)" -gt 380000000 ]; then
  echo "Already present: $DEST"; exit 0
fi
echo "Downloading SmolLM2-360M-Instruct Q8_0 (~386MB)…"
curl -fL --retry 3 -o "$DEST" "$URL"
echo "Done: $DEST ($(stat -c%s "$DEST") bytes)"
