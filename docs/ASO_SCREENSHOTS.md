# ASO — Store Metadata & Screenshot Plan

Working plan for the App Store and Google Play listings. Screenshots are produced
with **Goldie** (`goldie.config.ts` + `.argent/flows/`), driven by **Argent** on a
device/simulator. This file is the source of truth for *what* each screenshot says
and *why*, in keyword-priority order.

Status: **draft — needs native-speaker QA on all non-EN copy, and a content audit
(see Compliance).** Android capture runs locally on Windows; iOS capture is a
hand-off to an EAS cloud Mac (see bottom).

---

## 1. Positioning recap (drives every headline)

Pulvio is a **narrow sleep-sound utility** — ambient sounds, noise, ASMR, and a
sleep timer that fades out. Not a meditation/wellness suite. The freemium model is
deliberately honest: a real free tier with a server-enforced cooldown, not a
disappearing trial. One fixed dark theme (no light mode): deep plum background
(`#120a10` / `#1a1118`), warm peach/apricot glow accent (`#f2b48c`).

Markets, in priority order: **US/EN**, **Brazil/PT-BR** (high download volume,
under-served by competitors in PT), then DE, FR, ES, TR.

---

## 2. Keyword strategy

### How the two stores index (what this plan optimises for)

| Surface | Apple indexed? | Google indexed? | Consequence for us |
|---|---|---|---|
| Title (30) | yes | yes (strongest) | Head terms go here |
| Subtitle / Short desc | yes | yes | Second-tier terms, **no word repeated from title** (Apple) |
| Keyword field (100 **bytes**) | yes (hidden) | n/a | Apple only; long-tail, no spaces, no repeats |
| Long description | **no** | **yes (heavily)** | Google: 2–3% keyword density, natural prose. Apple: pure conversion copy |
| Screenshot captions | **yes (since Jun 2025)** | no | Bake keywords into the first 3 caption lines |

### Target keywords (EN), by tier

- **Head (highest volume, must appear in title/subtitle):** sleep sounds, white
  noise, sleep, ASMR, rain sounds
- **Mid (subtitle / keyword field / caption 1–3):** ocean sounds, nature sounds,
  sleep timer, relaxing sounds, calm, fall asleep, bedtime, brown noise, pink noise
- **Long-tail (keyword field / long description):** fall asleep fast, rain and
  thunderstorm, fireplace sounds, forest sounds, fan noise, ambient music, lo-fi,
  sleep aid, deep sleep, baby sleep sounds, focus sounds

> **Not confirmed — do not lead with these until verified against the Supabase
> `tracks` table:** "sleep stories" / narration (onboarding copy mentions it but
> there is no Stories category), and any hard catalogue count.

### Proposed metadata

#### Apple App Store

| Field | Value | Count |
|---|---|---|
| **Title** | `Sleep & White Noise: Pulvio` | 27 / 30 |
| **Subtitle** | `Rain, Ocean, ASMR & Fan Sounds` | 30 / 30 |
| **Keyword field** | `relax,calm,fall,asleep,timer,nature,thunderstorm,fireplace,forest,birds,waves,brown,pink,bedtime` | ~90 bytes — **verify in App Store Connect**; non-Latin locales use 2–3 bytes/char so localized fields need re-trimming |

**Why this shape:**

- **Keyword-first, brand last.** Pulvio has no brand search volume yet, and both
  stores weight the leading words of the title most. The brand still exact-matches
  for anyone searching "Pulvio". Flip to brand-first only once the name has its
  own search demand.
- **`white noise` is verbatim in the title.** It's the highest-intent head term
  in this category — higher than "music" or "calm" — and Apple/Google rank the
  literal phrase best when it's in the title itself.
- **`sleep sounds` is still covered** even though it's not contiguous in the
  title: Apple builds ranking combinations across Title + Subtitle + Keywords, so
  `sleep` (title) + `sounds` (subtitle) → the app ranks for "sleep sounds",
  "rain sounds", "ocean sounds", "fan sounds", "sleep timer", etc.
- **First token is `Sleep`, not `White`.** "Sleep" anchors the most valuable
  combinations (sleep sounds / timer / aid / music / deep sleep). "White noise"
  still sits at position 3–4, which is the point of the exercise.

Rules honoured: no word repeated across Title / Subtitle / Keywords. Title =
sleep, white, noise, pulvio. Subtitle = rain, ocean, asmr, fan, sounds. Keyword
field shares nothing with either.

**Sanity-check on this shape (Challenger tier — no brand search volume yet, so
score strictly):**

- **Title/subtitle: sound.** Keyword-first, no repeated words, both fields
  maxed or near-maxed. `nature` isn't in the subtitle but isn't lost — it's in
  the keyword field, and combines with subtitle's `sounds` to still rank
  "nature sounds". `fan` earns its subtitle slot: it's not recoverable via
  combination from anywhere else, and it's a real underserved niche (Calm/
  Headspace don't have fan-noise content).
- **Keyword field has 4 bytes of slack (96/100)** — currently wasted. Two
  concrete fixes, pick one:
  1. Add `,aid` → 100/100, unlocks the "sleep aid" combination (title already
     has `sleep`). High-intent phrase, currently not covered anywhere.
  2. Swap the weakest entry, `birds` (low standalone search volume, already
     implied by `forest`/`nature`), for `insomnia` (9 bytes) — a real
     acquisition term ("insomnia app", "insomnia relief") this list is
     currently missing entirely.
  Recommend **both are worth testing**, but if only one: `insomnia` has more
  independent search volume than `aid`.
- **Deliberately excluded, correctly:** `meditation` — high volume, but the
  positioning (§1) is explicit that Pulvio is *not* a meditation app. Ranking
  for it would trade install volume for mismatched-expectation 1-star
  reviews. Leave it out of metadata; don't leave it out of mind if the
  catalogue ever grows a guided-breathing feature.
- **Not verifiable from this doc:** actual search volume for `fan`/`ASMR`/
  `insomnia` in this niche — that needs App Store Connect's Search Ads
  Suggested Keywords or a paid ASO tool (e.g. AppTweak, Sensor Tower) once
  the app has any live data to pull from. Treat the above as directionally
  right, not volume-verified.

#### Google Play

| Field | Value | Count |
|---|---|---|
| **Title** | `Sleep Sounds & White Noise` | 26 / 30 |
| **Short description** | `White noise, rain and ocean sounds with a sleep timer that fades out gently.` | 77 / 80 |
| **Full description** | see block below — keyword-dense, natural, ~1,400 chars; brand in line 1 |

Google title must avoid: emoji, ALL CAPS, "best/#1/free", CTAs — the above is clean.

**Google title drops the brand on purpose.** Google has no hidden keyword field,
the title is its single strongest ranking signal, and both `sleep sounds` and
`white noise` fit verbatim only if `Pulvio` comes out. The brand is safe in the
developer name (shown under the title), the short description, and line 1 of the
full description. If you'd rather keep brand parity with the App Store, use
`Sleep & White Noise: Pulvio` (27) here too and accept losing the contiguous
"sleep sounds" phrase in the Google title.

<details>
<summary>Google Play full-description draft (EN)</summary>

```
Pulvio plays ambient sleep sounds, noise and ASMR so you can fall asleep faster —
without hunting for new videos every night.

WHAT'S INSIDE
• Rain, thunderstorm, ocean waves, streams, forest, birdsong, wind and fireplace
• White noise, brown noise and pink noise
• ASMR triggers — tapping, keyboard and more
• Vehicle ambience — car interior, train, plane cabin, bus, café
• Piano, lo-fi and ambient music

A SLEEP TIMER THAT FADES OUT
Set a timer and the sound lowers gradually as you drift off, instead of cutting
out and waking you. Playback keeps going with the screen off, with lock-screen
controls.

BUILT FOR BEDTIME
Answer a few quick questions and Pulvio builds a wind-down for you. Set your
bedtime and your sounds are ready on time. Wake gently to a soft morning sound.

AN HONEST FREE TIER
Free listening is genuinely free — time-limited with a cooldown, not a trial that
vanishes into a paywall. Upgrade to Premium for unlimited listening and the full
library.

Languages: English, Português (Brasil), Deutsch, Français, Español, Türkçe.
```
</details>

### Localized title / subtitle / keywords (DRAFT — native QA required)

**No — the Apple Keyword field must NOT reuse the English keyword list across
locales.** Apple Search indexes each App Store localization independently:
Title + Subtitle + Keyword field are per-language metadata, and Apple matches
against what people actually type in that storefront's language. Submitting
the English `relax,calm,fall,asleep,timer,nature,...` string under the German
or Turkish localization wastes the entire 100-byte budget on terms almost
nobody searches for in those markets. The one exception is genuine loanwords
that get searched in their English form even by non-English speakers — here
that's `ASMR` (universal, never translated) and arguably `lo-fi`; everything
else below is localized.

The previous "Top keywords" column (below the table) was a **loose phrase
list for description prose** — multi-word phrases with spaces, which is not
the format Apple's Keyword field accepts efficiently (spaces cost bytes for
zero combinatorial benefit; single words let Title × Subtitle × Keywords
combine into those same phrases for free). It was never validated against
the 100-byte limit, which is what you ran into. The table below replaces it
with an actual submittable field: single-word tokens, comma-separated, no
spaces, **measured in real UTF-8 bytes** (`wc -c` on the encoded string, not
character count — every accented letter in pt/de/fr/es/tr and every
dotted/dotless-ı or ğ/ş/ö/ü in tr is 2 bytes, not 1). No word appears more
than once across that locale's Title + Subtitle + Keywords.

Titles follow the EN pattern **[sleep] & [white noise] : [brand]**, keyword-first.
Where all three won't fit 30 chars the brand is dropped (flagged). Subtitles
follow EN's **[rain], [ocean], ASMR, [wind]** fill — "wind" replaces EN's "fan"
in every other locale because translated fan-noise words (`ventilador`,
`Ventilator`) ran too long to fit alongside the other three terms; wind is
real catalogue content either way (§2 lists it), so nothing is fabricated.

| Locale | Title (≤30 chars) | Subtitle (≤30 chars) | Apple Keyword field (≤100 bytes) |
|---|---|---|---|
| **EN** | `Sleep & White Noise: Pulvio` (27) | `Rain, Ocean, ASMR & Fan Sounds` (30) | `relax,calm,fall,asleep,timer,nature,thunderstorm,fireplace,forest,birds,waves,brown,pink,bedtime` (96 bytes) |
| **PT-BR** | `Ruído branco e sono: Pulvio` (27) | `Chuva, Oceano, ASMR e Vento` (27) | `sons,dormir,insônia,timer,natureza,relaxar,ondas,profundo,rápido,marrom,rosa,floresta,trovão` (95 bytes) |
| **DE** | `Weißes Rauschen & Schlaf` (24, **brand dropped**; alt `Rauschen & Schlaf: Pulvio` 25) | `Regen, Meer, ASMR, Wind, Natur` (30) | `schlafen,einschlafhilfe,insomnie,timer,wellen,entspannung,beruhigend,braunes,rosa,wald,gewitter` (95 bytes) |
| **FR** | `Bruit blanc & sommeil : Pulvio` (30) | `Pluie, Océan, ASMR, Vent` (25) | `insomnie,minuterie,nature,vagues,relaxation,apaisant,brun,rose,forêt,orage,cheminée,oiseaux,rapide` (100 bytes) |
| **ES** | `Ruido blanco y dormir: Pulvio` (29) | `Lluvia, Océano, ASMR, Viento` (29) | `insomnio,temporizador,naturaleza,olas,relajación,calma,marrón,rosa,bosque,tormenta,chimenea` (93 bytes) |
| **TR** | `Beyaz Gürültü & Uyku: Pulvio` (28) | `Yağmur, Deniz, ASMR, Rüzgar` (29) | `okyanus,uyumak,uykusuzluk,zamanlayıcı,doğa,dalga,rahatlama,sakinleştirici,kahverengi,pembe,orman` (100 bytes) |

Notes on the trades made to fit the byte budget (each dropped term is still
covered in that locale's full description, §2 below, so it isn't lost —
just not in the highest-value field):

- **TR subtitle changed ocean word from `Okyanus` to `Deniz`** (sea) to fit
  30 chars — the original `Yağmur, Okyanus, ASMR, Rüzgar` was 31/30. This
  freed `okyanus` to move into the keyword field instead, so both terms
  still end up indexed, just in different fields.
- **PT** drops `lareira` (fireplace) and `pássaros` (birds) from the keyword
  field — both niche, low standalone search volume, both appear in the PT
  description's feature bullets.
- **DE** drops `vögel` (birds) and `müde` (tired) — same reasoning; `müde`
  in particular is a weak standalone search term.
- **FR** drops `profond` (deep) — "sommeil profond" (deep sleep) is a real
  phrase but lower priority than insomnia/relaxation/nature terms that made
  the cut.
- **ES** has 7 bytes of slack (93/100) after dropping `pájaros`, `rápido`,
  `profundo` — none fit without cutting something higher-value, and forcing
  the budget to exactly 100 isn't itself a goal. Native QA may find a
  shorter Spanish word that fills it usefully.
- **TR** drops `fırtına` (storm), `şömine` (fireplace), `kuşlar` (birds) —
  all three are in the TR description; `sakinleştirici` (calming) was kept
  over them since "calming sounds" is a stronger standalone search pattern
  than any single ambience word.

> **One real content gap, not a wording issue:** the old TR "Top keywords"
> phrase list included `meditasyon`. Every other locale (and the EN strategy
> in §2) deliberately excludes "meditation" — Pulvio isn't a meditation app,
> and ranking for the term risks mismatched-expectation reviews. It's
> correctly absent from the TR keyword field above; just flagging that the
> old table had it so nobody resurrects it during translation QA.

These are still **DRAFT** — a native speaker should sanity-check that each
localized term is actually what people search (not just a correct
dictionary translation; e.g. confirm `Rauschen` vs `Geräusch` in DE, or
whether Brazilian users search `ruído branco` vs `som branco`) before
submission in App Store Connect.

### Google Play — localized titles & short descriptions (DRAFT)

Google has no hidden keyword field — the **title is indexed and is the
strongest signal**, and the **short description (≤80 chars) and full
description (§ below) are both indexed too**, so these need real localized
search terms in visible prose, not a separate token list.

| Locale | Title (≤30 chars) | Short description (≤80 chars) |
|---|---|---|
| **PT-BR** | `Ruído branco e sono: Pulvio` (27) | `Ruído branco, chuva, oceano e ASMR com timer de sono que diminui aos poucos.` |
| **DE** | `Weißes Rauschen & Schlaf` (24) | `Weißes Rauschen, Regen, Meer und ASMR mit sanftem Einschlaf-Timer.` |
| **FR** | `Bruit blanc & sommeil : Pulvio` (30) | `Bruit blanc, pluie, océan et ASMR avec une minuterie de sommeil en fondu.` |
| **ES** | `Ruido blanco y dormir: Pulvio` (29) | `Ruido blanco, lluvia, océano y ASMR con temporizador de sueño con desvanecido.` |
| **TR** | `Beyaz Gürültü & Uyku: Pulvio` (28) | `Yağmur, okyanus, beyaz gürültü ve ASMR; uyku zamanlayıcı yavaşça kısılır.` |

Google's title can reuse the same string as Apple's (no cross-field repeat
penalty like Apple's), so these match the Title column above. Same DRAFT/QA
caveat applies.

### Promotional text (Apple only — 170 chars, not indexed, editable without a new build)

Apple confirms this field doesn't affect search ranking, so it's pure
conversion copy — and the only ASO field you can change without a version
review, so revisit it seasonally (holidays, exam season, back-to-school) once
there's a reason to. Counts below are exact (`wc -m`), not estimates.

| Locale | Text | Chars |
|---|---|---|
| **EN** | `Rain, ocean, white noise, brown noise and ASMR — with a sleep timer that fades out gently instead of cutting off. A real free tier, no fake trial.` | 148 / 170 |
| **PT-BR** | `Chuva, oceano, ruído branco, ruído marrom e ASMR — com um timer de sono que diminui aos poucos, sem cortar de repente. Um plano grátis de verdade, sem trial falso.` | 168 / 170 |
| **DE** | `Regen, Meer, weißes Rauschen, braunes Rauschen und ASMR — mit einem Einschlaf-Timer, der sanft statt abrupt ausblendet. Eine echte Gratis-Version, kein falscher Test.` | 169 / 170 |
| **FR** | `Pluie, océan, bruit blanc et ASMR — avec une minuterie de sommeil qui s'estompe en douceur, sans s'arrêter net. Une vraie version gratuite, sans faux essai.` | 160 / 170 |
| **ES** | `Lluvia, océano, ruido blanco y ASMR — con un temporizador de sueño que se desvanece poco a poco, sin cortarse de golpe. Un plan gratis real, sin prueba falsa.` | 162 / 170 |
| **TR** | `Yağmur, okyanus, beyaz gürültü ve ASMR — sesi aniden kesmek yerine yavaşça kısan bir uyku zamanlayıcısı. Sahte deneme değil, gerçek bir ücretsiz plan.` | 165 / 170 |

FR and ES drop "bruit brun"/"ruido marrón" to fit the 170-char limit — brown
noise is still covered by the title/keyword field, this text is conversion
copy, not a keyword slot. DRAFT, needs native QA like everything else non-EN.

### Full descriptions — all locales (DRAFT — native QA required)

**Apple description is not indexed for search** — it exists purely to convert
someone who already tapped in from the icon/screenshots. Keep it scannable:
short opening hook, then feature groups, then the honest-free-tier pitch,
then a closing line that sets expectations (no light mode, no meditation
content) to keep reviews aligned with what the app actually is.

**Google full description IS indexed** — same structure, but written to
carry the locale's long-tail keywords (§2 "Top keywords" column) naturally in
prose, not stuffed. Target density stays 2–3%; these drafts don't force it
higher than that.

<details>
<summary>Apple App Store description — EN</summary>

```
Pulvio is a focused sleep-sound app: ambient sounds, noise and ASMR, with a timer that fades out instead of cutting off.

FALL ASLEEP TO
Rain, thunderstorm, ocean waves, streams, forest, birdsong, wind and fireplace — plus white noise, brown noise and pink noise. ASMR triggers like tapping and keyboard sounds. Vehicle ambience — car interior, train, plane cabin, bus, café. Piano, lo-fi and ambient music.

A TIMER THAT FADES, NOT CUTS
Set how long you want sound for. Instead of stopping abruptly and waking you, it lowers gradually as you drift off. Keeps playing with the screen off, with lock-screen controls, and can wake you gently with a soft morning sound.

BUILT AROUND YOUR BEDTIME
Answer a few quick questions and Pulvio puts together a wind-down mix for you. Set a bedtime and your sounds are ready on time, every night.

A FREE TIER THAT'S ACTUALLY FREE
Free listening isn't a countdown to a paywall — it's time-limited with a cooldown, not a trial that disappears. Premium removes the wait and unlocks the full library, for anyone who wants it every night.

No light mode, no gamification, no meditation lessons — just sounds and a timer that helps you fall asleep.
```
</details>

<details>
<summary>Apple App Store description — PT-BR</summary>

```
Pulvio é um app focado em sons para dormir: ambientes, ruídos e ASMR, com um timer que diminui aos poucos em vez de cortar de repente.

PARA DORMIR
Chuva, tempestade, ondas do mar, riachos, floresta, canto de pássaros, vento e lareira — além de ruído branco, ruído marrom e ruído rosa. Gatilhos de ASMR como tapping e teclado. Ambientes de viagem — carro, trem, avião, ônibus, café. Piano, lo-fi e música ambiente.

UM TIMER QUE DIMINUI, NÃO CORTA
Escolha por quanto tempo quer ouvir o som. Em vez de parar de repente e te acordar, ele vai diminuindo aos poucos enquanto você pega no sono. Continua tocando com a tela desligada, com controles na tela de bloqueio, e pode te acordar suavemente com um som matinal.

FEITO PARA O SEU HORÁRIO DE DORMIR
Responda algumas perguntas rápidas e o Pulvio monta uma rotina de relaxamento para você. Defina um horário de dormir e seus sons estarão prontos, todas as noites.

UM PLANO GRATUITO DE VERDADE
Ouvir de graça não é uma contagem regressiva até um paywall — é limitado no tempo, com um intervalo entre sessões, não um trial que desaparece. O Premium remove essa espera e libera a biblioteca completa, para quem quiser usar todas as noites.

Sem modo claro, sem gamificação, sem aulas de meditação — só sons e um timer que ajuda você a dormir.
```
</details>

<details>
<summary>Apple App Store description — DE</summary>

```
Pulvio ist eine fokussierte Einschlaf-App: Umgebungsgeräusche, Rauschen und ASMR, mit einem Timer, der sanft ausblendet statt abrupt zu stoppen.

ZUM EINSCHLAFEN
Regen, Gewitter, Meereswellen, Bäche, Wald, Vogelgezwitscher, Wind und Kamin — dazu weißes, braunes und rosa Rauschen. ASMR-Trigger wie Tapping und Tastaturgeräusche. Reise-Ambiente — Auto, Zug, Flugzeugkabine, Bus, Café. Klavier, Lo-Fi und Ambient-Musik.

EIN TIMER, DER AUSBLENDET, NICHT ABBRICHT
Stelle ein, wie lange der Sound laufen soll. Statt abrupt zu stoppen und dich aufzuwecken, wird er sanft leiser, während du einschläfst. Läuft weiter bei ausgeschaltetem Display, mit Steuerung im Sperrbildschirm, und kann dich sanft mit einem Morgengeräusch wecken.

RUND UM DEINE SCHLAFENSZEIT GEBAUT
Beantworte ein paar kurze Fragen, und Pulvio stellt dir eine Einschlaf-Routine zusammen. Lege eine Schlafenszeit fest, und deine Klänge sind jeden Abend pünktlich bereit.

EIN GRATIS-TARIF, DER WIRKLICH GRATIS IST
Kostenloses Hören ist kein Countdown zur Kaufaufforderung — es ist zeitlich begrenzt mit einer Pause danach, kein Test, der plötzlich verschwindet. Premium entfernt das Warten und schaltet die komplette Bibliothek frei, für alle, die es jede Nacht nutzen wollen.

Kein heller Modus, keine Gamification, keine Meditationskurse — nur Klänge und ein Timer, der beim Einschlafen hilft.
```
</details>

<details>
<summary>Apple App Store description — FR</summary>

```
Pulvio est une application centrée sur le sommeil : sons d'ambiance, bruits et ASMR, avec une minuterie qui s'estompe en douceur au lieu de s'arrêter net.

POUR S'ENDORMIR
Pluie, orage, vagues, ruisseaux, forêt, chants d'oiseaux, vent et cheminée — ainsi que bruit blanc, bruit brun et bruit rose. Déclencheurs ASMR comme le tapping et le clavier. Ambiances de transport — voiture, train, cabine d'avion, bus, café. Piano, lo-fi et musique d'ambiance.

UNE MINUTERIE QUI S'ESTOMPE, PAS QUI COUPE
Choisissez la durée du son. Au lieu de s'arrêter brusquement et de vous réveiller, il baisse progressivement pendant que vous vous endormez. Continue avec l'écran éteint, avec des commandes sur l'écran verrouillé, et peut vous réveiller en douceur avec un son matinal.

PENSÉE POUR VOTRE HEURE DE COUCHER
Répondez à quelques questions rapides et Pulvio compose une routine de détente pour vous. Réglez une heure de coucher et vos sons sont prêts chaque soir.

UNE VERSION GRATUITE VRAIMENT GRATUITE
Écouter gratuitement n'est pas un compte à rebours vers un paywall — c'est limité dans le temps avec une pause, pas un essai qui disparaît. Premium supprime cette attente et débloque la bibliothèque complète, pour qui veut l'utiliser chaque soir.

Pas de mode clair, pas de gamification, pas de cours de méditation — juste des sons et une minuterie qui aide à s'endormir.
```
</details>

<details>
<summary>Apple App Store description — ES</summary>

```
Pulvio es una app centrada en el sueño: sonidos ambientales, ruido y ASMR, con un temporizador que se desvanece poco a poco en vez de cortarse de golpe.

PARA CONCILIAR EL SUEÑO
Lluvia, tormenta, olas del mar, arroyos, bosque, canto de pájaros, viento y chimenea — además de ruido blanco, ruido marrón y ruido rosa. Gatillos de ASMR como tapping y teclado. Ambientes de viaje — coche, tren, cabina de avión, autobús, café. Piano, lo-fi y música ambiental.

UN TEMPORIZADOR QUE SE DESVANECE, NO CORTA
Elige cuánto tiempo quieres que suene. En vez de detenerse de golpe y despertarte, baja poco a poco mientras te duermes. Sigue sonando con la pantalla apagada, con controles en la pantalla de bloqueo, y puede despertarte suavemente con un sonido matutino.

PENSADA PARA TU HORA DE DORMIR
Responde unas preguntas rápidas y Pulvio arma una rutina de relajación para ti. Fija una hora de dormir y tus sonidos estarán listos cada noche.

UN PLAN GRATIS DE VERDAD
Escuchar gratis no es una cuenta regresiva hacia un paywall — está limitado en el tiempo con una pausa entre sesiones, no es una prueba que desaparece. Premium elimina esa espera y desbloquea la biblioteca completa, para quien quiera usarla cada noche.

Sin modo claro, sin gamificación, sin clases de meditación — solo sonidos y un temporizador que ayuda a dormir.
```
</details>

<details>
<summary>Apple App Store description — TR</summary>

```
Pulvio, uyku sesleri üzerine odaklanmış bir uygulama: ortam sesleri, gürültü ve ASMR; sesi aniden kesmek yerine yavaşça kısan bir zamanlayıcıyla.

UYKUYA DALMAK İÇİN
Yağmur, fırtına, deniz dalgaları, dere, orman, kuş sesleri, rüzgar ve şömine — ayrıca beyaz gürültü, kahverengi gürültü ve pembe gürültü. Tıklama ve klavye gibi ASMR tetikleyicileri. Yolculuk ortamları — araba, tren, uçak kabini, otobüs, kafe. Piyano, lo-fi ve ambiyans müzik.

KESMEYEN, YAVAŞÇA KISAN BİR ZAMANLAYICI
Sesin ne kadar süre çalacağını sen seç. Aniden durup seni uyandırmak yerine, sen uykuya dalarken ses yavaşça kısılır. Ekran kapalıyken çalmaya devam eder, kilit ekranından kontrol edilir ve seni yumuşak bir sabah sesiyle uyandırabilir.

UYKU SAATİNE GÖRE KURULUR
Birkaç kısa soruyu yanıtla, Pulvio senin için bir uyku rutini hazırlasın. Bir uyku saati belirle, seslerin her gece zamanında hazır olsun.

GERÇEKTEN ÜCRETSİZ BİR PLAN
Ücretsiz dinleme, ödeme ekranına doğru geri sayım değildir — süre sınırlı ve aralarında bekleme var, kaybolan bir deneme süresi değil. Premium bu bekleyişi kaldırır ve tüm kütüphaneyi açar, her gece kullanmak isteyenler için.

Açık tema yok, oyunlaştırma yok, meditasyon dersleri yok — sadece sesler ve uykuya dalmana yardımcı olan bir zamanlayıcı.
```
</details>

<details>
<summary>Google Play full description — PT-BR</summary>

```
Pulvio toca sons ambientes para dormir, ruídos e ASMR para você pegar no sono mais rápido — sem precisar procurar um vídeo novo toda noite.

O QUE TEM NO APP
• Chuva, tempestade, ondas do mar, riachos, floresta, canto de pássaros, vento e lareira
• Ruído branco, ruído marrom e ruído rosa
• Gatilhos de ASMR — tapping, teclado e mais
• Ambientes de viagem — carro, trem, avião, ônibus, café
• Piano, lo-fi e música ambiente

UM TIMER DE SONO QUE DIMINUI AOS POUCOS
Defina um timer e o som vai diminuindo aos poucos enquanto você pega no sono, em vez de cortar de repente e te acordar. A reprodução continua com a tela desligada, com controles na tela de bloqueio.

FEITO PARA A HORA DE DORMIR
Responda algumas perguntas rápidas e o Pulvio monta uma rotina de relaxamento para você. Defina seu horário de dormir e seus sons estarão prontos na hora certa. Acorde suavemente com um som matinal.

UM PLANO GRATUITO DE VERDADE
Ouvir de graça é realmente gratuito — limitado no tempo, com um intervalo entre sessões, não um trial que desaparece de repente. Assine o Premium para ouvir sem limites e ter acesso à biblioteca completa.

Idiomas: Português (Brasil), English, Deutsch, Français, Español, Türkçe.
```
</details>

<details>
<summary>Google Play full description — DE</summary>

```
Pulvio spielt Umgebungsgeräusche zum Einschlafen, Rauschen und ASMR, damit du schneller einschläfst — ohne jeden Abend ein neues Video suchen zu müssen.

DAS ERWARTET DICH
• Regen, Gewitter, Meereswellen, Bäche, Wald, Vogelgezwitscher, Wind und Kamin
• Weißes Rauschen, braunes Rauschen und rosa Rauschen
• ASMR-Trigger — Tapping, Tastatur und mehr
• Reise-Ambiente — Auto, Zug, Flugzeugkabine, Bus, Café
• Klavier, Lo-Fi und Ambient-Musik

EIN EINSCHLAF-TIMER, DER SANFT AUSBLENDET
Stelle einen Timer ein, und der Sound wird leiser, während du einschläfst, statt abrupt zu stoppen und dich zu wecken. Die Wiedergabe läuft bei ausgeschaltetem Display weiter, mit Steuerung im Sperrbildschirm.

GEBAUT FÜR DEINE SCHLAFENSZEIT
Beantworte ein paar kurze Fragen, und Pulvio stellt dir eine Einschlaf-Routine zusammen. Lege deine Schlafenszeit fest, und deine Klänge sind pünktlich bereit. Wache sanft mit einem Morgengeräusch auf.

EIN GRATIS-TARIF, DER WIRKLICH GRATIS IST
Kostenloses Hören ist wirklich gratis — zeitlich begrenzt mit einer Pause danach, kein Test, der plötzlich verschwindet. Hol dir Premium für unbegrenztes Hören und die komplette Bibliothek.

Sprachen: Deutsch, English, Português (Brasil), Français, Español, Türkçe.
```
</details>

<details>
<summary>Google Play full description — FR</summary>

```
Pulvio diffuse des sons d'ambiance pour dormir, des bruits et de l'ASMR pour vous endormir plus vite — sans chercher une nouvelle vidéo chaque soir.

AU PROGRAMME
• Pluie, orage, vagues, ruisseaux, forêt, chants d'oiseaux, vent et cheminée
• Bruit blanc, bruit brun et bruit rose
• Déclencheurs ASMR — tapping, clavier et plus
• Ambiances de transport — voiture, train, cabine d'avion, bus, café
• Piano, lo-fi et musique d'ambiance

UNE MINUTERIE DE SOMMEIL QUI S'ESTOMPE EN DOUCEUR
Réglez une minuterie et le son baisse progressivement pendant que vous vous endormez, au lieu de s'arrêter net et de vous réveiller. La lecture continue écran éteint, avec des commandes sur l'écran verrouillé.

PENSÉE POUR VOTRE HEURE DE COUCHER
Répondez à quelques questions rapides et Pulvio compose une routine de détente pour vous. Réglez votre heure de coucher et vos sons sont prêts au bon moment. Réveillez-vous en douceur avec un son matinal.

UNE VERSION GRATUITE VRAIMENT GRATUITE
Écouter gratuitement est réellement gratuit — limité dans le temps avec une pause, pas un essai qui disparaît soudainement. Passez à Premium pour une écoute illimitée et la bibliothèque complète.

Langues : Français, English, Português (Brasil), Deutsch, Español, Türkçe.
```
</details>

<details>
<summary>Google Play full description — ES</summary>

```
Pulvio reproduce sonidos ambientales para dormir, ruido y ASMR para que te duermas más rápido, sin tener que buscar un video nuevo cada noche.

QUÉ INCLUYE
• Lluvia, tormenta, olas del mar, arroyos, bosque, canto de pájaros, viento y chimenea
• Ruido blanco, ruido marrón y ruido rosa
• Gatillos de ASMR — tapping, teclado y más
• Ambientes de viaje — coche, tren, cabina de avión, autobús, café
• Piano, lo-fi y música ambiental

UN TEMPORIZADOR DE SUEÑO QUE SE DESVANECE POCO A POCO
Configura un temporizador y el sonido baja poco a poco mientras te duermes, en lugar de cortarse de golpe y despertarte. La reproducción sigue con la pantalla apagada, con controles en la pantalla de bloqueo.

PENSADA PARA TU HORA DE DORMIR
Responde unas preguntas rápidas y Pulvio arma una rutina de relajación para ti. Fija tu hora de dormir y tus sonidos estarán listos a tiempo. Despierta suavemente con un sonido matutino.

UN PLAN GRATIS DE VERDAD
Escuchar gratis es realmente gratis — limitado en el tiempo con una pausa entre sesiones, no una prueba que desaparece de repente. Consigue Premium para escuchar sin límites y acceder a la biblioteca completa.

Idiomas: Español, English, Português (Brasil), Deutsch, Français, Türkçe.
```
</details>

<details>
<summary>Google Play full description — TR</summary>

```
Pulvio, her gece yeni bir video aramak zorunda kalmadan daha hızlı uykuya dalman için uyku sesleri, gürültü ve ASMR çalar.

UYGULAMADA NELER VAR
• Yağmur, fırtına, deniz dalgaları, dere, orman, kuş sesleri, rüzgar ve şömine
• Beyaz gürültü, kahverengi gürültü ve pembe gürültü
• ASMR tetikleyicileri — tıklama, klavye ve daha fazlası
• Yolculuk ortamları — araba, tren, uçak kabini, otobüs, kafe
• Piyano, lo-fi ve ambiyans müzik

YAVAŞÇA KISILAN BİR UYKU ZAMANLAYICISI
Bir zamanlayıcı ayarla; ses aniden kesilip seni uyandırmak yerine, sen uykuya dalarken yavaşça kısılır. Ekran kapalıyken çalmaya devam eder, kilit ekranından kontrol edilebilir.

UYKU SAATİNE GÖRE TASARLANDI
Birkaç kısa soruyu yanıtla, Pulvio senin için bir uyku rutini hazırlasın. Uyku saatini belirle, seslerin zamanında hazır olsun. Yumuşak bir sabah sesiyle nazikçe uyan.

GERÇEKTEN ÜCRETSİZ BİR PLAN
Ücretsiz dinleme gerçekten ücretsizdir — süre sınırlı ve aralarında bekleme var, aniden kaybolan bir deneme süresi değil. Sınırsız dinlemek ve tüm kütüphaneye erişmek için Premium'a geç.

Diller: Türkçe, English, Português (Brasil), Deutsch, Français, Español.
```
</details>

---

## 3. Screenshot set

**6 frames** (Google Play max = 8; Apple allows 10 but only the **first 3** show
in search results, so 1–3 carry the keyword load). Same order both stores.

Portrait, the app's dark theme. Caption = short headline baked into the frame (≤6
words), placed **top**, device below. First-3 captions are written to contain the
head keywords because Apple indexes caption text.

> From the original 8-frame draft: **paywall** dropped (fabricated testimonials,
> §5), **lock-screen/background** dropped (can't be staged by the flow pipeline).
> A **quiet wake-up** frame was tried and dropped — it only re-showed the
> schedule screen. An **Explore home** frame was added as frame 1.

| # | Config scene id | Screen shown | Headline (EN) | Keyword target | Job |
|---|---|---|---|---|---|
| **1** | `01-explore` | Explore home (premium badge, Favorites ×3, Tonight's pick, Browse rail) | **Sleep sounds, ready when you are** | sleep sounds, sleep aid | "This is a working, personalised sleep app" in 1 second |
| **2** | `02-catalogue` | Sounds list, "All sounds" (grouped by category) | **Rain, ocean & white noise for sleep** | white noise, rain sounds, ocean sounds | Breadth of the catalogue |
| **3** | `03-sleep-timer` | Player with the fade-out timer armed ("Fades out in mm:ss") | **A sleep timer that fades out** | sleep timer, fall asleep | The differentiator |
| **4** | `04-asmr` | Sounds list, "All ASMR" (Tapping + Keyboard) | **ASMR triggers: tapping, keyboard & more** | ASMR | Distinct audience / high-volume term |
| **5** | `05-schedule` | Sleep tab — schedule arc + tonight's routine | **Your sounds, ready at bedtime** | bedtime, wind down, routine | Nightly habit |
| **6** | `06-categories` | Category grid (`app/categories.tsx`) — cover-image tiles | **Brown & pink noise, nature, lo-fi** | brown noise, pink noise, nature sounds, ambient, lo-fi | Depth — locks "brown noise" / "pink noise" now that "white noise" is in the title |

**Apple & Google Play:** ship 1–6 in this order.

Frame 6's screen is new: `app/categories.tsx`, a grouped 2-column grid of every
subcategory as a cover-art tile, reached from Explore → "All categories". It
shows "Brown noise", "Pink noise", "Fireplace", "Forest", "Lo-fi", "Ambient", …
as literal tile labels, which is what the headline needs.

### Localized headlines

> **Source of truth is now `goldie.config.ts`** (`scenes[].headline`, per
> locale). Headlines are hard-broken with `\n` and **each `\n`-separated line
> must stay short** (~12 chars) — the bigger 0.094 type + the left-aligned
> narrow boxes on `tilt`/`tilt-right` re-wrap a long line into a 3rd row.
> Keyword density was traded away for brevity; the keyword nouns live in the
> App Store Connect caption field (metadata), which is what Apple indexes.
> Scene 1 also has a `subhead` (the panorama right-tile caption). The table
> below is the earlier long-form draft, kept only as a copy reference — the
> shipping copy is in the config and still needs native-speaker QA.

| # | PT-BR | DE | FR | ES | TR |
|---|---|---|---|---|---|
| 1 | Sons para dormir, prontos quando você quiser | Einschlafklänge, bereit wenn du es bist | Des sons pour dormir, prêts quand vous l'êtes | Sonidos para dormir, listos cuando quieras | Uyku sesleri, sen hazır olduğunda hazır |
| 2 | Chuva, oceano e ruído branco para dormir | Regen, Meer & weißes Rauschen zum Einschlafen | Pluie, océan et bruit blanc pour dormir | Lluvia, océano y ruido blanco para dormir | Uyku için yağmur, okyanus, beyaz gürültü |
| 3 | Um timer de sono que diminui | Ein Timer, der sanft ausblendet | Une minuterie qui s'estompe | Un temporizador que se desvanece | Yavaşça kısılan uyku zamanlayıcısı |
| 4 | ASMR: tapping, teclado e mais | ASMR: Tapping, Tastatur & mehr | ASMR : tapping, clavier et plus | ASMR: tapping, teclado y más | ASMR: tıklama, klavye ve dahası |
| 5 | Seus sons, prontos na hora de dormir | Deine Klänge, pünktlich zur Schlafenszeit | Vos sons, prêts pour le coucher | Tus sonidos, listos para dormir | Sesler yatış saatinde hazır |
| 6 | Ruído marrom e rosa, natureza, lo-fi | Braunes & rosa Rauschen, Natur, Lo-Fi | Bruit brun et rose, nature, lo-fi | Ruido marrón y rosa, naturaleza, lo-fi | Kahverengi & pembe gürültü, doğa, lo-fi |

---

## 4. Design spec (Goldie)

- **Template:** custom per-scene sequence in `goldie.config.ts`
  `theme.template` — `["panorama", "tilt-right", "classic", "classic", "tilt",
  "classic"]`. 6 scenes → **7 output tiles** (scene 1's `panorama` has span 2):
  | tile | scene | layout | note |
  |---|---|---|---|
  | 1 | 01-explore | panorama L | headline only |
  | 2 | 01-explore | panorama R | `scene.subhead` caption (needs the patch, below) |
  | 3 | 02-catalogue | tilt-right | catalogue list; top rows visible, crops the bottom |
  | 4 | 03-sleep-timer | classic | full screen — keeps the timer chips + "fades out in mm:ss" visible |
  | 5 | 04-asmr | classic | full screen |
  | 6 | 05-schedule | tilt | tilt = leans left; crops the bottom (schedule arc is up top) |
  | 7 | 06-categories | classic | full screen |
  Built-in templates aren't used: `editorial`/`storyboard`/`showcase`/`dynamic`
  put `duo*` layouts in the mix (pull a second capture from the *next* scene,
  duplicating screens); `magazine` ends on `minimal` (no headline).
- **`scripts/patch-goldie.mjs`** — goldie 0.3.1 has no theme knob for headline
  size and draws copy once (left tile only) on a panorama. This script patches
  the **global** goldie install for both: `TYPE.headlineSize` 0.082 → 0.094,
  and a `panorama` scene's `subhead` map renders as the **right-tile** caption
  (styled like a headline, `headlineColor`). Idempotent; keeps a `.orig`
  backup; `--revert` restores. **Re-run after any `npm i -g goldie`.** Without
  it: headlines render at stock size and scene 1's `subhead` stacks under the
  headline on tile 1 (tile 2 stays bare).
- **`goldie.design.json`:** kept empty (`{}`). The studio writes design
  overrides here, but every value we need lives in the config, and a
  `background` key in the sidecar makes `applyDesign` force its own copy
  colours over `theme.headlineColor` / `subheadColor`. Config is the single
  source of truth; re-empty the sidecar after any studio session.
- **Background:** `linear-gradient(180deg, #2a1820, #1a1016 46%, #0c0710)` —
  warm plum fading to near-black plum, echoing the app's GlowBackground.
  `paint()` supports `linear-gradient` only (no radial).
- **Headline type:** bundled `Merriweather` (serif). `headlineColor` `#f7ede6`
  (near-white warm), single colour — no per-word accent. Each `headline` is
  hard-broken to two lines with `\n`. `subhead` is set on **scene 1 only** and
  is the panorama right-tile caption (see patch above) — not a stacked
  subtitle.
- **Copy geometry (classic frames only):** `theme.copyHeightRatio` `0.19`,
  `theme.deviceWidthRatio` `0.96`. Other layouts carry their own ratios.
- **Device frame:** iOS gets `17-pro-silver` (config `frame.variant`).
  Android uses **`assets/pixel-10-pro-dark.png`** via `android.frame` — goldie's
  bundled silver Pixel skin run through a luminance-darkening remap (opaque px →
  `[14..104]`, screen cutout kept transparent, same 1410×2968 geometry). It's a
  graphite bezel that sits into the plum gradient instead of the silver one
  fighting it. Regenerate: `loadImage(goldie/assets/pixel-10-pro.webp)` → remap →
  write PNG (see chat history for the exact `node -e`).
- **Dimensions:** iPhone 6.9" `1320 × 2868`; Pixel `1080 × 1920`. Feature graphic
  (Play, separate asset) `1024 × 500` — reuse frame 1's headline + glow.
- **Caption length:** ≤ 6 words. Never wrap past 2 lines.

### Android capture source — DECISION

Goldie 0.3.1's only Android device key is **`pixel-10-pro`**, and it accepts a
capture host *only* if its hardware profile is `pixel_10_pro` or `pixel_9_pro`
(1280 × 2856 screen). `goldie doctor` **rejects both** the physical S21 and the
`Pixel_8` AVD for this key.

**Chosen host: a new `Pixel_9_Pro` AVD.** It is the lowest-friction path that
keeps Goldie's geometry correct end to end (no letterbox/crop when compositing
into the 1080 × 1920 canvas + bundled Pixel bezel):

```
avdmanager create avd --device pixel_9_pro --name Pixel_9_Pro -k "system-images;android-35;google_apis_playstore;x86_64"
```

Then install the app on it and point Metro at it (user starts Metro).

- **S21** stays the functional-test device (`docs/ARGENT_TEST_PLAN.md`); it is
  *not* a valid Goldie capture host for framed shots.
- **`Pixel_8` AVD** fallback: only if the Pixel 9 Pro image can't be pulled —
  Goldie would need the device key patched or captures fed in manually.

### How the set is actually produced (goldie 0.3.1 reality)

`goldie capture` does one **reinstall** of the APK at the start of a run, which
**wipes app data** → the premium session is gone and every flow lands on
onboarding. So the pipeline is run **manually**, which also keeps the session.

**`scripts/goldie-capture-locales.mjs`** does the whole per-locale loop:

```
# ONE-TIME by hand, before running the script:
#   1. Pixel_9_Pro emulator up as emulator-5554
#   2. build/pulvio-preview.apk installed  (Metro NOT needed — preview APK
#      bundles its own JS)
#   3. signed in with a PREMIUM account, sitting on the Explore tab
node scripts/goldie-capture-locales.mjs
```

For each of the 6 locales it:
- `adb shell cmd locale set-app-locales com.pulvio.app --locales <bcp47>` —
  Android-13+ per-app LocaleManager, **no root** (the playstore emulator image
  can't `adb root`, so `setprop persist.sys.locale` is out). The app reads it on
  next launch via `Locale.getDefault()`.
- `am force-stop` (keeps the session — no reinstall)
- replays the 6 `.argent` flows, re-broadcasts goldie's SystemUI demo status
  bar (09:41 / full wifi / 100% / no notifications) after each, and
  `screencap`s the raw over `out/raw/pixel-10-pro/<scene>.png`
- `goldie frame --device pixel-10-pro --locale <goldie-key>`

`goldie frame` reads `out/raw/pixel-10-pro/manifest.json` + the config's
per-scene `headline[locale]`, composites the bezel + copy, and writes
`out/screenshots/<device>/<locale>/`.

**Editing copy / background without touching the config:** `goldie studio`
serves a browser UI at `http://localhost:4321` — switch device, background,
template, bezel, font, and **per-tile copy per locale**; it writes
`goldie.design.json` next to `goldie.config.ts` and `goldie frame` then renders
exactly what you set. One-offs also work as CLI flags: `goldie frame
--background "<css>" --font <key> --template <key> --layout <key> --frame
<variant> --screen-only`.

### `goldie.config.ts` — COMMITTED (reconciled against goldie 0.3.1)

`goldie.config.ts` is now in the repo root, authored against the real
`GoldieConfig` type (`node_modules`-less: `import type { GoldieConfig } from "goldie"`).
Corrections vs. the old guessed skeleton:

- Top-level `appRoot`, `appPath` (iOS .app), `bundleId` are **required**.
- `frame` is an object: `{ variant: "17-pro-silver" }`, not a bare string.
- `appearance: "dark"` is a top-level field (not `theme.screenOnly`).
- `theme` requires `headlineColor`, `subheadColor`, `copyHeightRatio`,
  `deviceWidthRatio`.
- Headlines live **on each scene**, keyed by locale: `headline: { en: "…", … }`.
- Scene `flow` is an **argent flow name** → `.argent/flows/<name>.yaml`
  (record with `argent flow record <name>`), *not* a `.flow.ts` path.
- A `store: { … }` block (studio chrome) is required; Pulvio's is filled with
  **no invented rating/review count** (`rating: 0`, `ratingCount: "New"`).
- **6 scenes** (order = array order): `01-explore`, `02-catalogue`,
  `03-sleep-timer`, `04-asmr`, `05-schedule`, `06-categories`.
- `theme.template: "uniform"`, `deviceWidthRatio: 0.92`.

### Setup status (2026-09-08, `goldie doctor`)

| Check | State | Needed |
|---|---|---|
| `goldie` CLI | ✅ installed global v0.3.1 | — |
| `adb`, node 22 | ✅ | — |
| `goldie.config.ts` | ✅ committed | — |
| `.argent/flows/` | ✅ dir created | — |
| `ffmpeg` / `ffprobe` | ✅ installed (Gyan.FFmpeg, on the **user** PATH) | open a fresh terminal so `goldie` sees it |
| **Pixel 9 Pro AVD** | ✅ created (`Pixel_9_Pro`, hand-built `config.ini`, `hw.device.name=pixel_9_pro`, 1280×2856, android-35 image) | — |
| `emulator pixel-10-pro` (goldie) | ✅ "capture will boot AVD Pixel_9_Pro" | — |
| `argent video-watermark` | ⚠️ enabled | `argent disable video-watermark` — **preview videos only**, irrelevant to Play (its promo video is a YouTube link you post yourself) |
| **`./build/pulvio-preview.apk`** | ✅ built + installed on `Pixel_9_Pro` (`emulator-5554`) | standalone `preview` build — no Metro, LogBox-free |
| **6 scene flows** | ✅ authored + passing (`.argent/flows/0{1..6}-*.yaml`) | replayed via `argent flow run` in the manual pipeline above |
| **EN set** | ✅ **captured + framed** — `out/screenshots/pixel-10-pro/en/*.png` (6× 1280×2856) | — |
| **`app/categories.tsx`** (scene 6) | ✅ added; tiles now use cover images, list virtualized (`FlatList`) | testIDs `category-tile-<sub>` |
| Premium account | ✅ signed in on `emulator-5554` (needs both the `subscriptions` row **and** a RevenueCat promotional entitlement — `resolveSubscriptionState` cross-checks RC) | — |
| **`TrackRow` premium lock hidden for subscribers** | ✅ done in APK `cb5d4f9a` — no lock/"Premium" label in scenes 2 & 4 | — |
| **Localized runs (pt-BR/de/fr/es/tr)** | ✅ **captured + framed** — `out/screenshots/pixel-10-pro/{pt-BR,de,fr,es,tr}/*.png` (6 scenes each, 1280×2856) | non-EN headlines are DRAFT — native-speaker QA still required; TR scene-1 wraps to 4 lines, PT/TR scene-2 to 3 lines |

### testID reference (added 2026-09-08)

Stable, locale-independent selectors for the Goldie / QA flows. Added via optional
`testID` pass-throughs on `SelectChip`, `Toggle`, `GlowBackground`, and local
`RoutineRow` / `AdjustButton` / `SectionHeader` props.

| testID | Where | Kind |
|---|---|---|
| `tab-index` / `tab-sleep` / `tab-profile` | bottom dock tabs (`Dock.tsx`) | button ✅ |
| `mini-player` | now-playing bar in the dock | button ✅ |
| `explore-screen` | Explore `ScrollView` | container |
| `tonight-pick` | Explore "Tonight's pick" hero | button ✅ |
| `browse-all-categories` | Explore → "All categories" link (→ `/categories`) | button ✅ |
| `categories-screen` | Category grid root | container |
| `category-tile-<sub>` | Category grid tiles (`category-tile-beyaz_gurultu`, `-lofi`, …) | button ✅ |
| `sounds-screen` | Sounds root view | container |
| `category-chip-<key>` | Sounds category chips (`category-chip-rahatlatici`, `-araclar`, `-asmr`, `-muzik`, `-all`) | chip ✅ |
| `subcategory-chip-<key>` | Sounds sub-category chips (`-yagmur`, `-tiklama`, …) | chip ✅ |
| `player-screen` | Player playing-state view | container |
| `player-winddown` | Player cooldown / premium-gate / empty view | container |
| `player-playpause` | Player primary play/pause | button ✅ |
| `player-timer-status` | Player "Fades out in mm:ss" line | text ✅ |
| `sleep-screen` | Sleep `ScrollView` | container ✅ |
| `sleep-schedule-card` | Sleep schedule hero card | container |
| `sleep-adjust` | Sleep "Adjust" schedule button | button ✅ |
| `sleep-play-at-bedtime` / `sleep-timer-row` / `sleep-fade-out` / `sleep-quiet-wakeup` | Sleep routine rows | row container |
| `sleep-fade-out-toggle` / `sleep-quiet-wakeup-toggle` | those rows' switches | switch ✅ |

✅ = verified resolving in `describe` on the S21 this session.

---

## 5. Compliance checklist (block release if unresolved)

- [ ] **No fabricated social proof in any screenshot.** ⚠️ **CONFIRMED LIVE
      2026-09-08** — the paywall renders a "WHAT PEOPLE SAY" section: 5 stars +
      "I fall asleep before the timer even ends now. First app that's actually
      worked for me." — "Emma · App Store", in a 3-dot carousel (testimonial1–3).
      PRODUCT.md § "Evidence on Hand" forbids this. **Remove from `paywall.json` /
      the paywall component before release.** Frame 4 (paywall) is already dropped
      from the screenshot set, and no star-rating overlay goes on any frame.
- [ ] **Catalogue-size claims.** ⚠️ **RENDERS LIVE 2026-09-08** — paywall benefit
      list shows "The full library — 500+ sounds and ASMR" and "New sleep sounds
      every week". Verify both against the live Supabase `tracks` table before
      either appears in a caption or description. (Free-only filter showed
      "29 sounds"; full library size unconfirmed.) This plan keeps all copy
      number-free until confirmed.
- [ ] **"Sleep stories".** `onboarding.welcomeSubtitle` says "sleep stories" but
      no Stories catalogue exists. Either add the content, fix the onboarding
      copy, or keep the term out of ASO. Not used in the drafts above.
- [ ] **Release build, not debug.** Debug builds paint a LogBox banner into
      captures. Capture from an EAS `preview`/`production` build (set
      `android.appPath` to the APK, or install the release build on the device).
- [ ] Google Play title/short-desc free of "free/best/#1", CTAs, emoji, CAPS. ✓ in drafts.
- [ ] Localized fields re-checked for length **after** translation (German
      compounds and the Apple 100-**byte** field are the usual failures).

---

## 6. iOS set — GitHub Actions (`macos-latest`)

goldie's App Store path needs macOS + Xcode iOS simulators. `.github/workflows/
ios-screenshots.yml` runs the whole thing on a `macos-latest` runner: EAS-local
build → boot an "iPhone 17 Pro Max" sim → sign in → per-locale capture → frame →
upload `out/screenshots/iphone-6.9/**` as an artifact.

**Android is NOT in this workflow.** argent's `simulator-server` can't discover
an emulator that a GH-Actions runner (`reactivecircus/android-emulator-runner`)
booted — it never writes the `avd/running/pid_*.ini` argent reads — and letting
argent boot the emulator on the runner was never made to work. Android is
captured locally instead: a fresh `screenshots`-profile APK on a Pixel emulator,
then `node scripts/goldie-capture-locales.mjs` (§4). The login + per-locale loop
is identical to iOS.

**One-time setup:**
1. **Screenshot/QA account** — a real email+password account, then flip it to
   **Premium in Supabase** directly (the `subscriptions` row / whatever
   `get_user_status` reads). On iOS `resolveSubscriptionState` trusts the
   backend `plan` as-is (RevenueCat SDK is unconfigured there), so a DB flag is
   enough — no purchase.
2. **Repo secrets** (Settings → Secrets → Actions):
   - `EXPO_TOKEN` — Expo access token (for `eas build --local` + project env)
   - `SCREENSHOT_EMAIL`, `SCREENSHOT_PASSWORD`
3. **Build-time env**: the app's `EXPO_PUBLIC_*` (Supabase, R2 CDN, RevenueCat…)
   must reach `eas build --local`. Put them on the **`screenshots`** profile's
   `env` in `eas.json`, or as EAS project env vars, or a committed `.env`.
4. `eas.json` already has the `screenshots` profile (`extends: preview` +
   `ios.simulator: true`).

**Then:** Actions tab → *iOS store screenshots* → *Run workflow*. Download the
`ios-screenshots` artifact.

**Pieces it uses (all committed):**
- `goldie.config.ts` reads `GOLDIE_IOS=1` → `devices: ["iphone-6.9"]` and
  `GOLDIE_IOS_APP` → `appPath` (no file mutation in CI). `frame` is
  `./assets/iphone-17-pro-dark.png` — the dark bezel, recoloured like
  `android.frame` (goldie has no dark iPhone variant).
- `scripts/patch-goldie.mjs` — must run on the runner too (panorama tile-2
  caption + bigger headline live in the patch).
- `.argent/flows/00-login.yaml` — types `{{secret:SCREENSHOT_EMAIL/PASSWORD}}`
  (from `ARGENT_SECRET_*` env) into the login screen (`login-email` /
  `login-password` / `login-submit` testIDs, `onboarding-have-account` on the
  welcome screen), ends on Explore. Session survives the locale loop.
- `scripts/goldie-capture-locales-ios.mjs` — iOS twin of the Android script:
  runs `00-login` once, then per locale sets `AppleLocale`/`AppleLanguages`,
  `terminate`s (no reinstall — keeps the session), replays the 6 flows, pins
  the status bar to 9:41, `xcrun simctl io … screenshot`s each raw, and
  `goldie frame --device iphone-6.9 --locale <x>`. Writes its own manifest.

`00-login` is **verified on Android** (fresh install → sign in → dismiss the
notification prompt → Explore, Premium): the `type: { into, text, submit }`
shape and the en-US login-screen text selectors are proven. Untested on iOS:
the second `when:` block (iOS system-alert "Allow" button) — adjust its selector
on the first CI run if the runner log shows it missed.

Stopgap without CI: re-`goldie frame` the existing Android raws at the
`iphone-6.9` canvas (1320×2868) — valid store dimensions but the Android status
bar / nav pill show through. Low quality; last resort.

---

## 7. Locales for capture

`en`, `pt-BR`, `de`, `fr`, `es`, `tr` — switch in-app via Settings → Language
before each flow run. Goldie writes per-locale folders; wire the locale list into
`goldie.config.ts`.
