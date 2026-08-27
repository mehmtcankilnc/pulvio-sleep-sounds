import { supabase } from "../supabase";

type AnswersInput = {
  frequency: string | null;
  struggles: string[];
  sounds: string[];
  voice: string | null;
  bedtimeHour: number;
  bedtimeMinute: number;
  reminderOn: boolean;
};

// Writes the funnel answers to the freshly-created account. Upsert on
// user_id so a re-run (e.g. a late retry after a failed first attempt)
// overwrites rather than errors. Called once from useOnboardingHandoff
// after the session lands. Best-effort — the caller keeps the local copy
// so a failed write can be retried on the next launch.
export async function saveOnboardingAnswers(userId: string, a: AnswersInput): Promise<void> {
  const { error } = await supabase.from("onboarding_answers").upsert(
    {
      user_id: userId,
      frequency: a.frequency,
      struggles: a.struggles,
      sounds: a.sounds,
      voice: a.voice,
      bedtime_hour: a.bedtimeHour,
      bedtime_minute: a.bedtimeMinute,
      reminder_on: a.reminderOn,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}
