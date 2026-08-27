import { useEffect } from "react";
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Track } from "../../types";

// Pre-auth funnel answers, persisted to AsyncStorage so a bedtime user who
// gets interrupted mid-flow (a text, the OS reclaiming the JS context) comes
// back to their answers instead of starting over. Cleared once the funnel is
// finished (preview -> signup). The shape stays flat and serialisable so a
// later pass can also write it to the user profile / an onboarding_answers
// table. See docs/DRIFT_IMPLEMENTATION_PLAN.md §7-11.

export type SleepFrequency = "mostNights" | "fewNights" | "nowAndThen" | "comesAndGoes";
export type VoicePreference = "withVoice" | "noVoice" | "either";

export const FREQUENCY_KEYS: SleepFrequency[] = ["mostNights", "fewNights", "nowAndThen", "comesAndGoes"];
export const VOICE_KEYS: VoicePreference[] = ["withVoice", "noVoice", "either"];
export const STRUGGLE_KEYS = ["racingThoughts", "stressTension", "noiseAround", "irregularSchedule", "wakingAtNight"] as const;
export const SOUND_KEYS = ["rainThunder", "oceanWaves", "whiteNoise", "asmr", "pianoAmbient", "fireplace"] as const;

const STORAGE_KEY = "pulvio.onboarding.answers.v1";

// Route for each 1-based step, plus the reveal at index 6.
const STEP_ROUTES = [
  "/(onboarding)/frequency",
  "/(onboarding)/quiz-struggles",
  "/(onboarding)/quiz-sounds",
  "/(onboarding)/voice",
  "/(onboarding)/bedtime",
  "/(onboarding)/reminder",
  "/(onboarding)/plan-ready",
] as const;

type OnboardingAnswersState = {
  frequency: SleepFrequency | null;
  struggles: string[];
  sounds: string[];
  voice: VoicePreference | null;
  bedtimeHour: number;
  bedtimeMinute: number;
  reminderOn: boolean;
  // Highest step the user has reached (0 = not started, 7 = reached the
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
  setVoice: (value: VoicePreference) => void;
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
  voice: null as VoicePreference | null,
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
  setVoice: (voice) => set({ voice }),
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
    voice: state.voice,
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
        voice: p.voice ?? null,
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
