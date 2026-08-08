import { format, parseISO } from "date-fns";

import { toFixed1 } from "@/lib/utils";
import {
  groupMeals,
  type MealGroup,
} from "@/modules/nutrition/lib/meal-grouping";
import type { SessionDetail, SessionSetDetail } from "@/modules/session/types";
import type { BodyMeasurement } from "@/server/db/schema";
import type { DailyLogEntry, ExportData } from "../types";

const NO_DATA = "No data recorded in this period.";
const DAY_MS = 24 * 60 * 60 * 1000;

function num(value: string | null): number | null {
  return value === null ? null : Number.parseFloat(value);
}

function shortDate(date: string): string {
  return format(parseISO(date), "MMM d");
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : ""}${toFixed1(value)}`;
}

/** "82.5" for 82.50, "80" for 80.00 — Number#toString drops trailing zeros. */
function compactWeight(weight: number): string {
  return weight.toString();
}

/** "80x8" for a weighted set, "BWx10" for bodyweight. */
function setLabel(set: SessionSetDetail): string {
  return set.weight === null
    ? `BWx${set.reps}`
    : `${compactWeight(set.weight)}x${set.reps}`;
}

// Brzycki formula, same guard as the dashboard's exercise progress chart:
// sets with >= 37 reps would divide by zero or go negative.
function e1rm(weight: number, reps: number): number | null {
  if (reps >= 37) return null;
  return weight * (36 / (37 - reps));
}

function topSet(sets: SessionSetDetail[]): SessionSetDetail | null {
  const weighted = sets.filter((s) => s.weight !== null);
  if (weighted.length > 0) {
    return weighted.reduce((best, s) =>
      s.weight! > best.weight! ||
      (s.weight === best.weight && s.reps > best.reps)
        ? s
        : best,
    );
  }
  if (sets.length === 0) return null;
  return sets.reduce((best, s) => (s.reps > best.reps ? s : best));
}

function bestE1rm(sets: SessionSetDetail[]): number | null {
  let best: number | null = null;
  for (const set of sets) {
    if (set.weight === null) continue;
    const estimate = e1rm(set.weight, set.reps);
    if (estimate !== null && (best === null || estimate > best)) {
      best = estimate;
    }
  }
  return best;
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / Math.max(values.length, 1);
}

function renderBodyWeight(data: ExportData, totalDays: number): string[] {
  const entries = data.dailyLogs
    .filter((log) => log.weight !== null)
    .map((log) => ({ date: log.date, weight: num(log.weight)! }));

  const lines = ["## Body Weight (kg)"];
  if (entries.length === 0) return [...lines, NO_DATA, ""];

  const first = entries[0]!;
  const last = entries[entries.length - 1]!;
  const avg = toFixed1(average(entries.map((e) => e.weight)));
  const summary =
    entries.length === 1
      ? `Single entry: ${toFixed1(first.weight)} (${first.date})`
      : `Start ${toFixed1(first.weight)} (${first.date}) → End ${toFixed1(last.weight)} (${last.date}) | ` +
        `Change: ${signed(last.weight - first.weight)} kg | Avg: ${avg} | ` +
        `Entries: ${entries.length}/${totalDays} days`;

  lines.push(summary, "", "| Date | Weight |", "|---|---|");
  for (const entry of entries) {
    lines.push(`| ${entry.date} | ${toFixed1(entry.weight)} |`);
  }
  return [...lines, ""];
}

function renderSteps(data: ExportData, totalDays: number): string[] {
  const goal = data.stepsGoal;
  const days = data.dailyLogs
    .map((log) => ({ date: log.date, steps: log.steps }))
    .filter(
      (day): day is { date: string; steps: number } => day.steps !== null,
    );

  const lines = ["## Steps"];
  if (days.length === 0) return [...lines, NO_DATA, ""];

  lines.push(goal ? `Steps goal: ${goal} steps/day` : "Steps goal: not set");

  const avg = Math.round(average(days.map((day) => day.steps)));
  const summaryParts = [`Days logged: ${days.length}/${totalDays}`];
  if (goal) {
    const delta = avg - goal;
    summaryParts.push(
      `Avg: ${avg}/day (${delta >= 0 ? "+" : ""}${delta} vs goal)`,
      `Days at goal: ${days.filter((day) => day.steps >= goal).length}/${days.length}`,
    );
  } else {
    summaryParts.push(`Avg: ${avg}/day`);
  }
  summaryParts.push(`Total: ${days.reduce((sum, day) => sum + day.steps, 0)}`);
  lines.push(summaryParts.join(" | "), "", "| Date | Steps |", "|---|---|");

  for (const day of days) {
    lines.push(`| ${day.date} | ${day.steps} |`);
  }
  return [...lines, ""];
}

/** "150 g" for a stable amount, "150–165 g" when portions drifted. */
function formatAmount(ingredient: MealGroup["ingredients"][number]): string {
  if (ingredient.avgGrams === null) return "?";
  const { minGrams, maxGrams, avgGrams } = ingredient;
  const drifts =
    minGrams !== null && maxGrams !== null && maxGrams - minGrams > 5;
  return drifts ? `${minGrams}–${maxGrams} g` : `${avgGrams} g`;
}

function renderMealGroup(group: MealGroup): string[] {
  const times = group.instances.length;
  // The same prepped food can land in different slots on different days.
  const slots = [...new Set(group.instances.map((i) => i.slot))].join(" / ");
  const dates = group.instances.map((i) => shortDate(i.date)).join(", ");

  const lines = [
    `#### ${slots} — ${times}x | avg per serving: ${group.avgKcal} kcal, ` +
      `protein ${group.avgProtein} g, carbs ${group.avgCarbs} g, ` +
      `fat ${group.avgFat} g, fiber ${group.avgFiber} g`,
    `Dates: ${dates}`,
  ];
  for (const ingredient of group.ingredients) {
    const label = ingredient.brand
      ? `${ingredient.name} (${ingredient.brand})`
      : ingredient.name;
    lines.push(`- ${label} — ${formatAmount(ingredient)}`);
  }
  return [...lines, ""];
}

function renderNutrition(data: ExportData, totalDays: number): string[] {
  const days = data.dailyLogs.filter(
    (log) =>
      log.kcal !== null ||
      log.proteinG !== null ||
      log.carbsG !== null ||
      log.fatG !== null ||
      log.fiberG !== null,
  );

  const lines = ["## Nutrition"];
  if (days.length === 0 && data.mealItems.length === 0) {
    return [...lines, NO_DATA, ""];
  }

  lines.push(
    data.caloricGoal
      ? `Caloric goal: ${data.caloricGoal} kcal/day`
      : "Caloric goal: not set",
  );

  const avgOf = (
    pick: (log: DailyLogEntry) => number | null,
  ): number | null => {
    const values = days
      .map(pick)
      .filter((value): value is number => value !== null);
    return values.length > 0 ? Math.round(average(values)) : null;
  };

  const avgKcal = avgOf((log) => log.kcal);
  const summaryParts = [`Days logged: ${days.length}/${totalDays}`];
  if (avgKcal !== null) {
    const vsGoal = data.caloricGoal
      ? ` (${avgKcal - data.caloricGoal >= 0 ? "+" : ""}${avgKcal - data.caloricGoal} vs goal)`
      : "";
    summaryParts.push(`Avg: ${avgKcal} kcal/day${vsGoal}`);
  }
  const macroParts = [
    ["protein", avgOf((log) => log.proteinG)],
    ["carbs", avgOf((log) => log.carbsG)],
    ["fat", avgOf((log) => log.fatG)],
    ["fiber", avgOf((log) => log.fiberG)],
  ].filter(([, value]) => value !== null);
  if (macroParts.length > 0) {
    summaryParts.push(
      `Avg macros: ${macroParts.map(([name, value]) => `${name} ${value} g`).join(", ")}`,
    );
  }
  lines.push(summaryParts.join(" | "), "");

  if (days.length > 0) {
    lines.push(
      "### Daily totals",
      "| Date | kcal | Protein (g) | Carbs (g) | Fat (g) | Fiber (g) |",
      "|---|---|---|---|---|---|",
    );
    for (const day of days) {
      const cell = (value: number | null) => value ?? "—";
      lines.push(
        `| ${day.date} | ${cell(day.kcal)} | ${cell(day.proteinG)} | ` +
          `${cell(day.carbsG)} | ${cell(day.fatG)} | ${cell(day.fiberG)} |`,
      );
    }
    lines.push("");
  }

  lines.push("### Meals (repeated meals shown once, with occurrence count)");
  if (data.mealItems.length === 0) {
    lines.push("No meal-level data synced in this period.", "");
  } else {
    lines.push("");
    for (const group of groupMeals(data.mealItems)) {
      lines.push(...renderMealGroup(group));
    }
  }
  return lines;
}

function renderStrengthSession(session: SessionDetail): string[] {
  const headerParts = [
    session.durationMin !== null ? `${session.durationMin} min` : null,
    session.totalLoadKg !== null
      ? `total load ${session.totalLoadKg} kg`
      : null,
  ].filter(Boolean);
  const suffix = headerParts.length > 0 ? ` (${headerParts.join(", ")})` : "";

  const lines = [`#### ${session.date} — ${session.templateName}${suffix}`];
  for (const exercise of session.exercises) {
    const sets =
      exercise.sets.length > 0
        ? exercise.sets.map(setLabel).join(", ")
        : "no sets recorded";
    const note = exercise.notes?.trim() ? ` (${exercise.notes.trim()})` : "";
    lines.push(`- ${exercise.name}: ${sets}${note}`);
  }
  if (session.notes?.trim()) lines.push(`Notes: ${session.notes.trim()}`);
  return [...lines, ""];
}

function renderCardioSession(session: SessionDetail): string[] {
  const lines = [`#### ${session.date} — ${session.templateName}`];
  const cardio = session.cardio;
  const metrics = cardio
    ? [
        cardio.durationMin !== null ? `${cardio.durationMin} min` : null,
        cardio.distanceKm !== null ? `${cardio.distanceKm} km` : null,
        cardio.avgSpeedKmh !== null ? `avg ${cardio.avgSpeedKmh} km/h` : null,
        cardio.maxSpeedKmh !== null ? `max ${cardio.maxSpeedKmh} km/h` : null,
        cardio.avgHr !== null ? `avg HR ${cardio.avgHr}` : null,
        cardio.cadence !== null ? `cadence ${cardio.cadence}` : null,
        cardio.avgPowerW !== null ? `avg power ${cardio.avgPowerW} W` : null,
        cardio.kcal !== null ? `${cardio.kcal} kcal` : null,
      ].filter(Boolean)
    : session.durationMin !== null
      ? [`${session.durationMin} min`]
      : [];
  if (metrics.length > 0) lines.push(metrics.join(" | "));
  const notes = cardio?.notes?.trim() ?? session.notes?.trim();
  if (notes) lines.push(`Notes: ${notes}`);
  return [...lines, ""];
}

function renderProgression(strength: SessionDetail[]): string[] {
  // Per-session set list per exercise name, in date order.
  const byExercise = new Map<string, SessionSetDetail[][]>();
  for (const session of strength) {
    for (const exercise of session.exercises) {
      if (exercise.sets.length === 0) continue;
      const appearances = byExercise.get(exercise.name) ?? [];
      appearances.push(exercise.sets);
      byExercise.set(exercise.name, appearances);
    }
  }

  const rows: string[] = [];
  for (const [name, appearances] of byExercise) {
    if (appearances.length < 2) continue;
    const firstTop = topSet(appearances[0]!);
    const lastTop = topSet(appearances[appearances.length - 1]!);
    if (!firstTop || !lastTop) continue;
    const firstE1rm = bestE1rm(appearances[0]!);
    const lastE1rm = bestE1rm(appearances[appearances.length - 1]!);
    const e1rmCell =
      firstE1rm !== null && lastE1rm !== null
        ? `${toFixed1(firstE1rm)} → ${toFixed1(lastE1rm)}`
        : "—";
    rows.push(
      `| ${name} | ${appearances.length} | ${setLabel(firstTop)} | ${setLabel(lastTop)} | ${e1rmCell} |`,
    );
  }

  if (rows.length === 0) return [];
  return [
    "### Exercise progression (first vs last session in period)",
    "Top set = heaviest set of the session. e1RM via Brzycki formula.",
    "",
    "| Exercise | Sessions | First top set | Last top set | Best e1RM first → last (kg) |",
    "|---|---|---|---|---|",
    ...rows,
    "",
  ];
}

function renderTraining(data: ExportData): string[] {
  const lines = ["## Training"];
  if (data.sessions.length === 0) return [...lines, NO_DATA, ""];

  const strength = data.sessions.filter((s) => s.type === "strength");
  const cardio = data.sessions.filter((s) => s.type === "cardio");
  lines.push(
    `${data.sessions.length} completed sessions: ` +
      `${strength.length} strength, ${cardio.length} cardio`,
    "",
  );

  if (strength.length > 0) {
    lines.push(
      "### Strength sessions",
      "Sets shown as weight(kg)xreps; BW = bodyweight.",
      "",
    );
    for (const session of strength) {
      lines.push(...renderStrengthSession(session));
    }
    lines.push(...renderProgression(strength));
  }

  if (cardio.length > 0) {
    lines.push("### Cardio sessions", "");
    for (const session of cardio) {
      lines.push(...renderCardioSession(session));
    }
  }
  return lines;
}

const MEASUREMENT_FIELDS = [
  ["Neck", "neck"],
  ["Chest", "chest"],
  ["Waist", "waist"],
  ["Bellybutton", "bellybutton"],
  ["Hips", "hips"],
  ["Biceps", "biceps"],
  ["Thigh", "thigh"],
] as const satisfies ReadonlyArray<readonly [string, keyof BodyMeasurement]>;

function renderMeasurements(data: ExportData): string[] {
  const lines = ["## Body Measurements (cm)"];
  if (data.measurements.length === 0) return [...lines, NO_DATA, ""];

  lines.push(
    `| Date | ${MEASUREMENT_FIELDS.map(([label]) => label).join(" | ")} |`,
    `|---|${MEASUREMENT_FIELDS.map(() => "---").join("|")}|`,
  );
  for (const row of data.measurements) {
    const cells = MEASUREMENT_FIELDS.map(([, field]) => {
      const value = num(row[field] as string | null);
      return value !== null ? toFixed1(value) : "—";
    });
    lines.push(`| ${row.date} | ${cells.join(" | ")} |`);
  }

  // First vs last recorded value per field (fields can be null on any row).
  const changes: string[] = [];
  for (const [label, field] of MEASUREMENT_FIELDS) {
    const values = data.measurements
      .map((row) => num(row[field] as string | null))
      .filter((value): value is number => value !== null);
    if (values.length < 2) continue;
    const first = values[0]!;
    const last = values[values.length - 1]!;
    changes.push(
      `${label.toLowerCase()} ${toFixed1(first)} → ${toFixed1(last)} (${signed(last - first)})`,
    );
  }
  if (changes.length > 0) {
    lines.push("", `Change (first → last entry): ${changes.join(", ")}`);
  }

  const notes = data.measurements.filter((row) => row.notes.trim() !== "");
  if (notes.length > 0) {
    lines.push("");
    for (const row of notes) {
      lines.push(`${row.date} note: ${row.notes.trim()}`);
    }
  }
  return [...lines, ""];
}

export function renderExportMarkdown(data: ExportData): string {
  const totalDays =
    Math.round(
      (Date.parse(data.range.end) - Date.parse(data.range.start)) / DAY_MS,
    ) + 1;

  const lines = [
    "# Fitness Data Export",
    `Period: ${data.range.start} to ${data.range.end} (${totalDays} days)`,
    "",
    ...renderBodyWeight(data, totalDays),
    ...renderNutrition(data, totalDays),
    ...renderSteps(data, totalDays),
    ...renderTraining(data),
    ...renderMeasurements(data),
  ];

  return (
    lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd() + "\n"
  );
}
