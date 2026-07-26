import { SectionList, View, Text, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTracks } from "../../src/hooks/useTracks";
import { usePlayerActions } from "../../src/hooks/usePlayerActions";

export default function HomeScreen() {
  const { sections, loading, error, refetch } = useTracks();
  const { loadAndPlay } = usePlayerActions();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center mb-4">Sesler yüklenemedi: {error}</Text>
        <Pressable className="border border-gray-300 rounded-lg px-6 py-3" onPress={refetch}>
          <Text>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg">Henüz ses eklenmedi</Text>
      </View>
    );
  }

  return (
    <SectionList
      className="flex-1 bg-white"
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text className="text-lg font-bold px-4 pt-4 pb-2 bg-white">{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <Pressable
          className="px-4 py-3 border-b border-gray-100"
          onPress={() => {
            loadAndPlay(item);
            router.navigate("/player");
          }}
        >
          <Text className="text-base">{item.title}</Text>
          {item.isPremiumOnly && <Text className="text-xs text-amber-600">Premium</Text>}
        </Pressable>
      )}
    />
  );
}
