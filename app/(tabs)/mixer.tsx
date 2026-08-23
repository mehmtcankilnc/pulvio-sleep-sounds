import { useState } from "react";
import type { JSX } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { SelectChip } from "../../src/components/ui/SelectChip";
import {
  CloudRainIcon,
  EqBarsIcon,
  FlameIcon,
  MusicIcon,
  PencilIcon,
  PlusIcon,
} from "../../src/components/icons";
import type { IconProps } from "../../src/components/icons";

// Mock content — no real mixing engine yet. See docs/DRIFT_IMPLEMENTATION_PLAN.md.
type Layer = { id: string; name: string; icon: (props: IconProps) => JSX.Element; level: number };
type Scene = { id: string; name: string };

const INITIAL_LAYERS: Layer[] = [
  { id: "rain", name: "Rain on a Tin Roof", icon: CloudRainIcon, level: 60 },
  { id: "piano", name: "Slow Piano", icon: MusicIcon, level: 25 },
  { id: "fire", name: "Crackling Fireplace", icon: FlameIcon, level: 15 },
];

const SCENES: Scene[] = [
  { id: "cabin", name: "Cabin Night" },
  { id: "ocean", name: "Ocean Drift" },
  { id: "space", name: "Deep Space" },
];

export default function MixerScreen() {
  const { t } = useTranslation("mixer");
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const [layers] = useState(INITIAL_LAYERS);
  const [activeScene, setActiveScene] = useState(SCENES[0].id);

  return (
    <GlowBackground variant="pageWash" style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: tabBarHeight + 24, gap: 15 }}
      >
        <ScreenHeader eyebrow={t("eyebrow")} title={t("screenTitle")} />

        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
            <Text className="font-lora-italic" style={{ fontSize: 24, color: colors.text }}>
              {SCENES.find((s) => s.id === activeScene)?.name}
            </Text>
            <PencilIcon size={15} color={colors.faint} strokeWidth={1.7} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <EqBarsIcon size={16} color={colors.accent} />
            <Text style={{ fontSize: 12.5, color: colors.muted }}>{t("layersPlaying", { count: layers.length })}</Text>
          </View>
        </View>

        <View style={{ gap: 11 }}>
          {layers.map((layer) => (
            <View
              key={layer.id}
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 20, padding: 15, paddingHorizontal: 16, gap: 13 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
                <layer.icon size={21} color={colors.accent} strokeWidth={1.6} />
                <Text style={{ flex: 1, fontSize: 14.5, fontWeight: "600", color: colors.text }}>{layer.name}</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>{layer.level}%</Text>
              </View>
              <View style={{ height: 20, justifyContent: "center" }}>
                <View style={{ height: 6, borderRadius: 999, backgroundColor: colors.sliderTrack }} />
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    width: `${layer.level}%`,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: colors.button,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    left: `${layer.level}%`,
                    marginLeft: -10,
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    backgroundColor: colors.accent,
                    borderWidth: 3,
                    borderColor: colors.bg,
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={{
            minHeight: 56,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: colors.stroke,
            borderStyle: "dashed",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          accessibilityRole="button"
        >
          <PlusIcon size={15} color={colors.accent} strokeWidth={2} />
          <Text style={{ fontSize: 13.5, fontWeight: "600", color: colors.accent }}>{t("addSoundCta")}</Text>
        </Pressable>

        <View style={{ gap: 11 }}>
          <Text className="font-bold" style={{ fontSize: 15.5, color: colors.text }}>
            {t("yourScenesTitle")}
          </Text>
          <View style={{ flexDirection: "row", gap: 9, flexWrap: "wrap" }}>
            {SCENES.map((scene) => (
              <SelectChip
                key={scene.id}
                label={scene.name}
                selected={scene.id === activeScene}
                onPress={() => setActiveScene(scene.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </GlowBackground>
  );
}
