"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { saveMealAsTemplate } from "../actions";
import { MEAL_TYPE_LABELS, type MealType } from "../schemas";
import type { MealEntry, FoodProduct } from "@/server/db/schema";

type Props = {
  open: boolean;
  onOpenChange: () => void;
  mealType: MealType;
  entries: { entry: MealEntry; product: FoodProduct }[];
};

export function SaveTemplateDialog({
  open,
  onOpenChange,
  mealType,
  entries,
}: Props) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Enter a name for this meal");
      return;
    }

    setIsSaving(true);
    const result = await saveMealAsTemplate(
      name.trim(),
      mealType,
      entries.map((e) => ({
        foodProductId: e.entry.foodProductId,
        amountG: Number(e.entry.amountG),
      })),
    );

    if (result.ok) {
      toast.success("Meal saved as template");
      setName("");
      onOpenChange();
    } else {
      toast.error(result.error);
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as meal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`My ${MEAL_TYPE_LABELS[mealType].toLowerCase()}...`}
              autoFocus
            />
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
              {entries.length} items
            </p>
            {entries.map((e) => (
              <p key={e.entry.id} className="text-sm">
                {e.product.name}{" "}
                <span className="text-muted-foreground">
                  — {Number(e.entry.amountG)}g (
                  {Math.round(Number(e.entry.kcal ?? 0))} kcal)
                </span>
              </p>
            ))}
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="w-full"
          >
            {isSaving && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Save meal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
