import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "../../src/lib/auth";
import { useUserStore } from "../../src/store/useUserStore";

export default function SettingsScreen() {
  const router = useRouter();
  const subscriptionStatus = useUserStore((state) => state.subscriptionStatus);

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) Alert.alert("Çıkış başarısız", error.message);
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-lg mb-6">Ayarlar ekranı (placeholder)</Text>

      {subscriptionStatus === "premium" ? (
        <Text className="text-green-700 font-semibold mb-6">Premium Aktif ✓</Text>
      ) : (
        <Pressable
          className="bg-black rounded-lg px-6 py-3 mb-6"
          onPress={() => router.push("/paywall")}
        >
          <Text className="text-white font-semibold">Premium'a Geç</Text>
        </Pressable>
      )}

      <Pressable className="border border-gray-300 rounded-lg px-6 py-3" onPress={handleSignOut}>
        <Text>Çıkış Yap</Text>
      </Pressable>
    </View>
  );
}
