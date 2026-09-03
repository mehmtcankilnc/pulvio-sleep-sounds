import { forwardRef, useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../hooks/useThemeColors";

type FieldKind = "email" | "password" | "newPassword" | "text";

// Autofill / keyboard hints per field role, so iOS Keychain + Google Password
// Manager offer to fill and save. RN maps `textContentType` (iOS) and
// `autoComplete` (Android) separately.
const KIND_PROPS: Record<FieldKind, Partial<TextInputProps>> = {
  email: {
    keyboardType: "email-address",
    autoCapitalize: "none",
    autoCorrect: false,
    autoComplete: "email",
    textContentType: "emailAddress",
    spellCheck: false,
  },
  password: {
    secureTextEntry: true,
    autoCapitalize: "none",
    autoComplete: "current-password",
    textContentType: "password",
  },
  newPassword: {
    secureTextEntry: true,
    autoCapitalize: "none",
    autoComplete: "new-password",
    textContentType: "newPassword",
    passwordRules: "minlength: 8;",
  },
  text: {},
};

type Props = TextInputProps & {
  /** Visible label above the field (stays put; the placeholder does not). */
  label?: string;
  /** Role — sets the right keyboard + autofill hints. */
  kind?: FieldKind;
  /** Inline error message; also turns the border red. */
  error?: string | null;
};

// Drift text field (DESIGN.md): 1px stroke, `card` surface, option-row radius
// (16), ≥52pt tall. Labelled — a placeholder alone vanishes on the first
// keystroke and reads as an empty control to a screen reader. Password kinds
// get a reveal toggle.
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, kind = "text", error, style, ...props },
  ref,
) {
  const colors = useThemeColors();
  const { t } = useTranslation("common");
  const isPassword = kind === "password" || kind === "newPassword";
  const [revealed, setRevealed] = useState(false);
  // A validation error is a recoverable event — DESIGN.md keeps `danger` (the
  // one true red) for irreversible destructive actions only; errors stay
  // `notice`, matching the message text below.
  const borderColor = error ? colors.notice : colors.stroke;

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.muted, paddingLeft: 2 }}>{label}</Text>
      ) : null}

      <View style={{ justifyContent: "center" }}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.faint}
          {...KIND_PROPS[kind]}
          {...props}
          secureTextEntry={isPassword ? !revealed : props.secureTextEntry}
          style={[
            {
              minHeight: 52,
              borderRadius: 16,
              borderWidth: 1,
              borderColor,
              paddingHorizontal: 16,
              paddingVertical: 14,
              paddingRight: isPassword ? 52 : 16,
              fontSize: 15,
              color: colors.text,
              backgroundColor: colors.card,
            },
            style,
          ]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealed ? t("hidePassword") : t("showPassword")}
            style={{ position: "absolute", right: 4, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name={revealed ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ fontSize: 12.5, color: colors.notice, paddingLeft: 2 }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});
