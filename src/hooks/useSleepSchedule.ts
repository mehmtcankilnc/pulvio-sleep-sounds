import { useEffect, useState } from "react";
import { useUserStore } from "../store/useUserStore";
import { DEFAULT_SLEEP_SCHEDULE, getSleepSchedule, updateSleepSchedule, type SleepSchedule } from "../lib/sleepSchedule";
import { syncBedtimePlayNotification, syncQuietWakeupNotification } from "../lib/sleepNotifications";
import { setSleepTimerFadeEnabled } from "../lib/player/sleepTimer";
import type { Track } from "../types";

// Mirrors useFavorites' shape: fetch-once + optimistic local updates that
// roll back on write failure, so every toggle/time change on the Sleep
// screen feels instant instead of waiting on a round trip.
export function useSleepSchedule() {
  const userId = useUserStore((state) => state.userId);
  const [schedule, setSchedule] = useState<SleepSchedule>(DEFAULT_SLEEP_SCHEDULE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSchedule(DEFAULT_SLEEP_SCHEDULE);
      setLoading(false);
      return;
    }
    setLoading(true);
    getSleepSchedule(userId)
      .then(setSchedule)
      .finally(() => setLoading(false));
  }, [userId]);

  // Keeps the sleep-timer module's fade behavior (used from Now Playing,
  // not just this screen) in sync with the persisted toggle.
  useEffect(() => {
    setSleepTimerFadeEnabled(schedule.fadeOutEnabled);
  }, [schedule.fadeOutEnabled]);

  // Returns the merged schedule so callers can pass the up-to-date
  // bedtime/wake/track fields into the notification sync calls without a
  // second render round trip.
  async function patch(
    optimistic: Partial<SleepSchedule>,
    dbPatch: Partial<{
      bedtime_hour: number;
      bedtime_minute: number;
      wake_hour: number;
      wake_minute: number;
      play_at_bedtime_enabled: boolean;
      play_at_bedtime_track_id: string | null;
      fade_out_enabled: boolean;
      quiet_wakeup_enabled: boolean;
    }>
  ): Promise<SleepSchedule> {
    const previous = schedule;
    const next = { ...previous, ...optimistic };
    if (!userId) return next;
    setSchedule(next);
    try {
      await updateSleepSchedule(userId, dbPatch);
    } catch {
      setSchedule(previous);
      return previous;
    }
    return next;
  }

  async function setBedtime(hour: number, minute: number) {
    const next = await patch({ bedtimeHour: hour, bedtimeMinute: minute }, { bedtime_hour: hour, bedtime_minute: minute });
    if (next.playAtBedtimeEnabled) {
      await syncBedtimePlayNotification(true, hour, minute, next.playAtBedtimeTrack?.id ?? null, next.playAtBedtimeTrack?.title ?? null);
    }
  }

  async function setWakeTime(hour: number, minute: number) {
    const next = await patch({ wakeHour: hour, wakeMinute: minute }, { wake_hour: hour, wake_minute: minute });
    if (next.quietWakeupEnabled) {
      await syncQuietWakeupNotification(true, hour, minute);
    }
  }

  // Returns whether the toggle ended up in the state the caller asked for —
  // `false` means it was silently reverted for a denied notification
  // permission, which the caller (Sleep screen) turns into a visible alert
  // instead of leaving the user to notice the toggle snapped back on its own.
  async function setPlayAtBedtimeEnabled(enabled: boolean): Promise<boolean> {
    const next = await patch({ playAtBedtimeEnabled: enabled }, { play_at_bedtime_enabled: enabled });
    const granted = await syncBedtimePlayNotification(
      enabled,
      next.bedtimeHour,
      next.bedtimeMinute,
      next.playAtBedtimeTrack?.id ?? null,
      next.playAtBedtimeTrack?.title ?? null
    );
    if (enabled && !granted) {
      // Permission denied — revert the toggle rather than leave it on with
      // no notification actually scheduled behind it.
      await patch({ playAtBedtimeEnabled: false }, { play_at_bedtime_enabled: false });
      return false;
    }
    return true;
  }

  async function setPlayAtBedtimeTrack(track: Track | null): Promise<boolean> {
    const next = await patch(
      { playAtBedtimeTrack: track, playAtBedtimeEnabled: track !== null },
      { play_at_bedtime_track_id: track?.id ?? null, play_at_bedtime_enabled: track !== null }
    );
    const granted = await syncBedtimePlayNotification(next.playAtBedtimeEnabled, next.bedtimeHour, next.bedtimeMinute, track?.id ?? null, track?.title ?? null);
    if (next.playAtBedtimeEnabled && !granted) {
      await patch({ playAtBedtimeEnabled: false }, { play_at_bedtime_enabled: false });
      return false;
    }
    return true;
  }

  function setFadeOutEnabled(enabled: boolean) {
    return patch({ fadeOutEnabled: enabled }, { fade_out_enabled: enabled });
  }

  async function setQuietWakeupEnabled(enabled: boolean): Promise<boolean> {
    const next = await patch({ quietWakeupEnabled: enabled }, { quiet_wakeup_enabled: enabled });
    const granted = await syncQuietWakeupNotification(enabled, next.wakeHour, next.wakeMinute);
    if (enabled && !granted) {
      await patch({ quietWakeupEnabled: false }, { quiet_wakeup_enabled: false });
      return false;
    }
    return true;
  }

  return {
    schedule,
    loading,
    setBedtime,
    setWakeTime,
    setPlayAtBedtimeEnabled,
    setPlayAtBedtimeTrack,
    setFadeOutEnabled,
    setQuietWakeupEnabled,
  };
}
