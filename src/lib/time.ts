// Shared countdown/clock formatting for the cooldown lockout and the sleep
// timer readout — one formatter so "29:41" looks identical wherever it shows.

// mm:ss, or h:mm:ss past the hour. Rounds up so a live countdown never
// flashes 0:00 while there is still a fraction of a second left.
export function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// mm:ss from a whole-seconds position — for the playback elapsed/total
// readout, which counts up and never needs an hour field for this catalog.
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}
