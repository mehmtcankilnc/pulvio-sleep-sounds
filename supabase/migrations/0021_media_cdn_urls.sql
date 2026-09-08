-- Pulvio — ses/görsel dosyaları Supabase Storage'dan Cloudflare R2'ye taşındı.
--
-- R2 bucket key'leri Supabase'dekiyle BİREBİR aynı tutuluyor
-- (tracks/<subcat>/<id>.mp3, covers/<subcat>.png), bu yüzden tek bir host+yol
-- öneki değişimi yeterli — satır içi yol/isim yapısı korunuyor, dolayısıyla
-- src/lib/trackTitle.ts'nin sondaki "/<id>.mp3" parse'ı ve client'taki doğrudan
-- fetch (usePlayerActions.ts) etkilenmiyor.
--
-- Dosyaların R2'ye kopyalanması ayrı ADIM: scripts/migrate-storage-to-r2.mjs
-- Bu migration'ı YALNIZCA dosyalar R2'de doğrulandıktan sonra çalıştır.
--
-- replace() yerine substr() kullanılıyor: URL içinde öneğin ikinci bir kez
-- geçmesi ihtimaline karşı yalnızca baştaki öneği değiştirir.

do $$
declare
  v_old text := 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/';
  v_new text := 'https://cdn.pulvio.mehmtcankilinc.com/';
begin
  update public.tracks
  set storage_url = v_new || substr(storage_url, length(v_old) + 1)
  where storage_url like v_old || '%';

  update public.tracks
  set cover_url = v_new || substr(cover_url, length(v_old) + 1)
  where cover_url is not null
    and cover_url like v_old || '%';
end $$;

-- Doğrulama: her iki sorgu da 0 satır dönmeli (Supabase host'u kalmamalı).
--   select count(*) from public.tracks
--   where storage_url like 'https://bfzuzxsifaycxhhtvrel.supabase.co/%'
--      or cover_url   like 'https://bfzuzxsifaycxhhtvrel.supabase.co/%';

-- ---------------------------------------------------------------------------
-- ROLLBACK (dosyalar Supabase'de silinmediği sürece geçerli):
-- do $$
-- declare
--   v_old text := 'https://cdn.pulvio.mehmtcankilinc.com/';
--   v_new text := 'https://bfzuzxsifaycxhhtvrel.supabase.co/storage/v1/object/public/';
-- begin
--   update public.tracks
--   set storage_url = v_new || substr(storage_url, length(v_old) + 1)
--   where storage_url like v_old || '%';
--   update public.tracks
--   set cover_url = v_new || substr(cover_url, length(v_old) + 1)
--   where cover_url is not null and cover_url like v_old || '%';
-- end $$;
-- ---------------------------------------------------------------------------
