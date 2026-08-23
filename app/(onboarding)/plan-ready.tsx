import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { CloudRainIcon, EqBarsIcon, MoonIcon, MusicIcon, WindIcon } from "../../src/components/icons";

// Mock "Quiet Mind" scene mirroring quiz answers — real personalization
// (mapping selected struggles/sounds into an actual mix) is not wired yet.
export default function PlanReadyScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <GlowBackground
      variant="nightScene"
      washes={[{ origin: { x: 50, y: 16 }, color: colors.glow, extent: 50 }]}
      style={{ flex: 1, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 26, justifyContent: "space-between" }}
    >
      <View style={{ gap: 20 }}>
        <View style={{ alignItems: "center", gap: 8, paddingTop: 20 }}>
          <Text className="font-lora-italic" style={{ fontSize: 16, color: colors.accent }}>
            {t("planEyebrow")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 26, letterSpacing: -0.2, color: colors.text, textAlign: "center" }}>
            {t("planTitle")}
          </Text>
          <Text style={{ fontSize: 13.5, lineHeight: 20, color: colors.muted, textAlign: "center", maxWidth: 300 }}>
            {t("planSubtitle")}
          </Text>
        </View>

        <GlowBackground variant="heroCard" style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.stroke, padding: 18, gap: 15 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
            <Text className="font-lora-italic" style={{ fontSize: 22, color: colors.text }}>
              {t("planSceneName")}
            </Text>
            <View style={{ flex: 1 }} />
            <EqBarsIcon size={16} color={colors.accent} />
          </View>

          {[
            { icon: CloudRainIcon, name: "Rain on a Tin Roof", level: 60 },
            { icon: MusicIcon, name: "Slow Piano", level: 30 },
          ].map((layer) => (
            <View key={layer.name} style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
              <layer.icon size={19} color={colors.accent} strokeWidth={1.6} />
              <Text style={{ flex: 1, fontSize: 13.5, fontWeight: "600", color: colors.text }}>{layer.name}</Text>
              <View style={{ width: 110, height: 6, borderRadius: 999, backgroundColor: colors.sliderTrack }}>
                <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${layer.level}%`, borderRadius: 999, backgroundColor: colors.button }} />
              </View>
              <Text style={{ minWidth: 34, textAlign: "right", fontSize: 12.5, fontWeight: "700", color: colors.accent }}>{layer.level}%</Text>
            </View>
          ))}

          <View style={{ height: 1, backgroundColor: colors.stroke }} />

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
              <MoonIcon size={17} color={colors.accent} strokeWidth={1.6} />
              <Text style={{ fontSize: 12.5, color: colors.muted }}>{t("planStartsHint", { time: "23:30" })}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
              <WindIcon size={17} color={colors.accent} strokeWidth={1.6} />
              <Text style={{ fontSize: 12.5, color: colors.muted }}>{t("planFadesHint")}</Text>
            </View>
          </View>
        </GlowBackground>
      </View>

      <View style={{ gap: 4 }}>
        <Pressable
          onPress={() => router.push("/paywall")}
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
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.buttonText }}>{t("hearTonightCta")}</Text>
        </Pressable>
        <Text style={{ minHeight: 40, textAlign: "center", textAlignVertical: "center", fontSize: 12, color: colors.faint }}>
          {t("fineTuneLaterHint")}
        </Text>
      </View>
    </GlowBackground>
  );
}
