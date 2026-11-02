# Hesap açma ve ilk hafta rehberi

Hesapları sen açacaksın (kimlik doğrulama, e-posta/telefon onayı sende). Platformların ayarları sık değişir; aşağıdaki menü isimleri uygulamada biraz farklı görünürse mantığı takip et.

**Durum:** Gmail `pulviosleep@gmail.com`, TikTok + Instagram `pulviosleep` açıldı, bio ve profil fotoğrafı tamam. Sırada: YouTube kanalı (handle `@pulviosleep`), campaign linkleri, ilk video.

## 1. Hazırlık (10 dk)

- **E-posta:** Üçü için aynı e-posta. Kişisel Gmail yerine ayrı bir adres tercih edersen kurtarma işlerin ayrışır, ama zorunlu değil.
- **Kullanıcı adı:** Üç platformda da aynı olsun. Sırayla dene: `pulvio.sleep`, `pulvio.app`, `getpulvio`, `pulviosleep`. Önce üçünde de müsait olanı kontrol et, sonra hepsini aynı gün al.
- **Profil fotoğrafı:** `assets/icon.png` (ay + bulut ikonu).
- **Görünen ad:** `Pulvio · Sleep Sounds`
- **Bio (İngilizce, tüm platformlar):**
  ```
  Sleep sounds that fade out on their own.
  Rain · lake · brown noise · more
  Free on the App Store 👇
  ```
  (Google Play'den bahsetme, Android yok.)

## 2. App Store campaign linkleri (her platform ayrı)

Hangi platformun indirme getirdiğini görmek için:

1. App Store Connect → uygulamanı aç → **App Analytics** → **Campaigns** (veya Acquisition → Campaigns) → yeni kampanya linki oluştur.
2. Üç link üret: `tiktok`, `instagram`, `youtube` (campaign token olarak).
3. Link şu biçimde olur: `https://apps.apple.com/app/id<UYGULAMA_ID>?pt=<PROVIDER>&ct=tiktok&mt=8`
4. Her platformun bio'suna kendi linkini koy. Linkleri `marketing/tracking/links.md` dosyasına yapıştır, ben tabloya bağlarım.

> Uygulama ID'si `6813647835`, hazır linkler `marketing/tracking/links.md` içinde.

## 3. Platforma özel kurulum

### TikTok
> **Güncel durum:** Hesapta "Switch to Business Account" yok (sadece şirket doğrulaması isteyen "Verified Business Account"), Website alanı da yok. Bio'da `Search "Pulvio" on the App Store` yazıyor. Link alanı açılınca (genelde 1.000 takipçi) `tiktok` campaign linki eklenecek. Aşağıdaki Business önerisi bu hesapta uygulanamadı.

- Kayıt: e-posta/telefon. Kayıttan sonra **Settings → Account → Switch to Business Account**, kategori "Health & Wellness" veya "Apps".
- Neden Business: bio'ya **link hemen eklenebiliyor**. Kişisel hesapta link için genelde 1.000 takipçi gerekiyor. Business hesapta trend olan ticari olmayan müziklere erişim kısıtlı, ama biz kendi sesimizi videoya gömdüğümüz için sorun olmaz. (Önceki önerimi bu yüzden değiştirdim; ekranda farklı görürsen kontrol et.)
- Videoyu **dosya olarak** yükle (MP4). TikTok'tan indirilmiş watermark'lı kopya yükleme.

### Instagram
- Kayıt sonrası **Settings → Account type and tools → Switch to professional account → Creator**. Insights (izlenme süresi, kaydetme, paylaşma) bunun için açılır.
- Reels yüklerken **kapak** olarak `out/covers/<video>.png` dosyasını seç (Edit cover → Add from camera roll). Profil ızgarasında 3:4 kırpılıyor, kapaklar buna göre tasarlandı.
- Bio linki: tek link alanı, Instagram campaign linkini koy.

### YouTube
- Google hesabı → **YouTube → Create a channel**. Kanal adı `Pulvio · Sleep Sounds`.
- Kanal ayarlarında telefon doğrulaması yap (özel küçük resim ve daha uzun videolar için gerekir).
- Shorts: dikey MP4'ü yükle, başlık + `#shorts`. Shorts açıklamasındaki linkler tıklanmıyor; link için **kanal → Customize channel → Links** bölümüne YouTube campaign linkini koy.
- Özel küçük resim Shorts'ta çoğu zaman görünmez, ama yüklenmesinde zarar yok.

## 4. Paylaşım ayarları

- **AI etiketi:** Videolardaki kapak görselleri yapay zekâyla üretilmiş fotoğraf gibi görünüyor. Platformların "AI-generated" / "altered content" seçeneği çıkarsa **işaretle**. Gerçekçi görünen AI görselinde etiket zorunlu olabilir ve etiketsiz bırakmanın erişime zararı, etiketin zararından büyük olabilir.
- **Zamanlama:** Hedef kitle İngilizce konuşan; en iyi saat yerel akşam 21:00-23:00. ABD Doğu saatinde bu, Türkiye'de sabaha karşı demek. Gece uyanmamak için her platformun kendi zamanlayıcısını kullan: TikTok web (tiktok.com/upload), Meta Business Suite (Instagram), YouTube Studio.
- **Sabitlenmiş yorum:** Her videoda ilk yorumu sen at ve sabitle (aşağıdaki "yorum" sütunu).
- **Hesabı ısıt:** İlk gün 1 video yükle, ilk 2-3 gün içinde de platformun ana akışında 10-15 dk gez ve hikâyeleri/videoları izle. Yeni hesaba aynı gün 7 video basma.

## 5. İlk hafta planı

| Gün | Video | Başlık/caption | Sabit yorum |
|---|---|---|---|
| 1 | `pendulum-wave` (sessiz, müzikli) | `Wait for the end. (sound on)` | `Did you stay for the end? 🎹` |
| 2 | `night-hook` (Ava) | `3 AM thoughts hit different 🌙 Put this on instead.` | `What keeps you up? 👇` |
| 3 | `orbit-wave` (sessiz, müzikli) | `Watch them line up. (sound on)` | `Did you wait for the end? 🌙` |
| 4 | `stare-challenge` (Andrew) | `Don't look away. 10 seconds.` | `What did your hand look like? 👀` |
| 5 | `sound-cycle` (Brian) | `3 sounds. Pick one and tell me why.` | `Comment 1, 2 or 3 🌧️` |
| 6 | `fade-out` (Andrew) | `Press play. Close your eyes. It fades out on its own.` | `Sleep timer, not a playlist.` |
| 7 | `pov-3am` (Brian) | `POV: it's 3 AM and your brain won't shut up` | `Save this for tonight.` |
| 8 | `pick-one` (Ava) | `Which one are you sleeping to tonight?` | `1, 2 or 3?` |
| 9 | `cover-focus` (sessiz) | `Rain on a tent. Leave it on.` | `Save for later 💤` |
| 10 | `rain-loop` (sessiz) | `Rain on the roof, 20 seconds of calm.` | `Which sound next?` |

Sesler: her video tek bir sesle okunuyor, üç ses (Ava, Brian, Andrew) farklı videolara dağıtıldı, art arda iki videoda aynı ses yok. `cover-focus` ve `rain-loop` bilerek sessiz (sadece ortam sesi). Sentetik ses olduğu için platformda AI etiketi seçeneği çıkarsa işaretle.

Hook videoları (`pendulum-wave`, `orbit-wave`, `stare-challenge`) uygulamayla doğrudan ilgili değil, amaç dikkat çekmek: bu ikisine uyku etiketlerine ek olarak `#satisfying #oddlysatisfying` ekle. Videonun son 3 saniyesi uygulamayı tanıtıyor.

**Hashtag'ler (3-5 tane yeter):** `#sleep #sleepsounds #insomnia #rainsounds #whitenoise`. TikTok'ta ilk satır hook'u tekrar etsin, hashtag'ler sonda.

## 6. Ölçüm

- Her paylaşımdan sonra satırı `marketing/tracking/posts.csv` dosyasına ekle (video id, platform, tarih, link).
- 48 saat sonra metrikleri doldur: izlenme, ortalama izlenme süresi, tamamlanma %, kaydetme, paylaşma, profil ziyareti.
- App Store Connect → App Analytics'te campaign'lere bak, `installs_est` sütununa yaz.
- Bir hafta sonunda `pulvio-content` ajanından sonuçları okuyup ikinci haftanın planını çıkarmasını iste.

## 7. Caption formülü (keşfet için)

Araştırma özeti (kaynaklar çoğunlukla üçüncü taraf blogları, resmî doküman değil; çelişen yerler var):
- Caption bir arama indeksi gibi çalışıyor: **ana anahtar kelimeyi ilk ~150 karaktere** koy, videoda konuşulan/yazan kelimelerle uyumlu olsun.
- Hashtag sayısı **3-5**. Instagram Aralık 2025'ten beri en fazla 5'e izin veriyor (ikincil kaynaklara göre). Hashtag'ler erişimi artırmaz, konuyu etiketler. Instagram yetkilileri izlenme süresi, beğeni ve gönderme (send) sinyallerini öne çıkarıyor.
- Hashtag ve anahtar kelimeleri **caption'a** yaz, yoruma değil.
- YouTube Shorts'ta başlık temiz ve hook'lu olsun, 3-5 hashtag açıklamanın başına, başlıkta en fazla 1-2.
- Güncel trend etiketler için TikTok Creative Center ve uygulamanın arama önerilerine bak; ben canlı trend verisine ulaşamıyorum.
- Paylaşım/gönderme sinyali için caption'a bir "send this to ..." çağrısı ekle.

Şablon: `[Hook + anahtar kelimeler] + [1-2 cümle içerik] + [paylaşma çağrısı] + [uygulama bağı] + [3-5 hashtag]`

### `pendulum-wave` hazır caption'lar

**TikTok** (bio'da link yok, o yüzden arama cümlesi):
```
Wait for the end 🎹 Satisfying pendulum wave with relaxing kalimba music. Sound on, everything lines up perfectly at the end.
Send this to someone who can't sleep 🌙
More calming sounds for sleep: search "Pulvio" on the App Store.
#satisfying #oddlysatisfying #relaxingvideo #sleepsounds #pendulumwave
```

**Instagram Reels** (bio'da link var):
```
Wait for the end 🎹 Satisfying pendulum wave with relaxing kalimba music. Sound on, everything lines up perfectly at the end.
Send this to someone who can't sleep 🌙
More calming sounds for sleep in Pulvio, link in bio.
#satisfying #oddlysatisfying #relaxingvideo #sleepsounds #pendulumwave
```

**YouTube Shorts**
- Başlık: `Pendulum Wave 🎹 Satisfying Relaxing Music, Wait for the End #shorts`
- Açıklama:
```
#satisfying #relaxing #sleepsounds #pendulumwave #shorts
Satisfying pendulum wave with relaxing kalimba music. Watch until the end, everything lines up perfectly. Sound on.
Send this to someone who can't sleep.
More calming sounds for sleep: search "Pulvio" on the App Store.
```

Sabit yorum: `Did you stay for the end? 🎹 Send this to someone who needs to relax.`

## 8. Yükleme saatleri (Türkiye saati)

ABD'de kış saati 1 Kasım 2026'da başladı: Doğu saati (ET) = UTC-5, Pasifik (PT) = UTC-8, Türkiye = UTC+3 (yıl boyu). Fark: ET'den +8 saat, PT'den +11 saat. ABD yaz saatine 14 Mart 2027'de geçince fark ET için +7 saate düşer, saatleri o zaman bir saat öne al.

| Hedef (ABD) | Türkiye saati |
|---|---|
| 21:00 ET (18:00 PT), ana slot | **05:00** |
| 22:00 ET (19:00 PT) | 06:00 |
| 12:00-13:00 ET (öğle arası), deneme slotu | 20:00-21:00 |

Platform zamanlayıcıları cihazının saat dilimini (Türkiye) kullanır, saati TR olarak gir.

Plan: Her gün 05:00 TR (ana slot). Bir hafta sonra bir-iki videoyu 20:00 TR'de (öğle slotu) yükleyip karşılaştır, `posts.csv`'deki `notes` sütununa "slot=20:00" yaz.

| Tarih (TR) | Video |
|---|---|
| 3 Kasım 05:00 | `night-hook` |
| 4 Kasım 05:00 | `orbit-wave` |
| 5 Kasım 05:00 | `stare-challenge` |
| 6 Kasım 05:00 | `sound-cycle` |
| 7 Kasım 05:00 | `fade-out` |
| 8 Kasım 05:00 | `pov-3am` |
| 9 Kasım 05:00 | `pick-one` |
| 10 Kasım 05:00 | `cover-focus` |
| 11 Kasım 05:00 | `rain-loop` |

### `night-hook` hazır caption'lar (3 Kasım 05:00 TR)

**TikTok:**
```
3 AM and your brain won't stop? 🌙 Racing thoughts, overthinking, can't sleep... put this on instead. Calming lake sounds to help you wind down.
Send this to someone who's awake right now.
More sleep sounds: search "Pulvio" on the App Store.
#cantsleep #overthinking #insomnia #sleepsounds #relaxing
```

**Instagram Reels:** Aynı metin, son satır `More sleep sounds in Pulvio, link in bio.`

**YouTube Shorts**
- Başlık: `3 AM Racing Thoughts? Try This Instead 🌙 #shorts`
- Açıklama:
```
#cantsleep #overthinking #insomnia #sleepsounds #shorts
Can't sleep at 3 AM because your brain won't stop? Put on calming lake sounds and let your thoughts slow down.
Send this to someone who's awake right now.
More sleep sounds: search "Pulvio" on the App Store.
```

Sabit yorum: `What keeps you up at 3 AM? 👇 Send this to someone who's awake right now.`
Bu videoda ses sentetik (Ava): platform AI etiketi sunarsa işaretle.
