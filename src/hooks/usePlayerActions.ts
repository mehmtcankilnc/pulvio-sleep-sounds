import type { Track } from "../types";
import { usePlayerStore } from "../store/usePlayerStore";
import { useUserStore } from "../store/useUserStore";
import { startPlayback } from "../lib/playback";
import { armSleepTimerAuto, cancelSleepTimer, fadeOutAndPause } from "../lib/player/sleepTimer";
import { useSleepTimerStore } from "../store/useSleepTimerStore";
import { getPlayer, setLockScreenTrack, clearLockScreenTrack } from "../lib/player/engine";
import type { PlaybackDenyReason } from "../types/playback";

// `error` in usePlayerStore now carries a STABLE CODE, not a display string,
// so app/player.tsx can localize it (`t("error.<code>")`) instead of shipping
// one language's sentence to six locales. Playback *denials* (cooldown /
// premium) don't go through here at all — they have dedicated screens keyed
// off `denyReason` / `cooldownEndsAt`.
type PlayerErrorCode = "loadFailed" | "trackUnavailable" | "sessionEnded";

// The last track passed to loadAndPlay — so a "That sound wouldn't load"
// notice can offer a real "Try again" without the screen having to hold onto
// a track it never got to set as current.
let lastAttempt: Track | null = null;

// Bumped on every loadAndPlay call. A slow first request whose result comes
// back after a second tap started a newer load must not win — it checks its
// captured generation before touching any state (rapid track-switch guard).
let loadGeneration = 0;

// This hook takes NO reactive store slices — every field it needs is read
// through `getState()` at call time. So calling it (e.g. for `retryLast`)
// never subscribes the caller to re-renders; that matters because
// PlayerScreen is otherwise carefully kept off the high-frequency render path.
export function usePlayerActions() {
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setError = usePlayerStore((state) => state.setError);
  const setSessionId = usePlayerStore((state) => state.setSessionId);
  const setDenyReason = usePlayerStore((state) => state.setDenyReason);
  const setStartingPlayback = usePlayerStore((state) => state.setStartingPlayback);
  const setCooldownEndsAt = useUserStore((state) => state.setCooldownEndsAt);

  async function loadAndPlay(track: Track) {
    const gen = ++loadGeneration;
    lastAttempt = track;
    try {
      setError(null);
      // Covers the whole start_playback round-trip so Now Playing shows a
      // loading state, not the empty "no sound selected yet" screen, while
      // the RPC decides allowed/denied.
      setStartingPlayback(true);
      const result = await startPlayback(track.id);
      if (gen !== loadGeneration) return; // a newer load superseded this one

      if (!result.allowed) {
        setCooldownEndsAt(result.cooldown_ends_at);
        setDenyReason(result.reason);
        // A "not found" is a real error the user can't recover from by
        // waiting; the rest have their own reassurance screens and want no
        // notice stacked on top.
        setError(result.reason === "track_not_found" ? "trackUnavailable" : null);
        // The screen has just swapped to a lockout / reassurance state —
        // don't leave the *previous* track playing underneath it. Leave on
        // the same gentle fade the sleep timer uses, not an abrupt cut, and
        // null the sleep-timer store so no ghost countdown / ring survives.
        if (usePlayerStore.getState().isPlaying) fadeOutAndPause();
        cancelSleepTimer();
        return;
      }

      setCooldownEndsAt(null);
      setDenyReason(null);
      setCurrentTrack(track);
      setSessionId(result.session_id);
      // Arm the sleep timer against THIS track with whatever option is
      // currently selected (persisted default "45m"), so Now Playing shows a
      // live countdown + depleting ring from the first second instead of a
      // dormant chip. `Auto` variant discloses this once per install. "∞"
      // arms nothing. Also clears any schedule left from the previous track.
      armSleepTimerAuto(useSleepTimerStore.getState().option);

      const player = getPlayer();
      player.replace({ uri: track.storageUrl });
      player.play();
      setLockScreenTrack({ title: track.title, artist: "Pulvio", artworkUrl: track.coverUrl });
    } catch {
      if (gen === loadGeneration) setError("loadFailed" satisfies PlayerErrorCode);
    } finally {
      // Only the newest load owns the loading flag — a stale first request
      // must not flip the screen out of "loading" while the real one runs.
      if (gen === loadGeneration) setStartingPlayback(false);
    }
  }

  // Re-run the most recent load. No-op if nothing has been attempted yet.
  async function retryLast() {
    if (lastAttempt) await loadAndPlay(lastAttempt);
  }

  // Forget a pending denial + the track that triggered it. Called when the
  // user leaves Now Playing on a lockout screen, so a later, unrelated
  // paywall purchase can't decide to auto-resume a track from an old session.
  function clearDenial() {
    setDenyReason(null);
    setError(null);
    lastAttempt = null;
  }

  async function togglePlayPause() {
    const player = getPlayer();
    if (usePlayerStore.getState().isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }

  async function stopAndReset() {
    cancelSleepTimer();
    lastAttempt = null;
    setCurrentTrack(null);
    setSessionId(null);
    setDenyReason(null);
    setError(null);
    // Android's native module rejects replace(null) despite the TS type
    // allowing it — pausing is enough, the next loadAndPlay() overwrites
    // the source with a real one anyway.
    getPlayer().pause();
    clearLockScreenTrack();
  }

  return { loadAndPlay, retryLast, clearDenial, togglePlayPause, stopAndReset };
}
