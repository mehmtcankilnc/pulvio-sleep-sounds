import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { signOut, deleteAccount } from "../../src/lib/auth";
import { useUserStore } from "../../src/store/useUserStore";

export default function SettingsScreen() {
  const router = useRouter();
  const subscriptionStatus = useUserStore((state) => state.subscriptionStatus);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) Alert.alert("Çıkış başarısız", error.message);
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Hesabı Sil",
      "Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecek.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Hesabı Sil",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            const { error } = await deleteAccount();
            setIsDeleting(false);
            if (error) Alert.alert("Hesap silinemedi", error.message);
          },
        },
      ]
    );
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

      <Pressable
        className="border border-gray-300 rounded-lg px-6 py-3 mb-4"
        onPress={handleSignOut}
      >
        <Text>Çıkış Yap</Text>
      </Pressable>

      <Pressable
        className="px-6 py-3"
        onPress={handleDeleteAccount}
        disabled={isDeleting}
      >
        <Text className="text-red-600">{isDeleting ? "Siliniyor..." : "Hesabı Sil"}</Text>
      </Pressable>
    </View>
  );
}
