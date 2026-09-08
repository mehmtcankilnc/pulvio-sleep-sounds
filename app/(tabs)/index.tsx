import { useCallback, useMemo, useState } from "react";
import type { JSX } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useUserStore } from "../../src/store/useUserStore";
import { useTracks } from "../../src/hooks/useTracks";
import { useFavorites } from "../../src/hooks/useFavorites";
import { useContinueListening } from "../../src/hooks/useContinueListening";
import { usePlayerActions } from "../../src/hooks/usePlayerActions";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { usePressScale } from "../../src/hooks/usePressScale";
import { categoryIcon } from "../../src/lib/categoryIcon";
import { categoryLabel, subcategoryLabel } from "../../src/lib/catalogTaxonomy";
import { GlowBackground } from "../../src/components/GlowBackground";
import { centeredColumn } from "../../src/theme/layout";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { PremiumBadge } from "../../src/components/PremiumBadge";
import { Button } from "../../src/components/ui/Button";
import {
  ChevronRightIcon,
  PlayIcon,
} from "../../src/components/icons";
import type { IconProps } from "../../src/components/icons";
import type { Track } from "../../src/types";

// Rail is capped like the category rail (5) — a scannable set, with the
// header "See all" as the path to the full, category-sectioned list.
const FAVORITES_RAIL_CAP = 6;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// Cap the rail — enough to make the catalog's breadth recognizable at a
// glance without reintroducing the 6-tile grid's decision-overload problem
// (a critique finding). The header's "All categories" link is the escape
// hatch to the unfiltered /sounds screen, which carries its own scrollable
// category-chip row (app/categories.tsx was merged into it — a second
// critique finding: the two screens did the same job one route apart).
const MAX_RAIL_CATEGORIES = 8;
const CARD_WIDTH = 136;
const CARD_HEIGHT = 108;

type CategorySummary = {
  category: string;
  subcategory: string;
  count: number;
  coverUrl?: string;
};

// Free users only ever get offered tracks they can actually tap and hear —
// recommending a locked one as the day's single headline pick turns the
// primary CTA into a paywall dead-end instead of a listen. `eligible` falls
// back to the full catalog only in the defensive case where a free user
// somehow has zero free tracks (shouldn't happen, but never show nothing).
function pickTonightTrack(
  tracks: Track[],
  excludeId: string | null,
  isPremium: boolean,
): Track | null {
  if (tracks.length === 0) return null;
  const eligible = isPremium ? tracks : tracks.filter((track) => !track.isPremiumOnly);
  const base = eligible.length > 0 ? eligible : tracks;
  const pool = excludeId
    ? base.filter((track) => track.id !== excludeId)
    : base;
  const candidates = pool.length > 0 ? pool : base;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return candidates[dayIndex % candidates.length];
}

// One tile per subcategory (Rain, Ocean, Piano, ...) rather than the 2-item
// top-level category — with 17 subcategories now in the catalog, "Calming" /
// "Music" alone would be a useless rail. Sections already arrive in taxonomy
// order from useTracks, so this preserves that order rather than resorting.
function summarizeSubcategories(
  sections: { category: string; subcategory: string; data: Track[] }[],
): CategorySummary[] {
  return sections.map((section) => ({
    category: section.category,
    subcategory: section.subcategory,
    count: section.data.length,
    coverUrl: section.data.find((track) => track.coverUrl)?.coverUrl,
  }));
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
  // The fallback tile doubles as the loading state: it's the base layer
  // whenever there's a cover to fetch, and the photo — once its own network
  // request resolves — crossfades in on top of it. Without this, a slow
  // image request left the card showing nothing (its bare card background)
  // until the photo popped in all at once.
  const photoOpacity = useSharedValue(0);
  const photoStyle = useAnimatedStyle(() => ({ opacity: photoOpacity.value }));

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
      {/* Same "no real artwork" fallback the mini-player dock already uses
          (GlowBackground's artworkTile wash) — one shared, on-hue fallback
          treatment instead of a bespoke flat tile, so the rail reads as one
          grammar whether or not a given category has cover art yet. */}
      <GlowBackground variant="artworkTile" style={StyleSheet.absoluteFill} />
      {showPhoto ? (
        <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
          <Image
            source={{ uri: coverUrl }}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
            onLoad={() => {
              photoOpacity.value = withTiming(1, { duration: 220, easing: EASE_OUT });
            }}
            onError={() => setImageFailed(true)}
          />
          {/* Ember tint (DESIGN.md's One Hue Rule): every photo gets pulled
              toward the app's single accent hue instead of showing its own
              raw, arbitrary colors. Lighter than the label scrim below — this
              one washes the whole photo, including the two-thirds of it that
              carries no text, so it stays legible-but-visible rather than
              looking like the photo itself got dimmed. */}
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: `${colors.button}30` },
            ]}
          />
          {/* Gradient scrim (never a blur, per the No-Blur rule) reaches full
              opacity (locations 0.74-1) just before the label's own vertical
              position, so text contrast doesn't depend on the photo's local
              brightness at all — not just "usually enough". Tightened from
              0.68 so the fully-opaque strip is only as tall as the label
              actually needs, leaving more of the photo visible above it. */}
          <LinearGradient
            colors={["transparent", colors.bgDeep, colors.bgDeep]}
            locations={[0.45, 0.74, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
      <View
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          bottom: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Icon size={16} color={colors.accent} strokeWidth={1.7} />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: 12.5,
            fontWeight: "700",
            color: colors.text,
          }}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const TONIGHT_ART_SIZE = 72;

// The tonight-pick hero's right-side visual — was a bare category icon
// (same glyph for e.g. all 6 subcategories under "rahatlatici" that share
// one icon), now the category's own cover photo so the hero reads as
// "this specific sound" rather than a generic bucket. Falls back to the
// category icon (same as before) when there's no cover yet or the image
// fails to load — mirrors CategoryCard's photo/fallback pattern above,
// minus the label overlay (the hero already shows the title as text).
function TonightArt({ track }: { track: Track }) {
  const colors = useThemeColors();
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(track.coverUrl) && !imageFailed;
  const photoOpacity = useSharedValue(0);
  const photoStyle = useAnimatedStyle(() => ({ opacity: photoOpacity.value }));
  const Icon = categoryIcon(track.category, track.subcategory);

  return (
    <View
      style={{
        width: TONIGHT_ART_SIZE,
        height: TONIGHT_ART_SIZE,
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      <GlowBackground variant="artworkTile" style={StyleSheet.absoluteFill} />
      {showPhoto ? (
        <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
          <Image
            source={{ uri: track.coverUrl }}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
            onLoad={() => {
              photoOpacity.value = withTiming(1, { duration: 220, easing: EASE_OUT });
            }}
            onError={() => setImageFailed(true)}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.button}30` }]} />
        </Animated.View>
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <Icon size={34} color={colors.accent} strokeWidth={1.1} />
        </View>
      )}
    </View>
  );
}

// Every horizontal-rail section (Browse sounds, Favorites) opens with this:
// a bold title and a right-aligned text link to the full view. The link
// lives in the header, never at the end of the rail — the rail's far edge
// is the worst spot on the screen for a nav action (behind a scroll, worst
// thumb reach). For "All sounds" this also fully satisfies the product note
// that it must not read as just another category: it isn't a card at all.
function SectionHeader({
  title,
  actionLabel,
  onAction,
  actionTestID,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  actionTestID?: string;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Text
        className="font-bold"
        style={{ fontSize: 15.5, color: colors.text }}
      >
        {title}
      </Text>
      <Pressable
        onPress={onAction}
        testID={actionTestID}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        hitSlop={8}
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          justifyContent: "flex-end",
        }}
      >
        <Text
          style={{ fontSize: 12.5, fontWeight: "600", color: colors.accent }}
        >
          {actionLabel}
        </Text>
        <ChevronRightIcon size={14} color={colors.accent} strokeWidth={1.7} />
      </Pressable>
    </View>
  );
}

export default function ExploreScreen() {
  const { t } = useTranslation("home");
  const { t: tCatalog } = useTranslation("catalog");
  const router = useRouter();
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { sections, loading, error, refetch } = useTracks();
  const { favoriteIds, refetch: refetchFavorites } = useFavorites();
  const continueListeningId = useContinueListening();
  const { loadAndPlay } = usePlayerActions();
  const isPremium = useUserStore((state) => state.subscriptionStatus === "premium");

  // A like/unlike happens on Now Playing (its own useFavorites mount) —
  // refresh on focus so this section reflects it after navigating back.
  useFocusEffect(
    useCallback(() => {
      refetchFavorites();
    }, [refetchFavorites]),
  );

  const allTracks = useMemo(
    () => sections.flatMap((section) => section.data),
    [sections],
  );
  const favoriteTracks = useMemo(
    () => allTracks.filter((track) => favoriteIds.has(track.id)),
    [allTracks, favoriteIds],
  );
  const continueTrack =
    allTracks.find((track) => track.id === continueListeningId) ?? null;
  const tonightTrack = useMemo(
    () => pickTonightTrack(allTracks, continueTrack?.id ?? null, isPremium),
    [allTracks, continueTrack, isPremium],
  );
  const categories = useMemo(
    () => summarizeSubcategories(sections).slice(0, MAX_RAIL_CATEGORIES),
    [sections],
  );

  const tonightPress = usePressScale();
  const continuePress = usePressScale();

  function play(track: Track) {
    loadAndPlay(track);
    router.push("/player");
  }

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.bg }}
      >
        <ActivityIndicator color={colors.button} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: colors.bg }}
      >
        <Text className="text-center mb-4" style={{ color: colors.text }}>
          {t("discover:loadError")}
        </Text>
        <Button label={t("common:retry")} variant="outline" onPress={refetch} />
      </View>
    );
  }

  if (allTracks.length === 0) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.bg }}
      >
        <Text style={{ color: colors.text, fontSize: 18 }}>
          {t("discover:empty")}
        </Text>
      </View>
    );
  }

  return (
    <GlowBackground variant="pageWash" style={{ flex: 1 }}>
      <ScrollView
        testID="explore-screen"
        style={{ flex: 1 }}
        contentContainerStyle={{
          ...centeredColumn,
          paddingHorizontal: 20,
          paddingTop: 32,
          paddingBottom: tabBarHeight + 24,
          gap: 16,
        }}
      >
        <ScreenHeader
          eyebrow={t("greetingEyebrow")}
          title={t("greetingTitle")}
          trailing={<PremiumBadge />}
        />

        {tonightTrack && (
          <AnimatedPressable
            testID="tonight-pick"
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
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: "700",
                    letterSpacing: 1.5,
                    color: colors.accent,
                  }}
                >
                  {t("tonightPickOverline")}
                </Text>
                <View style={{ gap: 3 }}>
                  <Text
                    numberOfLines={2}
                    className="font-bold"
                    style={{ fontSize: 19, color: colors.text }}
                  >
                    {tonightTrack.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 12.5, color: colors.muted }}
                  >
                    {categoryLabel(tCatalog, tonightTrack.category)} ·{" "}
                    {subcategoryLabel(tCatalog, tonightTrack.subcategory)}
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
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: "700",
                      color: colors.buttonText,
                    }}
                  >
                    {t("playNowCta")}
                  </Text>
                </View>
              </View>
              <TonightArt track={tonightTrack} />
            </GlowBackground>
          </AnimatedPressable>
        )}

        {favoriteTracks.length > 0 && (
          <View style={{ gap: 12 }}>
            <SectionHeader
              title={t("favoritesTitle")}
              actionLabel={t("favoritesSeeAll")}
              onAction={() => router.push("/favorites")}
            />
            <View style={{ marginHorizontal: -20 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
              >
                {favoriteTracks.slice(0, FAVORITES_RAIL_CAP).map((track) => (
                  <CategoryCard
                    key={track.id}
                    icon={categoryIcon(track.category, track.subcategory)}
                    label={track.title}
                    coverUrl={track.coverUrl}
                    onPress={() => play(track)}
                    accessibilityLabel={track.title}
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        <View style={{ gap: 12 }}>
          <SectionHeader
            title={t("browseSoundsTitle")}
            actionLabel={t("browseSoundsSeeAll")}
            onAction={() => router.push("/categories")}
            actionTestID="browse-all-categories"
          />
          <View style={{ marginHorizontal: -20 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              {categories.map((category) => {
                const label = subcategoryLabel(tCatalog, category.subcategory);
                return (
                  <CategoryCard
                    key={category.subcategory}
                    icon={categoryIcon(category.category, category.subcategory)}
                    label={label}
                    coverUrl={category.coverUrl}
                    onPress={() =>
                      router.push({
                        pathname: "/sounds",
                        params: { subcategory: category.subcategory },
                      })
                    }
                    accessibilityLabel={label}
                  />
                );
              })}
            </ScrollView>
          </View>
        </View>

        {continueTrack && (
          <View style={{ gap: 12 }}>
            <Text
              className="font-bold"
              style={{ fontSize: 15.5, color: colors.text }}
            >
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
                  borderRadius: 18,
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 64,
                },
                continuePress.animatedStyle,
              ]}
            >
              {/* A soft glow tile behind the icon (same "artwork chip" idea
                  as the category rail) instead of a bare glyph floating in
                  the row — gives this card the same visual weight as
                  Tonight's pick's own icon treatment, so it doesn't read as
                  a settings row next to it. */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: colors.glowSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {(() => {
                  const Icon = categoryIcon(
                    continueTrack.category,
                    continueTrack.subcategory,
                  );
                  return (
                    <Icon size={21} color={colors.accent} strokeWidth={1.6} />
                  );
                })()}
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13.5,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  {continueTrack.title}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 11, color: colors.muted }}
                >
                  {subcategoryLabel(tCatalog, continueTrack.subcategory)}
                </Text>
              </View>
              {/* Same solid-button play affordance Tonight's pick uses,
                  scaled down — makes the tap target read as "resume"
                  rather than "open a row", which the bare icon + chevron-
                  less layout didn't otherwise signal. */}
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  backgroundColor: colors.button,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PlayIcon size={14} color={colors.buttonText} />
              </View>
            </AnimatedPressable>
          </View>
        )}
      </ScrollView>
    </GlowBackground>
  );
}
