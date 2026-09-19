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
 * to run against whatever screen the app is left on. Recording is likewise
 * decoupled from the flow: if simulator-server won't come up in time for
 * screen-recording-start, the flow still runs unrecorded rather than being
 * skipped (skipping it would cascade — wk-02's sign-in is load-bearing for
 * every later segment). Check the summary and the per-segment clips before
 * trusting the concatenated video end to end.
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

// A cold simulator-server right after the ~40-min EAS build can take much
// longer than a couple of throwaway taps to become ready (seen in CI: 5
// warm-up attempts here, then screen-recording-start itself timing out on
// the first 2-3 segments). Retry with backoff instead of one shot.
for (let attempt = 1; attempt <= 10; attempt++) {
  try {
    execSync(`npx --no-install argent run gesture-tap --udid ${UDID} --x 0.5 --y 0.5`, { stdio: "ignore" });
    break;
  } catch {
    console.warn(`simulator-server warm-up not ready (attempt ${attempt}/10)`);
    execSync("sleep 5");
  }
}

const summary = [];

for (const [index, [flow, label, timeLimitSeconds]] of SEGMENTS.entries()) {
  const seq = String(index + 1).padStart(2, "0");
  console.log(`\n=== ${seq} ${flow} — ${label} ===`);
  const startedAt = Date.now();

  // Recording is nice-to-have, not a precondition for the flow itself — a
  // segment whose recording never starts must still run its flow, or every
  // later segment cascades into failure (wk-02's sign-in, in particular, is
  // load-bearing for every segment after it). Retry a few times before
  // giving up on video for this segment only.
  let recording = false;
  for (let attempt = 1; attempt <= 4 && !recording; attempt++) {
    try {
      execSync(
        `npx --no-install argent run screen-recording-start --udid ${UDID} --timeLimitSeconds ${timeLimitSeconds} --trimStatic true`,
        { stdio: "inherit" },
      );
      recording = true;
    } catch (e) {
      console.error(`could not start recording for ${flow} (attempt ${attempt}/4): ${e.message}`);
      execSync("sleep 5");
    }
  }
  if (!recording) console.error(`proceeding with ${flow} unrecorded — simulator-server would not come up`);

  // Every segment after wk-01 has been seen to fail its very first step —
  // `launch` + `await visible id=explore-screen` — instantly and
  // deterministically (two back-to-back full-flow retries produced
  // byte-identical failures within the same second, not a timeout). That
  // rules out a slow JS relaunch racing session/network work, which would
  // eventually pass or at least vary. It also isn't a pre-existing app bug:
  // scripts/goldie-capture-locales-ios.mjs chains the same
  // "argent flow run <scene>" against an already-running app the same way,
  // each starting with its own `launch:`, with no recording wrapped around
  // it — and that's known to work. The one thing different here is
  // screen-recording-start/stop bracketing every segment, so the leading
  // theory is that toggling the recording drops or staggers the
  // native-devtools/ViewInspector bridge, and `launch` alone doesn't force
  // an already-running app to re-attach it — only `restart-app` documents
  // that it does ("refreshes the native-devtools injection before the
  // relaunch"). Force that here for every segment but the first: wk-01 must
  // stay a genuine first-ever launch (its own prerequisite), everything
  // after it is fair game since the flow's own `launch:` step is a safe
  // no-op once the app is already frontmost and correctly attached.
  if (index > 0) {
    try {
      execSync(`npx --no-install argent run restart-app --udid ${UDID} --bundleId com.pulvio.app`, { stdio: "inherit" });
    } catch (e) {
      console.warn(`restart-app before ${flow} failed, proceeding anyway: ${e.message}`);
    }
  }

  let flowOk = true;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      execFileSync("npx", ["--no-install", "argent", "flow", "run", flow, "--device", UDID], { stdio: "inherit" });
      flowOk = true;
      break;
    } catch (e) {
      flowOk = false;
      console.error(`${flow} did not complete cleanly (attempt ${attempt}/2): ${e.message}`);
      if (attempt < 2) execSync("sleep 5");
    }
  }

  // restart-app above is a best-effort fix for the leading theory (a stale
  // devtools bridge after recording toggles), not a confirmed diagnosis — if
  // it still fails, capture what's actually on screen so the next
  // investigation has evidence instead of another blind guess.
  if (!flowOk) {
    try {
      execSync(`xcrun simctl io ${UDID} screenshot --type png "${join(OUT_DIR, `${seq}-${flow}-failure.png`)}"`, { stdio: "ignore" });
    } catch (e) {
      console.error(`could not capture failure screenshot for ${flow}: ${e.message}`);
    }
  }

  let savedAs = null;
  if (recording) {
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
  }

  const status = !recording ? "unrecorded" : flowOk ? "ok" : "flow-error";
  summary.push({ flow, label, status, file: savedAs });
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
