// Pulvio — kategori kapak görsellerini Cloudflare R2'ye yükler ve
// tracks.cover_url'i alt kategoriye göre toplu günceller.
//
// Kullanım:
//   node scripts/upload-covers.mjs "C:\Users\mehmt\Masaüstü\images"
//   node scripts/upload-covers.mjs --sql   # cover_url migration'ını stdout'a basar
//
// Gerekli ortam değişkenleri (.env'den otomatik okunur — bkz. scripts/r2.mjs):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SUB_ORDER } from "./taxonomy.mjs";
import { loadEnv, assertR2Env, publicUrl as r2PublicUrl, putObject } from "./r2.mjs";

// Alt kategori listesi scripts/taxonomy.mjs'ten (tek kaynak): mevcut 23 + v1.1'de eklenen alt kategoriler.
// Eskiden elle kopyalanmış bir dizi vardı; yeni slug'lar için güncelleme unutulmasın diye kaldırıldı.
const SUBCATEGORY_ORDER = Object.values(SUB_ORDER).flat();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PREFIX = "covers";
const DEFAULT_DIR = "C:\\Users\\mehmt\\Masaüstü\\images";

loadEnv();

const args = process.argv.slice(2);
const SQL_ONLY = args.includes("--sql");
const dirArg = args.find((a) => !a.startsWith("--")) || DEFAULT_DIR;
// --only=a,b,c : --sql yalnızca bu alt kategoriler için üretilir (kapağı henüz olmayanlara dokunma).
const onlyArg = args.find((a) => a.startsWith("--only="));
const ONLY = onlyArg ? onlyArg.slice("--only=".length).split(",").filter(Boolean) : null;

// R2 key "covers/<subcat>.png"
const publicUrl = (subcat) => r2PublicUrl(`${KEY_PREFIX}/${subcat}.png`);

if (SQL_ONLY) {
  const unknown = (ONLY ?? []).filter((x) => !SUBCATEGORY_ORDER.includes(x));
  if (unknown.length) {
    console.error(`Bilinmeyen alt kategori: ${unknown.join(", ")}`);
    process.exit(1);
  }
  const rows = (ONLY ?? SUBCATEGORY_ORDER).map(
    (s) => `update public.tracks set cover_url = '${publicUrl(s)}' where subcategory = '${s}';`
  );
  process.stdout.write(
    `-- Pulvio — kategori kapak görselleri (AI üretimi, docs/COVER_ART_PROMPTS.md).\n` +
      `-- Her alt kategorideki tüm parçalar aynı kapağı paylaşıyor.\n` +
      `-- R2 yükleme: scripts/upload-covers.mjs\n\n` +
      rows.join("\n") +
      "\n"
  );
  process.exit(0);
}

if (!existsSync(dirArg)) {
  console.error(`Klasör bulunamadı: ${dirArg}`);
  process.exit(1);
}
const files = (await readdir(dirArg)).filter((f) => /\.png$/i.test(f));
const bySlug = new Map(files.map((f) => [f.replace(/\.png$/i, ""), f]));

const matched = SUBCATEGORY_ORDER.filter((s) => bySlug.has(s));
const missing = SUBCATEGORY_ORDER.filter((s) => !bySlug.has(s));
const extra = [...bySlug.keys()].filter((s) => !SUBCATEGORY_ORDER.includes(s));

console.log(`Klasör   : ${dirArg}`);
console.log(`Eşleşen  : ${matched.length}/${SUBCATEGORY_ORDER.length}`);
if (missing.length) console.log(`Eksik    : ${missing.join(", ")}`);
if (extra.length) console.log(`Fazladan : ${extra.join(", ")}`);

assertR2Env();

let ok = 0;
let fail = 0;
for (const subcat of matched) {
  const abs = path.join(dirArg, bySlug.get(subcat));
  const bytes = await readFile(abs);
  const key = `${KEY_PREFIX}/${subcat}.png`;
  try {
    await putObject(key, bytes, "image/png");
  } catch (e) {
    console.log(`✗ ${key} — ${e.message}`);
    fail++;
    continue;
  }
  ok++;
  process.stdout.write(`✓ ${key}\r`);
}
console.log(`\n\nYüklendi: ${ok}   Hata: ${fail}`);
console.log(`Örnek public URL: ${publicUrl(matched[0] ?? "yagmur")}`);
console.log(`\nSonraki adım: node scripts/upload-covers.mjs --sql | Supabase SQL editöründe çalıştır.`);
