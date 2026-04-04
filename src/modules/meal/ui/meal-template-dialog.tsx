"use client";

import { useState, useEffect } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getMealTemplates, applyMealTemplate, deleteMealTemplate } from "../actions";
import { MEAL_TYPE_LABELS, type MealType } from "../schemas";

type Template = Awaited<ReturnType<typeof getMealTemplates>>[number];

type Props = {
  open: boolean;
  onOpenChange: () => void;
  date: string;
  mealType: MealType;
  onMutate?: () => void;
};

export function MealTemplateDialog({ open, onOpenChange, date, mealType, onMutate }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      getMealTemplates().then((data) => {
        setTemplates(data);
        setIsLoading(false);
      });
    }
  }, [open]);

  const handleApply = async (templateId: string) => {
    setApplyingId(templateId);
    const result = await applyMealTemplate(templateId, date, mealType);
    if (result.ok) {
      toast.success("Meal added");
      onOpenChange();
      onMutate?.();
    } else {
      toast.error(result.error);
    }
    setApplyingId(null);
  };

  const handleDelete = async (templateId: string) => {
    const result = await deleteMealTemplate(templateId);
    if (result.ok) {
      setTemplates(templates.filter((t) => t.id !== templateId));
      toast.success("Template deleted");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add saved meal to {MEAL_TYPE_LABELS[mealType]} — {date}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2Icon className="h-6 w-6 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No saved meals yet.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Add products to a meal and click &quot;Save&quot; to create a reusable meal.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => {
              const totalKcal = template.items.reduce(
                (sum, item) =>
                  sum +
                  (Number(item.product.kcalPer100g) * Number(item.amountG)) / 100,
                0,
              );

              return (
                <div
                  key={template.id}
                  className="group rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <span className="text-muted-foreground text-xs">
                          {Math.round(totalKcal)} kcal
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {template.items.map((item) => (
                          <p
                            key={item.id}
                            className="text-muted-foreground text-xs"
                          >
                            {item.product.name} — {Number(item.amountG)}g
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleApply(template.id)}
                        disabled={applyingId === template.id}
                      >
                        {applyingId === template.id ? (
                          <Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
