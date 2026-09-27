#!/usr/bin/env bash
# Render the Etsy listing images (3000×2250 JPG) for a pack or a single wallpaper.
#
#   scripts/etsy-listing/render.sh <pack-slug>        # pack listing, 6 photos
#   scripts/etsy-listing/render.sh <pack-slug> <NN>   # single listing, 3 photos + its 3 JPGs
#
# Needs scripts/etsy-pack.sh to have run first (reads etsy-out/<slug>/).
# Output: etsy-out/<slug>/listing/NN-<view>.jpg, in upload order; singles go to
# etsy-out/singles/<slug>-<NN>/ (photos in listing/, files to upload in files/).
set -euo pipefail

SLUG="${1:?usage: scripts/etsy-listing/render.sh <pack-slug> [NN]}"
SINGLE="${2:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
OUT="$ROOT/etsy-out/$SLUG/listing"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
VIEWS=(cover grid phones-a phones-b desktop included)
QUERY="slug=$SLUG"

[[ -d "$ROOT/etsy-out/$SLUG/4k" ]] || { echo "Run scripts/etsy-pack.sh $SLUG first" >&2; exit 1; }

if [[ -n "$SINGLE" ]]; then
  VIEWS=(s-cover s-full s-pack)
  QUERY="$QUERY&single=$SINGLE"
  DIR="$ROOT/etsy-out/singles/$SLUG-$SINGLE"
  OUT="$DIR/listing"
  mkdir -p "$DIR/files"
  for fmt in mobile 4k 5k; do
    src="$ROOT/etsy-out/$SLUG/$fmt/gradientwall-$SLUG-$SINGLE-$fmt.jpg"
    [[ -f "$src" ]] || { echo "Missing $src" >&2; exit 1; }
    cp "$src" "$DIR/files/"
  done
  echo "✓ $DIR/files (3 JPGs)"
fi
mkdir -p "$OUT"

i=1
for view in "${VIEWS[@]}"; do
  png="$OUT/.tmp-$view.png"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=3000,2250 --virtual-time-budget=8000 \
    --screenshot="$png" "file://$HERE/listing.html?$QUERY#$view" >/dev/null 2>&1
  jpg="$OUT/$(printf %02d $i)-$view.jpg"
  magick "$png" -strip -quality 90 "$jpg" && rm "$png"
  echo "✓ $jpg"
  i=$((i + 1))
done
