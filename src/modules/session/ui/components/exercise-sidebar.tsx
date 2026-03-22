"use client";

import { Check, CircleDot, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseSidebarProps {
  exercises: Array<{ name: string; position: number }>;
  progressByExercise: Record<number, { done: number; total: number }>;
  activeExerciseIndex: number | null;
  onExerciseClick: (index: number) => void;
}

export function ExerciseSidebar({
  exercises,
  progressByExercise,
  activeExerciseIndex,
  onExerciseClick,
}: ExerciseSidebarProps) {
  return (
    <nav
      className="sticky top-32 hidden h-fit w-52 shrink-0 lg:block"
      aria-label="Exercises"
    >
      <div className="text-muted-foreground mb-3 text-[11px] font-medium uppercase tracking-wide">
        Exercises
      </div>
      <div className="relative space-y-0.5">
        {/* Vertical connector line */}
        <div className="bg-border absolute top-3 bottom-3 left-[17px] w-px" />

        {exercises.map((ex, i) => {
          const p = progressByExercise[i];
          const isComplete = p ? p.done >= p.total : false;
          const isActive = i === activeExerciseIndex;
          const setLabel = p ? `${p.done}/${p.total}` : "";

          return (
            <button
              key={i}
              type="button"
              onClick={() => onExerciseClick(i)}
              className={cn(
                "relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-sm transition-all",
                isActive
                  ? "bg-primary/10 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              <div className="relative z-10 flex h-5 w-5 items-center justify-center">
                {isComplete ? (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                ) : isActive ? (
                  <CircleDot className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate">{ex.name}</span>
              {setLabel && (
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {setLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
