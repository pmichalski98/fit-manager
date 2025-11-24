export type StrengthExerciseSummary = {
  name: string;
  setCount: number;
  avgReps: number;
  avgWeightKg: number | null;
};

export type SessionSummary = {
  id: string;
  trainingId: string;
  templateName: string;
  type: "strength" | "cardio";
  startAt: Date;
  endAt: Date | null;
  durationMin: number | null; // Changed from durationSec
  cardio?: {
    durationMin: number | null;
    distanceKm: number | null;
    kcal: number | null;
  };
  strength?: {
    exercises: StrengthExerciseSummary[];
  };
};
