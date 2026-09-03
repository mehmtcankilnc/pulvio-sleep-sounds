import type { ReactNode } from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "../../hooks/useThemeColors";
import { GlowBackground } from "../GlowBackground";
import { FORM_MAX_W } from "../../theme/layout";

// Shared shell for every (auth) screen. Carries the three things the raw
// screens were missing: the Dusk Ember wash (every other screen has it), a
// keyboard-safe scroll (the software keyboard was covering the fields and the
// CTA), and the funnel's warm framing — a Lora eyebrow over the screen title.
// No back chevron: every (auth) transition is a router.replace (stack depth 1),
// so there is nothing to go "back" to — screens that offer a way out use an
// explicit text link instead.
export function AuthScaffold({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <GlowBackground variant="pageWash" style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        // iOS: adds a bottom content inset equal to the keyboard so the CTA
        // can always be scrolled clear of it. Android: the window itself
        // resizes (adjustResize in the manifest), so the ScrollView shrinks
        // and the content scrolls.
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 20) + 16,
          paddingBottom: Math.max(insets.bottom, 20) + 32,
        }}
      >
        <View style={{ width: "100%", maxWidth: FORM_MAX_W, alignSelf: "center" }}>
          <View style={{ gap: 3, marginBottom: 24 }}>
            <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
              {eyebrow}
            </Text>
            <Text
              accessibilityRole="header"
              className="font-bold"
              style={{ fontSize: 22, letterSpacing: -0.2, color: colors.text }}
            >
              {title}
            </Text>
          </View>

          {children}
        </View>
      </ScrollView>
    </GlowBackground>
  );
}
