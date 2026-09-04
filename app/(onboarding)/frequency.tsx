import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { FREQUENCY_KEYS, useMarkOnboardingStep, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";
import { useFunnelPadding } from "../../src/lib/onboarding/useFunnelPadding";

export default function OnboardingFrequencyScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const frequency = useOnboardingAnswers((s) => s.frequency);
  const setFrequency = useOnboardingAnswers((s) => s.setFrequency);
  useMarkOnboardingStep(1);
  const funnelPad = useFunnelPadding({ hasStageHeader: true });

  // No background of its own — the layout (app/(onboarding)/_layout.tsx)
  // already renders one continuous `pageWash` behind the header and every
  // step, welcome's distinct `nightScene` included, so it's already sitting
  // there the moment welcome unmounts. A second copy here (there used to be
  // one) is an independently-measured GlowBackground instance layered over
  // the first — the two don't register pixel-for-pixel, which showed up as
  // a visible seam right where the shared header sits, only on this step.
  return (
    <View style={{ flex: 1, ...funnelPad, justifyContent: "space-between" }}>
      <View style={{ gap: 22 }}>
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
    </View>
  );
}
