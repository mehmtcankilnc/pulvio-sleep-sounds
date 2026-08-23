import { Stack } from "expo-router";

// Design-review only for now — not wired ahead of (auth). See
// docs/DRIFT_IMPLEMENTATION_PLAN.md for how this becomes the real
// pre-auth funnel.
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
