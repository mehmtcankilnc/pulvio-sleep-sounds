import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../hooks/useThemeColors";
import { useUserStore } from "../store/useUserStore";
import { usePressScale } from "../hooks/usePressScale";
import Animated from "react-native-reanimated";
import { ChevronRightIcon, SparklesIcon } from "./icons";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Header-corner status: a badge of honor for a subscriber, a standing upsell
// entry point for everyone else — the screens that show it (Explore, Sleep)
// are the ones a free user opens every day, so it's a cheap, ambient
// reminder rather than a one-off paywall interruption.
//
// The two states used to share one visual family and, worse, the exact same
// label ("Premium" either way, told apart only by a trailing chevron) — a
// subscriber and a free user saw the same badge. Now they're deliberately
// asymmetric: premium is solid `button` fill (the app's one "you've arrived"
// color, earned rather than asked-for, so a moment of shine here doesn't
// read as an ad the way it would on a tappable row) with no chevron — it's
// a status, not a control. Free stays the quieter accent-outline pill from
// before (so it still doesn't clash with the header's quiet editorial
// tone), but now actually says "go premium" rather than just "Premium".
export function PremiumBadge() {
  const { t } = useTranslation("common");
  const colors = useThemeColors();
  const router = useRouter();
  const press = usePressScale(0.95);
  const isPremium = useUserStore((state) => state.subscriptionStatus === "premium");

  if (isPremium) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          height: 27,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: colors.button,
        }}
      >
        <SparklesIcon size={11} color={colors.buttonText} />
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.buttonText }}>{t("premiumLabel")}</Text>
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={() => router.push("/paywall")}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={t("goPremium")}
      hitSlop={8}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          height: 27,
          paddingHorizontal: 9,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.accent,
          backgroundColor: colors.glowSoft,
        },
        press.animatedStyle,
      ]}
    >
      <SparklesIcon size={11} color={colors.accent} />
      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}>{t("goPremium")}</Text>
      <ChevronRightIcon size={11} color={colors.accent} strokeWidth={2} />
    </AnimatedPressable>
  );
}
