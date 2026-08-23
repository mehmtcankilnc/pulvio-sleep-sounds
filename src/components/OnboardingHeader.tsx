import { View, Text, Pressable } from "react-native";
import { useThemeColors } from "../hooks/useThemeColors";
import { ChevronLeftIcon } from "./icons";

// DESIGN.md §5/§7: back circle + linear progress + Skip, shared across the
// 3-step onboarding quiz.
export function OnboardingHeader({
  step,
  totalSteps,
  onBack,
  onSkip,
  skipLabel,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  const colors = useThemeColors();
  const ratio = step / totalSteps;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <Pressable
        onPress={onBack}
        style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, alignItems: "center", justifyContent: "center" }}
        accessibilityRole="button"
      >
        <ChevronLeftIcon size={20} color={colors.muted} strokeWidth={1.7} />
      </Pressable>
      <View style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: colors.sliderTrack }}>
        <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${ratio * 100}%`, borderRadius: 999, backgroundColor: colors.button }} />
      </View>
      {onSkip ? (
        <Pressable onPress={onSkip} style={{ minWidth: 44, minHeight: 44, alignItems: "flex-end", justifyContent: "center" }} accessibilityRole="button">
          <Text style={{ fontSize: 13, color: colors.faint }}>{skipLabel}</Text>
        </Pressable>
      ) : (
        <View style={{ minWidth: 44, minHeight: 44 }} />
      )}
    </View>
  );
}
