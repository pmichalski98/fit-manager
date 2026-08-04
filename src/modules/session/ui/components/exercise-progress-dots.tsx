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
                "relative h-[5px] flex-1 overflow-hidden rounded-[3px] transition-all",
                isCurrent ? "bg-primary/20" : "bg-input",
              )}
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-[3px] transition-all duration-300",
                  isComplete
                    ? "bg-primary"
                    : isCurrent
                      ? "bg-primary"
                      : "bg-faint",
                )}
                style={{ width: isComplete ? "100%" : `${fillPercent}%` }}
              />
            </button>
          );
        })}
      </div>

      {/* Exercise name + set count */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold tracking-tight">
          {exerciseNames[currentIndex] ?? ""}
        </span>
        {setLabel && (
          <span className="text-muted-foreground bg-secondary rounded-[4px] px-2 py-0.5 font-mono text-[11px]">
            Set {setLabel}
          </span>
        )}
      </div>
    </div>
  );
}
