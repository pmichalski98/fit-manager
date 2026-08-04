"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { type Control } from "react-hook-form";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { type CreateTrainingInput } from "@/modules/training/schemas";
import { useState } from "react";

export function ExerciseRow({
  id,
  index,
  onRemove,
  control,
}: {
  id: string;
  index: number;
  onRemove: () => void;
  control: Control<CreateTrainingInput>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2.5">
      <button
        type="button"
        aria-label="Drag to reorder"
        className="text-faint hover:text-secondary-foreground flex h-[34px] w-5 shrink-0 cursor-grab items-center justify-center transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <span className="text-faint flex h-[34px] w-5 shrink-0 items-center justify-end font-mono text-[11px]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <FormField
        control={control}
        name={`exercises.${index}.name` as const}
        render={({ field }) => (
          <FormItem className="min-w-0 flex-1">
            <FormLabel className="sr-only">Exercise name</FormLabel>
            <FormControl>
              <Input placeholder="Exercise name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`exercises.${index}.targetSets` as const}
        render={({ field }) => (
          <FormItem className="w-14 shrink-0">
            <FormLabel className="sr-only">Target sets</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="—"
                className="px-1 text-center font-mono"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`exercises.${index}.targetRepsMin` as const}
        render={({ field }) => (
          <FormItem className="w-14 shrink-0">
            <FormLabel className="sr-only">Min reps</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="—"
                className="px-1 text-center font-mono"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`exercises.${index}.targetRepsMax` as const}
        render={({ field }) => (
          <FormItem className="w-14 shrink-0">
            <FormLabel className="sr-only">Max reps</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="—"
                className="px-1 text-center font-mono"
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            aria-label="Remove exercise"
            className="text-faint hover:text-destructive flex h-[34px] w-7 shrink-0 items-center justify-center transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this exercise and all its history
              from past sessions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRemove();
                setShowDeleteAlert(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
