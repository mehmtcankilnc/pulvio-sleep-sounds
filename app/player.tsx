import { memo, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Image, StyleSheet, AccessibilityInfo, ActivityIndicator, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { usePlayerStore } from "../src/store/usePlayerStore";
import { useUserStore } from "../src/store/useUserStore";
import { useSleepTimerStore } from "../src/store/useSleepTimerStore";
import { usePlayerActions } from "../src/hooks/usePlayerActions";
import { useFavorites } from "../src/hooks/useFavorites";
import { useCooldownCountdown } from "../src/hooks/useCooldownCountdown";
import { useSleepCountdown } from "../src/hooks/useSleepCountdown";
import { useThemeColors } from "../src/hooks/useThemeColors";
import { categoryIcon } from "../src/lib/categoryIcon";
import { categoryLabel, subcategoryLabel } from "../src/lib/catalogTaxonomy";
import { formatClock } from "../src/lib/time";
import { TIMER_OPTIONS, armSleepTimer, type TimerOption } from "../src/lib/player/sleepTimer";
import { GlowBackground, MoonRingOuter, MoonRingInner } from "../src/components/GlowBackground";
import { StarField } from "../src/components/StarField";
import { Button } from "../src/components/ui/Button";
import { SelectChip } from "../src/components/ui/SelectChip";
import { CheckIcon, ChevronDownIcon, HeartIcon, MinusIcon, MoonIcon, PauseIcon, PlayIcon, PlusIcon, SlidersIcon, type IconProps } from "../src/components/icons";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const PRESS_TIMING = { duration: 150, easing: EASE_OUT, reduceMotion: ReduceMotion.System };
const CONTENT_MAX_W = 460;
// Two secondary-text sizes for the whole screen — a caption tier and a
// body-secondary tier. Every muted line picks one of these, not its own value.
const T_CAPTION = 11.5;
const T_SECONDARY = 13;
// Below this, a track is a loop / ambient bed the user isn't tracking position
// through — the sleep timer is the only clock that matters, so the playback
// progress bar stays hidden and doesn't compete with it.
const LONGFORM_MIN_SECONDS = 15 * 60;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// --- Why this screen is a shell of memoized leaves --------------------------
// The night scene is SVG-gradient-heavy (GlowBackground washes, both moon
// rings, the starfield). If PlayerScreen itself subscribed to the values that
// tick during playback — elapsed seconds (several times a second), the sleep
// countdown (1 Hz) — every tick would reconcile that whole tree, and the
// judder shows up worst *during the open/close slide*. So the volatile
// subscriptions each live in their own `memo` leaf below; PlayerScreen only
// re-renders on track / denial / error changes, which are rare.

// Isolated so toggling `liked` only reconciles this tiny subtree. Remounted
// per track (see `key` at the call site) so its fetched/animated state never
// leaks between tracks.
function LikeButton({ trackId }: { trackId: string }) {
  const { t } = useTranslation("player");
  const colors = useThemeColors();
  const { favoriteIds, loading, toggleFavorite } = useFavorites();
  const liked = favoriteIds.has(trackId);
  const fillOpacity = useSharedValue(0);
  // Only the initial fetch result should snap the heart in instantly —
  // every toggle after that goes through handleToggleLike's animated path.
  const hydrated = useRef(false);

  useEffect(() => {
    if (!loading && !hydrated.current) {
      fillOpacity.value = liked ? 1 : 0;
      hydrated.current = true;
    }
  }, [loading, liked, fillOpacity]);

  function handleToggleLike() {
    const next = !liked;
    fillOpacity.value = withTiming(next ? 1 : 0, { duration: 150, easing: EASE_OUT });
    toggleFavorite(trackId);
    // Both directions confirm by touch — add is a heavier "kept it", remove a
    // lighter selection tick, so eyes-closed the two feel distinct.
    if (next) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else Haptics.selectionAsync();
  }

  const filledAnimatedStyle = useAnimatedStyle(() => ({ opacity: fillOpacity.value }));

  return (
    <Pressable
      onPress={handleToggleLike}
      style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, alignItems: "center", justifyContent: "center" }}
      accessibilityRole="button"
      accessibilityLabel={t("likeAccessibilityLabel")}
      accessibilityState={{ selected: liked }}
    >
      <View>
        <HeartIcon size={19} color={colors.muted} filled={false} />
        <Animated.View style={[{ position: "absolute", top: 0, left: 0 }, filledAnimatedStyle]}>
          <HeartIcon size={19} color={colors.accent} filled />
        </Animated.View>
      </View>
    </Pressable>
  );
}

// A thin arc that depletes as the sleep timer counts down — the visible proof
// that "30m" actually took. Owns its own `useSleepCountdown` subscription so
// only this two-circle SVG re-renders on tick, not the moon behind it. Under
// Reduce Motion it steps every 15s instead of every second, so it isn't a
// second competing ambient motion next to the 7s breathe. Rendered *inside*
// MoonBreath's transform so it breathes with the moon rather than staying
// fixed while the moon grows past it.
const TimerRing = memo(function TimerRing({ size }: { size: number }) {
  const colors = useThemeColors();
  const reduced = useReducedMotion();
  const sleep = useSleepCountdown(reduced ? 15000 : 1000);
  if (!sleep.active) return null;

  const stroke = 2.5;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const progress = Math.min(1, Math.max(0, sleep.progress));

  return (
    <View
      style={{ position: "absolute" }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.stroke} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.accent}
          strokeOpacity={0.5}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * progress}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
});

// The moon and its rings + the slow breathe, with the depleting timer ring
// nested inside the same transform. No volatile props, so `memo` keeps this —
// the most expensive subtree on the screen — static during playback and the
// open/close transition; only the small TimerRing SVG inside re-renders on
// its own tick.
const MoonBreath = memo(function MoonBreath({
  size,
  Icon,
  coverUrl,
  still = false,
}: {
  size: number;
  Icon: (props: IconProps) => React.JSX.Element;
  // The playing track's category cover art. When present it fills the inner
  // ring (clipped to the circle) and the category glyph becomes just the
  // fallback / still-loading layer behind it. `still` loading states never
  // pass this — they stay on the plain moon glyph.
  coverUrl?: string;
  // `still` = same moon, no breathe — used by the loading state so it reads
  // as the same screen as playback, just paused.
  still?: boolean;
}) {
  const colors = useThemeColors();
  const breathe = useSharedValue(1);
  const [imageFailed, setImageFailed] = useState(false);
  const photoOpacity = useSharedValue(0);
  const photoStyle = useAnimatedStyle(() => ({ opacity: photoOpacity.value }));
  const showPhoto = Boolean(coverUrl) && !imageFailed;
  const innerSize = size - 92;

  // This memo is reused across track changes — reset the crossfade so the new
  // cover fades in rather than snapping (or showing the previous one).
  useEffect(() => {
    photoOpacity.value = 0;
    setImageFailed(false);
  }, [coverUrl, photoOpacity]);

  useEffect(() => {
    if (still) return;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      breathe.value = withRepeat(
        withSequence(
          withTiming(1.045, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    });
  }, [breathe, still]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  return (
    <Animated.View
      style={[{ alignItems: "center", justifyContent: "center" }, ringStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <TimerRing size={size} />
      <MoonRingOuter style={{ width: size - 22, height: size - 22 }}>
        <MoonRingInner style={{ width: innerSize, height: innerSize }}>
          {/* The glyph is always the base layer — it's the fallback and the
              "cover still fetching" state; the photo crossfades in over it. */}
          <Icon size={52} color={colors.moon} />
          {showPhoto && (
            <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
              <Image
                source={{ uri: coverUrl }}
                resizeMode="cover"
                style={{ width: innerSize, height: innerSize }}
                onLoad={() => {
                  photoOpacity.value = withTiming(1, { duration: 260, easing: EASE_OUT });
                }}
                onError={() => setImageFailed(true)}
              />
              {/* One Hue Rule — pull the photo toward the app accent, same
                  tint the category rail and Tonight's pick already use. */}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.button}30` }]} />
            </Animated.View>
          )}
        </MoonRingInner>
      </MoonRingOuter>
    </Animated.View>
  );
});

// The custom stepper's range — mirrors the Sleep tab's routine row
// (app/(tabs)/sleep.tsx) so a value armed on one screen reads back cleanly on
// the other. Any "Nm" string is a valid TimerOption.
const CUSTOM_TIMER_MIN = 5;
const CUSTOM_TIMER_MAX = 180;
const CUSTOM_TIMER_STEP = 5;
const CUSTOM_TIMER_DEFAULT = 60;
const clampCustomTimer = (minutes: number) =>
  Math.min(CUSTOM_TIMER_MAX, Math.max(CUSTOM_TIMER_MIN, Math.round(minutes / CUSTOM_TIMER_STEP) * CUSTOM_TIMER_STEP));

const TIMER_CHIP_HEIGHT = 38;
// The whole timer row is pinned to this height so swapping the preset chips
// for the custom stepper (which is taller) never reflows the column — that
// reflow was pushing the moon/title block up and back down on every toggle.
const TIMER_ROW_HEIGHT = 44;

// Re-renders only when the picked option changes (rare) — kept off the 1 Hz
// tick path so the chips don't reconcile every second. Four preset pills plus
// one circular "custom" button: tapping it swaps the whole row for an inline
// −/value/+/✓ stepper, and once a custom value is armed the button becomes a
// selected pill showing it (e.g. "70m"). Every step arms the timer
// immediately, so a value never sits half-adjusted with nothing scheduled
// behind it (same contract as the Sleep tab). Sized to fit five items on one
// line down to an SE-class width — no horizontal scroll.
const TimerChips = memo(function TimerChips() {
  const { t } = useTranslation("player");
  const { t: tSleep } = useTranslation("sleep");
  const colors = useThemeColors();
  const selected = useSleepTimerStore((state) => state.option);
  const isPreset = (TIMER_OPTIONS as readonly string[]).includes(selected);
  const customMinutes = isPreset ? null : parseInt(selected, 10);
  const hasCustom = customMinutes != null && Number.isFinite(customMinutes);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(CUSTOM_TIMER_DEFAULT);

  function openCustom() {
    setDraft(hasCustom ? clampCustomTimer(customMinutes) : CUSTOM_TIMER_DEFAULT);
    setEditing(true);
  }
  function stepTo(minutes: number) {
    const clamped = clampCustomTimer(minutes);
    setDraft(clamped);
    armSleepTimer(`${clamped}m` as TimerOption);
  }
  function pickPreset(option: TimerOption) {
    setEditing(false);
    armSleepTimer(option);
  }

  const roundBtn = {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.bg,
  };

  const content = editing ? (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: TIMER_ROW_HEIGHT,
        paddingHorizontal: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.button,
        backgroundColor: colors.card,
      }}
    >
      <Pressable
        onPress={() => stepTo(draft - CUSTOM_TIMER_STEP)}
        disabled={draft <= CUSTOM_TIMER_MIN}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={tSleep("sleepTimerCustomDecrementLabel")}
        style={roundBtn}
      >
        <MinusIcon size={15} color={draft <= CUSTOM_TIMER_MIN ? colors.faint : colors.accent} />
      </Pressable>
      <Text style={{ minWidth: 64, textAlign: "center", fontSize: 13.5, fontWeight: "700", color: colors.text }}>
        {tSleep("minutesShort", { count: draft })}
      </Text>
      <Pressable
        onPress={() => stepTo(draft + CUSTOM_TIMER_STEP)}
        disabled={draft >= CUSTOM_TIMER_MAX}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={tSleep("sleepTimerCustomIncrementLabel")}
        style={roundBtn}
      >
        <PlusIcon size={15} color={draft >= CUSTOM_TIMER_MAX ? colors.faint : colors.accent} />
      </Pressable>
      <Pressable
        onPress={() => {
          armSleepTimer(`${draft}m` as TimerOption);
          setEditing(false);
        }}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={tSleep("sleepTimerCustomDoneLabel")}
        style={[roundBtn, { backgroundColor: colors.button }]}
      >
        <CheckIcon size={15} color={colors.buttonText} />
      </Pressable>
    </View>
  ) : (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }}>
      {TIMER_OPTIONS.map((option) => (
        <SelectChip
          key={option}
          label={option}
          selected={option === selected}
          onPress={() => pickPreset(option)}
          height={TIMER_CHIP_HEIGHT}
          fontSize={12.5}
          paddingHorizontal={13}
          accessibilityLabel={t("timerAccessibilityLabel", { option })}
        />
      ))}
      <SelectChip
        label={hasCustom ? `${customMinutes}m` : ""}
        selected={hasCustom}
        onPress={openCustom}
        height={TIMER_CHIP_HEIGHT}
        fontSize={12.5}
        paddingHorizontal={hasCustom ? 12 : 11}
        icon={<SlidersIcon size={15} color={hasCustom ? colors.buttonText : colors.muted} />}
        accessibilityLabel={
          hasCustom
            ? t("timerAccessibilityLabel", { option: `${customMinutes}m` })
            : tSleep("sleepTimerOptionCustom")
        }
      />
    </View>
  );

  // Fixed-height wrapper so the preset↔stepper swap never reflows the column.
  return <View style={{ height: TIMER_ROW_HEIGHT, justifyContent: "center" }}>{content}</View>;
});

// The one line that legitimately ticks every second — a single <Text>. Shows
// a distinct "timer ended — playback stopped" state once the sleep timer has
// fired (until the user plays again), so it never claims "fades out as you
// drift off" over silence.
const TimerStatusLine = memo(function TimerStatusLine() {
  const { t } = useTranslation("player");
  const colors = useThemeColors();
  const option = useSleepTimerStore((state) => state.option);
  const firedAt = useSleepTimerStore((state) => state.firedAt);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const sleep = useSleepCountdown();
  const status = sleep.active
    ? t("timerCountdown", { time: sleep.label })
    : firedAt && !isPlaying
    ? t("timerFinished")
    : !isPlaying
    ? // Paused with no timer armed — "fades out as you drift off" would be a
      // lie over silence, so say nothing.
      " "
    : option === "∞"
    ? t("timerNoTimer")
    : t("timerFadeHint");
  return (
    <Text testID="player-timer-status" style={{ fontSize: T_CAPTION, color: colors.muted, textAlign: "center" }}>
      {status}
    </Text>
  );
});

// One-time disclosure that playback silently armed a sleep timer for the user
// (see sleepTimer.armSleepTimerAuto). Shows for ~5s the first time it ever
// happens on an install, then never again. Renders nothing otherwise.
const AutoArmHint = memo(function AutoArmHint() {
  const { t } = useTranslation("player");
  const colors = useThemeColors();
  const hint = useSleepTimerStore((state) => state.autoArmHint);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hint) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const id = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(id);
  }, [hint]);

  if (!hint || !visible) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={{ fontSize: T_CAPTION, color: colors.accent, textAlign: "center" }}
    >
      {t("timerAutoArmed", { option: hint.option })}
    </Text>
  );
});

// One-time disclosure of the free tier's 3-minute/3-hour cooldown rule — see
// freeLimitDisclosure.ts for why this needed to exist (it was previously
// only ever discovered by hitting it). Same shape as AutoArmHint just above:
// shows once per install, then never again. A beat longer on screen (8s vs
// AutoArmHint's 5s) since there's more to read and it matters more.
const FreeLimitHint = memo(function FreeLimitHint() {
  const { t } = useTranslation("player");
  const colors = useThemeColors();
  const hint = usePlayerStore((state) => state.freeLimitHint);
  const setFreeLimitHint = usePlayerStore((state) => state.setFreeLimitHint);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hint) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const id = setTimeout(() => {
      setVisible(false);
      setFreeLimitHint(false);
    }, 8000);
    return () => clearTimeout(id);
  }, [hint, setFreeLimitHint]);

  if (!hint || !visible) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={{ fontSize: T_CAPTION, color: colors.muted, textAlign: "center", paddingHorizontal: 12 }}
    >
      {t("freeLimitHint")}
    </Text>
  );
});

// Owns the elapsed/duration subscription (updates several times a second while
// playing). Hidden entirely for short loops.
const PlaybackProgress = memo(function PlaybackProgress() {
  const { t } = useTranslation("player");
  const colors = useThemeColors();
  const elapsed = usePlayerStore((state) => state.elapsedSeconds);
  const duration = usePlayerStore((state) => state.durationSeconds);

  if (!Number.isFinite(duration) || duration < LONGFORM_MIN_SECONDS) return null;
  const pct = Math.min(100, Math.max(0, (elapsed / duration) * 100));

  return (
    <View
      style={{ gap: 6 }}
      accessible
      accessibilityLabel={t("elapsedAccessibilityLabel", { elapsed: formatClock(elapsed), total: formatClock(duration) })}
    >
      <View style={{ height: 3, borderRadius: 999, backgroundColor: colors.sliderTrack, overflow: "hidden" }}>
        <View style={{ height: 3, borderRadius: 999, backgroundColor: colors.button, width: `${pct}%` as `${number}%` }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: T_CAPTION, color: colors.muted, fontVariant: ["tabular-nums"] }}>{formatClock(elapsed)}</Text>
        <Text style={{ fontSize: T_CAPTION, color: colors.muted, fontVariant: ["tabular-nums"] }}>{formatClock(duration)}</Text>
      </View>
    </View>
  );
});

// Owns isPlaying / isBuffering. The primary control, so it also carries the
// app-standard press-scale (Reduce-Motion aware) and a haptic on every toggle.
const PlayPauseButton = memo(function PlayPauseButton() {
  const { t } = useTranslation("player");
  const colors = useThemeColors();
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isBuffering = usePlayerStore((state) => state.isBuffering);
  const { togglePlayPause } = usePlayerActions();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    togglePlayPause();
  }

  return (
    <AnimatedPressable
      testID="player-playpause"
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withTiming(0.97, PRESS_TIMING);
      }}
      onPressOut={() => {
        scale.value = withTiming(1, PRESS_TIMING);
      }}
      style={[
        {
          width: 76,
          height: 76,
          borderRadius: 999,
          backgroundColor: colors.button,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.glow,
          shadowOpacity: 1,
          shadowRadius: 34,
          shadowOffset: { width: 0, height: 12 },
          elevation: 10,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ busy: isBuffering }}
      accessibilityLabel={
        isBuffering
          ? t("bufferingAccessibilityLabel")
          : isPlaying
          ? t("pauseAccessibilityLabel")
          : t("playAccessibilityLabel")
      }
    >
      {isBuffering ? (
        <ActivityIndicator color={colors.buttonText} />
      ) : isPlaying ? (
        <PauseIcon size={28} color={colors.buttonText} />
      ) : (
        <PlayIcon size={26} color={colors.buttonText} />
      )}
    </AnimatedPressable>
  );
});

// The cooldown lockout's 1 Hz value, isolated so the WindDownScreen (another
// GlowBackground) doesn't reconcile every second while it counts down. Placed
// UNDER the upgrade CTA, but readable — this is the one fact a free user needs
// to decide "wait or sleep?", so it's `text` weight and in a live region for
// screen readers rather than a silent per-second node.
const CooldownClock = memo(function CooldownClock() {
  const { t } = useTranslation("player");
  const colors = useThemeColors();
  const label = useCooldownCountdown();
  // No `accessibilityLiveRegion` — a node that changes every second would make
  // a screen reader read the countdown once per second. A SR user gets it when
  // they navigate to it; the copy above already conveys "come back later".
  return (
    <Text style={{ fontSize: T_SECONDARY, color: colors.text, textAlign: "center", fontVariant: ["tabular-nums"] }}>
      {label ? t("limitCountdown", { time: label }) : " "}
    </Text>
  );
});

// Low-emphasis secondary action for the wind-down states — a text link, not a
// second full-width pill, so each screen has exactly one button shape and the
// primary CTA reads as the one decision.
function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={{ minHeight: 44, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={{ fontSize: T_SECONDARY, fontWeight: "600", color: colors.muted }}>{label}</Text>
    </Pressable>
  );
}

// Full-screen calm state shared by the four "not playing" branches (loading,
// free limit, premium-only, nothing selected) — same night scene, same
// centred column width and safe-area padding as the player, so a stop never
// feels like a different app.
function WindDownScreen({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <GlowBackground
      variant="nightScene"
      style={{
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: Math.max(insets.top, 20) + 6,
        paddingBottom: Math.max(insets.bottom, 16) + 10,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View testID="player-winddown" style={{ width: "100%", maxWidth: CONTENT_MAX_W, alignItems: "center", gap: 14 }}>
        {children}
      </View>
    </GlowBackground>
  );
}

// One heading treatment for every wind-down state — 22/700, so the empty
// state's title doesn't read as quieter than the cooldown / premium ones.
function WindDownTitle({ children }: { children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <Text style={{ fontSize: 22, fontWeight: "700", letterSpacing: -0.2, color: colors.text, textAlign: "center" }}>
      {children}
    </Text>
  );
}

export default function PlayerScreen() {
  const { t, i18n } = useTranslation("player");
  const { t: tCatalog } = useTranslation("catalog");
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Shrink the moon stage on short devices (SE-class) so the label block and
  // the controls below it never collide with it.
  const moonStage = windowHeight < 700 ? 206 : 236;

  // Only rare values live here — the whole tree below re-renders when one of
  // these changes, so nothing that ticks belongs in this list.
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isStartingPlayback = usePlayerStore((state) => state.isStartingPlayback);
  const error = usePlayerStore((state) => state.error);
  const denyReason = usePlayerStore((state) => state.denyReason);
  const cooldownEndsAt = useUserStore((state) => state.cooldownEndsAt);
  // usePlayerActions takes no reactive slices, so this doesn't re-subscribe
  // PlayerScreen to anything that ticks.
  const { retryLast, clearDenial } = usePlayerActions();

  const errorText = error ? t(`error.${error}`, { defaultValue: t("error.loadFailed") }) : null;
  // Both of these are re-attemptable with the same track; "trackUnavailable"
  // is not (the backend said it doesn't exist).
  const canRetry = error === "loadFailed" || error === "sessionEnded";

  // Errors are visual-only otherwise — announce them so a screen-reader user
  // knows why the audio stopped.
  useEffect(() => {
    if (errorText) AccessibilityInfo.announceForAccessibility(errorText);
  }, [errorText]);

  // Waiting out the cooldown should pay off with the sound resuming, not the
  // empty "no sound selected yet" screen. When the countdown expires and the
  // blocked reason was a time limit, re-attempt the track the user wanted —
  // but ONLY while Now Playing is the visible route (not behind the paywall
  // modal, not while the app is on some other screen), and never within 12s
  // of the last auto-retry, so a client/server clock-skew re-denial can't
  // bounce loading↔cooldown in a tight loop.
  const lastExpiryRetry = useRef(0);
  useEffect(() => {
    if (currentTrack) {
      lastExpiryRetry.current = 0;
      return;
    }
    if (cooldownEndsAt || isStartingPlayback || pathname !== "/player") return;
    if (denyReason !== "cooldown" && denyReason !== "limit_reached") return;
    if (Date.now() - lastExpiryRetry.current < 12000) return;
    lastExpiryRetry.current = Date.now();
    retryLast();
  }, [cooldownEndsAt, currentTrack, isStartingPlayback, denyReason, pathname, retryLast]);

  // Pop the player — plays the slide-down set on the route (see app/_layout.tsx).
  // Falls back to the tabs root if there's nothing to go back to (e.g. a
  // notification cold-start opened straight into the player). Also forgets any
  // pending denial + its track, so a later unrelated paywall purchase can't
  // decide to auto-resume it.
  const closePlayer = () => {
    clearDenial();
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  if (cooldownEndsAt) {
    // The free-limit stop IS the upgrade moment — lead with the benefit, make
    // the CTA the single anchor, keep the honest countdown readable beneath
    // it, and leave an unmistakable but low-emphasis way out.
    return (
      <WindDownScreen>
        <WindDownTitle>{t("limitTitle")}</WindDownTitle>
        <Text style={{ fontSize: T_SECONDARY, color: colors.muted, textAlign: "center", lineHeight: 19 }}>
          {t("limitBody")}
        </Text>
        <View style={{ width: "100%", marginTop: 6 }}>
          <Button label={t("limitCta")} onPress={() => router.push("/paywall?resume=1")} />
        </View>
        <CooldownClock />
        <TextLink label={t("common:notNow")} onPress={closePlayer} />
      </WindDownScreen>
    );
  }

  if (denyReason === "premium_only") {
    return (
      <WindDownScreen>
        <WindDownTitle>{t("premiumOnlyTitle")}</WindDownTitle>
        <Text style={{ fontSize: T_SECONDARY, color: colors.muted, textAlign: "center", lineHeight: 19 }}>
          {t("premiumReassure")}
        </Text>
        <View style={{ width: "100%", marginTop: 6 }}>
          <Button label={t("common:goPremium")} onPress={() => router.push("/paywall?resume=1")} />
        </View>
        <TextLink label={t("common:notNow")} onPress={closePlayer} />
      </WindDownScreen>
    );
  }

  // A track was tapped and start_playback hasn't answered yet — the same night
  // scene and moon as playback, just still, so it reads as "starting" not as a
  // different (or broken) screen. Never the "no sound selected yet" empty state.
  if (isStartingPlayback && !currentTrack) {
    return (
      <WindDownScreen>
        <View
          style={{ alignItems: "center", gap: 16 }}
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={t("loadingTrack")}
        >
          <MoonBreath size={moonStage - 24} Icon={MoonIcon} still />
          <Text style={{ fontSize: T_SECONDARY, color: colors.muted, textAlign: "center" }}>{t("loadingTrack")}</Text>
        </View>
      </WindDownScreen>
    );
  }

  if (!currentTrack) {
    return (
      <WindDownScreen>
        <WindDownTitle>{t("noTrack")}</WindDownTitle>
        <View style={{ minHeight: 19, justifyContent: "center" }} accessibilityLiveRegion="polite">
          {errorText && (
            <Text style={{ fontSize: T_SECONDARY, color: colors.notice, textAlign: "center", lineHeight: 19 }}>
              {errorText}
            </Text>
          )}
        </View>
        <View style={{ width: "100%", marginTop: 4 }}>
          {canRetry ? (
            <Button label={t("common:retry")} onPress={retryLast} />
          ) : (
            <Button label={t("noTrackCta")} onPress={() => router.replace("/(tabs)")} />
          )}
        </View>
        <TextLink label={t("common:close")} onPress={closePlayer} />
      </WindDownScreen>
    );
  }

  const CategoryIcon = categoryIcon(currentTrack.category, currentTrack.subcategory);

  return (
    <GlowBackground
      variant="nightScene"
      style={{
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: Math.max(insets.top, 20) + 6,
        paddingBottom: Math.max(insets.bottom, 16) + 10,
      }}
    >
      <View testID="player-screen" style={{ flex: 1, width: "100%", maxWidth: CONTENT_MAX_W, alignSelf: "center" }}>
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, alignItems: "center" }}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <StarField />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Pressable
            onPress={closePlayer}
            style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, alignItems: "center", justifyContent: "center" }}
            accessibilityRole="button"
            accessibilityLabel={t("common:close")}
          >
            <ChevronDownIcon size={22} color={colors.muted} />
          </Pressable>
          <LikeButton key={currentTrack.id} trackId={currentTrack.id} />
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 26 }}>
          <View style={{ width: moonStage, height: moonStage, alignItems: "center", justifyContent: "center" }}>
            <MoonBreath size={moonStage} Icon={CategoryIcon} coverUrl={currentTrack.coverUrl} />
          </View>

          <View
            style={{ alignItems: "center", gap: 6 }}
            accessible
            accessibilityRole="header"
            accessibilityLabel={`${t("nowPlayingAccessibilityLabel", { title: currentTrack.title })}. ${categoryLabel(tCatalog, currentTrack.category)}, ${subcategoryLabel(tCatalog, currentTrack.subcategory)}`}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.8, color: colors.accent }}>
              {categoryLabel(tCatalog, currentTrack.category).toLocaleUpperCase(i18n.language)}
            </Text>
            <Text numberOfLines={2} style={{ fontSize: 24, fontWeight: "700", letterSpacing: -0.2, color: colors.text, textAlign: "center" }}>
              {currentTrack.title}
            </Text>
            <Text style={{ fontSize: T_SECONDARY, color: colors.muted }}>{subcategoryLabel(tCatalog, currentTrack.subcategory)}</Text>
          </View>
        </View>

        <View style={{ gap: 18 }}>
          <PlaybackProgress />

          <View style={{ alignItems: "center", gap: 9 }}>
            <FreeLimitHint />
            <AutoArmHint />
            <TimerChips />
            <TimerStatusLine />
          </View>

          <View style={{ alignItems: "center" }}>
            <PlayPauseButton />
          </View>

          <View style={{ minHeight: 20, justifyContent: "center" }} accessibilityLiveRegion="polite">
            {errorText && (
              <Text style={{ textAlign: "center", color: colors.notice, fontSize: T_SECONDARY }}>{errorText}</Text>
            )}
            {canRetry && <TextLink label={t("common:retry")} onPress={retryLast} />}
          </View>
        </View>
      </View>
    </GlowBackground>
  );
}
