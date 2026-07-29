export type ExerciseTarget = {
  targetSets: number | null;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
};

/**
 * Formats an exercise target as a compact hint, e.g. "3×8–12", "3 sets",
 * "8–12 reps", "8+ reps". Returns null when no target is set.
 */
export function formatExerciseTarget(target: ExerciseTarget): string | null {
  const { targetSets, targetRepsMin, targetRepsMax } = target;

  let reps: string | null = null;
  if (targetRepsMin != null && targetRepsMax != null) {
    reps =
      targetRepsMin === targetRepsMax
        ? `${targetRepsMin}`
        : `${targetRepsMin}–${targetRepsMax}`;
  } else if (targetRepsMin != null) {
    reps = `${targetRepsMin}+`;
  } else if (targetRepsMax != null) {
    reps = `≤${targetRepsMax}`;
  }

  if (targetSets != null && reps != null) return `${targetSets}×${reps}`;
  if (targetSets != null)
    return `${targetSets} ${targetSets === 1 ? "set" : "sets"}`;
  if (reps != null) return `${reps} reps`;
  return null;
}
