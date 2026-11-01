// Dalga 2: Freesound CC0 kaynaklarını döngüleyip seviye eşitler + CC0'dan türetilmiş "rahim" karışımları.
//   node scripts/process-freesound.mjs <kaynak klasör> [çıktı klasörü]
// Kaynak klasör: Freesound'dan indirilen dosyalar (adı "<freesoundId>__<kullanıcı>__...").
// Çıktı: out/wave2/*.mp3 + scripts/batches/dalga2.json  (id = 20_000_000 + Freesound id; türetilmişler 9_100_000+).
import { execFile } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.resolve(process.argv[2] ?? path.join(root, "out", "freesound-src"));
const outDir = path.resolve(process.argv[3] ?? path.join(root, "out", "wave2"));
await mkdir(outDir, { recursive: true });

const files = await readdir(srcDir);
const src = (fsId) => {
  const f = files.find((n) => n.startsWith(`${fsId}__`));
  if (!f) throw new Error(`kaynak yok: ${fsId}`);
  return path.join(srcDir, f);
};
const L = (en, de, fr, es, pt) => ({ en, de, fr, es, pt });
const FS = (user, id) => `https://freesound.org/people/${user}/sounds/${id}/`;
const ENC = ["-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", "-ac", "2"];
const ff = (args) => run("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], { maxBuffer: 1 << 26 });

// n8daly (Doppler, ~139 bpm): ilk vuruş 0,317 sn, son 4,994 sn = tam 11 aralık (4,677 sn) -> dikişsiz döngü.
const BABY_SEG = path.join(outDir, "_baby-seg.wav");
await ff(["-ss", "0.10", "-t", "4.677", "-i", src(31785), "-af", "lowpass=f=4000", BABY_SEG]);
const BABY_REPEAT = 127; // 128 x 4,677 = 598,7 sn

const crossLoop = (n, d = 2) => {
  // n kopyayı d sn çapraz geçişle art arda ekler (nefesler üst üste binmesin diye sonlar/başlar sessiz).
  const split = `[0:a]asplit=${n}${Array.from({ length: n }, (_, i) => `[s${i}]`).join("")}`;
  let chain = "[s0]";
  let g = "";
  for (let i = 1; i < n; i++) {
    g += `${chain}[s${i}]acrossfade=d=${d}[x${i}];`;
    chain = `[x${i}]`;
  }
  return { split, g, last: chain };
};

const JOBS = [
  {
    id: 20332821, sub: "kalp_atisi", premium: false, duration: 600,
    title: "Kalp Atışı 60 BPM",
    i18n: L("Heartbeat 60 BPM", "Herzschlag 60 BPM", "Battements de cœur 60 BPM", "Latidos 60 BPM", "Batimentos cardíacos 60 BPM"),
    license: "CC0 (Freesound, loudernoises)", sourceUrl: FS("loudernoises", 332821),
    args: ["-stream_loop", "19", "-i", src(332821), "-af", "volume=-9dB", "-t", "600"],
  },
  {
    id: 20332820, sub: "kalp_atisi", premium: true, duration: 600,
    title: "Kalp Atışı 80 BPM",
    i18n: L("Heartbeat 80 BPM", "Herzschlag 80 BPM", "Battements de cœur 80 BPM", "Latidos 80 BPM", "Batimentos cardíacos 80 BPM"),
    license: "CC0 (Freesound, loudernoises)", sourceUrl: FS("loudernoises", 332820),
    args: ["-stream_loop", "19", "-i", src(332820), "-af", "volume=-9dB", "-t", "600"],
  },
  {
    id: 20031785, sub: "kalp_atisi", premium: true, duration: 599,
    title: "Bebeğin Kalp Atışı",
    i18n: L("Baby's Heartbeat", "Herzschlag des Babys", "Cœur du bébé", "Latidos del bebé", "Coração do bebê"),
    license: "CC0 (Freesound, n8daly)", sourceUrl: FS("n8daly", 31785),
    args: ["-stream_loop", String(BABY_REPEAT), "-i", BABY_SEG, "-af", "volume=-14dB"],
  },
  {
    // Rahim: bebeğin kalbi (CC0) boğuklaştırılmış + bizim ürettiğimiz sıvı/kan akışı uğultusu (kahverengi gürültü).
    id: 9100001, sub: "rahim", premium: false, duration: 599,
    title: "Rahim Sesi (Bebeğin Kalbi)",
    i18n: L("Womb Sound (Baby's Heart)", "Mutterleib-Klang (Babyherz)", "Son utérin (cœur du bébé)", "Sonido del vientre (corazón del bebé)", "Som do útero (coração do bebê)"),
    license: "CC0 derivative (Freesound n8daly 31785) + generated", sourceUrl: FS("n8daly", 31785),
    args: ["-stream_loop", String(BABY_REPEAT), "-i", BABY_SEG, "-f", "lavfi", "-i", "anoisesrc=color=brown:amplitude=0.5:sample_rate=44100:duration=599",
      "-filter_complex", "[0:a]lowpass=f=800,volume=-13dB[h];[1:a]lowpass=f=500,tremolo=f=0.12:d=0.25,volume=-4dB[n];[h][n]amix=inputs=2:normalize=0:duration=shortest,volume=-6dB,aformat=channel_layouts=stereo",
      "-t", "599"],
  },
  {
    id: 9100002, sub: "rahim", premium: true, duration: 600,
    title: "Rahim Sesi (Annenin Kalbi)",
    i18n: L("Womb Sound (Mother's Heart)", "Mutterleib-Klang (Mutterherz)", "Son utérin (cœur de la mère)", "Sonido del vientre (corazón de la madre)", "Som do útero (coração da mãe)"),
    license: "CC0 derivative (Freesound loudernoises 332821) + generated", sourceUrl: FS("loudernoises", 332821),
    args: ["-stream_loop", "19", "-i", src(332821), "-f", "lavfi", "-i", "anoisesrc=color=brown:amplitude=0.5:sample_rate=44100:duration=600",
      "-filter_complex", "[0:a]lowpass=f=170,volume=-6dB[h];[1:a]lowpass=f=450,tremolo=f=0.1:d=0.2,volume=-3dB[n];[h][n]amix=inputs=2:normalize=0:duration=shortest,volume=-6dB,aformat=channel_layouts=stereo",
      "-t", "600"],
  },
];

// Nefes kayıtları (insan sesi/konuşma yok; yalnızca nefes). Arka plan gürültüsü hafif bastırılır, seviye eşitlenir.
for (const [fsId, user, sub, premium, title, i18n, copies, nr] of [
  [485402, "helenavelikaja", "nefes", false, "Sakin Nefes", L("Calm Breathing", "Ruhiges Atmen", "Respiration calme", "Respiración tranquila", "Respiração calma"), 4, true],
  [387620, "mlitty", "nefes", true, "Derin Nefes", L("Deep Breathing", "Tiefes Atmen", "Respiration profonde", "Respiración profunda", "Respiração profunda"), 3, false],
]) {
  const x = crossLoop(copies);
  const pre = nr ? "highpass=f=70,afftdn=nr=14:nf=-45," : "highpass=f=60,";
  JOBS.push({
    id: 20_000_000 + fsId, sub, premium, title, i18n,
    duration: 0, // aşağıda ffprobe ile doldurulur
    license: `CC0 (Freesound, ${user})`, sourceUrl: FS(user, fsId),
    args: ["-i", src(fsId), "-filter_complex",
      `${x.split};${x.g}${x.last}${pre}loudnorm=I=-26:TP=-3:LRA=11,afade=t=in:d=0.5,areverse,afade=t=in:d=0.5,areverse,aformat=channel_layouts=stereo`],
  });
}

const batch = [];
for (const j of JOBS) {
  const out = path.join(outDir, `wave2-${j.id}.mp3`);
  process.stdout.write(`… ${j.id} ${j.title}\r`);
  await ff([...j.args, ...ENC, out]);
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]);
  const dur = Math.round(parseFloat(stdout));
  console.log(`✓ ${j.id} ${j.title} (${dur} sn)   `);
  batch.push({ id: j.id, subcategory: j.sub, title: j.title, i18n: j.i18n, premium: j.premium, duration: dur, license: j.license, sourceUrl: j.sourceUrl });
}
await writeFile(path.join(root, "scripts", "batches", "dalga2.json"), JSON.stringify(batch, null, 2) + "\n");
console.log(`\n${batch.length} parça -> ${outDir}\nbatch: scripts/batches/dalga2.json`);
