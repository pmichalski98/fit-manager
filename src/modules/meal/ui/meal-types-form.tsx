"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateEnabledMealTypes } from "../actions";
import { MEAL_TYPE_LABELS, MEAL_TYPES, type MealType } from "../schemas";

type Props = {
  initialEnabled: MealType[];
};

export function MealTypesForm({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState<MealType[]>(initialEnabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (mealType: MealType, checked: boolean) => {
    const newTypes = checked
      ? [...enabled, mealType].sort(
          (a, b) => MEAL_TYPES.indexOf(a) - MEAL_TYPES.indexOf(b),
        )
      : enabled.filter((t) => t !== mealType);

    if (newTypes.length === 0) {
      toast.error("At least one meal type must be enabled");
      return;
    }

    const prev = enabled;
    setEnabled(newTypes);

    startTransition(async () => {
      const result = await updateEnabledMealTypes(newTypes);
      if (!result.ok) {
        setEnabled(prev);
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-3">
      {MEAL_TYPES.map((type) => {
        const isEnabled = enabled.includes(type);
        const isLastEnabled = isEnabled && enabled.length === 1;

        return (
          <div key={type} className="flex items-center justify-between">
            <Label htmlFor={`meal-type-${type}`} className="font-normal">
              {MEAL_TYPE_LABELS[type]}
            </Label>
            <Switch
              id={`meal-type-${type}`}
              checked={isEnabled}
              onCheckedChange={(checked) => handleToggle(type, checked)}
              disabled={isPending || isLastEnabled}
            />
          </div>
        );
      })}
    </div>
  );
}
