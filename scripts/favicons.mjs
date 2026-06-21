import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "fs";

mkdirSync("public/options", { recursive: true });

// Shared defs (gradients) reused across marks.
const defs = `
  <linearGradient id="tile" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
    <stop stop-color="#13151D"/><stop offset="1" stop-color="#0A0B0E"/>
  </linearGradient>
  <linearGradient id="vio" x1="14" y1="50" x2="50" y2="14" gradientUnits="userSpaceOnUse">
    <stop stop-color="#6F5FEE"/><stop offset="0.55" stop-color="#9A8DFF"/><stop offset="1" stop-color="#B9AEFF"/>
  </linearGradient>
  <linearGradient id="violetfill" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
    <stop stop-color="#8576FF"/><stop offset="1" stop-color="#5E4FE0"/>
  </linearGradient>
  <radialGradient id="cip" cx="0.5" cy="0.5" r="0.5">
    <stop stop-color="#6AFFD6"/><stop offset="1" stop-color="#16C99B"/>
  </radialGradient>`;

const tile = (inner, fill = "url(#tile)") => `
  <rect x="1" y="1" width="62" height="62" rx="15" fill="${fill}"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="14.5" stroke="#ffffff" stroke-opacity="0.10"/>
  ${inner}`;

// ── A. Cipher-N: a single decrypted stroke + encryption node ────────────────
const A = tile(`
  <path d="M19 47 V18 L45 46 V17" stroke="url(#vio)" stroke-width="5.5"
        stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="32" cy="32" r="3.6" fill="url(#cip)"/>
  <circle cx="32" cy="32" r="6.6" stroke="#34F5C0" stroke-opacity="0.4" stroke-width="1.2"/>`);

// ── B. Keyhole vault: minimalist encrypted keyhole ──────────────────────────
const B = tile(`
  <circle cx="32" cy="27" r="7.5" fill="url(#vio)"/>
  <path d="M27.5 31 L36.5 31 L39 47 L25 47 Z" fill="url(#vio)"/>
  <circle cx="32" cy="27" r="3" fill="#0A0B0E"/>`);

// ── C. Solid monogram tile: bold app-icon N ─────────────────────────────────
const C = `
  <rect x="1" y="1" width="62" height="62" rx="15" fill="url(#violetfill)"/>
  <rect x="1.5" y="1.5" width="61" height="61" rx="14.5" stroke="#ffffff" stroke-opacity="0.22"/>
  <path d="M19 47 V18 L45 46 V17" stroke="#fff" stroke-width="6"
        stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="32" cy="32" r="3.4" fill="#0A0B0E"/>
  <circle cx="32" cy="32" r="3.4" fill="#34F5C0" fill-opacity="0.9"/>`;

// ── D. Orbit node: data orbiting an encrypted core ──────────────────────────
const D = tile(`
  <g transform="rotate(-28 32 32)">
    <ellipse cx="32" cy="32" rx="17" ry="8" stroke="url(#vio)" stroke-width="2.4" fill="none"/>
    <circle cx="49" cy="32" r="3" fill="url(#cip)"/>
  </g>
  <circle cx="32" cy="32" r="6.5" fill="url(#violetfill)"/>
  <circle cx="32" cy="32" r="6.5" stroke="#B9AEFF" stroke-opacity="0.6" stroke-width="1"/>`);

// ── E. Matrix N: N emerging from a cipher dot-grid ──────────────────────────
const cols = [20, 32, 44];
const rows = [20, 32, 44];
const nDots = new Set(["20,20", "20,32", "20,44", "32,32", "44,20", "44,32", "44,44"]);
let dots = "";
for (const x of cols)
  for (const y of rows) {
    const on = nDots.has(`${x},${y}`);
    dots += `<circle cx="${x}" cy="${y}" r="${on ? 3.1 : 1.7}" fill="${
      on ? "url(#vio)" : "#ffffff"
    }" ${on ? "" : 'fill-opacity="0.14"'}/>`;
  }
const E = tile(`
  <path d="M20 20 L44 44" stroke="url(#vio)" stroke-width="1.4" stroke-opacity="0.5"/>
  ${dots}`);

const marks = { A, B, C, D, E };
const names = {
  A: "Cipher-N",
  B: "Keyhole",
  C: "Mono tile",
  D: "Orbit",
  E: "Matrix-N",
};

// Write each as a standalone favicon SVG.
for (const [k, inner] of Object.entries(marks)) {
  const svg = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`;
  writeFileSync(`public/options/favicon-${k}.svg`, svg);
}

// Compose a contact sheet (PNG) so the options can be compared at a glance.
const W = 1180,
  H = 360,
  size = 150,
  gap = (W - size * 5) / 6;
let board = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>`;
board += `<rect width="${W}" height="${H}" fill="#0A0A0C"/>`;
board += `<text x="${W / 2}" y="48" fill="#EDEFF5" font-family="sans-serif" font-size="30" font-weight="700" text-anchor="middle" letter-spacing="-0.5">Noxis — favicon options</text>`;
board += `<text x="${W / 2}" y="76" fill="#7B819A" font-family="monospace" font-size="15" text-anchor="middle">pick A · B · C · D · E</text>`;
let i = 0;
for (const [k, inner] of Object.entries(marks)) {
  const x = gap + i * (size + gap);
  const y = 120;
  const scale = size / 64;
  board += `<g transform="translate(${x},${y}) scale(${scale})"><defs>${defs}</defs>${inner}</g>`;
  board += `<text x="${x + size / 2}" y="${y + size + 34}" fill="#C8CCD8" font-family="monospace" font-size="17" text-anchor="middle" font-weight="600">${k}</text>`;
  board += `<text x="${x + size / 2}" y="${y + size + 56}" fill="#7B819A" font-family="monospace" font-size="13" text-anchor="middle">${names[k]}</text>`;
  i++;
}
board += `</svg>`;

const png = new Resvg(board, { fitTo: { mode: "width", value: W * 2 } })
  .render()
  .asPng();
writeFileSync("public/options/board.png", png);
console.log("Wrote 5 favicon SVGs + public/options/board.png");
