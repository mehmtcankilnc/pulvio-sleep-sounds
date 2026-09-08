# ASO — Store Metadata & Screenshot Plan

Working plan for the App Store and Google Play listings. Screenshots are produced
with **Goldie** (`goldie.config.ts` + `.argent/flows/`), driven by **Argent** on a
device/simulator. This file is the source of truth for *what* each screenshot says
and *why*, in keyword-priority order.

Status: **draft — needs native-speaker QA on all non-EN copy, and a content audit
(see Compliance).** Android capture runs locally on Windows; iOS capture is a
hand-off to an EAS cloud Mac (see bottom).

---

## 1. Positioning recap (drives every headline)

Pulvio is a **narrow sleep-sound utility** — ambient sounds, noise, ASMR, and a
sleep timer that fades out. Not a meditation/wellness suite. The freemium model is
deliberately honest: a real free tier with a server-enforced cooldown, not a
disappearing trial. One fixed dark theme (no light mode): deep plum background
(`#120a10` / `#1a1118`), warm peach/apricot glow accent (`#f2b48c`).

Markets, in priority order: **US/EN**, **Brazil/PT-BR** (high download volume,
under-served by competitors in PT), then DE, FR, ES, TR.

---

## 2. Keyword strategy

### How the two stores index (what this plan optimises for)

| Surface | Apple indexed? | Google indexed? | Consequence for us |
|---|---|---|---|
| Title (30) | yes | yes (strongest) | Head terms go here |
| Subtitle / Short desc | yes | yes | Second-tier terms, **no word repeated from title** (Apple) |
| Keyword field (100 **bytes**) | yes (hidden) | n/a | Apple only; long-tail, no spaces, no repeats |
| Long description | **no** | **yes (heavily)** | Google: 2–3% keyword density, natural prose. Apple: pure conversion copy |
| Screenshot captions | **yes (since Jun 2025)** | no | Bake keywords into the first 3 caption lines |

### Target keywords (EN), by tier

- **Head (highest volume, must appear in title/subtitle):** sleep sounds, white
  noise, sleep, ASMR, rain sounds
- **Mid (subtitle / keyword field / caption 1–3):** ocean sounds, nature sounds,
  sleep timer, relaxing sounds, calm, fall asleep, bedtime, brown noise, pink noise
- **Long-tail (keyword field / long description):** fall asleep fast, rain and
  thunderstorm, fireplace sounds, forest sounds, fan noise, ambient music, lo-fi,
  sleep aid, deep sleep, baby sleep sounds, focus sounds

> **Not confirmed — do not lead with these until verified against the Supabase
> `tracks` table:** "sleep stories" / narration (onboarding copy mentions it but
> there is no Stories category), and any hard catalogue count.

### Proposed metadata

#### Apple App Store

| Field | Value | Count |
|---|---|---|
| **Title** | `Sleep & White Noise: Pulvio` | 27 / 30 |
| **Subtitle** | `Rain, Ocean, ASMR & Fan Sounds` | 30 / 30 |
| **Keyword field** | `relax,calm,fall,asleep,timer,nature,thunderstorm,fireplace,forest,birds,waves,brown,pink,bedtime` | ~90 bytes — **verify in App Store Connect**; non-Latin locales use 2–3 bytes/char so localized fields need re-trimming |

**Why this shape:**

- **Keyword-first, brand last.** Pulvio has no brand search volume yet, and both
  stores weight the leading words of the title most. The brand still exact-matches
  for anyone searching "Pulvio". Flip to brand-first only once the name has its
  own search demand.
- **`white noise` is verbatim in the title.** It's the highest-intent head term
  in this category — higher than "music" or "calm" — and Apple/Google rank the
  literal phrase best when it's in the title itself.
- **`sleep sounds` is still covered** even though it's not contiguous in the
  title: Apple builds ranking combinations across Title + Subtitle + Keywords, so
  `sleep` (title) + `sounds` (subtitle) → the app ranks for "sleep sounds",
  "rain sounds", "ocean sounds", "fan sounds", "sleep timer", etc.
- **First token is `Sleep`, not `White`.** "Sleep" anchors the most valuable
  combinations (sleep sounds / timer / aid / music / deep sleep). "White noise"
  still sits at position 3–4, which is the point of the exercise.

Rules honoured: no word repeated across Title / Subtitle / Keywords. Title =
sleep, white, noise, pulvio. Subtitle = rain, ocean, asmr, fan, sounds. Keyword
field shares nothing with either.

#### Google Play

| Field | Value | Count |
|---|---|---|
| **Title** | `Sleep Sounds & White Noise` | 26 / 30 |
| **Short description** | `White noise, rain and ocean sounds with a sleep timer that fades out gently.` | 77 / 80 |
| **Full description** | see block below — keyword-dense, natural, ~1,400 chars; brand in line 1 |

Google title must avoid: emoji, ALL CAPS, "best/#1/free", CTAs — the above is clean.

**Google title drops the brand on purpose.** Google has no hidden keyword field,
the title is its single strongest ranking signal, and both `sleep sounds` and
`white noise` fit verbatim only if `Pulvio` comes out. The brand is safe in the
developer name (shown under the title), the short description, and line 1 of the
full description. If you'd rather keep brand parity with the App Store, use
`Sleep & White Noise: Pulvio` (27) here too and accept losing the contiguous
"sleep sounds" phrase in the Google title.

<details>
<summary>Google Play full-description draft (EN)</summary>

```
Pulvio plays ambient sleep sounds, noise and ASMR so you can fall asleep faster —
without hunting for new videos every night.

WHAT'S INSIDE
• Rain, thunderstorm, ocean waves, streams, forest, birdsong, wind and fireplace
• White noise, brown noise and pink noise
• ASMR triggers — tapping, keyboard and more
• Vehicle ambience — car interior, train, plane cabin, bus, café
• Piano, lo-fi and ambient music

A SLEEP TIMER THAT FADES OUT
Set a timer and the sound lowers gradually as you drift off, instead of cutting
out and waking you. Playback keeps going with the screen off, with lock-screen
controls.

BUILT FOR BEDTIME
Answer a few quick questions and Pulvio builds a wind-down for you. Set your
bedtime and your sounds are ready on time. Wake gently to a soft morning sound.

AN HONEST FREE TIER
Free listening is genuinely free — time-limited with a cooldown, not a trial that
vanishes into a paywall. Upgrade to Premium for unlimited listening and the full
library.

Languages: English, Português (Brasil), Deutsch, Français, Español, Türkçe.
```
</details>

### Localized title / subtitle / keywords (DRAFT — native QA required)

Titles follow the EN pattern **[sleep] & [white noise] : [brand]**, keyword-first.
Where all three won't fit 30 chars the brand is dropped (flagged). The column
below is the **Google short description**; each locale still needs its own **Apple
subtitle (≤30, no word repeated from that locale's title)** — draft during native
QA with the same rain/ocean/ASMR/fan/sounds fill as EN.

| Locale | Title (≤30) | Google short desc | Top keywords |
|---|---|---|---|
| **PT-BR** | `Ruído branco e sono: Pulvio` (27) | `Ruído branco, chuva, oceano e ASMR com timer de sono que diminui aos poucos.` | sons para dormir, ruído branco, som de chuva, sons da natureza, relaxamento, timer de sono, ASMR, ondas do mar, dormir rápido, sono profundo |
| **DE** | `Weißes Rauschen & Schlaf` (24, **brand dropped**; alt `Rauschen & Schlaf: Pulvio` 25) | `Weißes Rauschen, Regen, Meer und ASMR mit sanftem Einschlaf-Timer.` | einschlafen, weißes rauschen, regengeräusche, naturgeräusche, entspannung, schlaf timer, ASMR, meeresrauschen, einschlafhilfe, beruhigend |
| **FR** | `Bruit blanc & sommeil : Pulvio` (30) | `Bruit blanc, pluie, océan et ASMR avec une minuterie de sommeil en fondu.` | sons pour dormir, bruit blanc, bruit de pluie, sons de la nature, relaxation, minuterie sommeil, ASMR, vagues océan, aide au sommeil, apaisant |
| **ES** | `Ruido blanco y dormir: Pulvio` (29) | `Ruido blanco, lluvia, océano y ASMR con temporizador de sueño con desvanecido.` | sonidos para dormir, ruido blanco, sonido de lluvia, sonidos de la naturaleza, relajación, temporizador de sueño, ASMR, olas del mar, conciliar el sueño, calma |
| **TR** | `Beyaz Gürültü & Uyku: Pulvio` (28) | `Yağmur, okyanus, beyaz gürültü ve ASMR; uyku zamanlayıcı yavaşça kısılır.` | uyku sesleri, beyaz gürültü, yağmur sesi, doğa sesleri, rahatlatıcı, uyku zamanlayıcısı, ASMR, okyanus dalgası, meditasyon, gevşeme |

---

## 3. Screenshot set

**6 frames** (Google Play max = 8; Apple allows 10 but only the **first 3** show
in search results, so 1–3 carry the keyword load). Same order both stores.

Portrait, the app's dark theme. Caption = short headline baked into the frame (≤6
words), placed **top**, device below. First-3 captions are written to contain the
head keywords because Apple indexes caption text.

> From the original 8-frame draft: **paywall** dropped (fabricated testimonials,
> §5), **lock-screen/background** dropped (can't be staged by the flow pipeline).
> A **quiet wake-up** frame was tried and dropped — it only re-showed the
> schedule screen. An **Explore home** frame was added as frame 1.

| # | Config scene id | Screen shown | Headline (EN) | Keyword target | Job |
|---|---|---|---|---|---|
| **1** | `01-explore` | Explore home (premium badge, Favorites ×3, Tonight's pick, Browse rail) | **Sleep sounds, ready when you are** | sleep sounds, sleep aid | "This is a working, personalised sleep app" in 1 second |
| **2** | `02-catalogue` | Sounds list, "All sounds" (grouped by category) | **Rain, ocean & white noise for sleep** | white noise, rain sounds, ocean sounds | Breadth of the catalogue |
| **3** | `03-sleep-timer` | Player with the fade-out timer armed ("Fades out in mm:ss") | **A sleep timer that fades out** | sleep timer, fall asleep | The differentiator |
| **4** | `04-asmr` | Sounds list, "All ASMR" (Tapping + Keyboard) | **ASMR triggers: tapping, keyboard & more** | ASMR | Distinct audience / high-volume term |
| **5** | `05-schedule` | Sleep tab — schedule arc + tonight's routine | **Your sounds, ready at bedtime** | bedtime, wind down, routine | Nightly habit |
| **6** | `06-categories` | Category grid (`app/categories.tsx`) — cover-image tiles | **Brown & pink noise, nature, lo-fi** | brown noise, pink noise, nature sounds, ambient, lo-fi | Depth — locks "brown noise" / "pink noise" now that "white noise" is in the title |

**Apple & Google Play:** ship 1–6 in this order.

Frame 6's screen is new: `app/categories.tsx`, a grouped 2-column grid of every
subcategory as a cover-art tile, reached from Explore → "All categories". It
shows "Brown noise", "Pink noise", "Fireplace", "Forest", "Lo-fi", "Ambient", …
as literal tile labels, which is what the headline needs.

### Localized headlines (DRAFT — native QA required)

| # | PT-BR | DE | FR | ES | TR |
|---|---|---|---|---|---|
| 1 | Sons para dormir, prontos quando você quiser | Einschlafklänge, bereit wenn du es bist | Des sons pour dormir, prêts quand vous l'êtes | Sonidos para dormir, listos cuando quieras | Uyku sesleri, sen hazır olduğunda hazır |
| 2 | Chuva, oceano e ruído branco para dormir | Regen, Meer & weißes Rauschen zum Einschlafen | Pluie, océan et bruit blanc pour dormir | Lluvia, océano y ruido blanco para dormir | Uyku için yağmur, okyanus, beyaz gürültü |
| 3 | Um timer de sono que diminui | Ein Timer, der sanft ausblendet | Une minuterie qui s'estompe | Un temporizador que se desvanece | Yavaşça kısılan uyku zamanlayıcısı |
| 4 | ASMR: tapping, teclado e mais | ASMR: Tapping, Tastatur & mehr | ASMR : tapping, clavier et plus | ASMR: tapping, teclado y más | ASMR: tıklama, klavye ve dahası |
| 5 | Seus sons, prontos na hora de dormir | Deine Klänge, pünktlich zur Schlafenszeit | Vos sons, prêts pour le coucher | Tus sonidos, listos para dormir | Sesler yatış saatinde hazır |
| 6 | Ruído marrom e rosa, natureza, lo-fi | Braunes & rosa Rauschen, Natur, Lo-Fi | Bruit brun et rose, nature, lo-fi | Ruido marrón y rosa, naturaleza, lo-fi | Kahverengi & pembe gürültü, doğa, lo-fi |

---

## 4. Design spec (Goldie)

- **Templates:** `editorial` (headline top, device below) for all 8. Keep it
  uniform — the set should read as one system.
- **Background:** solid plum (`#120a10`) with a soft peach radial glow
  (`#f2b48c` at ~12% opacity) behind the device. No photos.
- **Headline type:** bundled `Merriweather` (serif) to echo the app's Lora
  headings; body/eyebrow in `DM Sans` (echoes Plus Jakarta Sans).
- **Headline colour:** `#f7ede6` (near-white warm) with the keyword noun in
  `#f2b48c`. High contrast on plum.
- **Device frame:** `17-pro-silver` (neutral, doesn't fight the plum). If it still
  reads too cold, use `theme.screenOnly: true` with rounded corners.
- **Dimensions:** iPhone 6.9" `1320 × 2868`; Pixel `1080 × 1920`. Feature graphic
  (Play, separate asset) `1024 × 500` — reuse frame 1's headline + glow.
- **Caption length:** ≤ 6 words. Never wrap past 2 lines.

### Android capture source — DECISION

Goldie 0.3.1's only Android device key is **`pixel-10-pro`**, and it accepts a
capture host *only* if its hardware profile is `pixel_10_pro` or `pixel_9_pro`
(1280 × 2856 screen). `goldie doctor` **rejects both** the physical S21 and the
`Pixel_8` AVD for this key.

**Chosen host: a new `Pixel_9_Pro` AVD.** It is the lowest-friction path that
keeps Goldie's geometry correct end to end (no letterbox/crop when compositing
into the 1080 × 1920 canvas + bundled Pixel bezel):

```
avdmanager create avd --device pixel_9_pro --name Pixel_9_Pro -k "system-images;android-35;google_apis_playstore;x86_64"
```

Then install the app on it and point Metro at it (user starts Metro).

- **S21** stays the functional-test device (`docs/ARGENT_TEST_PLAN.md`); it is
  *not* a valid Goldie capture host for framed shots.
- **`Pixel_8` AVD** fallback: only if the Pixel 9 Pro image can't be pulled —
  Goldie would need the device key patched or captures fed in manually.

### How the set is actually produced (goldie 0.3.1 reality)

`goldie capture` does one **reinstall** of the APK at the start of a run, which
**wipes app data** → the premium session is gone and every flow lands on
onboarding. So the pipeline is run **manually**, which also keeps the session:

```
# 1. sign in once (premium account), demo status bar handled by the loop
for s in 01-explore 02-catalogue 03-sleep-timer 04-asmr 05-schedule 06-categories; do
  node_modules/.bin/argent flow run $s --device emulator-5554     # force-stop only, session survives
  <re-broadcast the SystemUI demo status bar>                     # goldie's own sendDemoCommands set
  adb -s emulator-5554 exec-out screencap -p > out/raw/pixel-10-pro/$s.png
done
# 2. hand-write out/raw/pixel-10-pro/manifest.json  { device, udid, screenshots:[{sceneId,file}], preview:null }
goldie frame --device pixel-10-pro --locale en                    # → out/screenshots/pixel-10-pro/en/*.png
```

`goldie frame` reads that manifest + the config's per-scene `headline[locale]`,
composites the bezel + copy, and writes `out/screenshots/<device>/<locale>/`.
The template is **`uniform`** (not `editorial` — that varies the layout per
scene, cropping the device and splitting some scenes into 2 tiles).

**Editing copy / background without touching the config:** `goldie studio`
serves a browser UI at `http://localhost:4321` — switch device, background,
template, bezel, font, and **per-tile copy per locale**; it writes
`goldie.design.json` next to `goldie.config.ts` and `goldie frame` then renders
exactly what you set. One-offs also work as CLI flags: `goldie frame
--background "<css>" --font <key> --template <key> --layout <key> --frame
<variant> --screen-only`.

### `goldie.config.ts` — COMMITTED (reconciled against goldie 0.3.1)

`goldie.config.ts` is now in the repo root, authored against the real
`GoldieConfig` type (`node_modules`-less: `import type { GoldieConfig } from "goldie"`).
Corrections vs. the old guessed skeleton:

- Top-level `appRoot`, `appPath` (iOS .app), `bundleId` are **required**.
- `frame` is an object: `{ variant: "17-pro-silver" }`, not a bare string.
- `appearance: "dark"` is a top-level field (not `theme.screenOnly`).
- `theme` requires `headlineColor`, `subheadColor`, `copyHeightRatio`,
  `deviceWidthRatio`.
- Headlines live **on each scene**, keyed by locale: `headline: { en: "…", … }`.
- Scene `flow` is an **argent flow name** → `.argent/flows/<name>.yaml`
  (record with `argent flow record <name>`), *not* a `.flow.ts` path.
- A `store: { … }` block (studio chrome) is required; Pulvio's is filled with
  **no invented rating/review count** (`rating: 0`, `ratingCount: "New"`).
- **6 scenes** (order = array order): `01-explore`, `02-catalogue`,
  `03-sleep-timer`, `04-asmr`, `05-schedule`, `06-categories`.
- `theme.template: "uniform"`, `deviceWidthRatio: 0.92`.

### Setup status (2026-09-08, `goldie doctor`)

| Check | State | Needed |
|---|---|---|
| `goldie` CLI | ✅ installed global v0.3.1 | — |
| `adb`, node 22 | ✅ | — |
| `goldie.config.ts` | ✅ committed | — |
| `.argent/flows/` | ✅ dir created | — |
| `ffmpeg` / `ffprobe` | ✅ installed (Gyan.FFmpeg, on the **user** PATH) | open a fresh terminal so `goldie` sees it |
| **Pixel 9 Pro AVD** | ✅ created (`Pixel_9_Pro`, hand-built `config.ini`, `hw.device.name=pixel_9_pro`, 1280×2856, android-35 image) | — |
| `emulator pixel-10-pro` (goldie) | ✅ "capture will boot AVD Pixel_9_Pro" | — |
| `argent video-watermark` | ⚠️ enabled | `argent disable video-watermark` — **preview videos only**, irrelevant to Play (its promo video is a YouTube link you post yourself) |
| **`./build/pulvio-preview.apk`** | ✅ built + installed on `Pixel_9_Pro` (`emulator-5554`) | standalone `preview` build — no Metro, LogBox-free |
| **6 scene flows** | ✅ authored + passing (`.argent/flows/0{1..6}-*.yaml`) | replayed via `argent flow run` in the manual pipeline above |
| **EN set** | ✅ **captured + framed** — `out/screenshots/pixel-10-pro/en/*.png` (6× 1280×2856) | — |
| **`app/categories.tsx`** (scene 6) | ✅ added; tiles now use cover images, list virtualized (`FlatList`) | testIDs `category-tile-<sub>` |
| Premium account | ✅ signed in on `emulator-5554` (needs both the `subscriptions` row **and** a RevenueCat promotional entitlement — `resolveSubscriptionState` cross-checks RC) | — |
| **`TrackRow` premium lock hidden for subscribers** | ✅ done in APK `cb5d4f9a` — no lock/"Premium" label in scenes 2 & 4 | — |
| **Localized runs (pt-BR/de/fr/es/tr)** | ✅ **captured + framed** — `out/screenshots/pixel-10-pro/{pt-BR,de,fr,es,tr}/*.png` (6 scenes each, 1280×2856) | non-EN headlines are DRAFT — native-speaker QA still required; TR scene-1 wraps to 4 lines, PT/TR scene-2 to 3 lines |

### testID reference (added 2026-09-08)

Stable, locale-independent selectors for the Goldie / QA flows. Added via optional
`testID` pass-throughs on `SelectChip`, `Toggle`, `GlowBackground`, and local
`RoutineRow` / `AdjustButton` / `SectionHeader` props.

| testID | Where | Kind |
|---|---|---|
| `tab-index` / `tab-sleep` / `tab-profile` | bottom dock tabs (`Dock.tsx`) | button ✅ |
| `mini-player` | now-playing bar in the dock | button ✅ |
| `explore-screen` | Explore `ScrollView` | container |
| `tonight-pick` | Explore "Tonight's pick" hero | button ✅ |
| `browse-all-categories` | Explore → "All categories" link (→ `/categories`) | button ✅ |
| `categories-screen` | Category grid root | container |
| `category-tile-<sub>` | Category grid tiles (`category-tile-beyaz_gurultu`, `-lofi`, …) | button ✅ |
| `sounds-screen` | Sounds root view | container |
| `category-chip-<key>` | Sounds category chips (`category-chip-rahatlatici`, `-araclar`, `-asmr`, `-muzik`, `-all`) | chip ✅ |
| `subcategory-chip-<key>` | Sounds sub-category chips (`-yagmur`, `-tiklama`, …) | chip ✅ |
| `player-screen` | Player playing-state view | container |
| `player-winddown` | Player cooldown / premium-gate / empty view | container |
| `player-playpause` | Player primary play/pause | button ✅ |
| `player-timer-status` | Player "Fades out in mm:ss" line | text ✅ |
| `sleep-screen` | Sleep `ScrollView` | container ✅ |
| `sleep-schedule-card` | Sleep schedule hero card | container |
| `sleep-adjust` | Sleep "Adjust" schedule button | button ✅ |
| `sleep-play-at-bedtime` / `sleep-timer-row` / `sleep-fade-out` / `sleep-quiet-wakeup` | Sleep routine rows | row container |
| `sleep-fade-out-toggle` / `sleep-quiet-wakeup-toggle` | those rows' switches | switch ✅ |

✅ = verified resolving in `describe` on the S21 this session.

---

## 5. Compliance checklist (block release if unresolved)

- [ ] **No fabricated social proof in any screenshot.** ⚠️ **CONFIRMED LIVE
      2026-09-08** — the paywall renders a "WHAT PEOPLE SAY" section: 5 stars +
      "I fall asleep before the timer even ends now. First app that's actually
      worked for me." — "Emma · App Store", in a 3-dot carousel (testimonial1–3).
      PRODUCT.md § "Evidence on Hand" forbids this. **Remove from `paywall.json` /
      the paywall component before release.** Frame 4 (paywall) is already dropped
      from the screenshot set, and no star-rating overlay goes on any frame.
- [ ] **Catalogue-size claims.** ⚠️ **RENDERS LIVE 2026-09-08** — paywall benefit
      list shows "The full library — 500+ sounds and ASMR" and "New sleep sounds
      every week". Verify both against the live Supabase `tracks` table before
      either appears in a caption or description. (Free-only filter showed
      "29 sounds"; full library size unconfirmed.) This plan keeps all copy
      number-free until confirmed.
- [ ] **"Sleep stories".** `onboarding.welcomeSubtitle` says "sleep stories" but
      no Stories catalogue exists. Either add the content, fix the onboarding
      copy, or keep the term out of ASO. Not used in the drafts above.
- [ ] **Release build, not debug.** Debug builds paint a LogBox banner into
      captures. Capture from an EAS `preview`/`production` build (set
      `android.appPath` to the APK, or install the release build on the device).
- [ ] Google Play title/short-desc free of "free/best/#1", CTAs, emoji, CAPS. ✓ in drafts.
- [ ] Localized fields re-checked for length **after** translation (German
      compounds and the Apple 100-**byte** field are the usual failures).

---

## 6. iOS hand-off (EAS cloud Mac)

Goldie's App Store path needs macOS + Xcode simulators, which this Windows machine
does not have. To produce the iPhone 6.9" set:

1. On a Mac (or `eas build` + a macOS CI runner / cloud Mac):
   - `node 20+`, `ffmpeg` on PATH (goldie 0.3.1 also wants `ffprobe`), Xcode with
     an **iPhone 17 Pro Max** simulator (goldie's `iphone-6.9` key resolves that
     `simulatorName`).
   - `npm i -g goldie` (pin `goldie@0.3.1` for parity with the Android run).
   - Check out this repo — **`goldie.config.ts` is committed** at the repo root;
     `.argent/flows/` exists.
   - Edit `goldie.config.ts`: add `"iphone-6.9"` to `devices`, and set `appPath`
     to a Release-iphonesimulator `.app` (`eas build -p ios --profile preview`
     produces one, or build locally).
   - `goldie doctor`, then `goldie all --device iphone-6.9`.
2. **The 6 scene flows do not exist yet** (`goldie doctor` → all FAIL). They must
   be recorded once — on Android here first, then replayed/repaired on the Mac.
   The capture account is Premium now, so state is no longer a blocker.
3. If an iOS selector misses on replay, repair that step with Argent on the Mac.
4. Output lands in `out/screenshots/iphone-6.9/<locale>/` — upload to App Store
   Connect in the order in §3.

Alternative if no Mac is available: capture the same 6 flows on the Android device
here, then composite into iPhone 6.9" canvas size with an iPhone frame — store
dimensions are valid but the status bar / UI chrome will be Android. Lower
quality; use only as a stopgap.

---

## 7. Locales for capture

`en`, `pt-BR`, `de`, `fr`, `es`, `tr` — switch in-app via Settings → Language
before each flow run. Goldie writes per-locale folders; wire the locale list into
`goldie.config.ts`.
