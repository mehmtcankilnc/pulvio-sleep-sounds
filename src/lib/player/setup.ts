import TrackPlayer, { AppKilledPlaybackBehavior, Capability } from "react-native-track-player";

let isSetup = false;

export async function setupPlayer() {
  if (isSetup) return;

  await TrackPlayer.setupPlayer();
  await TrackPlayer.updateOptions({
    capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
    compactCapabilities: [Capability.Play, Capability.Pause],
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
  });

  isSetup = true;
}
