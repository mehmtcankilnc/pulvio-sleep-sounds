import type { SleepFrequency } from "./useOnboardingAnswers";

// The persistent funnel chrome (app/(onboarding)/_layout.tsx) reads the
// current route segment to decide what the shared progress header should
// show. Kept here, next to the step routes, so the two never drift.

export const TOTAL_STEPS = 5;

type StepInfo = { step: number; skippable: boolean };

// null => no shared header for this route (welcome, and anything unknown).
export function routeStepInfo(segment: string | undefined): StepInfo | null {
  switch (segment) {
    case "frequency":
      return { step: 1, skippable: true };
    case "quiz-struggles":
      return { step: 2, skippable: true };
    case "quiz-sounds":
      return { step: 3, skippable: true };
    case "bedtime":
      return { step: 4, skippable: true };
    case "reminder":
      return { step: 5, skippable: true };
    default:
      // welcome, plan-ready and preview own their whole surface (distinct
      // backgrounds, their own header instance) — no shared chrome.
      return null;
  }
}

type AnswerSlice = {
  frequency: SleepFrequency | null;
  struggles: string[];
  sounds: string[];
};

// Whether the given step's question has been answered — drives the progress
// bar's "fill to the next notch" the moment a choice is made. Steps 4/5
// (bedtime, reminder) have a sensible default, so they read as answered on
// arrival, matching the old per-screen `answered` prop.
export function stepAnswered(step: number, a: AnswerSlice): boolean {
  switch (step) {
    case 1:
      return a.frequency !== null;
    case 2:
      return a.struggles.length >= 1;
    case 3:
      return a.sounds.length >= 1;
    default:
      return true;
  }
}
