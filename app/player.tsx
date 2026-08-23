import { useEffect, useState } from "react";
import { View, Text, Pressable, AccessibilityInfo } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "../src/store/usePlayerStore";
import { useUserStore } from "../src/store/useUserStore";
import { usePlayerActions } from "../src/hooks/usePlayerActions";
import { useCooldownCountdown } from "../src/hooks/useCooldownCountdown";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { categoryIcon } from "../src/lib/categoryIcon";
import { GlowBackground, MoonRingOuter, MoonRingInner } from "../src/components/GlowBackground";
import { StarField } from "../src/components/StarField";
import { Button } from "../src/components/ui/Button";
import { ChevronDownIcon, HeartIcon, PauseIcon, PlayIcon, PlusIcon, SkipBackIcon, SkipFwdIcon } from "../src/components/icons";

const TIMER_OPTIONS = ["15m", "30m", "45m", "∞"] as const;

export default function PlayerScreen() {
  const { t } = useTranslation("player");
  const router = useRouter();
  const colors = useThemeColors();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const error = usePlayerStore((state) => state.error);
  const denyReason = usePlayerStore((state) => state.denyReason);
  const cooldownEndsAt = useUserStore((state) => state.cooldownEndsAt);
  const countdownLabel = useCooldownCountdown();
  const { togglePlayPause } = usePlayerActions();
  const [selectedTimer, setSelectedTimer] = useState<(typeof TIMER_OPTIONS)[number]>("45m");
  const [liked, setLiked] = useState(false);

  const breathe = useSharedValue(1);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.045, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    });
  }, [breathe]);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  if (cooldownEndsAt) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bg }}>
        <Text className="text-lg font-bold text-center mb-2" style={{ color: colors.text }}>
          {t("limitTitle")}
        </Text>
        <Text className="text-center mb-4" style={{ color: colors.muted }}>
          {t("limitRemaining")}
        </Text>
        <Text className="text-3xl font-bold mb-8" style={{ color: colors.text }}>
          {countdownLabel ?? "…"}
        </Text>
        <Button label={t("limitCta")} onPress={() => router.push("/paywall")} />
      </View>
    );
  }

  if (denyReason === "premium_only") {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bg }}>
        <Text className="text-lg font-bold text-center mb-2" style={{ color: colors.text }}>
          {t("premiumOnlyTitle")}
        </Text>
        <Text className="text-center mb-8" style={{ color: colors.muted }}>
          {t("premiumOnlySubtitle")}
        </Text>
        <Button label={t("common:goPremium")} onPress={() => router.push("/paywall")} />
      </View>
    );
  }

  if (!currentTrack) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bg }}>
        <Text style={{ color: colors.text, fontSize: 18 }}>{t("noTrack")}</Text>
        {error && <Text className="text-center mt-4" style={{ color: "#ef4444" }}>{error}</Text>}
      </View>
    );
  }

  const CategoryIcon = categoryIcon(currentTrack.category, currentTrack.subcategory);

  return (
    <GlowBackground variant="nightScene" style={{ flex: 1, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 30, justifyContent: "space-between" }}>
      <StarField />

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, alignItems: "center", justifyContent: "center" }}
          accessibilityRole="button"
          accessibilityLabel={t("common:close")}
        >
          <ChevronDownIcon size={20} color={colors.muted} strokeWidth={1.7} />
        </Pressable>
        <Text style={{ fontSize: 10.5, fontWeight: "700", letterSpacing: 1.7, color: colors.muted }}>{t("nowPlayingOverline")}</Text>
        <Pressable
          onPress={() => setLiked((v) => !v)}
          style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, alignItems: "center", justifyContent: "center" }}
          accessibilityRole="button"
          accessibilityLabel={t("likeAccessibilityLabel")}
        >
          <HeartIcon size={19} color={liked ? colors.accent : colors.muted} strokeWidth={1.7} />
        </Pressable>
      </View>

      <View style={{ alignItems: "center", gap: 26 }}>
        <Animated.View style={ringStyle}>
          <MoonRingOuter style={{ width: 228, height: 228 }}>
            <MoonRingInner style={{ width: 158, height: 158 }}>
              <CategoryIcon size={54} color={colors.moon} strokeWidth={1.3} />
            </MoonRingInner>
          </MoonRingOuter>
        </Animated.View>
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.8, color: colors.accent }}>
            {currentTrack.category.toUpperCase()}
          </Text>
          <Text className="font-bold" style={{ fontSize: 24, letterSpacing: -0.2, color: colors.text }}>
            {currentTrack.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{currentTrack.subcategory}</Text>
        </View>
      </View>

      <View style={{ alignItems: "center", gap: 9 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
          {TIMER_OPTIONS.map((option) => {
            const active = option === selectedTimer;
            return (
              <Pressable
                key={option}
                onPress={() => setSelectedTimer(option)}
                style={{
                  height: 44,
                  paddingHorizontal: 18,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? colors.button : "transparent",
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.stroke,
                }}
                accessibilityRole="button"
                accessibilityLabel={t("timerAccessibilityLabel", { option })}
              >
                <Text style={{ fontSize: 13.5, fontWeight: active ? "700" : "600", color: active ? colors.buttonText : colors.muted }}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ fontSize: 11.5, color: colors.faint }}>{t("timerFadeHint")}</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 30 }}>
        <View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
          <SkipBackIcon size={24} color={colors.muted} strokeWidth={1.5} />
        </View>
        <Pressable
          onPress={togglePlayPause}
          style={{
            width: 76,
            height: 76,
            borderRadius: 999,
            backgroundColor: colors.button,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.glow,
            shadowOpacity: 1,
            shadowRadius: 34,
            shadowOffset: { width: 0, height: 12 },
            elevation: 10,
          }}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? t("pauseAccessibilityLabel") : t("playAccessibilityLabel")}
        >
          {isBuffering ? (
            <Text style={{ color: colors.buttonText }}>…</Text>
          ) : isPlaying ? (
            <PauseIcon size={28} color={colors.buttonText} />
          ) : (
            <PlayIcon size={26} color={colors.buttonText} />
          )}
        </Pressable>
        <View style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}>
          <SkipFwdIcon size={24} color={colors.muted} strokeWidth={1.5} />
        </View>
      </View>

      {error && <Text style={{ textAlign: "center", color: "#ef4444" }}>{error}</Text>}

      <View style={{ alignItems: "center" }}>
        <Pressable
          onPress={() => router.push("/(tabs)/mixer")}
          style={{
            height: 46,
            paddingHorizontal: 22,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.stroke,
            backgroundColor: colors.glowSoft,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
          accessibilityRole="button"
        >
          <PlusIcon size={15} color={colors.accent} strokeWidth={2} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>{t("addLayerCta")}</Text>
        </Pressable>
      </View>
    </GlowBackground>
  );
}
