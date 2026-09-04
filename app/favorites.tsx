import { useCallback, useMemo } from "react";
import type { JSX } from "react";
import { View, Text, ActivityIndicator, Pressable, SectionList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTracks } from "../src/hooks/useTracks";
import { useFavorites } from "../src/hooks/useFavorites";
import { usePlayerActions } from "../src/hooks/usePlayerActions";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { GlowBackground } from "../src/components/GlowBackground";
import { TrackRow, TrackSectionHeader } from "../src/components/TrackRow";
import { centeredColumn } from "../src/theme/layout";
import { Button } from "../src/components/ui/Button";
import { ChevronLeftIcon, HeartIcon } from "../src/components/icons";
import type { Track } from "../src/types";

export default function FavoritesScreen(): JSX.Element {
  const { t, i18n } = useTranslation("settings");
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sections: allSections, loading, error, refetch: refetchTracks } = useTracks();
  const { favoriteIds, refetch: refetchFavorites } = useFavorites();
  const { loadAndPlay } = usePlayerActions();

  // The heart on Now Playing is a separate useFavorites mount — refresh on
  // focus so this list reflects a like/unlike made after navigating away.
  useFocusEffect(
    useCallback(() => {
      refetchFavorites();
    }, [refetchFavorites])
  );

  // Keep the same category/subcategory sectioning Explore and the bedtime
  // picker use — a long favorites list keeps its scent instead of becoming
  // one undifferentiated column.
  const sections = useMemo(
    () =>
      allSections
        .map((section) => ({ ...section, data: section.data.filter((track) => favoriteIds.has(track.id)) }))
        .filter((section) => section.data.length > 0),
    [allSections, favoriteIds]
  );

  function openTrack(track: Track) {
    loadAndPlay(track);
    router.navigate("/player");
  }

  function retry() {
    refetchTracks();
    refetchFavorites();
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
        <Text accessibilityRole="header" className="font-bold" style={{ fontSize: 22, letterSpacing: -0.2, color: colors.text }}>
          {t("favoriteSoundsRowTitle")}
        </Text>
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
            {t("discover:loadError")}
          </Text>
          <View>
            <Button label={t("common:retry")} variant="outline" onPress={retry} />
          </View>
        </View>
      ) : sections.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 }}>
          <HeartIcon size={30} color={colors.faint} strokeWidth={1.5} />
          <Text className="font-bold" style={{ fontSize: 16, color: colors.text, textAlign: "center" }}>
            {t("favoritesEmptyTitle")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 19 }}>
            {t("favoritesEmptyBody")}
          </Text>
          <View style={{ marginTop: 2 }}>
            <Button label={t("favoritesEmptyCta")} variant="outline" onPress={() => router.push("/sounds")} />
          </View>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          // Off: a stuck header paints a flat `bg` band over the glow wash
          // (a visible seam), and a short favorites list gains little from
          // sticky headers. Also makes iOS/Android behave the same.
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          renderSectionHeader={({ section }) => (
            <TrackSectionHeader category={section.category} subcategory={section.subcategory} language={i18n.language} />
          )}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 8 }}>
              <TrackRow track={item} premiumLabel={t("discover:premiumBadge")} onPress={() => openTrack(item)} />
            </View>
          )}
        />
      )}
      </View>
    </GlowBackground>
  );
}
