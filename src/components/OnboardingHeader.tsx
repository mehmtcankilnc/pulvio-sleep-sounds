import { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "../hooks/useThemeColors";
import { ChevronLeftIcon } from "./icons";

const HIT = 44;
const BAR_HEIGHT = 12;

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

// Onboarding brief: a bare back chevron, one Duolingo-weight progress bar
// that advances as each step is answered, and an optional Skip. Shared
// across the 6-step pre-auth funnel and the plan-ready reveal (6/6,
// pre-filled). The bar sits at `(step - 1) / totalSteps` on arrival and
// animates to `step / totalSteps` once `answered` flips true.
export function OnboardingHeader({
  step,
  totalSteps,
  answered = false,
  onBack,
  onSkip,
  skipLabel,
  backLabel = "Back",
}: {
  step: number;
  totalSteps: number;
  answered?: boolean;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  backLabel?: string;
}) {
  const colors = useThemeColors();
  const fill = useSharedValue(clamp01((step - 1) / totalSteps));

  useEffect(() => {
    fill.value = withTiming(clamp01((step - (answered ? 0 : 1)) / totalSteps), {
      duration: 420,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      reduceMotion: ReduceMotion.System,
    });
  }, [step, totalSteps, answered, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={6}
          style={{ width: HIT, height: HIT, marginLeft: -10, alignItems: "center", justifyContent: "center" }}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
        >
          <ChevronLeftIcon size={24} color={colors.muted} strokeWidth={1.7} />
        </Pressable>
      ) : (
        <View style={{ width: HIT - 10, height: HIT }} />
      )}

      <View
        style={{ flex: 1, height: BAR_HEIGHT, borderRadius: 999, backgroundColor: colors.sliderTrack, overflow: "hidden" }}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: totalSteps, now: step }}
      >
        <Animated.View style={[{ height: "100%", borderRadius: 999, backgroundColor: colors.button }, fillStyle]} />
      </View>

      {onSkip ? (
        <Pressable
          onPress={onSkip}
          hitSlop={6}
          style={{ minWidth: HIT, minHeight: HIT, alignItems: "flex-end", justifyContent: "center" }}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>{skipLabel}</Text>
        </Pressable>
      ) : (
        <View style={{ width: HIT, height: HIT }} />
      )}
    </View>
  );
}
