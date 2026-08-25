import { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

// Shared press-feedback recipe (DESIGN.md "Do's": scale ~0.97, 150ms,
// cubic-bezier(0.23,1,0.32,1) — the app-wide vocabulary Button.tsx already
// uses for its own Pressable. Any other pressable row should reuse this
// instead of an opacity-only fallback.
export function usePressScale(scaleTo = 0.97) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function onPressIn() {
    scale.value = withTiming(scaleTo, {
      duration: 150,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      reduceMotion: ReduceMotion.System,
    });
  }

  function onPressOut() {
    scale.value = withTiming(1, {
      duration: 150,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      reduceMotion: ReduceMotion.System,
    });
  }

  return { animatedStyle, onPressIn, onPressOut };
}
