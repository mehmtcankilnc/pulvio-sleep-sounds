import { useEffect } from "react";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";
import type { Track } from "../../types";

// Pre-auth funnel answers, persisted to AsyncStorage so a bedtime user who
// gets interrupted mid-flow (a text, the OS reclaiming the JS context) comes
// back to their answers instead of starting over. Cleared once the funnel is
// finished (preview -> signup). The shape stays flat and serialisable so a
// later pass can also write it to the user profile / an onboarding_answers
// table. See docs/DRIFT_IMPLEMENTATION_PLAN.md §7-11.

export type SleepFrequency = "mostNights" | "fewNights" | "nowAndThen" | "comesAndGoes";

export const FREQUENCY_KEYS: SleepFrequency[] = ["mostNights", "fewNights", "nowAndThen", "comesAndGoes"];
export const STRUGGLE_KEYS = ["racingThoughts", "stressTension", "noiseAround", "irregularSchedule", "wakingAtNight"] as const;
export const SOUND_KEYS = ["rainThunder", "oceanWaves", "whiteNoise", "asmr", "pianoAmbient", "fireplace", "vehicles"] as const;

const STORAGE_KEY = "pulvio.onboarding.answers.v1";

// Route for each 1-based step, plus the reveal at index 5.
const STEP_ROUTES = [
  "/(onboarding)/frequency",
  "/(onboarding)/quiz-struggles",
  "/(onboarding)/quiz-sounds",
  "/(onboarding)/bedtime",
  "/(onboarding)/reminder",
  "/(onboarding)/plan-ready",
] as const;

type OnboardingAnswersState = {
  frequency: SleepFrequency | null;
  struggles: string[];
  sounds: string[];
  bedtimeHour: number;
  bedtimeMinute: number;
  reminderOn: boolean;
  // Highest step the user has reached (0 = not started, 6 = reached the
  // reveal). Drives resume routing from the welcome screen.
  furthestStep: number;
  // The track picked on plan-ready, about to play on preview. Transient —
  // never persisted.
  previewTrack: Track | null;
  // Flips true once AsyncStorage has been read. Persistence is suppressed
  // until then so the initial empty state can't clobber saved answers.
  hydrated: boolean;

  setFrequency: (value: SleepFrequency) => void;
  toggleStruggle: (key: string) => void;
  toggleSound: (key: string) => void;
  setBedtime: (hour: number, minute: number) => void;
  setReminderOn: (value: boolean) => void;
  setPreviewTrack: (track: Track | null) => void;
  markStepReached: (step: number) => void;
  reset: () => void;
};

const INITIAL = {
  frequency: null as SleepFrequency | null,
  struggles: [] as string[],
  sounds: [] as string[],
  bedtimeHour: 23,
  bedtimeMinute: 0,
  reminderOn: true,
  furthestStep: 0,
  previewTrack: null as Track | null,
};

function toggle(list: string[], key: string): string[] {
  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
}

export const useOnboardingAnswers = create<OnboardingAnswersState>((set) => ({
  ...INITIAL,
  hydrated: false,
  setFrequency: (frequency) => set({ frequency }),
  toggleStruggle: (key) => set((s) => ({ struggles: toggle(s.struggles, key) })),
  toggleSound: (key) => set((s) => ({ sounds: toggle(s.sounds, key) })),
  setBedtime: (bedtimeHour, bedtimeMinute) => set({ bedtimeHour, bedtimeMinute }),
  setReminderOn: (reminderOn) => set({ reminderOn }),
  setPreviewTrack: (previewTrack) => set({ previewTrack }),
  markStepReached: (step) => set((s) => (step > s.furthestStep ? { furthestStep: step } : s)),
  reset: () => {
    set({ ...INITIAL, hydrated: true });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));

// Fire-and-forget persistence of the answer fields (never previewTrack /
// hydrated), matching the manual-AsyncStorage pattern used elsewhere in the
// app (sleepTimer, bedtimeReminder, i18n).
useOnboardingAnswers.subscribe((state) => {
  if (!state.hydrated) return;
  const data = {
    frequency: state.frequency,
    struggles: state.struggles,
    sounds: state.sounds,
    bedtimeHour: state.bedtimeHour,
    bedtimeMinute: state.bedtimeMinute,
    reminderOn: state.reminderOn,
    furthestStep: state.furthestStep,
  };
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
});

// Read saved answers back into the store. Called once when the funnel mounts
// (app/(onboarding)/_layout.tsx). Safe to call repeatedly.
export async function hydrateOnboardingAnswers(): Promise<void> {
  if (useOnboardingAnswers.getState().hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<typeof INITIAL>;
      useOnboardingAnswers.setState({
        frequency: p.frequency ?? null,
        struggles: p.struggles ?? [],
        sounds: p.sounds ?? [],
        bedtimeHour: p.bedtimeHour ?? 23,
        bedtimeMinute: p.bedtimeMinute ?? 0,
        reminderOn: p.reminderOn ?? true,
        furthestStep: p.furthestStep ?? 0,
      });
    }
  } catch {
    // Corrupt/unreadable storage — fall through to a clean funnel.
  }
  useOnboardingAnswers.setState({ hydrated: true });
}

// Where the welcome screen sends a returning user. Steps 1-6 resume in place
// (they see their prior answers); step 7 goes straight to the reveal.
export function onboardingResumePath(furthestStep: number): string {
  const index = Math.min(Math.max(furthestStep, 1), STEP_ROUTES.length) - 1;
  return STEP_ROUTES[index];
}

// One-liner for each step screen to record that it was reached.
export function useMarkOnboardingStep(step: number): void {
  const mark = useOnboardingAnswers((s) => s.markStepReached);
  useEffect(() => {
    mark(step);
  }, [step, mark]);
}

export function formatBedtime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// The bedtime the user picked in the pre-auth funnel, resolved from wherever
// it still lives: the in-memory store (funnel not handed off yet), the local
// persisted answers (pre-handoff), or the account's onboarding_answers row
// (post-handoff — useOnboardingHandoff clears the local copy after writing it
// to the account). Used to pre-fill the Settings bedtime reminder instead of
// a blank 22:00. Returns null when the user never answered the step.
export async function resolveOnboardingBedtime(): Promise<{ hour: number; minute: number } | null> {
  const live = useOnboardingAnswers.getState();
  if (live.hydrated && live.furthestStep > 0) {
    return { hour: live.bedtimeHour, minute: live.bedtimeMinute };
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<typeof INITIAL>;
      if (
        typeof p.bedtimeHour === "number" &&
        typeof p.bedtimeMinute === "number" &&
        (p.furthestStep ?? 0) > 0
      ) {
        return { hour: p.bedtimeHour, minute: p.bedtimeMinute };
      }
    }
  } catch {
    // corrupt/unreadable — try the account copy
  }
  try {
    const { data } = await supabase
      .from("onboarding_answers")
      .select("bedtime_hour, bedtime_minute")
      .maybeSingle();
    if (data && typeof data.bedtime_hour === "number" && typeof data.bedtime_minute === "number") {
      return { hour: data.bedtime_hour, minute: data.bedtime_minute };
    }
  } catch {
    // no row / offline — caller keeps its own default
  }
  return null;
}
