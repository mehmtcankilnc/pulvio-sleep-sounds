import { useState } from "react";
import { View, Text, Pressable, Linking, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { resendConfirmationEmail, resendEmailChangeConfirmation, authErrorKey } from "../../src/lib/auth";
import { SUPPORT_EMAIL, openSupportEmail } from "../../src/lib/links";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { Button } from "../../src/components/ui/Button";
import { AuthScaffold } from "../../src/components/auth/AuthScaffold";
import { MoonRingOuter, MoonRingInner } from "../../src/components/GlowBackground";
import { MailIcon } from "../../src/components/icons";

// The end of the signup flow: the account exists but is unverified. Replaces
// the old OS Alert + dump-onto-login dead end with a screen that names the
// address, opens the mail app, and can resend.
export default function CheckEmailScreen() {
  const { t } = useTranslation("auth");
  const colors = useThemeColors();
  const router = useRouter();
  const { email, linking } = useLocalSearchParams<{ email?: string; linking?: string }>();
  // Set only when signup.tsx got here via the anonymous-upgrade path — the
  // pending confirmation is an "email_change" OTP there, not "signup", and
  // resending with the wrong type fails silently against Supabase's resend
  // endpoint.
  const isLinking = linking === "1";
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
    const { error } = await (isLinking ? resendEmailChangeConfirmation(email) : resendConfirmationEmail(email));
    setStatus(error ? t(authErrorKey(error)) : "sent");
  }

  async function openMail() {
    setMailFailed(false);
    // iOS: message:// jumps straight to Mail's inbox. Everywhere else, mailto:
    // opens the default mail client (compose, but one back-tap from the
    // inbox). RN's Linking can't fire a bare category intent from a URL
    // string, so an intent:// here would just throw — hence the plain schemes.
    //
    // No canOpenURL check first: on Android 11+ (API 30+), PackageManager
    // query methods — which is what canOpenURL calls under the hood — are
    // subject to package-visibility restrictions and this app declares no
    // <queries> entry for mailto, so canOpenURL("mailto:") reliably (and
    // silently) returns false even with Gmail installed, and this button
    // did nothing at all. Actually starting the activity doesn't go through
    // that same visibility check — the OS resolves and launches implicit
    // intents on the app's behalf regardless — so openURL alone, with the
    // failure path driven by the thrown exception instead, is what actually
    // works without a native rebuild.
    const candidates = Platform.OS === "ios" ? ["message://", "mailto:"] : ["mailto:"];
    for (const url of candidates) {
      try {
        await Linking.openURL(url);
        return;
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
        {/* Same double-ring glow the welcome screen's hero icon uses — a
            bare glyph here read as thin/unfinished; this is the app's own
            established "moment that deserves a little presence" treatment,
            not a new one-off decoration. */}
        <MoonRingOuter style={{ width: 96, height: 96 }}>
          <MoonRingInner style={{ width: 68, height: 68 }}>
            <MailIcon size={28} color={colors.accent} strokeWidth={1.4} />
          </MoonRingInner>
        </MoonRingOuter>

        <Text style={{ fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: "center" }}>
          {email ? t("checkEmail.bodyWithAddress", { email }) : t("checkEmail.body")}
        </Text>
        {/* One warm line — kept plain, not Lora: the scaffold eyebrow already
            spends this screen's one italic-serif moment. */}
        <Text style={{ fontSize: 13.5, color: colors.accent, textAlign: "center" }}>
          {t("checkEmail.reassurance")}
        </Text>
      </View>

      {/* Primary + its one secondary action, clearly a pair — resend only
          makes sense once you've tried opening mail and come up empty, so it
          reads as "step two", not a competing option of equal weight. */}
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

      {/* Utility cluster, visually set apart (extra top margin, a hairline,
          the smallest/faintest text on the screen) from the actual task
          above — these are an escape hatch and a support link, not steps in
          the same flow, and shouldn't compete with it for attention. */}
      <View style={{ marginTop: 32, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.stroke, alignItems: "center", gap: 4 }}>
        <Pressable
          onPress={() => router.replace("/(auth)")}
          accessibilityRole="link"
          style={{ minHeight: 40, justifyContent: "center" }}
        >
          <Text style={{ textAlign: "center", fontSize: 12.5, color: colors.faint }}>{t("checkEmail.backToLogin")}</Text>
        </Pressable>

        <Pressable
          onPress={handleHelp}
          accessibilityRole="link"
          style={{ minHeight: 40, justifyContent: "center" }}
        >
          <Text style={{ textAlign: "center", fontSize: 12.5, color: colors.faint }}>{t("help.link")}</Text>
        </Pressable>
        {helpFallback ? (
          <Text accessibilityLiveRegion="polite" style={{ textAlign: "center", fontSize: 12, color: colors.notice }}>
            {helpFallback}
          </Text>
        ) : null}
      </View>
    </AuthScaffold>
  );
}
