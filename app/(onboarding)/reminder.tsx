import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { BellIcon } from "../../src/components/icons";
import { formatBedtime, useMarkOnboardingStep, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";
import { useFunnelPadding } from "../../src/lib/onboarding/useFunnelPadding";

function reminderTime(hour: number, minute: number): string {
  let total = hour * 60 + minute - 15;
  if (total < 0) total += 24 * 60;
  return formatBedtime(Math.floor(total / 60) % 24, total % 60);
}

export default function OnboardingReminderScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  const { bedtimeHour, bedtimeMinute, reminderOn, setReminderOn } = useOnboardingAnswers();
  const nudgeAt = reminderTime(bedtimeHour, bedtimeMinute);
  useMarkOnboardingStep(6);
  const funnelPad = useFunnelPadding({ hasStageHeader: true });

  const OPTIONS: Array<{ value: boolean; label: string; hint: string }> = [
    { value: true, label: t("reminderYes"), hint: t("reminderYesHint", { time: nudgeAt }) },
    { value: false, label: t("reminderNo"), hint: t("reminderNoHint") },
  ];

  return (
    <View style={{ flex: 1, ...funnelPad, justifyContent: "space-between" }}>
      <View style={{ gap: 22 }}>
        <View style={{ gap: 6 }}>
          <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
            {t("reminderEyebrow")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 23, letterSpacing: -0.2, color: colors.text }}>
            {t("reminderTitle")}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>{t("reminderSubtitle")}</Text>
        </View>
        <View style={{ gap: 10 }}>
          {OPTIONS.map((opt) => {
            const active = reminderOn === opt.value;
            return (
              <Pressable
                key={String(opt.value)}
                onPress={() => {
                  Haptics.selectionAsync();
                  setReminderOn(opt.value);
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
                {opt.value ? <BellIcon size={20} color={colors.accent} strokeWidth={1.6} /> : <View style={{ width: 20 }} />}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{opt.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{opt.hint}</Text>
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

      <OnboardingCta label={t("continueCta")} onPress={() => router.push("/(onboarding)/plan-ready")} />
    </View>
  );
}
