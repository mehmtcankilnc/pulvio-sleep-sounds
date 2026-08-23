import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { OnboardingHeader } from "../../src/components/OnboardingHeader";
import { Toggle } from "../../src/components/ui/Toggle";
import { BellIcon } from "../../src/components/icons";

// Wheel-picker look only — no scroll-picker interaction and no persistence
// yet. See docs/DRIFT_IMPLEMENTATION_PLAN.md.
export default function OnboardingBedtimeScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const [reminderOn, setReminderOn] = useState(true);

  return (
    <GlowBackground variant="pageWash" style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 26, justifyContent: "space-between" }}>
      <View style={{ gap: 22 }}>
        <OnboardingHeader step={3} totalSteps={3} onBack={() => router.back()} onSkip={() => router.push("/(onboarding)/plan-ready")} skipLabel={t("skip")} />
        <View style={{ gap: 6 }}>
          <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
            {t("bedtimeEyebrow")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 23, letterSpacing: -0.2, color: colors.text }}>
            {t("bedtimeQuestion")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{t("bedtimeSubtitle")}</Text>
        </View>

        <View style={{ alignItems: "center", gap: 2, paddingVertical: 26 }}>
          <Text style={{ fontSize: 21, fontWeight: "600", color: colors.faint, opacity: 0.55 }}>23:00</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 34, height: 1, backgroundColor: colors.stroke }} />
            <Text className="font-bold" style={{ fontSize: 46, letterSpacing: -0.2, color: colors.text }}>
              23:30
            </Text>
            <View style={{ width: 34, height: 1, backgroundColor: colors.stroke }} />
          </View>
          <Text style={{ fontSize: 21, fontWeight: "600", color: colors.faint, opacity: 0.55 }}>00:00</Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 2 }}>
            <BellIcon size={20} color={colors.accent} strokeWidth={1.6} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{t("reminderRowTitle")}</Text>
              <Text style={{ fontSize: 11.5, color: colors.faint }}>{t("reminderRowSubtitle", { time: "23:15" })}</Text>
            </View>
            <Toggle value={reminderOn} onValueChange={() => setReminderOn((v) => !v)} accessibilityLabel={t("reminderRowTitle")} />
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => router.push("/(onboarding)/plan-ready")}
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
