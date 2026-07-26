import TrackPlayer from "react-native-track-player";
import { PlaybackService } from "./src/lib/player/service";

TrackPlayer.registerPlaybackService(() => PlaybackService);

require("expo-router/entry");
