import { supabase } from "./supabase";
import type { Track } from "../types";

export type SleepSchedule = {
  bedtimeHour: number;
  bedtimeMinute: number;
  wakeHour: number;
  wakeMinute: number;
  playAtBedtimeEnabled: boolean;
  playAtBedtimeTrack: Track | null;
  fadeOutEnabled: boolean;
  quietWakeupEnabled: boolean;
};

export const DEFAULT_SLEEP_SCHEDULE: SleepSchedule = {
  bedtimeHour: 23,
  bedtimeMinute: 30,
  wakeHour: 7,
  wakeMinute: 0,
  playAtBedtimeEnabled: false,
  playAtBedtimeTrack: null,
  fadeOutEnabled: true,
  quietWakeupEnabled: false,
};

type Row = {
  bedtime_hour: number;
  bedtime_minute: number;
  wake_hour: number;
  wake_minute: number;
  play_at_bedtime_enabled: boolean;
  play_at_bedtime_track_id: string | null;
  fade_out_enabled: boolean;
  quiet_wakeup_enabled: boolean;
  track: {
    id: string;
    title: string;
    category: string;
    subcategory: string;
    duration: number;
    storage_url: string;
    cover_url: string | null;
    is_premium_only: boolean;
  } | null;
};

function mapRowToSchedule(row: Row): SleepSchedule {
  return {
    bedtimeHour: row.bedtime_hour,
    bedtimeMinute: row.bedtime_minute,
    wakeHour: row.wake_hour,
    wakeMinute: row.wake_minute,
    playAtBedtimeEnabled: row.play_at_bedtime_enabled,
    playAtBedtimeTrack: row.track
      ? {
          id: row.track.id,
          title: row.track.title,
          category: row.track.category,
          subcategory: row.track.subcategory,
          durationSeconds: row.track.duration,
          storageUrl: row.track.storage_url,
          coverUrl: row.track.cover_url ?? undefined,
          isPremiumOnly: row.track.is_premium_only,
        }
      : null,
    fadeOutEnabled: row.fade_out_enabled,
    quietWakeupEnabled: row.quiet_wakeup_enabled,
  };
}

const SELECT_COLUMNS =
  "bedtime_hour, bedtime_minute, wake_hour, wake_minute, play_at_bedtime_enabled, play_at_bedtime_track_id, fade_out_enabled, quiet_wakeup_enabled, track:tracks(id, title, category, subcategory, duration, storage_url, cover_url, is_premium_only)";

// No row yet (first visit) is the common case, not an error — the caller
// gets the same shape either way, just falling back to defaults.
export async function getSleepSchedule(userId: string): Promise<SleepSchedule> {
  const { data, error } = await supabase
    .from("sleep_schedule")
    .select(SELECT_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return DEFAULT_SLEEP_SCHEDULE;
  return mapRowToSchedule(data as unknown as Row);
}

// Partial upsert: only the changed fields need to be passed, the rest of
// the row (and its defaults, for a first-time insert) come from Postgres —
// every call site only just changed one toggle/time, never the whole shape.
export async function updateSleepSchedule(
  userId: string,
  patch: Partial<{
    bedtime_hour: number;
    bedtime_minute: number;
    wake_hour: number;
    wake_minute: number;
    play_at_bedtime_enabled: boolean;
    play_at_bedtime_track_id: string | null;
    fade_out_enabled: boolean;
    quiet_wakeup_enabled: boolean;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("sleep_schedule")
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() });
  if (error) throw error;
}
