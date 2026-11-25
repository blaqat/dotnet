#!/usr/bin/env bash
# Screenshot a mock page with headless Chromium.
# usage: _tools/shot.sh <page.html[?query]> <out.png> [desktop|mobile|WxH] [wait_ms]
#   desktop = 1440x900 @1x, mobile = 390x844 @2x (rendered at 390 CSS px wide)
# Full-page height: pass e.g. 1440x2400 to capture more of a long page.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
BIN="${CHROME_SHELL:-$(ls -d "$HOME"/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell 2>/dev/null | sort | tail -1)}"
page="$1"; out="$2"; size="${3:-desktop}"; wait="${4:-4000}"
case "$size" in
  desktop) W=1440; H=900; DPR=1 ;;
  mobile)  W=390;  H=844; DPR=2 ;;
  *x*)     W="${size%x*}"; H="${size#*x}"; DPR=1 ;;
esac
path="${page%%\?*}"; query=""; [[ "$page" == *\?* ]] && query="?${page#*\?}"
[[ "$path" = /* ]] || path="$HERE/$path"
"$BIN" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --force-device-scale-factor="$DPR" --window-size="$W,$H" \
  --virtual-time-budget="$wait" --run-all-compositor-stages-before-draw \
  --screenshot="$out" "file://$path$query" >/dev/null 2>&1
echo "$out"
