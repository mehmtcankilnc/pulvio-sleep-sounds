// Dalga 1: ffmpeg ile ÜRETİLMİŞ sesler (lisans riski sıfır, insan sesi yok).
//   node scripts/generate-wave1.mjs [çıktı klasörü]   -> mp3'ler + scripts/batches/dalga1.json
// Sonra: node scripts/add-tracks.mjs scripts/batches/dalga1.json --check | --upload <klasör> | --sql
//
// Döngü dikişi: süreler tam saniye, tonlar tam sayı Hz -> faz sürekli; nefes
// ritimleri döngü periyodunun katı süre. Gürültüler durağan, dikiş duyulmaz.
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(process.argv[2] ?? path.join(root, "out", "wave1"));
await mkdir(outDir, { recursive: true });

const L = (en, de, fr, es, pt) => ({ en, de, fr, es, pt });
const DOC = "https://ffmpeg.org/ffmpeg-filters.html";
const DUR = 600;

const noise = (color, chain) => ({
  inputs: [`anoisesrc=color=${color}:amplitude=0.5:sample_rate=44100:duration=${DUR}`],
  filter: `${chain ? chain + "," : ""}loudnorm=I=-26:TP=-3:LRA=7`,
});
const sines = (freqs, graph) => ({
  inputs: freqs.map((f) => `sine=frequency=${f}:sample_rate=44100:duration=${DUR}`),
  graph,
});
// Nefes REHBERİ: iki yumuşak akor (alçak A2+E3, tiz A3+E4) arasında çapraz geçiş. Nefes alırken tize
// doğru yükselir ve dolar, tutarken sabit kalır, verirken alçalır. Gürültü zarfı nefese benzemiyordu.
const breath = (w, seconds) => ({
  inputs: [110, 165, 220, 330].map((f) => `sine=frequency=${f}:sample_rate=44100:duration=${seconds}`),
  graph:
    `[0:a][1:a]amix=inputs=2:normalize=0[lo];[2:a][3:a]amix=inputs=2:normalize=0[hi];` +
    `[lo]volume='(1-(${w}))*(0.55+0.45*(${w}))':eval=frame[l2];` +
    `[hi]volume='(${w})*(0.55+0.45*(${w}))':eval=frame[h2];` +
    `[l2][h2]amix=inputs=2:normalize=0,volume=-7dB,aformat=channel_layouts=stereo`,
  seconds,
});

const TRACKS = [
  // beyaz_gurultu
  { id: 9000001, sub: "beyaz_gurultu", title: "Saf Beyaz Gürültü", i18n: L("Pure White Noise", "Reines weißes Rauschen", "Bruit blanc pur", "Ruido blanco puro", "Ruído branco puro"), premium: true, ...noise("white") },
  { id: 9000002, sub: "beyaz_gurultu", title: "Yumuşak Beyaz Gürültü", i18n: L("Soft White Noise", "Weiches weißes Rauschen", "Bruit blanc doux", "Ruido blanco suave", "Ruído branco suave"), premium: true, ...noise("white", "lowpass=f=6000") },
  { id: 9000003, sub: "beyaz_gurultu", title: "Derin Beyaz Gürültü", i18n: L("Deep White Noise", "Tiefes weißes Rauschen", "Bruit blanc profond", "Ruido blanco profundo", "Ruído branco profundo"), premium: true, ...noise("white", "lowpass=f=3000") },
  // pembe_gurultu
  { id: 9000004, sub: "pembe_gurultu", title: "Saf Pembe Gürültü", i18n: L("Pure Pink Noise", "Reines rosa Rauschen", "Bruit rose pur", "Ruido rosa puro", "Ruído rosa puro"), premium: true, ...noise("pink") },
  { id: 9000005, sub: "pembe_gurultu", title: "Yumuşak Pembe Gürültü", i18n: L("Soft Pink Noise", "Weiches rosa Rauschen", "Bruit rose doux", "Ruido rosa suave", "Ruído rosa suave"), premium: true, ...noise("pink", "lowpass=f=5000") },
  { id: 9000006, sub: "pembe_gurultu", title: "Yeşil Gürültü", i18n: L("Green Noise", "Grünes Rauschen", "Bruit vert", "Ruido verde", "Ruído verde"), premium: true, ...noise("pink", "highpass=f=120,lowpass=f=1800") },
  // kahverengi_gurultu
  { id: 9000007, sub: "kahverengi_gurultu", title: "Saf Kahverengi Gürültü", i18n: L("Pure Brown Noise", "Reines braunes Rauschen", "Bruit brun pur", "Ruido marrón puro", "Ruído marrom puro"), premium: true, ...noise("brown") },
  { id: 9000008, sub: "kahverengi_gurultu", title: "Derin Kahverengi Gürültü", i18n: L("Deep Brown Noise", "Tiefes braunes Rauschen", "Bruit brun profond", "Ruido marrón profundo", "Ruído marrom profundo"), premium: true, ...noise("brown", "lowpass=f=400") },
  { id: 9000009, sub: "kahverengi_gurultu", title: "Yumuşak Kahverengi Gürültü", i18n: L("Soft Brown Noise", "Weiches braunes Rauschen", "Bruit brun doux", "Ruido marrón suave", "Ruído marrom suave"), premium: true, ...noise("brown", "lowpass=f=1200") },
  // binaural (sol/sağ kulak farklı frekans -> fark = vuru frekansı)
  { id: 9000010, sub: "binaural", title: "Delta 2 Hz (Kulaklık)", i18n: L("Delta 2 Hz (Headphones)", "Delta 2 Hz (Kopfhörer)", "Delta 2 Hz (Casque)", "Delta 2 Hz (Auriculares)", "Delta 2 Hz (Fones de ouvido)"), premium: false, ...sines([150, 152], "[0:a][1:a]amerge=inputs=2,volume=-7dB") },
  { id: 9000011, sub: "binaural", title: "Delta 3 Hz (Kulaklık)", i18n: L("Delta 3 Hz (Headphones)", "Delta 3 Hz (Kopfhörer)", "Delta 3 Hz (Casque)", "Delta 3 Hz (Auriculares)", "Delta 3 Hz (Fones de ouvido)"), premium: true, ...sines([150, 153], "[0:a][1:a]amerge=inputs=2,volume=-7dB") },
  { id: 9000012, sub: "binaural", title: "Teta 5 Hz (Kulaklık)", i18n: L("Theta 5 Hz (Headphones)", "Theta 5 Hz (Kopfhörer)", "Thêta 5 Hz (Casque)", "Theta 5 Hz (Auriculares)", "Teta 5 Hz (Fones de ouvido)"), premium: true, ...sines([150, 155], "[0:a][1:a]amerge=inputs=2,volume=-7dB") },
  // izokronik (kulaklıksız darbeli ton)
  { id: 9000013, sub: "izokronik", title: "İzokronik 2 Hz", i18n: L("Isochronic 2 Hz", "Isochron 2 Hz", "Isochrone 2 Hz", "Isocrónico 2 Hz", "Isocrônico 2 Hz"), premium: false, ...sines([200], "[0:a]tremolo=f=2:d=1,volume=-5dB,aformat=channel_layouts=stereo") },
  { id: 9000014, sub: "izokronik", title: "İzokronik 4 Hz", i18n: L("Isochronic 4 Hz", "Isochron 4 Hz", "Isochrone 4 Hz", "Isocrónico 4 Hz", "Isocrônico 4 Hz"), premium: true, ...sines([200], "[0:a]tremolo=f=4:d=1,volume=-5dB,aformat=channel_layouts=stereo") },
  // solfeggio (sağlık iddiası YOK; yalnızca ton)
  { id: 9000015, sub: "solfeggio", title: "174 Hz Ton", i18n: L("174 Hz Tone", "174-Hz-Ton", "Tonalité 174 Hz", "Tono de 174 Hz", "Tom de 174 Hz"), premium: false, ...sines([174, 348], "[0:a][1:a]amix=inputs=2:weights=1 0.25:normalize=0,tremolo=f=0.1:d=0.3,volume=-7dB,aformat=channel_layouts=stereo") },
  { id: 9000016, sub: "solfeggio", title: "396 Hz Ton", i18n: L("396 Hz Tone", "396-Hz-Ton", "Tonalité 396 Hz", "Tono de 396 Hz", "Tom de 396 Hz"), premium: true, ...sines([396, 792], "[0:a][1:a]amix=inputs=2:weights=1 0.25:normalize=0,tremolo=f=0.1:d=0.3,volume=-7dB,aformat=channel_layouts=stereo") },
  { id: 9000017, sub: "solfeggio", title: "528 Hz Ton", i18n: L("528 Hz Tone", "528-Hz-Ton", "Tonalité 528 Hz", "Tono de 528 Hz", "Tom de 528 Hz"), premium: true, ...sines([528, 1056], "[0:a][1:a]amix=inputs=2:weights=1 0.25:normalize=0,tremolo=f=0.1:d=0.3,volume=-7dB,aformat=channel_layouts=stereo") },
  // nefes (insan sesi yok: filtrelenmiş gürültü zarfı; 608 sn = periyodun tam katı)
];

const ENC = ["-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100"];
const meta = (t) => ({
  id: t.id,
  subcategory: t.sub,
  title: t.title,
  i18n: t.i18n,
  premium: t.premium,
  duration: t.seconds ?? DUR,
  license: "Original (generated)",
  sourceUrl: DOC,
});
const batch = [];
for (const t of TRACKS) {
  const file = path.join(outDir, `wave1-${t.id}.mp3`);
  // WAVE1_ONLY=9000010-9000017 -> yalnız bu aralığı yeniden üret (batch yine tüm parçaları yazar).
  const [lo, hi] = (process.env.WAVE1_ONLY ?? "0-99999999").split("-").map(Number);
  const selected = t.id >= lo && t.id <= hi;
  const args = ["-y", "-hide_banner", "-loglevel", "error"];
  if (!selected) {
    batch.push(meta(t));
    continue;
  }
  for (const i of t.inputs) args.push("-f", "lavfi", "-i", i);
  if (t.graph) args.push("-filter_complex", t.graph);
  else args.push("-af", t.filter, "-ac", "2");
  args.push(...ENC, file);
  process.stdout.write(`… ${t.id} ${t.title}\r`);
  await run("ffmpeg", args, { maxBuffer: 1 << 26 });
  console.log(`✓ ${t.id} ${t.title}   `);
  batch.push(meta(t));
}
await writeFile(path.join(root, "scripts", "batches", "dalga1.json"), JSON.stringify(batch, null, 2) + "\n");
console.log(`\n${batch.length} parça -> ${outDir}\nbatch: scripts/batches/dalga1.json`);
