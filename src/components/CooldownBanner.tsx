import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useUserStore } from "../store/useUserStore";
import { useCooldownCountdown } from "../hooks/useCooldownCountdown";
import { useThemeColors } from "../hooks/useThemeColors";
import { ChevronRightIcon } from "./icons";

// Persistent free-tier notice pinned above the main tabs while a free user is
// in the post-limit cooldown. The player screen has its own full WindDownScreen
// for this state; this is the ambient reminder everywhere else, so a user who
// navigated away from the player still sees why playback stopped, how long is
// left, and the one way out. Renders nothing for premium users or when no
// cooldown is active — `useCooldownCountdown` also self-clears the store the
// second the target time passes, so the bar disappears on its own.
export function CooldownBanner() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation("player");
  const isFree = useUserStore((state) => state.subscriptionStatus !== "premium");
  const label = useCooldownCountdown();

  if (!isFree || !label) return null;

  return (
    <Pressable
      onPress={() => router.push("/paywall?resume=1")}
      accessibilityRole="button"
      accessibilityLabel={`${t("cooldownBannerTitle")}. ${t("limitCountdown", { time: label })}. ${t("common:goPremium")}`}
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 10,
        paddingHorizontal: 16,
        backgroundColor: colors.glowSoft,
        borderBottomWidth: 1,
        borderBottomColor: colors.stroke,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.text }}>
          {t("cooldownBannerTitle")}
        </Text>
        <Text style={{ fontSize: 11.5, color: colors.muted, fontVariant: ["tabular-nums"] }}>
          {t("limitCountdown", { time: label })}
        </Text>
      </View>
      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>
        {t("common:premiumLabel")}
      </Text>
      <ChevronRightIcon size={15} color={colors.accent} strokeWidth={1.8} />
    </Pressable>
  );
}
