#!/usr/bin/env node
/**
 * Full-app iOS walkthrough video — RUN ON A MAC (macos-latest CI runner).
 *
 * Boots each .argent/flows/walkthrough/wk-*.yaml flow in order, wrapping each
 * one in an argent screen recording, so the result is one video per segment
 * plus a single concatenated walkthrough covering onboarding, auth, the three
 * tabs, the player, the sleep sheets, settings, and the paywall.
 *
 * wk-01 MUST run against a freshly-installed app (no prior sign-in) — it's
 * the only way to land on the onboarding funnel without a __DEV__ build (the
 * "Preview onboarding flow" row in Settings is __DEV__-gated and this is a
 * release-profile build). Every later segment assumes wk-02 already signed
 * in, so segments must run in order and none may be skipped.
 *
 * A segment failing (bad selector, slow network, etc.) does not abort the
 * run — it's logged in the summary and the remaining segments still attempt
 * to run against whatever screen the app is left on. Check the summary and
 * the per-segment clips before trusting the concatenated video end to end.
 *
 * PREREQUISITES (same as scripts/goldie-capture-locales-ios.mjs):
 *   1. Xcode with an iOS simulator booted.
 *   2. The Release-iphonesimulator Pulvio.app freshly installed on it
 *      (this script assumes it has NEVER been launched yet — see above).
 *   3. SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD available to argent as secrets
 *      (env ARGENT_SECRET_SCREENSHOT_EMAIL / ARGENT_SECRET_SCREENSHOT_PASSWORD,
 *      or .argent/secrets.env). The account must be Premium.
 *
 * Then:  node scripts/record-app-walkthrough-ios.mjs [simulator-udid]
 */
import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const RECORDINGS_DIR = resolve(".argent/recordings");
const OUT_DIR = resolve("out/walkthrough");

// name, human label, recording time budget (segment length + generous slack, capped at argent's 600s max)
const SEGMENTS = [
  ["wk-01-onboarding", "Onboarding funnel + guest hand-off", 240],
  ["wk-02-auth", "Complete account + sign in", 90],
  ["wk-03-sounds", "Sounds catalogue, search, free filter", 90],
  ["wk-04-player-timer", "Player + custom sleep timer", 60],
  ["wk-05-sleep-sheets", "Sleep tab sheets + toggles", 90],
  ["wk-06-settings", "Settings: language, bedtime, paywall, sign-out", 120],
];

const sh = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();

let UDID = process.argv[2];
if (!UDID) {
  const booted = sh(`xcrun simctl list devices booted`);
  const m = booted.match(/iPhone[^(]*\(([0-9A-F-]{36})\) \(Booted\)/i);
  if (!m) { console.error("No booted iPhone simulator found. Boot one, or pass the UDID."); process.exit(1); }
  UDID = m[1];
}
console.log("simulator:", UDID);

mkdirSync(RECORDINGS_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

function newestRecording(sinceMs) {
  const files = readdirSync(RECORDINGS_DIR)
    .filter((f) => f.endsWith(".mp4"))
    .map((f) => ({ f, t: statSync(join(RECORDINGS_DIR, f)).mtimeMs }))
    .filter(({ t }) => t >= sinceMs)
    .sort((a, b) => b.t - a.t);
  return files[0]?.f ?? null;
}

// argent tool-server warm-up — same rationale as goldie-capture-locales-ios.mjs:
// a cold start of the shared tool-server can exceed its ready window on a busy runner.
let toolServerUp = false;
for (let attempt = 1; attempt <= 4 && !toolServerUp; attempt++) {
  try {
    execSync(`npx --no-install argent tools`, { stdio: "ignore" });
    toolServerUp = true;
  } catch {
    console.warn(`argent tool-server not ready (attempt ${attempt}/4)`);
  }
}
if (!toolServerUp) console.warn("proceeding without a confirmed tool-server — wk-01 may fail");

for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    execSync(`npx --no-install argent run gesture-tap --udid ${UDID} --x 0.5 --y 0.5`, { stdio: "ignore" });
    break;
  } catch {
    console.warn(`simulator-server warm-up not ready (attempt ${attempt}/5)`);
  }
}

const summary = [];

for (const [index, [flow, label, timeLimitSeconds]] of SEGMENTS.entries()) {
  const seq = String(index + 1).padStart(2, "0");
  console.log(`\n=== ${seq} ${flow} — ${label} ===`);
  const startedAt = Date.now();

  try {
    execSync(
      `npx --no-install argent run screen-recording-start --udid ${UDID} --timeLimitSeconds ${timeLimitSeconds} --trimStatic true`,
      { stdio: "inherit" },
    );
  } catch (e) {
    console.error(`could not start recording for ${flow}: ${e.message}`);
    summary.push({ flow, label, status: "recording-start-failed" });
    continue;
  }

  let flowOk = true;
  try {
    execFileSync("npx", ["--no-install", "argent", "flow", "run", flow, "--device", UDID], { stdio: "inherit" });
  } catch (e) {
    flowOk = false;
    console.error(`${flow} did not complete cleanly: ${e.message}`);
  }

  let savedAs = null;
  try {
    execSync(`npx --no-install argent run screen-recording-stop --udid ${UDID}`, { stdio: "inherit" });
    const recorded = newestRecording(startedAt - 2000);
    if (recorded) {
      savedAs = `${seq}-${flow}.mp4`;
      renameSync(join(RECORDINGS_DIR, recorded), join(OUT_DIR, savedAs));
    }
  } catch (e) {
    console.error(`could not stop/collect recording for ${flow}: ${e.message}`);
  }

  summary.push({ flow, label, status: flowOk ? "ok" : "flow-error", file: savedAs });
}

writeFileSync(join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
console.log("\n=== Summary ===");
for (const s of summary) console.log(`  ${s.status.padEnd(20)} ${s.flow}${s.file ? ` -> ${s.file}` : ""}`);

// Concatenate whatever segments actually produced a file, in order.
const ordered = summary.filter((s) => s.file).map((s) => join(OUT_DIR, s.file));
if (ordered.length > 0) {
  const listPath = join(OUT_DIR, "concat-list.txt");
  writeFileSync(listPath, ordered.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n"));
  try {
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${join(OUT_DIR, "pulvio-ios-walkthrough.mp4")}"`, {
      stdio: "inherit",
    });
    console.log(`\nConcatenated walkthrough: ${join(OUT_DIR, "pulvio-ios-walkthrough.mp4")}`);
  } catch (e) {
    console.error(`ffmpeg concat failed (individual segment clips are still in ${OUT_DIR}): ${e.message}`);
  }
} else {
  console.error("No segment produced a video — nothing to concatenate.");
}

const anyFailed = summary.some((s) => s.status !== "ok");
if (anyFailed) {
  console.error("\nOne or more segments did not complete cleanly — see summary.json and the per-segment clips.");
  process.exitCode = 1;
}
