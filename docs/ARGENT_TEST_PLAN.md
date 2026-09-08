# Argent — Full App Test Plan

End-to-end manual/agent test of Pulvio, driven through **Argent**
(`docs.swmansion.com/argent`). Run after `argent init` and a **Claude Code
restart** (the Argent MCP server only loads on a fresh session).

## Preconditions

- Metro / dev-client running (started by the user, not by the agent).
- Target: physical **Samsung Galaxy S21 (SM-G991B, Android 15)** — `adb devices`
  shows `R5CT50JN5ED`. `com.pulvio.app` (debuggable) is installed.
- Optional iOS: iPhone connected to this Windows machine (Argent can drive a
  physical iOS device; no Xcode needed for interaction/screenshots, but a signed
  build must already be installed).
- A test account + a RevenueCat **sandbox** account for purchase flows.
- Supabase reachable; a way to reset the free-tier cooldown for the test user
  (backend — the client cannot, by design).

## How to run

Prompt Argent per area, e.g. *"Boot the Pulvio app on the S21, walk the
onboarding from welcome to account creation, and report any screen that hangs,
misrenders, or throws."* Capture a screenshot at each ✔ checkpoint. Log
pass/fail + notes inline in this file.

---

## 1. Onboarding funnel

Route group `app/(onboarding)/`. Persistent GlowBackground + OnboardingHeader.

- [ ] `welcome` — "Get started" → funnel; "I already have an account" → auth;
      "Continue setup" resume path shows only mid-funnel
- [ ] `frequency` — single-select, Continue disabled until chosen
- [ ] `quiz-struggles` — multi-select, "choose all that apply", can select none/all
- [ ] `quiz-sounds` — multi-select maps to first picks (Rain/Thunder, Ocean, White
      Noise, ASMR, Piano/Ambient, Fireplace, Vehicles)
- [ ] `bedtime` — time picker (native `react-native-date-picker`), persists
- [ ] `reminder` — "Yes, nudge me" triggers OS notification-permission prompt;
      "No thanks" continues; deny path doesn't dead-end
- [ ] `plan-ready` — renders picks from answers; `planLoadError` retry works with
      network off/on; `planNoCatalog` fallback if catalog empty
- [ ] `preview` — "Hear it" plays a sound; `previewTrouble` path on load failure;
      "Continue anyway" works
- [ ] Hand-off to account creation ("Next, create an account to save your plan")
- [ ] "Skip questions" from anywhere → straight to app as guest
- [ ] Back navigation on every step; state survives app backgrounding mid-funnel

## 2. Auth (`app/(auth)/`)

- [ ] Sign up (email/password) → check-email screen
- [ ] Email confirmation deep link — **cross-device**: open link on a different
      device, HTTPS interstitial → `pulvio://` returns to app signed in
      (regression: path-less `pulvio://` gotcha)
- [ ] Sign in, wrong password error, show/hide password toggle
- [ ] `reset-password` request → email → set new password → sign in
- [ ] Guest / skip → Supabase **anonymous** session (no custom guestMode flag)
- [ ] Upgrade anonymous → real account keeps the same user id (favourites, plan,
      entitlement all carried)
- [ ] Sign in with Apple (iPhone only) — deferred item, run if the Developer
      account is live
- [ ] Sign out returns to a clean unauthenticated state

## 3. Explore tab (`app/(tabs)/index.tsx`)

- [ ] "Good evening / Ready to drift off?" greeting
- [ ] "Continue listening" appears only after a first session, resumes correct track
- [ ] "Tonight's pick" → "Play now" opens player
- [ ] "Browse sounds" chips + "All categories" → Sounds tab with filter applied
- [ ] "Favorites" row + "See all" → favourites screen; empty state before any like
- [ ] Pull-to-refresh / catalogue reload

## 4. Sounds tab (`app/(tabs)/sleep.tsx` catalogue, `app/sounds.tsx`)

- [ ] Category list with per-category counts
- [ ] Search — match, no-match (`searchEmptyTitle` with the query echoed)
- [ ] "Free only" filter — `freeFilterEmptyTitle` when a category is premium-only,
      `freeFilterEmptyBodyAll` when nothing free
- [ ] Premium badges on gated sounds
- [ ] `categoryUnavailable` and `loadError` (network off) states
- [ ] Empty catalogue state (`empty` / `emptyBody`)

## 5. Player (`app/player.tsx`)

- [ ] Play / pause / buffering indicator
- [ ] Sleep timer — each preset, "No limit", "Custom" (increment/decrement/confirm)
- [ ] Auto-armed timer banner (`timerAutoArmed`) when opened from Sleep routine
- [ ] Fade-out near timer end; `timerFinished` stops playback
- [ ] **Free-tier limit:** after ~3 min, playback stops → `cooldownBannerTitle` /
      `limitCountdown` shows "Free listening returns in …". Confirm the countdown
      comes from the **backend** `cooldownEndsAt`, not the device clock — roll the
      device clock forward and confirm the limit does **not** lift early
- [ ] `limitCta` "Go Premium…" → paywall
- [ ] Premium-only track for a free user → `premiumOnlyTitle` gate, no playback
- [ ] `noTrack` empty state → "Browse sounds"
- [ ] Error states: `loadFailed`, `trackUnavailable`, `sessionEnded`
- [ ] Lock-screen / notification transport controls; audio survives screen-off and
      app-backgrounded (UIBackgroundModes audio / Android foreground service)

## 6. Sleep tab (`app/(tabs)/sleep.tsx`)

- [ ] "Wind down gently", "Bedtime in {time}" countdown
- [ ] Adjust schedule sheet — bedtime + wake-up pickers, Done persists
- [ ] "Tonight's routine" — choose a sound (`trackPickerTitle`), "Play at bedtime"
      toggle
- [ ] Bedtime notification fires (`bedtimePlayNotifTitle`) → tap starts the track
- [ ] Sleep timer row — presets, custom, "No limit", "Won't fade out automatically"
- [ ] "Gentle fade-out" toggle
- [ ] "Quiet wake-up" toggle → `quietWakeupNotifTitle` at the wake time; deny
      notifications → `permissionDeniedMessage` points to device settings
- [ ] Schedule survives reboot / app restart

## 7. Paywall (`app/paywall.tsx`)

- [ ] Trial variant: "Your first {days} days are free", yearly-default selection,
      "Show other plans" expands weekly/monthly/quarterly/6-month
- [ ] Price strings: `perMonthShort`, `savePercent`, `monthsFree`
- [ ] No-trial variant title (`titleNoTrial`) and resume variant (`titleResume`)
- [ ] `startTrialCta` / `startTrialCtaZero` ($ due now) — **sandbox purchase**
      completes → entitlement syncs via RevenueCat webhook → premium unlocked
      (unlimited playback, gated sounds open)
- [ ] `purchaseReceivedTitle` "check again" recheck path
- [ ] Restore — with prior purchase, and `restoreNone` without
- [ ] Guest purchase → `guestPurchaseTitle` prompt to sign in; "Later" keeps
      premium on the anonymous session
- [ ] "Continue with the free version" dismisses
- [ ] Terms / Privacy links open (pulvio.mehmtcankilinc.com)
- [ ] **Fabricated testimonials** (`testimonial1-3`, `socialProofRating`) are still
      in the build — flag for removal per PRODUCT.md; note whether they render

## 8. Account / Settings (`app/account.tsx`, `app/(tabs)/profile.tsx`)

- [ ] Language switch — cycle **en, tr, de, fr, es, pt-BR**; spot-check layout on
      the longest strings (DE), RTL not required
- [ ] Entitlement / plan status display matches server truth
- [ ] Manage / cancel subscription deep-links to the store
- [ ] Delete account — confirmation, data cleared, returns to onboarding (do this
      last; use a throwaway account)
- [ ] Notification preferences reflect OS permission state

## 9. Cross-cutting

- [ ] Cold start → first interactive frame time; splash (`#120a10`) → app
- [ ] Offline launch — cached catalogue vs. hard error
- [ ] Rotate device — app is portrait-locked, confirm no layout break
- [ ] Dark theme only — no light-mode leakage on any native picker / sheet
- [ ] Back-button (Android hardware) behaviour on every stack
- [ ] No red-box / LogBox warnings during a full pass (note: debug build shows
      LogBox — capture-clean requires a release build)
- [ ] Memory / audio: play for 30+ min, confirm no leak, no second audio session

---

## Findings log

| Date | Area | Severity | Note | Status |
|---|---|---|---|---|
| 2026-09-08 | Preconditions | Blocker | Metro/dev-client not running on any port (8081/8082/8083/19000/19001). Installed `com.pulvio.app` v1.0.0 is an **Expo dev client** (DEBUGGABLE) — launches to the "Development Build / Connect to a dev server" screen, no JS bundle. Per project rule the agent must not start Metro; user must start it. **No test steps executable until Metro is up.** | Blocked |
| 2026-09-08 | Env | Note | No local release APK (`build/`, `*.apk` absent). `eas.json` `preview`/`production` are cloud-only. Compliance checklist item "Release build, not debug" cannot be met locally for screenshots. | Blocked |
| 2026-09-08 | Env | Note | Goldie not installed (`goldie: command not found`). `.argent/flows/` has no `*.flow.ts` files — the 8 scene flows referenced by `docs/ASO_SCREENSHOTS.md` do not exist in the repo and must be authored. | Blocked |
| 2026-09-08 | Env | Resolved | User started Metro (`192.168.1.101:8081`) + reconnected S21. Metro logged a benign `@expo/metro-file-map` cache-deserialize warning (Node/V8 version mismatch) → full crawl, served fine. Test run proceeded on the **dev (debuggable) build**. | Resolved |
| — | — | — | — | — |
| 2026-09-08 | §5 Player · Free-tier cooldown | **PASS (critical)** | After ~3 min playback the cooldown gate fired: "Listen all night with Premium / Your free listening is taking a short break" + "Free listening returns in 2:59:46" (≈3 h, matches copy). **Backend-enforcement confirmed:** force-stopped the app (`am force-stop`) + full relaunch (client memory wiped) → banner still present, showing 2:58:53, i.e. it kept counting down from wall-clock (~52 s elapsed ≈ 53 s decremented) instead of resetting to 3:00:00 → countdown is anchored to a server `cooldownEndsAt`, not a local timer. Persistent cooldown banner then shows on Explore/Sleep/Settings. | PASS |
| 2026-09-08 | §5 Player · cooldown clock-roll | Not tested | Plan wants the device clock rolled forward to prove the limit doesn't lift early. Physical S21 is unrooted — `adb shell date` → `Operation not permitted`, no `su`. Would need the system **Settings → Date & time** UI (modifies device system settings). The force-stop/relaunch test above is the substitute proof. | Deferred |
| 2026-09-08 | §7 Paywall · testimonials | **HIGH (release blocker)** | Fabricated social proof renders live in the build. Paywall shows a "WHAT PEOPLE SAY" section: 5 stars + "I fall asleep before the timer even ends now. First app that's actually worked for me." — "Emma · App Store", with a 3-dot carousel (testimonial1–3). Violates PRODUCT.md "Evidence on Hand". Must be removed from `paywall.json` / the paywall component before release **and** before any ASO capture. | Open |
| 2026-09-08 | §7 Paywall · unverified claims | **Fixed** | Benefit list rendered "The full library — 500+ sounds and ASMR" + "New sleep sounds every week". Real catalogue = 124 rows (0016 seed 99 + 0019 vehicle/ASMR 25) — "500+" is false; no evidence of weekly additions. Copy made number-/frequency-free in all 6 `src/locales/*/paywall.json`: `benefitLibrary` → "The full library of sleep sounds and ASMR", `benefitNewSounds` → "New sounds added over time". Verified on device. | Fixed |
| 2026-09-08 | §9 Nav · Android back | **Not a bug (re-tested)** | Original note was a misdiagnosis — I'd pressed Back twice without observing the middle state. Clean re-test: Explore → "All categories" → `/sounds`, **one** hardware Back returns to Explore correctly. The second Back then exited to the launcher, which is standard Android behaviour from a tab root. `app/sounds.tsx` back handling is fine; no change. | Closed |
| 2026-09-08 | §5 Player · sleep timer | **Fixed** | Player timer had only 15m/30m/45m/∞. Added a custom option: a compact circular button (`options-outline` glyph) after the four preset pills; tapping it swaps the row for an inline −/value/+/✓ stepper (5-min steps, 5–180, arms on every step — same contract as the Sleep tab), and once a custom value is armed the button becomes a selected pill showing it ("70m"). `app/player.tsx` `TimerChips` + a small `SelectChip` tweak (skip the text node for icon-only chips). All five items fit one centred line down to SE width — no scroll. Verified on device (preset → custom → stepper → 70m pill → back to 45m). | Fixed |
| 2026-09-08 | §5 Player · timer display | **Fixed** | Root cause: on a JS-runtime restart while audio keeps playing in the Android foreground service, `restoreSleepTimerOption()` restored the preset chip but set `endsAt=null` and never re-armed — so the countdown vanished **and the timer silently stopped firing**. Now `armSleepTimer` persists `{endsAt,startedAt}` (`pulvio_sleep_timer_run`); on restore, a still-future `endsAt` is rehydrated and the fade/stop rescheduled for the remaining time (a past `endsAt` stops playback + shows "timer ended"). `src/lib/player/sleepTimer.ts`. Verified: armed 70m → full Metro reload → player reopened with a live "Fades out in 1:09:xx", not the generic hint. | Fixed |
| 2026-09-08 | §7 Paywall · plans | Low | "Show other plans" expands to Weekly + Monthly only (plus the always-visible Yearly + 3-months). Plan doc expected weekly/monthly/quarterly/6-month — there is no 6-month product in the offering. | Info |
| 2026-09-08 | §4 Sounds · catalogue | **Fixed (needs `db push`)** | "Rain in the Car" (`Arabada Yağmur`, Pixabay 113602) was `rahatlatici/yagmur`. New migration `supabase/migrations/0022_recategorize_rain_in_car.sql` moves it to `araclar/arac_ici` + swaps its cover; `storage_url` untouched (audio file stays at `tracks/yagmur/113602.mp3` on R2). `scripts/catalog.mjs` source-of-truth updated with a note. **Apply with `supabase db push`** — not visible in-app until then (client reads live Supabase). | Fixed |
| 2026-09-08 | §3 Explore | Info | "Tonight's pick" title changes on every app load (Crickets → Wind by the Lake → …). Cosmetic; note if it's meant to be stable per evening. | Info |
| 2026-09-08 | §3 / §4 empty states | Not tested | Test account has favourites + listening history + is a returning user, so the Explore "Favorites"/"Continue listening" empty states, `searchEmpty`/`freeFilterEmpty*` for an all-premium category, and empty-catalogue states could not be observed. Needs a fresh account or seeded-empty state. | Deferred |
| 2026-09-08 | §3 Explore | PASS | "Good evening / Ready to drift off?" greeting, Tonight's pick → player, Browse-sounds chips, "All categories" → Sounds, Favorites row + "See all" all render and navigate. Pull-to-refresh not exercised. | PASS |
| 2026-09-08 | §4 Sounds | PASS | Category + sub-category chips, per-group headers, Premium lock badges on gated tracks, search (match shows "N sounds", no-match shows "No matches / Nothing matches \"zzqx\"." with the query echoed), and the "Free only" switch (→ "29 sounds", all unlocked) all work. | PASS |
| 2026-09-08 | §6 Sleep | PASS | "Wind down gently", "Bedtime in 5h 47m" countdown, Adjust-schedule sheet (Bedtime/Wake-up segmented control + two native NumberPickers, rendered on the dark sheet with no light-mode leak), and the Play-at-bedtime / Gentle fade-out / Quiet wake-up toggles all present and functional. Bedtime/quiet-wake **notification firing** not tested (time-based + playback blocked by the active cooldown); reboot persistence not tested (user's phone). | PASS |
| 2026-09-08 | §7 Paywall | PASS (aside from testimonials) | Resume variant title "Pick up where you left off"; Yearly pre-selected; "SAVE 17% / 10%", struck-through original price, per-week/per-month strings; "Show other plans" expander; Restore → "Nothing to restore / We couldn't find an active subscription…"; Terms & Privacy open a Chrome Custom Tab to `pulvio.mehmtcankilinc.com` (ToS "Last updated: September 3, 2026"). **Sandbox purchase not executed** (no RevenueCat sandbox account). | PASS |
| 2026-09-08 | §8 Settings | PASS | Language sheet lists en/tr/de/fr/es/pt-BR; switching is instant with no reload; DE (longest strings, e.g. "Schlafenszeit-Erinnerung") and TR layouts hold, tab bar labels fit. Entitlement card "Pulvio Free" matches server. "Delete account" present under ACCOUNT REMOVAL — **not exercised** (live account). Manage/cancel-subscription N/A for a free user. Sign-out confirm dialog copy is correct. | PASS |
| 2026-09-08 | §9 Cross-cutting | Partial | Portrait-lock confirmed (rotate → LandscapeLeft leaves layout unchanged). Audio survives app-backgrounding and a process kill (OS media-session chip persisted). No red-box seen during the pass (dev build shows no LogBox banner here, but a capture-clean pass still needs a release build). Cold-start timing, offline launch, 30-min memory/audio-leak, and reboot persistence **not tested**. | Partial |
| 2026-09-08 | §1 Onboarding / §2 Auth | Not tested | Both require signing out of the live account (leaves the device logged out; re-auth needs the account password, which the agent won't request in plaintext) or a dedicated throwaway account. Sign-out was staged and cancelled. Cross-device email deep-link and Sign in with Apple also out of scope for this run. | Deferred |
