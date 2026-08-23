import { TextInput, type TextInputProps } from "react-native";
import { useThemeColors } from "../../hooks/useThemeColors";

export function TextField({ style, ...props }: TextInputProps) {
  const colors = useThemeColors();
  return (
    <TextInput
      className="rounded-lg px-4 py-3 mb-3"
      style={[
        { borderWidth: 1, borderColor: colors.stroke, color: colors.text, backgroundColor: colors.card },
        style,
      ]}
      placeholderTextColor={colors.muted}
      {...props}
    />
  );
}
