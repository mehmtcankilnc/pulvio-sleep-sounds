// Kategori kapaklarının küçük WebP önizlemelerini üretip R2'ye yükler.
//   node scripts/make-cover-thumbs.mjs            # 61 alt kategorinin hepsi
//   node scripts/make-cover-thumbs.mjs selale,nefes  # yalnız verilenler
//
// Neden: kutular ~160x112 dp gösterir ama kapaklar 1254x1254 PNG (~2 MB). Kategori
// ekranı 61 kapağı birden çekince yavaştı. Önizleme: 480x480 WebP (~20-40 KB, ~60-100x küçük).
// Kaynak CDN'deki covers/<slug>.png (upload-covers.mjs yükler); çıktı covers/t/<slug>.webp.
// İstemci (src/lib/coverThumb.ts) kapak URL'sini bu yola çevirir; yoksa orijinale düşer.
// Yeni kapak yüklerken önce upload-covers.mjs, sonra bu betik çalıştırılır.
import { spawn } from "node:child_process";
import { SUB_ORDER } from "./taxonomy.mjs";
import { loadEnv, assertR2Env, publicUrl, putObject } from "./r2.mjs";

loadEnv();
assertR2Env();
const only = process.argv[2]?.split(",").filter(Boolean);
const slugs = only ?? Object.values(SUB_ORDER).flat();
const SIZE = 480;

// PNG baytlarını ffmpeg'e stdin'den verip WebP baytlarını stdout'tan alır.
const toWebp = (png) =>
  new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-i", "pipe:0",
      "-vf", `scale=${SIZE}:${SIZE}:flags=lanczos`,
      "-c:v", "libwebp", "-quality", "78", "-f", "webp", "pipe:1",
    ]);
    const chunks = [];
    p.stdout.on("data", (c) => chunks.push(c));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(`ffmpeg çıkış kodu ${code}`))));
    p.stdin.end(png);
  });

let ok = 0;
let total = 0;
for (const slug of slugs) {
  const res = await fetch(publicUrl(`covers/${slug}.png`));
  if (!res.ok) {
    console.error(`✗ ${slug}: kapak CDN'de yok (${res.status})`);
    continue;
  }
  const png = Buffer.from(await res.arrayBuffer());
  const webp = await toWebp(png);
  await putObject(`covers/t/${slug}.webp`, webp, "image/webp");
  ok++;
  total += webp.length;
  console.log(`✓ covers/t/${slug}.webp  ${(png.length / 1024).toFixed(0)} KB -> ${(webp.length / 1024).toFixed(0)} KB`);
}
console.log(`\n${ok}/${slugs.length} önizleme yüklendi, toplam ${(total / 1024).toFixed(0)} KB`);
