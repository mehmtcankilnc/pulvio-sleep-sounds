import { useSafeAreaInsets } from "react-native-safe-area-context";

// Shared edge padding for the onboarding funnel's full-screen steps. Both
// edges have to clear the status bar and the Android system nav bar — a
// hardcoded paddingBottom leaves the "Continue" pill sitting under the
// 3-button nav bar on devices that have one.
//
// `hasStageHeader`: the 6 quiz steps render inside the layout's persistent
// header stage, which already consumes the top inset, so those screens only
// need a small top gap. Screens that own their whole surface (welcome,
// preview, plan-ready) leave it false and get the full status-bar inset.
export function useFunnelPadding({ hasStageHeader = false }: { hasStageHeader?: boolean } = {}) {
  const insets = useSafeAreaInsets();
  return {
    paddingHorizontal: 20,
    paddingTop: hasStageHeader ? 12 : Math.max(32, insets.top + 8),
    paddingBottom: Math.max(26, insets.bottom + 12),
  };
}
