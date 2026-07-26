import { View, Text, Pressable, Alert } from "react-native";
import { signOut } from "../../src/lib/auth";

export default function SettingsScreen() {
  async function handleSignOut() {
    const { error } = await signOut();
    if (error) Alert.alert("Çıkış başarısız", error.message);
  }

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg mb-6">Ayarlar ekranı (placeholder)</Text>
      <Pressable
        className="border border-gray-300 rounded-lg px-6 py-3"
        onPress={handleSignOut}
      >
        <Text>Çıkış Yap</Text>
      </Pressable>
    </View>
  );
}
