import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { supabase } from "./supabase";

// Kategori/alt kategori taksonomisi artık Supabase'de (0023 migration):
// etiketler (6 dil), sıra ve ikon (Ionicons adı) buradan okunur. Böylece yeni
// bir alt kategori eklemek mağaza güncellemesi gerektirmez. Paketli
// catalogTaxonomy.ts sabitleri ve locales/*/catalog.json yalnızca ilk açılış /
// çevrimdışı durumunda yedek olarak kalır.

export type TaxonomyRow = {
  id: string;
  categoryId?: string;
  sortOrder: number;
  labels: Record<string, string>;
  icon: string;
  // Akıllı arama kelimeleri (0024): all = ilişkili tüm kelimeler, primary = alt kategoriyi
  // tanımlayanlar (aramada öne çıkar); ikisi de dil -> kelime listesi. Yoksa arama yalnızca etiket/başlıkla çalışır.
  keywords?: { all?: Record<string, string[]>; primary?: Record<string, string[]> };
};

type CatalogState = {
  categories: TaxonomyRow[];
  subcategories: TaxonomyRow[];
  categoryById: Record<string, TaxonomyRow>;
  subcategoryById: Record<string, TaxonomyRow>;
};

const CACHE_KEY = "pulvio_catalog_taxonomy_v1";

export const useCatalogStore = create<CatalogState>(() => ({
  categories: [],
  subcategories: [],
  categoryById: {},
  subcategoryById: {},
}));

function index(rows: TaxonomyRow[]): Record<string, TaxonomyRow> {
  return Object.fromEntries(rows.map((row) => [row.id, row]));
}

function apply(categories: TaxonomyRow[], subcategories: TaxonomyRow[]) {
  const categoryRank = Object.fromEntries(categories.map((c) => [c.id, c.sortOrder]));
  const sortedSubs = [...subcategories].sort(
    (a, b) =>
      (categoryRank[a.categoryId ?? ""] ?? 0) - (categoryRank[b.categoryId ?? ""] ?? 0) || a.sortOrder - b.sortOrder,
  );
  const sortedCats = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  useCatalogStore.setState({
    categories: sortedCats,
    subcategories: sortedSubs,
    categoryById: index(sortedCats),
    subcategoryById: index(sortedSubs),
  });
}

type CategoryDbRow = { id: string; sort_order: number; labels: Record<string, string>; icon: string };
type SubcategoryDbRow = CategoryDbRow & { category_id: string };

let inFlight: Promise<void> | null = null;
let hydrated = false;

// Ağdan taze taksonomiyi çeker; başarısızlıkta önbellek (AsyncStorage), o da
// yoksa paketli yedek devrede kalır. Asla throw etmez — katalog ekranı
// taksonomi yüzünden açılmamazlık yaşamamalı.
export function loadCatalogTaxonomy(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    if (!hydrated) {
      hydrated = true;
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as { categories: TaxonomyRow[]; subcategories: TaxonomyRow[] };
          apply(cached.categories, cached.subcategories);
        }
      } catch {
        // bozuk önbellek -> yok say
      }
    }
    try {
      const [cats, subs, kw] = await Promise.all([
        supabase.from("catalog_categories").select("id, sort_order, labels, icon").eq("active", true),
        supabase.from("catalog_subcategories").select("id, category_id, sort_order, labels, icon").eq("active", true),
        // Ayrı sorgu: keywords kolonu (0024) henüz yoksa ya da hata verirse taksonomi bundan etkilenmesin.
        supabase.from("catalog_subcategories").select("id, keywords").eq("active", true),
      ]);
      if (cats.error || subs.error || !cats.data?.length || !subs.data?.length) return;
      const keywordsById: Record<string, NonNullable<TaxonomyRow["keywords"]>> = {};
      if (!kw.error) {
        for (const row of (kw.data ?? []) as { id: string; keywords: TaxonomyRow["keywords"] | null }[]) {
          if (row.keywords) keywordsById[row.id] = row.keywords;
        }
      }
      const categories = (cats.data as CategoryDbRow[]).map((r) => ({
        id: r.id,
        sortOrder: r.sort_order,
        labels: r.labels ?? {},
        icon: r.icon,
      }));
      const subcategories = (subs.data as SubcategoryDbRow[]).map((r) => ({
        id: r.id,
        categoryId: r.category_id,
        sortOrder: r.sort_order,
        labels: r.labels ?? {},
        icon: r.icon,
        keywords: keywordsById[r.id],
      }));
      apply(categories, subcategories);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ categories, subcategories })).catch(() => {});
    } catch (e) {
      console.warn("catalog taxonomy: fetch failed, using cache/fallback", e);
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
