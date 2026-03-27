"use client";

import { Progress } from "@/components/ui/progress";
import type { MacroGoals } from "../schemas";

type MacroBarProps = {
  label: string;
  value: number;
  goal: number | null;
  unit: string;
  color: string;
};

function MacroBar({ label, value, goal, unit, color }: MacroBarProps) {
  const percentage = goal ? Math.min((value / goal) * 100, 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {Math.round(value)}
          {goal ? `/${goal}` : ""} {unit}
        </span>
      </div>
      {goal ? (
        <Progress value={percentage} className={`h-1.5 ${color}`} />
      ) : (
        <Progress value={0} className="h-1.5" />
      )}
    </div>
  );
}

type MacroSummaryProps = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  goals: MacroGoals | null;
  compact?: boolean;
};

export function MacroSummary({
  kcal,
  protein,
  carbs,
  fat,
  fiber,
  goals,
  compact = false,
}: MacroSummaryProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="font-semibold">{Math.round(kcal)} kcal</span>
        <span className="text-muted-foreground">
          P: {Math.round(protein)}g · C: {Math.round(carbs)}g · F:{" "}
          {Math.round(fat)}g
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <MacroBar
        label="Calories"
        value={kcal}
        goal={goals?.caloricGoal ?? null}
        unit="kcal"
        color="[&>div]:bg-orange-500"
      />
      <MacroBar
        label="Protein"
        value={protein}
        goal={goals?.proteinGoal ?? null}
        unit="g"
        color="[&>div]:bg-red-500"
      />
      <MacroBar
        label="Carbs"
        value={carbs}
        goal={goals?.carbsGoal ?? null}
        unit="g"
        color="[&>div]:bg-blue-500"
      />
      <MacroBar
        label="Fat"
        value={fat}
        goal={goals?.fatGoal ?? null}
        unit="g"
        color="[&>div]:bg-yellow-500"
      />
      <MacroBar
        label="Fiber"
        value={fiber}
        goal={goals?.fiberGoal ?? null}
        unit="g"
        color="[&>div]:bg-green-500"
      />
    </div>
  );
}
