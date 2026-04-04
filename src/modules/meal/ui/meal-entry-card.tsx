"use client";

import { useState, useEffect } from "react";
import { Trash2Icon, StickyNoteIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { deleteMealEntry, updateMealEntry } from "../actions";
import type { MealEntry, FoodProduct } from "@/server/db/schema";

type Props = {
  entry: MealEntry;
  product: FoodProduct;
  onMutate?: () => void;
};

export function MealEntryCard({ entry, product, onMutate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(String(entry.amountG));
  const [portionInput, setPortionInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const hasPortions = !!product.portionLabel && product.defaultServingG > 0;
  const portionCount = hasPortions
    ? Number(entry.amountG) / product.defaultServingG
    : null;

  // Sync amount/portion state when entry prop changes
  useEffect(() => {
    setAmount(String(entry.amountG));
    if (hasPortions) {
      const portions = Number(entry.amountG) / product.defaultServingG;
      setPortionInput(String(Math.round(portions * 10) / 10));
    }
  }, [entry.amountG, hasPortions, product.defaultServingG]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteMealEntry(entry.id);
    if (result.ok) {
      onMutate?.();
    } else {
      toast.error(result.error);
      setIsDeleting(false);
    }
  };

  const handleUpdateAmount = async () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0.1) {
      toast.error("Invalid amount");
      return;
    }
    const result = await updateMealEntry(entry.id, { amountG: numAmount });
    if (result.ok) {
      setIsEditing(false);
      onMutate?.();
    } else {
      toast.error(result.error);
    }
  };

  const handleUpdatePortions = async () => {
    const numPortions = Number(portionInput);
    if (isNaN(numPortions) || numPortions <= 0) {
      toast.error("Invalid portion count");
      return;
    }
    const computedAmountG = Math.round(numPortions * product.defaultServingG * 10) / 10;
    const result = await updateMealEntry(entry.id, { amountG: computedAmountG });
    if (result.ok) {
      setIsEditing(false);
      onMutate?.();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="group bg-card relative flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-accent/50">
      {/* Food photo */}
      <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-muted-foreground text-lg">🍽️</span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {isEditing ? (
            hasPortions ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdatePortions();
                }}
                className="flex items-center gap-1"
              >
                <Input
                  type="number"
                  value={portionInput}
                  onChange={(e) => setPortionInput(e.target.value)}
                  className="h-5 w-14 text-xs"
                  step="0.5"
                  min="0.1"
                  autoFocus
                />
                <span className="whitespace-nowrap">{product.portionLabel}</span>
                <Button type="submit" variant="ghost" size="sm" className="h-5 px-1 text-xs">
                  ✓
                </Button>
              </form>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateAmount();
                }}
                className="flex items-center gap-1"
              >
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-5 w-16 text-xs"
                  step="0.1"
                  min="0.1"
                  autoFocus
                />
                <span>g</span>
                <Button type="submit" variant="ghost" size="sm" className="h-5 px-1 text-xs">
                  ✓
                </Button>
              </form>
            )
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="hover:text-foreground flex items-center gap-0.5"
            >
              {hasPortions && portionCount != null
                ? `${Math.round(portionCount * 10) / 10} ${product.portionLabel}`
                : `${Number(entry.amountG)}g`}
              <PencilIcon className="h-2.5 w-2.5" />
            </button>
          )}
          <span>·</span>
          <span className="font-medium">{Math.round(Number(entry.kcal ?? 0))} kcal</span>
        </div>
        <div className="text-muted-foreground text-[10px]">
          P: {Math.round(Number(entry.protein ?? 0))}g · C:{" "}
          {Math.round(Number(entry.carbs ?? 0))}g · F:{" "}
          {Math.round(Number(entry.fat ?? 0))}g
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
        {entry.notes && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <StickyNoteIcon className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-sm">{entry.notes}</PopoverContent>
          </Popover>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
