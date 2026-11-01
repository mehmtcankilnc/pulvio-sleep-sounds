// Pulvio kategori taksonomisi — kaynak-of-truth (catalog.mjs'in kardeşi).
// `node scripts/gen-taxonomy-sql.mjs` bunu 0023 migration'ına çevirir.
//
// Taksonomi artık Supabase'de (catalog_categories / catalog_subcategories);
// istemci etiketi, sırayı ve ikonu oradan okur. Yani bundan sonra yeni
// kategori/alt kategori = bir INSERT, mağaza güncellemesi YOK.
//
// icon: Ionicons glyph adı (@expo/vector-icons paketinde tüm glyph'ler zaten
// gömülü; yeni ikon da güncelleme gerektirmez). Etiket dilleri: tr en de fr es pt.

const L = (tr, en, de, fr, es, pt) => ({ tr, en, de, fr, es, pt });

// Üst kategoriler (sort: 10'ar aralıklı).
export const CATEGORIES = [
  { id: "rahatlatici", icon: "water-outline", existing: true },
  { id: "ev", icon: "home-outline", labels: L("Ev", "Home", "Zuhause", "Maison", "Hogar", "Casa") },
  { id: "araclar", icon: "car-outline", existing: true },
  { id: "beden", icon: "body-outline", labels: L("Beden", "Body", "Körper", "Corps", "Cuerpo", "Corpo") },
  { id: "frekans", icon: "pulse-outline", labels: L("Frekans", "Tones", "Töne", "Fréquences", "Tonos", "Tons") },
  { id: "asmr", icon: "finger-print-outline", existing: true },
  { id: "muzik", icon: "musical-notes-outline", existing: true },
];

// Mevcut 23 alt kategorinin ikonları (etiketleri locales/*/catalog.json'dan gelir).
export const EXISTING_ICONS = {
  yagmur: "rainy-outline",
  deniz: "water-outline",
  dere: "water-outline",
  gok_gurultusu: "thunderstorm-outline",
  kus_sesi: "musical-note-outline",
  orman: "leaf-outline",
  ruzgar: "cloud-outline",
  gece_bocekleri: "bug-outline",
  ates: "flame-outline",
  fon_makinesi: "sync-outline",
  beyaz_gurultu: "radio-outline",
  kahverengi_gurultu: "radio-outline",
  pembe_gurultu: "radio-outline",
  kafe: "cafe-outline",
  otobus: "bus-outline",
  arac_ici: "car-outline",
  tren: "train-outline",
  ucak_kabin: "airplane-outline",
  tiklama: "finger-print-outline",
  klavye: "keypad-outline",
  piyano: "musical-notes-outline",
  lofi: "musical-notes-outline",
  ambient: "musical-notes-outline",
};

// Yeni alt kategoriler. Parça eklenene kadar istemcide görünmez (bölümler
// parçalardan türetilir) — yani önceden tohumlamak güvenli.
export const NEW_SUBCATEGORIES = [
  // rahatlatici
  { id: "selale", category: "rahatlatici", icon: "water", labels: L("Şelale", "Waterfall", "Wasserfall", "Cascade", "Cascada", "Cachoeira") },
  { id: "cadir_yagmuru", category: "rahatlatici", icon: "umbrella-outline", labels: L("Çadırda Yağmur", "Rain on a Tent", "Regen auf dem Zelt", "Pluie sur la tente", "Lluvia en la tienda", "Chuva na barraca") },
  { id: "sehir_yagmuru", category: "rahatlatici", icon: "business-outline", labels: L("Şehirde Yağmur", "City Rain", "Stadtregen", "Pluie en ville", "Lluvia en la ciudad", "Chuva na cidade") },
  { id: "yagmur_ormani", category: "rahatlatici", icon: "flower-outline", labels: L("Yağmur Ormanı", "Rainforest", "Regenwald", "Forêt tropicale", "Selva tropical", "Floresta tropical") },
  { id: "gol_kiyisi", category: "rahatlatici", icon: "partly-sunny-outline", labels: L("Göl Kıyısı", "Lakeside", "Seeufer", "Bord de lac", "Orilla del lago", "Beira do lago") },
  { id: "kurbaga_golet", category: "rahatlatici", icon: "cloudy-night-outline", labels: L("Kurbağalar ve Gölet", "Frogs & Pond", "Frösche & Teich", "Grenouilles & étang", "Ranas y estanque", "Sapos e lagoa") },
  { id: "kar_kis", category: "rahatlatici", icon: "snow-outline", labels: L("Kar ve Kış", "Snow & Winter", "Schnee & Winter", "Neige et hiver", "Nieve e invierno", "Neve e inverno") },
  { id: "cangirak", category: "rahatlatici", icon: "notifications-outline", labels: L("Rüzgâr Çanı", "Wind Chimes", "Windspiel", "Carillons", "Campanillas de viento", "Sinos de vento") },
  { id: "magara_damla", category: "rahatlatici", icon: "prism-outline", labels: L("Mağara Damlası", "Cave Drips", "Tropfsteinhöhle", "Gouttes de grotte", "Goteo de cueva", "Gotas na caverna") },
  // ev
  { id: "vantilator", category: "ev", icon: "aperture-outline", labels: L("Vantilatör", "Fan", "Ventilator", "Ventilateur", "Ventilador", "Ventilador") },
  { id: "klima", category: "ev", icon: "thermometer-outline", labels: L("Klima", "Air Conditioner", "Klimaanlage", "Climatiseur", "Aire acondicionado", "Ar-condicionado") },
  { id: "camasir_makinesi", category: "ev", icon: "shirt-outline", labels: L("Çamaşır Makinesi", "Washing Machine", "Waschmaschine", "Lave-linge", "Lavadora", "Máquina de lavar") },
  { id: "supurge", category: "ev", icon: "flash-outline", labels: L("Elektrikli Süpürge", "Vacuum Cleaner", "Staubsauger", "Aspirateur", "Aspiradora", "Aspirador") },
  { id: "saat", category: "ev", icon: "time-outline", labels: L("Saat Tik-Takı", "Clock Ticking", "Tickende Uhr", "Tic-tac d'horloge", "Tictac de reloj", "Tique-taque do relógio") },
  { id: "kedi_murilti", category: "ev", icon: "paw-outline", labels: L("Kedi Mırıltısı", "Cat Purring", "Katzenschnurren", "Ronronnement de chat", "Ronroneo de gato", "Ronronar de gato") },
  { id: "soba_radyator", category: "ev", icon: "bonfire-outline", labels: L("Soba ve Radyatör", "Stove & Radiator", "Ofen & Heizkörper", "Poêle et radiateur", "Estufa y radiador", "Aquecedor e radiador") },
  // araclar
  { id: "metro_tramvay", category: "araclar", icon: "subway-outline", labels: L("Metro ve Tramvay", "Metro & Tram", "U-Bahn & Straßenbahn", "Métro et tramway", "Metro y tranvía", "Metrô e bonde") },
  { id: "gemi_feribot", category: "araclar", icon: "boat-outline", labels: L("Gemi ve Feribot", "Ship & Ferry", "Schiff & Fähre", "Bateau et ferry", "Barco y ferri", "Navio e balsa") },
  { id: "tir_kamyon", category: "araclar", icon: "speedometer-outline", labels: L("Tır ve Kamyon", "Truck", "Lastwagen", "Camion", "Camión", "Caminhão") },
  // beden
  { id: "kalp_atisi", category: "beden", icon: "heart-outline", labels: L("Kalp Atışı", "Heartbeat", "Herzschlag", "Battements de cœur", "Latidos", "Batimentos cardíacos") },
  { id: "nefes", category: "beden", icon: "fitness-outline", labels: L("Nefes Ritmi", "Breathing Rhythm", "Atemrhythmus", "Rythme respiratoire", "Ritmo de respiración", "Ritmo de respiração") },
  { id: "rahim", category: "beden", icon: "happy-outline", labels: L("Rahim Sesleri", "Womb Sounds", "Mutterleib-Klänge", "Sons utérins", "Sonidos del vientre", "Sons do útero") },
  // frekans
  { id: "binaural", category: "frekans", icon: "headset-outline", labels: L("Binaural (Kulaklık)", "Binaural Beats", "Binaurale Beats", "Sons binauraux", "Tonos binaurales", "Batidas binaurais") },
  { id: "izokronik", category: "frekans", icon: "pulse-outline", labels: L("İzokronik Tonlar", "Isochronic Tones", "Isochrone Töne", "Tons isochrones", "Tonos isocrónicos", "Tons isocrônicos") },
  { id: "solfeggio", category: "frekans", icon: "infinite-outline", labels: L("Solfej Tonları", "Solfeggio Tones", "Solfeggio-Töne", "Tons solfège", "Tonos solfeggio", "Tons solfejo") },
  { id: "tibet_kasesi", category: "frekans", icon: "disc-outline", labels: L("Tibet Kasesi", "Singing Bowl", "Klangschale", "Bol tibétain", "Cuenco tibetano", "Tigela tibetana") },
  { id: "gong", category: "frekans", icon: "radio-button-on-outline", labels: L("Gong", "Gong", "Gong", "Gong", "Gong", "Gongo") },
  // asmr (yalnız mekanik; insan sesi yok)
  { id: "sayfa_cevirme", category: "asmr", icon: "book-outline", labels: L("Sayfa Çevirme", "Page Turning", "Umblättern", "Pages tournées", "Pasar páginas", "Virar páginas") },
  { id: "kalem_yazi", category: "asmr", icon: "pencil-outline", labels: L("Kalem ve Yazı", "Pen & Writing", "Stift & Schreiben", "Stylo et écriture", "Lápiz y escritura", "Caneta e escrita") },
  { id: "firca", category: "asmr", icon: "brush-outline", labels: L("Fırça Sesleri", "Brushing", "Bürsten", "Brossage", "Cepillado", "Escovação") },
  { id: "kum_pirinc", category: "asmr", icon: "hourglass-outline", labels: L("Kum ve Pirinç", "Sand & Rice", "Sand & Reis", "Sable et riz", "Arena y arroz", "Areia e arroz") },
  { id: "damla", category: "asmr", icon: "beaker-outline", labels: L("Su Damlası", "Water Drops", "Wassertropfen", "Gouttes d'eau", "Gotas de agua", "Gotas d'água") },
  // muzik
  { id: "gitar", category: "muzik", icon: "musical-notes-outline", labels: L("Gitar", "Guitar", "Gitarre", "Guitare", "Guitarra", "Violão") },
  { id: "arp", category: "muzik", icon: "musical-notes-outline", labels: L("Arp", "Harp", "Harfe", "Harpe", "Arpa", "Harpa") },
  { id: "muzik_kutusu", category: "muzik", icon: "gift-outline", labels: L("Müzik Kutusu", "Music Box", "Spieluhr", "Boîte à musique", "Caja de música", "Caixa de música") },
  { id: "kalimba", category: "muzik", icon: "musical-notes-outline", labels: L("Kalimba", "Kalimba", "Kalimba", "Kalimba", "Kalimba", "Kalimba") },
  { id: "cello", category: "muzik", icon: "musical-notes-outline", labels: L("Çello", "Cello", "Cello", "Violoncelle", "Violonchelo", "Violoncelo") },
  { id: "synth_pad", category: "muzik", icon: "hardware-chip-outline", labels: L("Synth Pad", "Synth Pad", "Synth Pad", "Synth Pad", "Synth Pad", "Synth Pad") },
];

// Kategori içi alt kategori sırası (mevcut anlatı sırası + yenilerin doğal yeri).
export const SUB_ORDER = {
  rahatlatici: [
    "yagmur", "cadir_yagmuru", "sehir_yagmuru", "gok_gurultusu", "deniz", "gol_kiyisi", "dere", "selale", "magara_damla",
    "kus_sesi", "orman", "yagmur_ormani", "ruzgar", "cangirak", "kar_kis", "gece_bocekleri", "kurbaga_golet", "ates",
    "fon_makinesi", "beyaz_gurultu", "kahverengi_gurultu", "pembe_gurultu", "kafe",
  ],
  ev: ["vantilator", "klima", "camasir_makinesi", "supurge", "saat", "soba_radyator", "kedi_murilti"],
  araclar: ["otobus", "arac_ici", "tren", "metro_tramvay", "ucak_kabin", "gemi_feribot", "tir_kamyon"],
  beden: ["kalp_atisi", "nefes", "rahim"],
  frekans: ["binaural", "izokronik", "solfeggio", "tibet_kasesi", "gong"],
  asmr: ["tiklama", "klavye", "sayfa_cevirme", "kalem_yazi", "firca", "kum_pirinc", "damla"],
  muzik: ["piyano", "lofi", "ambient", "gitar", "arp", "muzik_kutusu", "kalimba", "cello", "synth_pad"],
};
