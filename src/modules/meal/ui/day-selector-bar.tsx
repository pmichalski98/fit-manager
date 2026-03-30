"use client";

import { format } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseLocalDate, type MacroGoals, type SummaryData } from "../schemas";

type Props = {
  dates: string[];
  summaries: SummaryData;
  goals: MacroGoals | null;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  isPending: boolean;
  today: string;
};

export function DaySelectorBar({
  dates,
  summaries,
  goals,
  selectedIndex,
  onSelect,
  onPrev,
  onNext,
  isPending,
  today,
}: Props) {
  const calGoal = goals?.caloricGoal ?? null;

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onPrev}
        disabled={isPending}
        className="shrink-0"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>

      <div className="flex flex-1 gap-1.5">
        {dates.map((date, i) => {
          const dateObj = parseLocalDate(date);
          const summary = summaries[date];
          const kcal = Math.round(Number(summary?.totalKcal ?? 0));
          const isActive = i === selectedIndex;
          const isToday = date === today;
          const progress = calGoal ? Math.min((kcal / calGoal) * 100, 100) : 0;

          return (
            <button
              key={date}
              onClick={() => onSelect(i)}
              className={`relative flex flex-1 flex-col items-center rounded-xl border px-2 py-2 transition-all ${
                isActive
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:bg-accent/50"
              }`}
            >
              <span
                className={`text-[10px] font-medium uppercase tracking-wide ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {format(dateObj, "EEE")}
              </span>
              <span className={`text-sm font-bold ${isActive ? "text-primary" : ""}`}>
                {format(dateObj, "dd/MM")}
              </span>
              <span className="text-muted-foreground mt-0.5 text-[10px] font-medium">
                {kcal} kcal
              </span>

              {/* Calorie progress bar */}
              {calGoal && (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progress > 100 ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Today dot */}
              {isToday && (
                <div className="bg-primary absolute -top-1 right-1.5 h-1.5 w-1.5 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onNext}
        disabled={isPending}
        className="shrink-0"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
