# Pulvio

Pulvio is a sleep & relaxation mobile app: ambient sounds and sleep stories designed to help people fall asleep faster. It follows a freemium model — a limited free tier with a cooldown between sessions, and a subscription that unlocks the full catalog and unlimited listening.

## Features

- **Guided onboarding** — a short quiz (sleep struggles, sound preferences, bedtime) that personalizes the initial experience
- **Explore** — browse the sound/story catalog by category
- **Sleep** — bedtime-focused content and reminders
- **Player** — background audio playback with lock-screen controls
- **Bedtime & push notifications** — reminders and announcements
- **Freemium gating** — free listening quota with a server-enforced cooldown; paywall for upgrading
- **Localization** — English, Turkish, German, French, Spanish, Portuguese

## Tech stack

| Area | Choice |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 52 (dev client, not Expo Go) + React Native 0.76 |
| Language | TypeScript |
| Navigation | Expo Router (file-based routing) |
| Styling | NativeWind 4 (Tailwind CSS for React Native) |
| State | Zustand |
| Backend | Supabase (Postgres, Auth, RLS, Edge Functions) |
| Audio | react-native-track-player |
| Payments | RevenueCat (`react-native-purchases`) |
| i18n | i18next + react-i18next + expo-localization |
| Notifications | expo-notifications (FCM via `google-services.json`) |
| Animations | react-native-reanimated |
| Fonts | Plus Jakarta Sans, Lora (via expo-google-fonts) |

## Architectural decisions

- **Server-enforced cooldown.** The free-tier cooldown (`cooldownEndsAt`) is *only* ever computed on the backend (see `supabase/migrations/0006_freemium_rpc.sql`). The client never derives it from the device clock, so changing the device date/time cannot bypass the limit.
- **Expo Dev Client instead of Expo Go.** OAuth redirects and native modules (track player, RevenueCat, notifications) don't work in Expo Go, so the project uses a custom dev client built with EAS (`eas.json`, `expo-dev-client`).
- **File-based routing with route groups.** `app/(auth)`, `app/(onboarding)`, and `app/(tabs)` separate the three top-level flows; the root `app/_layout.tsx` decides which group to show based on auth/onboarding state.
- **Subscription state via RevenueCat webhooks.** Entitlements are synced to Supabase through the `revenuecat-webhook` Edge Function rather than trusted from the client.
- **Row Level Security everywhere.** All user-facing tables are protected by RLS policies (`supabase/migrations/0002_rls.sql`); privileged operations (account deletion, announcements, trial reminders) run in Edge Functions with the service role key.
- **Playback as a native service.** Audio runs through `react-native-track-player`'s background service (`src/lib/player/service.ts`) so playback survives app backgrounding; UI state is bridged via `PlayerEngineProvider`.

## Project structure

```
app/                    # Expo Router screens
  _layout.tsx           # Root stack: fonts, i18n, auth gate, providers
  (auth)/               # Sign in / sign up
  (onboarding)/         # Welcome, quiz, bedtime, plan-ready
  (tabs)/               # Main app: Explore, Sleep, Profile
  discover.tsx          # Category browsing
  player.tsx            # Full-screen player (modal)
  paywall.tsx           # Subscription paywall
src/
  components/           # Shared UI (Button, Card, Dock, GlowBackground, ...)
  hooks/                # useThemeColors, useContinueListening, ...
  lib/                  # Supabase client, auth, RevenueCat, i18n, notifications, player engine
  locales/              # Translation JSON per language (en, tr, de, fr, es, pt)
  store/                # Zustand stores (usePlayerStore, useUserStore)
  theme/                # Design tokens
  types/                # Shared TypeScript types
supabase/
  migrations/           # SQL schema, RLS, RPCs, seeds
  functions/            # Edge Functions (delete-account, revenuecat-webhook, ...)
docs/                   # Implementation plans
```

## Running locally

### Prerequisites

- Node.js 18+ and npm
- Android Studio (for Android) or Xcode (for iOS)
- A Supabase project and a RevenueCat project (API keys)
- EAS CLI if you need to (re)build the dev client: `npm i -g eas-cli`

### Setup

```bash
npm install
```

Configure environment/keys:

- Supabase URL and anon key — see `src/lib/supabase.ts`
- RevenueCat public API keys — see `src/lib/revenuecat.ts`
- `google-services.json` at the repo root for FCM push notifications

Apply the database schema to your Supabase project:

```bash
npx supabase db push
```

### Run

The app requires a **custom dev client** (native modules don't run in Expo Go). Build and install it once:

```bash
npx expo run:android
```

(or `npx expo run:ios` on macOS). After that, day-to-day development only needs the Metro bundler:

```bash
npx expo start --dev-client
```

Then open the app on the device/emulator — it connects to Metro automatically.

## Roadmap

Development follows a phased plan (see `docs/`). Auth, playback, freemium gating, RevenueCat, localization, and notifications are complete; upcoming work includes content sourcing and an ASMR category (deferred).
