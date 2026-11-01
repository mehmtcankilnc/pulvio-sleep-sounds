// node scripts/gen-search-keywords-sql.mjs  ->  supabase/migrations/0024_catalog_search_keywords.sql
// Kaynak: scripts/search-keywords.mjs (kavram sözlüğü) + scripts/taxonomy.mjs (alt kategori listesi).
// Her alt kategori için dil başına anahtar kelime listesi üretir: {"tr": [...], "en": [...], ...}.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SUB_ORDER } from "./taxonomy.mjs";
import { CONCEPTS, SUB_CONCEPTS } from "./search-keywords.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["tr", "en", "de", "fr", "es", "pt"];
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const allSubs = Object.values(SUB_ORDER).flat();
for (const id of allSubs) if (!SUB_CONCEPTS[id]) throw new Error(`SUB_CONCEPTS'te yok: ${id}`);
for (const id of Object.keys(SUB_CONCEPTS)) if (!allSubs.includes(id)) throw new Error(`taksonomide olmayan alt kategori: ${id}`);

const rows = allSubs.map((id) => {
  const all = Object.fromEntries(LANGS.map((l) => [l, []]));
  const primary = Object.fromEntries(LANGS.map((l) => [l, []]));
  SUB_CONCEPTS[id].forEach((entry, index) => {
    const isPrimary = index === 0 || entry.endsWith("!");
    const concept = entry.replace(/!$/, "");
    const def = CONCEPTS[concept];
    if (!def) throw new Error(`${id}: bilinmeyen kavram ${concept}`);
    for (const l of LANGS) {
      for (const word of def[l].split(",").map((w) => w.trim()).filter(Boolean)) {
        if (!all[l].includes(word)) all[l].push(word);
        if (isPrimary && !primary[l].includes(word)) primary[l].push(word);
      }
    }
  });
  return `  (${q(id)}, ${q(JSON.stringify({ all, primary }))}::jsonb)`;
});

const sql = `-- Pulvio — akıllı arama anahtar kelimeleri (OTOMATİK ÜRETİLDİ: node scripts/gen-search-keywords-sql.mjs).
-- Kaynak: scripts/search-keywords.mjs. Elle düzenleme; kaynağı değiştir, yeniden üret.
--
-- Her alt kategorinin dil başına eş anlamlı / ilişkili kelimeleri: {"all": {"tr": [...]}, "primary": {"tr": [...]}}
-- ("primary" = alt kategoriyi tanımlayan kelimeler, aramada etiket gibi öne çıkar). İstemci aramada
-- bunları etiket ve parça başlıklarıyla birlikte tarar ("bebek" yazınca kalp atışı,
-- rahim sesleri, beyaz gürültü… çıkar). Yeni kelime = bir UPDATE, mağaza güncellemesi yok.

alter table public.catalog_subcategories add column if not exists keywords jsonb;

update public.catalog_subcategories s
set keywords = v.keywords
from (values
${rows.join(",\n")}
) as v(id, keywords)
where s.id = v.id;
`;

const out = path.join(root, "supabase/migrations/0024_catalog_search_keywords.sql");
fs.writeFileSync(out, sql);
console.log(`yazıldı: ${out}\n${rows.length} alt kategori`);
