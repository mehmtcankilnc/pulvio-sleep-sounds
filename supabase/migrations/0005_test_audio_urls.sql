-- Pulvio — Faz 3: GEÇİCİ test amaçlı ses URL'leri.
-- Seed migration'daki (0004) placeholder://... adresleri gerçekte oynatılamaz.
-- Player mekanizmasını test edebilmek için herkese açık, HTTPS, mp3 formatında
-- SoundHelix örnek dosyalarına geçici olarak yönlendiriyoruz.
-- Gerçek telifsiz (CC0) uyku sesleri Supabase Storage'a yüklenince bu satırlar
-- gerçek storage_url'lerle güncellenecek — bkz. pulvio-audio-sourcing memory.

update public.tracks set storage_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  where title = 'Yağmur Sesi';
update public.tracks set storage_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  where title = 'Deniz Dalgaları';
update public.tracks set storage_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  where title = 'Orman Kuşları';
update public.tracks set storage_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  where title = 'Fön Makinesi';
update public.tracks set storage_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  where title = 'Beyaz Gürültü';
update public.tracks set storage_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  where title = 'Sakin Piyano';
update public.tracks set storage_url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  where title = 'Lo-fi Uyku';
