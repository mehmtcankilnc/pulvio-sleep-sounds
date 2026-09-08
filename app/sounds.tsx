import { useEffect, useMemo, useState, type ReactNode } from "react";
import { View, Text, ActivityIndicator, Pressable, ScrollView, SectionList } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTracks } from "../src/hooks/useTracks";
import { usePlayerActions } from "../src/hooks/usePlayerActions";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { usePressScale } from "../src/hooks/usePressScale";
import { useDebouncedValue } from "../src/hooks/useDebouncedValue";
import { GlowBackground } from "../src/components/GlowBackground";
import { TrackRow, TrackSectionHeader } from "../src/components/TrackRow";
import { SearchField } from "../src/components/ui/SearchField";
import { SelectChip } from "../src/components/ui/SelectChip";
import { Button } from "../src/components/ui/Button";
import { ChevronLeftIcon, LockIcon, MusicIcon, SearchIcon } from "../src/components/icons";
import { centeredColumn } from "../src/theme/layout";
import { CATEGORY_ORDER, categoryLabel, subcategoryLabel } from "../src/lib/catalogTaxonomy";
import type { Track } from "../src/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Strong ease-out (animations.dev / Apple HIG "Designing Fluid Interfaces"
// convention) for anything entering or exiting — starts fast, which is the
// instant a user is watching most closely. Never ease-in on UI: it delays
// that first moment and reads as sluggish.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// A horizontal chip row with no visual signal that it scrolls reads as
// "that's the whole list" — a drowsy user won't discover the rest by
// accident. Edge fades only appear on the side that actually has more
// content. Scroll position lives entirely in shared values driven by
// useAnimatedScrollHandler — never React state — so scrolling never
// triggers a JS-thread re-render; the fade opacity is computed and
// animated on the UI thread via useAnimatedStyle instead.
function FadingChipRow({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  const layoutWidth = useSharedValue(0);
  const contentWidth = useSharedValue(0);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const leftFadeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scrollX.value > 4 ? 1 : 0, { duration: 120, easing: EASE_OUT }),
  }));
  const rightFadeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(contentWidth.value - layoutWidth.value - scrollX.value > 4 ? 1 : 0, {
      duration: 120,
      easing: EASE_OUT,
    }),
  }));

  return (
    <View onLayout={(event) => (layoutWidth.value = event.nativeEvent.layout.width)}>
      <AnimatedScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onContentSizeChange={(width) => (contentWidth.value = width)}
      >
        {children}
      </AnimatedScrollView>
      <AnimatedLinearGradient
        colors={[colors.bg, "transparent"] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={[{ position: "absolute", left: 0, top: 0, bottom: 0, width: 28 }, leftFadeStyle]}
      />
      <AnimatedLinearGradient
        colors={["transparent", colors.bg] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={[{ position: "absolute", right: 0, top: 0, bottom: 0, width: 28 }, rightFadeStyle]}
      />
    </View>
  );
}

// Was app/discover.tsx, then briefly split into this file + app/categories.tsx
// (an "all categories" grid that did nothing but route-push into here). A
// critique found that split cost a bedtime user a full extra navigation
// level for zero benefit — every path through the grid terminated here
// anyway — so it's merged back into one screen: this search field, the
// chip rows below it, and the list. i18next namespace stays "discover" (see
// src/locales/*/discover.json) — renaming it would touch call sites across
// sleep.tsx/favorites.tsx for a purely internal, not user-facing, string.
//
// The chip picker is two tiers (top-level category, then that category's
// subcategories) rather than one flat row of all 17 subcategories. A flat
// row only shrank the *viewport* problem (fewer tiles visible at once) —
// the user still had to scroll and recall all 17 to find one, which is the
// actual working-memory cost. Splitting by CATEGORY_ORDER keeps the first,
// always-visible decision to Free-only + "All" + 2 categories, and defers
// the finer-grained subcategory choice to a second row that only appears
// once the user has already narrowed their intent.
export default function SoundsScreen() {
  const { t, i18n } = useTranslation("discover");
  const { t: tCatalog } = useTranslation("catalog");
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { sections: allSections, loading, error, refetch } = useTracks();
  const { loadAndPlay } = usePlayerActions();
  const router = useRouter();
  const backPress = usePressScale();

  // Only the initial mount reads the route param (a home-rail card or a
  // deep link); after that the chip rows own selection as local state so
  // tapping a different chip doesn't need a navigation.
  const params = useLocalSearchParams<{ subcategory?: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | undefined>(params.subcategory);
  const [freeOnly, setFreeOnly] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);

  // A deep link only carries the subcategory, not its parent category — once
  // the catalog loads, back-fill the top-level chip so the picker opens with
  // the right tier already expanded instead of showing "All" as selected
  // while a subcategory chip is active underneath it. Guarded to run once:
  // if the user has already touched the top row, their choice wins.
  useEffect(() => {
    if (selectedCategory || !selectedSubcategory || allSections.length === 0) return;
    const match = allSections.find((section) => section.subcategory === selectedSubcategory);
    if (match) setSelectedCategory(match.category);
  }, [allSections, selectedCategory, selectedSubcategory]);

  const topChips = useMemo(
    () => [
      { id: undefined as string | undefined, label: t("allSoundsRow"), premium: false },
      // CATEGORY_ORDER is a fixed, hardcoded taxonomy (catalogTaxonomy.ts),
      // not something the Supabase fetch discovers — gating this list on
      // `allSections` meant both category chips were simply absent for the
      // ~1s fetch and then popped in once it resolved. Filtering by
      // `!loading` only ever hides a category that turned out to have zero
      // tracks after the real fetch; the chips render immediately at the
      // shape they'll actually have.
      ...CATEGORY_ORDER.filter((category) => loading || allSections.some((section) => section.category === category)).map((category) => {
        const categorySections = allSections.filter((section) => section.category === category);
        return {
          id: category as string | undefined,
          label: categoryLabel(tCatalog, category),
          // A category that's 100% premium always dead-ends free users in
          // the empty "free filter" state below — flagging it up front on
          // the chip itself (rather than only after they've tapped in and
          // hit a wall) is a cheaper way to set that expectation. Guarded
          // on non-empty data so an empty-during-load array doesn't read as
          // vacuously "all premium" and flash a lock icon that's gone a
          // moment later.
          premium: categorySections.length > 0 && categorySections.every((section) => section.data.every((track) => track.isPremiumOnly)),
        };
      }),
    ],
    [allSections, loading, tCatalog, t]
  );

  const subChips = useMemo(() => {
    if (!selectedCategory) return [];
    return [
      {
        id: undefined as string | undefined,
        label: t("allInCategoryRow", { category: categoryLabel(tCatalog, selectedCategory) }),
        premium: false,
      },
      ...allSections
        .filter((section) => section.category === selectedCategory)
        .map((section) => ({
          id: section.subcategory as string | undefined,
          label: subcategoryLabel(tCatalog, section.subcategory),
          premium: section.data.every((track) => track.isPremiumOnly),
        })),
    ];
  }, [allSections, selectedCategory, tCatalog, t]);

  function selectCategory(category: string | undefined) {
    setSelectedCategory(category);
    setSelectedSubcategory(undefined);
  }

  const categoryFiltered = useMemo(() => {
    if (selectedSubcategory) return allSections.filter((section) => section.subcategory === selectedSubcategory);
    if (selectedCategory) return allSections.filter((section) => section.category === selectedCategory);
    return allSections;
  }, [allSections, selectedCategory, selectedSubcategory]);

  // A selected chip that matches nothing (a stale deep link, a renamed
  // subcategory, a bad notification param) used to silently fall back to
  // showing the entire catalog under a generic title — the user tapped
  // "Rain" and got 99 unrelated tracks with no explanation. Now it's its
  // own state: the chip row stays visible and interactive (tapping "All" is
  // the recovery), and the content area says plainly that this one is
  // unavailable rather than pretending nothing was filtered.
  const categoryUnavailable = Boolean(selectedSubcategory) && allSections.length > 0 && categoryFiltered.length === 0;

  const freeFiltered = useMemo(() => {
    if (!freeOnly) return categoryFiltered;
    return categoryFiltered
      .map((section) => ({ ...section, data: section.data.filter((track) => !track.isPremiumOnly) }))
      .filter((section) => section.data.length > 0);
  }, [categoryFiltered, freeOnly]);

  // Free-only can zero out a category that otherwise has tracks (an
  // all-premium category). This used to fall through to the generic
  // "catalog is empty" empty state, which is a lie about why — the catalog
  // isn't empty, this one filter combination is. It gets its own state and
  // a one-tap way out rather than making the user hunt for the toggle.
  const freeFilterUnavailable = freeOnly && categoryFiltered.length > 0 && freeFiltered.length === 0;

  // Matches on track title, debounced so a half-asleep user's typing never
  // re-filters mid-keystroke. `normalize` uses the current language's own
  // case-folding rules (matters for TR's dotted/dotless I).
  const trimmedQuery = debouncedQuery.trim();
  const normalize = (value: string) => value.toLocaleLowerCase(i18n.language);
  const sections = useMemo(() => {
    if (!trimmedQuery) return freeFiltered;
    const needle = normalize(trimmedQuery);
    return freeFiltered
      .map((section) => ({ ...section, data: section.data.filter((track) => normalize(track.title).includes(needle)) }))
      .filter((section) => section.data.length > 0);
  }, [freeFiltered, trimmedQuery, i18n.language]);
  const isSearching = trimmedQuery.length > 0;
  const isFiltered = Boolean(selectedCategory || selectedSubcategory || freeOnly || isSearching);
  const resultCount = useMemo(() => sections.reduce((sum, section) => sum + section.data.length, 0), [sections]);

  function openTrack(track: Track) {
    loadAndPlay(track);
    router.navigate("/player");
  }

  function resetFilters() {
    setSelectedCategory(undefined);
    setSelectedSubcategory(undefined);
    setFreeOnly(false);
    setQuery("");
  }

  return (
    <GlowBackground
      variant="pageWash"
      washes={[{ origin: { x: 12, y: -8 }, color: colors.glow, extent: 44 }]}
      style={{ flex: 1 }}
    >
      <View testID="sounds-screen" style={{ flex: 1, ...centeredColumn }}>
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
          <AnimatedPressable
            onPress={() => router.back()}
            onPressIn={backPress.onPressIn}
            onPressOut={backPress.onPressOut}
            hitSlop={6}
            style={[
              {
                width: 44,
                height: 44,
                borderRadius: 999,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.stroke,
                alignItems: "center",
                justifyContent: "center",
              },
              backPress.animatedStyle,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("common:back")}
          >
            <ChevronLeftIcon size={20} color={colors.muted} strokeWidth={1.7} />
          </AnimatedPressable>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            className="font-bold"
            style={{ flex: 1, fontSize: 22, letterSpacing: -0.2, color: colors.text }}
          >
            {t("tabTitle")}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder={t("searchPlaceholder")}
            accessibilityLabel={t("searchPlaceholder")}
          />
          <View style={{ marginHorizontal: -20 }}>
            <FadingChipRow>
              {/* The free-only toggle is a different kind of control from the
                  category chips (independent on/off vs. pick-one), so it
                  leads the same scroll strip instead of sitting alone on its
                  own half-empty row — a hairline separates the two groups
                  rather than a second row implying it, too, is a category. */}
              <SelectChip
                label={t("freeOnlyFilter")}
                selected={freeOnly}
                onPress={() => setFreeOnly((value) => !value)}
                height={38}
                fontSize={12.5}
                paddingHorizontal={16}
                role="switch"
              />
              <View style={{ width: 1, height: 22, backgroundColor: colors.stroke }} />
              {topChips.map((chip) => (
                <SelectChip
                  key={chip.id ?? "all"}
                  testID={chip.id ? `category-chip-${chip.id}` : "category-chip-all"}
                  label={chip.label}
                  selected={selectedCategory === chip.id}
                  onPress={() => selectCategory(chip.id)}
                  height={38}
                  fontSize={12.5}
                  paddingHorizontal={16}
                  icon={chip.premium ? <LockIcon size={11} color={colors.muted} /> : undefined}
                />
              ))}
            </FadingChipRow>
          </View>

          {/* Second tier only appears once a top-level category is chosen —
              progressive disclosure instead of dumping every subcategory
              into the first row a drowsy user sees. This is the only
              animated element in the interaction — the tapped chip's own
              color swap and the content area below both update in the same
              frame, so nothing else has to wait on this row's fade. No
              `layout` prop: this row's own size never changes while
              mounted (switching Calming ↔ Music only changes scrollable
              content, not the row's box), so entering/exiting are the only
              transitions that do anything — one fewer moving part. Enter
              is a touch slower (settling in) than exit (always snappier,
              since the user is already moving on) — same asymmetry Sonner
              uses for toasts. */}
          {selectedCategory ? (
            <AnimatedView
              entering={FadeIn.duration(180).easing(EASE_OUT)}
              exiting={FadeOut.duration(120).easing(EASE_OUT)}
              style={{ marginHorizontal: -20 }}
            >
              <FadingChipRow>
                {subChips.map((chip) => (
                  <SelectChip
                    key={chip.id ?? "all"}
                    testID={chip.id ? `subcategory-chip-${chip.id}` : "subcategory-chip-all"}
                    label={chip.label}
                    selected={selectedSubcategory === chip.id}
                    onPress={() => setSelectedSubcategory(chip.id)}
                    height={34}
                    fontSize={12}
                    paddingHorizontal={14}
                    icon={chip.premium ? <LockIcon size={10} color={colors.muted} /> : undefined}
                  />
                ))}
              </FadingChipRow>
            </AnimatedView>
          ) : null}
        </View>

        {/* No layout animation here on purpose: animating this view's
            reposition made it a second, independently-measured Animated
            component reacting to the row above — which is what read as
            "layout moves, then the chip catches up" instead of one motion.
            It reflows in the same frame as the selection state change now;
            the sub-category row above is the only thing that visibly
            animates. */}
        <View style={{ flex: 1 }}>
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
        ) : categoryUnavailable ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 }}>
            <MusicIcon size={30} color={colors.faint} strokeWidth={1.5} />
            <Text className="font-bold" style={{ fontSize: 16, color: colors.text, textAlign: "center" }}>
              {t("categoryUnavailableTitle")}
            </Text>
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={{ fontSize: 13, color: colors.notice, textAlign: "center", lineHeight: 19 }}
            >
              {t("categoryUnavailableBody", {
                category: selectedSubcategory ? subcategoryLabel(tCatalog, selectedSubcategory) : "",
              })}
            </Text>
          </View>
        ) : freeFilterUnavailable ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 }}>
            <MusicIcon size={30} color={colors.faint} strokeWidth={1.5} />
            <Text className="font-bold" style={{ fontSize: 16, color: colors.text, textAlign: "center" }}>
              {t("freeFilterEmptyTitle")}
            </Text>
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              style={{ fontSize: 13, color: colors.notice, textAlign: "center", lineHeight: 19 }}
            >
              {selectedSubcategory
                ? t("freeFilterEmptyBody", { category: subcategoryLabel(tCatalog, selectedSubcategory) })
                : t("freeFilterEmptyBodyAll")}
            </Text>
            <View style={{ marginTop: 4 }}>
              <Button label={t("clearFilterCta")} variant="outline" onPress={resetFilters} />
            </View>
          </View>
        ) : sections.length === 0 && isSearching ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 }}>
            <SearchIcon size={30} color={colors.faint} strokeWidth={1.5} />
            <Text className="font-bold" style={{ fontSize: 16, color: colors.text, textAlign: "center" }}>
              {t("searchEmptyTitle")}
            </Text>
            <Text numberOfLines={3} style={{ fontSize: 13, color: colors.muted, textAlign: "center", lineHeight: 19 }}>
              {t("searchEmptyBody", { query: trimmedQuery })}
            </Text>
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
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
            // Only shown once a filter narrows the list — with nothing
            // filtered, the count is just "the whole catalog" and adds
            // nothing worth reading.
            ListHeaderComponent={
              isFiltered ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={{ fontSize: 11, color: colors.faint, paddingBottom: 10 }}
                >
                  {t("soundCount", { count: resultCount })}
                </Text>
              ) : null
            }
            // A single selected chip already names the one section shown —
            // repeating it as a section header directly under the search/chip
            // row read as two nested levels saying the same word. Headers
            // only earn their keep in the unfiltered, multi-section view.
            renderSectionHeader={
              selectedSubcategory
                ? undefined
                : ({ section }) => (
                    <TrackSectionHeader category={section.category} subcategory={section.subcategory} language={i18n.language} />
                  )
            }
            renderItem={({ item }) => (
              <View style={{ marginBottom: 8 }}>
                <TrackRow track={item} premiumLabel={t("premiumBadge")} onPress={() => openTrack(item)} />
              </View>
            )}
          />
        )}
        </View>
      </View>
    </GlowBackground>
  );
}
