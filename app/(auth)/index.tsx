import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Link } from "expo-router";
import { signInWithEmail, signInWithApple, signInWithGoogle } from "../../src/lib/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) Alert.alert("Giriş başarısız", error.message);
  }

  async function handleOAuth(provider: "google" | "apple") {
    const { error } = provider === "google" ? await signInWithGoogle() : await signInWithApple();
    if (error) Alert.alert("Giriş başarısız", error.message);
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold mb-6">Pulvio'ya Giriş Yap</Text>

      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
        placeholder="E-posta"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
        placeholder="Şifre"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        className="bg-black rounded-lg py-3 items-center mb-3"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-white font-semibold">
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Text>
      </Pressable>

      <Pressable
        className="border border-gray-300 rounded-lg py-3 items-center mb-3"
        onPress={() => handleOAuth("apple")}
      >
        <Text>Apple ile Giriş Yap</Text>
      </Pressable>

      <Pressable
        className="border border-gray-300 rounded-lg py-3 items-center mb-6"
        onPress={() => handleOAuth("google")}
      >
        <Text>Google ile Giriş Yap</Text>
      </Pressable>

      <Link href="/(auth)/signup">
        <Text className="text-center text-blue-600">Hesabın yok mu? Kayıt ol</Text>
      </Link>
    </View>
  );
}
