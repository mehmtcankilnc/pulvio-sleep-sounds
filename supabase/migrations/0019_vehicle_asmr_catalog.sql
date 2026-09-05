-- Pulvio — Faz 8: "araclar" (otobus/arac_ici/tren/ucak_kabin) ve "asmr"
-- (tiklama/klavye) üst kategorileri için 25 yeni parça. INSERT-only —
-- 0016'nın aksine mevcut satırlara dokunmuyor (mevcut 99 parçanın
-- cover_url'lerini (0018) ezmemek için delete+reinsert YAPILMIYOR).
-- Ses dosyaları Supabase Storage 'tracks' bucket'ına scripts/upload-audio.mjs
-- ile yüklenir. cover_url şimdilik null (kapaklar sonra üretilecek).
-- Kaynak-of-truth: scripts/catalog.mjs

insert into public.tracks
  (title, category, subcategory, duration, storage_url, cover_url, is_premium_only, license_type, source_url)
values
  ('Otobüs İçi', 'araclar', 'otobus', 127, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/otobus/325676.mp3', null, false, 'Pixabay Content License', 'https://pixabay.com/sound-effects/film-special-effects-rail-bus-interior-ambience-325676/'),
  ('Otobüs İçi 2', 'araclar', 'otobus', 374, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/otobus/52489.mp3', null, false, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-bus-interior-52489/'),
  ('Otoyolda Otobüs', 'araclar', 'otobus', 244, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/otobus/50852.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-bus-interior-highway-2-50852/'),
  ('Şehir Otobüsü', 'araclar', 'otobus', 283, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/otobus/18073.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-bus-interior-stadtbus-18073/'),
  ('Banliyö Otobüsü', 'araclar', 'otobus', 433, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/otobus/48519.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-suburb-bus-48519/'),
  ('Uzun Yol Otobüsü', 'araclar', 'otobus', 458, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/otobus/445523.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-tamil-nadu-bus-inside-soundque-field-recording-445523/'),
  ('Araba İçi Sürüş', 'araclar', 'arac_ici', 286, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/arac_ici/51388.mp3', null, false, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-car-driving-interior-perspective-51388/'),
  ('Şehirde Sürüş', 'araclar', 'arac_ici', 131, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/arac_ici/339218.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/film-special-effects-interior-car-driving-through-city-with-road-noise-and-engine-hum-339218/'),
  ('Yolculuk Başlangıcı', 'araclar', 'arac_ici', 516, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/arac_ici/53122.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-interior-car-start-and-depart-53122/'),
  ('Yolculuk Başlangıcı 2', 'araclar', 'arac_ici', 402, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/arac_ici/16666.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-interior-car-start-and-departure-16666/'),
  ('Kısa Yolculuk', 'araclar', 'arac_ici', 308, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/arac_ici/18350.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-short-drive-interior-18350/'),
  ('Araba İçi Sürüş 2', 'araclar', 'arac_ici', 251, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/arac_ici/17809.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/technology-driving-car-interior-17809/'),
  ('Eski Tren İçi', 'araclar', 'tren', 121, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/tren/169418.mp3', null, false, 'Pixabay Content License', 'https://pixabay.com/sound-effects/film-special-effects-inside-old-train-169418/'),
  ('Şehir Treni', 'araclar', 'tren', 256, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/tren/17869.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-train-17869/'),
  ('Tren', 'araclar', 'tren', 223, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/tren/50499.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-train-50499/'),
  ('Uçak Kabini', 'araclar', 'ucak_kabin', 90, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/ucak_kabin/22955.mp3', null, false, 'Pixabay Content License', 'https://pixabay.com/sound-effects/technology-airplane-atmos-22955/'),
  ('Uçak Kabini 2', 'araclar', 'ucak_kabin', 231, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/ucak_kabin/50622.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/city-airplane-small-inflight-cabin-bahamas-180218-50622/'),
  ('Uçak Kabini 3', 'araclar', 'ucak_kabin', 120, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/ucak_kabin/129404.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/film-special-effects-aircraft-cabin-sound-129404/'),
  ('Karton Kutu Tıklaması', 'asmr', 'tiklama', 423, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/tiklama/294287.mp3', null, false, 'Pixabay Content License', 'https://pixabay.com/sound-effects/film-special-effects-cardboard-box-tapping-asmr-294287/'),
  ('Plastik Tıklama', 'asmr', 'tiklama', 603, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/tiklama/294295.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/film-special-effects-plastic-tapping-asmr-294295/'),
  ('Plastik Kutu Tıklaması', 'asmr', 'tiklama', 602, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/tiklama/294290.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/film-special-effects-plastic-container-tapping-asmr-294290/'),
  ('Kurdele Kutusu Tıklaması', 'asmr', 'tiklama', 602, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/tiklama/294288.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/film-special-effects-ribbon-box-tapping-asmr-294288/'),
  ('Peluş Anahtarlık Tıklaması', 'asmr', 'tiklama', 604, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/tiklama/294285.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/film-special-effects-plush-keychain-taps-asmr-294285/'),
  ('Klavye Yazımı', 'asmr', 'klavye', 308, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/klavye/18347.mp3', null, false, 'Pixabay Content License', 'https://pixabay.com/sound-effects/technology-typing-18347/'),
  ('Mekanik Klavye', 'asmr', 'klavye', 107, 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/tracks/klavye/23537.mp3', null, true, 'Pixabay Content License', 'https://pixabay.com/sound-effects/technology-mechanical-keyboard-23537/');
