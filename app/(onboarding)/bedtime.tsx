import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import DatePicker from "react-native-date-picker";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { OnboardingHeader } from "../../src/components/OnboardingHeader";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { useMarkOnboardingStep, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";

function dateFrom(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export default function OnboardingBedtimeScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const { bedtimeHour, bedtimeMinute, setBedtime } = useOnboardingAnswers();
  const [value, setValue] = useState(() => dateFrom(bedtimeHour, bedtimeMinute));
  useMarkOnboardingStep(5);

  // Keep the wheel in sync with the store when it changes underneath us
  // (e.g. answers hydrated from storage after this screen mounted).
  useEffect(() => {
    setValue((prev) => (prev.getHours() === bedtimeHour && prev.getMinutes() === bedtimeMinute ? prev : dateFrom(bedtimeHour, bedtimeMinute)));
  }, [bedtimeHour, bedtimeMinute]);

  return (
    <GlowBackground
      variant="pageWash"
      washes={[{ origin: { x: 8, y: 92 }, color: colors.glow, extent: 44 }]}
      style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 26, justifyContent: "space-between" }}
    >
      <View style={{ gap: 22 }}>
        <OnboardingHeader
          step={5}
          totalSteps={6}
          answered
          onBack={() => router.back()}
          backLabel={t("back")}
          onSkip={() => router.push("/(onboarding)/plan-ready")}
          skipLabel={t("skip")}
        />
        <View style={{ gap: 6 }}>
          <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
            {t("bedtimeEyebrow")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 23, letterSpacing: -0.2, color: colors.text }}>
            {t("bedtimeQuestion")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{t("bedtimeSubtitle")}</Text>
        </View>

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 20, alignItems: "center", paddingVertical: 6 }}>
          <DatePicker
            date={value}
            mode="time"
            theme="dark"
            dividerColor={colors.stroke}
            onDateChange={(d) => {
              setValue(d);
              setBedtime(d.getHours(), d.getMinutes());
            }}
          />
        </View>
      </View>

      <OnboardingCta label={t("continueCta")} onPress={() => router.push("/(onboarding)/reminder")} />
    </GlowBackground>
  );
}
