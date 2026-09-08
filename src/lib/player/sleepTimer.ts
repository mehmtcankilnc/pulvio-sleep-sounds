import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPlayer } from "./engine";
import { useSleepTimerStore } from "../../store/useSleepTimerStore";
import { usePlayerStore } from "../../store/usePlayerStore";

const STORAGE_KEY = "pulvio_sleep_timer_option";
// The armed schedule's wall-clock bounds, persisted alongside the option so a
// countdown survives the JS runtime being killed while audio keeps playing in
// the Android foreground service. `{ endsAt, startedAt }` epoch-ms, or absent
// when idle / "∞". Restored (and re-armed) by restoreSleepTimerOption.
const RUN_STATE_KEY = "pulvio_sleep_timer_run";
// The persisted run state also carries `pausedRemainingMs` when playback was
// paused mid-countdown, so a relaunch restores a frozen timer rather than one
// that kept counting while nothing played.
const AUTOARM_DISCLOSED_KEY = "pulvio_autoarm_disclosed";
// Lazily hydrated cache of the AUTOARM_DISCLOSED_KEY flag.
let autoArmDisclosed: boolean | null = null;

// The preset chips. Both Now Playing (app/player.tsx) and the Sleep tab's
// routine row (app/(tabs)/sleep.tsx) render these plus a "custom" stepper —
// all paths funnel into the same `TimerOption` shape below, so any "Nm"
// string works regardless of which screen armed it.
export const TIMER_OPTIONS = ["15m", "30m", "45m", "∞"] as const;
export type TimerOption = `${number}m` | "∞";

export function isTimerOption(value: string): value is TimerOption {
  return value === "∞" || /^[1-9]\d*m$/.test(value);
}

function optionMinutes(option: Exclude<TimerOption, "∞">): number {
  return parseInt(option, 10);
}

const FADE_DURATION_MS = 15_000;
const FADE_STEPS = 30;

let stopTimeout: ReturnType<typeof setTimeout> | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;

// Read lazily at the moment the timer actually fires, not captured at arm
// time — so flipping Sleep's "Gentle fade-out" toggle mid-countdown affects
// an already-armed timer without needing to re-arm it. Set by
// useSleepSchedule whenever `fade_out_enabled` loads/changes; defaults to
// the fade behavior this feature always had before the toggle existed.
let fadeEnabled = true;

export function setSleepTimerFadeEnabled(enabled: boolean) {
  fadeEnabled = enabled;
}

function clearScheduled() {
  if (stopTimeout) {
    clearTimeout(stopTimeout);
    stopTimeout = null;
  }
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }
}

function persistRunState(endsAt: number | null, startedAt: number | null, pausedRemainingMs: number | null = null) {
  if (endsAt == null || startedAt == null) {
    AsyncStorage.removeItem(RUN_STATE_KEY).catch(() => {});
    return;
  }
  AsyncStorage.setItem(RUN_STATE_KEY, JSON.stringify({ endsAt, startedAt, pausedRemainingMs })).catch(() => {});
}

// Freeze the countdown when playback pauses: drop the pending fade/stop and
// stash the time that was left. No-op when nothing is armed, on "∞", after
// the timer already fired, or when it's already frozen.
export function pauseSleepTimer() {
  const s = useSleepTimerStore.getState();
  if (s.endsAt == null || s.option === "∞" || s.pausedRemainingMs != null || s.firedAt != null) return;
  clearScheduled();
  const remaining = Math.max(0, s.endsAt - Date.now());
  s.pauseCountdown(remaining);
  persistRunState(s.endsAt, s.startedAt, remaining);
}

// Resume a frozen countdown: re-anchor `endsAt` to now + the time that was
// left (shifting `startedAt` by the same amount so the ring's span is
// unchanged) and re-arm the fade/stop.
export function resumeSleepTimer() {
  const s = useSleepTimerStore.getState();
  if (s.pausedRemainingMs == null || s.endsAt == null || s.startedAt == null) return;
  const span = Math.max(0, s.endsAt - s.startedAt);
  const newEndsAt = Date.now() + s.pausedRemainingMs;
  const newStartedAt = newEndsAt - span;
  s.resumeCountdown(newEndsAt, newStartedAt);
  persistRunState(newEndsAt, newStartedAt);
  scheduleStopAt(newEndsAt, newStartedAt);
}

// Schedules the fade + stop for a timer whose bounds are already known —
// shared by a fresh arm and by restoreSleepTimerOption re-arming a timer that
// was mid-countdown when the JS runtime died. `fadeEnabled` is still read at
// fire time (see the module comment on it), not captured here.
function scheduleStopAt(endsAt: number, startedAt: number) {
  clearScheduled();
  const now = Date.now();
  const spanMs = Math.max(0, endsAt - startedAt);
  const fadeDurationMs = Math.min(FADE_DURATION_MS, spanMs / 2);
  const msUntilFadeStart = endsAt - fadeDurationMs - now;

  if (endsAt <= now) {
    // Elapsed while the app was dead — stop now and mark it fired so the UI
    // shows "timer ended" rather than a stale live countdown.
    stopImmediately();
    return;
  }
  if (msUntilFadeStart <= 0) {
    // Already inside the fade window: fade over whatever time is left.
    if (fadeEnabled) runFade(endsAt - now);
    else stopImmediately();
    return;
  }
  stopTimeout = setTimeout(() => {
    if (fadeEnabled) runFade(fadeDurationMs);
    else stopImmediately();
  }, msUntilFadeStart);
}

function stopImmediately() {
  const player = getPlayer();
  player.pause();
  player.volume = 1;
  persistRunState(null, null);
  // Order matters: setOption clears firedAt, then markFired stamps it — so the
  // UI can distinguish "timer ran out and stopped playback" from "idle".
  useSleepTimerStore.getState().setOption(useSleepTimerStore.getState().option, null, null);
  useSleepTimerStore.getState().markFired();
}

function runFade(fadeDurationMs: number) {
  const player = getPlayer();
  let step = 0;
  fadeInterval = setInterval(() => {
    step += 1;
    player.volume = Math.max(0, 1 - step / FADE_STEPS);
    if (step >= FADE_STEPS) {
      if (fadeInterval) clearInterval(fadeInterval);
      fadeInterval = null;
      stopImmediately();
    }
  }, fadeDurationMs / FADE_STEPS);
}

// Exported so a hard stop that isn't the sleep timer — e.g. the free-limit
// lockout interrupting playback — can still leave on the same gentle fade
// rather than an abrupt cut. Clears any pending sleep-timer schedule first so
// the two fades can't run against each other.
export function fadeOutAndPause(fadeDurationMs: number = 1200) {
  clearScheduled();
  runFade(fadeDurationMs);
}

// Arms the sleep timer against whatever is playing right now — called when
// the user taps a timer chip in Now Playing. "∞" cancels any pending fade
// without touching the persisted option (there's nothing to schedule).
export function armSleepTimer(option: TimerOption) {
  clearScheduled();
  AsyncStorage.setItem(STORAGE_KEY, option).catch(() => {});

  if (option === "∞") {
    persistRunState(null, null);
    useSleepTimerStore.getState().setOption(option, null, null);
    return;
  }

  const totalMs = optionMinutes(option) * 60 * 1000;
  const startedAt = Date.now();
  const endsAt = startedAt + totalMs;
  useSleepTimerStore.getState().setOption(option, endsAt, startedAt);
  persistRunState(endsAt, startedAt);

  // Fade starts FADE_DURATION_MS before the target mark so the last moment
  // of audio is the tail of the fade, not an abrupt cut. Always scheduled
  // regardless of the fade toggle — `fadeEnabled` is read fresh when it
  // actually fires (see the module comment above), so a toggle flipped
  // mid-countdown still applies to this timer.
  scheduleStopAt(endsAt, startedAt);

  // Arming while playback is paused (the user picked a preset on a paused
  // player) should start the timer frozen too — it begins counting when
  // they hit play, same as a timer that was armed while playing and then
  // paused.
  if (!usePlayerStore.getState().isPlaying) pauseSleepTimer();
}

// Same as armSleepTimer, but for the case where playback *silently* armed a
// timer the user didn't tap for (see usePlayerActions.loadAndPlay). The first
// time this happens on an install it flags a one-time disclosure hint so Now
// Playing can tell the user a timer was set. "∞" arms nothing and discloses
// nothing.
export function armSleepTimerAuto(option: TimerOption) {
  armSleepTimer(option);
  if (option === "∞") return;
  if (autoArmDisclosed === null) {
    AsyncStorage.getItem(AUTOARM_DISCLOSED_KEY)
      .then((v) => {
        autoArmDisclosed = v === "1";
        if (!autoArmDisclosed) discloseAutoArm(option);
      })
      .catch(() => {});
    return;
  }
  if (!autoArmDisclosed) discloseAutoArm(option);
}

function discloseAutoArm(option: TimerOption) {
  autoArmDisclosed = true;
  AsyncStorage.setItem(AUTOARM_DISCLOSED_KEY, "1").catch(() => {});
  useSleepTimerStore.getState().flagAutoArmHint(option);
}

// Cancels any pending fade/stop without changing the persisted option —
// call this whenever playback itself stops or switches tracks, so a stale
// schedule from the previous session can't fire against silence or the
// wrong track.
export function cancelSleepTimer() {
  clearScheduled();
  persistRunState(null, null);
  const { option } = useSleepTimerStore.getState();
  useSleepTimerStore.getState().setOption(option, null, null);
}

// Hydrates the persisted option once at app start (PlayerEngineProvider).
// If a timed countdown was still running when the JS runtime was last killed
// — which happens routinely on Android when the process is reaped while audio
// keeps playing in the foreground service — its wall-clock bounds are restored
// and the fade/stop is re-scheduled for the time that's actually left, so the
// timer still fires (and Now Playing still shows a live countdown) instead of
// silently going dead with the preset chip stuck "selected". An `endsAt`
// already in the past stops playback now and shows the "timer ended" state.
export async function restoreSleepTimerOption() {
  const [stored, runRaw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEY),
    AsyncStorage.getItem(RUN_STATE_KEY),
  ]);
  const option = isTimerOption(stored ?? "") ? (stored as TimerOption) : "45m";

  let endsAt: number | null = null;
  let startedAt: number | null = null;
  let pausedRemainingMs: number | null = null;
  if (runRaw && option !== "∞") {
    try {
      const parsed = JSON.parse(runRaw) as { endsAt?: unknown; startedAt?: unknown; pausedRemainingMs?: unknown };
      if (typeof parsed.endsAt === "number" && typeof parsed.startedAt === "number") {
        endsAt = parsed.endsAt;
        startedAt = parsed.startedAt;
      }
      if (typeof parsed.pausedRemainingMs === "number") pausedRemainingMs = parsed.pausedRemainingMs;
    } catch {
      // Corrupt value — fall through to the idle restore below.
    }
  }

  if (endsAt != null && startedAt != null) {
    if (pausedRemainingMs != null && pausedRemainingMs > 0) {
      // Was paused when the runtime died — restore it frozen. The
      // isPlaying effect in PlayerEngineProvider resumes it if audio is
      // actually running again.
      useSleepTimerStore.getState().setOption(option, endsAt, startedAt);
      useSleepTimerStore.getState().pauseCountdown(pausedRemainingMs);
      persistRunState(endsAt, startedAt, pausedRemainingMs);
      return;
    }
    if (endsAt > Date.now()) {
      useSleepTimerStore.getState().setOption(option, endsAt, startedAt);
      scheduleStopAt(endsAt, startedAt);
      return;
    }
  }

  persistRunState(null, null);
  useSleepTimerStore.getState().setOption(option, null, null);
}
