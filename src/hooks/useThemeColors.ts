import { colors } from "../theme/colors";

// Drift is dark-only with a single fixed palette (see DESIGN.md §2) — no
// increased-contrast variant, no light mode. Kept as a hook (rather than a
// plain import) so screens don't need to change if a future theming axis
// is introduced.
export function useThemeColors() {
  return colors;
}
