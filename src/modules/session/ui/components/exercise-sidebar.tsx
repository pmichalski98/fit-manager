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
      <div className="label-caps mb-2">Exercises</div>
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
                "hover:bg-card relative flex w-full items-center gap-2.5 overflow-hidden rounded-sm px-2.5 py-2 text-left transition-all",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              {/* Progress fill background */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-sm transition-all duration-300",
                  isComplete
                    ? "bg-primary/12"
                    : fillPercent > 0
                      ? "bg-primary/8"
                      : "",
                )}
                style={{ width: `${fillPercent}%` }}
              />

              {/* Status indicator */}
              <div className="relative flex size-[18px] shrink-0 items-center justify-center">
                {isComplete ? (
                  <div className="bg-primary flex size-[18px] items-center justify-center rounded-[4px]">
                    <Check
                      className="text-primary-foreground size-[11px]"
                      strokeWidth={3.5}
                    />
                  </div>
                ) : (
                  <div className="border-input size-[9px] rounded-[2px] border" />
                )}
              </div>

              <span className="relative min-w-0 flex-1 text-xs leading-tight break-words">
                {ex.name}
              </span>
              {setLabel && (
                <span className="text-muted-foreground relative shrink-0 font-mono text-[11px]">
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
