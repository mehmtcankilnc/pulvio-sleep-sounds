import AsyncStorage from "@react-native-async-storage/async-storage";
import TrackPlayer from "react-native-track-player";
import { useSleepTimerStore } from "../../store/useSleepTimerStore";

const STORAGE_KEY = "pulvio_sleep_timer_option";

export const TIMER_OPTIONS = ["15m", "30m", "45m", "∞"] as const;
export type TimerOption = (typeof TIMER_OPTIONS)[number];

const OPTION_SECONDS: Record<Exclude<TimerOption, "∞">, number> = {
  "15m": 15 * 60,
  "30m": 30 * 60,
  "45m": 45 * 60,
};

const FADE_DURATION_MS = 15_000;
const FADE_STEPS = 30;

let stopTimeout: ReturnType<typeof setTimeout> | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;

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

function fadeOutAndPause(fadeDurationMs: number) {
  let step = 0;
  fadeInterval = setInterval(() => {
    step += 1;
    const volume = Math.max(0, 1 - step / FADE_STEPS);
    TrackPlayer.setVolume(volume).catch(() => {});
    if (step >= FADE_STEPS) {
      if (fadeInterval) clearInterval(fadeInterval);
      fadeInterval = null;
      TrackPlayer.pause()
        .catch(() => {})
        .finally(() => {
          TrackPlayer.setVolume(1).catch(() => {});
        });
      useSleepTimerStore.getState().setOption(useSleepTimerStore.getState().option, null);
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

  const totalMs = OPTION_SECONDS[option] * 1000;
  const endsAt = Date.now() + totalMs;
  useSleepTimerStore.getState().setOption(option, endsAt);

  // Fade starts FADE_DURATION_MS before the target mark so the last moment
  // of audio is the tail of the fade, not an abrupt cut.
  const fadeDurationMs = Math.min(FADE_DURATION_MS, totalMs / 2);
  const msUntilFadeStart = Math.max(0, totalMs - fadeDurationMs);
  stopTimeout = setTimeout(() => fadeOutAndPause(fadeDurationMs), msUntilFadeStart);
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
  const option = (TIMER_OPTIONS as readonly string[]).includes(stored ?? "")
    ? (stored as TimerOption)
    : "45m";
  useSleepTimerStore.getState().setOption(option, null);
}
