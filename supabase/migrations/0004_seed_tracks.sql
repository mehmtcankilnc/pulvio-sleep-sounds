-- Pulvio — Faz 2: Keşfet ekranını test edebilmek için örnek track'ler.
-- storage_url'ler henüz gerçek ses dosyalarına işaret etmiyor (placeholder) —
-- gerçek telifsiz içerik kaynakları sonraki bir fazda yüklenecek.

insert into public.tracks
  (title, category, subcategory, duration, storage_url, is_premium_only, license_type, source_url)
values
  ('Yağmur Sesi', 'rahatlatici', 'su_sesi', 1800, 'placeholder://rain.mp3', false, 'CC0', null),
  ('Deniz Dalgaları', 'rahatlatici', 'su_sesi', 2400, 'placeholder://waves.mp3', false, 'CC0', null),
  ('Orman Kuşları', 'rahatlatici', 'kus_sesi', 1500, 'placeholder://birds.mp3', false, 'CC0', null),
  ('Fön Makinesi', 'rahatlatici', 'fon_makinesi', 1200, 'placeholder://hairdryer.mp3', true, 'CC0', null),
  ('Beyaz Gürültü', 'rahatlatici', 'beyaz_gurultu', 3600, 'placeholder://white-noise.mp3', false, 'CC0', null),
  ('Sakin Piyano', 'muzik', 'piyano', 2100, 'placeholder://piano.mp3', true, 'CC0', null),
  ('Lo-fi Uyku', 'muzik', 'lofi', 2700, 'placeholder://lofi.mp3', true, 'CC0', null);
