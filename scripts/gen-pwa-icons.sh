#!/bin/bash
set -e

gen() {
  local stroke=$1 bg=$2 size=$3 out=$4 pad=$5
  # pad shrinks the mark for maskable safe-zone
  local scale="100%"
  cat > /tmp/noxis-pwa.svg << SVG
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="${pad:-40}" fill="$bg"/>
  <g transform="translate(90,90) scale(${scale}) translate(-90,-90)">
    <circle cx="90" cy="74" r="26" stroke="$stroke" stroke-width="9" fill="none"/>
    <path d="M77 92 L103 92 L112 144 Q113 151 106 151 L74 151 Q67 151 68 144 Z" stroke="$stroke" stroke-width="9" fill="none" stroke-linejoin="round"/>
  </g>
</svg>
SVG
  rsvg-convert -w "$size" -h "$size" /tmp/noxis-pwa.svg -o "$out"
  echo "✅ $out"
}

# Standard PWA icons (white mark on black tile)
gen "#ffffff" "#0b0b0c" 192 public/icon-192.png 40
gen "#ffffff" "#0b0b0c" 512 public/icon-512.png 96

# Maskable icon — full-bleed black bg, no rounding (Android masks it itself)
gen "#ffffff" "#0b0b0c" 512 public/icon-maskable-512.png 0

rm -f /tmp/noxis-pwa.svg
echo "Done."
