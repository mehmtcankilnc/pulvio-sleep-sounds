import { create } from "zustand";
import type { TimerOption } from "../lib/player/sleepTimer";

type SleepTimerState = {
  option: TimerOption;
  // epoch ms the fade-out is scheduled to start; null when idle or "∞".
  // Exposed so UI (Now Playing, later Sleep) can render a live countdown.
  endsAt: number | null;
  setOption: (option: TimerOption, endsAt: number | null) => void;
};

export const useSleepTimerStore = create<SleepTimerState>((set) => ({
  option: "45m",
  endsAt: null,
  setOption: (option, endsAt) => set({ option, endsAt }),
}));
