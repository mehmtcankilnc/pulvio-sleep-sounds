import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePlayerStore } from "../store/usePlayerStore";

const DISCLOSED_KEY = "pulvio_free_limit_disclosed";
// Lazily hydrated cache, same shape as sleepTimer.ts's autoArmDisclosed —
// null means "not read from storage yet", so the first call in a cold
// session doesn't race a second call before the AsyncStorage read resolves.
let disclosed: boolean | null = null;

// The free tier's 3-minute/3-hour cooldown (supabase/migrations/0006_freemium_rpc.sql)
// used to be something a user only discovered by hitting it — never
// mentioned in onboarding, the home screen, or (accurately) the paywall.
// Called from usePlayerActions.loadAndPlay whenever a free session is
// actually granted; shows a one-time hint on Now Playing (see player.tsx's
// FreeLimitHint) the first time that happens on this install, then never
// again — same "disclosed once" shape as armSleepTimerAuto's own hint.
export function maybeDiscloseFreeLimit() {
  if (disclosed === null) {
    AsyncStorage.getItem(DISCLOSED_KEY)
      .then((v) => {
        disclosed = v === "1";
        if (!disclosed) disclose();
      })
      .catch(() => {});
    return;
  }
  if (!disclosed) disclose();
}

function disclose() {
  disclosed = true;
  AsyncStorage.setItem(DISCLOSED_KEY, "1").catch(() => {});
  usePlayerStore.getState().setFreeLimitHint(true);
}
