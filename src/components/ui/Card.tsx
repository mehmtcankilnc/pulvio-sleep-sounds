import { View, type ViewProps } from "react-native";
import { useThemeColors } from "../../hooks/useThemeColors";

// Drift "list/settings card" shape (DESIGN.md §7): radius 20, 1px stroke
// border. Hero/category cards use their own gradient wrappers instead.
export function Card({ style, ...props }: ViewProps) {
  const colors = useThemeColors();
  return (
    <View
      className="rounded-[20px] p-5"
      style={[{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke }, style]}
      {...props}
    />
  );
}
