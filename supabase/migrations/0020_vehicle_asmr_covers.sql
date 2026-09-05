-- Pulvio — "araclar" ve "asmr" alt kategorileri için kapak görselleri
-- (AI üretimi, docs/COVER_ART_PROMPTS.md). 0018'in devamı, sadece
-- 0019_vehicle_asmr_catalog.sql ile eklenen 6 alt kategoriyi kapsıyor.
-- Storage yükleme: scripts/upload-covers.mjs

update public.tracks set cover_url = 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/covers/otobus.png' where subcategory = 'otobus';
update public.tracks set cover_url = 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/covers/arac_ici.png' where subcategory = 'arac_ici';
update public.tracks set cover_url = 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/covers/tren.png' where subcategory = 'tren';
update public.tracks set cover_url = 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/covers/ucak_kabin.png' where subcategory = 'ucak_kabin';
update public.tracks set cover_url = 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/covers/tiklama.png' where subcategory = 'tiklama';
update public.tracks set cover_url = 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/covers/klavye.png' where subcategory = 'klavye';
