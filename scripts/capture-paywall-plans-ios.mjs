#!/usr/bin/env node
/**
 * App Store Connect "App Subscriptions" review screenshots — RUN ON A MAC.
 *
 * Captures the paywall once per plan (Yearly, 3 months, Monthly, Weekly) in
 * en-US, using the natural onboarding hand-off to reach it — a Premium
 * account has no "Go Premium" entry point, so this needs an app instance
 * that has NEVER signed in (fresh `simctl install`, never launched before).
 * RevenueCat must be configured for iOS (EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
 * set as an EAS project env var) or the paywall shows its "couldn't load"
 * empty state instead of priced plan cards.
 *
 * PREREQUISITES:
 *   1. Xcode with an iOS simulator booted.
 *   2. The Release-iphonesimulator Pulvio.app freshly installed on it — this
 *      script assumes it has never been launched.
 *
 * Then:  node scripts/capture-paywall-plans-ios.mjs [simulator-udid]
 */
import { execFileSync, execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const PLANS = [
  ["07-paywall-yearly", "yearly"],
  ["08-paywall-quarterly", "quarterly"],
  ["09-paywall-monthly", "monthly"],
  ["10-paywall-weekly", "weekly"],
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

const OUT = resolve("out/screenshots/subscriptions");
mkdirSync(OUT, { recursive: true });

sh(`xcrun simctl status_bar ${UDID} override --time "9:41" --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularBars 4 --dataNetwork wifi`);

// Same tool-server / simulator-server warm-up as the other capture scripts —
// a cold start can exceed argent's ready window on a busy CI runner.
let toolServerUp = false;
for (let attempt = 1; attempt <= 4 && !toolServerUp; attempt++) {
  try {
    execSync(`npx --no-install argent tools`, { stdio: "ignore" });
    toolServerUp = true;
  } catch {
    console.warn(`argent tool-server not ready (attempt ${attempt}/4)`);
  }
}
if (!toolServerUp) console.warn("proceeding without a confirmed tool-server — the first flow may fail");

for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    execSync(`npx --no-install argent run gesture-tap --udid ${UDID} --x 0.5 --y 0.5`, { stdio: "ignore" });
    break;
  } catch {
    console.warn(`simulator-server warm-up not ready (attempt ${attempt}/5)`);
  }
}

for (const [flow, name] of PLANS) {
  process.stdout.write(`${flow} (${name}) … `);
  execFileSync("npx", ["--no-install", "argent", "flow", "run", flow, "--device", UDID], { stdio: "inherit" });
  execSync(`xcrun simctl io ${UDID} screenshot --type png "${OUT}/paywall-${name}.png"`, { stdio: "ignore" });
  console.log("captured");
}

sh(`xcrun simctl status_bar ${UDID} clear`);
console.log(`\nDone. Screenshots in ${OUT}/`);
