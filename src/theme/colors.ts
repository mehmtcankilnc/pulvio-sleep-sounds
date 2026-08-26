// Drift design system — see C:\Projects\design\drift\DESIGN.md §2.
// Single fixed dark palette; no light mode, no increased-contrast variant.
export const colors = {
  bg: "#1a1118",
  bgTop: "#2a1a21",
  bgDeep: "#120a10",
  card: "#251a22",
  cardSoft: "#31222c",
  stroke: "rgba(242,180,140,0.14)",
  text: "#f6ede9",
  muted: "#b49c99",
  faint: "#85716f",
  accent: "#f2b48c",
  button: "#d97e52",
  buttonText: "#2b130a",
  glow: "rgba(230,140,90,0.26)",
  glowSoft: "rgba(230,140,90,0.12)",
  moon: "#ffe9d6",
  star: "#f4d4bc",
  sliderTrack: "rgba(255,255,255,0.07)",
  toggleOffTrack: "rgba(255,255,255,0.09)",
  // Gentle-caution text: a warmer amber that still sits in the one ember hue
  // family (never a red alert). Used for recoverable notices — a failed load,
  // a free-limit stop — where a red flash would wreck a dark-adapted eye.
  notice: "#e0a86a",
  // Danger: the ONE sanctioned red, for irreversible destructive actions only
  // (delete account). Deliberately pushed toward the warm end and desaturated
  // so it still belongs to Dusk Ember rather than firing as a cold system-red
  // alarm in a dark room — but unmistakably red next to the ember accent.
  // Legible as text/icon/border on `bg` (~5:1); the solid danger button pairs
  // it with dark `buttonText`, never white (Button-Text Rule). The danger-zone
  // card in Settings uses only the `danger` border + overline (a full red
  // fill over-signalled on a near-monochrome bedtime screen); `dangerGlow` is
  // kept as an available faint red fill for a fully-committed danger surface.
  danger: "#e0655c",
  dangerGlow: "rgba(224,101,92,0.13)",
} as const;

export type ColorToken = keyof typeof colors;
