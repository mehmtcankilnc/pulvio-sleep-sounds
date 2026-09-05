import type { JSX } from "react";
import type { IconProps } from "../components/icons";
import {
  CloudRainIcon,
  ThunderstormIcon,
  WavesIcon,
  WindIcon,
  FanIcon,
  RadioIcon,
  LeafIcon,
  BirdsongIcon,
  BugIcon,
  FlameIcon,
  CafeIcon,
  MusicIcon,
  MoonIcon,
  BusIcon,
  CarIcon,
  TrainIcon,
  AirplaneIcon,
  FingerTapIcon,
  KeypadIcon,
} from "../components/icons";

// Explicit id -> icon table, one entry per SUBCATEGORY_ORDER member (see
// catalogTaxonomy.ts) — replaces the old keyword-regex heuristic, which
// collapsed most of the catalog onto two glyphs (MusicIcon for everything
// under "rahatlatici" that missed its earlier rules, WindIcon for every
// noise color) because the taxonomy wasn't finalized when it was written.
// A critique flagged this: a 2-up icon grid whose icon layer can't tell 12
// of 17 subcategories apart isn't doing its job. Now every subcategory gets
// its own glyph; only the two top-level `category` ids fall back to a
// keyword match, and MoonIcon remains the last-resort default for a future
// subcategory added before its icon is.
const SUBCATEGORY_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  yagmur: CloudRainIcon,
  deniz: WavesIcon,
  dere: WavesIcon,
  gok_gurultusu: ThunderstormIcon,
  kus_sesi: BirdsongIcon,
  orman: LeafIcon,
  ruzgar: WindIcon,
  gece_bocekleri: BugIcon,
  ates: FlameIcon,
  fon_makinesi: FanIcon,
  beyaz_gurultu: RadioIcon,
  kahverengi_gurultu: RadioIcon,
  pembe_gurultu: RadioIcon,
  kafe: CafeIcon,
  otobus: BusIcon,
  arac_ici: CarIcon,
  tren: TrainIcon,
  ucak_kabin: AirplaneIcon,
  tiklama: FingerTapIcon,
  klavye: KeypadIcon,
  piyano: MusicIcon,
  lofi: MusicIcon,
  ambient: MusicIcon,
};

const CATEGORY_FALLBACK: Array<[RegExp, (props: IconProps) => JSX.Element]> = [
  [/muzik|müzik|music/i, MusicIcon],
  [/rahatlatici|rahatlatıcı|calming/i, WavesIcon],
  [/araclar|araçlar|vehicles/i, CarIcon],
  [/asmr/i, FingerTapIcon],
];

export function categoryIcon(category: string, subcategory?: string): (props: IconProps) => JSX.Element {
  if (subcategory && subcategory in SUBCATEGORY_ICONS) return SUBCATEGORY_ICONS[subcategory];
  for (const [pattern, Icon] of CATEGORY_FALLBACK) {
    if (pattern.test(category)) return Icon;
  }
  return MoonIcon;
}
