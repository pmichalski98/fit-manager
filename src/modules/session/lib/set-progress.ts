export type SetDelta = "up" | "down" | "equal" | "none";

export type ExerciseRecord = {
  maxWeight: number | null;
  maxE1rm: number | null;
  maxRepsBodyweight: number | null;
};

/**
 * Estimated one-rep max via the Brzycki formula (same as the dashboard
 * exercise progress chart). Returns null when reps are out of the formula's
 * valid range.
 */
export function estimateOneRepMax(weight: number, reps: number): number | null {
  if (reps <= 0 || reps >= 37) return null;
  return weight * (36 / (37 - reps));
}

// ±2.5% band on estimated 1RM counts as "equal" so small weight/rep trades
// (e.g. 58×8 → 60×6) read as neutral instead of a false regression.
const E1RM_TOLERANCE = 0.025;

/**
 * Compares a set against the same-index set from the previous session using
 * estimated 1RM. Bodyweight sets (no weight on either side) fall back to a
 * plain rep comparison.
 */
export function getSetProgress(
  current: {
    reps: number | null | undefined;
    weight: number | null | undefined;
  },
  previous: { reps: number; weight?: number } | undefined,
): { delta: SetDelta; label: string | null } {
  if (!previous || current.reps == null || current.reps <= 0) {
    return { delta: "none", label: null };
  }
  const curWeight = current.weight ?? 0;
  const prevWeight = previous.weight ?? 0;

  if (curWeight === 0 && prevWeight === 0) {
    const diff = current.reps - previous.reps;
    if (diff > 0) return { delta: "up", label: `+${diff} reps` };
    if (diff < 0) return { delta: "down", label: `${diff} reps` };
    return { delta: "equal", label: "≈" };
  }

  const curE1rm = estimateOneRepMax(curWeight, current.reps);
  const prevE1rm = estimateOneRepMax(prevWeight, previous.reps);
  if (curE1rm == null || prevE1rm == null)
    return { delta: "none", label: null };
  if (prevE1rm === 0)
    return { delta: curE1rm > 0 ? "up" : "equal", label: null };
  if (curE1rm === 0) return { delta: "down", label: null };

  const ratio = curE1rm / prevE1rm;
  const pct = Math.round((ratio - 1) * 100);
  if (ratio > 1 + E1RM_TOLERANCE) return { delta: "up", label: `+${pct}%` };
  if (ratio < 1 - E1RM_TOLERANCE) return { delta: "down", label: `${pct}%` };
  return { delta: "equal", label: "≈" };
}

/**
 * Folds raw historical set rows into per-exercise all-time records,
 * keyed by templateExerciseId.
 */
export function buildExerciseRecords(
  rows: Array<{
    templateExerciseId: string | null;
    reps: number;
    weight: string | number | null;
  }>,
): Record<string, ExerciseRecord> {
  const result: Record<string, ExerciseRecord> = {};
  for (const row of rows) {
    if (!row.templateExerciseId) continue;
    const weight = row.weight != null ? Number(row.weight) : 0;
    const rec = (result[row.templateExerciseId] ??= {
      maxWeight: null,
      maxE1rm: null,
      maxRepsBodyweight: null,
    });
    if (weight > 0) {
      if (rec.maxWeight == null || weight > rec.maxWeight) {
        rec.maxWeight = weight;
      }
      const e1rm = estimateOneRepMax(weight, row.reps);
      if (e1rm != null && (rec.maxE1rm == null || e1rm > rec.maxE1rm)) {
        rec.maxE1rm = e1rm;
      }
    } else if (
      rec.maxRepsBodyweight == null ||
      row.reps > rec.maxRepsBodyweight
    ) {
      rec.maxRepsBodyweight = row.reps;
    }
  }
  return result;
}

/**
 * A set is a personal record when it beats the all-time heaviest weight or
 * the all-time estimated 1RM for the exercise. Bodyweight sets compare
 * against the all-time bodyweight rep max instead.
 */
export function isSetRecord(
  current: {
    reps: number | null | undefined;
    weight: number | null | undefined;
  },
  record: ExerciseRecord | undefined,
): boolean {
  if (!record || current.reps == null || current.reps <= 0) return false;
  const weight = current.weight ?? 0;
  if (weight === 0) {
    return (
      record.maxRepsBodyweight != null &&
      current.reps > record.maxRepsBodyweight
    );
  }
  if (record.maxWeight != null && weight > record.maxWeight) return true;
  const e1rm = estimateOneRepMax(weight, current.reps);
  if (e1rm == null) return false;
  return e1rm > (record.maxE1rm ?? 0);
}
