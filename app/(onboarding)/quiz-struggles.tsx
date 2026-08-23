import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { OnboardingHeader } from "../../src/components/OnboardingHeader";
import { CheckIcon } from "../../src/components/icons";

const STRUGGLE_KEYS = ["racingThoughts", "stressTension", "noiseAround", "irregularSchedule", "wakingAtNight"] as const;

export default function QuizStrugglesScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const [selected, setSelected] = useState<Set<string>>(new Set(["racingThoughts", "noiseAround"]));

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
      washes={[{ origin: { x: 88, y: -6 }, color: colors.glow, extent: 44 }]}
      style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 26, justifyContent: "space-between" }}
    >
      <View style={{ gap: 22 }}>
        <OnboardingHeader step={1} totalSteps={3} onBack={() => router.back()} onSkip={() => router.push("/(onboarding)/quiz-sounds")} skipLabel={t("skip")} />
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
            const active = selected.has(key);
            return (
              <Pressable
                key={key}
                onPress={() => toggle(key)}
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

      <Pressable
        onPress={() => router.push("/(onboarding)/quiz-sounds")}
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
