import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { CheckIcon } from "../../src/components/icons";
import { STRUGGLE_KEYS, useMarkOnboardingStep, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";
import { useFunnelPadding } from "../../src/lib/onboarding/useFunnelPadding";

export default function QuizStrugglesScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const struggles = useOnboardingAnswers((s) => s.struggles);
  const toggleStruggle = useOnboardingAnswers((s) => s.toggleStruggle);
  useMarkOnboardingStep(2);
  const funnelPad = useFunnelPadding({ hasStageHeader: true });

  return (
    <View style={{ flex: 1, ...funnelPad, justifyContent: "space-between" }}>
      <View style={{ gap: 22 }}>
        <View style={{ gap: 6 }}>
          <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
            {t("struggleEyebrow")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 23, letterSpacing: -0.2, color: colors.text }}>
            {t("struggleTitle")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{t("chooseAllHint")}</Text>
        </View>
        <View style={{ gap: 10 }}>
          {STRUGGLE_KEYS.map((key) => {
            const active = struggles.includes(key);
            return (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.selectionAsync();
                  toggleStruggle(key);
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
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
              >
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text }}>{t(`struggle_${key}`)}</Text>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? colors.button : "transparent",
                    borderWidth: active ? 0 : 1.5,
                    borderColor: colors.stroke,
                  }}
                >
                  {active && <CheckIcon size={14} color={colors.buttonText} strokeWidth={2.2} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <OnboardingCta
        label={t("continueCta")}
        disabled={struggles.length === 0}
        onPress={() => router.push("/(onboarding)/quiz-sounds")}
      />
    </View>
  );
}
