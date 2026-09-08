// Pulvio — indirilen Pixabay mp3'lerini Cloudflare R2'ye yükler.
//
// Kullanım:
//   node scripts/upload-audio.mjs "C:\\Users\\mehmt\\Masaüstü\\sounds"
//   node scripts/upload-audio.mjs --sql        # katalog migration'ını stdout'a basar (ağ/secret gerekmez)
//   node scripts/upload-audio.mjs --dry "..."  # yükleme yapmadan eşleşmeyi raporlar
//
// Gerekli ortam değişkenleri (yalnızca gerçek yüklemede — bkz. scripts/r2.mjs):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE
// .env dosyası otomatik okunur.

import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENTRIES, LICENSE_TYPE } from "./catalog.mjs";
import { loadEnv, assertR2Env, publicUrl as r2PublicUrl, putObject } from "./r2.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_PREFIX = "tracks";
const DEFAULT_DIR = "C:\\Users\\mehmt\\Masaüstü\\sounds";

loadEnv();

const args = process.argv.slice(2);
const SQL_ONLY = args.includes("--sql");
const DRY = args.includes("--dry");
const dirArg = args.find((a) => !a.startsWith("--")) || DEFAULT_DIR;

// storagePath = "<subcat>/<id>.mp3"  ->  R2 key "tracks/<subcat>/<id>.mp3"
const publicUrl = (storagePath) => r2PublicUrl(`${KEY_PREFIX}/${storagePath}`);

// ── --sql: migration üret ───────────────────────────────────────────────
if (SQL_ONLY) {
  const esc = (s) => s.replace(/'/g, "''");
  const rows = ENTRIES.map((e) => {
    const su = publicUrl(e.storagePath);
    return `  ('${esc(e.title)}', '${e.category}', '${e.subcategory}', ${e.duration}, '${su}', null, ${e.isPremiumOnly}, '${esc(LICENSE_TYPE)}', '${esc(e.sourceUrl)}')`;
  });
  process.stdout.write(
    `-- Pulvio — gerçek CC0/Pixabay ses kataloğu.\n` +
      `-- Ses dosyaları Cloudflare R2 'pulvio-media' bucket'ına scripts/upload-audio.mjs\n` +
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
assertR2Env();

// music-metadata varsa gerçek süreyi oku (isteğe bağlı)
let parseFile = null;
try {
  ({ parseFile } = await import("music-metadata"));
} catch {
  console.log(`\nℹ music-metadata kurulu değil — süreler catalog.mjs'teki tahminlerle kalır.`);
  console.log(`  Kesin süre için: npm i -D music-metadata\n`);
}

let ok = 0;
let fail = 0;
const durationFixes = [];
for (const { file, entry } of matched) {
  const abs = path.join(dirArg, file);
  const bytes = await readFile(abs);
  const key = `${KEY_PREFIX}/${entry.storagePath}`;
  try {
    await putObject(key, bytes, "audio/mpeg");
  } catch (e) {
    console.log(`✗ ${key}  — ${e.message}`);
    fail++;
    continue;
  }
  ok++;
  process.stdout.write(`✓ ${key}\r`);

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

console.log(`\nSonraki adım: yeni parçalar için katalog migration'ını üret (node scripts/upload-audio.mjs --sql)`);
console.log(`ve Supabase SQL editöründe çalıştır. Mevcut katalog zaten R2 URL'lerini kullanıyor (0021).`);
