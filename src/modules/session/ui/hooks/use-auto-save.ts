"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWatch, type Control } from "react-hook-form";
import type { StrengthSessionFormValues } from "@/modules/session/schemas";
import { saveSessionProgress } from "@/modules/session/actions";
import type { InProgressSession } from "@/modules/session/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutoSave(
  sessionId: string,
  control: Control<StrengthSessionFormValues>,
  doneMapRef: React.RefObject<Record<string, Record<string, boolean>>>,
  doneTrigger: number,
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const exercises = useWatch({ control, name: "exercises" });

  const doSave = useCallback(async () => {
    if (!exercises?.length) return;

    setSaveStatus("saving");
    try {
      const payload: InProgressSession["exercises"] = exercises.map(
        (ex, exIndex) => ({
          templateExerciseId: ex.templateExerciseId ?? null,
          name: ex.name,
          position: ex.position,
          sets: (ex.sets ?? []).map((s) => ({
            setIndex: s.setIndex,
            reps: typeof s.reps === "number" ? s.reps : null,
            weight:
              s.weight != null && s.weight !== undefined
                ? Number(s.weight)
                : null,
            isDone:
              !!doneMapRef.current?.[String(exIndex)]?.[String(s.setIndex)],
          })),
        }),
      );

      await saveSessionProgress({ sessionId, exercises: payload });
      if (isMountedRef.current) setSaveStatus("saved");
    } catch {
      if (isMountedRef.current) setSaveStatus("error");
    }
  }, [sessionId, exercises, doneMapRef]);

  // Debounce saves — 1 second after last change
  // doneTrigger increments on every done-checkbox toggle to trigger a save
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip auto-save on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSave, 1000);
  }, [exercises, doneTrigger, doSave]);

  return { saveStatus, saveNow: doSave };
}
