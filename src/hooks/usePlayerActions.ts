import TrackPlayer from "react-native-track-player";
import type { Track } from "../types";
import { usePlayerStore } from "../store/usePlayerStore";
import { useUserStore } from "../store/useUserStore";
import { startPlayback } from "../lib/playback";
import type { PlaybackDenyReason } from "../types/playback";

function denyReasonToMessage(reason: PlaybackDenyReason) {
  switch (reason) {
    case "cooldown":
    case "limit_reached":
      return "Ücretsiz dinleme hakkın bitti, cooldown süresi doluncaya kadar bekle";
    case "premium_only":
      return "Bu ses sadece premium üyelere açık";
    case "track_not_found":
      return "Ses bulunamadı";
    default:
      return "Ses çalınamadı";
  }
}

export function usePlayerActions() {
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setError = usePlayerStore((state) => state.setError);
  const setSessionId = usePlayerStore((state) => state.setSessionId);
  const setDenyReason = usePlayerStore((state) => state.setDenyReason);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);

  async function loadAndPlay(track: Track) {
    try {
      setError(null);
      const result = await startPlayback(track.id);

      if (!result.allowed) {
        setCooldownEndsAt(result.cooldown_ends_at);
        setDenyReason(result.reason);
        setError(denyReasonToMessage(result.reason));
        return;
      }

      setCooldownEndsAt(null);
      setDenyReason(null);
      setCurrentTrack(track);
      setSessionId(result.session_id);
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: track.id,
        url: track.storageUrl,
        title: track.title,
        artist: "Pulvio",
      });
      await TrackPlayer.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ses yüklenemedi");
    }
  }

  async function togglePlayPause() {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }

  async function stopAndReset() {
    await TrackPlayer.reset();
    setCurrentTrack(null);
    setSessionId(null);
    setDenyReason(null);
  }

  return { loadAndPlay, togglePlayPause, stopAndReset };
}
