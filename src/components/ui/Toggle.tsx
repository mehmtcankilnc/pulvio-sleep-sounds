import { useEffect } from "react";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "../../hooks/useThemeColors";

const TRACK_WIDTH = 44;
const TRACK_PADDING = 3;
const KNOB_SIZE = 20;
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - TRACK_PADDING * 2;

// DESIGN.md §7: track 44×26 r999 — on: `button` track, `moon` knob right;
// off: rgba(255,255,255,0.09) track, `faint` knob left.
export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
  testID,
}: {
  value: boolean;
  onValueChange: () => void;
  accessibilityLabel: string;
  // Stable target for QA / screenshot (Goldie) flows.
  testID?: string;
}) {
  const colors = useThemeColors();
  const progress = useSharedValue(value ? 1 : 0);
  const knobX = useSharedValue(value ? KNOB_TRAVEL : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.77, 0, 0.175, 1),
      reduceMotion: ReduceMotion.System,
    });
    knobX.value = withSpring(value ? KNOB_TRAVEL : 0, {
      duration: 400,
      dampingRatio: 0.8,
      reduceMotion: ReduceMotion.System,
    });
  }, [value, progress, knobX]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.toggleOffTrack, colors.button]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.faint, colors.moon]),
    transform: [{ translateX: knobX.value }],
  }));

  function handlePress() {
    onValueChange();
    Haptics.selectionAsync();
  }

  return (
    <Pressable
      onPress={handlePress}
      testID={testID}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[
          { width: TRACK_WIDTH, height: 26, borderRadius: 999, padding: TRACK_PADDING, justifyContent: "center" },
          trackStyle,
        ]}
      >
        <Animated.View style={[{ width: KNOB_SIZE, height: KNOB_SIZE, borderRadius: 999 }, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}
