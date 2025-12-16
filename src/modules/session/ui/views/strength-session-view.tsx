"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { History, Trash2, Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/modules/session/schemas";
import { completeStrengthSession } from "@/modules/session/actions";
import { SessionSummaryDialog } from "@/modules/session/ui/components/session-summary-dialog";

type TemplateExercise = { id: string; name: string; position: number };

type Props = {
  template: { id: string; name: string; exercises: TemplateExercise[] };
  last: null | {
    session: { id: string; startAt: string | Date };
    exercises: Array<{
      id: string;
      name: string;
      position: number;
      sets: Array<{ setIndex: number; reps: number; weight: string | null }>;
    }>;
  };
  trainingId: string;
};

export function StrengthSessionView({ template, last, trainingId }: Props) {
  const router = useRouter();
  const sessionStartAtMs = useMemo(() => new Date().getTime(), []);
  const [elapsed, setElapsed] = useState("00:00:00");
  useEffect(() => {
    const start = sessionStartAtMs;
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
  }, [sessionStartAtMs]);

  const defaultExercises = useMemo<
    StrengthSessionFormValues["exercises"]
  >(() => {
    return template.exercises.map((e) => {
      const lastEx = last?.exercises.find((le) => le.position === e.position);
      const sets = lastEx?.sets?.length
        ? lastEx.sets.map((s, idx) => ({
            setIndex: idx,
            reps: s.reps,
            weight:
              s.weight != null && s.weight !== ""
                ? Number(s.weight)
                : undefined,
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

  const prevSetsByPosition = useMemo<
    Record<number, Array<{ reps: number; weight?: number }>>
  >(() => {
    const result: Record<number, Array<{ reps: number; weight?: number }>> = {};
    if (!last?.exercises?.length) return result;
    for (const ex of last.exercises) {
      const sets = (ex.sets ?? []).map((s) => ({
        reps: s.reps,
        weight:
          s.weight != null && s.weight !== "" ? Number(s.weight) : undefined,
      }));
      result[ex.position] = sets;
    }
    return result;
  }, [last]);

  const form = useForm<StrengthSessionFormValues>({
    resolver: zodResolver(
      strengthSessionSchema,
    ) as Resolver<StrengthSessionFormValues>,
    defaultValues: { exercises: defaultExercises, trainingId },
  });

  const {
    formState: { isSubmitting },
  } = form;

  // console.log("form.formState.errors", form.formState.errors);

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

  const handleRemoveExercise = useCallback(
    (exIndex: number) => {
      const exercise = exercisesArr.fields[exIndex];
      if (!exercise) return;

      const exerciseData = form.getValues(`exercises.${exIndex}`);
      exercisesArr.remove(exIndex);

      toast(`Removed ${exercise.name}`, {
        action: {
          label: "Undo",
          onClick: () => {
            exercisesArr.insert(exIndex, exerciseData);
            toast.success(`Restored ${exercise.name}`);
          },
        },
      });
    },
    [exercisesArr, form],
  );

  const onSubmit = async (values: StrengthSessionFormValues) => {
    try {
      // Compute client-side summary
      const durationSec = Math.max(
        0,
        Math.floor((Date.now() - sessionStartAtMs) / 1000),
      );
      const totalLoadKg =
        values.exercises?.reduce((acc, ex) => {
          const vol =
            ex.sets?.reduce((sum, s) => {
              const w = s.weight ?? 0;
              const r = s.reps ?? 0;
              return sum + w * r;
            }, 0) ?? 0;
          return acc + vol;
        }, 0) ?? 0;

      // Build progress vs last by position
      const prevByPosition: Record<
        number,
        Array<{ reps: number; weight?: number }>
      > = {};
      for (const ex of last?.exercises ?? []) {
        prevByPosition[ex.position] = (ex.sets ?? []).map((s) => ({
          reps: s.reps,
          weight:
            s.weight != null && s.weight !== "" ? Number(s.weight) : undefined,
        }));
      }
      const progressFull =
        values.exercises?.map((ex) => {
          const currentVolume =
            ex.sets?.reduce((sum, s) => {
              const w = s.weight ?? 0;
              const r = s.reps ?? 0;
              return sum + w * r;
            }, 0) ?? 0;
          const prevSets = prevByPosition[ex.position] ?? [];
          const prevVolume =
            prevSets?.reduce((sum, s) => {
              const w = s.weight ?? 0;
              const r = s.reps ?? 0;
              return sum + w * r;
            }, 0) ?? 0;
          const delta = currentVolume - prevVolume;
          return {
            position: ex.position,
            name: ex.name,
            prevVolume,
            currentVolume,
            delta,
          };
        }) ?? [];

      await completeStrengthSession({
        startedAt: new Date(sessionStartAtMs).toISOString(),
        ...values,
        durationSec,
        totalLoadKg,
        progress: progressFull,
      });

      setSummary({
        durationSec,
        totalLoadKg,
        progress: progressFull
          .filter((p) => p.delta > 0)
          .map((p) => ({ name: p.name, delta: p.delta })),
      });
      setOpen(true);
    } catch {
      toast.error("Failed to save session");
    }
  };

  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<{
    durationSec: number | null;
    totalLoadKg: number;
    progress: Array<{ name: string; delta: number }>;
  } | null>(null);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        router.push("/dashboard");
      }
      setOpen(nextOpen);
    },
    [router],
  );

  return (
    <div className="space-y-6">
      <div className="bg-background sticky top-16 z-40 flex items-center justify-between pt-2 pb-4">
        <h1 className="text-2xl font-bold">{template.name}</h1>
        <div className="text-muted-foreground">Time: {elapsed}</div>
      </div>
      {last?.exercises?.some((e) => (e.sets?.length ?? 0) > 0) ? (
        <Alert className="bg-muted/40 border-border">
          <History />
          <AlertDescription>
            <span className="font-medium">
              Using values from your last session
            </span>{" "}
            <span className="text-muted-foreground">
              (
              {new Date(last.session.startAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
              ) — adjust as needed.
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {exercisesArr.fields.map((field, exIndex) => (
              <Card key={field.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {field.position + 1}. {field.name}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                      disabled={isSubmitting}
                      onClick={() => handleRemoveExercise(exIndex)}
                      title="Remove exercise"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ExerciseSets
                    control={form.control}
                    exIndex={exIndex}
                    prevSets={prevSetsByPosition[field.position] ?? []}
                    prevExerciseLastDoneAt={
                      exIndex > 0
                        ? (mostRecentDoneByExercise[exIndex - 1] ?? null)
                        : null
                    }
                    sessionStartAtMs={sessionStartAtMs}
                    onMostRecentChange={onExerciseMostRecentChange}
                    onProgressChange={onExerciseProgressChange}
                    isActive={activeExerciseIndex === exIndex}
                    disabled={isSubmitting}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-background sticky bottom-0 z-40 -mx-4 px-4 py-4 sm:static sm:mx-0 sm:flex sm:justify-end sm:px-0">
            <Button
              className="w-full text-center sm:w-auto"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Complete session
            </Button>
          </div>
        </form>
      </Form>
      <SessionSummaryDialog
        open={open}
        onOpenChange={handleClose}
        summary={summary}
        elapsedTime={elapsed}
        onClose={() => handleClose(false)}
      />
    </div>
  );
}

function ExerciseSets({
  control,
  exIndex,
  prevSets,
  prevExerciseLastDoneAt,
  sessionStartAtMs,
  onMostRecentChange,
  onProgressChange,
  isActive,
  disabled,
}: {
  control: ReturnType<typeof useForm<StrengthSessionFormValues>>["control"];
  exIndex: number;
  prevSets: Array<{ reps: number; weight?: number }>;
  prevExerciseLastDoneAt: number | null;
  sessionStartAtMs: number;
  onMostRecentChange: (index: number, mostRecent: number | null) => void;
  onProgressChange: (index: number, done: number, total: number) => void;
  isActive: boolean;
  disabled?: boolean;
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

  const compare = (
    current: number | undefined,
    previous: number | undefined,
  ) => {
    if (previous == null || current == null) return "neutral" as const;
    if (current > previous) return "up" as const;
    if (current < previous) return "down" as const;
    return "equal" as const;
  };

  const deltaClass = (delta: "up" | "down" | "equal" | "neutral") => {
    if (delta === "up")
      return "bg-emerald-500/15 dark:bg-emerald-500/15 border-emerald-500/40 focus-visible:ring-emerald-500/40";
    if (delta === "down")
      return "bg-rose-500/15 dark:bg-rose-500/15 border-rose-500/40 focus-visible:ring-rose-500/40";
    return "";
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-2">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>Current rest</span>
        <span className="tabular-nums">{isActive ? currentRest : "—"}</span>
      </div>
      {(() => {
        const prevCount = prevSets.length;
        const currentCount = fields.length;
        if (prevCount === 0) return null;
        if (currentCount === prevCount)
          return (
            <div className="text-muted-foreground text-xs">
              Same number of sets as last time ({prevCount})
            </div>
          );
        if (currentCount > prevCount)
          return (
            <div className="text-xs text-emerald-400/80">
              More sets than last time (+{currentCount - prevCount})
            </div>
          );
        return (
          <div className="text-xs text-rose-400/80">
            Fewer sets than last time ({currentCount}/{prevCount})
          </div>
        );
      })()}
      {fields.map((f, setIdx) => (
        // single set row
        <div
          key={f.id}
          className="bg-muted/40 mb-2 grid grid-cols-3 items-center gap-2 rounded-lg border p-3 last:mb-0 sm:grid-cols-6"
        >
          <div className="order-first col-span-3 flex items-center justify-between sm:order-last sm:col-span-3">
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
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive ml-2 h-8 w-8"
              tabIndex={-1}
              disabled={disabled}
              onClick={() => remove(setIdx)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
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
                    disabled={!!doneMap[f.id] || disabled}
                    tabIndex={-1}
                    className="bg-background"
                  />
                </FormControl>
                <div className="invisible text-[10px]">placeholder</div>
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
                    value={field.value ?? ""}
                    className={`${deltaClass(
                      compare(
                        typeof field.value === "string"
                          ? field.value === ""
                            ? undefined
                            : Number(field.value)
                          : (field.value as number | undefined),
                        prevSets?.[setIdx]?.reps,
                      ),
                    )} bg-background`}
                    disabled={!!doneMap[f.id] || disabled}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                {prevSets?.[setIdx]?.reps != null ? (
                  <div className="text-muted-foreground text-[10px]">
                    prev: {prevSets[setIdx].reps}
                  </div>
                ) : (
                  <div className="invisible text-[10px]">placeholder</div>
                )}
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
                    min={0}
                    placeholder="0 = Bodyweight"
                    value={field.value ?? ""}
                    className={`${deltaClass(
                      compare(
                        typeof field.value === "number"
                          ? field.value
                          : undefined,
                        prevSets?.[setIdx]?.weight,
                      ),
                    )} bg-background`}
                    disabled={!!doneMap[f.id] || disabled}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                {prevSets?.[setIdx]?.weight != null ? (
                  <div className="text-muted-foreground text-[10px]">
                    prev:{" "}
                    {prevSets[setIdx].weight === 0
                      ? "Bodyweight"
                      : prevSets[setIdx].weight}
                  </div>
                ) : (
                  <div className="invisible text-[10px]">placeholder</div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={disabled}
        onClick={() => {
          const lastSet = sets?.[sets.length - 1];
          append({
            setIndex: fields.length,
            reps: lastSet?.reps ?? 5,
            weight: lastSet?.weight ?? undefined,
          });
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> Add set
      </Button>
    </div>
  );
}
