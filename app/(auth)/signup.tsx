import { useRef, useState } from "react";
import { View, Text, Pressable, type TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import type { Session } from "@supabase/supabase-js";
import {
  signUpWithEmail,
  signInWithApple,
  signInWithGoogle,
  authErrorKey,
  MIN_PASSWORD,
} from "../../src/lib/auth";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useUserStore } from "../../src/store/useUserStore";
import { LEGAL_LINKS_READY, PRIVACY_POLICY_URL, TERMS_URL, openExternalUrl } from "../../src/lib/links";
import { TextField } from "../../src/components/ui/TextField";
import { Button } from "../../src/components/ui/Button";
import { AuthScaffold } from "../../src/components/auth/AuthScaffold";
import { ProviderButtons, OrDivider } from "../../src/components/auth/ProviderButtons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen() {
  const { t } = useTranslation("auth");
  const colors = useThemeColors();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<"apple" | "google" | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  // "This email already has an account" carries a jump-to-login action, with
  // the address kept, rather than making the user find the bottom link.
  const [showToLogin, setShowToLogin] = useState(false);

  function clearErrors() {
    setEmailError(null);
    setPasswordError(null);
    setFormNotice(null);
    setShowToLogin(false);
  }

  async function handleSignup() {
    clearErrors();
    let bad = false;
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError(t("error.invalidEmail"));
      bad = true;
    }
    if (password.length < MIN_PASSWORD) {
      setPasswordError(t("error.weakPassword"));
      bad = true;
    }
    if (bad) return;

    setLoading(true);
    const { error } = await signUpWithEmail(email, password);
    setLoading(false);
    if (error) {
      const key = authErrorKey(error);
      if (key === "error.alreadyRegistered") {
        setFormNotice(t("error.alreadyRegistered"));
        setShowToLogin(true);
      } else if (key === "error.weakPassword") {
        setPasswordError(t("error.weakPassword"));
      } else {
        setFormNotice(t(key));
      }
      return;
    }
    router.replace({ pathname: "/(auth)/check-email", params: { email: email.trim() } });
  }

  function goToLogin() {
    router.replace({ pathname: "/(auth)", params: { email: email.trim() } });
  }

  async function handleOAuth(provider: "google" | "apple") {
    clearErrors();
    setOauth(provider);
    const { error } = provider === "google" ? await signInWithGoogle() : await signInWithApple();
    setOauth(null);
    if (error) setFormNotice(t(authErrorKey(error)));
  }

  // Dev-only shortcut past auth so QA can reach the tab screens without a real
  // account. Injects a stub session — the Supabase client stays on the anon
  // key, so public reads still work. __DEV__-gated, never ships.
  function enterAppForDev() {
    const store = useUserStore.getState();
    store.setOnboardingCompleted(true);
    store.setSession({
      access_token: "dev",
      refresh_token: "dev",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: "00000000-0000-0000-0000-000000000000",
        aud: "authenticated",
        role: "authenticated",
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      },
    } as unknown as Session);
    router.replace("/(tabs)");
  }

  return (
    <AuthScaffold eyebrow={t("signup.eyebrow")} title={t("signup.title")}>
      <View style={{ gap: 14 }}>
        <Text style={{ fontSize: 12.5, lineHeight: 18, color: colors.faint }}>{t("signup.whyAccount")}</Text>

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
          kind="newPassword"
          label={t("field.newPassword")}
          placeholder={t("field.newPasswordPlaceholder", { count: MIN_PASSWORD })}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (passwordError) setPasswordError(null);
          }}
          error={passwordError}
          returnKeyType="go"
          onSubmitEditing={handleSignup}
        />

        {formNotice ? (
          <View style={{ gap: 6 }}>
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={{ fontSize: 12.5, lineHeight: 18, color: colors.notice, textAlign: "center", paddingHorizontal: 4 }}
            >
              {formNotice}
            </Text>
            {showToLogin ? (
              <Pressable
                onPress={goToLogin}
                accessibilityRole="button"
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.accent, textAlign: "center" }}>
                  {t("signup.toLoginAction")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Button label={t("signup.submit")} onPress={handleSignup} loading={loading} />

        {/* Same gate Settings + the paywall use — the legal line only shows
            once the Terms / Privacy URLs point at live pages. */}
        {LEGAL_LINKS_READY ? (
          <Text style={{ fontSize: 11.5, lineHeight: 17, color: colors.faint, textAlign: "center" }}>
            {t("signup.legalPrefix")}{" "}
            <Text style={{ color: colors.muted, textDecorationLine: "underline" }} onPress={() => openExternalUrl(TERMS_URL)}>
              {t("signup.terms")}
            </Text>{" "}
            {t("signup.legalAnd")}{" "}
            <Text style={{ color: colors.muted, textDecorationLine: "underline" }} onPress={() => openExternalUrl(PRIVACY_POLICY_URL)}>
              {t("signup.privacy")}
            </Text>
            .
          </Text>
        ) : null}
      </View>

      <OrDivider label={t("or")} />

      <ProviderButtons
        googleLabel={t("signup.googleButton")}
        appleButtonType="signUp"
        onApple={() => handleOAuth("apple")}
        onGoogle={() => handleOAuth("google")}
        pending={oauth}
      />

      <Pressable
        onPress={() => router.replace("/(auth)")}
        accessibilityRole="link"
        style={{ minHeight: 44, justifyContent: "center", marginTop: 20 }}
      >
        <Text style={{ textAlign: "center", fontSize: 13.5, color: colors.muted }}>
          {t("signup.loginPrompt")} <Text style={{ color: colors.accent, fontWeight: "600" }}>{t("signup.loginCta")}</Text>
        </Text>
      </Pressable>

      {__DEV__ ? (
        <Pressable
          onPress={enterAppForDev}
          accessibilityRole="button"
          style={{
            minHeight: 44,
            justifyContent: "center",
            marginTop: 12,
            borderTopWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.stroke,
          }}
        >
          <Text style={{ fontSize: 12, color: colors.faint, textAlign: "center" }}>[DEV] skip into app →</Text>
        </Pressable>
      ) : null}
    </AuthScaffold>
  );
}
