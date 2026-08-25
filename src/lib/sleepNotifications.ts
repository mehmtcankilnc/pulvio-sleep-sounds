import * as Notifications from "expo-notifications";
import i18next from "./i18n";

// Two independent local notifications for the Sleep screen's routine —
// distinct identifiers from bedtimeReminder.ts's own "bedtime-reminder" so
// toggling one never cancels the other. Neither can reliably auto-play
// audio in the background (no OS guarantees that), so both are tap-to-open
// notifications rather than silent triggers — "bedtime-play" carries a
// trackId in its data payload that PlayerEngineProvider's response listener
// reads to start playback once the user actually taps it.
const QUIET_WAKEUP_ID = "quiet-wakeup";
const BEDTIME_PLAY_ID = "bedtime-play";

async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Returns false when the user declined the permission prompt, so the
// caller can revert its optimistic toggle state.
export async function syncQuietWakeupNotification(
  enabled: boolean,
  hour: number,
  minute: number
): Promise<boolean> {
  await Notifications.cancelScheduledNotificationAsync(QUIET_WAKEUP_ID).catch(() => {});
  if (!enabled) return true;

  if (!(await ensureNotificationPermission())) return false;

  await Notifications.scheduleNotificationAsync({
    identifier: QUIET_WAKEUP_ID,
    content: {
      title: i18next.t("sleep:quietWakeupNotifTitle"),
      body: i18next.t("sleep:quietWakeupNotifBody"),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  return true;
}

export async function syncBedtimePlayNotification(
  enabled: boolean,
  hour: number,
  minute: number,
  trackId: string | null,
  trackTitle: string | null
): Promise<boolean> {
  await Notifications.cancelScheduledNotificationAsync(BEDTIME_PLAY_ID).catch(() => {});
  if (!enabled || !trackId) return true;

  if (!(await ensureNotificationPermission())) return false;

  await Notifications.scheduleNotificationAsync({
    identifier: BEDTIME_PLAY_ID,
    content: {
      title: i18next.t("sleep:bedtimePlayNotifTitle"),
      body: i18next.t("sleep:bedtimePlayNotifBody", { title: trackTitle ?? "" }),
      data: { type: "bedtime-play", trackId },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  return true;
}
