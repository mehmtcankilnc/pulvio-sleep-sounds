import { Pressable, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";
import { SearchIcon, XIcon } from "../icons";

// One shared search field for Discover and Categories — flat `card` surface,
// `stroke` border, bare accent-less icons (DESIGN.md: no icon chips, no
// second hue). `value`/`onChangeText` stay fully controlled and undebounced
// so typing never lags; the caller derives a debounced value from `value`
// via useDebouncedValue for the actual list filtering.
export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  accessibilityLabel: string;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation("common");
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        height: 48,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.stroke,
        backgroundColor: colors.card,
        paddingHorizontal: 14,
      }}
    >
      <SearchIcon size={17} color={colors.muted} strokeWidth={1.7} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={{ flex: 1, fontSize: 14, color: colors.text, padding: 0 }}
        accessibilityLabel={accessibilityLabel}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t("clear")}
          style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}
        >
          <XIcon size={15} color={colors.faint} strokeWidth={1.7} />
        </Pressable>
      ) : null}
    </View>
  );
}
