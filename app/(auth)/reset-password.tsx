import { useRef, useState } from "react";
import { View, Text, Pressable, type ScrollView, type TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { updatePassword, signOut, authErrorKey, debugErrorSuffix, MIN_PASSWORD } from "../../src/lib/auth";
import { useUserStore } from "../../src/store/useUserStore";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { TextField } from "../../src/components/ui/TextField";
import { Button } from "../../src/components/ui/Button";
import { AuthScaffold } from "../../src/components/auth/AuthScaffold";
import { MoonRingOuter, MoonRingInner } from "../../src/components/GlowBackground";
import { LockIcon } from "../../src/components/icons";

// Reached only from a recovery deep link — useAuthListener flags
// passwordRecovery, the route guard keeps this (recovery) session here rather
// than dropping it into the app, and setting the password clears the flag.
export default function ResetPasswordScreen() {
  const { t } = useTranslation("auth");
  const colors = useThemeColors();
  const router = useRouter();
  const confirmRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(t("error.weakPassword"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }
    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) {
      setError(t(authErrorKey(err)) + debugErrorSuffix(err));
      return;
    }
    useUserStore.getState().setPasswordRecovery(false);
    router.replace("/(tabs)");
  }

  // `automaticallyAdjustKeyboardInsets` on AuthScaffold's ScrollView only
  // grows the scrollable range to clear the keyboard — it doesn't scroll a
  // focused field into that newly-clear space itself. With the glow-ring
  // hero above these two fields, "confirm password" sits low enough that
  // the keyboard was covering it with no way to see what was typed. The
  // short delay lets the keyboard's show animation (and the resulting inset
  // change) start before "end" is measured; calling this synchronously on
  // focus scrolls against the pre-keyboard content size.
  function scrollFieldIntoView() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  // Opened the link by mistake, or changed their mind — without this the
  // recovery session holds them on this screen with no way out. Sign out
  // first so clearing the flag can't drop the recovery session into the app,
  // then hand them the normal login screen.
  async function handleCancel() {
    await signOut();
    useUserStore.getState().setPasswordRecovery(false);
    router.replace("/(auth)");
  }

  return (
    <AuthScaffold ref={scrollRef} eyebrow={t("reset.eyebrow")} title={t("reset.title")}>
      {/* Same glow-ring hero treatment check-email.tsx uses for its own
          "one thing left to finish" moment — a bare title + fields read as
          unfinished next to it once that screen had it. */}
      <View style={{ alignItems: "center", gap: 16, paddingVertical: 8, marginBottom: 8 }}>
        <MoonRingOuter style={{ width: 96, height: 96 }}>
          <MoonRingInner style={{ width: 68, height: 68 }}>
            <LockIcon size={28} color={colors.accent} strokeWidth={1.4} />
          </MoonRingInner>
        </MoonRingOuter>

        <Text style={{ fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: "center" }}>{t("reset.body")}</Text>
      </View>

      <View style={{ gap: 14 }}>
        <TextField
          kind="newPassword"
          label={t("field.newPassword")}
          placeholder={t("field.newPasswordPlaceholder", { count: MIN_PASSWORD })}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) setError(null);
          }}
          onFocus={scrollFieldIntoView}
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={confirmRef}
          kind="newPassword"
          label={t("reset.confirmLabel")}
          placeholder={t("reset.confirmPlaceholder")}
          value={confirm}
          onChangeText={(v) => {
            setConfirm(v);
            if (error) setError(null);
          }}
          onFocus={scrollFieldIntoView}
          error={error}
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <Button label={t("reset.submit")} onPress={handleSubmit} loading={loading} />
      </View>

      {/* Same set-apart utility treatment as check-email.tsx's own escape
          hatch — a hairline + the smallest/faintest text on the screen, so
          it reads as "changed your mind, get out" rather than a third step
          in the save flow above it. */}
      <View style={{ marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.stroke, alignItems: "center" }}>
        <Pressable onPress={handleCancel} accessibilityRole="link" style={{ minHeight: 40, justifyContent: "center" }}>
          <Text style={{ textAlign: "center", fontSize: 12.5, color: colors.faint }}>{t("reset.cancel")}</Text>
        </Pressable>
      </View>
    </AuthScaffold>
  );
}
