#!/usr/bin/env bash
# Build the Etsy deliverables for one wallpaper pack.
#
#   scripts/etsy-pack.sh <source-slug> [product-slug]
#
# product-slug names the Etsy product (files, ZIPs, output dir) when it differs
# from the web-store source folder — e.g. `acrylic impasto`.
#
# Two source layouts, picked automatically:
#
#   crop mode   public/assets/packs/<source-slug>/NN.jpg  (16:9 originals, e.g. Impasto)
#               Mobile is a centered vertical crop of the desktop master.
#   split mode  public/assets/packs/<source-slug>/NN_<name>.png          (9:16, mobile)
#             + public/assets/packs/<source-slug>/NN_<name>-desktop.png  (16:9, desktop)
#               Used when composition matters (e.g. Dessau): each format has its
#               own original, nothing is cropped away beyond fitting the aspect.
#
# Output:  etsy-out/<product-slug>/{4k,5k,mobile}/gradientwall-<slug>-NN-<fmt>.jpg
#          + one ZIP per format, split in two halves only when over Etsy's
#          20 MB/file limit (max 5 files per listing).
#
# Upscaling: Upscayl ×4 → Lanczos downscale to 3840×2160, 5120×2880 and 1320×2868 (iPhone Pro Max
# native; smaller iPhones scale it down). Model per mode, both validated
# visually: high-fidelity-4x for painterly texture (Impasto, 2026-09-24);
# digital-art-4x for flat vector art (Dessau, 2026-09-25) — high-fidelity
# invents blotches inside flat color fields.
set -euo pipefail

SOURCE="${1:?usage: scripts/etsy-pack.sh <source-slug> [product-slug]}"
SLUG="${2:-$SOURCE}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/assets/packs/$SOURCE"
OUT="$ROOT/etsy-out/$SLUG"
MASTER="$OUT/.master"

UPSCAYL_APP="${UPSCAYL_APP:-/Applications/Upscayl.app}"
UPSCAYL_BIN="$UPSCAYL_APP/Contents/Resources/bin/upscayl-bin"
UPSCAYL_MODELS="$UPSCAYL_APP/Contents/Resources/models"
CROP_MODEL="${CROP_MODEL:-high-fidelity-4x}"
SPLIT_MODEL="${SPLIT_MODEL:-digital-art-4x}"
QUALITY="${QUALITY:-92}"

[[ -d "$SRC" ]] || { echo "No source dir: $SRC" >&2; exit 1; }
[[ -x "$UPSCAYL_BIN" ]] || { echo "Upscayl not found at $UPSCAYL_APP" >&2; exit 1; }
command -v magick >/dev/null || { echo "ImageMagick (magick) not found" >&2; exit 1; }

mkdir -p "$MASTER" "$OUT/4k" "$OUT/5k" "$OUT/mobile"

# upscale <src> <master.png> <model> — cached: masters survive between runs.
upscale() {
  if [[ ! -f "$2" ]]; then
    echo "↑ upscaling $(basename "$1") ($3)"
    "$UPSCAYL_BIN" -i "$1" -o "$2" -s 4 -m "$UPSCAYL_MODELS" -n "$3" -f png >/dev/null 2>&1
  fi
}

# fit <master> <WxH> <out.jpg> — scale to cover, then center-crop to the exact size.
fit() {
  magick "$1" -filter Lanczos -resize "$2^" -gravity center -extent "$2" -strip -quality "$QUALITY" "$3"
}

# warn_aspect <file> <w> <h> — flag originals that aren't the expected aspect (±2%).
warn_aspect() {
  local dims; dims=$(magick identify -format "%w %h" "$1")
  awk -v d="$dims" -v w="$2" -v h="$3" -v f="$(basename "$1")" 'BEGIN {
    split(d, a, " "); r = (a[1] / a[2]) / (w / h);
    if (r < 0.98 || r > 1.02) printf "⚠ %s is %sx%s, expected %s:%s — will be cropped to fit\n", f, a[1], a[2], w, h > "/dev/stderr" }'
}

if compgen -G "$SRC/[0-9]*-desktop.png" >/dev/null; then
  echo "Split mode (separate mobile + desktop originals)"
  for mobile_src in "$SRC"/[0-9]*.png; do
    [[ "$mobile_src" == *-desktop.png ]] && continue
    base="$(basename "$mobile_src" .png)"
    desktop_src="$SRC/$base-desktop.png"
    [[ -f "$desktop_src" ]] || { echo "Missing desktop original: $desktop_src" >&2; exit 1; }
    n="${base%%_*}"
    file="gradientwall-$SLUG-$n"
    warn_aspect "$mobile_src" 9 16
    warn_aspect "$desktop_src" 16 9

    upscale "$mobile_src" "$MASTER/$base-mobile.png" "$SPLIT_MODEL"
    upscale "$desktop_src" "$MASTER/$base-desktop.png" "$SPLIT_MODEL"

    echo "→ exporting $n"
    fit "$MASTER/$base-desktop.png" 3840x2160 "$OUT/4k/$file-4k.jpg"
    fit "$MASTER/$base-desktop.png" 5120x2880 "$OUT/5k/$file-5k.jpg"
    fit "$MASTER/$base-mobile.png" 1320x2868 "$OUT/mobile/$file-mobile.jpg"
  done
else
  echo "Crop mode (mobile cropped from the 16:9 original)"
  # Numbered images only — cover.jpg is a duplicate of 01 used by the web store.
  for src in "$SRC"/[0-9]*.jpg; do
    name="$(basename "$src" .jpg)"
    master="$MASTER/$name.png"
    file="gradientwall-$SLUG-$name"
    upscale "$src" "$master" "$CROP_MODEL"

    echo "→ exporting $name"
    magick "$master" -filter Lanczos -resize 3840x2160! -strip -quality "$QUALITY" "$OUT/4k/$file-4k.jpg"
    magick "$master" -filter Lanczos -resize 5120x2880! -strip -quality "$QUALITY" "$OUT/5k/$file-5k.jpg"
    magick "$master" -gravity center -crop 1657x3600+0+0 +repage \
      -filter Lanczos -resize 1320x2868! -strip -quality "$QUALITY" "$OUT/mobile/$file-mobile.jpg"
  done
fi

LIMIT=$((20 * 1000 * 1000))
cd "$OUT"
rm -f ./*.zip
# One ZIP per format; halves (part1/part2) only when a single ZIP would exceed the limit.
for fmt in 4k 5k mobile; do
  files=("$fmt"/*.jpg)
  zip -qj "gradientwall-$SLUG-$fmt.zip" "${files[@]}"
  if (( $(stat -f%z "gradientwall-$SLUG-$fmt.zip") >= LIMIT )); then
    rm "gradientwall-$SLUG-$fmt.zip"
    half=$(( (${#files[@]} + 1) / 2 ))
    zip -qj "gradientwall-$SLUG-$fmt-part1.zip" "${files[@]:0:half}"
    zip -qj "gradientwall-$SLUG-$fmt-part2.zip" "${files[@]:half}"
  fi
done

for z in ./*.zip; do
  size=$(stat -f%z "$z")
  (( size < LIMIT )) || echo "⚠ $z is over Etsy's 20 MB limit ($size bytes)" >&2
done
(( $(ls ./*.zip | wc -l) <= 5 )) || echo "⚠ more than 5 ZIPs — Etsy allows 5 files per listing" >&2

echo "Done → $OUT"
du -h "$OUT"/*.zip
