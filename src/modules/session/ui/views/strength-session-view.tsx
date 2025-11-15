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
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type TemplateExercise = { id: string; name: string; position: number };

type Props = {
  session: { id: string; startAt: string | Date };
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
};

export function TrainingStrengthSessionView({
  session,
  template,
  last,
}: Props) {
  const router = useRouter();
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
        sessionId: session.id,
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
      <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b py-4">
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
              <div key={field.id} className="rounded-md border p-4">
                <div className="mb-3 font-medium">
                  {field.position + 1}. {field.name}
                </div>
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
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit">Complete session</Button>
          </div>
        </form>
      </Form>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training summary</DialogTitle>
            <DialogDescription>
              Here’s a quick recap of your session. Closing will take you to the
              dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total time</span>
              <span className="font-medium tabular-nums">
                {(() => {
                  const sec = summary?.durationSec ?? null;
                  if (sec == null) return elapsed;
                  const h = Math.floor(sec / 3600)
                    .toString()
                    .padStart(2, "0");
                  const m = Math.floor((sec % 3600) / 60)
                    .toString()
                    .padStart(2, "0");
                  const s = Math.floor(sec % 60)
                    .toString()
                    .padStart(2, "0");
                  return `${h}:${m}:${s}`;
                })()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total load</span>
              <span className="font-medium tabular-nums">
                {(summary?.totalLoadKg ?? 0).toFixed(2)} kg
              </span>
            </div>
            {summary && summary.progress.length > 0 ? (
              <div className="pt-2">
                <div className="mb-1 font-medium">Progress</div>
                <ul className="list-disc space-y-1 pl-5">
                  {summary.progress.map((p, idx) => (
                    <li key={idx} className="text-sm">
                      {p.name}: +{p.delta.toFixed(2)} kg volume
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                No volume increase vs last session.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => handleClose(false)}>
              Go to dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
}: {
  control: ReturnType<typeof useForm<StrengthSessionFormValues>>["control"];
  exIndex: number;
  prevSets: Array<{ reps: number; weight?: number }>;
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
                    className={deltaClass(
                      compare(
                        typeof field.value === "string"
                          ? field.value === ""
                            ? undefined
                            : Number(field.value)
                          : (field.value as number | undefined),
                        prevSets?.[setIdx]?.reps,
                      ),
                    )}
                    disabled={!!doneMap[f.id]}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <div className="text-muted-foreground text-[10px]">
                  prev: {prevSets?.[setIdx]?.reps ?? "—"}
                </div>
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
                    className={deltaClass(
                      compare(
                        typeof field.value === "number"
                          ? field.value
                          : undefined,
                        prevSets?.[setIdx]?.weight,
                      ),
                    )}
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
                <div className="text-muted-foreground text-[10px]">
                  prev:{" "}
                  {prevSets?.[setIdx]?.weight === 0
                    ? "Bodyweight"
                    : (prevSets?.[setIdx]?.weight ?? "—")}
                </div>
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
