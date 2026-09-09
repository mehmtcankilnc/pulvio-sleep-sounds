#!/usr/bin/env node
/**
 * iOS counterpart of goldie-capture-locales.mjs — RUN ON A MAC.
 *
 * Same idea: `goldie capture` does one `reinstall-app` up front which wipes the
 * signed-in session, so the flows land on onboarding. This drives the capture
 * manually instead — terminate (not reinstall), so the session survives.
 *
 * PREREQUISITES (once, by hand):
 *   1. Xcode with an "iPhone 17 Pro Max" simulator, booted.
 *      (goldie's `iphone-6.9` key resolves that simulatorName.)
 *   2. The Release-iphonesimulator Pulvio.app installed on it
 *      (`eas build -p ios` with a simulator profile, or a local Release build).
 *   3. `npm i -g goldie@0.3.1` && `node scripts/patch-goldie.mjs`
 *   4. goldie.config.ts: `devices: ["iphone-6.9"]`, `appPath` -> the .app.
 *   5. SCREENSHOT_EMAIL / SCREENSHOT_PASSWORD available to argent as secrets —
 *      env `ARGENT_SECRET_SCREENSHOT_EMAIL` / `ARGENT_SECRET_SCREENSHOT_PASSWORD`
 *      (or .argent/secrets.env). The account must be Premium (flip it in
 *      Supabase once). This script signs in via the 00-login flow itself.
 *
 * Then:  node scripts/goldie-capture-locales-ios.mjs [simulator-udid]
 * (udid optional — defaults to the one booted iPhone simulator)
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const PKG = "com.pulvio.app";
const SCENES = ["01-explore", "02-catalogue", "03-sleep-timer", "04-asmr", "05-schedule", "06-categories"];
// goldie locale key  ->  [AppleLocale, AppleLanguages entry]
const LOCALES = [
  ["en", "en_US", "en"],
  ["pt-BR", "pt_BR", "pt-BR"],
  ["de", "de_DE", "de"],
  ["fr", "fr_FR", "fr"],
  ["es", "es_ES", "es"],
  ["tr", "tr_TR", "tr"],
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

const RAW = "out/raw/iphone-6.9";
mkdirSync(RAW, { recursive: true });
writeFileSync(`${RAW}/manifest.json`, JSON.stringify({
  device: "iphone-6.9",
  udid: UDID,
  capturedAt: new Date().toISOString(),
  screenshots: SCENES.map((s) => ({ sceneId: s, file: resolve(`${RAW}/${s}.png`) })),
  preview: null,
}, null, 2));

function statusBar() {
  sh(`xcrun simctl status_bar ${UDID} override --time "9:41" --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularBars 4 --dataNetwork wifi`);
}

// sign in once — the session in the app container survives locale changes and
// `terminate` (only `reinstall-app` would wipe it, which this script avoids)
console.log("signing in (00-login) …");
execSync(`npx --no-install argent flow run 00-login --device ${UDID}`, { stdio: ["ignore", "inherit", "inherit"] });

for (const [goldieLoc, appleLocale, appleLang] of LOCALES) {
  console.log(`\n=== ${goldieLoc} (${appleLocale}) ===`);
  sh(`xcrun simctl spawn ${UDID} defaults write .GlobalPreferences AppleLocale -string ${appleLocale}`);
  sh(`xcrun simctl spawn ${UDID} defaults write .GlobalPreferences AppleLanguages -array ${appleLang}`);
  // cold-restart the app so it re-reads the locale; a sim respring is heavier
  // and usually unnecessary for an Expo app that reads AppleLanguages on launch
  try { sh(`xcrun simctl terminate ${UDID} ${PKG}`); } catch {}
  statusBar();

  for (const scene of SCENES) {
    process.stdout.write(`  ${scene} … `);
    execSync(`npx --no-install argent flow run ${scene} --device ${UDID}`, { stdio: ["ignore", "ignore", "inherit"] });
    statusBar();
    const png = execSync(`xcrun simctl io ${UDID} screenshot --type png -`, { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
    writeFileSync(`out/raw/iphone-6.9/${scene}.png`, png);
    console.log("captured");
  }

  console.log(`  framing ${goldieLoc} …`);
  execSync(`npx goldie frame --device iphone-6.9 --locale ${goldieLoc}`, { stdio: ["ignore", "ignore", "inherit"] });
}

sh(`xcrun simctl status_bar ${UDID} clear`);
console.log(`\nDone. Framed sets in out/screenshots/iphone-6.9/<locale>/`);
