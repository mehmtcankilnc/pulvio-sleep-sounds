import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../hooks/useThemeColors";
import { usePressScale } from "../hooks/usePressScale";
import { categoryIcon } from "../lib/categoryIcon";
import { categoryLabel, subcategoryLabel } from "../lib/catalogTaxonomy";
import { LockIcon } from "./icons";
import type { Track } from "../types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// The one catalog row. Explore and Favorites both render tracks through it so
// the two lists stay pixel-identical — same lead icon, premium badge, 56pt
// hit height, and the app-wide press-scale.
export function TrackRow({
  track,
  premiumLabel,
  onPress,
}: {
  track: Track;
  premiumLabel: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const Icon = categoryIcon(track.category, track.subcategory);
  const press = usePressScale(0.98);
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={track.isPremiumOnly ? `${track.title}, ${premiumLabel}` : track.title}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          minHeight: 56,
          paddingHorizontal: 14,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.stroke,
          borderRadius: 16,
        },
        press.animatedStyle,
      ]}
    >
      <Icon size={20} color={colors.accent} strokeWidth={1.6} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
          {track.title}
        </Text>
        {track.isPremiumOnly ? (
          <Text style={{ fontSize: 11, color: colors.accent }}>{premiumLabel}</Text>
        ) : null}
      </View>
      {/* Trailing lock is the row's own scannable free/premium tell — a
          second, glance-only signal alongside the text label below the
          title, without a colored chip/badge (DESIGN.md forbids those). */}
      {track.isPremiumOnly ? <LockIcon size={15} color={colors.muted} strokeWidth={1.6} /> : null}
    </AnimatedPressable>
  );
}

// The catalog's category/subcategory section header — the DESIGN.md overline
// (700 / 11px / +tracking / muted). Labels come through the `catalog` i18n
// namespace (never the raw `rahatlatici`/`beyaz_gurultu` db slugs) so this
// reads as real words in every supported language, and .toLocaleUpperCase
// gets the *translated* string — critical for Turkish, where uppercasing the
// untranslated ascii slug "rahatlatici" via the tr locale produces the wrong
// dotted "İ" (should be dotless "I": RAHATLATICI, not RAHATLATİCİ).
export function TrackSectionHeader({
  category,
  subcategory,
  language,
}: {
  category: string;
  subcategory: string;
  language: string;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation("catalog");
  const label = `${categoryLabel(t, category)} · ${subcategoryLabel(t, subcategory)}`;
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.3,
        color: colors.muted,
        paddingTop: 14,
        paddingBottom: 8,
      }}
    >
      {label.toLocaleUpperCase(language)}
    </Text>
  );
}
