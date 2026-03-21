export type StrengthExerciseSummary = {
  name: string;
  setCount: number;
  avgReps: number;
  avgWeightKg: number | null;
};

export type InProgressSession = {
  sessionId: string;
  startAt: string;
  exercises: Array<{
    name: string;
    position: number;
    templateExerciseId: string | null;
    sets: Array<{
      setIndex: number;
      reps: number | null;
      weight: number | null;
      isDone: boolean;
    }>;
  }>;
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
