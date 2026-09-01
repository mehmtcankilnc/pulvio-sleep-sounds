import { useRef, useState } from "react";
import { View, Text, Pressable, type TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { signInWithEmail, signInWithApple, signInWithGoogle, sendPasswordReset, authErrorKey } from "../../src/lib/auth";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<"apple" | "google" | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  function clearErrors() {
    setEmailError(null);
    setFormNotice(null);
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
    if (error) setFormNotice(t(authErrorKey(error)));
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
    const { error } = await sendPasswordReset(email);
    if (error) setFormNotice(t(authErrorKey(error)));
    else setResetSent(true);
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
          hitSlop={8}
          accessibilityRole="button"
          style={{ alignSelf: "flex-end", minHeight: 32, justifyContent: "center" }}
        >
          <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.accent }}>{t("forgot.link")}</Text>
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
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={{ fontSize: 12.5, lineHeight: 18, color: colors.notice, textAlign: "center", paddingHorizontal: 4 }}
          >
            {formNotice}
          </Text>
        ) : null}

        <Button label={t("login.submit")} onPress={handleLogin} loading={loading} />
      </View>

      <OrDivider label={t("or")} />

      <ProviderButtons
        appleLabel={t("login.appleButton")}
        googleLabel={t("login.googleButton")}
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
    </AuthScaffold>
  );
}
