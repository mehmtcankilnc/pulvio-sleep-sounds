import { View, Text } from "react-native";
import { useThemeColors } from "../hooks/useThemeColors";

// Shared header for the tab screens: Lora-italic eyebrow + bold title,
// so every tab opens with the same visual rhythm.
export function ScreenHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  const colors = useThemeColors();
  return (
    <View style={{ gap: 3 }}>
      <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
        {eyebrow}
      </Text>
      <Text accessibilityRole="header" className="font-bold" style={{ fontSize: 22, letterSpacing: -0.2, color: colors.text }}>
        {title}
      </Text>
    </View>
  );
}
