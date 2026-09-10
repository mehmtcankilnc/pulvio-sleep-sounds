#!/usr/bin/env node
/**
 * Per-locale Android screenshot capture for the store set.
 *
 * `goldie capture` reinstalls the APK every run, wiping app data and the
 * signed-in session, so it can't produce the Premium/Explore state the flows
 * expect. This drives the capture manually instead — `00-login` once, then
 * force-stop only (no reinstall), so the Supabase session survives the loop.
 *
 * PREREQUISITES:
 *   1. Emulator running as `emulator-5554`, API 33+ (per-app LocaleManager).
 *   2. build/pulvio-preview.apk installed on it (a `screenshots`-profile APK:
 *      it sets EXPO_PUBLIC_DISABLE_PUSH_PROMPT=1 so login has no OS prompt).
 *   3. SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD available to argent as secrets
 *      (env ARGENT_SECRET_*, or .argent/secrets.env). Account = Premium.
 *
 * Then:  node scripts/goldie-capture-locales.mjs
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

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

const devs = sh(`adb devices`);
if (!devs.includes(`${DEVICE}\tdevice`)) {
  console.error(`${DEVICE} not attached. Boot an API 33+ emulator first.`);
  process.exit(1);
}

const RAW = "out/raw/pixel-10-pro";
mkdirSync(RAW, { recursive: true });
writeFileSync(`${RAW}/manifest.json`, JSON.stringify({
  device: "pixel-10-pro",
  udid: DEVICE,
  capturedAt: new Date().toISOString(),
  screenshots: SCENES.map((s) => ({ sceneId: s, file: resolve(`${RAW}/${s}.png`) })),
  preview: null,
}, null, 2));

// nudge argent's shared tool-server up before the first flow run
try {
  execSync(`npx --no-install argent tools`, { stdio: "ignore" });
} catch {
  console.warn("argent tool-server did not answer — flow runs may time out");
}

console.log("signing in (00-login) …");
execSync(`npx --no-install argent flow run 00-login --device ${DEVICE}`, { stdio: ["ignore", "inherit", "inherit"] });

for (const [goldieLoc, bcp] of LOCALES) {
  console.log(`\n=== ${goldieLoc} (${bcp}) ===`);
  adb(`shell cmd locale set-app-locales ${PKG} --locales ${bcp}`);
  adb(`shell am force-stop ${PKG}`);
  demoStatusBar();

  for (const scene of SCENES) {
    process.stdout.write(`  ${scene} … `);
    execSync(`npx --no-install argent flow run ${scene} --device ${DEVICE}`, { stdio: "inherit" });
    demoStatusBar(); // the app launch can reset it
    const png = execSync(`adb -s ${DEVICE} exec-out screencap -p`, { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
    writeFileSync(`${RAW}/${scene}.png`, png);
    console.log("captured");
  }

  console.log(`  framing ${goldieLoc} …`);
  execSync(`npx goldie frame --device pixel-10-pro --locale ${goldieLoc}`, { stdio: "inherit" });
}

adb(`shell cmd locale set-app-locales ${PKG} --locales en-US`);
console.log(`\nDone. Framed sets in out/screenshots/pixel-10-pro/<locale>/`);
