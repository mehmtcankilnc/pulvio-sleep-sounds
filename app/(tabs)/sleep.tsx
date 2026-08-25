import { useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import Svg, { Circle, Path } from "react-native-svg";
import DatePicker from "react-native-date-picker";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useThemeColors } from "../../src/hooks/useThemeColors";
import { useSleepSchedule } from "../../src/hooks/useSleepSchedule";
import { useTracks } from "../../src/hooks/useTracks";
import { useSleepTimerStore } from "../../src/store/useSleepTimerStore";
import { armSleepTimer, type TimerOption } from "../../src/lib/player/sleepTimer";
import { categoryIcon } from "../../src/lib/categoryIcon";
import { GlowBackground } from "../../src/components/GlowBackground";
import { ScreenHeader } from "../../src/components/ScreenHeader";
import { BottomSheet } from "../../src/components/BottomSheet";
import { Toggle } from "../../src/components/ui/Toggle";
import { SelectChip } from "../../src/components/ui/SelectChip";
import { Button } from "../../src/components/ui/Button";
import { ChevronRightIcon, CheckIcon, CloudRainIcon, MinusIcon, MoonIcon, PlusIcon, TimerIcon, WindIcon, XIcon } from "../../src/components/icons";
import type { IconProps } from "../../src/components/icons";
import type { Track } from "../../src/types";

// App-wide motion vocabulary (see Button.tsx / SelectChip.tsx / Dock.tsx) —
// reused here rather than inventing a new curve.
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// Every pressable on this screen (RoutineRow, StepperButton, ConfirmButton,
// AdjustButton, TrackPickerRow) used its own copy of this same six lines —
// consolidated once the count reached five. `disabled` is read at call
// time, not tracked reactively, which is correct here: every caller passes
// a fresh closure each render, so a disabled StepperButton simply stops
// re-arming the animation on its next press rather than needing to.
function usePressScale(targetScale: number, duration = 150, disabled = false) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return {
    style,
    onPressIn: () => {
      if (disabled) return;
      scale.value = withTiming(targetScale, { duration, easing: EASE_OUT, reduceMotion: ReduceMotion.System });
    },
    onPressOut: () => {
      scale.value = withTiming(1, { duration, easing: EASE_OUT, reduceMotion: ReduceMotion.System });
    },
  };
}

// The custom sleep-timer stepper's range. Every value it can produce is
// already inside [MIN, MAX] and a multiple of STEP by construction — unlike
// the free-text field this replaced, there's no "invalid entry" state left
// to fail on, silently or otherwise.
const CUSTOM_TIMER_MIN = 5;
const CUSTOM_TIMER_MAX = 180;
const CUSTOM_TIMER_STEP = 5;
const CUSTOM_TIMER_DEFAULT = 60;

function clampToTimerStep(minutes: number) {
  const stepped = Math.round(minutes / CUSTOM_TIMER_STEP) * CUSTOM_TIMER_STEP;
  return Math.min(CUSTOM_TIMER_MAX, Math.max(CUSTOM_TIMER_MIN, stepped));
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatTime(hour: number, minute: number) {
  return `${pad2(hour)}:${pad2(minute)}`;
}

// Next wall-clock occurrence of hour:minute from `now` — today if it hasn't
// passed yet, otherwise tomorrow. Used both for the "Bedtime in Xh Ym" hint
// and would be the same math a real scheduler needs, kept here so the UI
// and any future scheduling logic agree on what "next bedtime" means.
function nextOccurrence(hour: number, minute: number, now: Date): Date {
  const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

function BedtimeArc() {
  const colors = useThemeColors();
  return (
    <Svg width={316} height={118} viewBox="0 0 316 118">
      <Path d="M16 102 Q158 -16 300 102" fill="none" stroke={colors.accent} strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" strokeDasharray="0.5 8" />
      <Circle cx={16} cy={102} r={3.5} fill={colors.accent} opacity={0.6} />
      <Circle cx={300} cy={102} r={3.5} fill={colors.accent} opacity={0.6} />
      <Circle cx={116} cy={50} r={22} fill={colors.glow} />
      <Circle cx={116} cy={50} r={13} fill={colors.moon} />
      <Circle cx={215} cy={34} r={1.3} fill={colors.star} opacity={0.7} />
      <Circle cx={248} cy={58} r={1.1} fill={colors.star} opacity={0.5} />
      <Circle cx={181} cy={18} r={1.2} fill={colors.star} opacity={0.6} />
    </Svg>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// The hero card's one actual control — everything else on it (the arc, the
// two time readouts) is display, not interaction. It was styled as a
// neutral secondary pill (`card` fill, `stroke` border, opacity-only press)
// indistinguishable from decoration; this reuses DESIGN.md's own
// "emphasized ghost pill" recipe (glowSoft fill + accent-colored border,
// the same treatment selected states use elsewhere) so the one pressable
// thing on the card actually reads as pressable.
function AdjustButton({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useThemeColors();
  const press = usePressScale(0.96, 150);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      style={[
        {
          height: 44,
          paddingHorizontal: 20,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.button,
          backgroundColor: colors.glowSoft,
          alignItems: "center",
          justifyContent: "center",
        },
        press.style,
      ]}
    >
      <Text style={{ fontSize: 13.5, fontWeight: "700", color: colors.accent }}>{label}</Text>
    </AnimatedPressable>
  );
}

function RoutineRow({
  icon: Icon,
  title,
  subtitle,
  trailing,
  onPress,
  showDisclosure = true,
  separateTrailing = false,
  trailingInPress = false,
  expanded,
}: {
  icon: (props: IconProps) => JSX.Element;
  title: string;
  subtitle: string;
  trailing: React.ReactNode;
  onPress?: () => void;
  // Rows whose own `trailing` already carries a chevron (Sleep timer) skip
  // the row-level one below instead of showing two.
  showDisclosure?: boolean;
  // For the one row that's both a tappable navigation target (icon/title/
  // subtitle/chevron → opens the track picker) *and* has its own toggle:
  // a vertical hairline splits the two hit zones apart visually, so it
  // reads as "tap here to change the sound, flip this to turn it on/off"
  // instead of one ambiguous block with two controls glued together.
  separateTrailing?: boolean;
  // `trailing` normally sits outside the Pressable (see note below on
  // Toggle rows). But for a row like Sleep timer, where `trailing` is just
  // a plain value + chevron rather than its own control, leaving it outside
  // means tapping directly on "15 min ›" does nothing — the exact spot a
  // user is most likely to press. Set this to fold it inside the same
  // Pressable instead.
  trailingInPress?: boolean;
  // For a row that expands an accordion in place (Sleep timer): the
  // `RotatingChevron` is a visual-only cue for open/closed, so a
  // screen-reader user hears "button" with no signal it revealed content.
  // Undefined (the default) omits `accessibilityState` entirely for rows
  // that don't expand anything.
  expanded?: boolean;
}) {
  const colors = useThemeColors();
  const press = usePressScale(0.98, 150);

  const Content = (
    <>
      <Icon size={20} color={colors.accent} strokeWidth={1.6} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{title}</Text>
        {/* muted, not faint (~3.7:1 on `card`, below the 4.5:1 small-text
            floor) — this line states the row's current setting, read at
            arm's length in the dark; faint stays for purely decorative
            glyphs (chevrons, close icons) elsewhere on this screen. */}
        <Text style={{ fontSize: 11.5, color: colors.muted }}>{subtitle}</Text>
      </View>
    </>
  );

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 2 }}>
      {onPress ? (
        <AnimatedPressable
          onPress={onPress}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          accessibilityRole="button"
          accessibilityState={expanded === undefined ? undefined : { expanded }}
          style={[{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }, press.style]}
        >
          {Content}
          {showDisclosure && <ChevronRightIcon size={15} color={colors.faint} strokeWidth={1.7} />}
          {trailingInPress && trailing}
        </AnimatedPressable>
      ) : (
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>{Content}</View>
      )}
      {/* `faint` solid, not `stroke` (a 14%-alpha tint meant for card
          borders, effectively invisible as a freestanding divider in a dark
          room) — this line's job isn't decoration, it's telling two hit
          zones apart, so it needs to actually be seen. Symmetric spacing
          comes from the row's own `gap`, not a one-sided margin. */}
      {separateTrailing && <View style={{ width: 1.5, height: 24, borderRadius: 999, backgroundColor: colors.faint }} />}
      {!trailingInPress && trailing}
    </View>
  );
}

function Hairline() {
  const colors = useThemeColors();
  return <View style={{ height: 1, backgroundColor: colors.stroke }} />;
}

// Chevron rotates right→down (0°→90°) to double as the accordion's own open
// indicator, so its state reads at a glance without depending on the chips
// underneath it also being visible on screen.
function RotatingChevron({ active, color }: { active: boolean; color: string }) {
  const rotation = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    rotation.value = withTiming(active ? 1 : 0, { duration: 200, easing: EASE_OUT, reduceMotion: ReduceMotion.System });
  }, [active, rotation]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value * 90}deg` }] }));
  return (
    <Animated.View style={style}>
      <ChevronRightIcon size={15} color={color} strokeWidth={1.7} />
    </Animated.View>
  );
}

// Accordion reveal for the timer chip list: content stays mounted (so its
// natural height is always known via onLayout, including before the first
// open) and is masked by an animated `height` on the wrapper — the chips
// themselves never scale or reflow, only the reveal window does.
function AccordionReveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const progress = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: 220, easing: EASE_OUT, reduceMotion: ReduceMotion.System });
  }, [open, progress]);
  const style = useAnimatedStyle(() => ({
    height: measuredHeight * progress.value,
    opacity: progress.value,
  }));
  return (
    <Animated.View style={[{ overflow: "hidden" }, style]} pointerEvents={open ? "auto" : "none"}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0 }} onLayout={(e) => setMeasuredHeight(e.nativeEvent.layout.height)}>
        {children}
      </View>
    </Animated.View>
  );
}

// 44×44 minimum hit target (DESIGN.md §"Touch targets"), even though the
// visible circle is smaller — padding, not a bigger circle, gives the extra
// reach without changing the stepper's visual weight.
function StepperButton({
  icon: Icon,
  disabled,
  onPress,
  accessibilityLabel,
}: {
  icon: (props: IconProps) => JSX.Element;
  disabled: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const colors = useThemeColors();
  const press = usePressScale(0.9, 120, disabled);

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        {
          width: 32,
          height: 32,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        },
        press.style,
      ]}
    >
      <Icon size={16} color={disabled ? colors.faint : colors.accent} strokeWidth={2} />
    </AnimatedPressable>
  );
}

// Replaces the old free-text "Custom" field. Takes over the full row width
// (rather than squeezing +/-/confirm into the 4-chip grid's one ~74px
// column) so every tap target actually clears the 44px minimum.
//
// Every +/- tap still arms the timer immediately (so a value never sits
// half-adjusted with nothing scheduled behind it), but tapping this button
// — or collapsing the whole accordion while this editor is open — also
// explicitly (re-)arms whatever's currently on screen. That makes the
// checkmark's meaning honest again: it really does confirm the value, even
// in the one case that matters most — opening Custom and closing straight
// back out without ever touching +/-, which previously left the *previous*
// selection active instead of the default value the user was looking at.
function ConfirmButton({ onPress, accessibilityLabel }: { onPress: () => void; accessibilityLabel: string }) {
  const colors = useThemeColors();
  const press = usePressScale(0.9, 120);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.button, alignItems: "center", justifyContent: "center" },
        press.style,
      ]}
    >
      <CheckIcon size={16} color={colors.buttonText} strokeWidth={2} />
    </AnimatedPressable>
  );
}

function CustomTimerStepper({
  minutes,
  onChange,
  onConfirm,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("sleep");
  const colors = useThemeColors();

  // A quick scale "tick" acknowledges each +/- tap on the number itself —
  // the same "immediate feedback" duration bucket (100-150ms) as the
  // buttons' own press-scale, so the cause (tap) and its result (new value)
  // read as one connected gesture rather than a button press plus an
  // unrelated instant text swap. Skipped on mount (the value opening at
  // its starting number isn't a "change" to acknowledge).
  const pulse = useSharedValue(1);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    pulse.value = withSequence(
      withTiming(1.12, { duration: 90, easing: EASE_OUT, reduceMotion: ReduceMotion.System }),
      withTiming(1, { duration: 140, easing: EASE_OUT, reduceMotion: ReduceMotion.System })
    );
  }, [minutes, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        height: 44,
        paddingHorizontal: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.button,
        backgroundColor: colors.card,
      }}
    >
      <StepperButton
        icon={MinusIcon}
        disabled={minutes <= CUSTOM_TIMER_MIN}
        onPress={() => onChange(clampToTimerStep(minutes - CUSTOM_TIMER_STEP))}
        accessibilityLabel={t("sleepTimerCustomDecrementLabel")}
      />
      <Animated.Text
        style={[{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: "700", color: colors.text }, pulseStyle]}
      >
        {t("minutesShort", { count: minutes })}
      </Animated.Text>
      <StepperButton
        icon={PlusIcon}
        disabled={minutes >= CUSTOM_TIMER_MAX}
        onPress={() => onChange(clampToTimerStep(minutes + CUSTOM_TIMER_STEP))}
        accessibilityLabel={t("sleepTimerCustomIncrementLabel")}
      />
      <ConfirmButton onPress={onConfirm} accessibilityLabel={t("sleepTimerCustomDoneLabel")} />
    </View>
  );
}

export default function SleepScreen() {
  const { t } = useTranslation("sleep");
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const {
    schedule,
    setBedtime,
    setWakeTime,
    setPlayAtBedtimeEnabled,
    setPlayAtBedtimeTrack,
    setFadeOutEnabled,
    setQuietWakeupEnabled,
  } = useSleepSchedule();

  // setPlayAtBedtimeEnabled/setPlayAtBedtimeTrack/setQuietWakeupEnabled all
  // resolve to `false` when the OS notification permission was denied and
  // the toggle got silently reverted — without this, a user watches a
  // toggle animate on and then snap back off a beat later with no
  // explanation. Shown via the app's own dark BottomSheet, not the native
  // Alert — a bright system dialog is the single most jarring thing this
  // screen could produce in the exact dark-room bedtime moment it fires.
  const [permissionSheetOpen, setPermissionSheetOpen] = useState(false);
  function warnIfPermissionDenied(granted: boolean) {
    if (!granted) setPermissionSheetOpen(true);
  }

  const timerOption = useSleepTimerStore((state) => state.option);
  const [timerPickerOpen, setTimerPickerOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [trackPickerOpen, setTrackPickerOpen] = useState(false);

  // The "Custom" chip is neither of the two fixed presets nor "∞" — whatever
  // minute value is currently armed but doesn't match a preset renders there
  // instead (e.g. the "45m" default from before this screen had a custom
  // option), so the row never shows a preset as unselected while secretly
  // running a different duration.
  const isPresetTimerOption = timerOption === "15m" || timerOption === "30m" || timerOption === "∞";
  const customTimerMinutes = isPresetTimerOption ? null : parseInt(timerOption, 10);
  const [customTimerEditing, setCustomTimerEditing] = useState(false);
  const [stepperMinutes, setStepperMinutes] = useState(CUSTOM_TIMER_DEFAULT);

  function openCustomTimer() {
    setStepperMinutes(customTimerMinutes !== null ? clampToTimerStep(customTimerMinutes) : CUSTOM_TIMER_DEFAULT);
    setCustomTimerEditing(true);
  }

  // Every step arms immediately — see CustomTimerStepper's own comment for
  // why that's what actually closes off the old silent-failure bug, not
  // just a UX preference.
  function changeStepperMinutes(minutes: number) {
    setStepperMinutes(minutes);
    armSleepTimer(`${minutes}m` as TimerOption);
  }

  // Re-arms whatever's currently on screen and exits the stepper. Called
  // both from its own checkmark and from collapsing the whole accordion
  // while it's open (see the Sleep timer row's onPress below) — either way
  // "closing this editor" should confirm what it's currently showing, not
  // silently rely on the last +/- tap having already covered it.
  function confirmCustomTimer() {
    armSleepTimer(`${stepperMinutes}m` as TimerOption);
    setCustomTimerEditing(false);
  }

  // Ticks once a minute so "Bedtime in Xh Ym" stays accurate without
  // re-rendering on every second — nothing here needs finer resolution.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const bedtimeInLabel = useMemo(() => {
    const target = nextOccurrence(schedule.bedtimeHour, schedule.bedtimeMinute, now);
    const totalMinutes = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60_000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const time = hours > 0 ? t("hoursMinutesShort", { hours, minutes }) : t("minutesOnlyShort", { minutes });
    return t("bedtimeInHint", { time });
  }, [schedule.bedtimeHour, schedule.bedtimeMinute, now, t]);

  return (
    <GlowBackground variant="pageWash" style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: tabBarHeight + 24, gap: 16 }}
      >
        <ScreenHeader eyebrow={t("eyebrow")} title={t("title")} />

        <GlowBackground variant="heroCard" style={{ borderRadius: 24, borderWidth: 1, borderColor: colors.stroke, padding: 16, paddingBottom: 14, gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text style={{ fontSize: 10.5, fontWeight: "700", letterSpacing: 1.5, color: colors.accent }}>{t("scheduleOverline")}</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{bedtimeInLabel}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <BedtimeArc />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{formatTime(schedule.bedtimeHour, schedule.bedtimeMinute)}</Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>{t("bedtimeLabel")}</Text>
            </View>
            <AdjustButton label={t("adjustCta")} onPress={() => setAdjustOpen(true)} />
            <View style={{ gap: 1, alignItems: "flex-end" }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>{formatTime(schedule.wakeHour, schedule.wakeMinute)}</Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>{t("wakeUpLabel")}</Text>
            </View>
          </View>
        </GlowBackground>

        <View style={{ gap: 11 }}>
          <Text className="font-bold" style={{ fontSize: 15.5, color: colors.text }}>
            {t("routineTitle")}
          </Text>
          <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
            <RoutineRow
              icon={CloudRainIcon}
              title={schedule.playAtBedtimeTrack ? t("playSceneRowTitleWithTrack", { title: schedule.playAtBedtimeTrack.title }) : t("playSceneRowTitleEmpty")}
              subtitle={t("playSceneRowSubtitle")}
              onPress={() => setTrackPickerOpen(true)}
              separateTrailing
              trailing={
                <Toggle
                  value={schedule.playAtBedtimeEnabled}
                  onValueChange={async () => {
                    if (!schedule.playAtBedtimeTrack) {
                      setTrackPickerOpen(true);
                      return;
                    }
                    warnIfPermissionDenied(await setPlayAtBedtimeEnabled(!schedule.playAtBedtimeEnabled));
                  }}
                  // Own label, not the row's title text — the row title
                  // describes the navigation affordance ("choose a sound"),
                  // but this control enables/disables playback, which a
                  // screen reader needs named as its own action.
                  accessibilityLabel={t("playAtBedtimeToggleLabel")}
                />
              }
            />
            <Hairline />
            <RoutineRow
              icon={TimerIcon}
              title={t("sleepTimerRowTitle")}
              subtitle={timerOption === "∞" ? t("sleepTimerRowSubtitleOff") : t("sleepTimerRowSubtitle", { minutes: timerOption.replace("m", "") })}
              onPress={() => {
                // Collapsing the accordion while the custom stepper is open
                // confirms its current value first — otherwise opening
                // "Custom" and immediately closing the whole row (never
                // touching +/-, never tapping the checkmark) would leave
                // whatever was previously armed active instead of the
                // default value the user was just looking at.
                if (timerPickerOpen && customTimerEditing) confirmCustomTimer();
                setTimerPickerOpen((open) => !open);
              }}
              showDisclosure={false}
              expanded={timerPickerOpen}
              trailingInPress
              trailing={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 12.5, color: colors.muted }}>
                    {timerOption === "∞" ? t("sleepTimerOptionInfinite") : t("minutesShort", { count: Number(timerOption.replace("m", "")) })}
                  </Text>
                  <RotatingChevron active={timerPickerOpen} color={colors.faint} />
                </View>
              }
            />
            <AccordionReveal open={timerPickerOpen}>
              {customTimerEditing ? (
                // Takes the full row width instead of squeezing +/-/done
                // into one ~74px flex column — see CustomTimerStepper's
                // own comment for why.
                <View style={{ paddingBottom: 10, paddingTop: 2 }}>
                  <CustomTimerStepper
                    minutes={stepperMinutes}
                    onChange={changeStepperMinutes}
                    onConfirm={confirmCustomTimer}
                  />
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 8, paddingBottom: 10, paddingTop: 2 }}>
                  <View style={{ flex: 1 }}>
                    <SelectChip
                      label="15m"
                      selected={timerOption === "15m"}
                      onPress={() => {
                        armSleepTimer("15m");
                        setTimerPickerOpen(false);
                      }}
                      height={38}
                      fontSize={12.5}
                      paddingHorizontal={6}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SelectChip
                      label="30m"
                      selected={timerOption === "30m"}
                      onPress={() => {
                        armSleepTimer("30m");
                        setTimerPickerOpen(false);
                      }}
                      height={38}
                      fontSize={12.5}
                      paddingHorizontal={6}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SelectChip
                      label="∞"
                      selected={timerOption === "∞"}
                      onPress={() => {
                        armSleepTimer("∞");
                        setTimerPickerOpen(false);
                      }}
                      height={38}
                      fontSize={12.5}
                      paddingHorizontal={6}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SelectChip
                      label={customTimerMinutes !== null ? `${customTimerMinutes}m` : t("sleepTimerOptionCustom")}
                      selected={customTimerMinutes !== null}
                      onPress={openCustomTimer}
                      height={38}
                      fontSize={12.5}
                      paddingHorizontal={6}
                    />
                  </View>
                </View>
              )}
            </AccordionReveal>
            <Hairline />
            <RoutineRow
              icon={WindIcon}
              title={t("fadeOutRowTitle")}
              subtitle={t("fadeOutRowSubtitle")}
              trailing={<Toggle value={schedule.fadeOutEnabled} onValueChange={() => setFadeOutEnabled(!schedule.fadeOutEnabled)} accessibilityLabel={t("fadeOutRowTitle")} />}
            />
            <Hairline />
            <RoutineRow
              icon={MoonIcon}
              title={t("wakeRowTitle")}
              subtitle={t("wakeRowSubtitle", { time: formatTime(schedule.wakeHour, schedule.wakeMinute) })}
              trailing={
                <Toggle
                  value={schedule.quietWakeupEnabled}
                  onValueChange={async () => {
                    warnIfPermissionDenied(await setQuietWakeupEnabled(!schedule.quietWakeupEnabled));
                  }}
                  accessibilityLabel={t("wakeRowTitle")}
                />
              }
            />
          </View>
        </View>
      </ScrollView>

      <AdjustScheduleModal
        visible={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        bedtimeHour={schedule.bedtimeHour}
        bedtimeMinute={schedule.bedtimeMinute}
        wakeHour={schedule.wakeHour}
        wakeMinute={schedule.wakeMinute}
        onChangeBedtime={setBedtime}
        onChangeWake={setWakeTime}
      />

      <BedtimeTrackPicker
        visible={trackPickerOpen}
        onClose={() => setTrackPickerOpen(false)}
        selectedTrackId={schedule.playAtBedtimeTrack?.id ?? null}
        onPick={async (track) => {
          setTrackPickerOpen(false);
          warnIfPermissionDenied(await setPlayAtBedtimeTrack(track));
        }}
      />

      <PermissionDeniedSheet visible={permissionSheetOpen} onClose={() => setPermissionSheetOpen(false)} />
    </GlowBackground>
  );
}

// Same dark BottomSheet every other dialog on this screen uses, instead of
// the native Alert — see the `warnIfPermissionDenied` comment above for why.
function PermissionDeniedSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation("sleep");
  const colors = useThemeColors();
  return (
    <BottomSheet visible={visible} onClose={onClose} style={{ borderWidth: 1, borderColor: colors.stroke, padding: 20, gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text className="font-bold" style={{ fontSize: 16, color: colors.text }}>
          {t("permissionDeniedTitle")}
        </Text>
        <Text style={{ fontSize: 13.5, color: colors.muted, lineHeight: 19 }}>{t("permissionDeniedMessage")}</Text>
      </View>
      <Button label={t("common:ok")} onPress={onClose} />
    </BottomSheet>
  );
}

function AdjustScheduleModal({
  visible,
  onClose,
  bedtimeHour,
  bedtimeMinute,
  wakeHour,
  wakeMinute,
  onChangeBedtime,
  onChangeWake,
}: {
  visible: boolean;
  onClose: () => void;
  bedtimeHour: number;
  bedtimeMinute: number;
  wakeHour: number;
  wakeMinute: number;
  onChangeBedtime: (hour: number, minute: number) => void;
  onChangeWake: (hour: number, minute: number) => void;
}) {
  const { t } = useTranslation("sleep");
  const colors = useThemeColors();
  // Anchored to *today's* date, not a fixed placeholder like 2000-01-01 —
  // Turkey's UTC offset rule changed in 2016 (DST-based +2/+3 → permanent
  // +3), so a historical date can resolve through a different offset than
  // "now" and come back an hour off (00:00 selected → 01:00 shown). Using
  // today sidesteps any such past/future DST-rule mismatch entirely.
  const anchor = useMemo(() => new Date(), []);
  const bedtimeDate = useMemo(
    () => new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), bedtimeHour, bedtimeMinute),
    [anchor, bedtimeHour, bedtimeMinute]
  );
  const wakeDate = useMemo(
    () => new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), wakeHour, wakeMinute),
    [anchor, wakeHour, wakeMinute]
  );

  // The picker is fed from this local echo, not directly from bedtimeDate/
  // wakeDate — those only update once the debounced write below actually
  // lands, which can happen *while the user is still mid-scroll* (a brief
  // pause between ticks is enough to fire it). Committed state flowing back
  // into a controlled native picker's `date` prop mid-gesture is what was
  // yanking the wheel back to the just-committed value. Local state instead
  // only ever changes because the user scrolled it or the sheet reopened,
  // so it can never fight the user's own gesture.
  const [localBedtime, setLocalBedtime] = useState(bedtimeDate);
  const [localWake, setLocalWake] = useState(wakeDate);

  // Bedtime/wake are a switchable pair, not a forced sequence — a returning
  // user adjusts either one, in either order, as often as nightly, so this
  // is a segmented switch rather than a step-1-then-step-2 wizard. Always
  // reopens on bedtime regardless of how the previous session ended.
  const [step, setStep] = useState<"bedtime" | "wake">("bedtime");

  useEffect(() => {
    if (visible) {
      setStep("bedtime");
      setLocalBedtime(bedtimeDate);
      setLocalWake(wakeDate);
    }
    // Deliberately only reacting to `visible` — bedtimeDate/wakeDate are
    // read for their current value at that moment, not tracked as deps,
    // otherwise every committed write while the sheet is open would reset
    // the local echo right back into the same bug this exists to avoid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // The spinner fires onChange on every row settle while the user is still
  // scrolling — debounced so a fast spin doesn't fire a Supabase write (and
  // a notification re-schedule, see useSleepSchedule) per tick.
  const bedtimeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (bedtimeTimer.current) clearTimeout(bedtimeTimer.current);
      if (wakeTimer.current) clearTimeout(wakeTimer.current);
    };
  }, []);

  function debouncedChangeBedtime(hour: number, minute: number) {
    if (bedtimeTimer.current) clearTimeout(bedtimeTimer.current);
    bedtimeTimer.current = setTimeout(() => onChangeBedtime(hour, minute), 400);
  }

  function debouncedChangeWake(hour: number, minute: number) {
    if (wakeTimer.current) clearTimeout(wakeTimer.current);
    wakeTimer.current = setTimeout(() => onChangeWake(hour, minute), 400);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} style={{ borderWidth: 1, borderColor: colors.stroke, paddingTop: 16, paddingBottom: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 }}>
        <Text className="font-bold" style={{ fontSize: 16, color: colors.text }}>
          {t("adjustSheetTitle")}
        </Text>
        <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
          <XIcon size={20} color={colors.faint} strokeWidth={1.7} />
        </Pressable>
      </View>

      {/* Switches which wheel is showing — not a step indicator. Either can
          be tapped in either order, any number of times, matching how this
          gets used nightly rather than once during setup. */}
      <View style={{ flexDirection: "row", gap: 8, marginHorizontal: 20, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <SelectChip label={t("bedtimeLabel")} selected={step === "bedtime"} onPress={() => setStep("bedtime")} height={40} fontSize={13} />
        </View>
        <View style={{ flex: 1 }}>
          <SelectChip label={t("wakeUpLabel")} selected={step === "wake"} onPress={() => setStep("wake")} height={40} fontSize={13} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        {/* No repeated "Bedtime"/"Wake up" heading here — the tab selected
            above already says exactly that; distill pass removed it. */}
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.stroke, borderRadius: 20, alignItems: "center", paddingVertical: 4 }}>
          {step === "bedtime" ? (
            <DatePicker
              date={localBedtime}
              mode="time"
              theme="dark"
              dividerColor={colors.stroke}
              onDateChange={(date) => {
                setLocalBedtime(date);
                debouncedChangeBedtime(date.getHours(), date.getMinutes());
              }}
            />
          ) : (
            <DatePicker
              date={localWake}
              mode="time"
              theme="dark"
              dividerColor={colors.stroke}
              onDateChange={(date) => {
                setLocalWake(date);
                debouncedChangeWake(date.getHours(), date.getMinutes());
              }}
            />
          )}
        </View>

        <Button label={t("adjustDoneCta")} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

// Same scale-press recipe as every other pressable in the app, plus an
// accent-tinted fill (not just a border swap) so the currently-armed sound
// reads as selected at a glance while scrolling past it, not only when
// stopped directly on it.
function TrackPickerRow({
  track,
  selected,
  onPress,
  premiumLabel,
}: {
  track: Track;
  selected: boolean;
  onPress: () => void;
  premiumLabel: string;
}) {
  const colors = useThemeColors();
  const Icon = categoryIcon(track.category, track.subcategory);
  const press = usePressScale(0.98, 150);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={track.title}
      accessibilityState={{ selected }}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          minHeight: 56,
          paddingHorizontal: 14,
          backgroundColor: selected ? colors.glowSoft : colors.card,
          borderWidth: 1,
          borderColor: selected ? colors.button : colors.stroke,
          borderRadius: 16,
        },
        press.style,
      ]}
    >
      <Icon size={19} color={colors.accent} strokeWidth={1.6} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
          {track.title}
        </Text>
        {track.isPremiumOnly && <Text style={{ fontSize: 11, color: colors.accent }}>{premiumLabel}</Text>}
      </View>
      {selected && <CheckIcon size={17} color={colors.button} strokeWidth={2} />}
    </AnimatedPressable>
  );
}

function BedtimeTrackPicker({
  visible,
  onClose,
  selectedTrackId,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  selectedTrackId: string | null;
  onPick: (track: Track) => void;
}) {
  const { t } = useTranslation("sleep");
  const colors = useThemeColors();
  const { sections, loading, error, refetch } = useTracks();

  return (
    <BottomSheet visible={visible} onClose={onClose} style={{ maxHeight: "75%", paddingTop: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text className="font-bold" style={{ fontSize: 16, color: colors.text }}>
          {t("trackPickerTitle")}
        </Text>
        <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
          <XIcon size={20} color={colors.faint} strokeWidth={1.7} />
        </Pressable>
      </View>
      <Hairline />
      {loading ? (
        <ActivityIndicator color={colors.button} style={{ marginVertical: 24 }} />
      ) : error ? (
        // Was falling through to the empty-catalog copy on a fetch failure
        // (sections stays [] either way) — same error/retry pattern as
        // app/discover.tsx for the same underlying useTracks() call.
        <View style={{ alignItems: "center", gap: 12, marginVertical: 24, paddingHorizontal: 20 }}>
          <Text style={{ textAlign: "center", color: colors.muted, fontSize: 13.5 }}>{t("discover:loadError", { error })}</Text>
          <Button label={t("common:retry")} variant="outline" onPress={refetch} />
        </View>
      ) : sections.length === 0 ? (
        <Text style={{ textAlign: "center", color: colors.muted, fontSize: 13.5, marginVertical: 24 }}>{t("discover:empty")}</Text>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 }}>
          {sections.map((section) => (
            // Mirrors app/discover.tsx's own section headers — same
            // category/subcategory grouping the data already carries, just
            // undone by flattening it before this redesign.
            <View key={section.title} style={{ gap: 8, marginBottom: 18 }}>
              {/* muted, matching DESIGN.md's own Overline role (accent or
                  muted — never faint) and the same small-text contrast fix
                  applied to row subtitles above. */}
              <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 1.3, color: colors.muted }}>
                {section.title.replace(" / ", " · ").toUpperCase()}
              </Text>
              {section.data.map((track) => (
                <TrackPickerRow
                  key={track.id}
                  track={track}
                  selected={track.id === selectedTrackId}
                  onPress={() => onPick(track)}
                  premiumLabel={t("discover:premiumBadge")}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </BottomSheet>
  );
}
