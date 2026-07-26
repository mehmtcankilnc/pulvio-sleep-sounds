import { supabase } from "./supabase";
import type { HeartbeatResult, StartPlaybackResult, UserStatusResult } from "../types/playback";

export async function startPlayback(trackId: string): Promise<StartPlaybackResult> {
  const { data, error } = await supabase.rpc("start_playback", { p_track_id: trackId });
  if (error) throw error;
  return data as StartPlaybackResult;
}

export async function sendHeartbeat(
  sessionId: string,
  secondsElapsed: number
): Promise<HeartbeatResult> {
  const { data, error } = await supabase.rpc("playback_heartbeat", {
    p_session_id: sessionId,
    p_seconds_elapsed: secondsElapsed,
  });
  if (error) throw error;
  return data as HeartbeatResult;
}

export async function fetchUserStatus(): Promise<UserStatusResult | null> {
  const { data, error } = await supabase.rpc("get_user_status");
  if (error) return null;
  return data as UserStatusResult;
}
