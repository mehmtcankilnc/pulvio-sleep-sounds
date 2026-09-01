import type { JSX } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { CheckIcon, CloudRainIcon, FlameIcon, MicIcon, MusicIcon, WavesIcon, WindIcon } from "../../src/components/icons";
import type { IconProps } from "../../src/components/icons";
import { SOUND_KEYS, useMarkOnboardingStep, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";
import { useFunnelPadding } from "../../src/lib/onboarding/useFunnelPadding";

const SOUND_ICONS: Record<(typeof SOUND_KEYS)[number], (props: IconProps) => JSX.Element> = {
  rainThunder: CloudRainIcon,
  oceanWaves: WavesIcon,
  whiteNoise: WindIcon,
  asmr: MicIcon,
  pianoAmbient: MusicIcon,
  fireplace: FlameIcon,
};

export default function QuizSoundsScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const sounds = useOnboardingAnswers((s) => s.sounds);
  const toggleSound = useOnboardingAnswers((s) => s.toggleSound);
  useMarkOnboardingStep(3);
  const funnelPad = useFunnelPadding({ hasStageHeader: true });

  return (
    <View style={{ flex: 1, ...funnelPad, justifyContent: "space-between" }}>
      <View style={{ gap: 22 }}>
        <View style={{ gap: 6 }}>
          <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
            {t("soundsEyebrow")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 23, letterSpacing: -0.2, color: colors.text }}>
            {t("soundsTitle")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{t("soundsSubtitle")}</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 11 }}>
          {SOUND_KEYS.map((key) => {
            const Icon = SOUND_ICONS[key];
            const active = sounds.includes(key);
            return (
              <Pressable
                key={key}
                onPress={() => {
                  Haptics.selectionAsync();
                  toggleSound(key);
                }}
                style={{
                  width: "47.5%",
                  borderRadius: 18,
                  padding: 14,
                  gap: 10,
                  minHeight: 96,
                  justifyContent: "center",
                  backgroundColor: active ? colors.glowSoft : colors.card,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.stroke,
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
              >
                <Icon size={22} color={colors.accent} strokeWidth={1.6} />
                <Text style={{ fontSize: 13.5, fontWeight: "600", color: colors.text }}>{t(`sound_${key}`)}</Text>
                {active && (
                  <View style={{ position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: 999, backgroundColor: colors.button, alignItems: "center", justifyContent: "center" }}>
                    <CheckIcon size={14} color={colors.buttonText} strokeWidth={2.2} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <OnboardingCta
        label={t("continueCta")}
        disabled={sounds.length === 0}
        onPress={() => router.push("/(onboarding)/voice")}
      />
    </View>
  );
}
