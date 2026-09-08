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

  // --- iOS (EAS Mac only) -------------------------------------------------
  // Release *simulator* build produced by `eas build -p ios --profile preview`
  // (or a local Release-iphonesimulator .app). Fill in on the Mac.
  appPath: "REPLACE_ON_MAC/Build/Products/Release-iphonesimulator/Pulvio.app",
  bundleId: "com.pulvio.app",

  // --- Android (this machine) ------------------------------------------------
  android: {
    // EAS `preview` APK — avoids the debug LogBox banner. Until one is built,
    // captures run against the installed dev build (LogBox-clean in practice,
    // but not a release artifact — see docs/ARGENT_TEST_PLAN.md findings).
    appPath: "./build/pulvio-preview.apk",
    applicationId: "com.pulvio.app",
  },

  // "iphone-6.9" is added on the EAS Mac. `goldie doctor` on Windows will
  // (correctly) refuse an iOS device here.
  devices: ["pixel-10-pro"],

  // en first; pt-BR is the #2 market (docs/ASO_SCREENSHOTS.md §1).
  locales: ["en", "pt-BR", "de", "fr", "es", "tr"],

  // Pulvio has one fixed dark theme, no light mode.
  appearance: "dark",

  // Neutral silver bezel so it doesn't fight the plum background (ASO §4).
  frame: { variant: "17-pro-silver" },

  theme: {
    background: "#120a10", // deep plum; add the peach radial glow in the studio
    headlineColor: "#f7ede6", // near-white warm
    subheadColor: "#c9a891",
    fontFamily: '"Merriweather", Georgia, "Times New Roman", serif',
    copyHeightRatio: 0.24,
    deviceWidthRatio: 0.92,
    // "uniform" = every scene gets the same classic layout (headline top, full
    // device below). "editorial" varies the layout per scene (hero / panorama /
    // …) which crops some devices and splits panorama scenes into 2 tiles.
    template: "uniform",
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

  scenes: [
    {
      kind: "screenshot",
      id: "01-explore",
      flow: "01-explore",
      headline: {
        en: "Sleep sounds, ready when you are",
        "pt-BR": "Sons para dormir, prontos quando você quiser",
        de: "Einschlafklänge, bereit wenn du es bist",
        fr: "Des sons pour dormir, prêts quand vous l'êtes",
        es: "Sonidos para dormir, listos cuando quieras",
        tr: "Uyku sesleri, sen hazır olduğunda hazır",
      },
    },
    {
      kind: "screenshot",
      id: "02-catalogue",
      flow: "02-catalogue",
      headline: {
        en: "Rain, ocean & white noise for sleep",
        "pt-BR": "Chuva, oceano e ruído branco para dormir",
        de: "Regen, Meer & weißes Rauschen zum Einschlafen",
        fr: "Pluie, océan et bruit blanc pour dormir",
        es: "Lluvia, océano y ruido blanco para dormir",
        tr: "Uyku için yağmur, okyanus, beyaz gürültü",
      },
    },
    {
      kind: "screenshot",
      id: "03-sleep-timer",
      flow: "03-sleep-timer",
      headline: {
        en: "A sleep timer that fades out",
        "pt-BR": "Um timer de sono que diminui",
        de: "Ein Timer, der sanft ausblendet",
        fr: "Une minuterie qui s'estompe",
        es: "Un temporizador que se desvanece",
        tr: "Yavaşça kısılan uyku zamanlayıcısı",
      },
    },
    {
      kind: "screenshot",
      id: "04-asmr",
      flow: "04-asmr",
      headline: {
        en: "ASMR triggers: tapping, keyboard & more",
        "pt-BR": "ASMR: tapping, teclado e mais",
        de: "ASMR: Tapping, Tastatur & mehr",
        fr: "ASMR : tapping, clavier et plus",
        es: "ASMR: tapping, teclado y más",
        tr: "ASMR: tıklama, klavye ve dahası",
      },
    },
    {
      kind: "screenshot",
      id: "05-schedule",
      flow: "05-schedule",
      headline: {
        en: "Your sounds, ready at bedtime",
        "pt-BR": "Seus sons, prontos na hora de dormir",
        de: "Deine Klänge, pünktlich zur Schlafenszeit",
        fr: "Vos sons, prêts pour le coucher",
        es: "Tus sonidos, listos para dormir",
        tr: "Sesler yatış saatinde hazır",
      },
    },
    {
      kind: "screenshot",
      id: "06-categories",
      flow: "06-categories",
      headline: {
        en: "Brown & pink noise, nature, lo-fi",
        "pt-BR": "Ruído marrom e rosa, natureza, lo-fi",
        de: "Braunes & rosa Rauschen, Natur, Lo-Fi",
        fr: "Bruit brun et rose, nature, lo-fi",
        es: "Ruido marrón y rosa, naturaleza, lo-fi",
        tr: "Kahverengi & pembe gürültü, doğa, lo-fi",
      },
    },
  ],
};

export default config;
