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
Playback state is real (player store). Visual-only additions:
- Timer pills (15/30/45/∞) are local `useState`, not wired to an actual
  fade/stop timer. **Needs:** a real sleep-timer in
  `src/lib/player/PlayerEngineProvider.tsx` or the track player service
  (schedule stop/fade-out, persist selection).
- Skip back/forward controls render but have no handler — the current
  player only supports single-track playback. **Needs:** either remove
  these controls or define what "skip" means for a single ambient track.
- Like/heart toggle is local state only. **Needs:** a `favorites` table +
  hook, surfaced again in Profile's "Favorite sounds" row.
- "Add a layer" navigates to Mixer but doesn't hand off the current track.

## 3. Sound Mixer — [app/(tabs)/mixer.tsx](../app/(tabs)/mixer.tsx) ⚪
Fully mock: hardcoded layers/scenes, sliders are visual only (not
draggable, don't affect audio).
- **Needs:** a real multi-track mixing architecture. `react-native-track-player`
  is single-queue by default — mixing 2-4 simultaneous looping sounds with
  independent volume likely needs either multiple concurrent players (check
  platform limits) or a native audio-graph approach (e.g. `expo-av`/`react-native-audio-api`
  for simultaneous sounds with per-sound gain). Needs its own spike.
- Scenes (named layer presets) need a `scenes` table (Supabase) keyed by
  user, each row a set of `{track_id, level}[]`.
- "Add a sound" should open a picker (reuse Discover's list) constrained to
  the current scene's remaining layer slots.

## 4. Sleep — [app/(tabs)/sleep.tsx](../app/(tabs)/sleep.tsx) ⚪
Decorative bedtime arc + static 23:30/07:00 times. All 4 routine rows are
mock (no persistence, toggles don't do anything).
- **Needs:** a `sleep_schedule` table (bedtime/wake time), "Adjust" opens a
  real time picker, and the arc's "Bedtime in Xh Ym" label computed live.
- "Play Cabin Night at bedtime" needs to reuse the Mixer's scene model.
- "Sleep timer" here should read/write the same timer state as Now Playing's
  timer pills once that's real.
- "Gentle fade-out" toggle should gate whether the sleep timer fades or cuts.
- "Quiet wake-up" is a second scheduled notification/playback — same
  scheduling primitive as bedtime reminder, offset to wake time.
- Note: the real, already-wired **bedtime reminder** notification (existing
  `src/lib/bedtimeReminder.ts`) intentionally lives in **Profile → Preferences**
  to match DESIGN.html exactly — Sleep's routine card does not duplicate it.

## 5. Profile — [app/(tabs)/profile.tsx](../app/(tabs)/profile.tsx) 🟡
Real: premium status, language switch, sign out, delete account, bedtime
reminder toggle (moved from the old Settings screen, still backed by
`src/lib/bedtimeReminder.ts`).
- Mock: "Saved scenes" and "Favorite sounds" library rows show `0` — needs
  the scenes table (see #3) and a favorites table (see #2).
- "Preview onboarding flow" link is a **temporary dev entry point** into
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
  4. Plan Ready should read the persisted answers and pick/build a real
     scene (reuse the Mixer scene model) instead of the hardcoded "Quiet
     Mind" / "Rain on a Tin Roof" + "Slow Piano" pairing.
  5. Remove the Profile "Preview onboarding flow" dev link once real.
- i18n: the `onboarding` namespace (plus `mixer`/`sleep`) is only
  translated in **en/tr** right now — de/fr/es/pt fall back to English
  automatically (safe, no crash) but need real translations before ship.

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
1. Real sleep timer (unblocks Now Playing + Sleep's "Sleep timer" row).
2. Scenes data model (unblocks Mixer real mixing + Sleep's "Play scene at
   bedtime" + Plan Ready's real scene).
3. Favorites table (unblocks Now Playing's heart + Profile's library row).
4. Onboarding persistence + wiring ahead of `(auth)`.
5. Paywall trial-date derivation from real RevenueCat product data.
6. Fill in de/fr/es/pt for the `mixer`/`sleep`/`onboarding` i18n namespaces.
