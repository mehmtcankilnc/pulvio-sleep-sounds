import { useEffect, useState } from "react";
import type { JSX } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { usePlayerStore } from "../store/usePlayerStore";
import { usePlayerActions } from "../hooks/usePlayerActions";
import { useThemeColors } from "../hooks/useThemeColors";
import { categoryIcon } from "../lib/categoryIcon";
import { GlowBackground } from "./GlowBackground";
import { PauseIcon, PlayIcon, XIcon, CompassIcon, MoonIcon, UserIcon } from "./icons";
import type { IconProps } from "./icons";
import type { Track } from "../types";

const TAB_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  index: CompassIcon,
  sleep: MoonIcon,
  profile: UserIcon,
};

// Measured, not estimated: row1 (paddingTop 10 + 44 artwork + paddingBottom 8)
// + row2 (paddingBottom 9 + 3 track) + row3 (1px hairline) = 75. Fixed
// paddings/icon sizes and numberOfLines={1} titles keep this constant
// regardless of track content, so it's safe to hardcode rather than measure.
const MINI_PLAYER_HEIGHT = 75;
// Tab row: paddingVertical 6+6 + each Pressable's own minHeight 48.
const TAB_ROW_HEIGHT = 60;

const ENTER_EXIT_EASING = Easing.bezier(0.23, 1, 0.32, 1); // strong ease-out, both directions
const ENTER_DURATION = 200;
const EXIT_DURATION = 160; // system's own response to a user action (stop/dismiss) snaps a beat faster than content arriving

// Bottom bar: a full-width native-style tab bar that stacks the mini
// player, a progress line, a hairline, and the 4-tab nav row. Collapses to
// nav-only when no track is loaded.
//
// At the time this was written, the project had `newArchEnabled: false`,
// and Reanimated's `entering`/`exiting` layout-animation system — built
// primarily around Fabric — showed up here as persistent sub-60fps motion
// no matter how the curve/duration was tuned. So this animates manually via
// a plain `useSharedValue` + `useAnimatedStyle` instead: just a per-frame
// opacity/transform style commit, with identical, fully-supported
// performance on both architectures.
//
// Since then the SDK 57 upgrade dropped the `newArchEnabled` key from
// app.json entirely, and Expo defaults SDK 57 to New Architecture on — the
// generated `android/gradle.properties` confirms `newArchEnabled=true`, so
// the app is actually running Fabric now. The original `entering`/`exiting`
// slowness this workaround was built for may no longer reproduce, but the
// manual approach costs nothing extra and stays correct either way, so it's
// left as-is rather than reverted on a guess.
//
// Both the mini player and the tab row are anchored to the container's
// BOTTOM edge with a fixed own-height (never `top: 0` of a box whose real
// height changes) — that's what makes their on-screen position completely
// independent of whatever the container's current real height happens to
// be. The tab row sits at `bottom: 0` and never animates at all. The mini
// player sits at `bottom: TAB_ROW_HEIGHT` (stacked directly above the tab
// row) and fades + scales in place (never `height`, which forces a Yoga
// re-layout of this node and its siblings every frame). Because its
// position doesn't depend on the container's box size, the box is free to
// resize instantly, in sync with `currentTrack` itself. The mini player's
// content mounts once per session (`displayTrack` is set but never cleared
// back to null) rather than being torn down and rebuilt on every play/stop —
// building its SVG-based artwork tile isn't free, and doing that on every
// cycle competed with the entrance animation. `pointerEvents` gates touch
// interaction instead of unmounting.
export function Dock({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation("player");
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const elapsedSeconds = usePlayerStore((s) => s.elapsedSeconds);
  const durationSeconds = usePlayerStore((s) => s.durationSeconds);
  const { togglePlayPause, stopAndReset } = usePlayerActions();

  // Set once, never cleared back to null: the mini player's native views
  // (GlowBackground's SVG artwork tile in particular) mount once per
  // session instead of being torn down and rebuilt on every play/stop
  // cycle — that mount/inflation cost was competing with the entrance
  // animation on every single track start. Visibility is driven entirely by
  // `progress`/`pointerEvents` below, never by mounting.
  const [displayTrack, setDisplayTrack] = useState<Track | null>(currentTrack);
  const progress = useSharedValue(currentTrack ? 1 : 0);

  useEffect(() => {
    if (currentTrack) setDisplayTrack(currentTrack);
    progress.value = withTiming(currentTrack ? 1 : 0, {
      duration: currentTrack ? ENTER_DURATION : EXIT_DURATION,
      easing: ENTER_EXIT_EASING,
    });
  }, [currentTrack, progress]);

  // Fade + a subtle scale (never scale(0) — 0.96..1) so the block reads as
  // one physical object arriving/leaving, not a flat opacity crossfade.
  const miniPlayerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.96 + progress.value * 0.04 }],
  }));

  const progressRatio = durationSeconds > 0 ? Math.min(elapsedSeconds / durationSeconds, 1) : 0;
  const ArtworkIcon = displayTrack ? categoryIcon(displayTrack.category, displayTrack.subcategory) : MoonIcon;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.stroke,
        paddingBottom: insets.bottom,
      }}
    >
      <View style={{ height: currentTrack ? MINI_PLAYER_HEIGHT + TAB_ROW_HEIGHT : TAB_ROW_HEIGHT }}>
        {displayTrack && (
          <Animated.View
            pointerEvents={currentTrack ? "auto" : "none"}
            style={[{ position: "absolute", bottom: TAB_ROW_HEIGHT, left: 0, right: 0, height: MINI_PLAYER_HEIGHT }, miniPlayerStyle]}
          >
            <Pressable
              onPress={() => router.push("/player")}
              style={{ flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t("nowPlayingAccessibilityLabel", { title: displayTrack.title })}
            >
              <GlowBackground
                variant="artworkTile"
                style={{ width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" }}
              >
                <ArtworkIcon size={20} color={colors.accent} strokeWidth={1.5} />
              </GlowBackground>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                  {displayTrack.title}
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 11, color: colors.muted }}>
                  {displayTrack.category}
                </Text>
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                hitSlop={8}
                style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: colors.button, alignItems: "center", justifyContent: "center" }}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? t("pauseAccessibilityLabel") : t("playAccessibilityLabel")}
              >
                {isBuffering ? (
                  <Text style={{ color: colors.buttonText }}>…</Text>
                ) : isPlaying ? (
                  <PauseIcon size={17} color={colors.buttonText} />
                ) : (
                  <PlayIcon size={15} color={colors.buttonText} />
                )}
              </Pressable>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  stopAndReset();
                }}
                hitSlop={8}
                style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
                accessibilityRole="button"
                accessibilityLabel={t("dismissAccessibilityLabel")}
              >
                <XIcon size={18} color={colors.muted} />
              </Pressable>
            </Pressable>
            <View style={{ paddingHorizontal: 16, paddingBottom: 9 }}>
              <View style={{ height: 3, borderRadius: 999, backgroundColor: colors.sliderTrack }}>
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${progressRatio * 100}%`,
                    borderRadius: 999,
                    backgroundColor: colors.button,
                  }}
                />
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: colors.stroke }} />
          </Animated.View>
        )}

        <View
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10 }}
        >
          {state.routes.map((route: (typeof state.routes)[number], index: number) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const Icon = TAB_ICONS[route.name];
            if (!Icon) return null;
            const label = typeof options.title === "string" ? options.title : route.name;
            const color = focused ? colors.accent : colors.faint;

            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={{ minWidth: 58, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 3 }}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={label}
              >
                <Icon size={21} color={color} strokeWidth={1.7} />
                <Text style={{ fontSize: 10, fontWeight: focused ? "700" : "500", color }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
