# Pulvio

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_57-000000?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NativeWind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="NativeWind" />
  <img src="https://img.shields.io/badge/Zustand-5-443E38?style=for-the-badge" alt="Zustand" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/RevenueCat-F2545B?style=for-the-badge&logo=revenuecat&logoColor=white" alt="RevenueCat" />
</p>

A sleep & relaxation mobile app: ambient sounds, music and sleep stories so people never have to hunt for something new to fall asleep to every night. Freemium model — a limited free tier with a server-enforced cooldown, and a subscription that unlocks the full catalog.

> [!NOTE]
> 🌙 **Project Status:** Feature-complete and submitted to the App Store (iOS) / Google Play (Android). All eight planned development phases are done; work now focuses on store assets, content and polish.

---

## ✨ Features

- **Guided onboarding** — a short quiz (sleep struggles, sound preferences, bedtime) that personalizes the first experience, ending in a "your plan is ready" screen.
- **Explore** — browse the catalog by category, with favorites and a "continue listening" shortcut.
- **Sleep** — bedtime schedule, bedtime reminders and a sleep timer that fades audio out.
- **Player** — full-screen player with background playback and lock-screen controls.
- **Freemium gating** — limited free listening with a backend-computed cooldown, plus a paywall (annual-default pricing variant, free trial).
- **Guest mode** — skip the paywall and use the app through a Supabase anonymous session; it can later be upgraded to a permanent account without losing data.
- **Localization** — English, Turkish, German, French, Spanish, Portuguese.
- **Notifications & e-mail** — bedtime reminders, announcements, trial-ending reminders.

---

## 🛠 Tech Stack

| Domain            | Technology                                                                              |
| :---------------- | :-------------------------------------------------------------------------------------- |
| **Framework**     | React Native + Expo (dev-client build — not compatible with Expo Go, see below)         |
| **Language**      | TypeScript                                                                              |
| **Navigation**    | Expo Router (file-based, route groups per flow)                                         |
| **Styling**       | NativeWind (Tailwind for React Native), custom "Drift" design system                    |
| **State**         | Zustand                                                                                 |
| **Backend**       | Supabase — Postgres, Auth, Row Level Security, Edge Functions                           |
| **Payments**      | RevenueCat (`react-native-purchases`)                                                   |
| **Audio**         | `expo-audio`                                                                            |
| **Media hosting** | Cloudflare R2 (audio + cover art, served from a custom CDN domain)                      |
| **i18n**          | i18next, react-i18next, `expo-localization`                                             |
| **Notifications** | `expo-notifications` (FCM on Android, APNs on iOS)                                      |
| **Auth**          | Supabase Auth — e-mail, Google OAuth, Sign in with Apple, anonymous sessions            |
| **Animations**    | `react-native-reanimated`, `expo-linear-gradient`, `react-native-svg`                   |
| **E-mail**        | Resend (via Supabase Edge Functions)                                                    |
| **Fonts**         | Plus Jakarta Sans, Lora (`@expo-google-fonts`)                                          |
| **CI / Builds**   | EAS Build, GitHub Actions (iOS screenshot & walkthrough capture)                        |

---

## 🚀 Getting Started

### Prerequisites

Node.js and npm, Android Studio and/or Xcode, a Supabase project and a RevenueCat project. EAS CLI (`npm i -g eas-cli`) if you need to (re)build the dev client in the cloud.

> [!WARNING]
> This project can **not** run inside the plain Expo Go app. RevenueCat, notifications, Apple/Google sign-in and `react-native-date-picker` are native modules that require a custom dev client build.

### Installation & Setup

1. **Clone the repository and install dependencies:**

   ```bash
   git clone https://github.com/mehmtcankilnc/pulvio-sleep-sounds.git
   cd pulvio-sleep-sounds
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Fill in the Supabase URL / anon key and the RevenueCat keys. Place `google-services.json` at the repo root for Android push notifications.

3. **Apply the database schema** to your Supabase project:

   ```bash
   npx supabase db push
   ```

4. **Build and install a dev client** (only needed once, or after native deps/config change):

   ```bash
   npx expo run:android   # or: npx expo run:ios (macOS) / an EAS development build
   ```

5. **Start Metro and run the app:**

   ```bash
   npx expo start --dev-client
   ```

   Open the already-installed dev client on your device/emulator — it connects to Metro automatically.

> [!IMPORTANT]
> The `R2_*` variables in `.env.example` are only used by the content-upload scripts in `scripts/` and never ship inside the app. On an emulator without Google Play Billing, set `EXPO_PUBLIC_DISABLE_PURCHASES=1` to skip RevenueCat.

---

## 📐 Technical Architecture & Decisions

### 🔒 Server-enforced cooldown
The free-tier cooldown is computed **only on the backend** (Postgres RPC in `supabase/migrations`). The client never derives it from the device clock, so changing the phone's date/time can't bypass the limit.

### 🧪 Expo Dev Client instead of Expo Go
Native modules and OAuth redirects don't work in Expo Go, so the project uses a custom dev client built with EAS (`eas.json`, `expo-dev-client`).

### 🗂️ File-based routing with route groups
`app/(auth)`, `app/(onboarding)` and `app/(tabs)` separate the three top-level flows; the root `app/_layout.tsx` decides which one to show from auth/onboarding state. Onboarding uses a persistent stage — one fixed `GlowBackground` and header live in the layout while each screen is a transparent panel on top.

### 💳 Subscription state via webhooks
Entitlements are synced to Supabase through the `revenuecat-webhook` Edge Function instead of being trusted from the client. `refresh-subscription` lets the app force a re-sync after a purchase.

### 👤 Anonymous → permanent accounts
Skipping the paywall creates a Supabase anonymous session (no custom "guest" flag). Signing up later upgrades the same user, so the user id and data are preserved.

### 🛡️ Row Level Security everywhere
All user-facing tables are protected by RLS; privileged operations (account deletion, announcements, trial reminders) run in Edge Functions with the service role key.

### ☁️ Media on Cloudflare R2
Audio and cover art live in R2 and are served from a CDN subdomain. The app only reads ready-made public URLs from the `tracks` table; the upload scripts in `scripts/` (`upload-audio.mjs`, `upload-covers.mjs`, `r2.mjs`) are the only code that touches R2 credentials.

### 🎧 Player engine
Playback, sleep timer and UI are decoupled: `src/lib/player` owns the audio engine and sleep timer, `PlayerEngineProvider` bridges it to React, and `usePlayerStore` / `useSleepTimerStore` hold UI state.

### 🌍 Localization
Six languages via i18next, with device-locale detection. Catalog taxonomy and track titles are localized too (`catalogTaxonomy.ts`, `trackTitle.ts`).

### 📸 Automated store assets
`scripts/` and `.github/workflows/` capture localized App Store screenshots and an app walkthrough video on iOS simulators through CI, using the Goldie / Argent tooling.

---

## 📁 Project Structure

```
app/                    # Expo Router screens
  _layout.tsx           # Root stack: fonts, i18n, auth gate, providers
  (auth)/               # Sign in / sign up
  (onboarding)/         # Welcome, quiz, bedtime, reminder, plan-ready
  (tabs)/               # Main app tabs (Explore, Sleep, Profile)
  player.tsx            # Full-screen player
  paywall.tsx           # Subscription paywall
src/
  components/           # Shared UI (Dock, GlowBackground, TrackRow, ...)
  hooks/                # Custom hooks
  lib/                  # Supabase, auth, RevenueCat, i18n, notifications, player engine
  locales/              # Translations (en, tr, de, fr, es, pt)
  store/                # Zustand stores
  theme/                # Design tokens
supabase/
  migrations/           # SQL schema, RLS, RPCs, seeds
  functions/            # Edge Functions (delete-account, revenuecat-webhook, ...)
scripts/                # Content upload (R2), catalog, screenshot/video capture
docs/                   # Plans, ASO notes, audio sourcing, e-mail templates
```

---

## 📜 License

All rights reserved. Pulvio is a personal, commercial project — the source is not licensed for reuse.
