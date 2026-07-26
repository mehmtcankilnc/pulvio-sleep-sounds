import { useEffect } from "react";
import { State, usePlaybackState, useProgress } from "react-native-track-player";
import { setupPlayer } from "./setup";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useListeningHeartbeat } from "../../hooks/useListeningHeartbeat";

// app/_layout.tsx içinde bir kez, root'ta mount edilir. Ekranlar arası
// geçişlerde unmount olmaz, bu yüzden arka planda/sekme değişse de
// elapsed/duration/isPlaying takibi kesilmez.
export function PlayerEngineProvider() {
  const playbackState = usePlaybackState();
  const progress = useProgress(1000);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setIsBuffering = usePlayerStore((state) => state.setIsBuffering);
  const setElapsed = usePlayerStore((state) => state.setElapsed);
  const setDuration = usePlayerStore((state) => state.setDuration);

  useListeningHeartbeat();

  useEffect(() => {
    setupPlayer();
  }, []);

  useEffect(() => {
    setIsPlaying(playbackState.state === State.Playing);
    setIsBuffering(
      playbackState.state === State.Buffering || playbackState.state === State.Loading
    );
  }, [playbackState.state, setIsPlaying, setIsBuffering]);

  useEffect(() => {
    setElapsed(progress.position);
    setDuration(progress.duration);
  }, [progress.position, progress.duration, setElapsed, setDuration]);

  return null;
}
