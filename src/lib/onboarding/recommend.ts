import type { Track } from "../../types";
import type { SleepFrequency, VoicePreference } from "./useOnboardingAnswers";

// Designed stub. The MATCHING LOGIC here is real and deterministic; what is
// stubbed is the signal it runs on — direct subcategory weighting, not a
// curated mood/tag taxonomy. When the catalog gains real tags, replace the
// body of `recommendPlan` with a query; the signature and the "always 2-3
// real, playable tracks" guarantee stay.
//
// 2026-09-05: previously matched English keywords ("rain", "ocean", "piano",
// ...) against `track.title` — but title is localized (src/lib/trackTitle.ts)
// and for Turkish (the DB source-of-truth language, and this app's primary
// locale) it never contained those English words, so almost every match was
// a coincidence (e.g. the literal subcategory slug "ambient" happening to
// equal the English keyword "ambient"). Matching directly against
// `track.subcategory` — a stable, language-independent id from
// scripts/catalog.mjs — fixes that for every locale and is also how the new
// araclar/asmr subcategories (bkz. pulvio-audio-sourcing belleği) get wired
// into the "asmr" sound-preference answer below.
export type PlanAnswers = {
  frequency: SleepFrequency | null;
  struggles: string[];
  sounds: string[];
  voice: VoicePreference | null;
};

const MIN_RESULTS = 2;
const MAX_RESULTS = 3;

// Struggle / sound answer key -> subcategory slugs it should favor.
const SUBCATEGORY_WEIGHTS: Record<string, string[]> = {
  racingThoughts: ["ambient", "lofi", "piyano"],
  stressTension: ["piyano", "ambient", "kafe"],
  noiseAround: ["beyaz_gurultu", "kahverengi_gurultu", "pembe_gurultu", "fon_makinesi"],
  irregularSchedule: ["ambient", "lofi", "beyaz_gurultu"],
  wakingAtNight: ["kahverengi_gurultu", "beyaz_gurultu", "ates"],
  rainThunder: ["yagmur", "gok_gurultusu"],
  oceanWaves: ["deniz", "dere"],
  whiteNoise: ["beyaz_gurultu", "kahverengi_gurultu", "pembe_gurultu"],
  // Real ASMR content is non-vocal mechanical triggers (tapping, keyboard
  // typing) — no whispered/spoken tracks exist in the catalog.
  asmr: ["tiklama", "klavye"],
  pianoAmbient: ["piyano", "ambient"],
  fireplace: ["ates"],
  vehicles: ["otobus", "arac_ici", "tren", "ucak_kabin"],
};

// The catalog has no narrated/spoken tracks at all (bkz. pulvio-audio-sourcing
// belleği) — "asmr" is the closest thing to a non-silent, presence-carrying
// sound, so it's what withVoice/noVoice nudges toward or away from.
function scoreTrack(track: Track, wantedSubcats: string[], voice: VoicePreference | null): number {
  let score = wantedSubcats.includes(track.subcategory) ? 2 : 0;
  const isAsmr = track.category === "asmr";
  if (voice === "withVoice" && isAsmr) score += 3;
  if (voice === "noVoice" && isAsmr) score -= 4;
  return score;
}

/**
 * Pick 2-3 real tracks from `catalog` that best match the quiz answers.
 * Always returns playable `Track` objects (never fabricated ids). Pads from
 * the head of the catalog when the answers are thin or the catalog is small,
 * so `plan-ready` and the preview always have something to show. Returns an
 * empty array only when the catalog itself is empty.
 */
export function recommendPlan(answers: PlanAnswers, catalog: Track[]): Track[] {
  if (catalog.length === 0) return [];

  const wantedSubcats = [...answers.sounds, ...answers.struggles].flatMap((key) => SUBCATEGORY_WEIGHTS[key] ?? []);

  const ranked = catalog
    .map((track) => ({ track, score: scoreTrack(track, wantedSubcats, answers.voice) }))
    .sort((a, b) => b.score - a.score);

  const picked: Track[] = [];
  for (const { track, score } of ranked) {
    if (score <= 0) break;
    picked.push(track);
    if (picked.length >= MAX_RESULTS) break;
  }

  if (picked.length < MIN_RESULTS) {
    for (const track of catalog) {
      if (picked.some((p) => p.id === track.id)) continue;
      picked.push(track);
      if (picked.length >= MIN_RESULTS) break;
    }
  }

  return picked.slice(0, MAX_RESULTS);
}
