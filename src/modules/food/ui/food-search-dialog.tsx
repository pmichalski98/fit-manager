"use client";

import { useState } from "react";
import { SearchIcon, SparklesIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  importFromOpenFoodFacts,
  estimateWithAI,
} from "../actions";
import { useFoodSearch } from "../hooks/use-food-search";
import { addMealEntry } from "@/modules/meal/actions";
import { MEAL_TYPE_LABELS, type MealType } from "@/modules/meal/schemas";
import type { FoodProduct } from "@/server/db/schema";
import type { OnlineResult } from "../schemas";

type Props = {
  open: boolean;
  onOpenChange: () => void;
  date: string;
  mealType: MealType;
};

export function FoodSearchDialog({ open, onOpenChange, date, mealType }: Props) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);

  const { isSearching, localResults, onlineResults, reset: resetSearch } = useFoodSearch(query);

  const handleSelectLocal = (product: FoodProduct) => {
    setSelectedProduct(product);
    setAmount(String(product.defaultServingG));
  };

  const handleSelectOnline = async (product: OnlineResult) => {
    const result = await importFromOpenFoodFacts({
      code: product.code,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      kcalPer100g: product.kcalPer100g,
      proteinPer100g: product.proteinPer100g,
      carbsPer100g: product.carbsPer100g,
      fatPer100g: product.fatPer100g,
      fiberPer100g: product.fiberPer100g,
    });

    if (result.ok) {
      setSelectedProduct(result.data);
      setAmount(String(result.data.defaultServingG));
    } else {
      toast.error(result.error);
    }
  };

  const handleAIEstimate = async () => {
    if (!query.trim()) return;
    setIsEstimating(true);
    const result = await estimateWithAI(query);
    if (result.ok) {
      setSelectedProduct(result.data);
      setAmount(String(result.data.defaultServingG));
      toast.success("AI estimated macros — you can verify and edit later");
    } else {
      toast.error(result.error);
    }
    setIsEstimating(false);
  };

  const handleAdd = async () => {
    if (!selectedProduct || !amount) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0.1) {
      toast.error("Enter a valid amount");
      return;
    }

    setIsAdding(true);
    const result = await addMealEntry({
      date,
      mealType,
      foodProductId: selectedProduct.id,
      amountG: numAmount,
      notes: notes || null,
    });

    if (result.ok) {
      toast.success(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
      handleReset();
      onOpenChange();
    } else {
      toast.error(result.error);
    }
    setIsAdding(false);
  };

  const handleReset = () => {
    setQuery("");
    resetSearch();
    setSelectedProduct(null);
    setAmount("");
    setNotes("");
  };

  // Computed macros preview
  const previewMacros =
    selectedProduct && amount
      ? {
          kcal: (Number(selectedProduct.kcalPer100g) * Number(amount)) / 100,
          protein: (Number(selectedProduct.proteinPer100g) * Number(amount)) / 100,
          carbs: (Number(selectedProduct.carbsPer100g) * Number(amount)) / 100,
          fat: (Number(selectedProduct.fatPer100g) * Number(amount)) / 100,
        }
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add to {MEAL_TYPE_LABELS[mealType]} — {date}
          </DialogTitle>
        </DialogHeader>

        {!selectedProduct ? (
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search food products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
              {isSearching && (
                <Loader2Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
              )}
            </div>

            {/* Local results */}
            {localResults.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                  Your products
                </p>
                <div className="space-y-1">
                  {localResults.map((p) => (
                    <ProductRow
                      key={p.id}
                      name={p.name}
                      brand={p.brand}
                      kcal={Number(p.kcalPer100g)}
                      imageUrl={p.imageUrl}
                      isEstimate={p.source === "ai_estimate" && !p.isVerified}
                      onClick={() => handleSelectLocal(p)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Online results */}
            {onlineResults.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                  Online results
                </p>
                <div className="space-y-1">
                  {onlineResults.map((p) => (
                    <ProductRow
                      key={p.code}
                      name={p.name}
                      brand={p.brand}
                      kcal={p.kcalPer100g}
                      imageUrl={p.imageUrl}
                      onClick={() => handleSelectOnline(p)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI estimate button */}
            {query.length >= 2 && !isSearching && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAIEstimate}
                disabled={isEstimating}
              >
                {isEstimating ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SparklesIcon className="mr-2 h-4 w-4" />
                )}
                {isEstimating
                  ? "Estimating..."
                  : `Let AI estimate "${query}"`}
              </Button>
            )}

            {/* Empty state */}
            {query.length >= 2 &&
              !isSearching &&
              localResults.length === 0 &&
              onlineResults.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No results found. Try AI estimation above.
                </p>
              )}
          </div>
        ) : (
          /* Amount selection */
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="bg-muted flex h-10 w-10 items-center justify-center overflow-hidden rounded-md">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg">🍽️</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{selectedProduct.name}</p>
                <p className="text-muted-foreground text-xs">
                  {Number(selectedProduct.kcalPer100g)} kcal / 100g
                  {selectedProduct.source === "ai_estimate" &&
                    !selectedProduct.isVerified && (
                      <span className="ml-1 text-yellow-600">~ estimate</span>
                    )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProduct(null)}
              >
                Change
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium">Amount (g)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="1"
                min="0.1"
                autoFocus
              />
            </div>

            {previewMacros && (
              <div className="text-muted-foreground grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {Math.round(previewMacros.kcal)}
                  </p>
                  <p>kcal</p>
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {Math.round(previewMacros.protein)}g
                  </p>
                  <p>protein</p>
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {Math.round(previewMacros.carbs)}g
                  </p>
                  <p>carbs</p>
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {Math.round(previewMacros.fat)}g
                  </p>
                  <p>fat</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Recipe link, cooking tips..."
              />
            </div>

            <Button
              className="w-full"
              onClick={handleAdd}
              disabled={isAdding || !amount}
            >
              {isAdding ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Add to {MEAL_TYPE_LABELS[mealType].toLowerCase()}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductRow({
  name,
  brand,
  kcal,
  imageUrl,
  isEstimate,
  onClick,
}: {
  name: string;
  brand: string | null;
  kcal: number;
  imageUrl?: string | null;
  isEstimate?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-accent flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors"
    >
      <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs">🍽️</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {brand && (
          <p className="text-muted-foreground truncate text-xs">{brand}</p>
        )}
      </div>
      <div className="text-muted-foreground shrink-0 text-xs">
        {isEstimate && <span className="mr-1 text-yellow-600">~</span>}
        {Math.round(kcal)} kcal
      </div>
    </button>
  );
}
