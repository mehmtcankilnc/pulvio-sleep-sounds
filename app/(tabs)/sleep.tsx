import type { JSX } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import Svg, { Circle, Path } from "react-native-svg";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { Toggle } from "../../src/components/ui/Toggle";
import { ChevronRightIcon, CloudRainIcon, MoonIcon, TimerIcon, WindIcon } from "../../src/components/icons";
import type { IconProps } from "../../src/components/icons";

function BedtimeArc() {
  const colors = useThemeColors();
  return (
    <Svg width={316} height={118} viewBox="0 0 316 118">
      <Path d="M16 102 Q158 -16 300 102" fill="none" stroke={colors.accent} strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" strokeDasharray="0.5 8" />
      <Circle cx={16} cy={102} r={3.5} fill={colors.accent} opacity={0.6} />
      <Circle cx={300} cy={102} r={3.5} fill={colors.accent} opacity={0.6} />
      <Circle cx={116} cy={50} r={22} fill={colors.glow} />
      <Circle cx={116} cy={50} r={13} fill={colors.moon} />
      <Circle cx={215} cy={34} r={1.3} fill={colors.star} opacity={0.7} />
      <Circle cx={248} cy={58} r={1.1} fill={colors.star} opacity={0.5} />
      <Circle cx={181} cy={18} r={1.2} fill={colors.star} opacity={0.6} />
    </Svg>
  );
}

// Bedtime/wake times and the routine rows besides "Bedtime reminder" are
// mock — no real schedule storage yet. See docs/DRIFT_IMPLEMENTATION_PLAN.md.
function RoutineRow({
  icon: Icon,
  title,
  subtitle,
  trailing,
}: {
  icon: (props: IconProps) => JSX.Element;
  title: string;
  subtitle: string;
  trailing: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 2 }}>
      <Icon size={20} color={colors.accent} strokeWidth={1.6} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 11.5, color: colors.faint }}>{subtitle}</Text>
      </View>
      {trailing}
    </View>
  );
}

function Hairline() {
  const colors = useThemeColors();
  return <View style={{ height: 1, backgroundColor: colors.stroke }} />;
}

export default function SleepScreen() {
  const { t } = useTranslation("sleep");
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <GlowBackground variant="pageWash" style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: tabBarHeight + 24, gap: 16 }}
      >
        <ScreenHeader eyebrow={t("eyebrow")} title={t("title")} />

        <GlowBackground variant="heroCard" style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.stroke, padding: 16, paddingBottom: 14, gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text style={{ fontSize: 10.5, fontWeight: "700", letterSpacing: 1.5, color: colors.accent }}>{t("scheduleOverline")}</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{t("bedtimeInHint", { time: "1 h 20 m" })}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <BedtimeArc />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>23:30</Text>
              <Text style={{ fontSize: 11, color: colors.faint }}>{t("bedtimeLabel")}</Text>
            </View>
            <View style={{ height: 40, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: colors.stroke, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: colors.accent }}>{t("adjustCta")}</Text>
            </View>
            <View style={{ gap: 1, alignItems: "flex-end" }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>07:00</Text>
              <Text style={{ fontSize: 11, color: colors.faint }}>{t("wakeUpLabel")}</Text>
            </View>
          </View>
        </GlowBackground>

        <View style={{ gap: 11 }}>
          <Text className="font-bold" style={{ fontSize: 15.5, color: colors.text }}>
            {t("routineTitle")}
          </Text>
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
            <RoutineRow
              icon={CloudRainIcon}
              title={t("playSceneRowTitle")}
              subtitle={t("playSceneRowSubtitle")}
              trailing={<Toggle value onValueChange={() => {}} accessibilityLabel={t("playSceneRowTitle")} />}
            />
            <Hairline />
            <RoutineRow
              icon={TimerIcon}
              title={t("sleepTimerRowTitle")}
              subtitle={t("sleepTimerRowSubtitle", { minutes: 45 })}
              trailing={
                <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 6 }} accessibilityRole="button">
                  <Text style={{ fontSize: 12.5, color: colors.muted }}>{t("minutesShort", { count: 45 })}</Text>
                  <ChevronRightIcon size={15} color={colors.faint} strokeWidth={1.7} />
                </Pressable>
              }
            />
            <Hairline />
            <RoutineRow
              icon={WindIcon}
              title={t("fadeOutRowTitle")}
              subtitle={t("fadeOutRowSubtitle")}
              trailing={<Toggle value onValueChange={() => {}} accessibilityLabel={t("fadeOutRowTitle")} />}
            />
            <Hairline />
            <RoutineRow
              icon={MoonIcon}
              title={t("wakeRowTitle")}
              subtitle={t("wakeRowSubtitle", { time: "07:00" })}
              trailing={<Toggle value={false} onValueChange={() => {}} accessibilityLabel={t("wakeRowTitle")} />}
            />
          </View>
        </View>
      </ScrollView>
    </GlowBackground>
  );
}
