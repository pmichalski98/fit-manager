"use client";

import { cn } from "@/lib/utils";

interface ExerciseProgressDotsProps {
  exerciseNames: string[];
  progressByExercise: Record<number, { done: number; total: number }>;
  currentIndex: number;
  onDotClick: (index: number) => void;
}

export function ExerciseProgressDots({
  exerciseNames,
  progressByExercise,
  currentIndex,
  onDotClick,
}: ExerciseProgressDotsProps) {
  const progress = progressByExercise[currentIndex];
  const setLabel = progress ? `${progress.done}/${progress.total}` : "";

  return (
    <div className="space-y-2">
      {/* Segmented progress bar */}
      <div className="flex gap-1">
        {exerciseNames.map((_, i) => {
          const p = progressByExercise[i];
          const isComplete = p ? p.done >= p.total : false;
          const isCurrent = i === currentIndex;
          const fillPercent = p && p.total > 0 ? (p.done / p.total) * 100 : 0;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onDotClick(i)}
              aria-label={`Go to ${exerciseNames[i]}`}
              className={cn(
                "relative h-1.5 flex-1 overflow-hidden rounded-full transition-all",
                isCurrent
                  ? "bg-primary/20"
                  : "bg-muted-foreground/15",
              )}
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
                  isComplete
                    ? "bg-primary"
                    : isCurrent
                      ? "bg-primary"
                      : "bg-muted-foreground/30",
                )}
                style={{ width: isComplete ? "100%" : `${fillPercent}%` }}
              />
            </button>
          );
        })}
      </div>

      {/* Exercise name + set count */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {exerciseNames[currentIndex] ?? ""}
        </span>
        {setLabel && (
          <span className="text-muted-foreground rounded-md bg-muted/60 px-2 py-0.5 text-xs tabular-nums">
            Set {setLabel}
          </span>
        )}
      </div>
    </div>
  );
}
