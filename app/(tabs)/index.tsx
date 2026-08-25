import { useMemo, useState } from "react";
import type { JSX } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useTracks } from "../../src/hooks/useTracks";
import { useContinueListening } from "../../src/hooks/useContinueListening";
import { usePlayerActions } from "../../src/hooks/usePlayerActions";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { usePressScale } from "../../src/hooks/usePressScale";
import { categoryIcon } from "../../src/lib/categoryIcon";
import { GlowBackground } from "../../src/components/GlowBackground";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Button } from "../../src/components/ui/Button";
import { EqBarsIcon, MoonIcon, PlayIcon } from "../../src/components/icons";
import type { IconProps } from "../../src/components/icons";
import type { Track } from "../../src/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Cap the rail at 5 real categories — enough to make the catalog's breadth
// recognizable at a glance without reintroducing the 6-tile grid's
// decision-overload problem (a critique finding). The trailing "all sounds"
// card is the one remaining escape hatch to the full, unfiltered catalog.
const MAX_RAIL_CATEGORIES = 5;
const CARD_WIDTH = 136;
const CARD_HEIGHT = 96;

type CategorySummary = { name: string; count: number; coverUrl?: string };

function pickTonightTrack(tracks: Track[], excludeId: string | null): Track | null {
  if (tracks.length === 0) return null;
  const pool = excludeId ? tracks.filter((track) => track.id !== excludeId) : tracks;
  const candidates = pool.length > 0 ? pool : tracks;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return candidates[dayIndex % candidates.length];
}

// One representative image per category: the first track in that category
// that actually has cover art (cover_url is optional per-track, so coverage
// isn't guaranteed — cards fall back to the icon tile when none is found).
function summarizeCategories(sections: { title: string; data: Track[] }[]): CategorySummary[] {
  const grouped = new Map<string, { count: number; coverUrl?: string }>();
  for (const section of sections) {
    const category = section.title.split(" / ")[0] ?? section.title;
    const existing = grouped.get(category) ?? { count: 0, coverUrl: undefined };
    existing.count += section.data.length;
    if (!existing.coverUrl) {
      existing.coverUrl = section.data.find((track) => track.coverUrl)?.coverUrl;
    }
    grouped.set(category, existing);
  }
  return Array.from(grouped.entries()).map(([name, v]) => ({ name, count: v.count, coverUrl: v.coverUrl }));
}

// A category card's own press-scale hook must be called unconditionally at
// this component's top level — cards render from a variable-length list, so
// the hook can't live in the parent's render body (that would call it a
// different number of times per render, breaking the rules of hooks).
function CategoryCard({
  icon: Icon,
  label,
  coverUrl,
  onPress,
  accessibilityLabel,
}: {
  icon: (props: IconProps) => JSX.Element;
  label: string;
  coverUrl?: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const colors = useThemeColors();
  const press = usePressScale();
  // A failed/expired image load must fall back to the same treatment as "no
  // cover art at all" — never a half-rendered blank tile with the photo
  // chrome still on top of it.
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(coverUrl) && !imageFailed;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.stroke,
          overflow: "hidden",
        },
        press.animatedStyle,
      ]}
    >
      {showPhoto ? (
        <>
          <Image
            source={{ uri: coverUrl }}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
            onError={() => setImageFailed(true)}
          />
          {/* Ember tint (DESIGN.md's One Hue Rule): every photo gets pulled
              toward the app's single accent hue instead of showing its own
              raw, arbitrary colors. */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.button}52` }]} />
          {/* Gradient scrim (never a blur, per the No-Blur rule) reaches full
              opacity (locations 0.68-1) before the label's own vertical
              position, so text contrast doesn't depend on the photo's local
              brightness at all — not just "usually enough". */}
          <LinearGradient
            colors={["transparent", colors.bgDeep, colors.bgDeep]}
            locations={[0.4, 0.68, 1]}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        // Same "no real artwork" fallback the mini-player dock already uses
        // (GlowBackground's artworkTile wash) — one shared, on-hue fallback
        // treatment instead of a bespoke flat tile, so the rail reads as one
        // grammar whether or not a given category has cover art yet.
        <GlowBackground variant="artworkTile" style={StyleSheet.absoluteFill} />
      )}
      <View style={{ position: "absolute", left: 10, right: 10, bottom: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon size={16} color={colors.accent} strokeWidth={1.7} />
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 12.5, fontWeight: "700", color: colors.text }}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

// Deliberately not a CategoryCard: this isn't a category, it's the escape
// hatch to the full catalog, so it gets its own accent-outlined surface
// (transparent background, accent border, accent icon+label, centered
// layout) instead of a photo tile — a distinct treatment on purpose, per
// explicit product feedback that it shouldn't read as just another
// category. It shares CategoryCard's footprint (width/height/radius) and
// the app-wide press-scale recipe (usePressScale) but is otherwise its own
// pattern, not a reuse of Button.tsx's outline variant — that button is a
// full-width 54px pill with colors.stroke/colors.text, a different shape
// and token pair entirely.
function AllSoundsCard({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const colors = useThemeColors();
  const press = usePressScale();

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: 10,
        },
        press.animatedStyle,
      ]}
    >
      <EqBarsIcon size={22} color={colors.accent} strokeWidth={1.6} />
      <Text numberOfLines={1} style={{ fontSize: 12.5, fontWeight: "700", color: colors.accent }}>
        {label}
      </Text>
    </AnimatedPressable>
  );
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
  const categories = useMemo(() => summarizeCategories(sections).slice(0, MAX_RAIL_CATEGORIES), [sections]);

  const tonightPress = usePressScale();
  const continuePress = usePressScale();

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
          {t("discover:loadError")}
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
    <GlowBackground variant="pageWash" style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: tabBarHeight + 24, gap: 16 }}
      >
        <ScreenHeader eyebrow={t("greetingEyebrow")} title={t("greetingTitle")} />

        {tonightTrack && (
          <AnimatedPressable
            onPress={() => play(tonightTrack)}
            onPressIn={tonightPress.onPressIn}
            onPressOut={tonightPress.onPressOut}
            style={tonightPress.animatedStyle}
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
                  <Text numberOfLines={2} className="font-bold" style={{ fontSize: 19, color: colors.text }}>
                    {tonightTrack.title}
                  </Text>
                  <Text numberOfLines={1} style={{ fontSize: 12.5, color: colors.muted }}>
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
          </AnimatedPressable>
        )}

        <View style={{ gap: 12 }}>
          <Text className="font-bold" style={{ fontSize: 15.5, color: colors.text }}>
            {t("browseSoundsTitle")}
          </Text>
          <View style={{ marginHorizontal: -20 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              {categories.map((category) => (
                <CategoryCard
                  key={category.name}
                  icon={categoryIcon(category.name)}
                  label={category.name}
                  coverUrl={category.coverUrl}
                  onPress={() => router.push({ pathname: "/discover", params: { category: category.name } })}
                  accessibilityLabel={category.name}
                />
              ))}
              <AllSoundsCard
                label={t("allSoundsChip")}
                onPress={() => router.push("/discover")}
                accessibilityLabel={t("allSoundsChip")}
              />
            </ScrollView>
          </View>
        </View>

        {continueTrack && (
          <View style={{ gap: 12 }}>
            <Text className="font-bold" style={{ fontSize: 15.5, color: colors.text }}>
              {t("continueListeningTitle")}
            </Text>
            <AnimatedPressable
              onPress={() => play(continueTrack)}
              onPressIn={continuePress.onPressIn}
              onPressOut={continuePress.onPressOut}
              accessibilityRole="button"
              accessibilityLabel={`${t("continueListeningTitle")}: ${continueTrack.title}`}
              style={[
                {
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
                },
                continuePress.animatedStyle,
              ]}
            >
              {(() => {
                const Icon = categoryIcon(continueTrack.category, continueTrack.subcategory);
                return <Icon size={20} color={colors.accent} strokeWidth={1.6} />;
              })()}
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                  {continueTrack.title}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 11, color: colors.muted }}>{continueTrack.category}</Text>
              </View>
            </AnimatedPressable>
          </View>
        )}
      </ScrollView>
    </GlowBackground>
  );
}
