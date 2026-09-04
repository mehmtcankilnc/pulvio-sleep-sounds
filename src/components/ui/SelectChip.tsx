import { useLayoutEffect, type ReactNode } from "react";
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
  role = "button",
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  height?: number;
  fontSize?: number;
  paddingHorizontal?: number;
  accessibilityLabel?: string;
  // Every call site is a "pick one of N" chip except the free-only filter,
  // which is an independent on/off — role="switch" tells a screen reader
  // that difference instead of announcing identical button/selected
  // semantics for two controls that behave differently.
  role?: "button" | "switch";
  // A leading glyph (e.g. a lock on an all-premium category) rendered before
  // the label. Not color-animated with the text crossfade — it's a small,
  // decorative tell, not the chip's primary legibility surface.
  icon?: ReactNode;
}) {
  const colors = useThemeColors();
  const progress = useSharedValue(selected ? 1 : 0);

  // useLayoutEffect, not useEffect: a passive effect is scheduled after
  // the commit and can sit behind whatever else the JS thread is doing —
  // on a screen where this chip's own `selected` flip also triggers a
  // large sibling re-render (a full SectionList content swap), that queue
  // delay was visible as the tapped chip's color sitting stale for the
  // better part of a second after the list had already updated. A layout
  // effect fires synchronously as part of the same commit instead of
  // waiting its turn.
  useLayoutEffect(() => {
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

  // Visual chip height can drop to ~34–38px in dense rows (DESIGN.md
  // Pills & Chips), but the tappable area must still hit the 44×44 floor —
  // hitSlop makes up the difference invisibly rather than growing the chip.
  const verticalHitSlop = Math.max(0, Math.ceil((44 - height) / 2));

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={{ top: verticalHitSlop, bottom: verticalHitSlop }}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={role === "switch" ? { checked: selected } : { selected }}
    >
      <Animated.View
        style={[
          {
            height,
            paddingHorizontal,
            borderRadius: 999,
            borderWidth: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          },
          chipStyle,
        ]}
      >
        {icon}
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
