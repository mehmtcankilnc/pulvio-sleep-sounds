# Drift redesign — implementation plan

This app now runs the Drift visual system (see `C:\Projects\design\drift\DESIGN.md`).
All 12 screens from the design inventory are wired into real navigation and
reviewable on device. This document tracks, screen by screen, what's real
vs. mock in this pass, and what real implementation work remains.

Legend: 🟢 real · 🟡 partially real · ⚪ mock/visual only

## 1. Explore — [app/(tabs)/index.tsx](../app/(tabs)/index.tsx) 🟢
Real data throughout (`useTracks`, `useContinueListening`, `usePlayerActions`).
- **Remaining work:** category → icon mapping is keyword-matched
  (`src/lib/categoryIcon.tsx`) against the real `category`/`subcategory`
  strings. Once the real taxonomy is finalized, replace this with an
  explicit id→icon table.

## 2. Now Playing — [app/player.tsx](../app/player.tsx) 🟡
Playback state is real (player store).
- **Real now:** sleep timer (15/30/45/∞ pills arm a real fade-then-pause in
  `src/lib/player/sleepTimer.ts`, persisted across sessions). Like/heart
  toggle is real (`src/hooks/useFavorites.ts`, Supabase `favorites` table),
  surfaced in Profile's "Favorite sounds" row.
- Skip back/forward controls still render but have no handler — the
  player only supports single-track playback. **Needs:** either remove
  these controls or define what "skip" means for a single ambient track.
- The old "Add a layer" CTA (linked to Mixer) was removed on 2026-08-25
  along with the Mixer feature — see below.

## 3. ~~Sound Mixer~~ — removed (2026-08-25)
The Mixer tab, its scenes/layers data model, and the `scenes`/`scene_layers`
Supabase tables were fully removed per an explicit product decision — not a
technical dead end, a deliberate "don't want this in the app" call. Do not
resume this section; if multi-sound mixing comes back, treat it as a new
feature request from scratch. Nav is back to 3 tabs (Explore/Sleep/Profile).
Other sections below that referenced "the Mixer's scene model" (old #4, #5,
#7–11) no longer have that model to reuse — flagged inline where relevant.

## 4. Sleep — [app/(tabs)/sleep.tsx](../app/(tabs)/sleep.tsx) 🟢 (2026-08-25)
Bedtime/wake schedule is real, backed by a new `sleep_schedule` Supabase
table (`0010_sleep_schedule.sql`, one row per user) via
`src/lib/sleepSchedule.ts` + `src/hooks/useSleepSchedule.ts`.
- Bedtime arc's "Bedtime in Xh Ym" hint is a live countdown to the next
  bedtime occurrence (today or tomorrow), ticking once a minute.
- "Adjust" opens a real time picker (`react-native-date-picker`, added this
  pass — needs a dev client rebuild) for both bedtime and wake time,
  debounced 400ms before writing so a fast spin doesn't spam Supabase.
- "Play [track] at bedtime": since the Mixer's scene model is gone, this
  plays a single user-picked track (a picker modal reusing `useTracks`),
  not a mix. Implemented as a **tap-to-open local notification** at bedtime
  carrying the trackId — tapping it opens Now Playing and starts the track.
  Auto-playing audio from a background trigger isn't reliably possible on
  iOS/Android, so this was a deliberate scope decision, not a shortcut.
- "Sleep timer" row reads/writes the same real timer state
  `src/lib/player/sleepTimer.ts` already exposed (Now Playing's pills use
  the same store) — tapping the row expands the same 15m/30m/45m/∞ chips.
- "Gentle fade-out" toggle (`fade_out_enabled`) now actually gates
  `sleepTimer.ts`'s behavior: off means the timer cuts audio at the full
  duration instead of fading over the last 15s. Read lazily at fire time
  (`setSleepTimerFadeEnabled`), so flipping it mid-countdown still applies.
- "Quiet wake-up" is the same tap-to-open notification pattern as
  "Play at bedtime", scheduled at wake time — see `src/lib/sleepNotifications.ts`
  (distinct identifiers from `bedtimeReminder.ts`'s own notification, so
  toggling one never cancels the other).
- Note: the real, already-wired **bedtime reminder** notification (existing
  `src/lib/bedtimeReminder.ts`) intentionally lives in **Profile → Preferences**
  to match DESIGN.html exactly — Sleep's routine card does not duplicate it.
- **Not yet device-tested** — `tsc --noEmit` is clean, that's all that's
  verified so far. The new native dependency (datetimepicker) needs a dev
  client rebuild before any of this is testable at all.

## 5. Profile — [app/(tabs)/profile.tsx](../app/(tabs)/profile.tsx) 🟡
Real: premium status, language switch, sign out, delete account, bedtime
reminder toggle (moved from the old Settings screen, still backed by
`src/lib/bedtimeReminder.ts`), "Favorite sounds" library row (real count
from `useFavorites`).
- The "Saved scenes" library row was removed on 2026-08-25 along with Mixer
  — no scenes feature exists to back it.
- "Preview onboarding flow" link is still a **temporary dev entry point** into
  `app/(onboarding)/` — remove once onboarding is wired ahead of `(auth)`
  (see #7-11).

## 6. Explore — idle dock ⚪ (no separate file)
Achieved automatically: `src/components/Dock.tsx` collapses to nav-only
rows whenever `usePlayerStore().currentTrack` is null. No further work
needed beyond whatever real playback state changes drive `currentTrack`.

## 7–11. Onboarding funnel — `app/(onboarding)/*` ⚪
Welcome → Quiz (struggles) → Quiz (sounds) → Bedtime → Plan Ready. All
selections are local `useState`, nothing persists, and Plan Ready's "Quiet
Mind" scene card is static copy, not actually built from the quiz answers.
- **Not yet wired ahead of `(auth)`** — reachable today only via Profile's
  "Preview onboarding flow" row. To make it real:
  1. Route new-session (no `session` **and** no "has completed onboarding"
     flag) traffic to `/(onboarding)/welcome` instead of `/(auth)` in
     `app/_layout.tsx`'s redirect effect.
  2. Add an `onboarding_answers` table (or a JSON column on the user
     profile) capturing struggles + sound preferences + bedtime.
  3. "Get started" → after the quiz, land on `(auth)/signup` (account
     creation) before or after Plan Ready — needs a product decision on
     order (create account first vs. show the payoff first, current build
     shows Plan Ready → Paywall directly).
  4. Plan Ready should read the persisted answers and pick a real track (or
     small set of tracks) — it previously assumed reusing the Mixer's scene
     model, which no longer exists (see #3); needs a fresh, simpler design
     since there's no multi-layer mix to build.
  5. Remove the Profile "Preview onboarding flow" dev link once real.
- i18n: the `onboarding` namespace (plus `sleep`) is only translated in
  **en/tr** right now — de/fr/es/pt fall back to English automatically
  (safe, no crash) but need real translations before ship.

## 12. Paywall — [app/paywall.tsx](../app/paywall.tsx) 🟡
Real RevenueCat offering/packages, real purchase flow (unchanged from
before the redesign) — only the visual layer changed. Plan cards render
whatever `offering.availablePackages` returns; the "SAVE %" badge only
shows when the selected package's identifier matches `/year|annual/i`.
- **Mock:** the trial timeline ("Today / Day 5 / Day 7") is static copy.
  **Needs:** derive the day-5/day-7 labels and the exact charge date from
  the selected package's `product.introPrice`/`subscriptionPeriod` instead
  of hardcoding "7 days".
- **Needs:** confirm RevenueCat package identifiers actually contain
  "year"/"annual" (the yearly-preferred-selection heuristic in
  `app/paywall.tsx` assumes this) — replace with an explicit package
  metadata check if not.

## Design-system infra added this pass
- `src/theme/colors.ts` — Drift token set (replaces the old
  primary/background/surface/border palette).
- `src/hooks/useThemeColors.ts` — now returns the fixed palette directly;
  the increased-contrast accessibility setting was **removed** per product
  decision (Drift defines one fixed dark palette).
- `src/components/icons/` — hand-copied inline SVG icons from
  `DESIGN.html` (not a new icon library).
- `src/components/GlowBackground.tsx` — the 4 gradient-wash recipes from
  DESIGN.md §3, plus the Now Playing moon-ring wrapper.
- `src/components/StarField.tsx`, `src/components/Dock.tsx`,
  `src/components/OnboardingHeader.tsx`, `src/components/ui/Toggle.tsx`.
- Fonts switched from Outfit to Plus Jakarta Sans + Lora Italic
  (`@expo-google-fonts/plus-jakarta-sans`, `@expo-google-fonts/lora`).
- New deps: `react-native-svg`, `expo-linear-gradient`.

## Suggested next order of work
1. ~~Real sleep timer~~ — done (`src/lib/player/sleepTimer.ts`).
2. ~~Favorites table~~ — done (`src/hooks/useFavorites.ts`).
3. ~~Scenes data model / Mixer~~ — removed instead of built (2026-08-25,
   product decision).
4. ~~Sleep screen persistence~~ — done (2026-08-25, `sleep_schedule` table +
   `useSleepSchedule`), not yet device-tested.
5. Onboarding persistence + wiring ahead of `(auth)`.
6. Paywall trial-date derivation from real RevenueCat product data.
7. Fill in de/fr/es/pt for the `sleep`/`onboarding` i18n namespaces.
