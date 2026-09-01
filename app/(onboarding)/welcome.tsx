import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground, MoonRingOuter, MoonRingInner } from "../../src/components/GlowBackground";
import { StarField } from "../../src/components/StarField";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { MoonIcon } from "../../src/components/icons";
import { useUserStore } from "../../src/store/useUserStore";
import { onboardingResumePath, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";
import { useFunnelPadding } from "../../src/lib/onboarding/useFunnelPadding";

export default function OnboardingWelcomeScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const funnelPad = useFunnelPadding();

  const hydrated = useOnboardingAnswers((s) => s.hydrated);
  const furthestStep = useOnboardingAnswers((s) => s.furthestStep);
  const resetOnboarding = useOnboardingAnswers((s) => s.reset);
  const setOnboardingCompleted = useUserStore((s) => s.setOnboardingCompleted);
  const canResume = hydrated && furthestStep >= 1;

  function begin() {
    router.push(canResume ? onboardingResumePath(furthestStep) : "/(onboarding)/frequency");
  }

  function startOver() {
    resetOnboarding();
    router.push("/(onboarding)/frequency");
  }

  function haveAccount() {
    // They're a returning user, not a new one — don't funnel them again on
    // the next launch.
    setOnboardingCompleted(true);
    router.push("/(auth)");
  }

  return (
    <GlowBackground
      variant="nightScene"
      washes={[{ origin: { x: 50, y: 32 }, color: colors.glow, extent: 54 }]}
      style={{ flex: 1, ...funnelPad, justifyContent: "space-between" }}
    >
      <StarField width={390} height={260} />

      <View style={{ alignItems: "center" }}>
        <Text className="font-lora-italic" style={{ fontSize: 26, color: colors.accent }}>
          Pulvio
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
      </View>

      <View style={{ gap: 4 }}>
        <Text style={{ textAlign: "center", fontSize: 12, color: colors.faint, marginBottom: 8 }}>
          {canResume ? t("welcomeResumeHint") : t("welcomeSetupHint")}
        </Text>
        <OnboardingCta label={canResume ? t("resumeCta") : t("getStartedCta")} onPress={begin} />
        {canResume ? (
          <Pressable onPress={startOver} style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }} accessibilityRole="button">
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>{t("startOverCta")}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={haveAccount} style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }} accessibilityRole="button">
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted }}>{t("haveAccountCta")}</Text>
        </Pressable>
      </View>
    </GlowBackground>
  );
}
