import { forwardRef, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "../../hooks/useThemeColors";
import { GlowBackground } from "../GlowBackground";
import { ChevronLeftIcon } from "../icons";
import { FORM_MAX_W } from "../../theme/layout";

// Shared shell for every (auth) screen. Carries the three things the raw
// screens were missing: the Dusk Ember wash (every other screen has it), a
// keyboard-safe scroll (the software keyboard was covering the fields and the
// CTA), and the funnel's warm framing — a Lora eyebrow over the screen title.
// A back chevron shows only when there is somewhere to go back to (e.g. a
// guest who opened signup from Settings); a cold-start logged-out user has
// nothing below (auth) in the stack, so no chevron.
//
// Forwards its ScrollView ref so a screen with a field low enough to end up
// under the keyboard (reset-password's "confirm" field, once the glow-ring
// hero pushed it further down the page) can additionally scroll there on
// that field's onFocus.
export const AuthScaffold = forwardRef<ScrollView, { eyebrow: string; title: string; children: ReactNode }>(
  function AuthScaffold({ eyebrow, title, children }, ref) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation("common");
  const canGoBack = router.canGoBack();

  return (
    <GlowBackground variant="pageWash" style={{ flex: 1 }}>
      {/* android:windowSoftInputMode="adjustResize" (AndroidManifest.xml) was
          relied on alone here, on the assumption the OS would shrink the
          window itself — it didn't: fields near the bottom of a screen (the
          reset-password "confirm" field) still ended up hidden directly
          under the keyboard, unmoved. An explicit KeyboardAvoidingView (the
          same fix BottomSheet.tsx needed for the same symptom) shrinks this
          container itself instead of trusting the OS to, so it works
          regardless of what's actually resizing at the native level. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          ref={ref}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingTop: Math.max(insets.top, 20) + 16,
            paddingBottom: Math.max(insets.bottom, 20) + 32,
          }}
        >
          <View style={{ width: "100%", maxWidth: FORM_MAX_W, alignSelf: "center" }}>
            {canGoBack ? (
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("back")}
                style={{ width: 44, height: 44, marginLeft: -10, marginBottom: 8, alignItems: "center", justifyContent: "center" }}
              >
                <ChevronLeftIcon size={24} color={colors.muted} strokeWidth={1.7} />
              </Pressable>
            ) : null}
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
      </KeyboardAvoidingView>
    </GlowBackground>
  );
});
