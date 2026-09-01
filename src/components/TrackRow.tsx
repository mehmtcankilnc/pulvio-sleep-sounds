import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useThemeColors } from "../hooks/useThemeColors";
import { usePressScale } from "../hooks/usePressScale";
import { categoryIcon } from "../lib/categoryIcon";
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
    </AnimatedPressable>
  );
}

// The catalog's category/subcategory section header — the DESIGN.md overline
// (700 / 11px / +tracking / muted), with " / " tightened to " · ". Shared so
// Explore and Favorites label their sections the same way.
export function TrackSectionHeader({ title, language }: { title: string; language: string }) {
  const colors = useThemeColors();
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
      {title.replace(" / ", " · ").toLocaleUpperCase(language)}
    </Text>
  );
}
