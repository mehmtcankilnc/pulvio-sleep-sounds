import type { TFunction } from "i18next";
import type { Track } from "../types";

// Fixed browse order for the whole catalog — replaces the previous
// alphabetical `.order("category").order("subcategory")` DB sort, which put
// "muzik" before "rahatlatici" and left tracks within a subcategory in
// random (uuid) order. This mirrors scripts/catalog.mjs's narrative order
// (calming sounds first, water → weather → nature → noise → café, then
// music) so Explore/Discover read as a deliberate sequence, not a shuffle.
export const CATEGORY_ORDER = ["rahatlatici", "muzik"] as const;

export const SUBCATEGORY_ORDER = [
  "yagmur",
  "deniz",
  "dere",
  "gok_gurultusu",
  "kus_sesi",
  "orman",
  "ruzgar",
  "gece_bocekleri",
  "ates",
  "fon_makinesi",
  "beyaz_gurultu",
  "kahverengi_gurultu",
  "pembe_gurultu",
  "kafe",
  "piyano",
  "lofi",
  "ambient",
] as const;

function indexOrLast(order: readonly string[], id: string): number {
  const i = order.indexOf(id);
  return i === -1 ? order.length : i;
}

// Sort key: taxonomy position first (category, then subcategory), then free
// tracks before premium ones within a subcategory (the free sample should be
// what a browsing user meets first), then title. Keeps sections internally
// stable across refetches instead of reflecting insertion order.
export function compareTracks(a: Track, b: Track, language: string): number {
  const catDiff = indexOrLast(CATEGORY_ORDER, a.category) - indexOrLast(CATEGORY_ORDER, b.category);
  if (catDiff !== 0) return catDiff;
  const subDiff = indexOrLast(SUBCATEGORY_ORDER, a.subcategory) - indexOrLast(SUBCATEGORY_ORDER, b.subcategory);
  if (subDiff !== 0) return subDiff;
  const premiumDiff = Number(a.isPremiumOnly) - Number(b.isPremiumOnly);
  if (premiumDiff !== 0) return premiumDiff;
  return a.title.localeCompare(b.title, language);
}

// `t` is a bound `useTranslation("catalog")` t-function. Falls back to the
// raw id (with underscores turned into spaces) for any subcategory added to
// the DB before its translation lands — never renders a blank label.
export function categoryLabel(t: TFunction, id: string): string {
  return t(`category.${id}`, { defaultValue: id });
}

export function subcategoryLabel(t: TFunction, id: string): string {
  return t(`subcategory.${id}`, { defaultValue: id.replace(/_/g, " ") });
}
