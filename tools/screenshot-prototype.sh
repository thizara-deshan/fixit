#!/usr/bin/env bash
# Screenshot every route of the offline prototype at desktop and phone width.
# Usage: tools/screenshot-prototype.sh "reference/prototype/Fixit - Prototype (offline).html" reference/screens
# Needs: chromium (or set CHROME=/path/to/chrome). Screens are tall so most pages fit in one image.
set -euo pipefail
SRC="$(realpath "$1")"; OUT="${2:-reference/screens}"; CHROME="${CHROME:-chromium}"
mkdir -p "$OUT"
routes=("home" "home/how" "discover?q=&loc=" "discover?q=Plumbing&loc=austin" "provider/p01" "provider/p05" "dashboard")
names=("01-home" "02-home-how" "03-discover-all" "04-discover-plumbing-austin" "05-provider-verified" "06-provider-other" "07-provider-dashboard")
for i in "${!routes[@]}"; do
  for size in "desktop:1440,2600" "phone:390,3600"; do
    label="${size%%:*}"; dims="${size#*:}"
    file="$OUT/${names[$i]}-${label}.png"
    "$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=4000 \
      --window-size="$dims" --screenshot="$(realpath -m "$file")" "file://${SRC}#/${routes[$i]}" >/dev/null 2>&1
    echo "  $file"
  done
done
