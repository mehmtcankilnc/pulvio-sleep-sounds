# Pulvio marketing content

Short-form content generated entirely from code with Remotion. **TikTok runs on photo-mode slideshows** (the "rain" format, see Slideshows below); YouTube Shorts and Instagram get videos (1080x1920, 30fps) and the occasional carousel.

```bash
cd marketing
npm install
npm run studio                                        # live preview
npx remotion render src/index.ts pov-3am out/pov-3am.mp4
```

- `src/theme.ts` mirrors the app's Drift colors. `src/parts.tsx` holds scene pieces, `src/videos.tsx` the formats, `src/Root.tsx` the registered variants (change `defaultProps` or add a `<Composition>` for a new hook).
- Formats: `pov-3am`, `rain-loop`, `pick-one` (src/videos.tsx) and `sound-cycle`, `fade-out`, `cover-focus` (src/videos2.tsx, audio-reactive cover disc) `night-hook` (src/videos3.tsx: chaos intro, hard drop, calm) `pendulum-wave`, `stare-challenge` (src/videos5.tsx) and `orbit-wave` (src/videos6.tsx): attention-first formats that are not about the app, ending with a short bridge (real cover art + "200+ sounds for sleep") before the CTA. Their soundtracks are synthesized by `sfx_pendulum.py [pendulum|orbit]`; to make another "wave" video, add a config there and a composition that uses the same hit times. Covers are the app's own art, resized into `public/covers/`.
- Voice-overs: one voice per video (`voice.py`: night=Ava, cycle=Brian, fade=Andrew, pov=Brian, pick=Ava, stare=Andrew; `cover-focus` and `rain-loop` have none). Files live in `public/voice/<video>/`. To change a line or a voice: edit `voice.py`, run `python voice.py [video...]`, then re-check timings in the composition. Needs `pip install edge-tts` and internet. After generating, run `python check_voice.py public/voice/<video>/*.mp3` (local Whisper) to catch mispronounced words. SFX (tick, riser, drop) are synthesized with ffmpeg into `public/sfx/`.
- Audio comes from the app's own CDN catalog (CC0). Download into `public/audio/` (gitignored), e.g. `https://cdn.pulvio.mehmtcankilinc.com/tracks/cadir_yagmuru/421047.mp3`.
- Log every post in `tracking/posts.csv` (one row per post per platform) so formats and hooks can be compared.
- Copy rules: no fabricated testimonials or health claims; the free tier limit is real, do not imply "unlimited".

## Slideshows (TikTok photo mode)

`src/slides.tsx` renders slideshow slides as stills (1080x1920, same Drift theme, the app's real covers from `public/covers/`). Words stay inside the centered `Safe` box (outside the top 240px and bottom 520px, 180px side margins, where TikTok puts its UI). Full-bleed backgrounds come from `public/bg/` (1080x1920 crops of the app covers). `slides-3am-1` ... `slides-3am-7` are registered in `Root.tsx`:

```bash
npx remotion still src/index.ts slides-3am-1 out/slides/3am/01.png
```

The current TikTok format is the rain format (`SlidesRain`: 4 slides a deck, TikTok-style Figtree bold text with outline from `public/fonts/`, OFL, over the app's own covers in `public/bg/`). Four decks exist, `slides-rain-<n>`, `slides-tent-<n>`, `slides-night-<n>`, `slides-sound-<n>` (n = 1-4); their text lives in `RAIN_DECKS` in `slides.tsx`, so a new deck is a new entry there plus its name in the list in `Root.tsx`. Render one with `npx remotion still src/index.ts slides-tent-1 out/slides/tent/01.png`. `slides-3am` and `slides-3am-ig-*` are **legacy** (the 3 AM group chat deck, posted on Instagram only).

To add a deck, copy `Slides3am`, change the slide data, and register `<Still>`s. Plan, caption and alt text for the current deck: `tracking/plan-2026-11-04.md`. Rules for slideshows are in `.claude/agents/pulvio-content.md`.

## Fresh clone setup

`public/audio/`, `out/` and `node_modules/` are gitignored. To rebuild on a new machine (needs Node 22, ffmpeg, Python 3 with `pip install edge-tts faster-whisper numpy`):

```bash
cd marketing && npm install
mkdir -p public/audio && cd public/audio
B=https://cdn.pulvio.mehmtcankilinc.com/tracks
curl -o rain.mp3  $B/cadir_yagmuru/421047.mp3
curl -o drops.mp3 $B/damla/269871.mp3
curl -o lake.mp3  $B/gol_kiyisi/176820.mp3
curl -o brown.mp3 $B/kahverengi_gurultu/9000007.mp3
# normalize (-16 LUFS, first 60s), same for each file:
for f in rain drops lake brown; do ffmpeg -y -i $f.mp3 -t 60 -af loudnorm=I=-16:TP=-1.5:LRA=11 -ar 44100 -b:a 192k n_$f.mp3 && mv n_$f.mp3 $f.mp3; done
cd ../.. && python voice.py && python sfx_pendulum.py && bash make_sfx.sh
```

`public/voice/` (from `voice.py`), `public/sfx/` (`make_sfx.sh` for tick/riser/drop/drone, `sfx_pendulum.py` for pendulum/orbit), `public/covers/` (resized from the app's cover art) and `public/icon.png` are committed.

## Adding a video

1. Write the scene in `src/videos*.tsx` from the pieces in `parts.tsx` (`Glow`, `Stars`, `Kinetic` word-pop text, `Line`, `Voice`, `Bridge`, `Cta`) and `disc.tsx` (`CoverDisc`, audio-reactive).
2. Register it in `src/Root.tsx` (1080x1920, 30fps) and run `npx tsc -p .`.
3. If it has a voice: `voice.py` -> `check_voice.py` -> set timings from `ffprobe` durations.
4. Render, look at stills, measure loudness, make the cover, write captions (see `ACCOUNTS.md`), add the day to the schedule.
5. Tell the owner what to upload and when (Turkey time).

The `pulvio-content` agent (`.claude/agents/pulvio-content.md`) carries the owner's taste and rules for all of this.
