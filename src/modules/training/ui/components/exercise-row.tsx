"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { type Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { type TrainingFormValues } from "@/modules/training/schemas";

export function ExerciseRow({
  id,
  index,
  onRemove,
  control,
}: {
  id: string;
  index: number;
  onRemove: () => void;
  control: Control<TrainingFormValues>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-grab rounded-md border p-2"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <FormField
        control={control}
        name={`exercises.${index}.name` as const}
        render={({ field }) => (
          <FormItem className="flex-1">
            <FormLabel className="sr-only">Exercise name</FormLabel>
            <FormControl>
              <Input placeholder={`Exercise #${index + 1}`} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <Button
        type="button"
        variant="destructive"
        size="icon-sm"
        onClick={onRemove}
        aria-label="Remove"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
