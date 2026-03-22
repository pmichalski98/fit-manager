import { useEffect } from "react";

interface UseSessionKeyboardShortcutsOptions {
  activeExerciseIndex: number | null;
  exerciseCount: number;
  /** Called when Enter is pressed — should toggle done on next incomplete set */
  onToggleNextDone: () => void;
  /** Called with target index to scroll to a different exercise */
  onNavigateExercise: (index: number) => void;
}

const INTERACTIVE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"]);

export function useSessionKeyboardShortcuts({
  activeExerciseIndex,
  exerciseCount,
  onToggleNextDone,
  onNavigateExercise,
}: UseSessionKeyboardShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag && INTERACTIVE_TAGS.has(tag)) return;

      switch (e.key) {
        case "Enter": {
          e.preventDefault();
          onToggleNextDone();
          break;
        }
        case "ArrowLeft": {
          if (activeExerciseIndex == null) return;
          const prev = Math.max(0, activeExerciseIndex - 1);
          if (prev !== activeExerciseIndex) {
            e.preventDefault();
            onNavigateExercise(prev);
          }
          break;
        }
        case "ArrowRight": {
          if (activeExerciseIndex == null) return;
          const next = Math.min(exerciseCount - 1, activeExerciseIndex + 1);
          if (next !== activeExerciseIndex) {
            e.preventDefault();
            onNavigateExercise(next);
          }
          break;
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [
    activeExerciseIndex,
    exerciseCount,
    onToggleNextDone,
    onNavigateExercise,
  ]);
}
