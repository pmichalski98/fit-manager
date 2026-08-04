"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { RenameExerciseDialog } from "./rename-exercise-dialog";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { createTraining, updateTraining } from "@/modules/training/actions";
import {
  trainingFormSchema,
  type CreateTrainingInput,
} from "@/modules/training/schemas";
import { ExerciseRow } from "./exercise-row";

type TrainingFormProps = {
  trainingId?: string;
  defaultValues?: CreateTrainingInput;
  onSuccess?: (values: CreateTrainingInput) => void;
  onCancel?: () => void;
};

export function TrainingForm({
  trainingId,
  defaultValues,
  onSuccess,
  onCancel,
}: TrainingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSubmitValues, setPendingSubmitValues] =
    useState<CreateTrainingInput | null>(null);
  const [renameConfirmState, setRenameConfirmState] = useState<{
    index: number;
    oldName: string;
    newName: string;
  } | null>(null);

  const form = useForm<CreateTrainingInput>({
    resolver: zodResolver(trainingFormSchema) as Resolver<CreateTrainingInput>,
    defaultValues: defaultValues ?? {
      type: "strength",
      name: "",
      exercises: [
        {
          name: "",
          targetSets: null,
          targetRepsMin: null,
          targetRepsMax: null,
        },
      ],
    },
  });

  const isStrength = form.watch("type") === "strength";
  const exercisesErrorMessage = isStrength
    ? (
        form.formState.errors as {
          exercises?: { message?: string };
        }
      ).exercises?.message
    : undefined;

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "exercises",
    keyName: "_id",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = fields.findIndex((f) => f._id === active.id);
      const newIndex = fields.findIndex((f) => f._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      move(oldIndex, newIndex);
    },
    [fields, move],
  );

  // Helper to detect renames
  const checkForRenames = (values: CreateTrainingInput) => {
    if (!defaultValues?.exercises || !values.exercises) return null;

    // Only check exercises that exist in both (have an ID)
    for (let i = 0; i < values.exercises.length; i++) {
      const newEx = values.exercises[i];
      if (!newEx?.id) continue;

      const oldEx = defaultValues.exercises.find((e) => e.id === newEx.id);
      if (oldEx && oldEx.name !== newEx.name && newEx.replace === undefined) {
        return { index: i, oldName: oldEx.name, newName: newEx.name };
      }
    }
    return null;
  };

  const performSubmit = async (values: CreateTrainingInput) => {
    try {
      setIsSubmitting(true);
      if (trainingId) {
        const result = await updateTraining(trainingId, values);
        if (result.ok) {
          toast.success("Training updated");
          onSuccess?.(values);
        } else {
          toast.error("Failed to update training");
        }
      } else {
        const result = await createTraining(values);
        if (result.ok) {
          toast.success("Training created");
          form.reset();
          onSuccess?.(values);
        } else {
          toast.error("Failed to create training");
        }
      }
    } catch {
      toast.error(
        trainingId ? "Failed to update training" : "Failed to create training",
      );
    } finally {
      setIsSubmitting(false);
      setPendingSubmitValues(null);
      setRenameConfirmState(null);
    }
  };

  const onSubmit = async (values: CreateTrainingInput) => {
    // Only check for renames if we are editing an existing training
    if (trainingId) {
      const rename = checkForRenames(values);
      if (rename) {
        setPendingSubmitValues(values);
        setRenameConfirmState(rename);
        return;
      }
    }

    await performSubmit(values);
  };

  const handleRenameDecision = (replace: boolean) => {
    if (!pendingSubmitValues || !renameConfirmState) return;

    const newValues = { ...pendingSubmitValues };
    if (newValues.exercises) {
      // Clone to avoid mutating state directly before submit
      const exercises = [...newValues.exercises];
      const currentExercise = exercises[renameConfirmState.index];
      if (currentExercise) {
        exercises[renameConfirmState.index] = {
          ...currentExercise,
          replace,
        };
        newValues.exercises = exercises;
      }
    }

    // Check for more renames or submit
    const nextRename = checkForRenames(newValues);
    if (nextRename) {
      setPendingSubmitValues(newValues);
      setRenameConfirmState(nextRename);
    } else {
      void performSubmit(newValues);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-5 p-5">
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="min-w-0 flex-1">
                    <FormLabel className="label-caps">Training name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Push Day / Easy run"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!trainingId && (
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-caps">Type</FormLabel>
                      <FormControl>
                        <div className="bg-input-bg border-input flex h-[34px] gap-0.5 rounded-sm border p-0.5">
                          <button
                            type="button"
                            onClick={() => field.onChange("strength")}
                            className={cn(
                              "rounded-[4px] px-3.5 text-[11px] tracking-[0.04em] uppercase transition-colors",
                              field.value === "strength"
                                ? "bg-primary text-primary-foreground font-bold"
                                : "text-muted-foreground hover:text-primary font-semibold",
                            )}
                          >
                            Strength
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange("cardio")}
                            className={cn(
                              "rounded-[4px] px-3.5 text-[11px] tracking-[0.04em] uppercase transition-colors",
                              field.value === "cardio"
                                ? "bg-cardio text-primary-foreground font-bold"
                                : "text-muted-foreground hover:text-cardio font-semibold",
                            )}
                          >
                            Cardio
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {isStrength ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5 pb-0.5">
                  <span className="w-[50px] shrink-0" />
                  <span className="label-caps min-w-0 flex-1">Exercise</span>
                  <span className="label-caps w-14 shrink-0 text-center">
                    Sets
                  </span>
                  <span className="label-caps w-14 shrink-0 text-center">
                    Min
                  </span>
                  <span className="label-caps w-14 shrink-0 text-center">
                    Max
                  </span>
                  <span className="w-7 shrink-0" />
                </div>

                <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                  <SortableContext
                    items={fields.map((f) => f._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {fields.map((field, index) => (
                        <ExerciseRow
                          key={field._id}
                          id={field._id}
                          index={index}
                          onRemove={() => remove(index)}
                          control={form.control}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <button
                  type="button"
                  onClick={() =>
                    append({
                      name: "",
                      targetSets: null,
                      targetRepsMin: null,
                      targetRepsMax: null,
                    })
                  }
                  className="border-input text-muted-foreground hover:border-primary hover:text-primary ml-[60px] flex h-[34px] items-center justify-center gap-1.5 rounded-sm border border-dashed text-[11px] font-semibold tracking-[0.06em] uppercase transition-colors"
                >
                  <Plus className="size-3.5" />
                  Add exercise
                </button>
                <FormMessage>{exercisesErrorMessage}</FormMessage>
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-t px-5 py-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? trainingId
                  ? "Saving..."
                  : "Creating..."
                : trainingId
                  ? "Save changes"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </Form>

      <RenameExerciseDialog
        open={!!renameConfirmState}
        oldName={renameConfirmState?.oldName}
        newName={renameConfirmState?.newName}
        onDecision={handleRenameDecision}
        onDismiss={() => {
          setRenameConfirmState(null);
          setPendingSubmitValues(null);
          setIsSubmitting(false);
        }}
      />
    </>
  );
}
