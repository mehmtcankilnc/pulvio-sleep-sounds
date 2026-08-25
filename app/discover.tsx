import { useMemo } from "react";
import { View, Text, ActivityIndicator, Pressable, SectionList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTracks } from "../src/hooks/useTracks";
import { usePlayerActions } from "../src/hooks/usePlayerActions";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { categoryIcon } from "../src/lib/categoryIcon";
import { Button } from "../src/components/ui/Button";

export default function DiscoverScreen() {
  const { t } = useTranslation("discover");
  const colors = useThemeColors();
  const { sections: allSections, loading, error, refetch } = useTracks();
  const { loadAndPlay } = usePlayerActions();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();

  // A category tile promises a filtered view — fall back to the full
  // catalog if the filter would otherwise leave nothing to show (e.g. a
  // stale/renamed category), rather than presenting a false "empty" state.
  const filtered = useMemo(
    () => (category ? allSections.filter((section) => section.title.startsWith(`${category} / `)) : allSections),
    [allSections, category]
  );
  const sections = category && filtered.length > 0 ? filtered : allSections;
  const isFiltered = Boolean(category) && filtered.length > 0;

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
          {t("loadError")}
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
      ListHeaderComponent={
        isFiltered ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 20,
            }}
          >
            <Text className="font-bold" style={{ fontSize: 22, letterSpacing: -0.2, color: colors.text }}>
              {category}
            </Text>
            <Pressable
              onPress={() => router.setParams({ category: undefined })}
              accessibilityRole="button"
              accessibilityLabel={t("clearFilterCta")}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.accent }}>{t("clearFilterCta")}</Text>
            </Pressable>
          </View>
        ) : null
      }
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
