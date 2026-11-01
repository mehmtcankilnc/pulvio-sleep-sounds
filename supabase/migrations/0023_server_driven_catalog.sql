-- Pulvio — sunucu güdümlü katalog (OTOMATİK ÜRETİLDİ: node scripts/gen-taxonomy-sql.mjs).
-- Kaynak: scripts/taxonomy.mjs + src/locales/*/catalog.json. Elle düzenleme; kaynağı değiştir, yeniden üret.
--
-- Amaç: kategori/alt kategori etiketi, sırası, ikonu ve parça başlığı çevirileri
-- istemci paketinden çıkıp veritabanına taşındı. Bundan sonra yeni içerik
-- (parça, alt kategori, üst kategori, çeviri) mağaza güncellemesi gerektirmez.
--
-- Eski istemci (1.0.0) koruması aşağıda: yeni alt kategorili parçalar
-- min_client_version ile işaretlenir ve 1.0.0'a RLS ile gösterilmez.

create table if not exists public.catalog_categories (
  id text primary key,
  sort_order int not null default 0,
  labels jsonb not null,           -- {"tr": "...", "en": "...", ...}
  icon text not null default 'moon-outline',  -- Ionicons glyph adı
  active boolean not null default true
);

create table if not exists public.catalog_subcategories (
  id text primary key,
  category_id text not null references public.catalog_categories (id),
  sort_order int not null default 0,
  labels jsonb not null,
  icon text not null default 'moon-outline',
  active boolean not null default true
);

-- Eski istemci koruması: min_client_version dolu parçalar, x-app-version başlığı
-- (src/lib/supabase.ts) bu sürümün altında olan ya da hiç göndermeyen istemcilere
-- (1.0.0) GÖRÜNMEZ. Böylece 1.0.0, bilmediği alt kategoriyi ham slug + varsayılan
-- ikonla asla göstermez. Yeni alt kategorili her parça '1.1.0' ile eklenir
-- (scripts/add-tracks.mjs bunu otomatik yapar).
alter table public.tracks add column if not exists min_client_version text;

create or replace function public.client_version_at_least(min_version text)
returns boolean
language plpgsql
stable
as $fn$
declare
  v text;
begin
  if min_version is null then
    return true;
  end if;
  v := nullif(current_setting('request.headers', true), '')::json ->> 'x-app-version';
  if v is null or v !~ '^[0-9]+([.][0-9]+){0,2}$' then
    return false;
  end if;
  return string_to_array(v, '.')::int[] >= string_to_array(min_version, '.')::int[];
exception when others then
  return false;
end;
$fn$;

drop policy if exists "tracks_select_all" on public.tracks;
create policy "tracks_select_all" on public.tracks for select
  using (public.client_version_at_least(min_client_version));

-- Parça başlığı çevirileri: {"en": "...", "de": "..."}; TR başlık `title` kolonunda kalır.
alter table public.tracks add column if not exists title_i18n jsonb;

-- Uygulama sürüm/uyarı ayarı (platform başına tek satır).
create table if not exists public.app_config (
  platform text primary key check (platform in ('ios', 'android')),
  latest_version text not null,    -- mağazadaki en güncel sürüm (x.y.z)
  min_version text not null,       -- bunun altı zorunlu güncelleme
  store_url text,                  -- null ise istemci Android için Play linkine düşer, iOS'ta uyarı gizlenir
  message_i18n jsonb               -- opsiyonel gövde metni: {"tr": "...", "en": "..."}
);

alter table public.catalog_categories enable row level security;
alter table public.catalog_subcategories enable row level security;
alter table public.app_config enable row level security;

drop policy if exists "catalog_categories_select_all" on public.catalog_categories;
create policy "catalog_categories_select_all" on public.catalog_categories for select using (true);
drop policy if exists "catalog_subcategories_select_all" on public.catalog_subcategories;
create policy "catalog_subcategories_select_all" on public.catalog_subcategories for select using (true);
drop policy if exists "app_config_select_all" on public.app_config;
create policy "app_config_select_all" on public.app_config for select using (true);

insert into public.catalog_categories (id, sort_order, labels, icon) values
  ('rahatlatici', 10, '{"tr":"Rahatlatıcı","en":"Calming","de":"Beruhigend","fr":"Apaisant","es":"Relajante","pt":"Relaxante"}', 'water-outline'),
  ('ev', 20, '{"tr":"Ev","en":"Home","de":"Zuhause","fr":"Maison","es":"Hogar","pt":"Casa"}', 'home-outline'),
  ('araclar', 30, '{"tr":"Araçlar","en":"Vehicles","de":"Fahrzeuge","fr":"Véhicules","es":"Vehículos","pt":"Veículos"}', 'car-outline'),
  ('beden', 40, '{"tr":"Beden","en":"Body","de":"Körper","fr":"Corps","es":"Cuerpo","pt":"Corpo"}', 'body-outline'),
  ('frekans', 50, '{"tr":"Frekans","en":"Tones","de":"Töne","fr":"Fréquences","es":"Tonos","pt":"Tons"}', 'pulse-outline'),
  ('asmr', 60, '{"tr":"ASMR","en":"ASMR","de":"ASMR","fr":"ASMR","es":"ASMR","pt":"ASMR"}', 'finger-print-outline'),
  ('muzik', 70, '{"tr":"Müzik","en":"Music","de":"Musik","fr":"Musique","es":"Música","pt":"Música"}', 'musical-notes-outline')
on conflict (id) do update set sort_order = excluded.sort_order, labels = excluded.labels, icon = excluded.icon;

insert into public.catalog_subcategories (id, category_id, sort_order, labels, icon) values
  ('yagmur', 'rahatlatici', 10, '{"tr":"Yağmur","en":"Rain","de":"Regen","fr":"Pluie","es":"Lluvia","pt":"Chuva"}', 'rainy-outline'),
  ('cadir_yagmuru', 'rahatlatici', 20, '{"tr":"Çadırda Yağmur","en":"Rain on a Tent","de":"Regen auf dem Zelt","fr":"Pluie sur la tente","es":"Lluvia en la tienda","pt":"Chuva na barraca"}', 'umbrella-outline'),
  ('sehir_yagmuru', 'rahatlatici', 30, '{"tr":"Şehirde Yağmur","en":"City Rain","de":"Stadtregen","fr":"Pluie en ville","es":"Lluvia en la ciudad","pt":"Chuva na cidade"}', 'business-outline'),
  ('gok_gurultusu', 'rahatlatici', 40, '{"tr":"Gök Gürültüsü","en":"Thunderstorm","de":"Gewitter","fr":"Orage","es":"Tormenta","pt":"Trovoada"}', 'thunderstorm-outline'),
  ('deniz', 'rahatlatici', 50, '{"tr":"Deniz","en":"Ocean","de":"Meer","fr":"Océan","es":"Mar","pt":"Mar"}', 'water-outline'),
  ('gol_kiyisi', 'rahatlatici', 60, '{"tr":"Göl Kıyısı","en":"Lakeside","de":"Seeufer","fr":"Bord de lac","es":"Orilla del lago","pt":"Beira do lago"}', 'partly-sunny-outline'),
  ('dere', 'rahatlatici', 70, '{"tr":"Dere","en":"Stream","de":"Bach","fr":"Ruisseau","es":"Arroyo","pt":"Riacho"}', 'water-outline'),
  ('selale', 'rahatlatici', 80, '{"tr":"Şelale","en":"Waterfall","de":"Wasserfall","fr":"Cascade","es":"Cascada","pt":"Cachoeira"}', 'water'),
  ('magara_damla', 'rahatlatici', 90, '{"tr":"Mağara Damlası","en":"Cave Drips","de":"Tropfsteinhöhle","fr":"Gouttes de grotte","es":"Goteo de cueva","pt":"Gotas na caverna"}', 'prism-outline'),
  ('kus_sesi', 'rahatlatici', 100, '{"tr":"Kuş Sesi","en":"Birdsong","de":"Vogelgezwitscher","fr":"Chant d''oiseaux","es":"Canto de aves","pt":"Canto de pássaros"}', 'musical-note-outline'),
  ('orman', 'rahatlatici', 110, '{"tr":"Orman","en":"Forest","de":"Wald","fr":"Forêt","es":"Bosque","pt":"Floresta"}', 'leaf-outline'),
  ('yagmur_ormani', 'rahatlatici', 120, '{"tr":"Yağmur Ormanı","en":"Rainforest","de":"Regenwald","fr":"Forêt tropicale","es":"Selva tropical","pt":"Floresta tropical"}', 'flower-outline'),
  ('ruzgar', 'rahatlatici', 130, '{"tr":"Rüzgâr","en":"Wind","de":"Wind","fr":"Vent","es":"Viento","pt":"Vento"}', 'cloud-outline'),
  ('cangirak', 'rahatlatici', 140, '{"tr":"Rüzgâr Çanı","en":"Wind Chimes","de":"Windspiel","fr":"Carillons","es":"Campanillas de viento","pt":"Sinos de vento"}', 'notifications-outline'),
  ('kar_kis', 'rahatlatici', 150, '{"tr":"Kar ve Kış","en":"Snow & Winter","de":"Schnee & Winter","fr":"Neige et hiver","es":"Nieve e invierno","pt":"Neve e inverno"}', 'snow-outline'),
  ('gece_bocekleri', 'rahatlatici', 160, '{"tr":"Gece Böcekleri","en":"Night Insects","de":"Nachtinsekten","fr":"Insectes nocturnes","es":"Insectos nocturnos","pt":"Insetos noturnos"}', 'bug-outline'),
  ('kurbaga_golet', 'rahatlatici', 170, '{"tr":"Kurbağalar ve Gölet","en":"Frogs & Pond","de":"Frösche & Teich","fr":"Grenouilles & étang","es":"Ranas y estanque","pt":"Sapos e lagoa"}', 'cloudy-night-outline'),
  ('ates', 'rahatlatici', 180, '{"tr":"Ateş","en":"Fire","de":"Feuer","fr":"Feu","es":"Fuego","pt":"Fogo"}', 'flame-outline'),
  ('fon_makinesi', 'rahatlatici', 190, '{"tr":"Fön Makinesi","en":"Hair Dryer","de":"Föhn","fr":"Sèche-cheveux","es":"Secador","pt":"Secador"}', 'sync-outline'),
  ('beyaz_gurultu', 'rahatlatici', 200, '{"tr":"Beyaz Gürültü","en":"White Noise","de":"Weißes Rauschen","fr":"Bruit blanc","es":"Ruido blanco","pt":"Ruído branco"}', 'radio-outline'),
  ('kahverengi_gurultu', 'rahatlatici', 210, '{"tr":"Kahverengi Gürültü","en":"Brown Noise","de":"Braunes Rauschen","fr":"Bruit brun","es":"Ruido marrón","pt":"Ruído castanho"}', 'radio-outline'),
  ('pembe_gurultu', 'rahatlatici', 220, '{"tr":"Pembe Gürültü","en":"Pink Noise","de":"Rosa Rauschen","fr":"Bruit rose","es":"Ruido rosa","pt":"Ruído rosa"}', 'radio-outline'),
  ('kafe', 'rahatlatici', 230, '{"tr":"Kafe","en":"Café","de":"Café","fr":"Café","es":"Cafetería","pt":"Café"}', 'cafe-outline'),
  ('vantilator', 'ev', 10, '{"tr":"Vantilatör","en":"Fan","de":"Ventilator","fr":"Ventilateur","es":"Ventilador","pt":"Ventilador"}', 'aperture-outline'),
  ('klima', 'ev', 20, '{"tr":"Klima","en":"Air Conditioner","de":"Klimaanlage","fr":"Climatiseur","es":"Aire acondicionado","pt":"Ar-condicionado"}', 'thermometer-outline'),
  ('camasir_makinesi', 'ev', 30, '{"tr":"Çamaşır Makinesi","en":"Washing Machine","de":"Waschmaschine","fr":"Lave-linge","es":"Lavadora","pt":"Máquina de lavar"}', 'shirt-outline'),
  ('supurge', 'ev', 40, '{"tr":"Elektrikli Süpürge","en":"Vacuum Cleaner","de":"Staubsauger","fr":"Aspirateur","es":"Aspiradora","pt":"Aspirador"}', 'flash-outline'),
  ('saat', 'ev', 50, '{"tr":"Saat Tik-Takı","en":"Clock Ticking","de":"Tickende Uhr","fr":"Tic-tac d''horloge","es":"Tictac de reloj","pt":"Tique-taque do relógio"}', 'time-outline'),
  ('soba_radyator', 'ev', 60, '{"tr":"Soba ve Radyatör","en":"Stove & Radiator","de":"Ofen & Heizkörper","fr":"Poêle et radiateur","es":"Estufa y radiador","pt":"Aquecedor e radiador"}', 'bonfire-outline'),
  ('kedi_murilti', 'ev', 70, '{"tr":"Kedi Mırıltısı","en":"Cat Purring","de":"Katzenschnurren","fr":"Ronronnement de chat","es":"Ronroneo de gato","pt":"Ronronar de gato"}', 'paw-outline'),
  ('otobus', 'araclar', 10, '{"tr":"Otobüs","en":"Bus","de":"Bus","fr":"Bus","es":"Autobús","pt":"Ônibus"}', 'bus-outline'),
  ('arac_ici', 'araclar', 20, '{"tr":"Araç İçi","en":"Car Interior","de":"Autoinnenraum","fr":"Intérieur de voiture","es":"Interior del coche","pt":"Interior do carro"}', 'car-outline'),
  ('tren', 'araclar', 30, '{"tr":"Tren","en":"Train","de":"Zug","fr":"Train","es":"Tren","pt":"Trem"}', 'train-outline'),
  ('metro_tramvay', 'araclar', 40, '{"tr":"Metro ve Tramvay","en":"Metro & Tram","de":"U-Bahn & Straßenbahn","fr":"Métro et tramway","es":"Metro y tranvía","pt":"Metrô e bonde"}', 'subway-outline'),
  ('ucak_kabin', 'araclar', 50, '{"tr":"Uçak Kabini","en":"Airplane Cabin","de":"Flugzeugkabine","fr":"Cabine d''avion","es":"Cabina del avión","pt":"Cabine do avião"}', 'airplane-outline'),
  ('gemi_feribot', 'araclar', 60, '{"tr":"Gemi ve Feribot","en":"Ship & Ferry","de":"Schiff & Fähre","fr":"Bateau et ferry","es":"Barco y ferri","pt":"Navio e balsa"}', 'boat-outline'),
  ('tir_kamyon', 'araclar', 70, '{"tr":"Tır ve Kamyon","en":"Truck","de":"Lastwagen","fr":"Camion","es":"Camión","pt":"Caminhão"}', 'speedometer-outline'),
  ('kalp_atisi', 'beden', 10, '{"tr":"Kalp Atışı","en":"Heartbeat","de":"Herzschlag","fr":"Battements de cœur","es":"Latidos","pt":"Batimentos cardíacos"}', 'heart-outline'),
  ('nefes', 'beden', 20, '{"tr":"Nefes Ritmi","en":"Breathing Rhythm","de":"Atemrhythmus","fr":"Rythme respiratoire","es":"Ritmo de respiración","pt":"Ritmo de respiração"}', 'fitness-outline'),
  ('rahim', 'beden', 30, '{"tr":"Rahim Sesleri","en":"Womb Sounds","de":"Mutterleib-Klänge","fr":"Sons utérins","es":"Sonidos del vientre","pt":"Sons do útero"}', 'happy-outline'),
  ('binaural', 'frekans', 10, '{"tr":"Binaural (Kulaklık)","en":"Binaural Beats","de":"Binaurale Beats","fr":"Sons binauraux","es":"Tonos binaurales","pt":"Batidas binaurais"}', 'headset-outline'),
  ('izokronik', 'frekans', 20, '{"tr":"İzokronik Tonlar","en":"Isochronic Tones","de":"Isochrone Töne","fr":"Tons isochrones","es":"Tonos isocrónicos","pt":"Tons isocrônicos"}', 'pulse-outline'),
  ('solfeggio', 'frekans', 30, '{"tr":"Solfej Tonları","en":"Solfeggio Tones","de":"Solfeggio-Töne","fr":"Tons solfège","es":"Tonos solfeggio","pt":"Tons solfejo"}', 'infinite-outline'),
  ('tibet_kasesi', 'frekans', 40, '{"tr":"Tibet Kasesi","en":"Singing Bowl","de":"Klangschale","fr":"Bol tibétain","es":"Cuenco tibetano","pt":"Tigela tibetana"}', 'disc-outline'),
  ('gong', 'frekans', 50, '{"tr":"Gong","en":"Gong","de":"Gong","fr":"Gong","es":"Gong","pt":"Gongo"}', 'radio-button-on-outline'),
  ('tiklama', 'asmr', 10, '{"tr":"Tıklama","en":"Tapping","de":"Klopfen","fr":"Tapotement","es":"Golpecitos","pt":"Batidas"}', 'finger-print-outline'),
  ('klavye', 'asmr', 20, '{"tr":"Klavye","en":"Keyboard","de":"Tastatur","fr":"Clavier","es":"Teclado","pt":"Teclado"}', 'keypad-outline'),
  ('sayfa_cevirme', 'asmr', 30, '{"tr":"Sayfa Çevirme","en":"Page Turning","de":"Umblättern","fr":"Pages tournées","es":"Pasar páginas","pt":"Virar páginas"}', 'book-outline'),
  ('kalem_yazi', 'asmr', 40, '{"tr":"Kalem ve Yazı","en":"Pen & Writing","de":"Stift & Schreiben","fr":"Stylo et écriture","es":"Lápiz y escritura","pt":"Caneta e escrita"}', 'pencil-outline'),
  ('firca', 'asmr', 50, '{"tr":"Fırça Sesleri","en":"Brushing","de":"Bürsten","fr":"Brossage","es":"Cepillado","pt":"Escovação"}', 'brush-outline'),
  ('kum_pirinc', 'asmr', 60, '{"tr":"Kum ve Pirinç","en":"Sand & Rice","de":"Sand & Reis","fr":"Sable et riz","es":"Arena y arroz","pt":"Areia e arroz"}', 'hourglass-outline'),
  ('damla', 'asmr', 70, '{"tr":"Su Damlası","en":"Water Drops","de":"Wassertropfen","fr":"Gouttes d''eau","es":"Gotas de agua","pt":"Gotas d''água"}', 'beaker-outline'),
  ('piyano', 'muzik', 10, '{"tr":"Piyano","en":"Piano","de":"Klavier","fr":"Piano","es":"Piano","pt":"Piano"}', 'musical-notes-outline'),
  ('lofi', 'muzik', 20, '{"tr":"Lo-fi","en":"Lo-fi","de":"Lo-fi","fr":"Lo-fi","es":"Lo-fi","pt":"Lo-fi"}', 'musical-notes-outline'),
  ('ambient', 'muzik', 30, '{"tr":"Ambient","en":"Ambient","de":"Ambient","fr":"Ambient","es":"Ambient","pt":"Ambient"}', 'musical-notes-outline'),
  ('gitar', 'muzik', 40, '{"tr":"Gitar","en":"Guitar","de":"Gitarre","fr":"Guitare","es":"Guitarra","pt":"Violão"}', 'musical-notes-outline'),
  ('arp', 'muzik', 50, '{"tr":"Arp","en":"Harp","de":"Harfe","fr":"Harpe","es":"Arpa","pt":"Harpa"}', 'musical-notes-outline'),
  ('muzik_kutusu', 'muzik', 60, '{"tr":"Müzik Kutusu","en":"Music Box","de":"Spieluhr","fr":"Boîte à musique","es":"Caja de música","pt":"Caixa de música"}', 'gift-outline'),
  ('kalimba', 'muzik', 70, '{"tr":"Kalimba","en":"Kalimba","de":"Kalimba","fr":"Kalimba","es":"Kalimba","pt":"Kalimba"}', 'musical-notes-outline'),
  ('cello', 'muzik', 80, '{"tr":"Çello","en":"Cello","de":"Cello","fr":"Violoncelle","es":"Violonchelo","pt":"Violoncelo"}', 'musical-notes-outline'),
  ('synth_pad', 'muzik', 90, '{"tr":"Synth Pad","en":"Synth Pad","de":"Synth Pad","fr":"Synth Pad","es":"Synth Pad","pt":"Synth Pad"}', 'hardware-chip-outline')
on conflict (id) do update set category_id = excluded.category_id, sort_order = excluded.sort_order, labels = excluded.labels, icon = excluded.icon;

-- Başlangıç: herkes güncel (uyarı çıkmaz). Yeni sürüm yayınlanınca:
--   update public.app_config set latest_version = '1.1.0', store_url = '<mağaza linki>' where platform = 'ios';
insert into public.app_config (platform, latest_version, min_version, store_url) values
  ('ios', '1.0.0', '1.0.0', null),
  ('android', '1.0.0', '1.0.0', 'https://play.google.com/store/apps/details?id=com.pulvio.app')
on conflict (platform) do nothing;
