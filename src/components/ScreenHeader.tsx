import type { ReactNode } from "react";
import { View, Text } from "react-native";
import { useThemeColors } from "../hooks/useThemeColors";

// Shared header for the tab screens: Lora-italic eyebrow + bold title,
// so every tab opens with the same visual rhythm. `trailing` is an optional
// top-right slot (the Explore/Sleep premium badge) — kept generic rather
// than a `premium`-specific prop so this component doesn't need to know
// what it's hosting.
export function ScreenHeader({ eyebrow, title, trailing }: { eyebrow: string; title: string; trailing?: ReactNode }) {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <View style={{ gap: 3, flexShrink: 1 }}>
        <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
          {eyebrow}
        </Text>
        <Text accessibilityRole="header" className="font-bold" style={{ fontSize: 22, letterSpacing: -0.2, color: colors.text }}>
          {title}
        </Text>
      </View>
      {trailing ? <View style={{ paddingTop: 3 }}>{trailing}</View> : null}
    </View>
  );
}
