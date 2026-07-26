import { useEffect, useRef } from "react";
import TrackPlayer from "react-native-track-player";
import { usePlayerStore } from "../store/usePlayerStore";
import { useUserStore } from "../store/useUserStore";
import { sendHeartbeat } from "../lib/playback";

const HEARTBEAT_INTERVAL_MS = 15000;

// PlayerEngineProvider içinden çağrılır. isPlaying true olduğu sürece 15
// saniyede bir backend'e duvar-saati farkını raporlar; backend limiti/cooldown'ı
// aşıldığını söylerse çalmayı durdurur. Duraklatılan süre sayılmasın diye
// isPlaying false olduğunda referans zaman sıfırlanır.
export function useListeningHeartbeat() {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const sessionId = usePlayerStore((state) => state.sessionId);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setSessionId = usePlayerStore((state) => state.setSessionId);
  const setError = usePlayerStore((state) => state.setError);
  const setDenyReason = usePlayerStore((state) => state.setDenyReason);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying || !sessionId) {
      lastTickRef.current = null;
      return;
    }

    lastTickRef.current = Date.now();

    const interval = setInterval(async () => {
      const now = Date.now();
      const secondsElapsed = lastTickRef.current
        ? Math.round((now - lastTickRef.current) / 1000)
        : 0;
      lastTickRef.current = now;

      try {
        const result = await sendHeartbeat(sessionId, secondsElapsed);
        if (!result.allowed) {
          await TrackPlayer.pause();
          await TrackPlayer.reset();
          setCurrentTrack(null);
          setSessionId(null);
          setDenyReason(result.reason);
          setCooldownEndsAt(result.cooldown_ends_at);
          if (result.reason !== "cooldown" && result.reason !== "limit_reached") {
            setError("Dinleme oturumu sonlandı");
          }
        }
      } catch {
        // Ağ hatası — sessizce geç, bir sonraki heartbeat'te tekrar denenir.
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPlaying, sessionId, setCurrentTrack, setSessionId, setDenyReason, setCooldownEndsAt, setError]);
}
