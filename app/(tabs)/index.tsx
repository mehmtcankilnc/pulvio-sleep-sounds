import { useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTracks } from "../../src/hooks/useTracks";
import { useContinueListening } from "../../src/hooks/useContinueListening";
import { usePlayerActions } from "../../src/hooks/usePlayerActions";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { categoryIcon } from "../../src/lib/categoryIcon";
import { GlowBackground } from "../../src/components/GlowBackground";
import { Button } from "../../src/components/ui/Button";
import { MoonIcon, PlayIcon } from "../../src/components/icons";
import type { Track } from "../../src/types";

type CategorySummary = { name: string; count: number };

function pickTonightTrack(tracks: Track[], excludeId: string | null): Track | null {
  if (tracks.length === 0) return null;
  const pool = excludeId ? tracks.filter((track) => track.id !== excludeId) : tracks;
  const candidates = pool.length > 0 ? pool : tracks;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return candidates[dayIndex % candidates.length];
}

function summarizeCategories(sections: { title: string; data: Track[] }[]): CategorySummary[] {
  const counts = new Map<string, number>();
  for (const section of sections) {
    const category = section.title.split(" / ")[0] ?? section.title;
    counts.set(category, (counts.get(category) ?? 0) + section.data.length);
  }
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}

export default function ExploreScreen() {
  const { t } = useTranslation("home");
  const router = useRouter();
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { sections, loading, error, refetch } = useTracks();
  const continueListeningId = useContinueListening();
  const { loadAndPlay } = usePlayerActions();

  const allTracks = useMemo(() => sections.flatMap((section) => section.data), [sections]);
  const continueTrack = allTracks.find((track) => track.id === continueListeningId) ?? null;
  const tonightTrack = useMemo(
    () => pickTonightTrack(allTracks, continueTrack?.id ?? null),
    [allTracks, continueTrack]
  );
  const categories = useMemo(() => summarizeCategories(sections).slice(0, 6), [sections]);

  function play(track: Track) {
    loadAndPlay(track);
    router.push("/player");
  }

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
          {t("discover:loadError", { error })}
        </Text>
        <Button label={t("common:retry")} variant="outline" onPress={refetch} />
      </View>
    );
  }

  if (allTracks.length === 0) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Text style={{ color: colors.text, fontSize: 18 }}>{t("discover:empty")}</Text>
      </View>
    );
  }

  const TonightIcon = tonightTrack ? categoryIcon(tonightTrack.category, tonightTrack.subcategory) : MoonIcon;

  return (
    <GlowBackground
      variant="pageWash"
      washes={[
        { origin: { x: 88, y: -6 }, color: colors.glow, extent: 44 },
        { origin: { x: -12, y: 34 }, color: colors.glowSoft, extent: 42 },
      ]}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: tabBarHeight + 24, gap: 16 }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ gap: 3 }}>
            <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
              {t("greetingEyebrow")}
            </Text>
            <Text className="font-bold" style={{ fontSize: 22, letterSpacing: -0.2, color: colors.text }}>
              {t("greetingTitle")}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/sleep")}
            style={{
              width: 46,
              height: 46,
              borderRadius: 999,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.stroke,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel={t("sleep:tabTitle")}
          >
            <MoonIcon size={21} color={colors.muted} strokeWidth={1.7} />
          </Pressable>
        </View>

        {tonightTrack && (
          <Pressable
            onPress={() => play(tonightTrack)}
            accessibilityRole="button"
            accessibilityLabel={`${t("tonightPickTitle")}: ${tonightTrack.title}`}
          >
            <GlowBackground
              variant="heroCard"
              style={{
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.stroke,
                padding: 18,
                paddingBottom: 16,
                minHeight: 138,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 14,
              }}
            >
              <View style={{ gap: 8, alignItems: "flex-start", flexShrink: 1 }}>
                <Text style={{ fontSize: 10.5, fontWeight: "700", letterSpacing: 1.5, color: colors.accent }}>
                  {t("tonightPickOverline")}
                </Text>
                <View style={{ gap: 3 }}>
                  <Text className="font-bold" style={{ fontSize: 19, color: colors.text }}>
                    {tonightTrack.title}
                  </Text>
                  <Text style={{ fontSize: 12.5, color: colors.muted }}>
                    {tonightTrack.category} · {tonightTrack.subcategory}
                  </Text>
                </View>
                <View
                  style={{
                    marginTop: 4,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: colors.button,
                    borderRadius: 999,
                    paddingHorizontal: 20,
                    height: 44,
                  }}
                >
                  <PlayIcon size={15} color={colors.buttonText} />
                  <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.buttonText }}>{t("playNowCta")}</Text>
                </View>
              </View>
              <TonightIcon size={62} color={colors.accent} strokeWidth={1.1} />
            </GlowBackground>
          </Pressable>
        )}

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text className="font-bold" style={{ fontSize: 15.5, color: colors.text }}>
              {t("browseSoundsTitle")}
            </Text>
            <Pressable onPress={() => router.push("/discover")} accessibilityRole="button">
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.accent }}>{t("seeAllCta")}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 11 }}>
            {categories.map((category) => {
              const Icon = categoryIcon(category.name);
              return (
                <Pressable
                  key={category.name}
                  onPress={() => router.push("/discover")}
                  style={{
                    width: "47.5%",
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.stroke,
                    borderRadius: 18,
                    padding: 12,
                    paddingHorizontal: 14,
                    gap: 8,
                    minHeight: 86,
                    justifyContent: "center",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={category.name}
                >
                  <Icon size={22} color={colors.accent} strokeWidth={1.6} />
                  <View style={{ gap: 2 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "600", color: colors.text }}>{category.name}</Text>
                    <Text style={{ fontSize: 11.5, color: colors.faint }}>{t("soundsCount", { count: category.count })}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {continueTrack && (
          <View style={{ gap: 12 }}>
            <Text className="font-bold" style={{ fontSize: 15.5, color: colors.text }}>
              {t("continueListeningTitle")}
            </Text>
            <Pressable
              onPress={() => play(continueTrack)}
              accessibilityRole="button"
              accessibilityLabel={`${t("continueListeningTitle")}: ${continueTrack.title}`}
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.stroke,
                borderRadius: 16,
                padding: 11,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                minHeight: 58,
              }}
            >
              {(() => {
                const Icon = categoryIcon(continueTrack.category, continueTrack.subcategory);
                return <Icon size={20} color={colors.accent} strokeWidth={1.6} />;
              })()}
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                  {continueTrack.title}
                </Text>
                <Text style={{ fontSize: 11, color: colors.faint }}>{continueTrack.category}</Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </GlowBackground>
  );
}
