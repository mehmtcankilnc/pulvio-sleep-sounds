// Pulvio — kategori kapak görsellerini Supabase Storage'a yükler ve
// tracks.cover_url'i alt kategoriye göre toplu günceller.
//
// Kullanım:
//   node scripts/upload-covers.mjs "C:\Users\mehmt\Masaüstü\images"
//   node scripts/upload-covers.mjs --sql   # 0018 migration'ını stdout'a basar
//
// Gerekli ortam değişkenleri (.env'den otomatik okunur):
//   SUPABASE_URL (yoksa EXPO_PUBLIC_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY

import { readdir, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "covers";
const DEFAULT_DIR = "C:\\Users\\mehmt\\Masaüstü\\images";

function loadEnv() {
  const p = path.join(ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const args = process.argv.slice(2);
const SQL_ONLY = args.includes("--sql");
const dirArg = args.find((a) => !a.startsWith("--")) || DEFAULT_DIR;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const publicUrl = (subcat) => `${(SUPABASE_URL || "").replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${subcat}.png`;

if (SQL_ONLY) {
  const rows = SUBCATEGORY_ORDER.map(
    (s) => `update public.tracks set cover_url = '${publicUrl(s)}' where subcategory = '${s}';`
  );
  process.stdout.write(
    `-- Pulvio — kategori kapak görselleri (AI üretimi, docs/COVER_ART_PROMPTS.md).\n` +
      `-- Her alt kategorideki tüm parçalar aynı kapağı paylaşıyor.\n` +
      `-- Storage yükleme: scripts/upload-covers.mjs\n\n` +
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

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(`\nSUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanımlı değil (.env).`);
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: buckets } = await supabase.storage.listBuckets();
if (!buckets?.some((b) => b.name === BUCKET)) {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: ["image/png"],
    fileSizeLimit: "10MB",
  });
  if (error) {
    console.error(`Bucket oluşturulamadı: ${error.message}`);
    process.exit(1);
  }
  console.log(`Bucket oluşturuldu: ${BUCKET} (public)`);
}

let ok = 0;
let fail = 0;
for (const subcat of matched) {
  const abs = path.join(dirArg, bySlug.get(subcat));
  const bytes = await readFile(abs);
  const { error } = await supabase.storage.from(BUCKET).upload(`${subcat}.png`, bytes, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) {
    console.log(`✗ ${subcat}.png — ${error.message}`);
    fail++;
    continue;
  }
  ok++;
  process.stdout.write(`✓ ${subcat}.png\r`);
}
console.log(`\n\nYüklendi: ${ok}   Hata: ${fail}`);
console.log(`Örnek public URL: ${publicUrl(matched[0] ?? "yagmur")}`);
console.log(`\nSonraki adım: node scripts/upload-covers.mjs --sql > supabase/migrations/0018_cover_urls.sql`);
