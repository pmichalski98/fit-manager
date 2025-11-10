"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const sessionStartAtMs = new Date(session.startAt).getTime();
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

  const [mostRecentDoneByExercise, setMostRecentDoneByExercise] = useState<
    Record<number, number | null>
  >({});

  const [progressByExercise, setProgressByExercise] = useState<
    Record<number, { done: number; total: number }>
  >({});

  const onExerciseMostRecentChange = useCallback(
    (index: number, mostRecent: number | null) => {
      setMostRecentDoneByExercise((prev) => {
        if (prev[index] === mostRecent) return prev;
        return { ...prev, [index]: mostRecent };
      });
    },
    [],
  );

  const onExerciseProgressChange = useCallback(
    (index: number, done: number, total: number) => {
      setProgressByExercise((prev) => {
        const prevEntry = prev[index];
        if (prevEntry?.done === done && prevEntry?.total === total) {
          return prev;
        }
        return { ...prev, [index]: { done, total } };
      });
    },
    [],
  );

  const activeExerciseIndex = useMemo(() => {
    for (let i = 0; i < exercisesArr.fields.length; i++) {
      const p = progressByExercise[i];
      if (!p) return i; // assume not completed until we know
      if (p.done < p.total) return i;
    }
    return null;
  }, [exercisesArr.fields.length, progressByExercise]);

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
                <ExerciseSets
                  control={form.control}
                  exIndex={exIndex}
                  prevExerciseLastDoneAt={
                    exIndex > 0
                      ? (mostRecentDoneByExercise[exIndex - 1] ?? null)
                      : null
                  }
                  sessionStartAtMs={sessionStartAtMs}
                  onMostRecentChange={onExerciseMostRecentChange}
                  onProgressChange={onExerciseProgressChange}
                  isActive={activeExerciseIndex === exIndex}
                />
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
  prevExerciseLastDoneAt,
  sessionStartAtMs,
  onMostRecentChange,
  onProgressChange,
  isActive,
}: {
  control: ReturnType<typeof useForm<StrengthSessionFormValues>>["control"];
  exIndex: number;
  prevExerciseLastDoneAt: number | null;
  sessionStartAtMs: number;
  onMostRecentChange: (index: number, mostRecent: number | null) => void;
  onProgressChange: (index: number, done: number, total: number) => void;
  isActive: boolean;
}) {
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [restBySetId, setRestBySetId] = useState<Record<string, number>>({});
  const [, setTimestampBySetId] = useState<Record<string, number>>({});
  const [localMostRecentDoneAt, setLocalMostRecentDoneAt] = useState<
    number | null
  >(null);
  const [currentRest, setCurrentRest] = useState("00:00:00");

  const { fields, append, remove } = useFieldArray({
    name: `exercises.${exIndex}.sets`,
    control,
  });
  const sets = useWatch({
    control,
    name: `exercises.${exIndex}.sets`,
  });

  useEffect(() => {
    onMostRecentChange(exIndex, localMostRecentDoneAt);
  }, [exIndex, localMostRecentDoneAt, onMostRecentChange]);

  useEffect(() => {
    // only run timer for the active exercise
    if (!isActive) {
      setCurrentRest("00:00:00");
      return;
    }
    const restStart =
      localMostRecentDoneAt ??
      prevExerciseLastDoneAt ??
      sessionStartAtMs ??
      Date.now();
    const i = setInterval(() => {
      const diff = Math.max(0, Date.now() - restStart);
      const h = Math.floor(diff / 3600000)
        .toString()
        .padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setCurrentRest(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(i);
  }, [
    isActive,
    localMostRecentDoneAt,
    prevExerciseLastDoneAt,
    sessionStartAtMs,
  ]);

  // report progress (done vs total) to parent to compute active exercise
  useEffect(() => {
    const total = fields.length;
    const done = fields.reduce(
      (acc, field) => acc + (doneMap[field.id] ? 1 : 0),
      0,
    );
    onProgressChange(exIndex, done, total);
  }, [exIndex, fields, doneMap, onProgressChange]);

  const handleToggleDone = (id: string, nextValue: boolean) => {
    setDoneMap((prev) => ({ ...prev, [id]: nextValue }));
    if (nextValue) {
      const now = Date.now();
      const baseline =
        localMostRecentDoneAt ??
        prevExerciseLastDoneAt ??
        sessionStartAtMs ??
        now;
      const rest = Math.max(0, now - baseline);
      setRestBySetId((prev) => ({ ...prev, [id]: rest }));
      setTimestampBySetId((prev) => ({ ...prev, [id]: now }));
      setLocalMostRecentDoneAt(now);
    } else {
      setRestBySetId((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setTimestampBySetId((prev) => {
        const next = { ...prev };
        delete next[id];
        const remaining = Object.values(next);
        setLocalMostRecentDoneAt(
          remaining.length === 0 ? null : Math.max(...remaining),
        );
        return next;
      });
    }
  };

  const formatMs = (ms: number) => {
    const h = Math.floor(ms / 3600000)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((ms % 3600000) / 60000)
      .toString()
      .padStart(2, "0");
    const s = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-2">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>Current rest</span>
        <span className="tabular-nums">{isActive ? currentRest : "—"}</span>
      </div>
      {fields.map((f, setIdx) => (
        // single set row
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
                    disabled={!!doneMap[f.id]}
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
                  <Input
                    type="number"
                    inputMode="numeric"
                    disabled={!!doneMap[f.id]}
                    {...field}
                  />
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
                    disabled={!!doneMap[f.id]}
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
            <label className="mr-auto inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={!!doneMap[f.id]}
                onChange={(e) => handleToggleDone(f.id, e.target.checked)}
              />
              Done
              {(() => {
                const restValue = restBySetId[f.id];
                if (restValue === undefined) return null;
                return (
                  <span className="text-muted-foreground ml-2">
                    Rest:{" "}
                    <span className="tabular-nums">{formatMs(restValue)}</span>
                  </span>
                );
              })()}
            </label>
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
