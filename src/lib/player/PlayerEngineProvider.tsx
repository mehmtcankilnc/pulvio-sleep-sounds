import { useEffect } from "react";
import type { AudioStatus } from "expo-audio";
import { getPlayer, configureAudioMode } from "./engine";
import { restoreSleepTimerOption } from "./sleepTimer";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useListeningHeartbeat } from "../../hooks/useListeningHeartbeat";
import { usePlayerActions } from "../../hooks/usePlayerActions";

// app/_layout.tsx içinde bir kez, root'ta mount edilir. Ekranlar arası
// geçişlerde unmount olmaz, bu yüzden arka planda/sekme değişse de
// elapsed/duration/isPlaying takibi kesilmez.
export function PlayerEngineProvider() {
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setIsBuffering = usePlayerStore((state) => state.setIsBuffering);
  const setElapsed = usePlayerStore((state) => state.setElapsed);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const { stopAndReset } = usePlayerActions();

  useListeningHeartbeat();

  useEffect(() => {
    configureAudioMode();
    restoreSleepTimerOption();
  }, []);

  useEffect(() => {
    const subscription = getPlayer().addListener("playbackStatusUpdate", (status: AudioStatus) => {
      setIsPlaying(status.playing);
      setIsBuffering(status.isBuffering);
      setElapsed(status.currentTime);
      setDuration(status.duration);

      // Track finished playing to the end on its own (no loop configured) —
      // clear it so the mini-player/tab bar don't keep showing a stale
      // "now playing" row indefinitely.
      if (status.didJustFinish) {
        stopAndReset();
      }
    });
    return () => subscription.remove();
  }, [setIsPlaying, setIsBuffering, setElapsed, setDuration, stopAndReset]);

  return null;
}
