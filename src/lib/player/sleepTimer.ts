import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPlayer } from "./engine";
import { useSleepTimerStore } from "../../store/useSleepTimerStore";

const STORAGE_KEY = "pulvio_sleep_timer_option";

// Now Playing's preset row (app/player.tsx) still reads this fixed list.
// Sleep tab's routine row (app/(tabs)/sleep.tsx) has its own smaller preset
// set plus a free-entry "custom" option — both funnel into the same
// `TimerOption` shape below, so any "Nm" string works regardless of which
// screen armed it.
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

function stopImmediately() {
  const player = getPlayer();
  player.pause();
  player.volume = 1;
  useSleepTimerStore.getState().setOption(useSleepTimerStore.getState().option, null);
}

function fadeOutAndPause(fadeDurationMs: number) {
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

// Arms the sleep timer against whatever is playing right now — called when
// the user taps a timer chip in Now Playing. "∞" cancels any pending fade
// without touching the persisted option (there's nothing to schedule).
export function armSleepTimer(option: TimerOption) {
  clearScheduled();
  AsyncStorage.setItem(STORAGE_KEY, option).catch(() => {});

  if (option === "∞") {
    useSleepTimerStore.getState().setOption(option, null);
    return;
  }

  const totalMs = optionMinutes(option) * 60 * 1000;
  const endsAt = Date.now() + totalMs;
  useSleepTimerStore.getState().setOption(option, endsAt);

  // Fade starts FADE_DURATION_MS before the target mark so the last moment
  // of audio is the tail of the fade, not an abrupt cut. Always scheduled
  // at this single point regardless of the fade toggle — `fadeEnabled` is
  // read fresh when it actually fires (see the module comment above), so a
  // toggle flipped mid-countdown still applies to this timer.
  const fadeDurationMs = Math.min(FADE_DURATION_MS, totalMs / 2);
  const msUntilFadeStart = Math.max(0, totalMs - fadeDurationMs);
  stopTimeout = setTimeout(() => {
    if (fadeEnabled) fadeOutAndPause(fadeDurationMs);
    else stopImmediately();
  }, msUntilFadeStart);
}

// Cancels any pending fade/stop without changing the persisted option —
// call this whenever playback itself stops or switches tracks, so a stale
// schedule from the previous session can't fire against silence or the
// wrong track.
export function cancelSleepTimer() {
  clearScheduled();
  const { option } = useSleepTimerStore.getState();
  useSleepTimerStore.getState().setOption(option, null);
}

// Hydrates the persisted option once at app start (PlayerEngineProvider).
// Never arms a schedule on its own — restoring the app shouldn't silently
// start a countdown against nothing playing.
export async function restoreSleepTimerOption() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const option = isTimerOption(stored ?? "") ? (stored as TimerOption) : "45m";
  useSleepTimerStore.getState().setOption(option, null);
}
