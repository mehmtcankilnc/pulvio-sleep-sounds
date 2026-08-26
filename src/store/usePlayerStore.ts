import { create } from "zustand";
import type { Track } from "../types";
import type { PlaybackDenyReason } from "../types/playback";

type PlayerState = {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  // True from the moment loadAndPlay is called until start_playback resolves
  // (allowed or denied). Distinct from isBuffering, which is the audio engine
  // filling its buffer *after* a track is accepted. Lets Now Playing show a
  // loading state instead of the "no sound selected yet" empty screen during
  // the RPC round-trip.
  isStartingPlayback: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  error: string | null;
  // Faz 4: aktif dinleme oturumu — playback_heartbeat RPC'sinin hangi satırı
  // güncelleyeceğini bilmesi için gerekli.
  sessionId: string | null;
  // Faz 5: backend'in playback'i reddetme sebebi — UI'ın "Premium'a Geç" CTA'sını
  // mı yoksa cooldown geri sayımını mı göstereceğini ayırt etmek için.
  denyReason: PlaybackDenyReason | null;
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsBuffering: (isBuffering: boolean) => void;
  setStartingPlayback: (starting: boolean) => void;
  setElapsed: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  setError: (error: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
  setDenyReason: (reason: PlaybackDenyReason | null) => void;
  reset: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  isBuffering: false,
  isStartingPlayback: false,
  elapsedSeconds: 0,
  durationSeconds: 0,
  error: null,
  sessionId: null,
  denyReason: null,
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsBuffering: (isBuffering) => set({ isBuffering }),
  setStartingPlayback: (starting) => set({ isStartingPlayback: starting }),
  setElapsed: (seconds) => set({ elapsedSeconds: seconds }),
  setDuration: (seconds) => set({ durationSeconds: seconds }),
  setError: (error) => set({ error }),
  setSessionId: (sessionId) => set({ sessionId }),
  setDenyReason: (reason) => set({ denyReason: reason }),
  reset: () =>
    set({
      currentTrack: null,
      isPlaying: false,
      isBuffering: false,
      isStartingPlayback: false,
      elapsedSeconds: 0,
      durationSeconds: 0,
      error: null,
      sessionId: null,
      denyReason: null,
    }),
}));
