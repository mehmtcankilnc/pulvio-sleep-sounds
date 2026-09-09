import { Pressable, Text, ActivityIndicator, type GestureResponderEvent } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useThemeColors } from "../../hooks/useThemeColors";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: "primary" | "outline" | "danger" | "danger-outline";
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

// Drift primary CTA (DESIGN.md §7): full-width pill, min-h 54, `button` bg,
// `buttonText` label, soft ember-glow shadow. Doubles as a selectable chip
// (language picker) — pass variant="primary" for the selected state.
// `danger` / `danger-outline` are reserved for irreversible destructive
// actions (delete account) — the one place the app uses red. Danger stays
// flat: the shadow carve-out in DESIGN.md is the ember primary only.
export function Button({ label, onPress, variant = "primary", disabled, loading, accessibilityLabel, testID }: Props) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const isDangerOutline = variant === "danger-outline";
  const isSolid = isPrimary || isDanger;

  const backgroundColor = isPrimary ? colors.button : isDanger ? colors.danger : "transparent";
  const borderColor = isDangerOutline ? colors.danger : colors.stroke;
  const labelColor = isSolid ? colors.buttonText : isDangerOutline ? colors.danger : colors.text;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      className="rounded-full px-6 flex-row items-center justify-center"
      style={[
        {
          minHeight: 54,
          paddingVertical: 8,
          backgroundColor,
          borderWidth: isSolid ? 0 : 1,
          borderColor,
          opacity: isDisabled ? 0.5 : 1,
          ...(isPrimary
            ? { shadowColor: colors.glow, shadowOpacity: 1, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 6 }
            : null),
        },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, {
          duration: 150,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          reduceMotion: ReduceMotion.System,
        });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {
          duration: 150,
          easing: Easing.bezier(0.23, 1, 0.32, 1),
          reduceMotion: ReduceMotion.System,
        });
      }}
      disabled={isDisabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <Text className="font-bold" style={{ fontSize: 15, color: labelColor }}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}
