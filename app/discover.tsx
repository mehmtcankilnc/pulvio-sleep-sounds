import { useMemo } from "react";
import { View, Text, ActivityIndicator, Pressable, SectionList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTracks } from "../src/hooks/useTracks";
import { usePlayerActions } from "../src/hooks/usePlayerActions";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { GlowBackground } from "../src/components/GlowBackground";
import { TrackRow, TrackSectionHeader } from "../src/components/TrackRow";
import { Button } from "../src/components/ui/Button";
import { ChevronLeftIcon, MusicIcon } from "../src/components/icons";
import { centeredColumn } from "../src/theme/layout";
import type { Track } from "../src/types";

export default function DiscoverScreen() {
  const { t, i18n } = useTranslation("discover");
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { sections: allSections, loading, error, refetch } = useTracks();
  const { loadAndPlay } = usePlayerActions();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();

  // A category tile promises a filtered view — fall back to the full catalog
  // if the filter would otherwise leave nothing to show (e.g. a stale/renamed
  // category), rather than presenting a false "empty" state.
  const filtered = useMemo(
    () => (category ? allSections.filter((section) => section.title.startsWith(`${category} / `)) : allSections),
    [allSections, category],
  );
  const sections = category && filtered.length > 0 ? filtered : allSections;
  const isFiltered = Boolean(category) && filtered.length > 0;

  function openTrack(track: Track) {
    loadAndPlay(track);
    router.navigate("/player");
  }

  return (
    <GlowBackground
      variant="pageWash"
      washes={[{ origin: { x: 12, y: -8 }, color: colors.glow, extent: 44 }]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, ...centeredColumn }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 20,
            paddingTop: Math.max(insets.top, 20) + 6,
            paddingBottom: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={6}
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.stroke,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={t("common:back")}
          >
            <ChevronLeftIcon size={20} color={colors.muted} strokeWidth={1.7} />
          </Pressable>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            className="font-bold"
            style={{ flex: 1, fontSize: 22, letterSpacing: -0.2, color: colors.text }}
          >
            {isFiltered ? category : t("tabTitle")}
          </Text>
          {isFiltered ? (
            <Pressable
              onPress={() => router.setParams({ category: undefined })}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t("clearFilterCta")}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.accent }}>{t("clearFilterCta")}</Text>
            </Pressable>
          ) : null}
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} accessible accessibilityLabel={t("common:loading")}>
            <ActivityIndicator color={colors.button} />
          </View>
        ) : error ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 }}>
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              style={{ textAlign: "center", color: colors.muted, fontSize: 13.5 }}
            >
              {t("loadError")}
            </Text>
            <View>
              <Button label={t("common:retry")} variant="outline" onPress={refetch} />
            </View>
          </View>
        ) : sections.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 }}>
            <MusicIcon size={30} color={colors.faint} strokeWidth={1.5} />
            <Text className="font-bold" style={{ fontSize: 16, color: colors.text, textAlign: "center" }}>
              {t("empty")}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 19 }}>
              {t("emptyBody")}
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            renderSectionHeader={({ section }) => (
              <TrackSectionHeader title={section.title} language={i18n.language} />
            )}
            renderItem={({ item }) => (
              <View style={{ marginBottom: 8 }}>
                <TrackRow track={item} premiumLabel={t("premiumBadge")} onPress={() => openTrack(item)} />
              </View>
            )}
          />
        )}
      </View>
    </GlowBackground>
  );
}
