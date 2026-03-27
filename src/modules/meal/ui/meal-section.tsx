"use client";

import { PlusIcon, BookmarkIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MealEntryCard } from "./meal-entry-card";
import { MEAL_TYPE_LABELS, type MealType } from "../schemas";
import type { MealEntry, FoodProduct } from "@/server/db/schema";

type Props = {
  mealType: MealType;
  entries: { entry: MealEntry; product: FoodProduct }[];
  onAddProductClick: (mealType: MealType) => void;
  onAddTemplateClick: (mealType: MealType) => void;
  onSaveAsTemplate: (mealType: MealType) => void;
};

export function MealSection({
  mealType,
  entries,
  onAddProductClick,
  onAddTemplateClick,
  onSaveAsTemplate,
}: Props) {
  const totalKcal = entries.reduce(
    (sum, e) => sum + Number(e.entry.kcal ?? 0),
    0,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">
            {MEAL_TYPE_LABELS[mealType]}
          </h3>
          {entries.length > 0 && (
            <span className="text-muted-foreground text-xs">
              {Math.round(totalKcal)} kcal
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {entries.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onSaveAsTemplate(mealType)}
              title="Save as meal template"
            >
              <SaveIcon className="mr-1 h-3.5 w-3.5" />
              Save
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddProductClick(mealType)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddTemplateClick(mealType)}>
                <BookmarkIcon className="mr-2 h-4 w-4" />
                Add saved meal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-1.5">
          {entries.map((e) => (
            <MealEntryCard key={e.entry.id} entry={e.entry} product={e.product} />
          ))}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => onAddProductClick(mealType)}
            className="text-muted-foreground hover:border-primary/30 hover:text-foreground flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-xs transition-colors"
          >
            <PlusIcon className="mr-1 h-3.5 w-3.5" />
            Add product
          </button>
          <button
            onClick={() => onAddTemplateClick(mealType)}
            className="text-muted-foreground hover:border-primary/30 hover:text-foreground flex flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-xs transition-colors"
          >
            <BookmarkIcon className="mr-1 h-3.5 w-3.5" />
            Saved meal
          </button>
        </div>
      )}
    </div>
  );
}
