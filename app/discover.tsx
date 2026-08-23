import { View, Text, ActivityIndicator, Pressable, SectionList } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTracks } from "../src/hooks/useTracks";
import { usePlayerActions } from "../src/hooks/usePlayerActions";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { categoryIcon } from "../src/lib/categoryIcon";
import { Button } from "../src/components/ui/Button";

export default function DiscoverScreen() {
  const { t } = useTranslation("discover");
  const colors = useThemeColors();
  const { sections, loading, error, refetch } = useTracks();
  const { loadAndPlay } = usePlayerActions();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.button} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bg }}>
        <Text className="text-center mb-4" style={{ color: colors.text }}>
          {t("loadError", { error })}
        </Text>
        <Button label={t("common:retry")} variant="outline" onPress={refetch} />
      </View>
    );
  }

  if (sections.length === 0) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Text style={{ color: colors.text, fontSize: 18 }}>{t("empty")}</Text>
      </View>
    );
  }

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <Text
          className="font-bold px-5 pt-5 pb-2"
          style={{ fontSize: 15.5, color: colors.text, backgroundColor: colors.bg }}
        >
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => {
        const Icon = categoryIcon(item.category, item.subcategory);
        return (
          <Pressable
            style={{
              marginHorizontal: 20,
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              minHeight: 56,
              paddingHorizontal: 14,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.stroke,
              borderRadius: 16,
            }}
            onPress={() => {
              loadAndPlay(item);
              router.navigate("/player");
            }}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <Icon size={20} color={colors.accent} strokeWidth={1.6} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{item.title}</Text>
              {item.isPremiumOnly && <Text style={{ fontSize: 11, color: colors.accent }}>{t("premiumBadge")}</Text>}
            </View>
          </Pressable>
        );
      }}
    />
  );
}
