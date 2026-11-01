import { useCatalogStore } from "./catalogStore";
import type { TrackSection } from "../hooks/useTracks";

// Akıllı katalog araması (Sounds + All categories ekranları).
//
// Yalnızca parça başlığına bakan düz "içerir" araması yerine: alt kategori
// etiketi (6 dilin hepsi), sunucudaki anahtar kelimeler (catalog_subcategories.keywords,
// 0024 — "bebek" → kalp atışı, rahim sesleri, beyaz gürültü…), üst kategori adı ve
// parça başlıkları birlikte taranır. Diyakritik/büyük-küçük harf duyarsız
// ("sagnak" → "sağanak", "ruzgar" → "rüzgâr"), önek eşleşir ("yagm" → yağmur) ve
// tam eşleşme bulunamazsa 1-2 harflik yazım hatalarına tolerans tanır.
//
// Üç aşama (ilk sonuç veren kazanır): (1) tüm kelimeler eşleşmeli, (2) herhangi
// biri eşleşmeli ("bebek uyku" → ikisinden biri), (3) bulanık eşleşme.

export function normalizeSearch(value: string): string {
  return value
    .replace(/İ/g, "i")
    .replace(/ı/g, "i")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function wordsOf(value: string | undefined): string[] {
  if (!value) return [];
  const normalized = normalizeSearch(value);
  return normalized ? normalized.split(" ") : [];
}

type SubDoc = { strong: string[]; weak: string[] };

// Alt kategori başına kelime belgesi. `strong`: şu anki dilin + İngilizce etiketi
// (kullanıcının gördüğü ad), `weak`: diğer diller, anahtar kelimeler, üst kategori adları.
const docCache = {
  subs: null as unknown,
  cats: null as unknown,
  language: "",
  entries: new Map<string, SubDoc>(),
};

function subDoc(
  subcategory: string,
  category: string,
  language: string,
  subLabel: (id: string) => string,
  catLabel: (id: string) => string,
): SubDoc {
  const { subcategoryById, categoryById } = useCatalogStore.getState();
  if (docCache.subs !== subcategoryById || docCache.cats !== categoryById || docCache.language !== language) {
    docCache.subs = subcategoryById;
    docCache.cats = categoryById;
    docCache.language = language;
    docCache.entries = new Map();
  }
  const key = `${subcategory}/${category}`;
  const cached = docCache.entries.get(key);
  if (cached) return cached;

  const sub = subcategoryById[subcategory];
  const cat = categoryById[category];
  const strong = new Set<string>([...wordsOf(subLabel(subcategory)), ...wordsOf(sub?.labels?.[language]), ...wordsOf(sub?.labels?.en)]);
  const weak = new Set<string>();
  for (const list of Object.values(sub?.keywords?.primary ?? {})) for (const kw of list) for (const w of wordsOf(kw)) strong.add(w);
  for (const label of Object.values(sub?.labels ?? {})) for (const w of wordsOf(label)) if (!strong.has(w)) weak.add(w);
  for (const list of Object.values(sub?.keywords?.all ?? {})) for (const kw of list) for (const w of wordsOf(kw)) if (!strong.has(w)) weak.add(w);
  for (const w of wordsOf(catLabel(category))) if (!strong.has(w)) weak.add(w);
  for (const label of Object.values(cat?.labels ?? {})) for (const w of wordsOf(label)) if (!strong.has(w)) weak.add(w);

  const doc = { strong: [...strong], weak: [...weak] };
  docCache.entries.set(key, doc);
  return doc;
}

// Damerau-Levenshtein (OSA): bitişik harf yer değiştirmesi ("yagmru") tek hata sayılır.
function levenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      row.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}

// 0 = eşleşmedi. Tam kelime 4, önek 3, içinde geçme 1, bulanık 1.
function tokenScore(token: string, word: string, fuzzy: boolean): number {
  if (word === token) return 4;
  if (token.length >= 2 && word.startsWith(token)) return 3;
  // Ek almış yazım ("odaklanma", "yağmurlu"): kullanıcının yazdığı kelime anahtar kelimeyle başlıyorsa.
  if (word.length >= 4 && token.startsWith(word)) return 2;
  if (token.length >= 3 && word.includes(token)) return 1;
  if (fuzzy && token.length >= 4) {
    const max = token.length >= 8 ? 2 : 1;
    if (levenshtein(token, word, max) <= max) return 1;
    if (word.length > token.length && levenshtein(token, word.slice(0, token.length), max) <= max) return 1;
  }
  return 0;
}

function bestScore(token: string, words: string[], fuzzy: boolean): number {
  let best = 0;
  for (const word of words) {
    const s = tokenScore(token, word, fuzzy);
    if (s > best) best = s;
    if (best === 4) break;
  }
  return best;
}

function matchWords(tokens: string[], strong: string[], weak: string[], fuzzy: boolean): { matched: number; score: number } {
  let matched = 0;
  let score = 0;
  for (const token of tokens) {
    const s = Math.max(bestScore(token, strong, fuzzy) * 2, bestScore(token, weak, fuzzy));
    if (s > 0) {
      matched++;
      score += s;
    }
  }
  return { matched, score };
}

export type CatalogSearchResult = {
  // Etiket / anahtar kelime / kategori ile eşleşen alt kategoriler: tüm parçaları ilgili.
  subcategoryHits: Set<string>;
  // Yalnızca başlığı eşleşen parçalar (alt kategorisi eşleşmese de gösterilir).
  trackHits: Set<string>;
  // Alt kategori -> sıralama puanı (etiket/anahtar kelime ya da en iyi parça başlığı).
  scores: Map<string, number>;
};

type Labels = { subLabel: (id: string) => string; catLabel: (id: string) => string };

export function searchCatalog(
  query: string,
  language: string,
  sections: TrackSection[],
  labels: Labels,
): CatalogSearchResult | null {
  const tokens = normalizeSearch(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return null;

  const passes = [
    { all: true, fuzzy: false },
    { all: false, fuzzy: false },
    { all: false, fuzzy: true },
  ];

  const empty = (): CatalogSearchResult => ({ subcategoryHits: new Set(), trackHits: new Set(), scores: new Map() });
  for (const pass of passes) {
    const ok = (matched: number) => (pass.all ? matched === tokens.length : matched >= 1);
    const result = empty();
    for (const section of sections) {
      const doc = subDoc(section.subcategory, section.category, language, labels.subLabel, labels.catLabel);
      const sub = matchWords(tokens, doc.strong, doc.weak, pass.fuzzy);
      let best = 0;
      if (ok(sub.matched)) {
        result.subcategoryHits.add(section.subcategory);
        best = sub.score;
      }
      for (const track of section.data) {
        const t = matchWords(tokens, wordsOf(track.title), [], pass.fuzzy);
        if (ok(t.matched)) {
          result.trackHits.add(track.id);
          if (t.score > best) best = t.score;
        }
      }
      if (best > 0) result.scores.set(section.subcategory, best);
    }
    if (result.scores.size > 0) return result;
  }
  return empty();
}
