#!/usr/bin/env bash
# Writes the WebP variants the site serves through srcset (see
# src/lib/responsive-image.ts) for every JPEG/PNG under public/assets/packs/.
# Run after adding or replacing pack images; existing variants are skipped.
# Needs ImageMagick 7 (`magick`) or 6 (`convert`) with WebP support.
set -euo pipefail
cd "$(dirname "$0")/.."
if command -v magick >/dev/null; then IM=(magick); ID=(magick identify)
else IM=(convert); ID=(identify); fi
WIDTHS=(640 1280)

find public/assets/packs -type f \( -name '*.jpg' -o -name '*.png' \) | while read -r src; do
  width=$("${ID[@]}" -format '%w' "$src")
  for w in "${WIDTHS[@]}"; do
    (( w < width )) || continue
    out="${src%.*}-${w}w.webp"
    [[ -f "$out" ]] && continue
    "${IM[@]}" "$src" -resize "${w}x" -quality 80 -define webp:method=6 "$out"
    echo "wrote $out"
  done
done
