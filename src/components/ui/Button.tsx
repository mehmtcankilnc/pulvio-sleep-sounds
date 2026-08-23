import { Pressable, Text, ActivityIndicator, type GestureResponderEvent } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useThemeColors } from "../../hooks/useThemeColors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
};

// Drift primary CTA (DESIGN.md §7): full-width pill, h 54, `button` bg,
// `buttonText` label, soft glow shadow. Doubles as a selectable chip
// (language picker) — pass variant="primary" for the selected state.
export function Button({ label, onPress, variant = "primary", disabled, loading, accessibilityLabel }: Props) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      className="rounded-full px-6 items-center justify-center"
      style={[
        {
          height: 54,
          backgroundColor: isPrimary ? colors.button : "transparent",
          borderWidth: isPrimary ? 0 : 1,
          borderColor: colors.stroke,
          opacity: isDisabled ? 0.5 : 1,
          ...(isPrimary
            ? { shadowColor: colors.glow, shadowOpacity: 1, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 6 }
            : null),
        },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 150, easing: Easing.bezier(0.23, 1, 0.32, 1) });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150, easing: Easing.bezier(0.23, 1, 0.32, 1) });
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.buttonText : colors.text} />
      ) : (
        <Text className="font-bold" style={{ fontSize: 15, color: isPrimary ? colors.buttonText : colors.text }}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}
