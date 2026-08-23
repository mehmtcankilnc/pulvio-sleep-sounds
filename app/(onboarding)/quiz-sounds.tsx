import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { OnboardingHeader } from "../../src/components/OnboardingHeader";
import { CheckIcon, CloudRainIcon, FlameIcon, MicIcon, MusicIcon, WavesIcon, WindIcon } from "../../src/components/icons";
import type { IconProps } from "../../src/components/icons";

const SOUND_OPTIONS: Array<{ key: string; icon: (props: IconProps) => JSX.Element }> = [
  { key: "rainThunder", icon: CloudRainIcon },
  { key: "oceanWaves", icon: WavesIcon },
  { key: "whiteNoise", icon: WindIcon },
  { key: "asmr", icon: MicIcon },
  { key: "pianoAmbient", icon: MusicIcon },
  { key: "fireplace", icon: FlameIcon },
];

export default function QuizSoundsScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const [selected, setSelected] = useState<Set<string>>(new Set(["rainThunder", "pianoAmbient"]));

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <GlowBackground
      variant="pageWash"
      washes={[{ origin: { x: -10, y: 20 }, color: colors.glow, extent: 44 }]}
      style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 26, justifyContent: "space-between" }}
    >
      <View style={{ gap: 22 }}>
        <OnboardingHeader step={2} totalSteps={3} onBack={() => router.back()} onSkip={() => router.push("/(onboarding)/bedtime")} skipLabel={t("skip")} />
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
          {SOUND_OPTIONS.map(({ key, icon: Icon }) => {
            const active = selected.has(key);
            return (
              <Pressable
                key={key}
                onPress={() => toggle(key)}
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

      <Pressable
        onPress={() => router.push("/(onboarding)/bedtime")}
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
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.buttonText }}>{t("continueCta")}</Text>
      </Pressable>
    </GlowBackground>
  );
}
