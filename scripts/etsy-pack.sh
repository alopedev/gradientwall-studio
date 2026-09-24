#!/usr/bin/env bash
# Build the Etsy deliverables for one wallpaper pack.
#
#   scripts/etsy-pack.sh <pack-slug>
#
# Source:  public/assets/packs/<slug>/*.jpg  (1600×900 originals)
# Output:  etsy-out/<slug>/{4k,5k,mobile}/*.jpg + 5 ZIPs, each under Etsy's
#          20 MB/file limit (max 5 files per listing): 4k and 5k are split
#          into two halves (01-05, 06-10), mobile fits in one.
#
# Pipeline per image: Upscayl ×4 (high-fidelity model, validated visually on
# 2026-09-24) → 6400×3600 master → Lanczos downscale to each format.
# Mobile is a centered vertical crop of the master (1657×3600) scaled to
# 1320×2868 (iPhone Pro Max native; smaller iPhones scale it down).
set -euo pipefail

SLUG="${1:?usage: scripts/etsy-pack.sh <pack-slug>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/assets/packs/$SLUG"
OUT="$ROOT/etsy-out/$SLUG"
MASTER="$OUT/.master"

UPSCAYL_APP="${UPSCAYL_APP:-/Applications/Upscayl.app}"
UPSCAYL_BIN="$UPSCAYL_APP/Contents/Resources/bin/upscayl-bin"
UPSCAYL_MODELS="$UPSCAYL_APP/Contents/Resources/models"
MODEL="high-fidelity-4x"
QUALITY="${QUALITY:-92}"

[[ -d "$SRC" ]] || { echo "No source dir: $SRC" >&2; exit 1; }
[[ -x "$UPSCAYL_BIN" ]] || { echo "Upscayl not found at $UPSCAYL_APP" >&2; exit 1; }
command -v magick >/dev/null || { echo "ImageMagick (magick) not found" >&2; exit 1; }

mkdir -p "$MASTER" "$OUT/4k" "$OUT/5k" "$OUT/mobile"

# Numbered images only — cover.jpg is a duplicate of 01 used by the web store.
for src in "$SRC"/[0-9]*.jpg; do
  name="$(basename "$src" .jpg)"
  master="$MASTER/$name.png"
  file="gradientwall-$SLUG-$name"

  if [[ ! -f "$master" ]]; then
    echo "↑ upscaling $name"
    "$UPSCAYL_BIN" -i "$src" -o "$master" -s 4 -m "$UPSCAYL_MODELS" -n "$MODEL" -f png >/dev/null 2>&1
  fi

  echo "→ exporting $name"
  magick "$master" -filter Lanczos -resize 3840x2160! -strip -quality "$QUALITY" "$OUT/4k/$file-4k.jpg"
  magick "$master" -filter Lanczos -resize 5120x2880! -strip -quality "$QUALITY" "$OUT/5k/$file-5k.jpg"
  magick "$master" -gravity center -crop 1657x3600+0+0 +repage \
    -filter Lanczos -resize 1320x2868! -strip -quality "$QUALITY" "$OUT/mobile/$file-mobile.jpg"
done

cd "$OUT"
rm -f ./*.zip
for fmt in 4k 5k; do
  zip -qj "gradientwall-$SLUG-$fmt-part1.zip" "$fmt"/*-0[1-5]-"$fmt".jpg
  zip -qj "gradientwall-$SLUG-$fmt-part2.zip" "$fmt"/*-{0[6-9],1[0-9]}-"$fmt".jpg
done
zip -qj "gradientwall-$SLUG-mobile.zip" mobile/*.jpg

LIMIT=$((20 * 1000 * 1000))
for z in ./*.zip; do
  size=$(stat -f%z "$z")
  (( size < LIMIT )) || echo "⚠ $z is over Etsy's 20 MB limit ($size bytes)" >&2
done

echo "Done → $OUT"
du -h "$OUT"/*.zip
