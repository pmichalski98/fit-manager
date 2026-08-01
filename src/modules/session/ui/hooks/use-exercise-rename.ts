import { useCallback, useRef, useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { updateTraining } from "@/modules/training/actions";
import type { StrengthSessionFormValues } from "@/modules/session/schemas";

type TemplateExercise = {
  id: string;
  name: string;
  position: number;
  targetSets: number | null;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
};
type Template = { name: string; exercises: TemplateExercise[] };

type RenameConfirm = {
  exIndex: number;
  templateExerciseId: string;
  oldName: string;
  newName: string;
};

export function useExerciseRename({
  currentTemplate,
  setCurrentTemplate,
  form,
  trainingId,
}: {
  currentTemplate: Template;
  setCurrentTemplate: React.Dispatch<
    React.SetStateAction<Template & { id: string }>
  >;
  form: UseFormReturn<StrengthSessionFormValues>;
  trainingId: string;
}) {
  const [renameConfirm, setRenameConfirm] = useState<RenameConfirm | null>(
    null,
  );
  const nameInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const handleExerciseNameBlur = useCallback(
    (exIndex: number, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;

      // Match by template exercise ID — form indexes can drift from the
      // template after ad-hoc adds or mid-session removals
      const templateExerciseId = form.getValues(
        `exercises.${exIndex}.templateExerciseId`,
      );
      const templateEx = templateExerciseId
        ? currentTemplate.exercises.find((e) => e.id === templateExerciseId)
        : undefined;

      if (!templateEx) {
        // Ad-hoc exercise — rename locally, nothing to sync to the template
        form.setValue(`exercises.${exIndex}.name`, trimmed);
        return;
      }
      if (templateEx.name === trimmed) return;

      form.setValue(`exercises.${exIndex}.name`, trimmed);
      setRenameConfirm({
        exIndex,
        templateExerciseId: templateEx.id,
        oldName: templateEx.name,
        newName: trimmed,
      });
    },
    [currentTemplate.exercises, form],
  );

  const handleRenameDecision = useCallback(
    (replace: boolean) => {
      if (!renameConfirm) return;
      const { templateExerciseId, newName } = renameConfirm;

      const updated = currentTemplate.exercises.map((e) =>
        e.id === templateExerciseId ? { ...e, name: newName } : e,
      );

      setCurrentTemplate((prev) => ({ ...prev, exercises: updated }));

      void updateTraining(trainingId, {
        name: currentTemplate.name,
        type: "strength",
        exercises: updated.map((e) => ({
          id: e.id,
          name: e.name,
          targetSets: e.targetSets,
          targetRepsMin: e.targetRepsMin,
          targetRepsMax: e.targetRepsMax,
          ...(e.id === templateExerciseId ? { replace } : {}),
        })),
      }).catch(() => toast.error("Failed to save exercise changes"));

      setRenameConfirm(null);
    },
    [renameConfirm, currentTemplate, setCurrentTemplate, trainingId],
  );

  const handleRenameDismiss = useCallback(() => {
    if (renameConfirm) {
      form.setValue(
        `exercises.${renameConfirm.exIndex}.name`,
        renameConfirm.oldName,
      );
      const input = nameInputRefs.current[renameConfirm.exIndex];
      if (input) input.value = renameConfirm.oldName;
    }
    setRenameConfirm(null);
  }, [renameConfirm, form]);

  return {
    renameConfirm,
    nameInputRefs,
    isRenaming: renameConfirm !== null,
    handleExerciseNameBlur,
    handleRenameDecision,
    handleRenameDismiss,
  };
}
