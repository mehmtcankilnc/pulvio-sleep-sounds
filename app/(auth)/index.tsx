import { useState } from "react";
import { View, Text, Pressable, Alert, Platform } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { signInWithEmail, signInWithApple, signInWithGoogle } from "../../src/lib/auth";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { TextField } from "../../src/components/ui/TextField";
import { Button } from "../../src/components/ui/Button";

export default function LoginScreen() {
  const { t } = useTranslation("auth");
  const colors = useThemeColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) Alert.alert(t("login.failedTitle"), error.message);
  }

  async function handleOAuth(provider: "google" | "apple") {
    const { error } = provider === "google" ? await signInWithGoogle() : await signInWithApple();
    if (error) Alert.alert(t("login.failedTitle"), error.message);
  }

  return (
    <View className="flex-1 justify-center px-6" style={{ backgroundColor: colors.bg }}>
      <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
        {t("login.title")}
      </Text>

      <TextField
        placeholder={t("login.emailPlaceholder")}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        style={{ marginBottom: 16 }}
        placeholder={t("login.passwordPlaceholder")}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <View className="mb-3">
        <Button
          label={loading ? t("login.submitting") : t("login.submit")}
          onPress={handleLogin}
          loading={loading}
        />
      </View>

      {Platform.OS === "ios" && (
        <View className="mb-3">
          <Button label={t("login.appleButton")} variant="outline" onPress={() => handleOAuth("apple")} />
        </View>
      )}

      <View className="mb-6">
        <Button label={t("login.googleButton")} variant="outline" onPress={() => handleOAuth("google")} />
      </View>

      <Link href="/(auth)/signup">
        <Text className="text-center" style={{ color: colors.accent }}>
          {t("login.signupLink")}
        </Text>
      </Link>
    </View>
  );
}
