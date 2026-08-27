import { useState } from "react";
import { View, Text, Alert, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { signUpWithEmail, signInWithApple, signInWithGoogle } from "../../src/lib/auth";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { TextField } from "../../src/components/ui/TextField";
import { Button } from "../../src/components/ui/Button";

export default function SignupScreen() {
  const { t } = useTranslation("auth");
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup() {
    setLoading(true);
    const { error } = await signUpWithEmail(email, password);
    setLoading(false);
    if (error) {
      Alert.alert(t("signup.failedTitle"), error.message);
      return;
    }
    Alert.alert(t("signup.successTitle"), t("signup.successMessage"), [
      { text: t("common:ok"), onPress: () => router.replace("/(auth)") },
    ]);
  }

  // OAuth handles sign-up and sign-in in one flow — Supabase creates the
  // account on first return. The session then lands via useAuthListener and
  // the route guard / onboarding handoff take it from there.
  async function handleOAuth(provider: "google" | "apple") {
    const { error } = provider === "google" ? await signInWithGoogle() : await signInWithApple();
    if (error) Alert.alert(t("signup.failedTitle"), error.message);
  }

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: colors.bg }}>
      <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
        {t("signup.title")}
      </Text>

      <TextField
        placeholder={t("login.emailPlaceholder", { ns: "auth" })}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        style={{ marginBottom: 16 }}
        placeholder={t("login.passwordPlaceholder", { ns: "auth" })}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View className="mb-3">
        <Button
          label={loading ? t("signup.submitting") : t("signup.submit")}
          onPress={handleSignup}
          loading={loading}
        />
      </View>

      {Platform.OS === "ios" && (
        <View className="mb-3">
          <Button label={t("signup.appleButton")} variant="outline" onPress={() => handleOAuth("apple")} />
        </View>
      )}

      <View className="mb-6">
        <Button label={t("signup.googleButton")} variant="outline" onPress={() => handleOAuth("google")} />
      </View>

      <Link href="/(auth)">
        <Text className="text-center" style={{ color: colors.accent }}>
          {t("signup.loginLink")}
        </Text>
      </Link>
    </View>
  );
}
