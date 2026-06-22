#!/bin/bash
set -e

gen() {
  local stroke=$1 bg=$2 size=$3 out=$4 rx=$5
  local bgrect=""
  [ -n "$bg" ] && bgrect="<rect width='180' height='180' rx='${rx:-40}' fill='$bg'/>"
  cat > /tmp/noxis-icon.svg << SVG
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  $bgrect
  <circle cx="90" cy="74" r="26" stroke="$stroke" stroke-width="9" fill="none"/>
  <path d="M77 92 L103 92 L112 144 Q113 151 106 151 L74 151 Q67 151 68 144 Z" stroke="$stroke" stroke-width="9" fill="none" stroke-linejoin="round"/>
</svg>
SVG
  rsvg-convert -w "$size" -h "$size" /tmp/noxis-icon.svg -o "$out"
  echo "✅ $out"
}

# 32x32 marks on transparent
gen "#0b0b0c" "" 32 public/icon-light-32x32.png
gen "#ffffff" "" 32 public/icon-dark-32x32.png
# apple-icon: white mark on black rounded tile
gen "#ffffff" "#0b0b0c" 180 public/apple-icon.png
# favicon fallback: dark mark on white tile
gen "#0b0b0c" "#ffffff" 48 public/favicon-48.png

rm -f /tmp/noxis-icon.svg
echo "Done."
