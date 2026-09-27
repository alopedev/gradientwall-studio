#!/usr/bin/env bash
# Render the Etsy shop banner (3360×840 JPG) from every pack's phone exports.
#
#   scripts/etsy-listing/render-banner.sh
#
# Needs scripts/etsy-pack.sh to have run for each pack in banner.html's PICKS.
# Output: etsy-out/shop/banner.jpg
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
OUT="$ROOT/etsy-out/shop"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

mkdir -p "$OUT"
png="$OUT/.tmp-banner.png"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=3360,840 --virtual-time-budget=8000 \
  --screenshot="$png" "file://$HERE/banner.html" >/dev/null 2>&1
magick "$png" -strip -quality 90 "$OUT/banner.jpg" && rm "$png"
echo "✓ $OUT/banner.jpg"
