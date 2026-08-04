export type StrengthExerciseSummary = {
  name: string;
  setCount: number;
  avgReps: number;
  avgWeightKg: number | null;
};

export type InProgressSession = {
  sessionId: string;
  startAt: string;
  notes: string | null;
  exercises: Array<{
    name: string;
    position: number;
    templateExerciseId: string | null;
    notes?: string | null;
    sets: Array<{
      setIndex: number;
      reps: number | null;
      weight: number | null;
      isDone: boolean;
    }>;
  }>;
};

export type SessionSetDetail = {
  setIndex: number;
  reps: number;
  /** null = bodyweight set */
  weight: number | null;
};

export type SessionExerciseDetail = {
  name: string;
  position: number;
  notes: string | null;
  sets: SessionSetDetail[];
};

export type SessionCardioDetail = {
  durationMin: number;
  distanceKm: number | null;
  kcal: number | null;
  avgHr: number | null;
  cadence: number | null;
  avgSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  avgPowerW: number | null;
  notes: string | null;
};

export type SessionDetail = {
  id: string;
  date: string;
  templateName: string;
  type: "strength" | "cardio";
  durationMin: number | null;
  totalLoadKg: number | null;
  notes: string | null;
  cardio: SessionCardioDetail | null;
  exercises: SessionExerciseDetail[];
};

export type SessionSummary = {
  id: string;
  trainingId: string;
  templateName: string;
  type: "strength" | "cardio";
  startAt: Date;
  endAt: Date | null;
  durationMin: number | null; // Changed from durationSec
  totalLoadKg: number | null;
  cardio?: {
    durationMin: number | null;
    distanceKm: number | null;
    kcal: number | null;
  };
  strength?: {
    exercises: StrengthExerciseSummary[];
  };
};
