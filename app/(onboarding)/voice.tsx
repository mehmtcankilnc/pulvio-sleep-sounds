import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { VOICE_KEYS, useMarkOnboardingStep, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";
import { useFunnelPadding } from "../../src/lib/onboarding/useFunnelPadding";

export default function OnboardingVoiceScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const voice = useOnboardingAnswers((s) => s.voice);
  const setVoice = useOnboardingAnswers((s) => s.setVoice);
  useMarkOnboardingStep(4);
  const funnelPad = useFunnelPadding({ hasStageHeader: true });

  return (
    <View style={{ flex: 1, ...funnelPad, justifyContent: "space-between" }}>
      <View style={{ gap: 22 }}>
        <View style={{ gap: 6 }}>
          <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
            {t("voiceEyebrow")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 23, letterSpacing: -0.2, color: colors.text }}>
            {t("voiceTitle")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{t("voiceSubtitle")}</Text>
        </View>
        <View style={{ gap: 10 }}>
          {VOICE_KEYS.map((key) => {
            const active = voice === key;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setVoice(key);
                }}
                style={{
                  borderRadius: 16,
                  padding: 15,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 60,
                  backgroundColor: active ? colors.glowSoft : colors.card,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.stroke,
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{t(`voice_${key}`)}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{t(`voice_${key}_hint`)}</Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
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
        disabled={voice === null}
        onPress={() => router.push("/(onboarding)/bedtime")}
      />
    </View>
  );
}
