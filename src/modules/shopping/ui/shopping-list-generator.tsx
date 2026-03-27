"use client";

import { useState } from "react";
import { Loader2Icon, ShoppingCartIcon, CopyIcon, CheckIcon } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  generateShoppingList,
  type ShoppingListGroup,
} from "../actions";

export function ShoppingListGenerator() {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [shoppingList, setShoppingList] = useState<ShoppingListGroup[] | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Generate dates for next 2 weeks
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const dates = Array.from({ length: 14 }, (_, i) =>
    format(addDays(weekStart, i), "yyyy-MM-dd"),
  );

  const toggleDate = (date: string) => {
    const next = new Set(selectedDates);
    if (next.has(date)) next.delete(date);
    else next.add(date);
    setSelectedDates(next);
  };

  const selectWeek = (weekStart: number) => {
    const next = new Set(selectedDates);
    for (let i = weekStart; i < weekStart + 7; i++) {
      if (dates[i]) next.add(dates[i]!);
    }
    setSelectedDates(next);
  };

  const handleGenerate = async () => {
    if (selectedDates.size === 0) {
      toast.error("Select at least one day");
      return;
    }

    setIsGenerating(true);
    const result = await generateShoppingList({
      dates: Array.from(selectedDates),
    });
    if (result.ok) {
      setShoppingList(result.data);
      setCheckedItems(new Set());
    } else {
      toast.error(result.error);
    }
    setIsGenerating(false);
  };

  const toggleCheck = (productId: string) => {
    const next = new Set(checkedItems);
    if (next.has(productId)) next.delete(productId);
    else next.add(productId);
    setCheckedItems(next);
  };

  const handleCopyAsText = () => {
    if (!shoppingList) return;

    const text = shoppingList
      .map((group) => {
        const items = group.items
          .map((item) => `  - ${item.productName} (${item.totalAmountG}g)`)
          .join("\n");
        return `${group.categoryName}:\n${items}`;
      })
      .join("\n\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Date selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Select days</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => selectWeek(0)}>
              This week
            </Button>
            <Button variant="outline" size="sm" onClick={() => selectWeek(7)}>
              Next week
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div
              key={day}
              className="text-muted-foreground text-center text-xs font-medium"
            >
              {day}
            </div>
          ))}
          {dates.map((date) => {
            const isSelected = selectedDates.has(date);
            const dateObj = new Date(date + "T00:00:00");
            return (
              <button
                key={date}
                onClick={() => toggleDate(date)}
                className={`rounded-lg p-2 text-center text-xs transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent border"
                }`}
              >
                {format(dateObj, "dd/MM")}
              </button>
            );
          })}
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || selectedDates.size === 0}
        className="w-full"
      >
        {isGenerating ? (
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCartIcon className="mr-2 h-4 w-4" />
        )}
        Generate shopping list ({selectedDates.size} days)
      </Button>

      {/* Shopping list */}
      {shoppingList && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Shopping List</h3>
            <Button variant="outline" size="sm" onClick={handleCopyAsText}>
              {copied ? (
                <CheckIcon className="mr-1 h-3.5 w-3.5" />
              ) : (
                <CopyIcon className="mr-1 h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy as text"}
            </Button>
          </div>

          {shoppingList.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No meals planned for the selected days.
            </p>
          ) : (
            shoppingList.map((group) => (
              <div key={group.categoryName} className="space-y-2">
                <h4 className="text-sm font-semibold">{group.categoryName}</h4>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <label
                      key={item.productId}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors ${
                        checkedItems.has(item.productId) ? "bg-muted/50 line-through opacity-50" : ""
                      }`}
                    >
                      <Checkbox
                        checked={checkedItems.has(item.productId)}
                        onCheckedChange={() => toggleCheck(item.productId)}
                      />
                      <span className="flex-1 text-sm">{item.productName}</span>
                      <span className="text-muted-foreground text-xs">
                        {item.totalAmountG}g
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
