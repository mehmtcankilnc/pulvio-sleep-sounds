// Yeni parça ekleme hattı (mağaza güncellemesi GEREKTİRMEZ).
//
//   node scripts/add-tracks.mjs scripts/batches/dalga1.json --check
//   node scripts/add-tracks.mjs scripts/batches/dalga1.json --upload "<mp3 klasörü>" [--dry]
//   node scripts/add-tracks.mjs scripts/batches/dalga1.json --sql > supabase/migrations/00NN_batch.sql
//
// Batch dosyası = JSON dizi. Her eleman:
//   { "id": 9000001, "subcategory": "vantilator", "title": "Tavan Vantilatörü",
//     "i18n": {"en": "...", "de": "...", "fr": "...", "es": "...", "pt": "..."},
//     "premium": true, "duration": 600,
//     "license": "Original (generated)" | "CC0" | "Pixabay Content License",
//     "sourceUrl": "https://..." }
// id kuralı: Pixabay kendi id'si; üretilmiş 9_000_000+; Freesound 20_000_000 + freesoundId
// (trackTitle.ts / R2 anahtarı sondaki sayısal id'ye bakar -> tüm kaynaklarda benzersiz olmalı).
//
// --sql SADECE ekler (insert ... where not exists); `delete from tracks` YOK,
// favoriler/sleep_schedule bozulmaz. Alt kategori yoksa catalog_subcategories'e
// önce taxonomy.mjs + gen-taxonomy-sql.mjs ile eklenmeli (check bunu doğrular).

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ENTRIES } from "./catalog.mjs";
import { SUB_ORDER } from "./taxonomy.mjs";

// Her yeni parça 1.1.0+ ister: 1.0.0 title_i18n okumaz (yabancı dilde TR başlık görünürdü)
// ve yeni alt kategorileri bilmez. Bu yüzden 1.0.0'a hiçbir yeni parça gösterilmez.
const NEW_CLIENT_VERSION = "1.1.0";
import { loadEnv, assertR2Env, publicUrl, putObject } from "./r2.mjs";

loadEnv();
const LANGS = ["en", "de", "fr", "es", "pt"];
const args = process.argv.slice(2);
const batchPath = args.find((a) => a.endsWith(".json"));
if (!batchPath) {
  console.error("Kullanım: node scripts/add-tracks.mjs <batch.json> --check | --sql | --upload <klasör> [--dry]");
  process.exit(1);
}
const batch = JSON.parse(await readFile(batchPath, "utf8"));

const categoryOf = Object.fromEntries(Object.entries(SUB_ORDER).flatMap(([cat, subs]) => subs.map((s) => [s, cat])));
const takenIds = new Set(ENTRIES.map((e) => e.id));
const errors = [];
const seen = new Set();
for (const t of batch) {
  const where = `#${t.id} ${t.title ?? "?"}`;
  if (!Number.isInteger(t.id)) errors.push(`${where}: id sayısal olmalı`);
  if (takenIds.has(t.id) || seen.has(t.id)) errors.push(`${where}: id çakışıyor`);
  seen.add(t.id);
  if (!categoryOf[t.subcategory]) errors.push(`${where}: bilinmeyen alt kategori '${t.subcategory}' (taxonomy.mjs)`);
  if (!t.title) errors.push(`${where}: TR başlık yok`);
  for (const l of LANGS) if (!t.i18n?.[l]) errors.push(`${where}: i18n.${l} eksik`);
  if (!t.license || !t.sourceUrl) errors.push(`${where}: license/sourceUrl zorunlu`);
  if (!(t.duration > 0)) errors.push(`${where}: duration (sn) eksik`);
  if (t.duration < 180) console.warn(`⚠ ${where}: ${t.duration} sn < 3 dk — loop dikişi duyulabilir`);
}
if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}
const storagePath = (t) => `${t.subcategory}/${t.id}.mp3`;
const key = (t) => `tracks/${storagePath(t)}`;
const esc = (s) => String(s).replace(/'/g, "''");

if (args.includes("--check")) {
  console.log(`✓ ${batch.length} parça geçerli (${new Set(batch.map((t) => t.subcategory)).size} alt kategori).`);
} else if (args.includes("--sql")) {
  const rows = batch.map((t) => {
    const i18n = JSON.stringify(Object.fromEntries(LANGS.map((l) => [l, t.i18n[l]])));
    const url = publicUrl(key(t));
    // Kapak: aynı alt kategorideki mevcut bir parçanın kapağı; yoksa upload-covers.mjs'in
    // R2'ye koyduğu covers/<alt_kategori>.png (kapak henüz yüklenmediyse istemci ikon gösterir).
    return `  ('${esc(t.title)}', '${categoryOf[t.subcategory]}', '${t.subcategory}', ${t.duration}, '${url}', ` +
      `coalesce((select cover_url from public.tracks c where c.subcategory = '${t.subcategory}' and c.cover_url is not null limit 1), '${publicUrl(`covers/${t.subcategory}.png`)}'), ` +
      `${t.premium !== false}, '${esc(t.license)}', '${esc(t.sourceUrl)}', '${esc(i18n)}'::jsonb, ` +
      `'${NEW_CLIENT_VERSION}'` + ")";
  });
  process.stdout.write(
    `-- Pulvio — yeni parça batch'i (${path.basename(batchPath)}). Yalnızca ekler; mevcut satırlara dokunmaz.\n` +
      `insert into public.tracks\n  (title, category, subcategory, duration, storage_url, cover_url, is_premium_only, license_type, source_url, title_i18n, min_client_version)\n` +
      `select v.* from (values\n${rows.join(",\n")}\n) as v(title, category, subcategory, duration, storage_url, cover_url, is_premium_only, license_type, source_url, title_i18n, min_client_version)\n` +
      `where not exists (select 1 from public.tracks x where x.storage_url = v.storage_url);\n`,
  );
} else if (args.includes("--upload")) {
  const dir = args[args.indexOf("--upload") + 1];
  if (!dir || !existsSync(dir)) {
    console.error(`Klasör bulunamadı: ${dir}`);
    process.exit(1);
  }
  const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith(".mp3"));
  const byId = new Map(files.map((f) => [Number(f.match(/(\d+)\.mp3$/i)?.[1]), f]));
  const missing = batch.filter((t) => !byId.has(t.id));
  if (missing.length) {
    console.error(missing.map((t) => `✗ dosya yok: ${t.id} ${t.title}`).join("\n"));
    process.exit(1);
  }
  if (args.includes("--dry")) {
    console.log(`--dry: ${batch.length} dosya eşleşti, yükleme yapılmadı.`);
  } else {
    assertR2Env();
    for (const t of batch) {
      await putObject(key(t), await readFile(path.join(dir, byId.get(t.id))), "audio/mpeg");
      process.stdout.write(`✓ ${key(t)}\n`);
    }
  }
} else {
  console.error("--check, --sql veya --upload gerekli");
  process.exit(1);
}
