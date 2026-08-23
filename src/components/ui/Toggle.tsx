import { Pressable, View } from "react-native";
import { useThemeColors } from "../../hooks/useThemeColors";

// DESIGN.md §7: track 44×26 r999 — on: `button` track, `moon` knob right;
// off: rgba(255,255,255,0.09) track, `faint` knob left.
export function Toggle({ value, onValueChange, accessibilityLabel }: { value: boolean; onValueChange: () => void; accessibilityLabel: string }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onValueChange}
      style={{ width: 44, height: 26, borderRadius: 999, backgroundColor: value ? colors.button : colors.toggleOffTrack, justifyContent: "center" }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={{
          position: "absolute",
          top: 3,
          left: value ? undefined : 3,
          right: value ? 3 : undefined,
          width: 20,
          height: 20,
          borderRadius: 999,
          backgroundColor: value ? colors.moon : colors.faint,
        }}
      />
    </Pressable>
  );
}
