import type { JSX } from "react";
import type { IconProps } from "../components/icons";
import { CloudRainIcon, WavesIcon, WindIcon, MicIcon, MusicIcon, FlameIcon, MoonIcon } from "../components/icons";

// Best-effort keyword match from the real `category`/`subcategory` strings
// (see src/types/index.ts) onto the Drift icon set (DESIGN.md §6). The real
// taxonomy should get an explicit id->icon mapping once it's finalized —
// tracked in docs/DRIFT_IMPLEMENTATION_PLAN.md.
const RULES: Array<[RegExp, (props: IconProps) => JSX.Element]> = [
  [/rain|thunder|storm|yağmur|gök\s*gürültüsü/i, CloudRainIcon],
  [/ocean|wave|water|sea|su_?sesi|dalga|deniz|okyanus/i, WavesIcon],
  [/white\s*noise|wind|fan|noise|beyaz\s*gürültü|rüzgar/i, WindIcon],
  [/asmr|whisper|mic|tap|fısıltı/i, MicIcon],
  [/piano|music|ambient|melody|muzik|müzik|ambiyans|rahatlatici|rahatlatıcı/i, MusicIcon],
  [/fire|flame|crackl|camp|ateş|şömine/i, FlameIcon],
];

export function categoryIcon(category: string, subcategory?: string): (props: IconProps) => JSX.Element {
  const haystack = `${category} ${subcategory ?? ""}`;
  for (const [pattern, Icon] of RULES) {
    if (pattern.test(haystack)) return Icon;
  }
  return MoonIcon;
}
