#!/usr/bin/env bash
# Render the Etsy listing images (3000×2250 JPG) for a pack.
#
#   scripts/etsy-listing/render.sh <pack-slug>
#
# Needs scripts/etsy-pack.sh to have run first (reads etsy-out/<slug>/).
# Output: etsy-out/<slug>/listing/NN-<view>.jpg, in upload order.
set -euo pipefail

SLUG="${1:?usage: scripts/etsy-listing/render.sh <pack-slug>}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
OUT="$ROOT/etsy-out/$SLUG/listing"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
VIEWS=(cover grid phones-a phones-b desktop included)

[[ -d "$ROOT/etsy-out/$SLUG/4k" ]] || { echo "Run scripts/etsy-pack.sh $SLUG first" >&2; exit 1; }
mkdir -p "$OUT"

i=1
for view in "${VIEWS[@]}"; do
  png="$OUT/.tmp-$view.png"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=3000,2250 --virtual-time-budget=8000 \
    --screenshot="$png" "file://$HERE/listing.html?slug=$SLUG#$view" >/dev/null 2>&1
  jpg="$OUT/$(printf %02d $i)-$view.jpg"
  magick "$png" -strip -quality 90 "$jpg" && rm "$png"
  echo "✓ $jpg"
  i=$((i + 1))
done
