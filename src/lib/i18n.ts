import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import trCommon from "../locales/tr/common.json";
import trAuth from "../locales/tr/auth.json";
import trHome from "../locales/tr/home.json";
import trDiscover from "../locales/tr/discover.json";
import trPlayer from "../locales/tr/player.json";
import trSettings from "../locales/tr/settings.json";
import trPaywall from "../locales/tr/paywall.json";
import trSleep from "../locales/tr/sleep.json";
import trOnboarding from "../locales/tr/onboarding.json";

import enCommon from "../locales/en/common.json";
import enAuth from "../locales/en/auth.json";
import enHome from "../locales/en/home.json";
import enDiscover from "../locales/en/discover.json";
import enPlayer from "../locales/en/player.json";
import enSettings from "../locales/en/settings.json";
import enPaywall from "../locales/en/paywall.json";
import enSleep from "../locales/en/sleep.json";
import enOnboarding from "../locales/en/onboarding.json";

import deCommon from "../locales/de/common.json";
import deAuth from "../locales/de/auth.json";
import deHome from "../locales/de/home.json";
import deDiscover from "../locales/de/discover.json";
import dePlayer from "../locales/de/player.json";
import deSettings from "../locales/de/settings.json";
import dePaywall from "../locales/de/paywall.json";

import frCommon from "../locales/fr/common.json";
import frAuth from "../locales/fr/auth.json";
import frHome from "../locales/fr/home.json";
import frDiscover from "../locales/fr/discover.json";
import frPlayer from "../locales/fr/player.json";
import frSettings from "../locales/fr/settings.json";
import frPaywall from "../locales/fr/paywall.json";

import esCommon from "../locales/es/common.json";
import esAuth from "../locales/es/auth.json";
import esHome from "../locales/es/home.json";
import esDiscover from "../locales/es/discover.json";
import esPlayer from "../locales/es/player.json";
import esSettings from "../locales/es/settings.json";
import esPaywall from "../locales/es/paywall.json";

import ptCommon from "../locales/pt/common.json";
import ptAuth from "../locales/pt/auth.json";
import ptHome from "../locales/pt/home.json";
import ptDiscover from "../locales/pt/discover.json";
import ptPlayer from "../locales/pt/player.json";
import ptSettings from "../locales/pt/settings.json";
import ptPaywall from "../locales/pt/paywall.json";

export const SUPPORTED_LANGUAGES = ["tr", "en", "de", "fr", "es", "pt"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = "pulvio_language";

// sleep/onboarding are only translated in tr/en for now (see
// docs/DRIFT_IMPLEMENTATION_PLAN.md) — the other locales fall back to en
// via fallbackLng below, which i18next does per-key without erroring.
const resources = {
  tr: { common: trCommon, auth: trAuth, home: trHome, discover: trDiscover, player: trPlayer, settings: trSettings, paywall: trPaywall, sleep: trSleep, onboarding: trOnboarding },
  en: { common: enCommon, auth: enAuth, home: enHome, discover: enDiscover, player: enPlayer, settings: enSettings, paywall: enPaywall, sleep: enSleep, onboarding: enOnboarding },
  de: { common: deCommon, auth: deAuth, home: deHome, discover: deDiscover, player: dePlayer, settings: deSettings, paywall: dePaywall },
  fr: { common: frCommon, auth: frAuth, home: frHome, discover: frDiscover, player: frPlayer, settings: frSettings, paywall: frPaywall },
  es: { common: esCommon, auth: esAuth, home: esHome, discover: esDiscover, player: esPlayer, settings: esSettings, paywall: esPaywall },
  pt: { common: ptCommon, auth: ptAuth, home: ptHome, discover: ptDiscover, player: ptPlayer, settings: ptSettings, paywall: ptPaywall },
};

function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}

// Modül yüklenir yüklenmez (senkron) çağrılır, böylece app/_layout.tsx'teki
// ilk render'da useTranslation() çalıştığında react-i18next'e bağlı bir
// instance zaten var olur — asıl init() (dil kaynaklarının yüklenmesi) hâlâ
// initI18n() içinde async kalıyor, sadece plugin bağlama artık senkron.
i18next.use(initReactI18next);

// app/_layout.tsx içinde uygulama render edilmeden önce bir kez çağrılır
// (session yükleme spinner'ıyla aynı desende). Önce AsyncStorage'daki
// kullanıcı tercihine bakar, yoksa cihaz diline düşer, o da desteklenmiyorsa EN.
export async function initI18n(): Promise<SupportedLanguage> {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  let initialLanguage: SupportedLanguage = "en";

  if (stored && isSupportedLanguage(stored)) {
    initialLanguage = stored;
  } else {
    const deviceLanguage = Localization.getLocales()[0]?.languageCode;
    if (deviceLanguage && isSupportedLanguage(deviceLanguage)) {
      initialLanguage = deviceLanguage;
    }
  }

  await i18next.init({
    resources,
    lng: initialLanguage,
    fallbackLng: "en",
    ns: ["common", "auth", "home", "discover", "player", "settings", "paywall", "sleep", "onboarding"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });

  return initialLanguage;
}

export async function changeAppLanguage(language: SupportedLanguage) {
  await i18next.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export default i18next;
