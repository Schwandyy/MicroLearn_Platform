// Fallback resolver: if `require("sharp")` fails (because pnpm hoisted sharp
// into a .pnpm/<x>/node_modules subtree), point at the explicit path.
const path = require("node:path");
const fs = require("node:fs");

const candidates = [
  path.resolve(__dirname, "..", "node_modules", "sharp"),
  path.resolve(
    __dirname,
    "..",
    "node_modules",
    ".pnpm",
    "sharp@0.32.6",
    "node_modules",
    "sharp",
  ),
];

for (const dir of candidates) {
  if (fs.existsSync(dir)) {
    module.exports = require(dir);
    return;
  }
}

throw new Error(
  "sharp not found in node_modules. Run `pnpm install` (sharp is a devDep via @capacitor/assets).",
);
