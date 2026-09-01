import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { GlowBackground } from "../../src/components/GlowBackground";
import { OnboardingHeader } from "../../src/components/OnboardingHeader";
import { hydrateOnboardingAnswers, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";
import { routeStepInfo, stepAnswered, TOTAL_STEPS } from "../../src/lib/onboarding/steps";

// The pre-auth funnel. The chrome that used to live in every step — the peach
// glow and the progress bar — is hoisted here so it never unmounts: the glow
// stays fixed while the step panels slide across it, and the bar tweens its
// fill continuously instead of a fresh copy popping in at each step. See
// docs/DRIFT_IMPLEMENTATION_PLAN.md for how this became the real funnel.
//
// Motion: a single horizontal push carries step-to-step continuity. Under
// Reduce Motion the slide collapses to a crossfade — the bar's fill still
// animates (it carries meaning), the panel just stops travelling.
export default function OnboardingLayout() {
  const reduced = useReducedMotion();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation("onboarding");
  const segments = useSegments();

  const frequency = useOnboardingAnswers((s) => s.frequency);
  const struggles = useOnboardingAnswers((s) => s.struggles);
  const sounds = useOnboardingAnswers((s) => s.sounds);
  const voice = useOnboardingAnswers((s) => s.voice);

  // Read any saved answers back before the first step renders, so an
  // interrupted funnel resumes instead of restarting.
  useEffect(() => {
    hydrateOnboardingAnswers();
  }, []);

  const info = routeStepInfo(segments[segments.length - 1]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* One sky for the whole funnel. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <GlowBackground variant="pageWash" style={{ flex: 1 }} />
      </View>

      {info ? (
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 4 }}>
          <OnboardingHeader
            step={info.step}
            totalSteps={TOTAL_STEPS}
            answered={stepAnswered(info.step, { frequency, struggles, sounds, voice })}
            onBack={() => router.back()}
            backLabel={t("back")}
            onSkip={info.skippable ? () => router.push("/(onboarding)/plan-ready") : undefined}
            skipLabel={info.skippable ? t("skip") : undefined}
          />
        </View>
      ) : null}

      <Stack
        screenOptions={{
          headerShown: false,
          animation: reduced ? "fade" : "slide_from_right",
          animationDuration: reduced ? 160 : 280,
          gestureEnabled: true,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </View>
  );
}
