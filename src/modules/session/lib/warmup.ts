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

type RampStep = { pct: number; reps: number };

/**
 * Ramp shapes by set count. Heavier loads get both more steps and a lower
 * starting percentage, so the jump between any two consecutive sets stays
 * roughly constant instead of growing with the working weight.
 */
const RAMPS: readonly RampStep[][] = [
  [],
  [{ pct: 0.5, reps: 8 }],
  [
    { pct: 0.35, reps: 8 },
    { pct: 0.65, reps: 4 },
  ],
  [
    { pct: 0.3, reps: 8 },
    { pct: 0.55, reps: 5 },
    { pct: 0.75, reps: 3 },
  ],
  [
    { pct: 0.25, reps: 8 },
    { pct: 0.5, reps: 5 },
    { pct: 0.7, reps: 3 },
    { pct: 0.85, reps: 2 },
  ],
];

/**
 * How many warmup sets a load earns, as a multiple of the empty bar. A load
 * near the bar needs no ramp at all; every doubling-ish of that distance
 * buys another step.
 */
function rampFor(workingWeightKg: number): readonly RampStep[] {
  const barMultiple = workingWeightKg / BAR_KG;
  if (barMultiple < 1.5) return RAMPS[0]!;
  if (barMultiple < 2.5) return RAMPS[1]!;
  if (barMultiple < 4) return RAMPS[2]!;
  if (barMultiple < 6) return RAMPS[3]!;
  return RAMPS[4]!;
}

/**
 * Generates a warmup ramp scaled to the working weight: 60 kg gets two sets,
 * 140 kg gets four. Weights are rounded to 2.5 kg and never fall below the
 * empty bar; non-increasing or at/above-working sets are dropped.
 */
export function generateWarmupSets(workingWeightKg: number): WarmupSet[] {
  if (!Number.isFinite(workingWeightKg) || workingWeightKg <= 0) return [];

  const sets: WarmupSet[] = [];
  for (const { pct, reps } of rampFor(workingWeightKg)) {
    const weightKg = Math.max(BAR_KG, roundToPlate(workingWeightKg * pct));
    const lastWeight = sets[sets.length - 1]?.weightKg ?? 0;
    if (weightKg <= lastWeight || weightKg >= workingWeightKg) continue;
    sets.push({
      weightKg,
      reps,
      label: weightKg === BAR_KG ? "Bar" : `${Math.round(pct * 100)}%`,
    });
  }
  return sets;
}
