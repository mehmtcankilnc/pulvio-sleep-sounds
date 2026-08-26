import { useEffect, useState } from "react";
import { useUserStore } from "../store/useUserStore";
import { formatCountdown } from "../lib/time";

// cooldownEndsAt backend'den gelen sabit bir hedef zaman damgasıdır — bu hook
// sadece o hedefe kalan farkı gösterir, cooldown süresini ÜRETMEZ. Süre
// dolunca store'u temizler; gerçek yetkilendirme yine de bir sonraki
// startPlayback çağrısında backend'de ayrıca doğrulanır.
export function useCooldownCountdown() {
  const cooldownEndsAt = useUserStore((state) => state.cooldownEndsAt);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!cooldownEndsAt) {
      setLabel(null);
      return;
    }

    const targetMs = new Date(cooldownEndsAt).getTime();

    function tick() {
      const remaining = targetMs - Date.now();
      if (remaining <= 0) {
        setCooldownEndsAt(null);
        setLabel(null);
        return;
      }
      setLabel(formatCountdown(remaining));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownEndsAt, setCooldownEndsAt]);

  return label;
}
