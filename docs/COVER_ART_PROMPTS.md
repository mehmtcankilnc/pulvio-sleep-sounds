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


---

## v1.1 — yeni alt kategoriler (38 adet)

Her prompt'un başında genel stil cümlesi, sonunda format (1:1, ≥1024×1024) ve negatif prompt hazır eklendi; olduğu gibi kopyalayıp yapıştırabilirsin. Dosya adı **alt kategori slug'ı** + `.png` (ör. `selale.png`). Sıcak/nötr ton, mavi-yeşil yok, insan/el/yüz/metin yok.
İnsan bedeniyle ilgili olanlar (kalp atışı, nefes, rahim) için insan görüntüsü yok; ışık, kor ve ince kumaş gibi sembolik nesneler kullanıldı.

**Öncelik ★ = şu an parçası olan alt kategoriler** (önce bunları üret; kalanlar parça gelince).

### rahatlatıcı

#### ★ selale — Şelale
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A slender waterfall falling through dark rock and silhouetted foliage at dusk, long-exposure silky water
lit by a single warm amber glow from above, faint mist rising, deep shadows, intimate vertical framing
cropped square, moody minimalist album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### ★ cadir_yagmuru — Çadırda Yağmur
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

Close view of a weathered canvas tent roof at night, raindrops beading on the fabric and running down
its seams, a single warm lantern glow from inside lighting the canvas from within, dark surroundings,
shallow depth of field, moody minimalist album-cover photograph, subtle film grain, no people.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### sehir_yagmuru — Şehirde Yağmur
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A wet empty city street at night, glistening asphalt reflecting a few warm streetlights as soft amber
streaks, falling rain visible in the light cones, distant buildings dissolved in bokeh, no people,
no cars in focus, moody minimalist album-cover photograph, film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### yagmur_ormani — Yağmur Ormanı
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

Dense tropical foliage with large broad leaves heavy with raindrops in dim warm dusk light, a faint
amber glow through the canopy, humid mist, deep dark shadows between leaves, intimate close framing,
moody minimalist album-cover photograph, shallow depth of field, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### gol_kiyisi — Göl Kıyısı
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A still lake at dusk seen from a low shoreline, tiny ripples breaking against dark pebbles in the
foreground, soft warm glow on the horizon reflected in the water, wide minimal composition with
generous negative space, moody album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### kurbaga_golet — Kurbağalar ve Gölet
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A dark pond at night with lily pads and gentle ripples, a single warm amber moon reflection on the
water, reeds in silhouette at the edge, no animals clearly visible, quiet and still, minimalist
album-cover photograph, deep shadows, film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### kar_kis — Kar ve Kış
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A single bare tree in a snow-covered field at twilight, soft drifting snow, a warm amber glow low on
the horizon tinting the snow in muted peach tones, vast negative space, moody minimalist
album-cover photograph, subtle film grain, no blue cast.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### ★ cangirak — Rüzgâr Çanı
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

Slender bamboo wind chimes hanging from a dark wooden beam, softly backlit by a warm dusk glow, gentle
motion blur on the tubes, blurred dark background, minimal composition, moody album-cover photograph,
shallow depth of field, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### magara_damla — Mağara Damlası
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A single water droplet falling from a stalactite tip inside a dark cave, one warm raking light catching
the drop mid-air, deep black surroundings, faint ripple rings in a pool below, extreme minimal
composition, moody album-cover macro photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

### ev

#### ★ vantilator — Vantilatör
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A ceiling fan seen from below in a dark bedroom, slow motion blur on the blades, a single warm lamp
glow washing the ceiling, large soft negative space, no people, moody minimalist album-cover
photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### klima — Klima
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A wall-mounted air conditioner unit in a dim room, faint warm light from a nearby lamp grazing its
white surface into soft beige, a gentle breeze lifting a thin curtain beside it, quiet minimal
composition, moody album-cover photograph, film grain, no people.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### camasir_makinesi — Çamaşır Makinesi
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A front-loading washing machine door in a dark laundry room, warm light glowing through the round glass
window where soft fabric swirls, circular composition centered, deep shadows, no people, moody
minimalist album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### supurge — Elektrikli Süpürge
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A vintage upright vacuum cleaner standing alone in a dim hallway, one warm raking window light across
its curved body and soft carpet texture, calm still life, large negative space, no people, moody
minimalist album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### saat — Saat Tik-Takı
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

Close-up of an old wall clock face with fine hands in a dark room, a single warm lamp glow reflecting
off the brass rim, shallow depth of field, tiny dust particles in the light, no people, moody
minimalist album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### soba_radyator — Soba ve Radyatör
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A cast-iron radiator beneath a frosted window at night, warm amber heat shimmer rising from it, soft
glow on the wall above, deep shadows, cozy and still, no people, moody minimalist album-cover
photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### kedi_murilti — Kedi Mırıltısı
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A cat curled asleep on a soft blanket, seen in warm lamplight from a low angle, only fur texture and a
gently rising flank visible, no face in focus, shallow depth of field, moody minimalist album-cover
photograph, subtle film grain, no people.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

### araçlar

#### metro_tramvay — Metro ve Tramvay
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

An empty subway carriage interior at night, rows of seats and poles lit by warm overhead lamps, blurred
motion in the dark tunnel windows, no people, symmetrical minimal composition, moody album-cover
photograph, subtle film grain, amber tones.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### ★ gemi_feribot — Gemi ve Feribot
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A ferry deck railing at night over dark open water, a single warm lamp glow on the wet steel, the wake
as soft white streaks fading into black, no people, minimal composition, moody album-cover photograph,
shallow depth of field, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### tir_kamyon — Tır ve Kamyon
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

View from inside a truck cabin at night on an empty highway, warm amber dashboard glow on the wheel
and gauges, long road lines receding into the dark windshield, no people, no faces, moody minimalist
album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

### beden

#### ★ kalp_atisi — Kalp Atışı
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A single warm ember glowing in the dark with soft concentric ripples of light spreading outward like a
slow pulse, deep black background, abstract and minimal, no body parts, no people, moody album-cover
photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### ★ nefes — Nefes Ritmi
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A single candle flame bending gently in a dark room, soft warm glow, a thin wisp of smoke curling
upward in a slow rhythm, extreme minimal composition, deep black background, no people, moody
album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### ★ rahim — Rahim Sesleri
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A soft translucent amber glow behind layers of thin fabric, like warm light seen through closed
eyelids, gentle diffuse gradient from deep orange to near-black, abstract and calm, no people, no body
parts, moody minimalist album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

### frekans

#### ★ binaural — Binaural (Kulaklık)
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A pair of vintage over-ear headphones resting on a dark wooden surface under a single warm lamp glow,
fine dust in the light beam, shallow depth of field, no people, moody minimalist album-cover
photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### ★ izokronik — İzokronik Tonlar
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

Evenly spaced concentric ripples of warm light on a dark still surface, each ring identical and
rhythmic like a slow pulse, extreme minimal abstract composition, deep black background, moody
album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### ★ solfeggio — Solfej Tonları
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A thin warm vertical beam of light descending onto a smooth dark stone in an otherwise black space,
faint dust motes in the beam, abstract and reverent, extreme negative space, moody album-cover
photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### ★ tibet_kasesi — Tibet Kasesi
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A hammered brass singing bowl on a dark cloth, a single warm light raking its rim, a soft glow and
faint reflected rings on its inner surface, shallow depth of field, no people, no hands, moody
minimalist album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### gong — Gong
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A large bronze gong hanging in a dark empty hall, warm amber light grazing its hammered surface, subtle
reflections, deep shadows around, no people, symmetrical minimal composition, moody album-cover
photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

### asmr (mekanik, insan yok)

#### ★ sayfa_cevirme — Sayfa Çevirme
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

An open old book under a single warm reading-lamp glow, one page caught mid-turn in a soft curve,
paper fibers and shadows visible, shallow depth of field, no people, no hands, moody minimalist
album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### kalem_yazi — Kalem ve Yazı
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A wooden pencil resting on a sheet of textured paper beside faint graphite marks, one warm desk-lamp
glow raking across the grain, dark background, extreme close macro, no people, no hands, no readable
text, moody minimalist album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### firca — Fırça Sesleri
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

Macro close-up of soft natural bristles of a brush fanned out on a dark wooden surface, warm raking side
light highlighting individual hairs, shallow depth of field, no people, no hands, moody minimalist
album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### kum_pirinc — Kum ve Pirinç
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

Fine pale sand sliding down a small dune ridge in warm low raking light, extreme macro of grains and
tiny ripples, deep shadow on one side, no people, no footprints, moody minimalist album-cover
photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### damla — Su Damlası
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A single water droplet suspended at the tip of a dark leaf, one warm light source refracted inside the
drop, deep black bokeh background, extreme macro, minimal, moody album-cover photograph, subtle film
grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

### müzik

#### gitar — Gitar
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

An acoustic guitar leaning in a dark room, a warm lamp glow catching the wood grain and the sound hole,
the rest in deep shadow, no people, no hands, moody minimalist album-cover photograph, shallow depth of
field, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### arp — Arp
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A concert harp in a dim empty room, warm amber light running along its golden strings and curved
frame, deep shadow, no people, no hands, restrained composition, moody album-cover photograph,
shallow depth of field, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### muzik_kutusu — Müzik Kutusu
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

An antique wooden music box with its lid open on a dark table, warm candle-like glow lighting the brass
comb and cylinder, shallow depth of field, no people, no hands, moody minimalist album-cover
photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### ★ kalimba — Kalimba
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A kalimba thumb piano resting on a dark linen cloth, warm lamp light running along its metal tines and
wooden body, shallow depth of field, no people, no hands, moody minimalist album-cover photograph,
subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### cello — Çello
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A cello standing alone on a dim stage, warm rim light tracing its curved body and scroll, deep dark
background, no people, no hands, minimal vertical composition cropped square, moody album-cover
photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

#### synth_pad — Synth Pad
```
Moody minimalist album-cover photograph, square composition, single warm tungsten/ember light source, deep near-black shadows, muted desaturated tones, subtle film grain, shallow depth of field, calm and still, generous negative space.

A vintage synthesizer keyboard glowing faintly in a dark room, a single warm amber indicator light and
soft reflections on the keys, shallow depth of field, no people, no hands, moody minimalist
album-cover photograph, subtle film grain.

Slightly darker overall exposure, more ember-orange color grade: the main light should read as glowing orange-amber rather than pale gold or beige, with the brightest highlights kept dim and the rest sinking into near-black.
1:1 square, minimum 1024×1024

negative prompt: no text, no logo, no watermark, no people, no faces, no cartoon or illustration style,
no oversaturated colors, no multiple competing light sources, no busy clutter,
no generic stock-photo look, no blue or green color cast, no pale beige or white highlights, no bright overexposed areas
```

---

## Yükleme (yeni kapaklar)

1. Üretilen görselleri tek klasöre koy; dosya adı slug (`selale.png`, `nefes.png`, …).
2. `node scripts/upload-covers.mjs "<klasör>"` — klasördeki yeni slug'ları da bulur (taksonomiyi `scripts/taxonomy.mjs`'ten okur).
3. `node scripts/upload-covers.mjs --sql --only=selale,nefes,... > out/covers.sql` → SQL Editor'de çalıştır (yalnızca verdiğin alt kategorilerin parçalarına `cover_url` yazar; kapaksız alt kategorilere dokunmaz).
4. Sonraki batch'lerde `add-tracks.mjs --sql` aynı alt kategorideki mevcut kapağı otomatik kullanır.
