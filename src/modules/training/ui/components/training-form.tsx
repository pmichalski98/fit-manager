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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import {
  useFieldArray,
  useForm,
  type Resolver,
  type Control,
} from "react-hook-form";
import { toast } from "sonner";

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

import { createTrainingAction } from "@/modules/training/actions";
import {
  trainingFormSchema,
  type TrainingFormValues,
} from "@/modules/training/schemas";

type Props = {
  defaultValues?: Partial<TrainingFormValues>;
};

export function TrainingForm({ defaultValues }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(
      trainingFormSchema,
    ) as unknown as Resolver<TrainingFormValues>,
    defaultValues: {
      type: "cardio",
      name: "",
      exercises: [{ name: "" }],
      ...defaultValues,
    } as TrainingFormValues,
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

  const onSubmit = async (values: TrainingFormValues) => {
    try {
      setIsSubmitting(true);
      const result = await createTrainingAction(values);
      if (result.ok) {
        toast.success("Training created");
        form.reset();
      } else {
        toast.error("Failed to create training");
      }
    } catch {
      toast.error("Failed to create training");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            {isSubmitting ? "Creating..." : "Create training"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ExerciseRow({
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
