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

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createTraining, updateTraining } from "@/modules/training/actions";
import {
  trainingFormSchema,
  type CreateTrainingInput,
} from "@/modules/training/schemas";
import { ExerciseRow } from "./exercise-row";

type TrainingFormProps = {
  trainingId?: string;
  defaultValues?: CreateTrainingInput;
  onSuccess?: () => void;
};

export function TrainingForm({
  trainingId,
  defaultValues,
  onSuccess,
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
      type: "cardio",
      name: "",
      exercises: [{ name: "" }],
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
          onSuccess?.();
        } else {
          toast.error("Failed to update training");
        }
      } else {
        const result = await createTraining(values);
        if (result.ok) {
          toast.success("Training created");
          form.reset();
          onSuccess?.();
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Select
                      disabled={!!trainingId}
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Chest day / Easy run" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isStrength ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Exercises</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "" })}
                >
                  <Plus className="size-4" /> Add exercise
                </Button>
              </div>

              <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                <SortableContext
                  items={fields.map((f) => f._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
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
              <FormMessage>{exercisesErrorMessage}</FormMessage>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? trainingId
                  ? "Updating..."
                  : "Creating..."
                : trainingId
                  ? "Update training"
                  : "Create training"}
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog
        open={!!renameConfirmState}
        onOpenChange={(open) => {
          if (!open) {
            setRenameConfirmState(null);
            setPendingSubmitValues(null);
            setIsSubmitting(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exercise Renamed</AlertDialogTitle>
            <AlertDialogDescription>
              You renamed <strong>{renameConfirmState?.oldName}</strong> to{" "}
              <strong>{renameConfirmState?.newName}</strong>. Did you correct a
              typo, or is this a completely new exercise?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => handleRenameDecision(false)}
            >
              Just renamed (Keep history)
            </Button>
            <Button onClick={() => handleRenameDecision(true)}>
              New exercise (Reset history)
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
