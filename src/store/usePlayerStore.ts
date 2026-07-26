import { create } from "zustand";

type PlayerState = {
  currentTrackId: string | null;
  isPlaying: boolean;
  elapsedSeconds: number;
  setTrack: (trackId: string) => void;
  play: () => void;
  pause: () => void;
  tick: (seconds: number) => void;
  reset: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrackId: null,
  isPlaying: false,
  elapsedSeconds: 0,
  setTrack: (trackId) => set({ currentTrackId: trackId, elapsedSeconds: 0 }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  tick: (seconds) =>
    set((state) => ({ elapsedSeconds: state.elapsedSeconds + seconds })),
  reset: () => set({ currentTrackId: null, isPlaying: false, elapsedSeconds: 0 }),
}));
