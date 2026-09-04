// Pulvio — indirilen Pixabay mp3'lerini Supabase Storage'a yükler.
//
// Kullanım:
//   node scripts/upload-audio.mjs "C:\\Users\\mehmt\\Masaüstü\\sounds"
//   node scripts/upload-audio.mjs --sql        # 0016 migration'ını stdout'a basar (ağ/secret gerekmez)
//   node scripts/upload-audio.mjs --dry "..."  # yükleme yapmadan eşleşmeyi raporlar
//
// Gerekli ortam değişkenleri (yalnızca gerçek yüklemede):
//   SUPABASE_URL                 (yoksa EXPO_PUBLIC_SUPABASE_URL kullanılır)
//   SUPABASE_SERVICE_ROLE_KEY    (Dashboard → Project Settings → API → service_role)
// .env dosyası otomatik okunur.

import { readdir, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRIES, LICENSE_TYPE } from "./catalog.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUCKET = "tracks";
const DEFAULT_DIR = "C:\\Users\\mehmt\\Masaüstü\\sounds";

// ── .env yükle (bağımlılıksız) ───────────────────────────────────────────
function loadEnv() {
  const p = path.join(ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const args = process.argv.slice(2);
const SQL_ONLY = args.includes("--sql");
const DRY = args.includes("--dry");
const dirArg = args.find((a) => !a.startsWith("--")) || DEFAULT_DIR;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const publicUrl = (storagePath) =>
  `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${storagePath}`;

// ── --sql: migration üret ───────────────────────────────────────────────
if (SQL_ONLY) {
  const urlBase = SUPABASE_URL || "https://REPLACE_ME.supabase.co";
  const esc = (s) => s.replace(/'/g, "''");
  const rows = ENTRIES.map((e) => {
    const su = `${urlBase.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${e.storagePath}`;
    return `  ('${esc(e.title)}', '${e.category}', '${e.subcategory}', ${e.duration}, '${su}', null, ${e.isPremiumOnly}, '${esc(LICENSE_TYPE)}', '${esc(e.sourceUrl)}')`;
  });
  process.stdout.write(
    `-- Pulvio — Faz 3: gerçek CC0/Pixabay ses kataloğu.\n` +
      `-- 0004/0005 placeholder seed + 0011 placeholder kapaklarının yerini alır.\n` +
      `-- Ses dosyaları Supabase Storage 'tracks' bucket'ına scripts/upload-audio.mjs\n` +
      `-- ile yüklenir; bu migration yalnızca satırları yazar. cover_url şimdilik null\n` +
      `-- (kategori bazlı görseller sonra üretilecek). Kaynak-of-truth: scripts/catalog.mjs\n\n` +
      `delete from public.tracks;\n\n` +
      `insert into public.tracks\n` +
      `  (title, category, subcategory, duration, storage_url, cover_url, is_premium_only, license_type, source_url)\n` +
      `values\n` +
      rows.join(",\n") +
      `;\n`
  );
  process.exit(0);
}

// ── dosya eşleştir ──────────────────────────────────────────────────────
if (!existsSync(dirArg)) {
  console.error(`Klasör bulunamadı: ${dirArg}`);
  process.exit(1);
}
const byId = new Map(ENTRIES.map((e) => [e.id, e]));
const files = (await readdir(dirArg)).filter((f) => f.toLowerCase().endsWith(".mp3"));

const matched = [];
const unmatched = [];
for (const f of files) {
  const m = f.match(/-(\d+)\.mp3$/i);
  const id = m ? Number(m[1]) : null;
  if (id && byId.has(id)) matched.push({ file: f, entry: byId.get(id) });
  else unmatched.push(f);
}
const missing = ENTRIES.filter((e) => !matched.some((x) => x.entry.id === e.id));

console.log(`Klasör       : ${dirArg}`);
console.log(`mp3 dosyası  : ${files.length}`);
console.log(`Eşleşen      : ${matched.length}/${ENTRIES.length}`);
if (unmatched.length) {
  console.log(`\n⚠ Katalogda olmayan dosyalar (atlanacak):`);
  unmatched.forEach((f) => console.log(`   ${f}`));
}
if (missing.length) {
  console.log(`\n⚠ Katalogda olup klasörde bulunmayan parçalar:`);
  missing.forEach((e) => console.log(`   ${e.id}  ${e.title}  (${e.subcategory})`));
}

if (DRY) {
  console.log(`\n--dry: yükleme yapılmadı.`);
  process.exit(unmatched.length || missing.length ? 1 : 0);
}

// ── yükle ──────────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    `\nSUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tanımlı değil.\n` +
      `.env dosyasına ekle:\n  SUPABASE_SERVICE_ROLE_KEY=...\n`
  );
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// music-metadata varsa gerçek süreyi oku (isteğe bağlı)
let parseFile = null;
try {
  ({ parseFile } = await import("music-metadata"));
} catch {
  console.log(`\nℹ music-metadata kurulu değil — süreler catalog.mjs'teki tahminlerle kalır.`);
  console.log(`  Kesin süre için: npm i -D music-metadata\n`);
}

// bucket'ı garantiye al (public)
const { data: buckets } = await supabase.storage.listBuckets();
if (!buckets?.some((b) => b.name === BUCKET)) {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: ["audio/mpeg"],
    fileSizeLimit: "50MB",
  });
  if (error) {
    console.error(`Bucket oluşturulamadı: ${error.message}`);
    process.exit(1);
  }
  console.log(`Bucket oluşturuldu: ${BUCKET} (public)`);
}

let ok = 0;
let fail = 0;
const durationFixes = [];
for (const { file, entry } of matched) {
  const abs = path.join(dirArg, file);
  const bytes = await readFile(abs);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(entry.storagePath, bytes, { contentType: "audio/mpeg", upsert: true });
  if (error) {
    console.log(`✗ ${entry.storagePath}  — ${error.message}`);
    fail++;
    continue;
  }
  ok++;
  process.stdout.write(`✓ ${entry.storagePath}\r`);

  if (parseFile) {
    try {
      const meta = await parseFile(abs);
      const real = Math.round(meta.format.duration || 0);
      if (real && Math.abs(real - entry.duration) > 3) {
        durationFixes.push({ id: entry.id, title: entry.title, was: entry.duration, real });
      }
    } catch {}
  }
}

console.log(`\n\nYüklendi: ${ok}   Hata: ${fail}`);
console.log(`Örnek public URL: ${publicUrl(matched[0]?.entry.storagePath || "yagmur/337279.mp3")}`);

if (durationFixes.length) {
  console.log(`\nℹ catalog.mjs'teki süreyle >3sn farklı olanlar (istersen elle düzelt):`);
  durationFixes.forEach((d) => console.log(`   ${d.id}  ${d.title}: ${d.was} → ${d.real}`));
}

console.log(`\nSonraki adım: supabase/migrations/0016_real_catalog.sql'i Supabase SQL editöründe çalıştır.`);
