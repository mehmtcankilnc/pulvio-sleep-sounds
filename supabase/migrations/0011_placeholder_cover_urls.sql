-- Pulvio — GEÇİCİ test amaçlı kapak görseli URL'leri.
-- 0004/0005'teki seed track'lerin cover_url alanı hep null'du; Explore
-- ekranındaki kategori kartlarının fotoğraf tedavisini uçtan uca
-- doğrulayabilmek için picsum.photos'un seed'li (deterministik, sabit)
-- placeholder görsellerine geçici olarak yönlendiriyoruz.
-- Gerçek, lisansı temiz kapak görselleri hazır olunca bu satırlar gerçek
-- storage_url'lerle güncellenecek — bkz. pulvio-audio-sourcing memory.

update public.tracks set cover_url = 'https://picsum.photos/seed/pulvio-water/400/300'
  where title in ('Yağmur Sesi', 'Deniz Dalgaları');
update public.tracks set cover_url = 'https://picsum.photos/seed/pulvio-birds/400/300'
  where title = 'Orman Kuşları';
update public.tracks set cover_url = 'https://picsum.photos/seed/pulvio-fan/400/300'
  where title = 'Fön Makinesi';
update public.tracks set cover_url = 'https://picsum.photos/seed/pulvio-noise/400/300'
  where title = 'Beyaz Gürültü';
update public.tracks set cover_url = 'https://picsum.photos/seed/pulvio-piano/400/300'
  where title = 'Sakin Piyano';
update public.tracks set cover_url = 'https://picsum.photos/seed/pulvio-lofi/400/300'
  where title = 'Lo-fi Uyku';
