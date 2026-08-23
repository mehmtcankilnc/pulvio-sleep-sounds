import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground, MoonRingOuter, MoonRingInner } from "../../src/components/GlowBackground";
import { StarField } from "../../src/components/StarField";
import { MoonIcon, StarIcon } from "../../src/components/icons";

export default function OnboardingWelcomeScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <GlowBackground
      variant="nightScene"
      washes={[{ origin: { x: 50, y: 32 }, color: colors.glow, extent: 54 }]}
      style={{ flex: 1, paddingHorizontal: 24, paddingTop: 38, paddingBottom: 30, justifyContent: "space-between" }}
    >
      <StarField width={390} height={260} />

      <View style={{ alignItems: "center" }}>
        <Text className="font-lora-italic" style={{ fontSize: 26, color: colors.accent }}>
          Drift
        </Text>
      </View>

      <View style={{ alignItems: "center", gap: 24 }}>
        <MoonRingOuter style={{ width: 176, height: 176 }}>
          <MoonRingInner style={{ width: 120, height: 120 }}>
            <MoonIcon size={44} color={colors.moon} strokeWidth={1.3} />
          </MoonRingInner>
        </MoonRingOuter>
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text className="font-bold" style={{ fontSize: 27, letterSpacing: -0.2, color: colors.text, textAlign: "center", maxWidth: 300 }}>
            {t("welcomeTitle")}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 21, color: colors.muted, textAlign: "center", maxWidth: 290 }}>
            {t("welcomeSubtitle")}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row", gap: 3 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <StarIcon key={i} size={14} color={colors.accent} opacity={1} />
            ))}
          </View>
          <Text style={{ fontSize: 12.5, color: colors.muted }}>{t("ratingProof")}</Text>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <Pressable
          onPress={() => router.push("/(onboarding)/quiz-struggles")}
          style={{
            height: 54,
            borderRadius: 999,
            backgroundColor: colors.button,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.glow,
            shadowOpacity: 1,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 10 },
            elevation: 6,
          }}
          accessibilityRole="button"
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.buttonText }}>{t("getStartedCta")}</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(auth)")} style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }} accessibilityRole="button">
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>{t("haveAccountCta")}</Text>
        </Pressable>
      </View>
    </GlowBackground>
  );
}
