"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseSidebarProps {
  exercises: Array<{ id: string; name: string; position: number }>;
  progressByExercise: Record<number, { done: number; total: number }>;
  activeExerciseIndex: number | null;
  onExerciseClick: (index: number) => void;
  children?: React.ReactNode;
}

export function ExerciseSidebar({
  exercises,
  progressByExercise,
  activeExerciseIndex,
  onExerciseClick,
  children,
}: ExerciseSidebarProps) {
  return (
    <nav
      className="sticky top-32 hidden h-fit w-60 shrink-0 lg:block"
      aria-label="Exercises"
    >
      <div className="text-muted-foreground mb-2 text-[11px] font-medium uppercase tracking-wide">
        Exercises
      </div>
      <div className="flex flex-col gap-0.5">
        {exercises.map((ex, i) => {
          const p = progressByExercise[i];
          const isComplete = p ? p.done >= p.total : false;
          const isActive = i === activeExerciseIndex;
          const setLabel = p ? `${p.done}/${p.total}` : "";

          const fillPercent = p && p.total > 0 ? (p.done / p.total) * 100 : 0;

          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => onExerciseClick(i)}
              className={cn(
                "relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-left text-sm transition-all",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              {/* Progress fill background */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-lg transition-all duration-300",
                  isComplete
                    ? "bg-primary/15"
                    : fillPercent > 0
                      ? "bg-primary/10"
                      : isActive
                        ? "bg-primary/5"
                        : "",
                )}
                style={{ width: fillPercent > 0 ? `${fillPercent}%` : isActive ? "100%" : "0%" }}
              />

              {/* Status indicator */}
              <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                {isComplete ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
                )}
              </div>

              <span className="relative min-w-0 flex-1 break-words text-[13px] leading-tight">
                {ex.name}
              </span>
              {setLabel && (
                <span className="text-muted-foreground relative shrink-0 text-xs tabular-nums">
                  {setLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </nav>
  );
}
