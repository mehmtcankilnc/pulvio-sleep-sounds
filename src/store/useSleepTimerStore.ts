import { create } from "zustand";
import type { TimerOption } from "../lib/player/sleepTimer";

type SleepTimerState = {
  option: TimerOption;
  // epoch ms the countdown began; paired with `endsAt` so the UI can render a
  // depleting ring (needs the full span, not just the end). null when idle/"∞".
  startedAt: number | null;
  // epoch ms the fade-out is scheduled to start; null when idle or "∞".
  // Exposed so UI (Now Playing, later Sleep) can render a live countdown.
  endsAt: number | null;
  // epoch ms the timer actually fired and stopped playback. Lets Now Playing
  // say "timer ended — playback stopped" instead of reverting to the idle
  // hint over silence. Cleared whenever a timer is (re-)armed or cancelled.
  firedAt: number | null;
  // Set once, the first time playback silently auto-arms a timer, so Now
  // Playing can disclose "Timer set — 45m. Change below." exactly once per
  // install. Cleared on any explicit (re-)arm or cancel.
  autoArmHint: { at: number; option: TimerOption } | null;
  // ms left on the countdown at the moment playback was paused. While this is
  // set the timer is frozen: the schedule is cleared and the UI shows this
  // value instead of ticking against `endsAt`. `endsAt`/`startedAt` are kept
  // (for the depleting-ring span) but stale until resume recomputes them.
  pausedRemainingMs: number | null;
  setOption: (option: TimerOption, endsAt: number | null, startedAt?: number | null) => void;
  markFired: () => void;
  flagAutoArmHint: (option: TimerOption) => void;
  pauseCountdown: (remainingMs: number) => void;
  resumeCountdown: (endsAt: number, startedAt: number) => void;
};

export const useSleepTimerStore = create<SleepTimerState>((set) => ({
  option: "45m",
  startedAt: null,
  endsAt: null,
  firedAt: null,
  autoArmHint: null,
  pausedRemainingMs: null,
  setOption: (option, endsAt, startedAt = null) =>
    set({ option, endsAt, startedAt, firedAt: null, autoArmHint: null, pausedRemainingMs: null }),
  markFired: () => set({ firedAt: Date.now() }),
  flagAutoArmHint: (option) => set({ autoArmHint: { at: Date.now(), option } }),
  pauseCountdown: (remainingMs) => set({ pausedRemainingMs: remainingMs }),
  resumeCountdown: (endsAt, startedAt) => set({ endsAt, startedAt, pausedRemainingMs: null }),
}));
