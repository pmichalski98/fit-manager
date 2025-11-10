"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  strengthSessionSchema,
  type StrengthSessionFormValues,
} from "@/modules/training/schemas";
import { completeStrengthSessionAction } from "@/modules/training/actions";

type TemplateExercise = { id: string; name: string; position: number };

type Props = {
  session: { id: string; startAt: string | Date };
  template: { id: string; name: string; exercises: TemplateExercise[] };
  last: null | {
    session: { id: string };
    exercises: Array<{
      id: string;
      name: string;
      position: number;
      sets: Array<{ setIndex: number; reps: number; weight: string | null }>;
    }>;
  };
};

export function TrainingStrengthSessionView({
  session,
  template,
  last,
}: Props) {
  const [elapsed, setElapsed] = useState("00:00:00");
  useEffect(() => {
    const start = new Date(session.startAt).getTime();
    const i = setInterval(() => {
      const diff = Math.max(0, Date.now() - start);
      const h = Math.floor(diff / 3600000)
        .toString()
        .padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(i);
  }, [session.startAt]);

  const defaultExercises = useMemo<
    StrengthSessionFormValues["exercises"]
  >(() => {
    return template.exercises.map((e) => {
      const lastEx = last?.exercises.find((le) => le.position === e.position);
      const sets = lastEx?.sets?.length
        ? lastEx.sets.map((s, idx) => ({
            setIndex: idx,
            reps: s.reps,
            weight: s.weight ? Number(s.weight) : undefined,
          }))
        : [{ setIndex: 0, reps: 5, weight: undefined }];
      return {
        templateExerciseId: e.id,
        name: e.name,
        position: e.position,
        sets,
      };
    });
  }, [template.exercises, last]);

  const form = useForm<StrengthSessionFormValues>({
    resolver: zodResolver(
      strengthSessionSchema,
    ) as unknown as Resolver<StrengthSessionFormValues>,
    defaultValues: { exercises: defaultExercises },
  });

  const exercisesArr = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const onSubmit = async (values: StrengthSessionFormValues) => {
    try {
      await completeStrengthSessionAction({ sessionId: session.id, ...values });
      toast.success("Session saved");
    } catch {
      toast.error("Failed to save session");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b py-4">
        <h1 className="text-2xl font-bold">{template.name}</h1>
        <div className="text-muted-foreground">Time: {elapsed}</div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {exercisesArr.fields.map((field, exIndex) => (
              <div key={field.id} className="rounded-md border p-4">
                <div className="mb-3 font-medium">
                  {field.position + 1}. {field.name}
                </div>
                <ExerciseSets control={form.control} exIndex={exIndex} />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit">Complete session</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function ExerciseSets({
  control,
  exIndex,
}: {
  control: ReturnType<typeof useForm<StrengthSessionFormValues>>["control"];
  exIndex: number;
}) {
  const { fields, append, remove } = useFieldArray({
    name: `exercises.${exIndex}.sets`,
    control,
  });
  const sets = useWatch({
    control,
    name: `exercises.${exIndex}.sets`,
  });
  return (
    <div className="space-y-2">
      {fields.map((f, setIdx) => (
        <div
          key={f.id}
          className="grid grid-cols-3 items-end gap-2 sm:grid-cols-6"
        >
          <FormField
            control={control}
            name={`exercises.${exIndex}.sets.${setIdx}.setIndex`}
            render={(_field) => (
              <FormItem>
                <FormLabel className="text-xs">Set</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={setIdx + 1}
                    readOnly
                    tabIndex={-1}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`exercises.${exIndex}.sets.${setIdx}.reps`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Reps</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`exercises.${exIndex}.sets.${setIdx}.weight`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Weight</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-span-3 flex justify-end sm:col-span-3">
            <Button
              type="button"
              variant="outline"
              tabIndex={-1}
              onClick={() => {
                const lastSet = sets?.[sets.length - 1];
                append({
                  setIndex: fields.length,
                  reps: lastSet?.reps ?? 5,
                  weight: lastSet?.weight ?? undefined,
                });
              }}
            >
              Add set
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="ml-2"
              tabIndex={-1}
              onClick={() => remove(setIdx)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
