# Pulvio — Kapak Görseli Prompt'ları

17 alt kategori için AI görsel üretim prompt'u (Midjourney, DALL·E, Stable Diffusion, vb. hepsinde çalışır). Amaç: jenerik "AI slop" değil, gerçek bir ambient/uyku müziği albüm kapağı gibi duran, tek bir sahne/objeye odaklanan, sakin fotoğraflar.

## Neden böyle yazıldı

- **"Stunning, 8k, trending, hyperrealistic" gibi jenerik büyüteç kelimeler yok** — bunlar AI slop'un imzası. Onun yerine somut kamera/ışık/kompozisyon detayları var (tek sıcak ışık kaynağı, sığ alan derinliği, film grain, negatif alan).
- **Tek obje/sahne, minimal kompozisyon** — DESIGN.md'nin "restrained, no clutter" ilkesiyle uyumlu, küçük kart boyutunda da okunaklı kalır.
- **Sıcak tonlar tercih edildi** — uygulama her kapağa otomatik bir ember (peach) ton bindirip alt kısmı karartıyor (`(tabs)/index.tsx`'teki `CategoryCard`). Kaynak görsel zaten sıcak/nötr tonlardaysa bu bindirme doğal durur; mavi/yeşil ağırlıklı görseller sıcak tonla çamurlaşır — o yüzden hiçbir prompt'ta mavi/yeşil vurgusu yok.
- **İnsan yüzü / metin / logo yok** — küçük kartta hem gereksiz hem de çoğu üretici modelde en çok bozulan öğeler.

## Ortak negatif prompt (her birine ekle)

```
no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast
```

## Teknik notlar

- **Format:** 1:1 kare, en az 1024×1024.
- **Genel stil çerçevesi** (her prompt'un başına eklenebilir, tekrarı azaltmak için): *"Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space."*

---

## rahatlatıcı

### yagmur — Yağmur
```
Rain streaking down a dark window pane at night, soft warm light bleeding through
from indoors, water droplets catching amber highlights, city lights blurred in
soft bokeh beyond the glass, intimate close framing, moody minimalist album-cover
photograph, single warm light source, deep shadows, subtle film grain.
```

### deniz — Deniz
```
A dark, calm night ocean under a single low amber moon, long-exposure smoothed
water, faint horizon line, vast negative sky, subtle warm reflection trail on
the water, moody minimalist album-cover photograph, deep shadows, film grain.
```

### dere — Dere
```
A narrow forest stream at dusk, water catching the last warm light between dark
tree trunks, smooth long-exposure motion blur on the current, mossy stones,
intimate low-angle framing, moody minimalist album-cover photograph, film grain.
```

### gok_gurultusu — Gök Gürültüsü
```
A distant lightning bolt cracking across a heavy night sky over a dark horizon,
warm amber afterglow at the cloud edges, storm clouds as deep charcoal masses,
wide minimal composition, moody album-cover photograph, subtle film grain.
```

### kus_sesi — Kuş Sesi
```
A single bird silhouette perched on a bare branch against a soft warm dawn-lit
sky, backlit and minimal, faint mist in the background, large negative space,
restrained moody album-cover photograph, subtle film grain.
```

### orman — Orman
```
Deep forest interior at dusk, thin shafts of warm amber light cutting through
dense dark tree trunks and low mist, textured bark in foreground shadow, quiet
enclosed framing, moody minimalist album-cover photograph, film grain.
```

### ruzgar — Rüzgâr
```
Tall dry grass bending in a strong wind under a dim warm-lit dusk sky, motion
blur on the grass, dark low horizon, minimal open composition, moody album-cover
photograph, subtle film grain, single warm light source.
```

### gece_bocekleri — Gece Böcekleri
```
Extreme close-up macro of dew on a blade of grass at night, one soft warm
out-of-focus light glowing in the deep black background, a tiny insect silhouette
barely visible, intimate and quiet, moody macro album-cover photograph, film grain.
```

### ates — Ateş
```
Close-up of glowing embers and low flame in a dark hearth, warm ember-orange
light as the only source, soft smoke drifting, shallow depth of field, intimate
framing, moody minimalist album-cover photograph.
```

### fon_makinesi — Fön Makinesi / Vantilatör
```
Abstract warm heat-shimmer air distortion over a dark charcoal background, a
faint amber gradient glow at one edge, smooth minimal texture, no discernible
objects, abstract moody album-cover art, subtle film grain.
```

### beyaz_gurultu — Beyaz Gürültü
```
Fine analog film grain and soft static texture over a near-black background, a
faint warm amber gradient glow in one corner, abstract and textural, no
discernible subject, moody minimalist album-cover art.
```

### kahverengi_gurultu — Kahverengi Gürültü
```
Soft out-of-focus warm amber and umber tonal gradient, heavy analog film grain
over deep brown-black, smooth low-frequency texture, abstract and calm, moody
minimalist album-cover art.
```

### pembe_gurultu — Pembe Gürültü
```
Soft blurred gradient wash between deep plum and warm amber, fine grain texture,
abstract tonal field, calm and even, no discernible subject, moody minimalist
album-cover art.
```

### kafe — Kafe
```
A dim, empty café interior at closing time, one warm pendant light glowing over
an empty wooden table, soft bokeh from string lights in the background, quiet
and still, no people, moody minimalist album-cover photograph, film grain.
```

## müzik

### piyano — Piyano
```
Close-up of piano keys under a single warm desk lamp in an otherwise dark room,
shallow depth of field, dust particles visible in the light beam, intimate and
still, moody minimalist album-cover photograph, subtle film grain.
```

### lofi — Lo-fi
```
A cozy dim bedroom windowsill at night, warm lamp light glowing with soft rain
reflections on the glass, blurred city lights beyond, intimate nostalgic framing,
no people, moody minimalist album-cover photograph, film grain.
```

### ambient — Ambient
```
Slow-drifting soft cloud-like haze against a near-black background, one warm
amber light source glowing softly through the fog, minimal and weightless,
long-exposure smoothness, moody minimalist album-cover art, subtle film grain.
```

---

## araçlar (2026-09-05 — kataloğa eklendi, bkz. pulvio-audio-sourcing belleği)

Aynı ortak stil çerçevesi ve negatif prompt geçerli. Slug'lar `scripts/catalog.mjs`
ile birebir eşleşiyor (önceki taslak "araba"/"ucak" isimleriydi, gerçek
taksonomide `arac_ici`/`ucak_kabin` oldu — bu bölüm o değişikliğe göre
güncellendi).

### otobus — Otobüs
```
Interior of a dim, empty city bus at night, warm amber overhead light glowing
above rows of empty seats, motion-blurred streetlights streaking past the
windows, quiet and rhythmic framing, no people, moody minimalist album-cover
photograph, subtle film grain.
```

### arac_ici — Araç İçi
```
Interior of a car at night seen from the back seat, warm dashboard light glow,
motion-blurred amber streetlights streaking past the windows, rain droplets on
the glass, quiet and enclosed framing, no people, moody minimalist album-cover
photograph, subtle film grain.
```

### tren — Tren
```
Interior of a dim, empty overnight train car, warm amber reading-light glow
above a single empty seat, motion-blurred dark landscape streaking past the
window, quiet and rhythmic framing, no people, moody minimalist album-cover
photograph, subtle film grain.
```

### ucak_kabin — Uçak Kabini
```
Interior of a dim airplane cabin at night, warm reading-light glow from a
single overhead lamp, a round window showing a faint amber horizon glow against
deep blue-black sky outside, quiet and still, no people, moody minimalist
album-cover photograph, subtle film grain.
```

## asmr (2026-09-05 — kataloğa eklendi, insan sesi/fısıltı İÇERMEYEN mekanik
tetikleyicilerle sınırlı — bkz. pulvio-audio-sourcing belleği)

Önceki taslakta "firca"/"kagit"/"mikrofon" vardı; gerçek kaynak taramasında bu
üçü için yeterli/uzun Pixabay kaydı bulunamadı, yerine `tiklama` (kutu/yüzey
tıklaması) ve `klavye` (mekanik klavye) geldi. Aynı "no people, no hands"
kuralı geçerli — nesnenin dokusu/yüzeyi ön planda, tıklayan el görünmüyor.

### tiklama — Tıklama
```
Extreme macro close-up of a cardboard box's corrugated edge and textured
surface in a dark room, one warm raking side-light revealing fine paper
texture and deep shadow, no people, no hands, moody minimalist album-cover
photograph, shallow depth of field, subtle film grain.
```

### klavye — Klavye
```
Close-up of mechanical keyboard keycaps under a single warm desk-lamp glow in
an otherwise dark room, shallow depth of field, dust particles visible in the
light beam, no people, no hands, moody minimalist album-cover photograph,
subtle film grain.
```

---

## Sonraki adım

Üretilen görselleri indirip Supabase Storage'daki `covers` bucket'ına (ör. `covers/<subcategory>.jpg`) yükle — bana haber ver, `tracks.cover_url` alanlarını dolduran bir migration/script yazarım (ses dosyalarında yaptığımız gibi).
