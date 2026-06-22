import sharp from "sharp";
import { writeFileSync } from "fs";

function svg(strokeColor, bgColor, rounded = true) {
  return `<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
    ${bgColor ? `<rect width="180" height="180" rx="${rounded ? 40 : 0}" fill="${bgColor}"/>` : ""}
    <circle cx="90" cy="74" r="26" stroke="${strokeColor}" stroke-width="9" fill="none"/>
    <path d="M77 92 L103 92 L112 144 Q113 151 106 151 L74 151 Q67 151 68 144 Z"
      stroke="${strokeColor}" stroke-width="9" fill="none" stroke-linejoin="round"/>
  </svg>`;
}

async function png(svgStr, size, out) {
  await sharp(Buffer.from(svgStr)).resize(size, size).png().toFile(out);
  console.log("✅", out);
}

// 32x32 — dark mark on transparent (for light UI) and light mark (for dark UI)
await png(svg("#0b0b0c", null), 32, "public/icon-light-32x32.png");
await png(svg("#ffffff", null), 32, "public/icon-dark-32x32.png");

// apple-icon — white mark on black rounded tile (works on any home screen)
await png(svg("#ffffff", "#0b0b0c"), 180, "public/apple-icon.png");

// favicon.ico fallback — dark mark on white tile
await png(svg("#0b0b0c", "#ffffff"), 48, "public/favicon-48.png");

console.log("Done.");
