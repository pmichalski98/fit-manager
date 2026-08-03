export type WarmupSet = {
  weightKg: number;
  reps: number;
  label: string;
};

const BAR_KG = 20;
const PLATE_INCREMENT_KG = 2.5;

function roundToPlate(kg: number): number {
  return Math.round(kg / PLATE_INCREMENT_KG) * PLATE_INCREMENT_KG;
}

/**
 * Generates a warmup ramp for a working weight: empty bar (for heavy
 * barbell loads), then 40% × 8, 60% × 5, 80% × 3. Weights are rounded
 * to 2.5 kg; non-increasing or at/above-working sets are dropped.
 */
export function generateWarmupSets(workingWeightKg: number): WarmupSet[] {
  if (!Number.isFinite(workingWeightKg) || workingWeightKg <= 0) return [];

  const sets: WarmupSet[] = [];
  // Empty bar only when 40% would already be above it — otherwise the
  // 40% set is the bar and a separate bar set would duplicate it.
  if (workingWeightKg * 0.4 > BAR_KG) {
    sets.push({ weightKg: BAR_KG, reps: 10, label: "Bar" });
  }

  const ramp = [
    { pct: 0.4, reps: 8 },
    { pct: 0.6, reps: 5 },
    { pct: 0.8, reps: 3 },
  ];
  for (const { pct, reps } of ramp) {
    const weightKg = roundToPlate(workingWeightKg * pct);
    const lastWeight = sets[sets.length - 1]?.weightKg ?? 0;
    if (weightKg <= lastWeight || weightKg >= workingWeightKg) continue;
    sets.push({ weightKg, reps, label: `${Math.round(pct * 100)}%` });
  }
  return sets;
}
