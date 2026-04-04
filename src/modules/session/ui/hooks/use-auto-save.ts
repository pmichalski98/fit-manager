"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWatch, type Control } from "react-hook-form";
import type { StrengthSessionFormValues } from "@/modules/session/schemas";
import { saveSessionProgress } from "@/modules/session/actions";
import type { InProgressSession } from "@/modules/session/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "stale";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function isStaleClientError(error: unknown): boolean {
  const msg =
    error instanceof Error ? error.message : String(error);
  return (
    msg.includes("not found") ||
    msg.includes("Failed to find server action") ||
    msg.includes("404")
  );
}

export function useAutoSave(
  sessionId: string,
  control: Control<StrengthSessionFormValues>,
  doneMapRef: React.RefObject<Record<string, Record<string, boolean>>>,
  doneTrigger: number,
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const retriesRef = useRef(0);

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
      if (isMountedRef.current) {
        setSaveStatus("saved");
        retriesRef.current = 0;
      }
    } catch (error) {
      console.error("[auto-save] Failed to save session progress:", error);

      if (!isMountedRef.current) return;

      if (isStaleClientError(error)) {
        setSaveStatus("stale");
        return;
      }

      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current += 1;
        console.warn(
          `[auto-save] Retrying (${retriesRef.current}/${MAX_RETRIES})...`,
        );
        setSaveStatus("saving");
        timerRef.current = setTimeout(() => doSaveRef.current(), RETRY_DELAY_MS);
      } else {
        setSaveStatus("error");
        retriesRef.current = 0;
      }
    }
  }, [sessionId, exercises, doneMapRef]);

  // Debounce saves — 1 second after last change
  // doneTrigger increments on every done-checkbox toggle to trigger a save
  const doSaveRef = useRef(doSave);
  useEffect(() => {
    doSaveRef.current = doSave;
  }, [doSave]);

  const changeCountRef = useRef(0);
  useEffect(() => {
    // Skip the first two triggers (initial mount + useWatch population)
    changeCountRef.current += 1;
    if (changeCountRef.current <= 2) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSaveRef.current(), 1000);
  }, [exercises, doneTrigger]);

  return { saveStatus, saveNow: doSave };
}
