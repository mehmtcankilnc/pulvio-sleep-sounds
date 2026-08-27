import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { OnboardingHeader } from "../../src/components/OnboardingHeader";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { FREQUENCY_KEYS, useMarkOnboardingStep, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";

export default function OnboardingFrequencyScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const frequency = useOnboardingAnswers((s) => s.frequency);
  const setFrequency = useOnboardingAnswers((s) => s.setFrequency);
  useMarkOnboardingStep(1);

  return (
    <GlowBackground
      variant="pageWash"
      washes={[{ origin: { x: 12, y: -6 }, color: colors.glow, extent: 44 }]}
      style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 26, justifyContent: "space-between" }}
    >
      <View style={{ gap: 22 }}>
        <OnboardingHeader
          step={1}
          totalSteps={6}
          answered={frequency !== null}
          onBack={() => router.back()}
          backLabel={t("back")}
          onSkip={() => router.push("/(onboarding)/plan-ready")}
          skipLabel={t("skip")}
        />
        <View style={{ gap: 6 }}>
          <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
            {t("frequencyEyebrow")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 23, letterSpacing: -0.2, color: colors.text }}>
            {t("frequencyTitle")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{t("frequencySubtitle")}</Text>
        </View>
        <View style={{ gap: 10 }}>
          {FREQUENCY_KEYS.map((key) => {
            const active = frequency === key;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFrequency(key);
                }}
                style={{
                  borderRadius: 16,
                  padding: 15,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 54,
                  backgroundColor: active ? colors.glowSoft : colors.card,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.stroke,
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text }}>{t(`frequency_${key}`)}</Text>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: active ? 6 : 1.5,
                    borderColor: active ? colors.button : colors.stroke,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <OnboardingCta
        label={t("continueCta")}
        disabled={frequency === null}
        onPress={() => router.push("/(onboarding)/quiz-struggles")}
      />
    </GlowBackground>
  );
}
