import { useEffect } from "react";
import type { AudioStatus } from "expo-audio";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { getPlayer, configureAudioMode } from "./engine";
import { restoreSleepTimerOption } from "./sleepTimer";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useListeningHeartbeat } from "../../hooks/useListeningHeartbeat";
import { usePlayerActions } from "../../hooks/usePlayerActions";
import { fetchTrackById } from "../../hooks/useTracks";

// app/_layout.tsx içinde bir kez, root'ta mount edilir. Ekranlar arası
// geçişlerde unmount olmaz, bu yüzden arka planda/sekme değişse de
// elapsed/duration/isPlaying takibi kesilmez.
export function PlayerEngineProvider() {
  const router = useRouter();
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const setIsBuffering = usePlayerStore((state) => state.setIsBuffering);
  const setElapsed = usePlayerStore((state) => state.setElapsed);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const { stopAndReset, loadAndPlay } = usePlayerActions();

  useListeningHeartbeat();

  useEffect(() => {
    configureAudioMode();
    restoreSleepTimerOption();
  }, []);

  // Neither the bedtime-play nor quiet-wakeup notification (sleepNotifications.ts)
  // can auto-play audio in the background — they're tap-to-open. Only
  // bedtime-play carries a payload (a trackId); tapping it opens Now
  // Playing and starts that track. This listener also catches a tap that
  // launched the app from a cold start (addNotificationResponseReceivedListener
  // fires for that case too, not just while already running).
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data as { type?: string; trackId?: string } | undefined;
      if (data?.type !== "bedtime-play" || !data.trackId) return;
      const track = await fetchTrackById(data.trackId);
      if (!track) return;
      router.push("/player");
      loadAndPlay(track);
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subscription = getPlayer().addListener("playbackStatusUpdate", (status: AudioStatus) => {
      setIsPlaying(status.playing);
      setIsBuffering(status.isBuffering);
      setElapsed(status.currentTime);
      setDuration(status.duration);

      // The player loops every track (engine.ts), so this shouldn't fire
      // during normal playback — repeat-one keeps ExoPlayer/AVPlayer from
      // ever reaching a true "ended" state. Kept as a defensive fallback (a
      // load error or an unexpected state) so a track that DOES fully stop
      // clears itself instead of leaving a stale "now playing" row in the
      // mini-player/tab bar indefinitely.
      if (status.didJustFinish) {
        stopAndReset();
      }
    });
    return () => subscription.remove();
  }, [setIsPlaying, setIsBuffering, setElapsed, setDuration, stopAndReset]);

  return null;
}
