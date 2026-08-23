import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { usePlayerStore } from "../store/usePlayerStore";
import { usePlayerActions } from "../hooks/usePlayerActions";
import { useThemeColors } from "../hooks/useThemeColors";
import { categoryIcon } from "../lib/categoryIcon";
import { GlowBackground } from "./GlowBackground";
import { PauseIcon, PlayIcon, XIcon, CompassIcon, SlidersIcon, MoonIcon, UserIcon } from "./icons";
import type { IconProps } from "./icons";

const TAB_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  index: CompassIcon,
  mixer: SlidersIcon,
  sleep: MoonIcon,
  profile: UserIcon,
};

// Drift "the dock" (DESIGN.md §7): one floating card stacking the mini
// player, a progress line, a hairline, and the 4-tab nav row. Collapses to
// nav-only when no track is loaded (screen 6, "Explore idle").
export function Dock({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation("player");
  const router = useRouter();
  const colors = useThemeColors();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const elapsedSeconds = usePlayerStore((s) => s.elapsedSeconds);
  const durationSeconds = usePlayerStore((s) => s.durationSeconds);
  const { togglePlayPause, stopAndReset } = usePlayerActions();

  const progressRatio = durationSeconds > 0 ? Math.min(elapsedSeconds / durationSeconds, 1) : 0;
  const ArtworkIcon = currentTrack ? categoryIcon(currentTrack.category, currentTrack.subcategory) : MoonIcon;

  return (
    <View
      style={{
        margin: 8,
        marginBottom: 16,
        borderRadius: 24,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.stroke,
        overflow: "hidden",
      }}
    >
      {currentTrack && (
        <>
          <Pressable
            onPress={() => router.push("/player")}
            style={{ flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t("nowPlayingAccessibilityLabel", { title: currentTrack.title })}
          >
            <GlowBackground
              variant="artworkTile"
              style={{ width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" }}
            >
              <ArtworkIcon size={20} color={colors.accent} strokeWidth={1.5} />
            </GlowBackground>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
                {currentTrack.title}
              </Text>
              <Text numberOfLines={1} style={{ fontSize: 11, color: colors.muted }}>
                {currentTrack.category}
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
          <View style={{ paddingHorizontal: 12, paddingBottom: 9 }}>
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
        </>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 6, paddingHorizontal: 10 }}>
        {state.routes.map((route, index) => {
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
  );
}
