import i18n from "./i18n";

// storage_url is always ".../<subcategory>/<pixabayId>.mp3" (see
// scripts/catalog.mjs) — the trailing numeric id is stable and already used
// there as the manifest key, so it doubles as the translation key here with
// no DB schema change.
const TRAILING_ID_RE = /\/(\d+)\.mp3$/i;

// The DB `tracks.title` column is Turkish only (source of truth — matches
// scripts/catalog.mjs's manifest). Every other language's title is looked up
// client-side from src/locales/<lang>/tracks.json, keyed by that Pixabay id.
//
// Deliberately uses `i18n.getResource` (reads exactly one language's bundle,
// no fallback chain) rather than `t()`: with fallbackLng set to "en", a
// plain `t(id, {ns:"tracks", defaultValue: dbTitle})` call for a Turkish
// user would find no "tracks" bundle for "tr", fall through to "en", and
// silently show the English title instead of the intended Turkish
// `defaultValue`. getResource has no such fallback, so a missing key just
// returns undefined and we fall back to the Turkish DB title ourselves.
export function localizedTrackTitle(dbTitle: string, storageUrl: string, language: string): string {
  const match = storageUrl.match(TRAILING_ID_RE);
  if (!match) return dbTitle;
  const translated = i18n.getResource(language, "tracks", match[1]);
  return typeof translated === "string" ? translated : dbTitle;
}
