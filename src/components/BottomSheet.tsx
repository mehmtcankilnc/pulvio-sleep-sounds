import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useThemeColors } from "../hooks/useThemeColors";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const DURATION = 240;

// Every bottom sheet in the app goes through this instead of a raw
// <Modal animationType="slide"> — RN's built-in slide transition moves the
// *entire* modal surface (backdrop included) as one block, which reads as
// "backdrop pops in, then the sheet slides up" on open and the reverse on
// close, rather than one coordinated motion. Here the backdrop's opacity
// and the sheet's translateY are both driven off the same shared value, so
// they're simultaneous by construction — `animationType="none"` disables
// RN's own transition entirely so it can't reintroduce the same issue.
// Still uses RN's <Modal> (not an in-tree absolute View) so it keeps
// rendering in its own top-level layer, above the tab bar/Dock like every
// sheet in this app already relied on.
export function BottomSheet({
  visible,
  onClose,
  style,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [sheetHeight, setSheetHeight] = useState(400);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: DURATION, easing: EASE_OUT, reduceMotion: ReduceMotion.System });
    } else {
      progress.value = withTiming(0, { duration: DURATION, easing: EASE_OUT, reduceMotion: ReduceMotion.System }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * sheetHeight }] }));

  if (!mounted) return null;

  function handleLayout(e: LayoutChangeEvent) {
    const height = e.nativeEvent.layout.height;
    if (height > 0) setSheetHeight(height);
  }

  // Stack the Android system nav bar inset on top of whatever bottom padding
  // the caller's `style` already asks for, so a pinned action ("Continue",
  // "Log out", the last language row) never sits under the 3-button nav bar.
  const flat = StyleSheet.flatten(style) ?? {};
  const callerPadBottom =
    typeof flat.paddingBottom === "number"
      ? flat.paddingBottom
      : typeof flat.padding === "number"
        ? flat.padding
        : 0;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" }, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" />
        </Animated.View>
        <Animated.View
          onLayout={handleLayout}
          style={[
            { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
            sheetStyle,
            style,
            { paddingBottom: callerPadBottom + insets.bottom },
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
