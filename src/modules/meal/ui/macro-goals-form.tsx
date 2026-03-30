"use client";

import { useState, useCallback } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateMacroGoals } from "../actions";
import type { MacroGoals } from "../schemas";

// Conversion: 1g protein = 4 kcal, 1g carbs = 4 kcal, 1g fat = 9 kcal
const PROTEIN_KCAL_PER_G = 4;
const CARBS_KCAL_PER_G = 4;
const FAT_KCAL_PER_G = 9;
const DEFAULT_FIBER_G = 25;

type Props = {
  initialGoals: MacroGoals | null;
};

function gramsToPercent(grams: number, kcalPerG: number, totalKcal: number): number {
  if (!totalKcal) return 0;
  return Math.round((grams * kcalPerG * 100) / totalKcal);
}

function percentToGrams(percent: number, kcalPerG: number, totalKcal: number): number {
  if (!totalKcal) return 0;
  return Math.round((percent * totalKcal) / (100 * kcalPerG));
}

export function MacroGoalsForm({ initialGoals }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"grams" | "percent">("grams");

  const [calories, setCalories] = useState(initialGoals?.caloricGoal ?? 2000);
  const [proteinG, setProteinG] = useState(initialGoals?.proteinGoal ?? 150);
  const [carbsG, setCarbsG] = useState(initialGoals?.carbsGoal ?? 250);
  const [fatG, setFatG] = useState(initialGoals?.fatGoal ?? 65);
  const [fiberG, setFiberG] = useState(initialGoals?.fiberGoal ?? DEFAULT_FIBER_G);

  // Derived percentages
  const proteinPct = gramsToPercent(proteinG, PROTEIN_KCAL_PER_G, calories);
  const carbsPct = gramsToPercent(carbsG, CARBS_KCAL_PER_G, calories);
  const fatPct = gramsToPercent(fatG, FAT_KCAL_PER_G, calories);
  const totalPct = proteinPct + carbsPct + fatPct;

  const handlePercentChange = useCallback(
    (macro: "protein" | "carbs" | "fat", pct: number) => {
      if (macro === "protein") {
        setProteinG(percentToGrams(pct, PROTEIN_KCAL_PER_G, calories));
        // Auto-fill carbs = remaining
        const remaining = 100 - pct - fatPct;
        if (remaining >= 0) {
          setCarbsG(percentToGrams(remaining, CARBS_KCAL_PER_G, calories));
        }
      } else if (macro === "fat") {
        setFatG(percentToGrams(pct, FAT_KCAL_PER_G, calories));
        // Auto-fill carbs = remaining
        const remaining = 100 - proteinPct - pct;
        if (remaining >= 0) {
          setCarbsG(percentToGrams(remaining, CARBS_KCAL_PER_G, calories));
        }
      } else {
        setCarbsG(percentToGrams(pct, CARBS_KCAL_PER_G, calories));
      }
    },
    [calories, proteinPct, fatPct],
  );

  const handleCaloriesChange = (newCal: number) => {
    setCalories(newCal);
    if (mode === "percent" && newCal > 0) {
      setProteinG(percentToGrams(proteinPct, PROTEIN_KCAL_PER_G, newCal));
      setCarbsG(percentToGrams(carbsPct, CARBS_KCAL_PER_G, newCal));
      setFatG(percentToGrams(fatPct, FAT_KCAL_PER_G, newCal));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await updateMacroGoals({
      caloricGoal: calories || null,
      proteinGoal: proteinG || null,
      carbsGoal: carbsG || null,
      fatGoal: fatG || null,
      fiberGoal: fiberG || null,
    });

    if (result.ok) {
      toast.success("Goals updated");
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 rounded-lg border p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setMode("grams")}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            mode === "grams"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Grams
        </button>
        <button
          type="button"
          onClick={() => setMode("percent")}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            mode === "percent"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Percentages
        </button>
      </div>

      {/* Calories — always in kcal */}
      <div className="max-w-xs">
        <Label htmlFor="caloricGoal">Calories (kcal)</Label>
        <Input
          id="caloricGoal"
          type="number"
          value={calories || ""}
          onChange={(e) => handleCaloriesChange(Number(e.target.value))}
          placeholder="2000"
        />
      </div>

      {/* Macros grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {mode === "grams" ? (
          <>
            <div>
              <Label htmlFor="proteinGoal">Protein (g)</Label>
              <Input
                id="proteinGoal"
                type="number"
                value={proteinG || ""}
                onChange={(e) => setProteinG(Number(e.target.value))}
                placeholder="150"
              />
              {calories > 0 && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">{proteinPct}% of calories</p>
              )}
            </div>
            <div>
              <Label htmlFor="carbsGoal">Carbs (g)</Label>
              <Input
                id="carbsGoal"
                type="number"
                value={carbsG || ""}
                onChange={(e) => setCarbsG(Number(e.target.value))}
                placeholder="250"
              />
              {calories > 0 && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">{carbsPct}% of calories</p>
              )}
            </div>
            <div>
              <Label htmlFor="fatGoal">Fat (g)</Label>
              <Input
                id="fatGoal"
                type="number"
                value={fatG || ""}
                onChange={(e) => setFatG(Number(e.target.value))}
                placeholder="65"
              />
              {calories > 0 && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">{fatPct}% of calories</p>
              )}
            </div>
            <div>
              <Label htmlFor="fiberGoal">Fiber (g)</Label>
              <Input
                id="fiberGoal"
                type="number"
                value={fiberG || ""}
                onChange={(e) => setFiberG(Number(e.target.value))}
                placeholder="25"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label htmlFor="proteinPct">Protein (%)</Label>
              <Input
                id="proteinPct"
                type="number"
                min={0}
                max={100}
                value={proteinPct || ""}
                onChange={(e) => handlePercentChange("protein", Number(e.target.value))}
                placeholder="30"
              />
              <p className="mt-0.5 text-[10px] text-muted-foreground">{proteinG}g</p>
            </div>
            <div>
              <Label htmlFor="carbsPct">
                Carbs (%)
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">auto</span>
              </Label>
              <Input
                id="carbsPct"
                type="number"
                min={0}
                max={100}
                value={carbsPct || ""}
                onChange={(e) => handlePercentChange("carbs", Number(e.target.value))}
                placeholder="50"
              />
              <p className="mt-0.5 text-[10px] text-muted-foreground">{carbsG}g</p>
            </div>
            <div>
              <Label htmlFor="fatPct">Fat (%)</Label>
              <Input
                id="fatPct"
                type="number"
                min={0}
                max={100}
                value={fatPct || ""}
                onChange={(e) => handlePercentChange("fat", Number(e.target.value))}
                placeholder="20"
              />
              <p className="mt-0.5 text-[10px] text-muted-foreground">{fatG}g</p>
            </div>
            <div>
              <Label htmlFor="fiberGoalPct">Fiber (g)</Label>
              <Input
                id="fiberGoalPct"
                type="number"
                value={fiberG || ""}
                onChange={(e) => setFiberG(Number(e.target.value))}
                placeholder="25"
              />
            </div>
          </>
        )}
      </div>

      {/* Percentage total indicator */}
      {calories > 0 && (
        <div className={`text-xs ${totalPct === 100 ? "text-green-500" : totalPct > 100 ? "text-destructive" : "text-muted-foreground"}`}>
          Macro split: {proteinPct}% P + {carbsPct}% C + {fatPct}% F = {totalPct}%
          {totalPct !== 100 && totalPct > 0 && (
            <span className="ml-1">({totalPct < 100 ? `${100 - totalPct}% remaining` : `${totalPct - 100}% over`})</span>
          )}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        Save goals
      </Button>
    </form>
  );
}
