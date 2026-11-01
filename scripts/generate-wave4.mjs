// Dalga 4: ffmpeg ile ÜRETİLMİŞ sesler (lisans riski sıfır) — kar_kis, tir_kamyon, klima,
// soba_radyator, saat, supurge, synth_pad.
//   node scripts/generate-wave4.mjs [çıktı klasörü]   -> mp3'ler + scripts/batches/dalga4.json
// Sonra: node scripts/add-tracks.mjs scripts/batches/dalga4.json --check | --upload <klasör> | --sql
//
// Döngü dikişi (dalga 1 ile aynı): süre tam saniye (600 sn), tonlar tam sayı Hz, modülasyon
// periyotları 600'ün böleni (0,05 / 0,1 / 0,2 Hz, 12 Hz...) -> başlangıç ve bitiş aynı fazda.
// Tik-tak saatleri 600 sn'nin tam katı periyotla çalar (1 sn, 0,8 sn).
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.resolve(process.argv[2] ?? path.join(root, "out", "wave4"));
await mkdir(outDir, { recursive: true });

const L = (en, de, fr, es, pt) => ({ en, de, fr, es, pt });
const DOC = "https://ffmpeg.org/ffmpeg-filters.html";
const DUR = 600;
const LN = "loudnorm=I=-26:TP=-3:LRA=7";
const LN_MUSIC = "loudnorm=I=-24:TP=-3:LRA=9";

const noise = (color, chain, ln = LN) => ({
  inputs: [`anoisesrc=color=${color}:amplitude=0.5:sample_rate=44100:duration=${DUR}`],
  filter: `${chain ? chain + "," : ""}${ln}`,
});
// Birden çok kaynağı (gürültü / sinüs) karıştırır; graph [0:a][1:a]... girdilerini kullanır.
const mix = (inputs, graph) => ({ inputs, graph });
const nz = (color) => `anoisesrc=color=${color}:amplitude=0.5:sample_rate=44100:duration=${DUR}`;
const sn = (f) => `sine=frequency=${f}:sample_rate=44100:duration=${DUR}`;
// Tek bir "tık": kısa, çabuk sönen gürültü patlaması. period sn'de bir; offset sn kaydırma.
const click = (period, offset, decay, seed) =>
  `aevalsrc='lt(mod(t+${offset},${period}),0.02)*(random(${seed})*2-1)*exp(-mod(t+${offset},${period})*${decay})':s=44100:d=${DUR}`;

// Damla katmanları: [periyot sn (600'ü bölmeli), kaydırma sn, başlangıç Hz, yükselme katsayısı].
const drip = (voices) =>
  `aevalsrc='${voices
    .map(([p, o, f, k]) => {
      const x = `mod(t+${o},${p})`;
      return `lt(${x},0.25)*exp(-${x}*28)*sin(2*PI*(${f}*${x}+${k}*${x}*${x}))`;
    })
    .join("+")}':s=44100:d=${DUR}`;

const TRACKS = [
  // kar_kis — rüzgâr (rüzgâr gürültüsü yavaş dalgalanır; tüm periyotlar 600'ü böler)
  { id: 9000018, sub: "kar_kis", title: "Soğuk Kış Rüzgârı", i18n: L("Cold Winter Wind", "Kalter Winterwind", "Vent d'hiver glacial", "Viento frío de invierno", "Vento frio de inverno"), premium: false, ...noise("brown", "highpass=f=120,lowpass=f=900,tremolo=f=0.1:d=0.45,volume='(1-0.3)+0.3*(0.5+0.5*sin(2*PI*t/20))':eval=frame") },
  { id: 9000019, sub: "kar_kis", title: "Tipi", i18n: L("Blizzard", "Schneesturm", "Blizzard", "Ventisca", "Nevasca"), premium: true, ...noise("pink", "highpass=f=200,lowpass=f=2500,tremolo=f=0.2:d=0.5,volume='(1-0.4)+0.4*(0.5+0.5*sin(2*PI*t/20))':eval=frame") },
  // tir_kamyon — kabin uğultusu: düşük motor "thrum" + yol gürültüsü
  { id: 9000020, sub: "tir_kamyon", title: "Kamyon Kabini – Rölanti", i18n: L("Truck Cabin – Idle", "Lkw-Kabine – Leerlauf", "Cabine de camion – Ralenti", "Cabina de camión – Ralentí", "Cabine de caminhão – Marcha lenta"), premium: false,
    ...mix([nz("brown"), sn(24), sn(48)], `[0:a]lowpass=f=300[b];[1:a]volume=0.5,tremolo=f=12:d=0.35[s1];[2:a]volume=0.3[s2];[b][s1][s2]amix=inputs=3:normalize=0,${LN},aformat=channel_layouts=stereo`) },
  { id: 9000021, sub: "tir_kamyon", title: "Otoyolda Tır", i18n: L("Truck on the Highway", "Lkw auf der Autobahn", "Camion sur l'autoroute", "Camión en la autopista", "Caminhão na rodovia"), premium: true,
    ...mix([nz("brown"), nz("pink")], `[0:a]lowpass=f=500[b];[1:a]highpass=f=300,lowpass=f=2000,volume=0.25[r];[b][r]amix=inputs=2:normalize=0,${LN},aformat=channel_layouts=stereo`) },
  // klima
  { id: 9000022, sub: "klima", title: "Klima Uğultusu", i18n: L("Air Conditioner Hum", "Klimaanlagen-Brummen", "Ronronnement de climatiseur", "Zumbido de aire acondicionado", "Zumbido de ar-condicionado"), premium: false, ...noise("pink", "highpass=f=80,lowpass=f=3500") },
  { id: 9000023, sub: "klima", title: "Derin Klima", i18n: L("Deep Air Conditioner", "Tiefe Klimaanlage", "Climatiseur profond", "Aire acondicionado profundo", "Ar-condicionado profundo"), premium: true, ...noise("brown", "lowpass=f=800") },
  // soba_radyator — 50 Hz şebeke uğultusu + sıcak hava hışırtısı
  { id: 9000024, sub: "soba_radyator", title: "Radyatör Uğultusu", i18n: L("Radiator Hum", "Heizkörper-Brummen", "Ronronnement de radiateur", "Zumbido de radiador", "Zumbido de radiador"), premium: false,
    ...mix([sn(50), sn(100), nz("brown")], `[0:a]volume=0.35[h1];[1:a]volume=0.18[h2];[2:a]lowpass=f=400,volume='(1-0.1)+0.1*(0.5+0.5*sin(2*PI*t/20))':eval=frame[n];[h1][h2][n]amix=inputs=3:normalize=0,${LN},aformat=channel_layouts=stereo`) },
  // saat — sentezlenmiş tik-tak (iki ton: tik ve tok)
  { id: 9000025, sub: "saat", title: "Duvar Saati", i18n: L("Wall Clock", "Wanduhr", "Horloge murale", "Reloj de pared", "Relógio de parede"), premium: false,
    ...mix([click(1, 0, 250, 0), click(1, 0.5, 180, 1)], `[0:a]highpass=f=1800,lowpass=f=5000[tik];[1:a]highpass=f=1200,lowpass=f=3500,volume=0.75[tok];[tik][tok]amix=inputs=2:normalize=0,volume=-4dB,aformat=channel_layouts=stereo`) },
  { id: 9000026, sub: "saat", title: "Masa Saati", i18n: L("Desk Clock", "Tischuhr", "Pendulette", "Reloj de mesa", "Relógio de mesa"), premium: true,
    ...mix([click(0.8, 0, 320, 2), click(0.8, 0.4, 260, 3)], `[0:a]highpass=f=2500,lowpass=f=7000[tik];[1:a]highpass=f=2000,lowpass=f=5500,volume=0.8[tok];[tik][tok]amix=inputs=2:normalize=0,volume=-6dB,aformat=channel_layouts=stereo`) },
  // magara_damla — düzensiz aralıklarla (600'ün bölenleri) düşen damlalar + uzun mağara yankısı.
  // Damla = hızla yükselen frekanslı kısa sinüs (x = damlanın başından beri süre).
  { id: 9000031, sub: "magara_damla", title: "Mağara Damlası", i18n: L("Cave Drips", "Tropfsteinhöhle", "Gouttes de grotte", "Goteo de cueva", "Gotas na caverna"), premium: false,
    ...mix([drip([[5, 0, 1400, 3000], [8, 2.3, 1700, 2500], [12, 5.1, 1100, 3500]])], `[0:a]highpass=f=300,lowpass=f=7000,aecho=0.8:0.9:400|700|1100:0.45|0.35|0.25,volume=-12dB,aformat=channel_layouts=stereo`) },
  { id: 9000032, sub: "magara_damla", title: "Derin Mağara", i18n: L("Deep Cave", "Tiefe Höhle", "Grotte profonde", "Cueva profunda", "Caverna profunda"), premium: true,
    ...mix([drip([[6, 0, 800, 1800], [10, 3.7, 1000, 2200], [15, 8.2, 650, 1500]])], `[0:a]highpass=f=200,lowpass=f=5000,aecho=0.8:0.92:500|900|1400:0.5|0.4|0.3,volume=-12dB,aformat=channel_layouts=stereo`) },
  // supurge — motor uğultusu
  { id: 9000027, sub: "supurge", title: "Süpürge Uğultusu", i18n: L("Vacuum Hum", "Staubsauger-Brummen", "Ronronnement d'aspirateur", "Zumbido de aspiradora", "Zumbido de aspirador"), premium: true,
    ...mix([nz("pink"), sn(180)], `[0:a]highpass=f=150,lowpass=f=4500[n];[1:a]volume=0.04[m];[n][m]amix=inputs=2:normalize=0,${LN},aformat=channel_layouts=stereo`) },
  // synth_pad — tam sayı Hz sinüs akorları, yavaş tremolo, hafif yankı (müzik: -24 LUFS)
  { id: 9000028, sub: "synth_pad", title: "Gece Pad'i", i18n: L("Night Pad", "Nacht-Pad", "Pad de nuit", "Pad nocturno", "Pad noturno"), premium: true,
    ...mix([sn(110), sn(165), sn(220), sn(330)], `[0:a]volume='(1-0.25)+0.25*(0.5+0.5*sin(2*PI*t/20))':eval=frame[a];[1:a]tremolo=f=0.1:d=0.2[b];[2:a]tremolo=f=0.2:d=0.15[c];[3:a]volume=0.6,volume='(1-0.3)+0.3*(0.5+0.5*sin(2*PI*t/20))':eval=frame[d];[a][b][c][d]amix=inputs=4:normalize=0,aecho=0.8:0.7:1000|1800:0.35|0.25,${LN_MUSIC},aformat=channel_layouts=stereo`) },
  { id: 9000029, sub: "synth_pad", title: "Derin Pad", i18n: L("Deep Pad", "Tiefer Pad", "Pad profond", "Pad profundo", "Pad profundo"), premium: true,
    ...mix([sn(55), sn(82), sn(110), sn(165)], `[0:a]volume='(1-0.2)+0.2*(0.5+0.5*sin(2*PI*t/20))':eval=frame[a];[1:a]tremolo=f=0.1:d=0.2[b];[2:a]tremolo=f=0.2:d=0.15[c];[3:a]volume=0.5,volume='(1-0.3)+0.3*(0.5+0.5*sin(2*PI*t/20))':eval=frame[d];[a][b][c][d]amix=inputs=4:normalize=0,lowpass=f=600,aecho=0.8:0.7:1200|2000:0.4|0.3,${LN_MUSIC},aformat=channel_layouts=stereo`) },
  { id: 9000030, sub: "synth_pad", title: "Parlak Pad", i18n: L("Bright Pad", "Heller Pad", "Pad lumineux", "Pad brillante", "Pad brilhante"), premium: true,
    ...mix([sn(220), sn(277), sn(330), sn(495)], `[0:a]volume='(1-0.2)+0.2*(0.5+0.5*sin(2*PI*t/20))':eval=frame[a];[1:a]tremolo=f=0.1:d=0.25[b];[2:a]tremolo=f=0.2:d=0.2[c];[3:a]volume=0.5,volume='(1-0.3)+0.3*(0.5+0.5*sin(2*PI*t/20))':eval=frame[d];[a][b][c][d]amix=inputs=4:normalize=0,aecho=0.8:0.7:900|1500:0.35|0.25,${LN_MUSIC},aformat=channel_layouts=stereo`) },
];

const ENC = ["-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100"];
const meta = (t) => ({
  id: t.id,
  subcategory: t.sub,
  title: t.title,
  i18n: t.i18n,
  premium: t.premium,
  duration: DUR,
  license: "Original (generated)",
  sourceUrl: DOC,
});
const batch = [];
// WAVE4_ONLY=9000025-9000026 -> yalnız bu aralığı yeniden üret (batch yine tüm parçaları yazar).
const [lo, hi] = (process.env.WAVE4_ONLY ?? "0-99999999").split("-").map(Number);
for (const t of TRACKS) {
  const file = path.join(outDir, `wave4-${t.id}.mp3`);
  if (t.id < lo || t.id > hi) {
    batch.push(meta(t));
    continue;
  }
  const args = ["-y", "-hide_banner", "-loglevel", "error"];
  for (const i of t.inputs) args.push("-f", "lavfi", "-i", i);
  if (t.graph) args.push("-filter_complex", t.graph);
  else args.push("-af", t.filter, "-ac", "2");
  args.push(...ENC, file);
  process.stdout.write(`… ${t.id} ${t.title}\r`);
  await run("ffmpeg", args, { maxBuffer: 1 << 26 });
  console.log(`✓ ${t.id} ${t.title}   `);
  batch.push(meta(t));
}
await writeFile(path.join(root, "scripts", "batches", "dalga4.json"), JSON.stringify(batch, null, 2) + "\n");
console.log(`\n${batch.length} parça -> ${outDir}\nbatch: scripts/batches/dalga4.json`);
