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
import { loadEnv, assertR2Env, publicUrl as r2PublicUrl, putObject } from "./r2.mjs";

// Mirrors src/lib/catalogTaxonomy.ts's SUBCATEGORY_ORDER — duplicated as a
// plain JS array because this script runs under Node directly (no TS
// loader), same reason scripts/catalog.mjs doesn't import from src/.
const SUBCATEGORY_ORDER = [
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
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PREFIX = "covers";
const DEFAULT_DIR = "C:\\Users\\mehmt\\Masaüstü\\images";

loadEnv();

const args = process.argv.slice(2);
const SQL_ONLY = args.includes("--sql");
const dirArg = args.find((a) => !a.startsWith("--")) || DEFAULT_DIR;

// R2 key "covers/<subcat>.png"
const publicUrl = (subcat) => r2PublicUrl(`${KEY_PREFIX}/${subcat}.png`);

if (SQL_ONLY) {
  const rows = SUBCATEGORY_ORDER.map(
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
