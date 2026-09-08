import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import DatePicker from "react-native-date-picker";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { useMarkOnboardingStep, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";
import { useFunnelPadding } from "../../src/lib/onboarding/useFunnelPadding";

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
  useMarkOnboardingStep(4);
  const funnelPad = useFunnelPadding({ hasStageHeader: true });

  // Keep the wheel in sync with the store when it changes underneath us
  // (e.g. answers hydrated from storage after this screen mounted).
  useEffect(() => {
    setValue((prev) => (prev.getHours() === bedtimeHour && prev.getMinutes() === bedtimeMinute ? prev : dateFrom(bedtimeHour, bedtimeMinute)));
  }, [bedtimeHour, bedtimeMinute]);

  return (
    <View style={{ flex: 1, ...funnelPad, justifyContent: "space-between" }}>
      <View style={{ gap: 22 }}>
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
    </View>
  );
}
