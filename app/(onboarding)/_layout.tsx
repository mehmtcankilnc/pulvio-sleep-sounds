import { useEffect } from "react";
import { Stack } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";
import { hydrateOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";

// Design-review only for now — not wired ahead of (auth). See
// docs/DRIFT_IMPLEMENTATION_PLAN.md for how this becomes the real
// pre-auth funnel.
//
// Motion: a single horizontal push carries the step-to-step continuity so
// the progress bar reads as one moving thing across screens. Under Reduce
// Motion the spatial slide collapses to a quick crossfade — the bar's fill
// still animates (it carries meaning), the screen just stops travelling.
export default function OnboardingLayout() {
  const reduced = useReducedMotion();

  // Read any saved answers back before the first step renders, so an
  // interrupted funnel resumes instead of restarting.
  useEffect(() => {
    hydrateOnboardingAnswers();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reduced ? "fade" : "slide_from_right",
        animationDuration: reduced ? 160 : 280,
        gestureEnabled: true,
      }}
    />
  );
}
