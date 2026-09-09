#!/usr/bin/env node
/**
 * Patches the globally-installed `goldie` (0.3.x) for two things the config
 * can't express, then leaves a marker so re-runs are no-ops:
 *
 *   1. Bigger headline type. `TYPE.headlineSize` is a hard-coded constant with
 *      no theme knob. Bumped 0.082 -> HEADLINE_SIZE below.
 *
 *   2. A second caption on a `panorama` scene's RIGHT tile. Stock goldie draws
 *      copy once, anchored on the left tile, so the right half of a panorama is
 *      dead space. With this patch, if a `panorama` scene also has a `subhead`
 *      map, that text is drawn (styled like a headline) at the top-left of the
 *      right tile — so the opener reads as a two-panel spread.
 *
 * goldie ships the code twice: `dist/index.js` (library entry) and a
 * self-contained `dist/cli.js` bundle that the `goldie` command actually runs.
 * Both are patched.
 *
 * Re-run after any `npm i -g goldie`:  node scripts/patch-goldie.mjs
 * Revert:                              node scripts/patch-goldie.mjs --revert
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const HEADLINE_SIZE = 0.094; // stock 0.082
const MARKER = "/*__pulvio_goldie_patch__*/";

const root = execSync("npm root -g", { encoding: "utf8" }).trim();
const targets = ["dist/cli.js", "dist/index.js"]
  .map((p) => join(root, "goldie", p))
  .filter((f) => existsSync(f));

if (targets.length === 0) {
  console.error(`goldie not found under ${join(root, "goldie", "dist")} — is it installed globally? (npm i -g goldie)`);
  process.exit(1);
}

const revert = process.argv.includes("--revert");

for (const file of targets) {
  const orig = `${file}.orig`;

  if (revert) {
    if (existsSync(orig)) { copyFileSync(orig, file); console.log("reverted", file); }
    else console.log("no .orig for", file, "- skipped");
    continue;
  }

  let src = readFileSync(file, "utf8");
  if (src.includes(MARKER)) { console.log("already patched:", file); continue; }
  if (!existsSync(orig)) copyFileSync(file, orig);

  // --- patch 1: headline size --------------------------------------------
  const sizeFrom = "headlineSize: 0.082,";
  const sizeTo = `headlineSize: ${HEADLINE_SIZE}, ${MARKER}`;
  if (!src.includes(sizeFrom)) { console.error(`patch 1 anchor not found in ${file} — goldie version drift`); process.exit(1); }
  src = src.replace(sizeFrom, sizeTo);

  // --- patch 2: panorama right-tile caption -----------------------------
  const copyFrom =
    `    if (c.copy) {\n` +
    `      drawCopy(ctx, c.copy, { width: c.designWidth, height: c.height }, cfg.theme, {\n` +
    `        headline: pick(scene.headline, locale, scene.id, "headline"),\n` +
    `        subhead: scene.subhead ? pick(scene.subhead, locale, scene.id, "subhead") : undefined\n` +
    `      });\n` +
    `    }\n`;
  const copyTo =
    `    if (c.copy) {\n` +
    `      const _pulvioPano = layout.key === "panorama";\n` +
    `      drawCopy(ctx, c.copy, { width: c.designWidth, height: c.height }, cfg.theme, {\n` +
    `        headline: pick(scene.headline, locale, scene.id, "headline"),\n` +
    `        subhead: (!_pulvioPano && scene.subhead) ? pick(scene.subhead, locale, scene.id, "subhead") : undefined\n` +
    `      });\n` +
    `      if (_pulvioPano && scene.subhead) {\n` +
    `        const _tw = c.width / layout.span;\n` +
    `        const _px = _tw * 0.09;\n` +
    `        drawCopy(ctx, {\n` +
    `          position: "top", align: "left",\n` +
    `          x: _tw + _px, y: c.height * 0.055,\n` +
    `          maxWidth: _tw - 2 * _px,\n` +
    `          box: { left: _tw + _px, top: 0, width: _tw - 2 * _px, height: c.copy.box.height }\n` +
    `        }, { width: c.designWidth, height: c.height }, cfg.theme, {\n` +
    `          headline: pick(scene.subhead, locale, scene.id, "subhead"), subhead: undefined\n` +
    `        });\n` +
    `      }\n` +
    `    }\n`;
  if (!src.includes(copyFrom)) { console.error(`patch 2 anchor not found in ${file} — goldie version drift`); process.exit(1); }
  src = src.replace(copyFrom, copyTo);

  writeFileSync(file, src);
  console.log("patched", file);
}

if (!revert) {
  console.log(`  - headline size -> ${HEADLINE_SIZE}`);
  console.log(`  - panorama scenes: subhead map renders as the right-tile caption`);
}
