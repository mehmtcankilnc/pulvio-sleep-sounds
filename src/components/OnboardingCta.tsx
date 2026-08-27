import { Pressable, Text } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useThemeColors } from "../hooks/useThemeColors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// The one CTA pattern for the onboarding funnel. Same 54px ember pill as
// DESIGN.md §7, but with an explicit inert disabled state (flat `card`
// surface, `faint` label, no glow) rather than a dimmed ember — the funnel
// gates every step's Continue until the step is answered, and a greyed-ember
// button reads as "tap me" where a flat one reads as "not yet".
export function OnboardingCta({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function press(to: number) {
    scale.value = withTiming(to, { duration: 150, easing: Easing.bezier(0.23, 1, 0.32, 1), reduceMotion: ReduceMotion.System });
  }

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => !disabled && press(0.97)}
      onPressOut={() => !disabled && press(1)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[
        {
          minHeight: 54,
          paddingVertical: 8,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: disabled ? colors.card : colors.button,
          borderWidth: 1,
          borderColor: disabled ? colors.stroke : "transparent",
          ...(disabled
            ? null
            : { shadowColor: colors.glow, shadowOpacity: 1, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 6 }),
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: 15, fontWeight: "700", color: disabled ? colors.faint : colors.buttonText }}>{label}</Text>
    </AnimatedPressable>
  );
}
