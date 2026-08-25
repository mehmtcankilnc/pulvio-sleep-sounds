import { useEffect } from "react";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "../../hooks/useThemeColors";

// Same recipe as Toggle: withTiming + interpolateColor crossfade on
// select/deselect, plus a selection haptic on commit. Reused everywhere a
// screen offers a "pick one of N" row of pills (timer, language) so
// selection state feels consistent app-wide.
export function SelectChip({
  label,
  selected,
  onPress,
  height = 44,
  fontSize = 13,
  paddingHorizontal = 18,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  height?: number;
  fontSize?: number;
  paddingHorizontal?: number;
  accessibilityLabel?: string;
}) {
  const colors = useThemeColors();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: 180,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
      reduceMotion: ReduceMotion.System,
    });
  }, [selected, progress]);

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.card, colors.button]),
    borderColor: interpolateColor(progress.value, [0, 1], [colors.stroke, colors.button]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.muted, colors.buttonText]),
  }));

  function handlePress() {
    if (!selected) Haptics.selectionAsync();
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
    >
      <Animated.View
        style={[
          { height, paddingHorizontal, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center" },
          chipStyle,
        ]}
      >
        {/* Guards against a cramped flex slot (Sleep tab's 4-up timer row)
            wrapping the label to a second line — the chip's fixed `height`
            doesn't grow with it, so a wrapped label just gets clipped/
            overlapping instead of the row resizing to fit. */}
        <Animated.Text numberOfLines={1} style={[{ fontSize, fontWeight: selected ? "700" : "600" }, textStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}
