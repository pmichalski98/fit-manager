import { useCallback } from "react";
import { type UseFormReturn, type UseFieldArrayReturn } from "react-hook-form";
import { toast } from "sonner";
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { updateTraining } from "@/modules/training/actions";
import type { StrengthSessionFormValues } from "@/modules/session/schemas";

type TemplateExercise = { id: string; name: string; position: number };
type Template = { name: string; exercises: TemplateExercise[] };

/** Higher than default to avoid conflicts with editable name inputs */
const DRAG_ACTIVATION_DISTANCE = 8;

export function useExerciseReorder({
  exercisesArr,
  form,
  doneMapRef,
  currentTemplate,
  setCurrentTemplate,
  trainingId,
  isRenaming,
  remapProgress,
}: {
  exercisesArr: UseFieldArrayReturn<StrengthSessionFormValues, "exercises">;
  form: UseFormReturn<StrengthSessionFormValues>;
  doneMapRef: React.MutableRefObject<Record<string, Record<string, boolean>>>;
  currentTemplate: Template;
  setCurrentTemplate: React.Dispatch<React.SetStateAction<Template & { id: string }>>;
  trainingId: string;
  isRenaming: boolean;
  remapProgress: (oldIndex: number, newIndex: number, length: number, mode: "move" | "swap") => void;
}) {
  const dndSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE },
    }),
  );

  /** Shared: update form positions, persist template, remap progress */
  const applyReorder = useCallback(
    (
      newExercises: TemplateExercise[],
      newDone: Record<string, Record<string, boolean>>,
      fromIndex: number,
      toIndex: number,
      length: number,
      mode: "move" | "swap",
    ) => {
      doneMapRef.current = newDone;

      for (let i = 0; i < length; i++) {
        form.setValue(`exercises.${i}.position`, i);
      }

      setCurrentTemplate((prev) => ({ ...prev, exercises: newExercises }));

      void updateTraining(trainingId, {
        name: currentTemplate.name,
        type: "strength",
        exercises: newExercises.map((e) => ({ id: e.id, name: e.name })),
      }).catch(() => toast.error("Failed to save exercise changes"));

      remapProgress(fromIndex, toIndex, length, mode);
    },
    [form, doneMapRef, currentTemplate, setCurrentTemplate, trainingId, remapProgress],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const fieldsBefore = exercisesArr.fields;
      const oldIndex = fieldsBefore.findIndex((f) => f.id === active.id);
      const newIndex = fieldsBefore.findIndex((f) => f.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      exercisesArr.move(oldIndex, newIndex);

      // Rebuild doneMap using move-semantics index remapping
      const oldDone = { ...doneMapRef.current };
      const newDone: Record<string, Record<string, boolean>> = {};
      const length = fieldsBefore.length;

      for (let i = 0; i < length; i++) {
        let sourceIndex: number;
        if (i === newIndex) {
          sourceIndex = oldIndex;
        } else if (oldIndex < newIndex) {
          sourceIndex = i >= oldIndex && i < newIndex ? i + 1 : i;
        } else {
          sourceIndex = i > newIndex && i <= oldIndex ? i - 1 : i;
        }
        const entry = oldDone[String(sourceIndex)];
        if (entry) newDone[String(i)] = entry;
      }

      const reorderedExercises = arrayMove(
        currentTemplate.exercises,
        oldIndex,
        newIndex,
      ).map((e, i) => ({ ...e, position: i }));

      applyReorder(reorderedExercises, newDone, oldIndex, newIndex, length, "move");
    },
    [exercisesArr, doneMapRef, currentTemplate, applyReorder],
  );

  /** Swap two exercises by 0-based index (for the editable position input) */
  const handlePositionSwap = useCallback(
    (fromIndex: number, toIndex: number) => {
      const length = exercisesArr.fields.length;
      if (
        fromIndex === toIndex ||
        toIndex < 0 ||
        toIndex >= length ||
        fromIndex < 0 ||
        fromIndex >= length
      )
        return;

      exercisesArr.swap(fromIndex, toIndex);

      // Swap doneMapRef entries (preserve sparseness)
      const oldDone = { ...doneMapRef.current };
      const newDone = { ...oldDone };
      const fromEntry = oldDone[String(fromIndex)];
      const toEntry = oldDone[String(toIndex)];
      if (toEntry) newDone[String(fromIndex)] = toEntry;
      else delete newDone[String(fromIndex)];
      if (fromEntry) newDone[String(toIndex)] = fromEntry;
      else delete newDone[String(toIndex)];

      // Swap template exercises
      const newExercises = [...currentTemplate.exercises];
      const tmp = newExercises[fromIndex]!;
      newExercises[fromIndex] = { ...newExercises[toIndex]!, position: fromIndex };
      newExercises[toIndex] = { ...tmp, position: toIndex };

      applyReorder(newExercises, newDone, fromIndex, toIndex, length, "swap");
    },
    [exercisesArr, doneMapRef, currentTemplate, applyReorder],
  );

  return {
    // Disable drag when rename dialog is open to prevent index corruption
    dndSensors: isRenaming ? [] : dndSensors,
    handleDragEnd,
    handlePositionSwap,
  };
}
