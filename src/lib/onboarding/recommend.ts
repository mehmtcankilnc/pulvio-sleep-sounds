import type { Track } from "../../types";
import type { SleepFrequency, VoicePreference } from "./useOnboardingAnswers";

// Designed stub. The MATCHING LOGIC here is real and deterministic; what is
// stubbed is the signal it runs on — plain keyword hits against the track's
// title / category / subcategory, not a curated mood/tag taxonomy. When the
// catalog gains real tags, replace the body of `recommendPlan` with a query;
// the signature and the "always 2-3 real, playable tracks" guarantee stay.

export type PlanAnswers = {
  frequency: SleepFrequency | null;
  struggles: string[];
  sounds: string[];
  voice: VoicePreference | null;
};

const MIN_RESULTS = 2;
const MAX_RESULTS = 3;

// Struggle / sound answer key -> words we hope to see in a track's metadata.
const KEYWORDS: Record<string, string[]> = {
  racingThoughts: ["calm", "quiet", "mind", "drone", "ambient", "meditat"],
  stressTension: ["calm", "soft", "warm", "ambient", "piano", "breath"],
  noiseAround: ["white noise", "brown noise", "pink noise", "noise", "fan", "static", "rain"],
  irregularSchedule: ["deep", "night", "sleep", "ambient"],
  wakingAtNight: ["deep", "continuous", "steady", "drone", "night"],
  rainThunder: ["rain", "thunder", "storm", "downpour"],
  oceanWaves: ["ocean", "wave", "sea", "shore", "surf"],
  whiteNoise: ["white noise", "brown noise", "pink noise", "noise", "fan", "static", "hum"],
  asmr: ["asmr", "whisper", "tapping", "brush"],
  pianoAmbient: ["piano", "ambient", "keys", "felt", "pad"],
  fireplace: ["fire", "fireplace", "campfire", "crackle", "hearth", "wood"],
};

const VOICE_WORDS = ["story", "voice", "narrat", "spoken", "tale", "asmr", "whisper"];

function haystack(track: Track): string {
  return `${track.title} ${track.category} ${track.subcategory}`.toLowerCase();
}

function scoreTrack(track: Track, wantedWords: string[], voice: VoicePreference | null): number {
  const hay = haystack(track);
  let score = 0;
  for (const word of wantedWords) {
    if (hay.includes(word)) score += 2;
  }
  const hasVoice = VOICE_WORDS.some((w) => hay.includes(w));
  if (voice === "withVoice" && hasVoice) score += 3;
  if (voice === "noVoice" && hasVoice) score -= 4;
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

  const wantedWords = [...answers.sounds, ...answers.struggles].flatMap((key) => KEYWORDS[key] ?? []);

  const ranked = catalog
    .map((track) => ({ track, score: scoreTrack(track, wantedWords, answers.voice) }))
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
