import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioMetadata } from "expo-audio";

// A single module-level player, not a React hook — PlayerEngineProvider is
// mounted once at the app root and never unmounts, but usePlayerActions,
// sleepTimer.ts, and useListeningHeartbeat all need to reach the same
// instance from outside that component tree (same pattern as the old
// react-native-track-player default export they replaced).
let player: AudioPlayer | null = null;

export function getPlayer(): AudioPlayer {
  if (!player) {
    player = createAudioPlayer(null, { updateInterval: 1000 });
  }
  return player;
}

// Called once at startup. `doNotMix` requests exclusive audio focus — this
// app's ambient sounds are the point of the session, not background
// accompaniment, and exclusive focus is also what Android requires for
// playback to survive past ~3 minutes with the screen locked.
export async function configureAudioMode() {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "doNotMix",
  });
}

export function setLockScreenTrack(metadata: AudioMetadata) {
  getPlayer().setActiveForLockScreen(true, metadata, { showSeekBackward: false, showSeekForward: false });
}

export function clearLockScreenTrack() {
  getPlayer().clearLockScreenControls();
}
