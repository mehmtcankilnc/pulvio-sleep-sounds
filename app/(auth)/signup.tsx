import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { signUpWithEmail } from "../../src/lib/auth";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup() {
    setLoading(true);
    const { error } = await signUpWithEmail(email, password);
    setLoading(false);
    if (error) {
      Alert.alert("Kayıt başarısız", error.message);
      return;
    }
    Alert.alert(
      "Kayıt başarılı",
      "E-postana gelen onay bağlantısına tıkladıktan sonra giriş yapabilirsin.",
      [{ text: "Tamam", onPress: () => router.replace("/(auth)") }]
    );
  }

  return (
    <View className="flex-1 justify-center px-6 bg-white">
      <Text className="text-2xl font-bold mb-6">Hesap Oluştur</Text>

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
        onPress={handleSignup}
        disabled={loading}
      >
        <Text className="text-white font-semibold">
          {loading ? "Kaydediliyor..." : "Kayıt Ol"}
        </Text>
      </Pressable>

      <Link href="/(auth)">
        <Text className="text-center text-blue-600">Zaten hesabın var mı? Giriş yap</Text>
      </Link>
    </View>
  );
}
