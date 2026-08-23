#!/bin/zsh
# reseed.sh <dir> <outfile> <title>
# Reseeds a design artifact: all .dc.html artboards + referenced images that exist in ../img.
set -e
BASE="/private/tmp/claude-501/bundled-skills/2.1.239/26dd987df29c0e80fe1dd11ea5ba6ddf/design"
DIR="$1"; OUT="$2"; TITLE="$3"
cd "/Users/codemeplz/Projects/Itinerary/design/$DIR"

args=(--template "$BASE/payload.template.html" --out "$OUT" --title "$TITLE" --canvas canvas.json)
for f in *.dc.html; do args+=(--artboard "$f"); done

# collect referenced jpgs that actually exist in ../img
imgs=($(grep -rho '[a-z]*\.jpg' *.dc.html | sort -u))
for im in $imgs; do
  if [ -f "../img/$im" ]; then args+=(--image "../img/$im"); fi
done

node "$BASE/seed-canvas.mjs" "${args[@]}"
