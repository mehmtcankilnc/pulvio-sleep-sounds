import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useTracks } from "../../src/hooks/useTracks";
import { GlowBackground } from "../../src/components/GlowBackground";
import { OnboardingHeader } from "../../src/components/OnboardingHeader";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { MoonIcon, WindIcon } from "../../src/components/icons";
import { categoryIcon } from "../../src/lib/categoryIcon";
import { formatBedtime, useMarkOnboardingStep, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";
import { recommendPlan } from "../../src/lib/onboarding/recommend";
import type { Track } from "../../src/types";

export default function PlanReadyScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();

  const { sections, loading, error, refetch } = useTracks();
  const answers = useOnboardingAnswers();
  const setPreviewTrack = useOnboardingAnswers((s) => s.setPreviewTrack);
  useMarkOnboardingStep(7);

  const catalog = useMemo(() => sections.flatMap((s) => s.data), [sections]);
  const picks = useMemo(
    () => recommendPlan({ frequency: answers.frequency, struggles: answers.struggles, sounds: answers.sounds, voice: answers.voice }, catalog),
    [answers.frequency, answers.struggles, answers.sounds, answers.voice, catalog],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (picks.length > 0 && !picks.some((p) => p.id === selectedId)) setSelectedId(picks[0].id);
  }, [picks, selectedId]);

  const firstStruggle = answers.struggles[0];
  const subtitle = firstStruggle ? t("planSubtitleFor", { need: t(`struggle_${firstStruggle}`).toLowerCase() }) : t("planSubtitle");

  function hearIt() {
    const track = picks.find((p) => p.id === selectedId) ?? picks[0] ?? null;
    setPreviewTrack(track);
    router.push("/(onboarding)/preview");
  }

  return (
    <GlowBackground
      variant="nightScene"
      washes={[{ origin: { x: 50, y: 16 }, color: colors.glow, extent: 50 }]}
      style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 26, justifyContent: "space-between" }}
    >
      <View style={{ gap: 20 }}>
        <OnboardingHeader step={6} totalSteps={6} answered onBack={() => router.back()} backLabel={t("back")} />

        <View style={{ alignItems: "center", gap: 8, paddingTop: 8 }}>
          <Text className="font-lora-italic" style={{ fontSize: 16, color: colors.accent }}>
            {t("planEyebrow")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 26, letterSpacing: -0.2, color: colors.text, textAlign: "center" }}>
            {t("planTitle")}
          </Text>
          <Text style={{ fontSize: 13.5, lineHeight: 20, color: colors.muted, textAlign: "center", maxWidth: 300 }}>{subtitle}</Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : error ? (
          <View style={{ gap: 12, alignItems: "center", paddingVertical: 12 }}>
            <Text style={{ fontSize: 13, color: colors.notice, textAlign: "center" }}>{t("planLoadError")}</Text>
            <Pressable onPress={refetch} style={{ minHeight: 44, justifyContent: "center" }} accessibilityRole="button">
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>{t("planRetry")}</Text>
            </Pressable>
          </View>
        ) : picks.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", paddingVertical: 16 }}>{t("planNoCatalog")}</Text>
        ) : (
          <View style={{ gap: 10 }}>
            <Text className="font-bold" style={{ fontSize: 15.5, color: colors.text }}>
              {t("planPickHeading")}
            </Text>
            {picks.map((track) => (
              <TrackChoice
                key={track.id}
                track={track}
                selected={track.id === selectedId}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedId(track.id);
                }}
              />
            ))}
          </View>
        )}

        {!loading && !error && picks.length > 0 ? (
          <View style={{ gap: 10, paddingHorizontal: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
              <MoonIcon size={17} color={colors.accent} strokeWidth={1.6} />
              <Text style={{ fontSize: 12.5, color: colors.muted }}>
                {t("planBedtimeHint", { time: formatBedtime(answers.bedtimeHour, answers.bedtimeMinute) })}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
              <WindIcon size={17} color={colors.accent} strokeWidth={1.6} />
              <Text style={{ fontSize: 12.5, color: colors.muted }}>{t("planFadesHint")}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={{ gap: 4 }}>
        <OnboardingCta label={t("hearItCta")} disabled={loading || !!error} onPress={hearIt} />
        <Text style={{ minHeight: 40, textAlign: "center", textAlignVertical: "center", fontSize: 12, color: colors.faint }}>
          {t("planFootnote")}
        </Text>
      </View>
    </GlowBackground>
  );
}

function TrackChoice({ track, selected, onPress }: { track: Track; selected: boolean; onPress: () => void }) {
  const colors = useThemeColors();
  const Icon = categoryIcon(track.category, track.subcategory);
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 18,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        minHeight: 60,
        backgroundColor: selected ? colors.glowSoft : colors.card,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.stroke,
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <Icon size={20} color={colors.accent} strokeWidth={1.6} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 14.5, fontWeight: "600", color: colors.text }}>{track.title}</Text>
        <Text style={{ fontSize: 11.5, color: colors.faint }}>{track.subcategory || track.category}</Text>
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          borderWidth: selected ? 6 : 1.5,
          borderColor: selected ? colors.button : colors.stroke,
        }}
      />
    </Pressable>
  );
}
