import { useEffect, useState } from "react";
import { useSleepTimerStore } from "../store/useSleepTimerStore";
import { formatCountdown } from "../lib/time";

type SleepCountdown =
  | { active: false; label: null; progress: 0 }
  | { active: true; label: string; progress: number };

// Live view of the armed sleep timer for Now Playing: a `mm:ss` label and a
// 0→1 `progress` for the depleting ring. Ticks only while a timed schedule is
// actually armed ("∞" and idle are inert). This is a clock, not an animation.
// `tickMs` lets the depleting-ring caller slow its updates right down under
// Reduce Motion (the text-line caller keeps the default 1 Hz — a countdown
// numeral changing is a readout, not vestibular motion).
export function useSleepCountdown(tickMs = 1000): SleepCountdown {
  const option = useSleepTimerStore((s) => s.option);
  const startedAt = useSleepTimerStore((s) => s.startedAt);
  const endsAt = useSleepTimerStore((s) => s.endsAt);
  const pausedRemainingMs = useSleepTimerStore((s) => s.pausedRemainingMs);
  const active = endsAt != null && option !== "∞";
  // Frozen while playback is paused: hold the last value, run no interval.
  const ticking = active && pausedRemainingMs == null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!ticking) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [ticking, endsAt, tickMs]);

  if (!active || endsAt == null) return { active: false, label: null, progress: 0 };

  const span = startedAt != null ? endsAt - startedAt : 0;

  if (pausedRemainingMs != null) {
    const progress = span > 0 ? Math.min(1, Math.max(0, (span - pausedRemainingMs) / span)) : 0;
    return { active: true, label: formatCountdown(pausedRemainingMs), progress };
  }

  const remaining = Math.max(0, endsAt - now);
  const progress = span > 0 ? Math.min(1, Math.max(0, (now - startedAt!) / span)) : 0;
  return { active: true, label: formatCountdown(remaining), progress };
}
