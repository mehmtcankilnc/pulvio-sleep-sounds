import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, AccessibilityInfo } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useUserStore } from "../../src/store/useUserStore";
import { GlowBackground, MoonRingOuter, MoonRingInner } from "../../src/components/GlowBackground";
import { StarField } from "../../src/components/StarField";
import { OnboardingHeader } from "../../src/components/OnboardingHeader";
import { OnboardingCta } from "../../src/components/OnboardingCta";
import { EqBarsIcon, MoonIcon } from "../../src/components/icons";
import { useMarkOnboardingStep, useOnboardingAnswers } from "../../src/lib/onboarding/useOnboardingAnswers";
import { saveOnboardingAnswers } from "../../src/lib/onboarding/saveAnswers";
import { useFunnelPadding } from "../../src/lib/onboarding/useFunnelPadding";

const MIN_LISTEN_SECONDS = 4; // hear the sound before the choice unlocks
const LOAD_GRACE_SECONDS = 6; // if it hasn't loaded by now, surface trouble + let the user move on

// The first time Pulvio actually plays. Deliberately pre-auth: no freemium
// RPC, no session — a local player on the recommended track that loops for as
// long as the user stays. No countdown, no auto-navigation: the user leaves
// when they tap Continue, or steps back to re-pick.
export default function OnboardingPreviewScreen() {
  const { t } = useTranslation("onboarding");
  const router = useRouter();
  const colors = useThemeColors();
  useMarkOnboardingStep(7);
  const funnelPad = useFunnelPadding();

  // Freeze the track for this screen's lifetime. The store is reset() after
  // the answers are saved post-signup, and letting the audio source flip to
  // null while still mounted makes useAudioPlayer release the player under us.
  const [previewTrack] = useState(() => useOnboardingAnswers.getState().previewTrack);

  const source = useMemo(() => (previewTrack ? { uri: previewTrack.storageUrl } : null), [previewTrack]);
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  const [canLeave, setCanLeave] = useState(!previewTrack);
  const [remaining, setRemaining] = useState(previewTrack ? MIN_LISTEN_SECONDS : 0);
  const [loadChecked, setLoadChecked] = useState(false);
  const advanced = useRef(false);

  useEffect(() => {
    if (!previewTrack) return;
    player.loop = true;
    player.volume = 1;
    player.play();
    // No manual cleanup: useAudioPlayer stops and releases the player on
    // unmount. Calling player.pause() here would race that release.
  }, [player, previewTrack]);

  // If the user steps back here from the paywall, re-arm the CTA and resume
  // the loop they were listening to.
  useFocusEffect(
    useCallback(() => {
      advanced.current = false;
      if (previewTrack) {
        try {
          player.play();
        } catch {
          // player released mid-teardown — nothing to resume
        }
      }
    }, [player, previewTrack]),
  );

  useEffect(() => {
    if (!previewTrack) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const left = Math.ceil(MIN_LISTEN_SECONDS - (Date.now() - start) / 1000);
      if (left <= 0) {
        setRemaining(0);
        setCanLeave(true);
        clearInterval(tick);
      } else {
        setRemaining(left);
      }
    }, 250);
    const check = setTimeout(() => setLoadChecked(true), LOAD_GRACE_SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(check);
    };
  }, [previewTrack]);

  const goNext = useCallback(() => {
    if (advanced.current) return;
    advanced.current = true;
    try {
      player.pause();
    } catch {
      // Player may already be released by a concurrent unmount.
    }
    useUserStore.getState().setOnboardingCompleted(true);

    const session = useUserStore.getState().session;
    if (session) {
      // Already signed in (the __DEV__ replay path, or a rare re-run) — there
      // is no signup step to take. Persist here and drop into the app.
      const a = useOnboardingAnswers.getState();
      saveOnboardingAnswers(session.user.id, {
        frequency: a.frequency,
        struggles: a.struggles,
        sounds: a.sounds,
        voice: a.voice,
        bedtimeHour: a.bedtimeHour,
        bedtimeMinute: a.bedtimeMinute,
        reminderOn: a.reminderOn,
      })
        .catch(() => {})
        .finally(() => {
          useOnboardingAnswers.getState().reset();
          router.replace("/(tabs)");
        });
      return;
    }

    // New user: show the offer while intent is highest, then signup. push (not
    // replace) so the paywall's modal presentation has a screen behind it; the
    // paywall itself routes every exit forward to signup. Answers are saved
    // after the session lands (useOnboardingHandoff); any purchase is attached
    // there too.
    router.push("/paywall?from=onboarding");
  }, [player, router]);

  const loadFailed = !!previewTrack && loadChecked && !status.isLoaded;
  const canContinue = !previewTrack || loadFailed || canLeave;
  // While the min-listen window is still counting down, fold the remaining
  // seconds into the CTA label so the disabled button explains itself.
  const ctaLabel = loadFailed
    ? t("previewContinueAnyway")
    : canContinue
      ? t("continueCta")
      : `${t("continueCta")} · ${remaining}s`;

  return (
    <GlowBackground
      variant="nightScene"
      washes={[{ origin: { x: 50, y: 30 }, color: colors.glow, extent: 52 }]}
      style={{ flex: 1, ...funnelPad }}
    >
      <View style={{ position: "absolute", top: 0, left: 0, right: 0 }} pointerEvents="none">
        <StarField width={390} height={240} />
      </View>

      <OnboardingHeader step={6} totalSteps={6} answered showProgress={false} onBack={() => router.back()} backLabel={t("back")} />

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 26 }}>
        <BreathingMoon active={!!previewTrack && !loadFailed} />

        <View style={{ alignItems: "center", gap: 8 }}>
          <Text className="font-lora-italic" style={{ fontSize: 15, color: colors.accent }}>
            {!previewTrack ? t("previewReadyEyebrow") : loadFailed ? t("previewTrouble") : t("previewNowPlaying")}
          </Text>
          <Text className="font-bold" style={{ fontSize: 24, letterSpacing: -0.2, color: colors.text, textAlign: "center", maxWidth: 300 }}>
            {previewTrack?.title ?? t("previewFallbackTitle")}
          </Text>
          {previewTrack ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
              <EqBarsIcon size={14} color={colors.accent} />
              <Text style={{ fontSize: 12.5, color: colors.muted }}>{previewTrack.category}</Text>
            </View>
          ) : null}
          {loadFailed ? (
            <Text style={{ fontSize: 12.5, color: colors.notice, textAlign: "center", maxWidth: 280, marginTop: 4 }}>{t("previewTroubleHint")}</Text>
          ) : null}
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <OnboardingCta
          label={ctaLabel}
          accessibilityLabel={loadFailed ? t("previewContinueAnyway") : t("continueCta")}
          disabled={!canContinue}
          onPress={goNext}
        />
        <Text style={{ minHeight: 34, textAlign: "center", textAlignVertical: "center", fontSize: 12, color: colors.faint }}>
          {t("previewFootnote")}
        </Text>
      </View>
    </GlowBackground>
  );
}

// The one sanctioned ambient motion on this screen — the same slow ~7s
// breathe DESIGN.md allows on Now Playing, here because the preview IS a
// listening moment. Sub-pixel per second; skipped entirely under Reduce
// Motion, and settled back to rest whenever audio isn't actually playing.
function BreathingMoon({ active }: { active: boolean }) {
  const colors = useThemeColors();
  const breathe = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      breathe.value = withTiming(1, { duration: 400 });
      return;
    }
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      );
    });
  }, [active, breathe]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  return (
    <Animated.View style={style} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <MoonRingOuter style={{ width: 168, height: 168 }}>
        <MoonRingInner style={{ width: 116, height: 116 }}>
          <MoonIcon size={42} color={colors.moon} strokeWidth={1.3} />
        </MoonRingInner>
      </MoonRingOuter>
    </Animated.View>
  );
}
