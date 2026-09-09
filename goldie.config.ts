import type { GoldieConfig } from "goldie";

/**
 * Goldie config for Pulvio store screenshots.
 * Source of truth for copy/order/design: docs/ASO_SCREENSHOTS.md.
 *
 * Scene `flow` values are argent flows in `.argent/flows/<name>.yaml`
 * (record them with `argent flow record <name>`). They are shared by the
 * Android run here and the iPhone run on the EAS Mac.
 *
 * Windows/Android run:  goldie capture --device pixel-10-pro
 * EAS Mac (iOS) run:     add "iphone-6.9" to `devices`, then `goldie all`
 *                        (see docs/ASO_SCREENSHOTS.md §6).
 */

// 6-scene set: explore, catalogue, sleep-timer, asmr, schedule, categories.
// From the original 8-frame draft, the paywall (fabricated testimonials) and
// the lock-screen/background-playback frame are dropped; a "quiet wake-up"
// frame was tried and dropped (it only duplicated the schedule screen); an
// Explore home frame was added as frame 1. See docs/ASO_SCREENSHOTS.md §3.

const config: GoldieConfig = {
  appRoot: import.meta.dirname,
  // flowsDir defaults to `${appRoot}/.argent/flows`.

  // --- iOS (Mac / CI only) ----------------------------------------------
  // Release-iphonesimulator .app. On the Mac / GitHub Actions the path comes
  // from GOLDIE_IOS_APP so the config file itself isn't mutated in CI.
  appPath:
    process.env.GOLDIE_IOS_APP ??
    "REPLACE_ON_MAC/Build/Products/Release-iphonesimulator/Pulvio.app",
  bundleId: "com.pulvio.app",

  // --- Android (this machine) ------------------------------------------------
  android: {
    // EAS `preview` APK — avoids the debug LogBox banner. Until one is built,
    // captures run against the installed dev build (LogBox-clean in practice,
    // but not a release artifact — see docs/ARGENT_TEST_PLAN.md findings).
    appPath: "./build/pulvio-preview.apk",
    applicationId: "com.pulvio.app",
    // Dark graphite bezel instead of goldie's bundled silver Pixel skin.
    // Same geometry as ANDROID_FRAME (goldie recolours nothing — it's a
    // straight image swap): the silver skin run through a darkening remap by
    // `node -e` (see chat / regenerate: load assets/pixel-10-pro.webp, map
    // opaque px luminance into [14..104], keep the transparent screen cutout).
    frame: {
      image: "./assets/pixel-10-pro-dark.png",
      width: 1410,
      height: 2968,
      screen: { x: 59, y: 60, width: 1280, height: 2856 },
      screenRadius: 178,
    },
  },

  // Android by default; the iOS CI job sets GOLDIE_IOS=1 to switch to the
  // iPhone key (goldie doctor on Windows would refuse an iOS device here).
  devices: process.env.GOLDIE_IOS ? ["iphone-6.9"] : ["pixel-10-pro"],

  // en first; pt-BR is the #2 market (docs/ASO_SCREENSHOTS.md §1).
  locales: ["en", "pt-BR", "de", "fr", "es", "tr"],

  // Pulvio has one fixed dark theme, no light mode.
  appearance: "dark",

  // iOS bezel (Mac run only). Dark graphite, same recolour as the Android
  // `android.frame` — goldie has no dark iPhone variant (silver/blue/orange
  // only), so it's a custom PNG: goldie's assets/17-pro-silver.png run through
  // the luminance remap. All bundled iPhone variants share one cutout geometry
  // (src/frame.ts FRAME), so a 606×1252 recolour needs no re-measuring.
  frame: { image: "./assets/iphone-17-pro-dark.png" },

  theme: {
    // Gradient echoing the app's GlowBackground: warm plum up top fading to
    // near-black plum at the bottom. `paint()` supports linear-gradient only
    // (no radial), angle-or-`to <side>` + stops.
    background:
      "linear-gradient(180deg, #2a1820 0%, #1a1016 46%, #0c0710 100%)",
    headlineColor: "#f7ede6", // near-white warm
    subheadColor: "#f2b48c", // peach — used ONLY as the panorama right-tile caption
    fontFamily: '"Merriweather", Georgia, "Times New Roman", serif',
    // Only `classic` reads these two; the other layouts carry their own ratios.
    copyHeightRatio: 0.19,
    deviceWidthRatio: 0.96,
    // Custom editorial sequence (7 output tiles from 6 scenes):
    //   scene 1  -> panorama  -> tiles 1 & 2  (needs scripts/patch-goldie.mjs
    //               for the tile-2 caption; without it tile 2 is bare)
    //   scene 2  -> tilt-right-> tile 3   (catalogue list; top rows stay visible)
    //   scene 3  -> classic   -> tile 4   (sleep-timer: classic so the timer
    //               chips + "fades out in mm:ss" + play stay visible)
    //   scene 4  -> classic   -> tile 5
    //   scene 5  -> tilt      -> tile 6   (tilt = leans left; crops the bottom,
    //               fine here — the schedule arc sits up top)
    //   scene 6  -> classic   -> tile 7
    template: ["panorama", "tilt-right", "classic", "classic", "tilt", "classic"],
    layout: "classic",
  },

  // Studio chrome only. Kept honest: no invented rating / review count.
  store: {
    name: "Sleep Sounds & White Noise",
    subtitle: {
      en: "White noise, rain & ocean with a sleep timer",
      "pt-BR": "Ruído branco, chuva e oceano com timer de sono",
      de: "Weißes Rauschen, Regen & Meer mit Einschlaf-Timer",
      fr: "Bruit blanc, pluie et océan avec minuterie de sommeil",
      es: "Ruido blanco, lluvia y océano con temporizador",
      tr: "Beyaz gürültü, yağmur ve okyanus; uyku zamanlayıcı",
    },
    developer: "Mehmetcan Kılınç",
    category: "Health & Fitness",
    rating: 0,
    ratingCount: "New",
    ageRating: "3+",
    price: "Free",
    description: {
      en: "Pulvio plays ambient sleep sounds, noise and ASMR so you can fall asleep faster. A sleep timer fades the sound out gently as you drift off. An honest free tier — time-limited with a cooldown, not a vanishing trial.",
      "pt-BR": "O Pulvio toca sons ambientes para dormir, ruído e ASMR para você pegar no sono mais rápido. Um timer de sono diminui o som aos poucos. Um plano gratuito de verdade — com pausa, não um teste que some.",
      de: "Pulvio spielt Umgebungsklänge, Rauschen und ASMR, damit du schneller einschläfst. Ein Einschlaf-Timer blendet den Ton sanft aus. Ein ehrlicher Gratis-Tarif — mit Wartezeit, kein verschwindender Test.",
      fr: "Pulvio diffuse des sons d'ambiance, du bruit et de l'ASMR pour vous endormir plus vite. Une minuterie estompe le son en douceur. Une vraie offre gratuite — limitée dans le temps, pas un essai qui disparaît.",
      es: "Pulvio reproduce sonidos ambientales, ruido y ASMR para dormir más rápido. Un temporizador desvanece el sonido poco a poco. Un plan gratuito de verdad — con pausa, no una prueba que desaparece.",
      tr: "Pulvio; ortam sesleri, gürültü ve ASMR çalarak daha hızlı uykuya dalmanı sağlar. Uyku zamanlayıcısı sesi yavaşça kısar. Gerçek bir ücretsiz kademe — bekleme süreli, kaybolan bir deneme değil.",
    },
  },

  // Headline per locale, hard-broken to 2 lines with \n.
  // `subhead` is used on scene 1 ONLY: with scripts/patch-goldie.mjs applied it
  // renders as the panorama's RIGHT-tile caption (styled like a headline). On
  // every other layout a subhead would just stack under the headline, so don't
  // add it elsewhere.
  scenes: [
    {
      kind: "screenshot",
      id: "01-explore",
      flow: "01-explore",
      headline: {
        en: "Sleep sounds,\nready",
        "pt-BR": "Sons para\ndormir",
        de: "Klänge zum\nEinschlafen",
        fr: "Des sons\npour dormir",
        es: "Sonidos\npara dormir",
        tr: "Uyku sesleri,\nhazır",
      },
      subhead: {
        en: "Noise, nature\n& ASMR",
        "pt-BR": "Ruído,\nnatureza, ASMR",
        de: "Rauschen,\nNatur, ASMR",
        fr: "Bruit, nature\n& ASMR",
        es: "Ruido, ASMR\ny naturaleza",
        tr: "Gürültü, doğa\nve ASMR",
      },
    },
    {
      kind: "screenshot",
      id: "02-catalogue",
      flow: "02-catalogue",
      headline: {
        en: "Rain & ocean,\nwhite noise",
        "pt-BR": "Chuva e mar,\nruído branco",
        de: "Regen, Meer,\nRauschen",
        fr: "Pluie, océan,\nbruit blanc",
        es: "Lluvia y mar,\nruido blanco",
        tr: "Yağmur, deniz,\nbeyaz gürültü",
      },
    },
    {
      kind: "screenshot",
      id: "03-sleep-timer",
      flow: "03-sleep-timer",
      headline: {
        en: "Sleep timer\nthat fades out",
        "pt-BR": "Timer de sono\nque diminui",
        de: "Timer, der\nsanft endet",
        fr: "Minuterie\nen fondu",
        es: "Temporizador\nque baja",
        tr: "Yavaşça biten\nzamanlayıcı",
      },
    },
    {
      kind: "screenshot",
      id: "04-asmr",
      flow: "04-asmr",
      headline: {
        en: "ASMR: tapping\n& keyboard",
        "pt-BR": "ASMR: tapping,\nteclado",
        de: "ASMR: Tapping,\nTastatur",
        fr: "ASMR: tapping,\nclavier",
        es: "ASMR: tapping,\nteclado",
        tr: "ASMR: tıklama,\nklavye",
      },
    },
    {
      kind: "screenshot",
      id: "05-schedule",
      flow: "05-schedule",
      headline: {
        en: "Ready at\nbedtime",
        "pt-BR": "Pronto para\ndormir",
        de: "Bereit zur\nSchlafenszeit",
        fr: "Prêt pour\nle coucher",
        es: "Listo para\ndormir",
        tr: "Uyku vakti\nhazır",
      },
    },
    {
      kind: "screenshot",
      id: "06-categories",
      flow: "06-categories",
      headline: {
        en: "Brown & pink\nnoise, lo-fi",
        "pt-BR": "Ruído marrom\ne rosa, lo-fi",
        de: "Braunes & rosa\nRauschen",
        fr: "Bruit brun\n& rose, lo-fi",
        es: "Ruido marrón,\nrosa, lo-fi",
        tr: "Kahverengi,\npembe gürültü",
      },
    },
  ],
};

export default config;
