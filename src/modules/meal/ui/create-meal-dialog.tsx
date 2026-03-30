"use client";

import { useState } from "react";
import {
  Loader2Icon,
  SearchIcon,
  PlusIcon,
  Trash2Icon,
  SparklesIcon,
} from "lucide-react";
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
import { estimateWithAI } from "@/modules/food/actions";
import { useFoodSearch } from "@/modules/food/hooks/use-food-search";
import { saveMealAsTemplate } from "../actions";
import type { FoodProduct } from "@/server/db/schema";

type IngredientRow = {
  product: FoodProduct;
  amountG: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateMealDialog({ open, onOpenChange }: Props) {
  const [mealName, setMealName] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Ingredient search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);

  const { isSearching, localResults, reset: resetSearchResults } =
    useFoodSearch(searchQuery, showSearch);

  const handleAddLocal = (product: FoodProduct) => {
    setIngredients([
      ...ingredients,
      { product, amountG: product.defaultServingG },
    ]);
    resetSearch();
  };

  const handleAIEstimate = async () => {
    if (!searchQuery.trim()) return;
    setIsEstimating(true);
    const result = await estimateWithAI(searchQuery);
    if (result.ok) {
      setIngredients([
        ...ingredients,
        { product: result.data, amountG: result.data.defaultServingG },
      ]);
      resetSearch();
      toast.success("AI estimated macros");
    } else {
      toast.error(result.error);
    }
    setIsEstimating(false);
  };

  const resetSearch = () => {
    setSearchQuery("");
    resetSearchResults();
    setShowSearch(false);
  };

  const updateAmount = (index: number, amount: number) => {
    setIngredients(
      ingredients.map((ing, i) =>
        i === index ? { ...ing, amountG: amount } : ing,
      ),
    );
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const totalMacros = ingredients.reduce(
    (acc, ing) => {
      const factor = ing.amountG / 100;
      return {
        kcal: acc.kcal + Number(ing.product.kcalPer100g) * factor,
        protein: acc.protein + Number(ing.product.proteinPer100g) * factor,
        carbs: acc.carbs + Number(ing.product.carbsPer100g) * factor,
        fat: acc.fat + Number(ing.product.fatPer100g) * factor,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const handleSave = async () => {
    if (!mealName.trim()) {
      toast.error("Enter a meal name");
      return;
    }
    if (ingredients.length === 0) {
      toast.error("Add at least one ingredient");
      return;
    }

    setIsSaving(true);
    const result = await saveMealAsTemplate(
      mealName.trim(),
      null,
      ingredients.map((ing) => ({
        foodProductId: ing.product.id,
        amountG: ing.amountG,
      })),
    );

    if (result.ok) {
      toast.success(`"${mealName.trim()}" saved`);
      setMealName("");
      setIngredients([]);
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create meal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Meal name */}
          <div>
            <Label>Meal name</Label>
            <Input
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g. Butter Chicken"
              autoFocus
            />
          </div>

          {/* Ingredients list */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Ingredients ({ingredients.length})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearch(true)}
              >
                <PlusIcon className="mr-1 h-3.5 w-3.5" />
                Add ingredient
              </Button>
            </div>

            {ingredients.length > 0 ? (
              <div className="space-y-2">
                {ingredients.map((ing, i) => {
                  const kcal =
                    (Number(ing.product.kcalPer100g) * ing.amountG) / 100;
                  return (
                    <div
                      key={`${ing.product.id}-${i}`}
                      className="flex items-center gap-2 rounded-lg border p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {ing.product.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {Math.round(kcal)} kcal
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={ing.amountG}
                          onChange={(e) =>
                            updateAmount(i, Number(e.target.value))
                          }
                          className="h-7 w-20 text-xs"
                          step="1"
                          min="0.1"
                        />
                        <span className="text-muted-foreground text-xs">g</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 shrink-0 p-0 text-destructive"
                        onClick={() => removeIngredient(i)}
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}

                {/* Totals */}
                <div className="text-muted-foreground grid grid-cols-4 gap-2 rounded-lg bg-muted/50 p-2 text-center text-xs">
                  <div>
                    <p className="text-foreground font-bold">
                      {Math.round(totalMacros.kcal)}
                    </p>
                    <p>kcal</p>
                  </div>
                  <div>
                    <p className="text-foreground font-bold">
                      {Math.round(totalMacros.protein)}g
                    </p>
                    <p>protein</p>
                  </div>
                  <div>
                    <p className="text-foreground font-bold">
                      {Math.round(totalMacros.carbs)}g
                    </p>
                    <p>carbs</p>
                  </div>
                  <div>
                    <p className="text-foreground font-bold">
                      {Math.round(totalMacros.fat)}g
                    </p>
                    <p>fat</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
                No ingredients yet. Click &quot;Add ingredient&quot; to start building
                your meal.
              </p>
            )}
          </div>

          {/* Ingredient search (inline) */}
          {showSearch && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Search ingredient</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={resetSearch}
                >
                  Cancel
                </Button>
              </div>

              <div className="relative">
                <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
                {isSearching && (
                  <Loader2Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
                )}
              </div>

              <div className="max-h-48 overflow-y-auto">
                {localResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddLocal(p)}
                    className="hover:bg-accent flex w-full items-center gap-2 rounded p-1.5 text-left text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {Number(p.kcalPer100g)} kcal/100g
                    </span>
                  </button>
                ))}
              </div>

              {searchQuery.length >= 2 && !isSearching && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAIEstimate}
                  disabled={isEstimating}
                >
                  {isEstimating ? (
                    <Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <SparklesIcon className="mr-1 h-3.5 w-3.5" />
                  )}
                  {isEstimating
                    ? "Searching the web..."
                    : `AI estimate "${searchQuery}"`}
                </Button>
              )}
            </div>
          )}

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={
              isSaving || !mealName.trim() || ingredients.length === 0
            }
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
