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
import { Button } from "@/components/ui/button";
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

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            aria-label="Remove"
          >
            <Trash2 className="size-4" />
          </Button>
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
