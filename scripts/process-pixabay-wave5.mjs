// Dalga 5: Pixabay'den indirilen 36 parçayı seviye eşitler / kısa kayıtları döngüler.
//   node scripts/process-pixabay-wave5.mjs <kaynak klasör> [çıktı klasörü]
// Kaynak dosya adı sonunda Pixabay id'si ("...-584737.mp3"). Çıktı: out/wave5/*.mp3 + scripts/batches/dalga5.json.
// Efekt sesleri -26 LUFS; müzik -24 LUFS ve olduğu gibi (döngülenmez). Kısa efektler
// çapraz geçişle art arda eklenip ≥3 dk yapılır.
import { execFile } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.resolve(process.argv[2] ?? "");
const outDir = path.resolve(process.argv[3] ?? path.join(root, "out", "wave5"));
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
const LN_MUSIC = "loudnorm=I=-24:TP=-3:LRA=9";
const loop = (n, d = 2, pre = "") => `${crossLoop(n, d)}${pre}${LN},afade=t=in:d=0.5`;
const plain = (pre = "") => `${pre}${LN},afade=t=in:d=0.5`;
const music = () => `${LN_MUSIC},afade=t=in:d=0.5`;

const J = [
  // [id, sub, premium, title, i18n, pixabay path, filter]
  // sehir_yagmuru
  [53170, "sehir_yagmuru", false, "Şehirde Yağmur", L("Rain on the City", "Regen auf der Stadt", "Pluie sur la ville", "Lluvia sobre la ciudad", "Chuva sobre a cidade"), "sound-effects/city-001867-rain-on-city-deck-53170", plain()],
  [309504, "sehir_yagmuru", true, "Yapraklara Yağmur", L("Rain on Leaves", "Regen auf Blättern", "Pluie sur les feuilles", "Lluvia sobre las hojas", "Chuva nas folhas"), "sound-effects/nature-rain-on-leaves-309504", plain()],
  // yagmur_ormani
  [18097, "yagmur_ormani", false, "Hawaii'de Kuşlar ve Hafif Yağmur", L("Hawaiian Birds and Soft Rain", "Hawaii-Vögel und sanfter Regen", "Oiseaux d'Hawaï et pluie douce", "Aves de Hawái y lluvia suave", "Pássaros do Havaí e chuva suave"), "sound-effects/nature-hawaii-birds-and-soft-rain-field-recording-18097", plain()],
  [339096, "yagmur_ormani", true, "Cangıl Ambiyansı", L("Jungle Ambience", "Dschungel-Atmosphäre", "Ambiance de jungle", "Ambiente de selva", "Ambiente de selva"), "sound-effects/nature-jungle-ambience-339096", plain()],
  [111405, "yagmur_ormani", true, "Ormanda Yağmur ve Kuşlar", L("Rain in the Forest with Birds", "Regen im Wald mit Vögeln", "Pluie en forêt avec oiseaux", "Lluvia en el bosque con pájaros", "Chuva na floresta com pássaros"), "sound-effects/rain-in-forest-birds-nature-111405", plain()],
  // gol_kiyisi
  [176820, "gol_kiyisi", false, "Akşam Göl Suyu", L("Evening Lake Water", "Abendliches Seewasser", "Eau du lac au soir", "Agua del lago al atardecer", "Água do lago ao entardecer"), "sound-effects/nature-relaxing-amp-calming-evening-lake-water-176820", plain()],
  [19106, "gol_kiyisi", true, "Almere Gölü", L("Lake in Almere", "See in Almere", "Lac d'Almere", "Lago en Almere", "Lago em Almere"), "sound-effects/nature-lake-in-almere-19106", plain()],
  [50230, "gol_kiyisi", true, "Gece Küçük Göl", L("Small Lake at Night", "Kleiner See bei Nacht", "Petit lac la nuit", "Pequeño lago de noche", "Pequeno lago à noite"), "sound-effects/nature-small-lake-at-night-50230", plain()],
  [60110, "gol_kiyisi", true, "Fritton Gölü", L("Fritton Lake", "Fritton Lake", "Lac de Fritton", "Lago Fritton", "Lago Fritton"), "sound-effects/nature-000578-180905-fritton-lake-60110", plain()],
  // kurbaga_golet
  [48410, "kurbaga_golet", false, "Kurbağalar", L("Frogs", "Frösche", "Grenouilles", "Ranas", "Sapos"), "sound-effects/nature-frogs-48410", plain()],
  // damla
  [269871, "damla", false, "Damlayan Su", L("Dripping Water", "Tropfendes Wasser", "Eau qui goutte", "Agua goteando", "Água pingando"), "sound-effects/film-special-effects-dripping-water-one-minute-269871", loop(4)],
  [281292, "damla", true, "Su Damlaları", L("Water Drops", "Wassertropfen", "Gouttes d'eau", "Gotas de agua", "Gotas d'água"), "sound-effects/nature-drops-of-water-281292", loop(3)],
  // camasir_makinesi
  [49763, "camasir_makinesi", false, "Çamaşır Makinesi", L("Washing Machine", "Waschmaschine", "Lave-linge", "Lavadora", "Máquina de lavar"), "sound-effects/household-washing-machine-49763", plain()],
  [19338, "camasir_makinesi", true, "Kurutma Makinesi", L("Dryer", "Wäschetrockner", "Sèche-linge", "Secadora", "Secadora"), "sound-effects/technology-dryer-19338", plain()],
  // kedi_murilti
  [52783, "kedi_murilti", false, "Kedi Mırıltısı", L("Purring Cat", "Schnurrende Katze", "Chat qui ronronne", "Gato ronroneando", "Gato ronronando"), "sound-effects/nature-purring-cat-52783", plain()],
  // metro_tramvay
  [57289, "metro_tramvay", false, "Metro Yolculuğu", L("Subway Ride", "U-Bahn-Fahrt", "Trajet en métro", "Viaje en metro", "Viagem de metrô"), "sound-effects/city-subway-ride-57289", loop(3)],
  [456318, "metro_tramvay", true, "Metro İstasyonu", L("Subway Station", "U-Bahn-Station", "Station de métro", "Estación de metro", "Estação de metrô"), "sound-effects/subway-station-456318", loop(3)],
  [51125, "metro_tramvay", true, "Alicante Tramvayı", L("Alicante Tram", "Straßenbahn in Alicante", "Tramway d'Alicante", "Tranvía de Alicante", "Bonde de Alicante"), "sound-effects/city-tram-metropolitano-de-alicante-51125", plain()],
  // gong
  [48741, "gong", false, "Gong", L("Gong", "Gong", "Gong", "Gong", "Gongo"), "sound-effects/musical-gong-48741", loop(2, 3)],
  // kalem_yazi
  [57001, "kalem_yazi", false, "Yazı Sesi", L("Writing Sound", "Schreibgeräusch", "Bruit d'écriture", "Sonido de escritura", "Som de escrita"), "sound-effects/film-special-effects-writing-sound-loop-57001", loop(3)],
  [55361, "kalem_yazi", true, "Kalemle Yazı", L("Writing with a Pen", "Schreiben mit Stift", "Écrire au stylo", "Escribir con pluma", "Escrever com caneta"), "sound-effects/film-special-effects-writing-with-pen-55361", loop(3)],
  // firca
  [57324, "firca", false, "Boya Fırçası", L("Paint Brush", "Pinsel", "Pinceau", "Pincel", "Pincel"), "sound-effects/film-special-effects-paint-brush-57324", loop(3)],
  // kum_pirinc
  [482891, "kum_pirinc", false, "Kum Hışırtısı", L("Sand Rustling", "Rascheln von Sand", "Froissement de sable", "Crujido de arena", "Farfalhar de areia"), "sound-effects/film-special-effects-desert-sand-rustling-482891", plain()],
  [482890, "kum_pirinc", true, "Çöl Kum Tepeleri", L("Desert Sand Dunes", "Wüstendünen", "Dunes du désert", "Dunas del desierto", "Dunas do deserto"), "sound-effects/film-special-effects-desert-sand-dunes-482890", plain()],
  // gitar (müzik: hepsi premium, olduğu gibi)
  [139209, "gitar", true, "Yıldızların Ninnisi", L("Lullaby of the Stars", "Wiegenlied der Sterne", "Berceuse des étoiles", "Nana de las estrellas", "Canção de ninar das estrelas"), "music/solo-guitar-lullaby-of-the-stars-calm-acoustic-guitar-139209", music()],
  [15700, "gitar", true, "Ruhunun Beşiği", L("The Cradle of Your Soul", "Die Wiege deiner Seele", "Le berceau de ton âme", "La cuna de tu alma", "O berço da sua alma"), "music/solo-guitar-the-cradle-of-your-soul-15700", music()],
  [182391, "gitar", true, "Yıldızlı Gökyüzünde Kamp", L("Camping Under the Starry Sky", "Camping unterm Sternenhimmel", "Camper sous le ciel étoilé", "Acampar bajo el cielo estrellado", "Acampar sob o céu estrelado"), "music/solo-guitar-camping-out-under-the-starry-sky-tranquil-acoustic-guitar-182391", music()],
  [462280, "gitar", true, "Akustik Gitar Ninnisi", L("Acoustic Guitar Lullaby", "Akustikgitarren-Wiegenlied", "Berceuse à la guitare acoustique", "Nana de guitarra acústica", "Canção de ninar no violão"), "music/acoustic-group-acoustic-guitar-lullaby-462280", music()],
  // arp
  [482713, "arp", true, "Rahatlama İçin Yumuşak Arp", L("Soft Harp for Relaxation", "Sanfte Harfe zur Entspannung", "Harpe douce pour la détente", "Arpa suave para relajarse", "Harpa suave para relaxar"), "music/ambient-soft-harp-for-relaxation-482713", music()],
  [482739, "arp", true, "Kutsal Arp", L("Sacred Harp", "Heilige Harfe", "Harpe sacrée", "Arpa sagrada", "Harpa sagrada"), "music/ambient-sacred-harp-for-relaxation-482739", music()],
  [525281, "arp", true, "Orman Arpı ve Kuşlar", L("Forest Harp and Birds", "Waldharfe und Vögel", "Harpe de la forêt et oiseaux", "Arpa del bosque y pájaros", "Harpa da floresta e pássaros"), "music/modern-classical-forest-harp-harp-and-birds-525281", music()],
  // muzik_kutusu
  [349471, "muzik_kutusu", true, "Müzik Kutusu Uyku Ninnisi", L("Music Box Sleep Lullaby", "Spieluhr-Schlaflied", "Berceuse de boîte à musique", "Nana de caja de música", "Canção de ninar da caixa de música"), "music/lullabies-music-box-sleep-lullaby-349471", music()],
  // cello
  [474733, "cello", true, "Sudaki Küller", L("Ashes on the Water", "Asche auf dem Wasser", "Cendres sur l'eau", "Cenizas sobre el agua", "Cinzas sobre a água"), "music/ambient-ashes-on-the-water-474733", music()],
  [456449, "cello", true, "Fısıldanan Anılar", L("Whispered Memories", "Geflüsterte Erinnerungen", "Souvenirs chuchotés", "Recuerdos susurrados", "Memórias sussurradas"), "music/classical-string-quartet-whispered-memories-piano-and-cello-456449", music()],
  [470186, "cello", true, "Boş Odada Yankılar", L("Echoes in an Empty Room", "Echos in einem leeren Raum", "Échos dans une pièce vide", "Ecos en una habitación vacía", "Ecos em uma sala vazia"), "music/modern-classical-echoes-in-an-empty-room-piano-and-cello-470186", music()],
  [576237, "cello", true, "Fısıldayan Çello", L("Whispering Cello", "Flüsterndes Cello", "Violoncelle murmurant", "Violonchelo susurrante", "Violoncelo sussurrante"), "music/beautiful-plays-whispering-cello-and-keys-576237", music()],
];

const batch = [];
for (const [id, sub, premium, title, i18n, slug, filter] of J) {
  const out = path.join(outDir, `wave5-${id}.mp3`);
  process.stdout.write(`… ${id} ${title}\r`);
  const complex = filter.startsWith("[0:a]");
  await ff(["-i", src(id), ...(complex ? ["-filter_complex", `${filter},aformat=channel_layouts=stereo`] : ["-af", filter]), ...ENC, out]);
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]);
  const duration = Math.round(parseFloat(stdout));
  console.log(`✓ ${id} ${sub} ${title} (${duration} sn)   `);
  batch.push({ id, subcategory: sub, title, i18n, premium, duration, license: LICENSE, sourceUrl: px(slug) });
}
await writeFile(path.join(root, "scripts", "batches", "dalga5.json"), JSON.stringify(batch, null, 2) + "\n");
console.log(`\n${batch.length} parça -> ${outDir}\nbatch: scripts/batches/dalga5.json`);
