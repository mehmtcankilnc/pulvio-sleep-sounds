// Dalga 3: Pixabay'dan indirilen parçaları döngüleyip seviye eşitler.
//   node scripts/process-pixabay.mjs <kaynak klasör> [çıktı klasörü]
// Kaynak dosya adı sonunda Pixabay id'si ("...-584737.mp3"). Çıktı: out/wave3/*.mp3 + scripts/batches/dalga3.json.
// Kısa kayıtlar çapraz geçişle art arda eklenip ≥3 dk yapılır; müzik olduğu gibi (yalnız seviye eşitlenir).
import { execFile } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.resolve(process.argv[2] ?? "");
const outDir = path.resolve(process.argv[3] ?? path.join(root, "out", "wave3"));
await mkdir(outDir, { recursive: true });
const files = await readdir(srcDir);
const src = (id) => {
  const f = files.find((n) => n.endsWith(`-${id}.mp3`));
  if (!f) throw new Error(`kaynak yok: ${id}`);
  return path.join(srcDir, f);
};
const L = (en, de, fr, es, pt) => ({ en, de, fr, es, pt });
const ENC = ["-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", "-ac", "2"];
const ff = (args) => run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], { maxBuffer: 1 << 26 });
const LICENSE = "Pixabay Content License";
const px = (p) => `https://pixabay.com/${p}/`;

// n kopyayı d sn çapraz geçişle art arda ekler.
const crossLoop = (n, d) => {
  const split = `[0:a]asplit=${n}${Array.from({ length: n }, (_, i) => `[s${i}]`).join("")}`;
  let chain = "[s0]";
  let g = "";
  for (let i = 1; i < n; i++) {
    g += `${chain}[s${i}]acrossfade=d=${d}[x${i}];`;
    chain = `[x${i}]`;
  }
  return `${split};${g}${chain}`;
};
const LN = "loudnorm=I=-26:TP=-3:LRA=9";
const loop = (n, d = 3, pre = "") => `${crossLoop(n, d)}${pre}${LN},afade=t=in:d=0.5`;
const plain = (pre = "") => `${pre}${LN},afade=t=in:d=0.5`;

const J = [
  // [id, sub, premium, title, i18n, slug, filter]
  [248823, "tibet_kasesi", false, "Tibet Kasesi", L("Singing Bowl", "Klangschale", "Bol tibétain", "Cuenco tibetano", "Tigela tibetana"), "sound-effects/film-special-effects-singing-bowl-248823", plain()],
  [584737, "vantilator", false, "Tavan Vantilatörü", L("Ceiling Fan", "Deckenventilator", "Ventilateur de plafond", "Ventilador de techo", "Ventilador de teto"), "sound-effects/film-special-effects-ceiling-fan-ambience-584737", loop(4)],
  [27155, "vantilator", true, "Vantilatör Uğultusu", L("Fan Hum", "Ventilatorbrummen", "Bourdonnement de ventilateur", "Zumbido de ventilador", "Zumbido de ventilador"), "sound-effects/technology-ceiling-fan-27155", loop(4, 3, "highpass=f=40,")],
  [421047, "cadir_yagmuru", true, "Ormanda Çadır Yağmuru", L("Rain on a Tent in the Forest", "Regen auf dem Zelt im Wald", "Pluie sur la tente en forêt", "Lluvia en la tienda en el bosque", "Chuva na barraca na floresta"), "sound-effects/nature-rain-on-tent-in-forest-421047", plain()],
  [49686, "cadir_yagmuru", false, "Çadır Çatısında Yağmur Damlaları", L("Raindrops on a Tent Roof", "Regentropfen auf dem Zeltdach", "Gouttes de pluie sur le toit de la tente", "Gotas de lluvia en el techo de la tienda", "Gotas de chuva no teto da barraca"), "sound-effects/nature-raindrops-on-tent-roof-49686", plain()],
  [54759, "gemi_feribot", false, "Gemi Motoru", L("Ship Engine", "Schiffsmotor", "Moteur de bateau", "Motor de barco", "Motor de navio"), "sound-effects/city-engine-ship-ambience-54759", loop(3)],
  [20177, "cangirak", false, "Rüzgâr Çanı", L("Wind Chimes", "Windspiel", "Carillons éoliens", "Campanillas de viento", "Sinos de vento"), "sound-effects/nature-wind-chimes-02-20177", loop(3)],
  [191819, "sayfa_cevirme", false, "Sayfa Çevirme", L("Page Turning", "Umblättern", "Pages tournées", "Pasar páginas", "Virar páginas"), "sound-effects/film-special-effects-page-turning-asmr-sound-effect-191819", plain()],
  [587280, "kalimba", true, "Kalimba", L("Kalimba", "Kalimba", "Kalimba", "Kalimba", "Kalimba"), "music/modern-classical-kalimba-587280", `loudnorm=I=-24:TP=-3:LRA=9`],
  [305000, "selale", false, "Cangılda Şelale", L("Waterfall in the Jungle", "Wasserfall im Dschungel", "Cascade dans la jungle", "Cascada en la selva", "Cachoeira na selva"), "sound-effects/nature-waterfall-in-jungle-305000", plain()],
  [145254, "selale", true, "Gür Şelale", L("Powerful Waterfall", "Mächtiger Wasserfall", "Cascade puissante", "Cascada potente", "Cachoeira poderosa"), "sound-effects/nature-sounds-of-a-powerful-waterfall-sounds-of-nature-145254", plain()],
];

const batch = [];
for (const [id, sub, premium, title, i18n, slug, filter] of J) {
  const out = path.join(outDir, `wave3-${id}.mp3`);
  process.stdout.write(`… ${id} ${title}\r`);
  const complex = filter.startsWith("[0:a]");
  await ff(["-i", src(id), ...(complex ? ["-filter_complex", `${filter},aformat=channel_layouts=stereo`] : ["-af", filter]), ...ENC, out]);
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]);
  const duration = Math.round(parseFloat(stdout));
  console.log(`✓ ${id} ${title} (${duration} sn)   `);
  batch.push({ id, subcategory: sub, title, i18n, premium, duration, license: LICENSE, sourceUrl: px(slug) });
}
await writeFile(path.join(root, "scripts", "batches", "dalga3.json"), JSON.stringify(batch, null, 2) + "\n");
console.log(`\n${batch.length} parça -> ${outDir}\nbatch: scripts/batches/dalga3.json`);
