import type { TFunction } from "i18next";
import type { Track } from "../types";
import i18n from "./i18n";
import { useCatalogStore } from "./catalogStore";

// Fixed browse order for the whole catalog — replaces the previous
// alphabetical `.order("category").order("subcategory")` DB sort, which put
// "muzik" before "rahatlatici" and left tracks within a subcategory in
// random (uuid) order. This mirrors scripts/catalog.mjs's narrative order
// (calming sounds first, water → weather → nature → noise → café, then
// music) so Explore/Discover read as a deliberate sequence, not a shuffle.
//
// Bu iki dizi artık yalnızca YEDEK: asıl sıra/etiket/ikon Supabase'deki
// catalog_categories / catalog_subcategories tablolarından gelir (bkz.
// catalogStore.ts), böylece yeni kategori eklemek mağaza güncellemesi
// istemez. Sunucu verisi henüz gelmediyse (ilk açılış, çevrimdışı) bunlar
// kullanılır.
const FALLBACK_CATEGORY_ORDER = ["rahatlatici", "araclar", "asmr", "muzik"] as const;

const FALLBACK_SUBCATEGORY_ORDER = [
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
  "otobus",
  "arac_ici",
  "tren",
  "ucak_kabin",
  "tiklama",
  "klavye",
  "piyano",
  "lofi",
  "ambient",
] as const;

function indexOrLast(order: readonly string[], id: string): number {
  const i = order.indexOf(id);
  return i === -1 ? order.length : i;
}

// Sunucu taksonomisi varsa onun sırası, yoksa paketli yedek. Karşılaştırıcı
// binlerce kez çağrıldığı için id dizileri kaynak dizi değişene kadar önbellekte.
const orderCache = new WeakMap<object, readonly string[]>();

function idsOf(rows: { id: string }[], fallback: readonly string[]): readonly string[] {
  if (rows.length === 0) return fallback;
  let ids = orderCache.get(rows);
  if (!ids) {
    ids = rows.map((r) => r.id);
    orderCache.set(rows, ids);
  }
  return ids;
}

export function getCategoryOrder(): readonly string[] {
  return idsOf(useCatalogStore.getState().categories, FALLBACK_CATEGORY_ORDER);
}

function getSubcategoryOrder(): readonly string[] {
  return idsOf(useCatalogStore.getState().subcategories, FALLBACK_SUBCATEGORY_ORDER);
}

// A track is only shown when its subcategory has a proper label + icon: from
// the server taxonomy, or from the bundled fallback. Guarantees no raw slug or
// placeholder icon can reach the UI even if the taxonomy fetch failed.
export function isKnownSubcategory(id: string): boolean {
  const { subcategoryById } = useCatalogStore.getState();
  return id in subcategoryById || (FALLBACK_SUBCATEGORY_ORDER as readonly string[]).includes(id);
}

// Bileşenlerin taksonomi yüklenince yeniden render olması için abonelik.
export function useCatalogTaxonomy() {
  return useCatalogStore((state) => state.categories);
}

function serverLabel(labels: Record<string, string> | undefined): string | undefined {
  if (!labels) return undefined;
  return labels[i18n.language] || labels.en || undefined;
}

// Sort key: taxonomy position first (category, then subcategory), then free
// tracks before premium ones within a subcategory (the free sample should be
// what a browsing user meets first), then title. Keeps sections internally
// stable across refetches instead of reflecting insertion order.
export function compareTracks(a: Track, b: Track, language: string): number {
  const categoryOrder = getCategoryOrder();
  const subcategoryOrder = getSubcategoryOrder();
  const catDiff = indexOrLast(categoryOrder, a.category) - indexOrLast(categoryOrder, b.category);
  if (catDiff !== 0) return catDiff;
  const subDiff = indexOrLast(subcategoryOrder, a.subcategory) - indexOrLast(subcategoryOrder, b.subcategory);
  if (subDiff !== 0) return subDiff;
  const premiumDiff = Number(a.isPremiumOnly) - Number(b.isPremiumOnly);
  if (premiumDiff !== 0) return premiumDiff;
  return a.title.localeCompare(b.title, language);
}

// `t` is a bound `useTranslation("catalog")` t-function. Server labels
// (catalog_categories / catalog_subcategories) win, so a category added
// after release still gets a proper 6-language name; the bundled catalog.json
// is the offline fallback, and the humanized slug is the last resort.
export function categoryLabel(t: TFunction, id: string): string {
  return serverLabel(useCatalogStore.getState().categoryById[id]?.labels) ?? t(`category.${id}`, { defaultValue: id });
}

export function subcategoryLabel(t: TFunction, id: string): string {
  return (
    serverLabel(useCatalogStore.getState().subcategoryById[id]?.labels) ??
    t(`subcategory.${id}`, { defaultValue: id.replace(/_/g, " ") })
  );
}
