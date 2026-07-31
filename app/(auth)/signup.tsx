import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { signUpWithEmail } from "../../src/lib/auth";

export default function SignupScreen() {
  const { t } = useTranslation("auth");
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

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold mb-6">{t("signup.title")}</Text>

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
        placeholder={t("login.emailPlaceholder", { ns: "auth" })}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder={t("login.passwordPlaceholder", { ns: "auth" })}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        className="bg-black rounded-lg py-3 items-center mb-3"
        onPress={handleSignup}
        disabled={loading}
      >
        <Text className="text-white font-semibold">
          {loading ? t("signup.submitting") : t("signup.submit")}
        </Text>
      </Pressable>

      <Link href="/(auth)">
        <Text className="text-center text-blue-600">{t("signup.loginLink")}</Text>
      </Link>
    </View>
  );
}
