import { useState } from "react";
import { View, Text, Pressable, Linking, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { resendConfirmationEmail, authErrorKey } from "../../src/lib/auth";
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

  async function handleResend() {
    if (!email) return;
    setStatus("sending");
    const { error } = await resendConfirmationEmail(email);
    setStatus(error ? t(authErrorKey(error)) : "sent");
  }

  function openMail() {
    // iOS: message:// opens Mail's inbox. Android: the APP_EMAIL category
    // intent opens the default mail client's inbox (mailto: would start a
    // new compose, which is wrong here).
    const url =
      Platform.OS === "ios"
        ? "message://"
        : "intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_EMAIL;end";
    Linking.openURL(url).catch(() => {});
  }

  return (
    <AuthScaffold eyebrow={t("checkEmail.eyebrow")} title={t("checkEmail.title")}>
      <View style={{ alignItems: "center", gap: 16, paddingVertical: 8 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            backgroundColor: colors.glowSoft,
            borderWidth: 1,
            borderColor: colors.stroke,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MailIcon size={26} color={colors.accent} strokeWidth={1.6} />
        </View>

        <Text style={{ fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: "center" }}>
          {email ? t("checkEmail.bodyWithAddress", { email }) : t("checkEmail.body")}
        </Text>
        <Text className="font-lora-italic" style={{ fontSize: 14, color: colors.accent, textAlign: "center" }}>
          {t("checkEmail.reassurance")}
        </Text>
      </View>

      <View style={{ gap: 10, marginTop: 20 }}>
        <Button label={t("checkEmail.openMail")} onPress={openMail} />

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
        style={{ minHeight: 44, justifyContent: "center", marginTop: 16 }}
      >
        <Text style={{ textAlign: "center", fontSize: 13.5, color: colors.muted }}>{t("checkEmail.backToLogin")}</Text>
      </Pressable>
    </AuthScaffold>
  );
}
