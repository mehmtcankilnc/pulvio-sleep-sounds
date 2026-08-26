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
} as const;

export type ColorToken = keyof typeof colors;
