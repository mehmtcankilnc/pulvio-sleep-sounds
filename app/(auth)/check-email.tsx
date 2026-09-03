import { useState } from "react";
import { View, Text, Pressable, Linking, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { resendConfirmationEmail, authErrorKey } from "../../src/lib/auth";
import { SUPPORT_EMAIL, openSupportEmail } from "../../src/lib/links";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { Button } from "../../src/components/ui/Button";
import { AuthScaffold } from "../../src/components/auth/AuthScaffold";
import { MailIcon } from "../../src/components/icons";

// The end of the signup flow: the account exists but is unverified. Replaces
// the old OS Alert + dump-onto-login dead end with a screen that names the
// address, opens the mail app, and can resend.
export default function CheckEmailScreen() {
  const { t } = useTranslation("auth");
  const colors = useThemeColors();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [status, setStatus] = useState<null | "sending" | "sent" | string>(null);
  const [mailFailed, setMailFailed] = useState(false);
  const [helpFallback, setHelpFallback] = useState<string | null>(null);

  async function handleHelp() {
    try {
      await openSupportEmail();
    } catch {
      setHelpFallback(t("help.emailFallback", { email: SUPPORT_EMAIL }));
    }
  }

  async function handleResend() {
    if (!email) return;
    setStatus("sending");
    const { error } = await resendConfirmationEmail(email);
    setStatus(error ? t(authErrorKey(error)) : "sent");
  }

  async function openMail() {
    setMailFailed(false);
    // iOS: message:// jumps straight to Mail's inbox. Everywhere else, mailto:
    // opens the default mail client (compose, but one back-tap from the
    // inbox). RN's Linking can't fire a bare category intent from a URL
    // string, so an intent:// here would just throw — hence the plain schemes.
    const candidates = Platform.OS === "ios" ? ["message://", "mailto:"] : ["mailto:"];
    for (const url of candidates) {
      try {
        if (await Linking.canOpenURL(url)) {
          await Linking.openURL(url);
          return;
        }
      } catch {
        // try the next candidate
      }
    }
    // No mail client answered — tell the user to switch apps themselves
    // rather than leaving the tap silent.
    setMailFailed(true);
  }

  return (
    <AuthScaffold eyebrow={t("checkEmail.eyebrow")} title={t("checkEmail.title")}>
      <View style={{ alignItems: "center", gap: 16, paddingVertical: 8 }}>
        {/* Bare accent glyph — DESIGN.md keeps content icons out of tinted
            chips; the welcome screen's hero icon is unchipped too. */}
        <MailIcon size={40} color={colors.accent} strokeWidth={1.4} />

        <Text style={{ fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: "center" }}>
          {email ? t("checkEmail.bodyWithAddress", { email }) : t("checkEmail.body")}
        </Text>
        {/* One warm line — kept plain, not Lora: the scaffold eyebrow already
            spends this screen's one italic-serif moment. */}
        <Text style={{ fontSize: 13.5, color: colors.accent, textAlign: "center" }}>
          {t("checkEmail.reassurance")}
        </Text>
      </View>

      <View style={{ gap: 10, marginTop: 20 }}>
        <Button label={t("checkEmail.openMail")} onPress={openMail} />
        {mailFailed ? (
          <Text accessibilityLiveRegion="polite" style={{ textAlign: "center", fontSize: 12.5, color: colors.notice }}>
            {t("checkEmail.openMailFailed")}
          </Text>
        ) : null}

        <Pressable
          onPress={handleResend}
          disabled={status === "sending" || !email}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: "center", opacity: status === "sending" || !email ? 0.5 : 1 }}
        >
          <Text style={{ textAlign: "center", fontSize: 13, fontWeight: "600", color: colors.accent }}>
            {status === "sending" ? t("checkEmail.resending") : t("checkEmail.resend")}
          </Text>
        </Pressable>

        {status === "sent" ? (
          <Text accessibilityLiveRegion="polite" style={{ textAlign: "center", fontSize: 12.5, color: colors.notice }}>
            {t("checkEmail.resent")}
          </Text>
        ) : typeof status === "string" && status !== "sending" ? (
          <Text accessibilityLiveRegion="polite" style={{ textAlign: "center", fontSize: 12.5, color: colors.notice }}>
            {status}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => router.replace("/(auth)")}
        accessibilityRole="link"
        style={{ minHeight: 44, justifyContent: "center", marginTop: 20 }}
      >
        <Text style={{ textAlign: "center", fontSize: 13.5, color: colors.muted }}>{t("checkEmail.backToLogin")}</Text>
      </Pressable>

      <Pressable
        onPress={handleHelp}
        accessibilityRole="link"
        style={{ minHeight: 40, justifyContent: "center", marginTop: 2 }}
      >
        <Text style={{ textAlign: "center", fontSize: 12.5, color: colors.faint }}>{t("help.link")}</Text>
      </Pressable>
      {helpFallback ? (
        <Text accessibilityLiveRegion="polite" style={{ textAlign: "center", fontSize: 12, color: colors.notice, marginTop: 4 }}>
          {helpFallback}
        </Text>
      ) : null}
    </AuthScaffold>
  );
}
