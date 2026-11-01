# Pulvio — Ses Çeşitlendirme (v4: tek güncelleme, sonrası sadece veri)

Güncelleme: 2026-11-01. Karar: parça başlıkları/çevirileri de istemci güncellemesi istediği için
**bir kez büyük güncelleme (v1.1.0), sonrasında her içerik değişikliği sunucudan**.

## 0. Durum özeti

| Konu | Durum |
|---|---|
| Sunucu güdümlü katalog (migration 0023) | Production'da çalıştırıldı, emülatörde doğrulandı |
| Akıllı arama anahtar kelimeleri (migration 0024) | Production'da çalıştırıldı, 61 alt kategori dolu |
| İçerik | **210 parça** (1.0.0: 124 + yeni 86), 7 kategori / 61 alt kategori, hepsinde parça + kapak var |
| Kapaklar | 38 yeni kapak R2'de; her alt kategori için 480 px WebP önizleme (`covers/t/`) |
| Yeni sürüm uyarısı | Kodda hazır; `app_config` yayından sonra güncellenecek |
| **Yapılmadı** | 1.1.0 EAS build + mağaza gönderimi; `app_config.latest_version` / iOS `store_url`; commit |

## 1. Mimari

| Ne | Eskiden | Şimdi |
|---|---|---|
| Kategori/alt kategori etiketi (6 dil), sıra, ikon | Pakette sabit | Supabase `catalog_categories` / `catalog_subcategories` (`labels` jsonb, `sort_order`, `icon` = Ionicons glyph adı, `keywords` jsonb). Paketli değerler yalnız ilk açılış/çevrimdışı yedeği; AsyncStorage önbelleği var |
| Parça başlığı çevirisi | Pakette `tracks.json` | `tracks.title_i18n` jsonb; yoksa paketli çeviri, o da yoksa TR başlık |
| Yeni sürüm uyarısı | Yok | `app_config` (`latest_version`, `min_version`, `store_url`, `message_i18n`); `UpdatePrompt` sheet'i; `min_version` altında kapatılamaz |
| Yeni parça ekleme | `upload-audio.mjs --sql` (`delete from tracks`, yıkıcı) | `scripts/add-tracks.mjs`: doğrulama + R2 yükleme + **yalnız ekleyen** SQL |
| Arama | Parça başlığında "içerir" | `src/lib/catalogSearch.ts` (bkz. §2) |
| Kapak yükleme | Tam boyutlu PNG her yerde | Listelerde 480 px WebP önizleme (bkz. §3) |

Dosyalar: `scripts/taxonomy.mjs` (taksonomi kaynağı) → `gen-taxonomy-sql.mjs` → migration 0023;
`scripts/search-keywords.mjs` (arama sözlüğü) → `gen-search-keywords-sql.mjs` → migration 0024.
İstemci: `src/lib/catalogStore.ts`, `catalogTaxonomy.ts`, `catalogSearch.ts`, `coverThumb.ts`, `categoryIcon.tsx`,
`trackTitle.ts`, `appUpdate.ts`, `src/hooks/useTracks.ts`, `useAppUpdate.ts`, `src/components/UpdatePrompt.tsx`.

Güncellemesiz yapılabilenler: yeni parça, yeni alt/üst kategori, etiket/çeviri düzeltmesi, sıra, ikon (bir Ionicons
glyph'i), kapak, arama kelimeleri. Hâlâ güncelleme isteyenler: yeni dil, yeni UI/davranış, Ionicons dışı özel ikon.

## 2. Akıllı arama (All categories + Sounds)

Sorgu; alt kategori etiketi (6 dil), `keywords` (6 dil), üst kategori adı ve parça başlıklarında aranır.
Büyük/küçük harf ve diyakritik duyarsız, önek eşleşir, ek almış yazım ("odaklanma" → "odak") ve 1–2 harflik hata
(yer değiştirme dahil) tolere edilir. Üç aşama: tüm kelimeler → herhangi biri → bulanık. Türkçe "bebek" İngilizce
arayüzde de çalışır. İlk kavram ve `!` ile işaretlenenler **birincil** (etiket gibi öne çıkar): "bebek" → önce rahim,
kalp atışı, müzik kutusu, beyaz/kahverengi gürültü; dolaylı olanlar (vantilatör, süpürge) altta.

- Kaynak: `scripts/search-keywords.mjs` — `CONCEPTS` (kavram → 6 dilde kelimeler) + `SUB_CONCEPTS` (alt kategori → kavramlar).
- Yeni alt kategori eklerken `SUB_CONCEPTS`'e satır ekle → `node scripts/gen-search-keywords-sql.mjs` → çıkan
  `0024_catalog_search_keywords.sql`'i çalıştır (idempotent `update`).
- Kelimeler ayrı sorguyla çekilir: `keywords` kolonu yoksa/hata verirse taksonomi bozulmaz, arama yalnız etiket + başlıkla çalışır.
- Test: arama mantığı Node'da `catalogSearch.ts` derlenerek denendi; emülatörde "baby", "bebek", "yagmru" doğrulandı.

## 3. Kapak önizlemeleri

Kutular ~160×112 dp gösterir ama kapaklar 1254×1254 PNG (~2 MB). `scripts/make-cover-thumbs.mjs`
CDN'deki `covers/<slug>.png`'yi 480×480 WebP'ye çevirip `covers/t/<slug>.webp`'ye yükler (61 kapak ≈ 0,7 MB; PNG'ler ≈ 115 MB).
İstemci (`coverThumb.ts`) `.../covers/<slug>.png` adresini `.../covers/t/<slug>.webp`'ye çevirir; yüklenemezse bir kez
tam boyutlu kapağa, o da olmazsa ikona düşer. Kategori ekranı açılınca önizlemelerin hepsi önceden indirilir.
Oyuncu ekranı tam boyutlu kapağı kullanır; **1.0.0** hâlâ PNG'leri çeker (silme!).

Yeni/yenilenen kapak: `node scripts/upload-covers.mjs "<slug adlı png klasörü>"` → `node scripts/make-cover-thumbs.mjs [slug,...]`
→ `node scripts/upload-covers.mjs --sql --only=<slug,...>` çıktısını çalıştır. Kapağı DEĞİŞTİRİYORSAN dosya adını
değiştir ya da önbellekle ilgili bilgi ver: R2 nesneleri `immutable`, cihazlarda eski görsel kalabilir.
`add-tracks.mjs --sql`, alt kategoride kapaklı parça yoksa `covers/<alt_kategori>.png` adresini kullanır.

## 4. Taksonomi (7 üst kategori, 61 alt kategori; +3 / +38)

| Kategori | Alt kategoriler (yeni olanlar **kalın**) |
|---|---|
| `rahatlatici` | yağmur, **çadır yağmuru**, **şehir yağmuru**, gök gürültüsü, deniz, **göl kıyısı**, dere, **şelale**, **mağara damlası**, kuş sesi, orman, **yağmur ormanı**, rüzgâr, **rüzgâr çanı**, **kar-kış**, gece böcekleri, **kurbağa-gölet**, ateş, fön makinesi, beyaz/kahverengi/pembe gürültü, kafe |
| **`ev`** | vantilatör, klima, çamaşır makinesi, süpürge, saat tik-takı, soba-radyatör, kedi mırıltısı |
| `araclar` | otobüs, araç içi, tren, **metro-tramvay**, uçak kabini, **gemi-feribot**, **tır-kamyon** |
| **`beden`** | kalp atışı, nefes ritmi, rahim sesleri |
| **`frekans`** | binaural (kulaklık), izokronik, solfej tonları, tibet kasesi, gong |
| `asmr` | tıklama, klavye, **sayfa çevirme**, **kalem-yazı**, **fırça**, **kum-pirinç**, **su damlası** (hepsi mekanik, insan sesi yok) |
| `muzik` | piyano, lo-fi, ambient, **gitar**, **arp**, **müzik kutusu**, **kalimba**, **çello**, **synth pad** |

Solfej/binaural için **sağlık iddiası yazma**. Pembe gürültü en çok araştırılan tür, beyaz karışık, kahverengi zayıf
([Harvard Health](https://www.health.harvard.edu/staying-healthy/can-white-noise-really-help-you-sleep-better)) — uygulama metninde "klinik kanıtlı" deme.

## 5. Dalgalar (hepsi R2'de ve DB'de, id'ler `tracks/<alt_kategori>/<id>.mp3`)

| Dalga | Kaynak | Parça | id | Betik / batch |
|---|---|---|---|---|
| 1 | Üretilmiş (ffmpeg): gürültü varyantları, binaural, izokronik, solfej | 17 | 9000001–17 | `generate-wave1.mjs` / `dalga1.json` |
| 2 | Freesound CC0 + CC0'dan türetilen rahim miksleri | 7 | 20_000_000+Freesound id, 9100001–2 | `process-freesound.mjs` / `dalga2.json` |
| 3 | Pixabay (tibet kasesi, vantilatör, çadır, şelale, rüzgâr çanı, kalimba…) | 11 | Pixabay id | `process-pixabay.mjs` / `dalga3.json` |
| 4 | Üretilmiş: kar-kış, tır, klima, radyatör, saat, süpürge, mağara damlası, synth pad | 15 | 9000018–32 | `generate-wave4.mjs` / `dalga4.json` |
| 5 | Pixabay (şehir/orman yağmuru, göl, kurbağa, damla, ev aletleri, metro, gong, ASMR, gitar/arp/çello…) | 36 | Pixabay id | `process-pixabay-wave5.mjs` / `dalga5.json` |

Sentez sesler (saat, süpürge, mağara damlası, synth pad) gerçek kayıttan yapay duyulabilir; beğenilmezse Freesound CC0'dan
gerçeği aranır. Orijinal indirmeler/kapaklar yerelde `out/originals/{covers,tracks}/` altında (gitignore'da, yedeklenmedi).

## 6. Yayın sırası (kalan adımlar)

1. ✅ Migration 0023, 0024 çalıştırıldı (yeni build'den ÖNCE şarttı).
2. ✅ Sürüm 1.1.0 (`app.json`, `package.json`). Android `versionCode`'u EAS (remote, autoIncrement) yönetir.
3. ⏳ EAS build (iOS + Android), mağazalara gönder.
4. ⏳ Onay + yayın sonrası: `update app_config set latest_version='1.1.0', store_url='<App Store linki>' where platform='ios';`
   (iOS `store_url` null ise iOS'ta uyarı hiç çıkmaz; Android Play linkine düşer).
5. **Eski v1.0.0 kullanıcıları yeni hiçbir parça görmez** (ham slug / varsayılan ikon / yabancı dilde TR başlık yok):
   - *Sunucu:* yeni istemci `x-app-version` başlığı gönderir. `tracks` RLS politikası (`client_version_at_least`) `min_client_version`
     dolu parçaları 1.0.0'a gizler. `add-tracks.mjs` **her** yeni parçaya `'1.1.0'` yazar.
   - *İstemci:* 1.1.0, taksonomisinde karşılığı olmayan alt kategorideki parçayı listelemez.
   - Doğrulandı: başlıksız istek 124 parça, `x-app-version: 1.1.0` 210 parça görür.

## 7. Yeni parça akışı (v1.1.0 sonrası, güncellemesiz)

1. mp3'leri klasöre indir, dosya adı **sonunda sayısal id** (`...-20123456.mp3`).
2. `scripts/batches/<ad>.json` yaz (şablon: `_example.json`): TR başlık + 5 dilde `i18n`, premium, süre, lisans, kaynak. İşleme
   için `process-pixabay-wave5.mjs`'i şablon al (efekt −26 LUFS, müzik −24 LUFS, kısa efekt `acrossfade` döngüsü).
3. `node scripts/add-tracks.mjs <batch> --check` (alt kategori var mı, id çakışması, i18n eksik, <3 dk uyarısı).
4. `… --upload "<klasör>" [--dry]` (R2: yeni anahtar, `immutable` cache).
5. `… --sql > out/<ad>.sql` → SQL editörde çalıştır (PowerShell'de panoya: `Get-Content <dosya> -Raw -Encoding UTF8 | Set-Clipboard`;
   `-Encoding UTF8` olmazsa Türkçe karakterler bozulur). Parçalar anında uygulamada.
6. Yeni alt kategori: `taxonomy.mjs` → `gen-taxonomy-sql.mjs` (0023, idempotent) + `search-keywords.mjs` →
   `gen-search-keywords-sql.mjs` (0024) → ikisini çalıştır; kapak için §3.
7. Sürüm duyurusu: `app_config.latest_version`'ı yükselt (yalnız yeni **istemci** sürümü çıkınca anlamlı).

## 8. Tuzaklar

- Aynı alt kategoride sıra: ücretsiz önce, sonra yerelleştirilmiş başlığa göre alfabetik.
- Ücretsiz parça = premium dönüşüm kaldıraçı: yeni parçaların çoğu premium; yeni alt kategorilerde 1 ücretsiz yeter.
- Kısa kayıt loop'ta dikiş duyulur → ≥3 dk ya da `acrossfade`; 128 kbps mp3, `loudnorm`. Seyrek tıklı sesler (saat) ortalama LUFS'ta düşük çıkar, elle yükselt.
- R2 `immutable`: aynı anahtarın üstüne yazma.
- Eski `upload-audio.mjs --sql` hâlâ `delete from tracks` ile başlar; yeni parça için **kullanma**.
- Emülatörler AVD snapshot'ından açılır, kurulumlar sıfırlanabilir. Dev client yoksa:
  `adb uninstall com.pulvio.app`, sonra `npx expo run:android --no-bundler --device <AVD>`,
  `exp+pulvio://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081` ile bağlan. "Property 'MessageQueue' doesn't exist" = eski native dev client + yeni JS.
- Kaynak lisansı: Pixabay "standalone" maddesi gri alan, bilinçli kabul edildi (loudnorm + dikişsiz loop "işlenmiş içerik" argümanını güçlendirir);
  Freesound yalnız CC0. Kullanma: Zapsplat / ElevenLabs SFX / Mixkit, markalı oyun/film sesi, insan sesi/fısıltı.
