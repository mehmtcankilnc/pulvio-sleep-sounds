import "../global.css";
import { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Lora_400Regular_Italic, Lora_500Medium_Italic } from "@expo-google-fonts/lora";
import { useAuthListener } from "../src/hooks/useAuthListener";
import { useSubscriptionStatus } from "../src/hooks/useSubscriptionStatus";
import { useRevenueCatSync } from "../src/hooks/useRevenueCatSync";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { useUserStore, hydrateOnboardingCompleted } from "../src/store/useUserStore";
import { hydrateOnboardingAnswers, useOnboardingAnswers } from "../src/lib/onboarding/useOnboardingAnswers";
import { saveOnboardingAnswers } from "../src/lib/onboarding/saveAnswers";
import { PlayerEngineProvider } from "../src/lib/player/PlayerEngineProvider";
import { initI18n } from "../src/lib/i18n";
import { useThemeColors } from "../src/hooks/useThemeColors";

// Cold start resolves `/` to this group, not `(auth)` — so a logged-in user
// never gets the login screen as the first painted frame while the guard
// below settles.
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colors = useThemeColors();
  useAuthListener();
  useSubscriptionStatus();
  useRevenueCatSync();
  usePushNotifications();
  const session = useUserStore((state) => state.session);
  const onboardingCompleted = useUserStore((state) => state.onboardingCompleted);
  const passwordRecovery = useUserStore((state) => state.passwordRecovery);
  const setLanguage = useUserStore((state) => state.setLanguage);
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Lora_400Regular_Italic,
    Lora_500Medium_Italic,
  });
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initI18n().then((language) => {
      setLanguage(language);
      setI18nReady(true);
    });
  }, [setLanguage]);

  useEffect(() => {
    hydrateOnboardingCompleted();
  }, []);

  const ready = session !== undefined && onboardingCompleted !== undefined && i18nReady && fontsLoaded;
  const inAuthGroup = segments[0] === "(auth)";
  const inOnboardingGroup = segments[0] === "(onboarding)";
  // The pre-auth funnel ends on the paywall (preview -> paywall -> signup), so
  // a logged-out user legitimately sits there too.
  const inPaywall = segments[0] === "paywall";
  const settledForLoggedOut = inAuthGroup || inOnboardingGroup || inPaywall;
  // True for the frame(s) where state is known but the current route is still
  // the wrong place and the guard's replace() hasn't landed yet. A logged-in
  // user never sits in (auth).
  // A recovery session legitimately sits in (auth) on the reset-password
  // screen — don't treat that as "stranded on login".
  const onResetPassword = inAuthGroup && segments[segments.length - 1] === "reset-password";
  // An anonymous session sitting in (auth) is the guest-upgrade flow (the
  // paywall's post-purchase nudge, or "I already have an account" from
  // welcome) deliberately linking signup/login to the SAME session instead
  // of creating a new one (app/(auth)/signup.tsx) — not a stranded, fully
  // authenticated user who has no reason to be there. Only a permanent
  // session counts as stranded.
  const strandedInAuth = inAuthGroup && !passwordRecovery && session?.user.is_anonymous !== true;
  const redirecting =
    ready && (passwordRecovery ? !onResetPassword : !session ? !settledForLoggedOut : strandedInAuth);

  // Root Layout only mounts the Stack (below) once session/onboarding/i18n/
  // fonts are all ready — redirecting before that throws "navigate before
  // mounting the Root Layout component", since there's no navigator yet.
  useEffect(() => {
    if (!ready) return;

    // A recovery deep link landed — take the user to set a new password,
    // wherever they were, and keep them there until the flag clears.
    if (passwordRecovery) {
      if (!onResetPassword) router.replace("/(auth)/reset-password");
      return;
    }

    if (!session) {
      // First run (never been through the funnel) -> onboarding. Otherwise
      // -> login. Leave the user alone once they're on a settled route
      // (auth, onboarding, or the funnel's paywall step). A guest who skipped
      // signup (app/paywall.tsx's dismiss()) isn't `!session` at all by this
      // point — they hold a real Supabase anonymous session — so they never
      // reach this branch; they're just routed like anyone else with a
      // session, one step down.
      if (!settledForLoggedOut) {
        router.replace(onboardingCompleted ? "/(auth)" : "/(onboarding)/welcome");
      }
    } else if (strandedInAuth) {
      // Logged in but stranded on a login screen. (Logged-in users in
      // (onboarding) are left alone — that's the __DEV__ replay path; a
      // recovery session on reset-password is left alone via strandedInAuth.)
      router.replace("/(tabs)");
    }
  }, [ready, session, onboardingCompleted, strandedInAuth, settledForLoggedOut, passwordRecovery, onResetPassword, router]);

  // Keep the plain loading screen up until state is resolved AND we're already
  // on the right group — so no screen flashes for a frame before the guard
  // settles.
  if (!ready || redirecting) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.bg }}
      >
        <ActivityIndicator color={colors.button} />
      </View>
    );
  }

  return <AppShell />;
}

// The pre-auth funnel ends at signup (preview -> paywall -> signup), so the
// account lands a beat after the answers were gathered. When the session
// appears, flush the local answers to the account and clear them; the route
// guard takes it from there. A normal login (no funnel run this session ->
// furthestStep 0) is a no-op. Any anonymous purchase made on the funnel's
// paywall is attached to the account separately, by Purchases.logIn() in
// useRevenueCatSync.
function useOnboardingHandoff() {
  const session = useUserStore((state) => state.session);
  const handled = useRef(false);

  useEffect(() => {
    if (!session || handled.current) return;
    handled.current = true;
    (async () => {
      await hydrateOnboardingAnswers();
      const answers = useOnboardingAnswers.getState();
      if (answers.furthestStep <= 0) return;
      try {
        await saveOnboardingAnswers(session.user.id, {
          frequency: answers.frequency,
          struggles: answers.struggles,
          sounds: answers.sounds,
          bedtimeHour: answers.bedtimeHour,
          bedtimeMinute: answers.bedtimeMinute,
          reminderOn: answers.reminderOn,
        });
      } catch (e) {
        // Best-effort: the funnel UX is already done. A failed write (e.g.
        // offline) just means the answers aren't on the account.
        console.warn("onboarding: could not save answers to the account", e);
      }
      useOnboardingAnswers.getState().reset();
    })();
  }, [session]);
}

// player/paywall/onboarding screens draw their own Drift-styled top bars
// (back control, title, trailing icon) rather than using the native Stack
// header, so every modal route here is headerShown: false.
function AppShell() {
  useOnboardingHandoff();
  return (
    <>
      <PlayerEngineProvider />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="sounds" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="account" />
        <Stack.Screen
          name="player"
          options={{
            // Full-screen card (not a `modal` presentation, whose Android
            // dismiss animation is unreliable) that slides up from the bottom
            // and, on pop, slides straight back down — so the header chevron
            // reads as "swipe this away downward". Vertical gesture enables
            // swipe-down-to-dismiss to match.
            animation: "slide_from_bottom",
            gestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
        <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
