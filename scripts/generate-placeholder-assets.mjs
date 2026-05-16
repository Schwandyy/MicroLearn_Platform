#!/usr/bin/env node
/**
 * Generate placeholder Capacitor-Asset-Sources for MicroLearn.
 *
 * Produces:
 *   assets/logo.png       — light-mode source for `pnpm mobile:assets`
 *   assets/logo-dark.png  — dark-mode source (same composition, lighter ink)
 *
 * These are *placeholders* — drop a designed 1024×1024 logo in the same
 * spots when ready and re-run `pnpm mobile:assets`. They exist so the
 * `pnpm mobile:assets` pipeline produces icons/splashes that already look
 * on-brand instead of failing for missing inputs.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Resolve sharp via the pnpm-flat path so this script also works when sharp
// is hoisted under .pnpm/.
let sharp;
try {
  sharp = require("sharp");
} catch {
  sharp = require("./_resolve-sharp.cjs");
}

const SIZE = 1024;
const BG = "#0b1220";
const INK = "#F5B544";
const INK_DARK = "#FFFFFF";

function svg(ink) {
  // Centered "ML" wordmark + small "MICROLEARN" caption beneath it. We rely
  // on a system-font font-stack — `pnpm mobile:assets` will rasterize each
  // icon target on top of this anyway, so the wordmark just needs to read
  // well at 1024² source size.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="100%" height="100%" fill="${BG}"/>

  <!-- Soft inner border to give the placeholder some structure -->
  <rect x="64" y="64" width="${SIZE - 128}" height="${SIZE - 128}"
        rx="120" ry="120" fill="none" stroke="${ink}" stroke-width="6" stroke-opacity="0.35"/>

  <!-- Wordmark -->
  <g text-anchor="middle" font-family="Helvetica, Arial, sans-serif" fill="${ink}">
    <text x="${SIZE / 2}" y="${SIZE / 2 + 60}"
          font-size="380" font-weight="900" letter-spacing="-12">ML</text>
    <text x="${SIZE / 2}" y="${SIZE / 2 + 230}"
          font-size="64" font-weight="700" letter-spacing="22" fill-opacity="0.85">
      MICROLEARN
    </text>
  </g>
</svg>`;
}

async function renderTo(outPath, ink) {
  await sharp(Buffer.from(svg(ink)))
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log("✓ wrote", path.relative(process.cwd(), outPath));
}

async function main() {
  const root = process.cwd();
  const assets = path.join(root, "assets");
  await mkdir(assets, { recursive: true });

  await renderTo(path.join(assets, "logo.png"), INK);
  await renderTo(path.join(assets, "logo-dark.png"), INK_DARK);

  console.log("\nNext: pnpm mobile:assets");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
