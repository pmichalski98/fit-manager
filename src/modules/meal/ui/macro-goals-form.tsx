"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateMacroGoals } from "../actions";
import type { MacroGoals } from "../schemas";

type Props = {
  initialGoals: MacroGoals | null;
};

export function MacroGoalsForm({ initialGoals }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const result = await updateMacroGoals({
      caloricGoal: Number(fd.get("caloricGoal")) || null,
      proteinGoal: Number(fd.get("proteinGoal")) || null,
      carbsGoal: Number(fd.get("carbsGoal")) || null,
      fatGoal: Number(fd.get("fatGoal")) || null,
      fiberGoal: Number(fd.get("fiberGoal")) || null,
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div>
          <Label htmlFor="caloricGoal">Calories (kcal)</Label>
          <Input
            id="caloricGoal"
            name="caloricGoal"
            type="number"
            defaultValue={initialGoals?.caloricGoal ?? ""}
            placeholder="2000"
          />
        </div>
        <div>
          <Label htmlFor="proteinGoal">Protein (g)</Label>
          <Input
            id="proteinGoal"
            name="proteinGoal"
            type="number"
            defaultValue={initialGoals?.proteinGoal ?? ""}
            placeholder="150"
          />
        </div>
        <div>
          <Label htmlFor="carbsGoal">Carbs (g)</Label>
          <Input
            id="carbsGoal"
            name="carbsGoal"
            type="number"
            defaultValue={initialGoals?.carbsGoal ?? ""}
            placeholder="250"
          />
        </div>
        <div>
          <Label htmlFor="fatGoal">Fat (g)</Label>
          <Input
            id="fatGoal"
            name="fatGoal"
            type="number"
            defaultValue={initialGoals?.fatGoal ?? ""}
            placeholder="65"
          />
        </div>
        <div>
          <Label htmlFor="fiberGoal">Fiber (g)</Label>
          <Input
            id="fiberGoal"
            name="fiberGoal"
            type="number"
            defaultValue={initialGoals?.fiberGoal ?? ""}
            placeholder="30"
          />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        Save goals
      </Button>
    </form>
  );
}
