#!/usr/bin/env node
/**
 * Per-locale screenshot capture for the store set.
 *
 * `goldie capture` reinstalls the APK on every run, which wipes app data and
 * drops the signed-in session, so it can't produce the Premium/Explore state
 * the flows expect. This does the capture manually instead — force-stop only,
 * so the Supabase session in AsyncStorage survives across locales.
 *
 * PREREQUISITES (do these once, by hand, before running):
 *   1. Emulator running as `emulator-5554` (goldie's Pixel_9_Pro AVD:
 *        argent boot, or `emulator -avd Pixel_9_Pro`).
 *   2. build/pulvio-preview.apk installed on it.
 *   3. Signed in with a PREMIUM account, sitting on the Explore tab.
 *      (Metro is NOT needed — the preview APK bundles its own JS.)
 *
 * Then:  node scripts/goldie-capture-locales.mjs
 *
 * For each locale it: sets the per-app locale (Android 13+ LocaleManager, no
 * root), force-stops, replays the six .argent flows, screencaps each raw over
 * out/raw/pixel-10-pro/<scene>.png, and runs `goldie frame --locale <x>`.
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const DEVICE = "emulator-5554";
const PKG = "com.pulvio.app";
const SCENES = ["01-explore", "02-catalogue", "03-sleep-timer", "04-asmr", "05-schedule", "06-categories"];
// goldie locale key  ->  BCP-47 tag for `cmd locale set-app-locales`
const LOCALES = [
  ["en", "en-US"],
  ["pt-BR", "pt-BR"],
  ["de", "de-DE"],
  ["fr", "fr-FR"],
  ["es", "es-ES"],
  ["tr", "tr-TR"],
];

const sh = (cmd) => execSync(cmd, { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" }).trim();
const adb = (args) => sh(`adb -s ${DEVICE} ${args}`);

/** goldie's own SystemUI demo status bar (clock 09:41, full wifi, 100% battery, no notifications). */
function demoStatusBar() {
  adb(`shell settings put global sysui_demo_allowed 1`);
  const d = (a) => adb(`shell am broadcast -a com.android.systemui.demo ${a}`);
  d(`-e command enter`);
  d(`-e command clock -e hhmm 0941`);
  d(`-e command battery -e level 100 -e plugged false`);
  d(`-e command network -e wifi show -e level 4 -e fully true`);
  d(`-e command network -e mobile hide`);
  d(`-e command notifications -e visible false`);
}

// sanity: device present
const devs = sh(`adb devices`);
if (!devs.includes(`${DEVICE}\tdevice`)) {
  console.error(`${DEVICE} not attached. Boot the Pixel_9_Pro emulator first.`);
  process.exit(1);
}

for (const [goldieLoc, bcp] of LOCALES) {
  console.log(`\n=== ${goldieLoc} (${bcp}) ===`);
  adb(`shell cmd locale set-app-locales ${PKG} --locales ${bcp}`);
  adb(`shell am force-stop ${PKG}`);
  demoStatusBar();

  for (const scene of SCENES) {
    process.stdout.write(`  ${scene} … `);
    execSync(`npx --no-install argent flow run ${scene} --device ${DEVICE}`, { stdio: ["ignore", "ignore", "inherit"] });
    demoStatusBar(); // the app launch can reset it
    // capture the PNG as bytes (no shell redirect — cmd.exe mangles binary)
    const png = execSync(`adb -s ${DEVICE} exec-out screencap -p`, { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
    writeFileSync(`out/raw/pixel-10-pro/${scene}.png`, png);
    console.log("captured");
  }

  console.log(`  framing ${goldieLoc} …`);
  execSync(`npx goldie frame --device pixel-10-pro --locale ${goldieLoc}`, { stdio: ["ignore", "ignore", "inherit"] });
}

// leave the app locale back on English
adb(`shell cmd locale set-app-locales ${PKG} --locales en-US`);
console.log(`\nDone. Framed sets in out/screenshots/pixel-10-pro/<locale>/`);
