import { memo, useCallback, useMemo, useState } from "react";
import type { JSX } from "react";
import { View, Text, ActivityIndicator, Pressable, FlatList, Image, StyleSheet } from "react-native";
import type { ListRenderItem } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTracks } from "../src/hooks/useTracks";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { usePressScale } from "../src/hooks/usePressScale";
import { GlowBackground } from "../src/components/GlowBackground";
import { Button } from "../src/components/ui/Button";
import { centeredColumn } from "../src/theme/layout";
import { categoryIcon } from "../src/lib/categoryIcon";
import { CATEGORY_ORDER, categoryLabel, subcategoryLabel } from "../src/lib/catalogTaxonomy";
import { ChevronLeftIcon, MusicIcon } from "../src/components/icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const TILE_HEIGHT = 112;

type Tile = {
  subcategory: string;
  category: string;
  label: string;
  coverUrl?: string;
  countLabel: string;
};

type Row =
  | { type: "header"; key: string; label: string }
  | { type: "pair"; key: string; a: Tile; b?: Tile };

// Reached from Explore → "All categories". A grouped, 2-column grid of every
// subcategory as its own tile — the browse view that surfaces the catalog's
// breadth ("Brown noise", "Pink noise", "Fireplace", "Lo-fi", …) as scannable
// labels rather than a horizontal rail that hides most of them. Each tile
// deep-links into /sounds pre-filtered to that subcategory.
//
// Performance: the list is a virtualized FlatList of row items (a section
// header, or a pair of tiles), each tile is `memo`'d with only primitive
// props + a stable `onPress`, and the tile background is a flat View rather
// than the SVG `GlowBackground` wash — so scrolling reconciles nothing and
// only the ~4 on-screen rows are ever mounted.
//
// Photo/fallback treatment mirrors Explore's category rail: the subcategory's
// cover art fills the tile, pulled toward the app accent (One Hue Rule) with a
// bottom scrim so the label stays legible; the category glyph is the base
// layer and the "no cover / load failed" fallback.
const GridTile = memo(function GridTile({
  subcategory,
  category,
  label,
  coverUrl,
  countLabel,
  onPress,
}: Tile & { onPress: (subcategory: string) => void }): JSX.Element {
  const colors = useThemeColors();
  const press = usePressScale();
  const Icon = categoryIcon(category, subcategory);
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = Boolean(coverUrl) && !imageFailed;
  const photoOpacity = useSharedValue(0);
  const photoStyle = useAnimatedStyle(() => ({ opacity: photoOpacity.value }));

  return (
    <AnimatedPressable
      testID={`category-tile-${subcategory}`}
      onPress={() => onPress(subcategory)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${countLabel}`}
      style={[
        {
          flex: 1,
          height: TILE_HEIGHT,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.stroke,
          backgroundColor: colors.card,
          overflow: "hidden",
        },
        press.animatedStyle,
      ]}
    >
      {/* Base layer: the category glyph, also what shows while the photo
          request is in flight. */}
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
        <Icon size={30} color={colors.accent} strokeWidth={1.15} />
      </View>

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
          <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.button}30` }]} />
          <LinearGradient
            colors={["transparent", colors.bgDeep, colors.bgDeep]}
            locations={[0.4, 0.78, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}

      <View style={{ position: "absolute", left: 12, right: 12, bottom: 11, gap: 1 }}>
        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 11, color: colors.muted }}>{countLabel}</Text>
      </View>
    </AnimatedPressable>
  );
});

export default function CategoriesScreen(): JSX.Element {
  const { t, i18n } = useTranslation("discover");
  const { t: tCatalog } = useTranslation("catalog");
  const colors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sections, loading, error, refetch } = useTracks();

  const openSubcategory = useCallback(
    (subcategory: string) => router.push({ pathname: "/sounds", params: { subcategory } }),
    [router],
  );

  // Flatten to virtualizable rows once: a header per category, then that
  // category's subcategories paired up two per row. All label/count/cover
  // lookups happen here, not in renderItem.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const category of CATEGORY_ORDER) {
      const subs = sections.filter((section) => section.category === category);
      if (subs.length === 0) continue;
      out.push({
        type: "header",
        key: `h-${category}`,
        label: categoryLabel(tCatalog, category).toLocaleUpperCase(i18n.language),
      });
      const tiles: Tile[] = subs.map((section) => ({
        subcategory: section.subcategory,
        category: section.category,
        label: subcategoryLabel(tCatalog, section.subcategory),
        coverUrl: section.data.find((track) => track.coverUrl)?.coverUrl,
        countLabel: t("soundCount", { count: section.data.length }),
      }));
      for (let i = 0; i < tiles.length; i += 2) {
        out.push({ type: "pair", key: `r-${category}-${i}`, a: tiles[i], b: tiles[i + 1] });
      }
    }
    return out;
  }, [sections, t, tCatalog, i18n.language]);

  const renderItem = useCallback<ListRenderItem<Row>>(
    ({ item }) => {
      if (item.type === "header") {
        return (
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.6,
              color: colors.accent,
              paddingTop: 22,
              paddingBottom: 12,
            }}
          >
            {item.label}
          </Text>
        );
      }
      return (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <GridTile {...item.a} onPress={openSubcategory} />
          {item.b ? <GridTile {...item.b} onPress={openSubcategory} /> : <View style={{ flex: 1 }} />}
        </View>
      );
    },
    [colors.accent, openSubcategory],
  );

  return (
    <GlowBackground
      variant="pageWash"
      washes={[{ origin: { x: 12, y: -8 }, color: colors.glow, extent: 44 }]}
      style={{ flex: 1 }}
    >
      <View testID="categories-screen" style={{ flex: 1, ...centeredColumn }}>
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
            className="font-bold"
            style={{ fontSize: 22, letterSpacing: -0.2, color: colors.text }}
          >
            {t("allCategoriesTitle")}
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
              style={{ textAlign: "center", color: colors.notice, fontSize: 13.5 }}
            >
              {t("loadError")}
            </Text>
            <View>
              <Button label={t("common:retry")} variant="outline" onPress={refetch} />
            </View>
          </View>
        ) : rows.length === 0 ? (
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
          <FlatList
            data={rows}
            renderItem={renderItem}
            keyExtractor={(row) => row.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
            removeClippedSubviews
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={9}
          />
        )}
      </View>
    </GlowBackground>
  );
}
