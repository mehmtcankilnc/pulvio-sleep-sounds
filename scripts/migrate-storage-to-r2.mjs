// Pulvio — mevcut ses + kapak dosyalarını Supabase Storage'dan Cloudflare R2'ye
// TEK SEFERLİK kopyalar. Canlı `tracks` tablosunu okur (public read, anon key
// yeterli), her storage_url / cover_url'ü mevcut public URL'den indirir ve R2'ye
// AYNI key ile yükler. Yeniden çalıştırılabilir: R2'de zaten olanı atlar.
//
// Kullanım:
//   node scripts/migrate-storage-to-r2.mjs --dry   # ne yapılacağını raporlar
//   node scripts/migrate-storage-to-r2.mjs         # gerçek kopyalama
//
// Gerekli .env değişkenleri:
//   EXPO_PUBLIC_SUPABASE_URL         (veya SUPABASE_URL)
//   EXPO_PUBLIC_SUPABASE_ANON_KEY    (veya SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY)
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE
//
// Bağımlılık: @aws-sdk/client-s3, @supabase/supabase-js

import { loadEnv, assertR2Env, publicUrl, putObject, objectExists } from "./r2.mjs";

loadEnv();

const DRY = process.argv.includes("--dry");

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY tanımlı değil (.env).");
  process.exit(1);
}
if (!DRY) assertR2Env();

// storage_url -> R2 key: ".../storage/v1/object/public/<key>" içinden <key>.
const PUBLIC_MARKER = "/storage/v1/object/public/";
function toKey(url) {
  if (!url) return null;
  const i = url.indexOf(PUBLIC_MARKER);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + PUBLIC_MARKER.length));
}

const { createClient } = await import("@supabase/supabase-js");
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: rows, error } = await supabase
  .from("tracks")
  .select("id, storage_url, cover_url");
if (error) {
  console.error("tracks okunamadı:", error.message);
  process.exit(1);
}

// Benzersiz (url, key, contentType) işleri topla — kapaklar alt kategori başına
// paylaşıldığı için cover_url'ler tekrar eder.
const jobs = new Map();
for (const r of rows) {
  for (const url of [r.storage_url, r.cover_url]) {
    const key = toKey(url);
    if (!key || jobs.has(key)) continue;
    const ext = key.split(".").pop().toLowerCase();
    const contentType =
      ext === "mp3" ? "audio/mpeg" : ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "application/octet-stream";
    jobs.set(key, { url, key, contentType });
  }
}

console.log(`tracks satırı : ${rows.length}`);
console.log(`kopyalanacak  : ${jobs.size} benzersiz dosya`);
console.log(`hedef         : ${publicUrl("<key>")}\n`);

if (DRY) {
  for (const { key } of jobs.values()) console.log(`  ${key}`);
  console.log(`\n--dry: kopyalama yapılmadı.`);
  process.exit(0);
}

let ok = 0;
let skip = 0;
let fail = 0;
for (const { url, key, contentType } of jobs.values()) {
  try {
    if (await objectExists(key)) {
      skip++;
      process.stdout.write(`= ${key} (mevcut)\r`);
      continue;
    }
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`✗ ${key} — indirilemedi (HTTP ${res.status})`);
      fail++;
      continue;
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    await putObject(key, bytes, contentType);
    ok++;
    process.stdout.write(`✓ ${key}                    \r`);
  } catch (e) {
    console.log(`✗ ${key} — ${e.message}`);
    fail++;
  }
}

console.log(`\n\nYüklendi: ${ok}   Atlandı: ${skip}   Hata: ${fail}`);
console.log(
  fail === 0
    ? `\nSonraki adım: R2'de birkaç URL'i doğrula, sonra supabase/migrations/0021_media_cdn_urls.sql'i çalıştır.`
    : `\n⚠ Hatalar var — 0021 migration'ını ÇALIŞTIRMA, önce düzelt.`
);
process.exit(fail === 0 ? 0 : 1);
