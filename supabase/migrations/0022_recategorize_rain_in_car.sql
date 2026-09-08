-- Pulvio — "Arabada Yağmur" / "Rain in the Car" (Pixabay 113602) yanlış
-- kategorideydi: rahatlatici/yagmur altında, "Sakin Yağmur"/"Cama Yağmur"
-- gibi saf yağmur seslerinin yanında duruyordu. Kaydın kendisi bir aracın
-- içinde alınmış bir ortam sesi — araclar/arac_ici'ye taşınıyor (QA bulgusu,
-- docs/ARGENT_TEST_PLAN.md).
--
-- Yalnızca taksonomi kolonları + kapak güncelleniyor. storage_url/source_url
-- DOKUNULMUYOR: ses dosyası fiziksel olarak hâlâ R2'de tracks/yagmur/113602.mp3
-- yolunda (dosya taşımak ayrı bir işlem; doğrudan fetch storage_url'i kullanır,
-- alt kategoriden türetmez). 0017'deki gibi stabil storage_url ile eşleştiriliyor.

update public.tracks
set
  category = 'araclar',
  subcategory = 'arac_ici',
  cover_url = 'https://cdn.pulvio.mehmtcankilinc.com/covers/arac_ici.png'
where storage_url like '%/yagmur/113602.mp3';
