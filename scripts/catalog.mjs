// Pulvio ses kataloğu — TEK kaynak-of-truth.
// scripts/upload-audio.mjs bunu storage'a yüklemek için,
// `node scripts/upload-audio.mjs --sql` ise 0016 migration'ını üretmek için kullanır.
//
// Alan sırası: [pixabayId, subcategory, title, isPremiumOnly, durationSec, pixabaySlug]
// - category: MUSIC_SUBCATS içindeyse "muzik", değilse "rahatlatici"
// - storage yolu: tracks/<subcategory>/<pixabayId>.mp3
// - source_url:
//     rahatlatici -> https://pixabay.com/sound-effects/<slug>/
//     muzik       -> https://pixabay.com/<slug>/   (slug zaten "music/..." ile başlar)
// Yerel dosya adları "<uploader>-<...>-<pixabayId>.mp3" biçiminde; eşleştirme
// yalnızca sondaki sayıya (pixabayId) göre yapılır, isim önemli değil.

export const MUSIC_SUBCATS = new Set(["piyano", "lofi", "ambient"]);

export const LICENSE_TYPE = "Pixabay Content License";

export const CATALOG = [
  // ── rahatlatici / yagmur ───────────────────────────────────────────────
  [337279, "yagmur", "Rahatlatıcı Yağmur", false, 530, "sound-effects/nature-gentle-rain-for-relaxation-and-sleep-337279"],
  [422420, "yagmur", "Cama Yağmur", false, 760, "sound-effects/nature-gentle-rain-on-window-for-sleep-422420"],
  [444802, "yagmur", "Sakin Yağmur", true, 765, "sound-effects/nature-relaxing-rain-444802"],
  [307165, "yagmur", "Yağmur", true, 600, "sound-effects/nature-rain-sound-307165"],
  [437305, "yagmur", "Hafif Yağmur", true, 600, "sound-effects/nature-gentle-rain-01-437305"],
  [437318, "yagmur", "Hafif Yağmur 2", true, 420, "sound-effects/nature-gentle-rain-06-437318"],
  [190883, "yagmur", "Sağanak (İç Mekân)", true, 933, "sound-effects/nature-indoor-hard-rain-sound-190883"],
  [113602, "yagmur", "Arabada Yağmur", true, 899, "sound-effects/nature-rain-inside-a-car-113602"],
  [331497, "yagmur", "Telifsiz Yağmur", true, 467, "sound-effects/nature-copyright-free-rain-sounds-331497"],
  [444804, "yagmur", "Lo-fi Yağmur", true, 242, "sound-effects/nature-lo-fi-rain-sounds-444804"],

  // ── rahatlatici / deniz ────────────────────────────────────────────────
  [313367, "deniz", "Deniz Dalgaları", false, 900, "sound-effects/nature-sounds-of-waves-313367"],
  [19693, "deniz", "Nazik Okyanus Dalgaları", false, 719, "sound-effects/nature-gentle-ocean-waves-mix-2018-19693"],
  [16680, "deniz", "Kayalıklarda Dalgalar", true, 545, "sound-effects/nature-waves-hitting-the-rocks-16680"],
  [372489, "deniz", "Yatıştırıcı Dalgalar", true, 132, "sound-effects/nature-soothing-ocean-waves-372489"],
  [321649, "deniz", "Okyanus Dalgaları", true, 146, "sound-effects/nature-ocean-waves-1-321649"],
  [24046, "deniz", "Yumuşak Deniz Dalgaları", true, 120, "sound-effects/nature-soft-ocean-waves-sounds-24046"],
  [486892, "deniz", "Kıyıda Martılar", true, 75, "sound-effects/nature-sea-gently-lapping-waves-far-away-seagulls-486892"],
  [7109, "deniz", "Dalga ve Martı", true, 115, "sound-effects/nature-gentle-ocean-waves-birdsong-and-gull-7109"],

  // ── rahatlatici / dere ─────────────────────────────────────────────────
  [53345, "dere", "Buzlu Dere", false, 635, "sound-effects/nature-001433-the-sound-of-small-river-stream-partially-frozen-53345"],
  [420904, "dere", "Nehir Sesi", true, 360, "sound-effects/river-sounds-420904"],
  [420903, "dere", "Nehir Atmosferi", true, 360, "sound-effects/river-ambience-420903"],
  [420899, "dere", "Sessiz Dere", false, 176, "sound-effects/nature-quiet-stream-420899"],
  [575839, "dere", "Akarsu", true, 128, "sound-effects/nature-stream-sound-575839"],
  [360596, "dere", "Dere ve Nehir", true, 106, "sound-effects/nature-water-stream-river-360596"],

  // ── rahatlatici / gok_gurultusu ────────────────────────────────────────
  [321446, "gok_gurultusu", "Uzak Gök Gürültüsü", false, 900, "sound-effects/nature-night-rain-with-distant-thunder-321446"],
  [25054, "gok_gurultusu", "Fırtına", false, 1513, "sound-effects/nature-thunderstorm-25054"],
  [409789, "gok_gurultusu", "Gök Gürültülü Fırtına", true, 728, "sound-effects/nature-thunderstorm-409789"],
  [370981, "gok_gurultusu", "Yağmur ve Gök Gürültüsü", true, 616, "sound-effects/nature-rain-with-thunderstorm-370981"],
  [420333, "gok_gurultusu", "Yağmurlu Fırtına", true, 581, "sound-effects/nature-rain-with-thunderstorm-420333"],
  [184034, "gok_gurultusu", "Fırtına ve Kuşlar", true, 257, "sound-effects/nature-thunderstorm-with-distant-birds-184034"],

  // ── rahatlatici / kus_sesi ─────────────────────────────────────────────
  [19624, "kus_sesi", "Orman Kuşları", false, 636, "sound-effects/nature-birds-19624"],
  [108380, "kus_sesi", "Tropik Orman Kuşları", false, 589, "sound-effects/nature-nature-soundstropicaljunglebirds-108380"],
  [61396, "kus_sesi", "Bahar Kuşları", true, 381, "sound-effects/nature-birds-in-spring-north-carolina-61396"],
  [217212, "kus_sesi", "Kuş Şarkıları", true, 210, "sound-effects/nature-nature-birds-singing-217212"],
  [217410, "kus_sesi", "Cıvıltı", true, 97, "sound-effects/nature-chirping-birds-ambience-217410"],

  // ── rahatlatici / orman ────────────────────────────────────────────────
  [537925, "orman", "Orman", false, 302, "sound-effects/film-special-effects-nature-forest-sound-537925"],
  [540695, "orman", "Orman Atmosferi", true, 288, "sound-effects/film-special-effects-forest-ambience-540695"],
  [296528, "orman", "Orman Atmosferi 2", true, 212, "sound-effects/nature-forest-ambience-296528"],
  [17045, "orman", "Sabah Ormanı", false, 180, "sound-effects/nature-morning-forest-ambiance-17045"],
  [446356, "orman", "Gündüz Ormanı", true, 121, "sound-effects/nature-forest-daytime-446356"],
  [211715, "orman", "Rüzgârlı Gece Ormanı", true, 64, "sound-effects/nature-windy-night-forest-ambience-211715"],
  [158701, "orman", "Gece Ormanı", true, 91, "sound-effects/nature-night-forest-soundscape-158701"],

  // ── rahatlatici / ruzgar ───────────────────────────────────────────────
  [522908, "ruzgar", "Göl Kıyısında Rüzgâr", false, 48, "sound-effects/film-special-effects-wind-lake-sfx-522908"],
  [457954, "ruzgar", "Rüzgâr", true, 42, "sound-effects/nature-wind-blowing-457954"],
  [350417, "ruzgar", "Çöl Rüzgârı", true, 32, "sound-effects/nature-desert-wind-2-350417"],
  [402331, "ruzgar", "Kış Rüzgârı", true, 19, "sound-effects/nature-winter-wind-402331"],

  // ── rahatlatici / gece_bocekleri ───────────────────────────────────────
  [17862, "gece_bocekleri", "Cırcır Böcekleri", false, 258, "sound-effects/nature-crickets-17862"],
  [374652, "gece_bocekleri", "Cırcır Böcekli Gece", true, 120, "sound-effects/nature-night-atmosphere-with-crickets-374652"],
  [24013, "gece_bocekleri", "Şehir Gecesi Cırcırları", true, 120, "sound-effects/nature-city-night-crickets-24013"],
  [22484, "gece_bocekleri", "Gece Cırcır Atmosferi", true, 82, "sound-effects/nature-night-cricket-ambience-22484"],

  // ── rahatlatici / ates ─────────────────────────────────────────────────
  [176816, "ates", "Sıcak Kamp Ateşi", false, 181, "sound-effects/nature-warm-camp-fire-high-quality-176816"],
  [439573, "ates", "Çıtırdayan Kamp Ateşi", true, 179, "sound-effects/nature-campfire-crackling-sound-439573"],
  [575667, "ates", "Ateş Çıtırtısı", true, 179, "sound-effects/film-special-effects-fire-crackling-campfire-sound-575667"],
  [356884, "ates", "Bahar Ormanında Ateş", true, 172, "sound-effects/nature-spring-forest-campfire-356884"],
  [119594, "ates", "Şömine Çıtırtısı", false, 139, "sound-effects/nature-campfire-crackling-fireplace-sound-119594"],
  [178392, "ates", "Şömine", true, 119, "sound-effects/film-special-effects-fireplace-with-crackling-sounds-2-min-rk-178392"],

  // ── rahatlatici / fon_makinesi ─────────────────────────────────────────
  [58299, "fon_makinesi", "Fön Makinesi", false, 118, "sound-effects/film-special-effects-hair-dryer-58299"],
  [57941, "fon_makinesi", "Fön Makinesi 2", true, 113, "sound-effects/household-013234-hair-dryer-57941"],
  [29886, "fon_makinesi", "Fön Makinesi 3", true, 62, "sound-effects/household-hair-dryer-29886"],
  [573497, "fon_makinesi", "Vantilatör", false, 604, "sound-effects/film-special-effects-fan-noise-to-fall-asleep-573497"],
  [480468, "fon_makinesi", "Elektrikli Vantilatör", true, 255, "sound-effects/city-electric-fan-brown-noise-480468"],

  // ── rahatlatici / beyaz_gurultu ────────────────────────────────────────
  [372485, "beyaz_gurultu", "Beyaz Gürültü", false, 899, "sound-effects/film-special-effects-whitenoise-372485"],
  [378857, "beyaz_gurultu", "Yumuşak Beyaz Gürültü", true, 300, "sound-effects/film-special-effects-soft-soothing-deep-white-noise-378857"],
  [293777, "beyaz_gurultu", "Derin Gürültü", true, 600, "sound-effects/film-special-effects-soothing-deep-noise-293777"],

  // ── rahatlatici / kahverengi_gurultu ───────────────────────────────────
  [299934, "kahverengi_gurultu", "Kahverengi Gürültü", false, 600, "sound-effects/film-special-effects-soft-brown-noise-299934"],
  [294838, "kahverengi_gurultu", "Yumuşatılmış Kahverengi Gürültü", true, 600, "sound-effects/film-special-effects-relaxing-smoothed-brown-noise-294838"],
  [304725, "kahverengi_gurultu", "Katmanlı Kahverengi Gürültü", true, 600, "sound-effects/film-special-effects-relaxing-layered-brown-noise-304725"],

  // ── rahatlatici / pembe_gurultu ────────────────────────────────────────
  [434732, "pembe_gurultu", "Pembe Gürültü", false, 300, "sound-effects/film-special-effects-low-pink-noise-434732"],
  [434730, "pembe_gurultu", "Yoğun Pembe Gürültü", true, 300, "sound-effects/film-special-effects-dense-pink-noise-1-434730"],
  [195103, "pembe_gurultu", "Kumda Pembe Gürültü", true, 247, "sound-effects/nature-pink-noise-ocean-waves-on-grainy-sand-195103"],
  [195101, "pembe_gurultu", "Nehirde Pembe Gürültü", true, 366, "sound-effects/nature-pink-noise-from-the-surface-of-the-river-195101"],

  // ── rahatlatici / kafe ─────────────────────────────────────────────────
  [180801, "kafe", "İsveç Kafesi", false, 600, "sound-effects/film-special-effects-caf%C3%A9coffee-shop-ambience-medium-to-small-swedish-caf%C3%A9-180801"],
  [51695, "kafe", "Kafe Uğultusu", true, 304, "sound-effects/people-yet-another-starbucks-ambience-51695"],
  [14437, "kafe", "Kafe Atmosferi", true, 296, "sound-effects/city-370973-waweee-coffee-shop-ambience-remasteredmp3-14437"],
  [49769, "kafe", "Kafe 1", true, 191, "sound-effects/city-ambience-coffee-shop-1-49769"],
  [17059, "kafe", "Kafe 5", true, 180, "sound-effects/city-ambience-coffee-shop-5-17059"],

  // ── muzik / piyano (tümü premium) ──────────────────────────────────────
  [335749, "piyano", "Sessiz Akşam", true, 310, "music/modern-classical-silent-evening-calm-piano-335749"],
  [576269, "piyano", "Sakin Piyano", true, 237, "music/small-drama-calm-piano-576269"],
  [398662, "piyano", "Yumuşak Piyano Solo", true, 216, "music/modern-classical-soft-calm-piano-solo-music-398662"],
  [519619, "piyano", "Doğa Piyanosu", true, 180, "music/solo-piano-nature-piano-519619"],
  [405074, "piyano", "Yumuşak Piyano", true, 169, "music/modern-classical-soft-calm-piano-music-405074"],
  [351839, "piyano", "Sakin Piyano Müziği", true, 157, "music/modern-classical-calm-piano-music-351839"],
  [576857, "piyano", "Huzurlu Piyano", true, 146, "music/ambient-peaceful-piano-576857"],
  [580085, "piyano", "Akşam Piyanosu", true, 136, "music/small-drama-evening-calm-piano-580085"],
  [293695, "piyano", "Klasik Piyano Melodisi", true, 144, "music/modern-classical-calm-classical-piano-melody-293695"],

  // ── muzik / lofi (tümü premium) ────────────────────────────────────────
  [160166, "lofi", "İyi Geceler Lo-fi", true, 147, "music/beats-good-night-lofi-cozy-chill-music-160166"],
  [568166, "lofi", "Yağmurlu Gece Lo-fi", true, 143, "music/lofi-lofi-study-rainy-night-568166"],
  [582887, "lofi", "Gece Lo-fi", true, 133, "music/lofi-night-lofi-582887"],
  [553420, "lofi", "Açık Pencere Lo-fi", true, 122, "music/lofi-lofi-open-window-553420"],
  [576447, "lofi", "Yağmur Uyku Müziği", true, 139, "music/lullabies-rain-rain-sleep-music-576447"],
  [576435, "lofi", "Yatıştırıcı Uyku Müziği", true, 128, "music/lullabies-sleep-soothing-sleep-music-576435"],

  // ── muzik / ambient (tümü premium) ─────────────────────────────────────
  [587996, "ambient", "Uyku Müziği", true, 894, "music/meditationspiritual-sleep-music-587996"],
  [583152, "ambient", "Rahatlatıcı Uyku", true, 584, "music/modern-classical-relaxing-sleep-583152"],
  [586396, "ambient", "Uyku Müziği 2", true, 590, "music/meditationspiritual-sleep-music-586396"],
  [571041, "ambient", "Uyku Müziği 3", true, 531, "music/meditationspiritual-sleep-music-571041"],
  [586804, "ambient", "Uyku Hipnozu", true, 498, "music/meditationspiritual-sleep-hypnosis-586804"],
  [590396, "ambient", "Uyku Müziği 4", true, 415, "music/ambient-sleep-music-590396"],
  [586417, "ambient", "Uyku Müziği 5", true, 434, "music/ambient-sleep-music-586417"],
  [586414, "ambient", "Rahatlatıcı Uyku 2", true, 326, "music/ambient-relaxing-sleep-586414"],
];

export function entryFor([id, subcategory, title, premium, duration, slug]) {
  const category = MUSIC_SUBCATS.has(subcategory) ? "muzik" : "rahatlatici";
  return {
    id,
    category,
    subcategory,
    title,
    isPremiumOnly: premium,
    duration,
    storagePath: `${subcategory}/${id}.mp3`,
    sourceUrl: `https://pixabay.com/${slug}/`,
  };
}

export const ENTRIES = CATALOG.map(entryFor);
