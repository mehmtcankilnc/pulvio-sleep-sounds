import { useRef, useState } from "react";
import { View, Text, Pressable, type TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  signInWithEmail,
  signInWithApple,
  signInWithGoogle,
  sendPasswordReset,
  resendConfirmationEmail,
  authErrorKey,
} from "../../src/lib/auth";
import { SUPPORT_EMAIL, openSupportEmail } from "../../src/lib/links";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { TextField } from "../../src/components/ui/TextField";
import { Button } from "../../src/components/ui/Button";
import { AuthScaffold } from "../../src/components/auth/AuthScaffold";
import { ProviderButtons, OrDivider } from "../../src/components/auth/ProviderButtons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { t } = useTranslation("auth");
  const colors = useThemeColors();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  // Signup routes here with the address prefilled when the email is already
  // registered.
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(() => (typeof emailParam === "string" ? emailParam : ""));
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<"apple" | "google" | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  // When the sign-in failed because the address is unconfirmed, the notice
  // carries a resend action rather than sending the user hunting.
  const [showResend, setShowResend] = useState(false);
  const [resend, setResend] = useState<null | "sending" | "sent">(null);
  const [forgotPending, setForgotPending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function clearErrors() {
    setEmailError(null);
    setFormNotice(null);
    setShowResend(false);
    setResend(null);
    setResetSent(false);
  }

  async function handleLogin() {
    clearErrors();
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError(t("error.invalidEmail"));
      return;
    }
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      const key = authErrorKey(error);
      setFormNotice(t(key));
      if (key === "error.emailNotConfirmed") setShowResend(true);
    }
  }

  async function handleResendConfirm() {
    setResend("sending");
    const { error } = await resendConfirmationEmail(email);
    if (error) {
      setResend(null);
      setFormNotice(t(authErrorKey(error)));
      return;
    }
    setResend("sent");
  }

  async function handleOAuth(provider: "google" | "apple") {
    clearErrors();
    setOauth(provider);
    const { error } = provider === "google" ? await signInWithGoogle() : await signInWithApple();
    setOauth(null);
    if (error) setFormNotice(t(authErrorKey(error)));
  }

  async function handleForgotPassword() {
    clearErrors();
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError(t("forgot.needEmail"));
      return;
    }
    setForgotPending(true);
    const { error } = await sendPasswordReset(email);
    setForgotPending(false);
    if (error) setFormNotice(t(authErrorKey(error)));
    else setResetSent(true);
  }

  async function handleHelp() {
    try {
      await openSupportEmail();
    } catch {
      setFormNotice(t("help.emailFallback", { email: SUPPORT_EMAIL }));
    }
  }

  return (
    <AuthScaffold eyebrow={t("login.eyebrow")} title={t("login.title")}>
      <View style={{ gap: 14 }}>
        <TextField
          kind="email"
          label={t("field.email")}
          placeholder={t("field.emailPlaceholder")}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (emailError) setEmailError(null);
          }}
          error={emailError}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          submitBehavior="submit"
        />
        <TextField
          ref={passwordRef}
          kind="password"
          label={t("field.password")}
          placeholder={t("field.passwordPlaceholder")}
          value={password}
          onChangeText={setPassword}
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        <Pressable
          onPress={handleForgotPassword}
          disabled={forgotPending}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ busy: forgotPending }}
          style={{ alignSelf: "flex-end", minHeight: 44, justifyContent: "center", opacity: forgotPending ? 0.6 : 1 }}
        >
          <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.accent }}>
            {forgotPending ? t("forgot.sending") : t("forgot.link")}
          </Text>
        </Pressable>

        {resetSent ? (
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontSize: 12.5, lineHeight: 18, color: colors.notice, textAlign: "center", paddingHorizontal: 4 }}
          >
            {t("forgot.sent", { email: email.trim() })}
          </Text>
        ) : null}
        {formNotice ? (
          <View style={{ gap: 6 }}>
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={{ fontSize: 12.5, lineHeight: 18, color: colors.notice, textAlign: "center", paddingHorizontal: 4 }}
            >
              {formNotice}
            </Text>
            {showResend ? (
              <Pressable
                onPress={handleResendConfirm}
                disabled={resend !== null}
                accessibilityRole="button"
                style={{ minHeight: 44, justifyContent: "center", opacity: resend === "sending" ? 0.6 : 1 }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.accent, textAlign: "center" }}>
                  {resend === "sending"
                    ? t("checkEmail.resending")
                    : resend === "sent"
                      ? t("checkEmail.resent")
                      : t("checkEmail.resend")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Button label={t("login.submit")} onPress={handleLogin} loading={loading} />
      </View>

      <OrDivider label={t("or")} />

      <ProviderButtons
        googleLabel={t("login.googleButton")}
        appleButtonType="signIn"
        onApple={() => handleOAuth("apple")}
        onGoogle={() => handleOAuth("google")}
        pending={oauth}
      />

      <Pressable
        onPress={() => router.replace("/(auth)/signup")}
        accessibilityRole="link"
        style={{ minHeight: 44, justifyContent: "center", marginTop: 20 }}
      >
        <Text style={{ textAlign: "center", fontSize: 13.5, color: colors.muted }}>
          {t("login.signupPrompt")} <Text style={{ color: colors.accent, fontWeight: "600" }}>{t("login.signupCta")}</Text>
        </Text>
      </Pressable>

      <Pressable
        onPress={handleHelp}
        accessibilityRole="link"
        style={{ minHeight: 40, justifyContent: "center", marginTop: 2 }}
      >
        <Text style={{ textAlign: "center", fontSize: 12.5, color: colors.faint }}>{t("help.link")}</Text>
      </Pressable>
    </AuthScaffold>
  );
}
