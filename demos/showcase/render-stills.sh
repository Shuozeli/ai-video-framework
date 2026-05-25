#!/usr/bin/env bash
# Render one still per scene from the showcase pipeline.
# Run from repo root.
set -euo pipefail

cd "$(dirname "$0")/../.."
RENDERER_DIR="packages/ai-video-renderer"
PROPS="demos/showcase/showcase-pipeline.json"
OUT="out/showcase/stills"
mkdir -p "$OUT"

# scene_name:mid_frame
scenes=(
  "title:60"
  "takeaways:168"
  "divider:276"
  "end-card:384"
  "stock-chart:492"
  "earnings:600"
  "pie:708"
  "big-number:816"
  "comparison:924"
  "ranking:1032"
  "heatmap:1140"
  "pip-quote:1248"
  "social:1356"
  "logic-flow:1494"
  "timeline:1662"
  "lower-third:1800"
)

cd "$RENDERER_DIR"
for entry in "${scenes[@]}"; do
  name="${entry%:*}"
  frame="${entry##*:}"
  out="../../$OUT/${name}.png"
  echo "→ $name @ frame $frame"
  ./node_modules/.bin/remotion still src/index.ts Video "$out" \
    --props="../../$PROPS" --frame="$frame" --log=error 2>&1 | tail -3
done

echo ""
echo "Done. Files in $OUT/"
ls -la "../../$OUT/"
