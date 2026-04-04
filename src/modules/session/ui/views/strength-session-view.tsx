"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  History,
  Trash2,
  Plus,
  Loader2,
  RotateCcw,
  Check,
  CloudOff,
  RefreshCw,
  Timer,
  CheckCircle2,
  GripVertical,
} from "lucide-react";
import { DndContext } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormField } from "@/components/ui/form";
import { NumberStepper } from "@/modules/session/ui/components/number-stepper";
import {
  strengthSessionSchema,
  type StrengthSessionFormValues,
} from "@/modules/session/schemas";
import { completeStrengthSession } from "@/modules/session/actions";
import { SessionSummaryDialog } from "@/modules/session/ui/components/session-summary-dialog";
import { DiscardSessionButton } from "@/modules/session/ui/components/discard-session-button";
import type { InProgressSession } from "@/modules/session/types";
import {
  useAutoSave,
  type SaveStatus,
} from "@/modules/session/ui/hooks/use-auto-save";
import { useWakeLock } from "@/modules/session/ui/hooks/use-wake-lock";
import { useMediaQuery } from "@/modules/session/ui/hooks/use-media-query";
import { SwipeableExerciseNav } from "@/modules/session/ui/components/swipeable-exercise-nav";
import { ExerciseProgressDots } from "@/modules/session/ui/components/exercise-progress-dots";
import { ExerciseSidebar } from "@/modules/session/ui/components/exercise-sidebar";
import { useSessionKeyboardShortcuts } from "@/modules/session/ui/hooks/use-session-keyboard-shortcuts";
import { useExerciseRename } from "@/modules/session/ui/hooks/use-exercise-rename";
import { useExerciseReorder } from "@/modules/session/ui/hooks/use-exercise-reorder";
import { RenameExerciseDialog } from "@/modules/training/ui/components/rename-exercise-dialog";
import { cn } from "@/lib/utils";

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
  sessionId: string;
  inProgress: InProgressSession | null;
};

export function StrengthSessionView({
  template,
  last,
  trainingId,
  sessionId,
  inProgress,
}: Props) {
  const router = useRouter();
  const isResuming = inProgress !== null && inProgress.exercises.length > 0;
  const [currentTemplate, setCurrentTemplate] = useState(template);

  const sessionStartAtMs = useMemo(
    () => (inProgress ? new Date(inProgress.startAt).getTime() : Date.now()),
    [inProgress],
  );
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

  const initialDoneMap = useMemo(() => {
    if (!inProgress?.exercises.length) return null;
    const map: Record<string, Record<number, boolean>> = {};
    for (const ex of inProgress.exercises) {
      const exKey = String(ex.position);
      map[exKey] = {};
      for (const s of ex.sets) {
        map[exKey][s.setIndex] = s.isDone;
      }
    }
    return map;
  }, [inProgress]);

  const defaultExercises = useMemo<
    StrengthSessionFormValues["exercises"]
  >(() => {
    if (isResuming && inProgress) {
      return inProgress.exercises.map((e) => ({
        templateExerciseId: e.templateExerciseId ?? undefined,
        name: e.name,
        position: e.position,
        sets: e.sets.map((s) => ({
          setIndex: s.setIndex,
          reps: s.reps ?? 5,
          weight: s.weight ?? undefined,
        })),
      }));
    }

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
  }, [template.exercises, last, isResuming, inProgress]);

  // Key by template exercise ID so lookups stay correct after reorder
  const prevSetsByExerciseId = useMemo<
    Record<string, Array<{ reps: number; weight?: number }>>
  >(() => {
    const result: Record<string, Array<{ reps: number; weight?: number }>> = {};
    if (!last?.exercises?.length) return result;
    for (const ex of last.exercises) {
      const templateEx = template.exercises.find(
        (te) => te.position === ex.position,
      );
      if (!templateEx) continue;
      result[templateEx.id] = (ex.sets ?? []).map((s) => ({
        reps: s.reps,
        weight:
          s.weight != null && s.weight !== "" ? Number(s.weight) : undefined,
      }));
    }
    return result;
  }, [last, template.exercises]);

  const form = useForm<StrengthSessionFormValues>({
    resolver: zodResolver(
      strengthSessionSchema,
    ) as Resolver<StrengthSessionFormValues>,
    defaultValues: { exercises: defaultExercises, trainingId },
  });

  const {
    formState: { isSubmitting },
  } = form;

  const exercisesArr = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  const doneMapRef = useRef<Record<string, Record<string, boolean>>>({});
  const [doneTrigger, setDoneTrigger] = useState(0);
  const updateDoneMapRef = useCallback(
    (exIndex: number, _setId: string, setIndex: number, isDone: boolean) => {
      const exKey = String(exIndex);
      if (!doneMapRef.current[exKey]) doneMapRef.current[exKey] = {};
      doneMapRef.current[exKey][String(setIndex)] = isDone;
      setDoneTrigger((c) => c + 1);
    },
    [],
  );

  const { saveStatus } = useAutoSave(
    sessionId,
    form.control,
    doneMapRef,
    doneTrigger,
  );
  useWakeLock();

  const isMobile = useMediaQuery("(max-width: 639px)");
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

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
      if (!p) return i;
      if (p.done < p.total) return i;
    }
    return null;
  }, [exercisesArr.fields.length, progressByExercise]);

  useEffect(() => {
    if (isMobile && activeExerciseIndex != null) {
      setCurrentExerciseIndex(activeExerciseIndex);
    }
  }, [isMobile, activeExerciseIndex]);

  const exerciseNames = useMemo(
    () => exercisesArr.fields.map((f) => f.name),
    [exercisesArr.fields],
  );

  const exerciseRefs = useRef<(HTMLDivElement | null)[]>([]);
  const handleSidebarClick = useCallback((index: number) => {
    exerciseRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const handleToggleNextDone = useCallback(() => {
    document.dispatchEvent(new CustomEvent("session:toggle-next-done"));
  }, []);

  // --- Inline exercise editing: rename + reorder ---

  const {
    renameConfirm,
    nameInputRefs,
    isRenaming,
    handleExerciseNameBlur,
    handleRenameDecision,
    handleRenameDismiss,
  } = useExerciseRename({ currentTemplate, setCurrentTemplate, form, trainingId });

  const { dndSensors, handleDragEnd } = useExerciseReorder({
    exercisesArr,
    form,
    doneMapRef,
    currentTemplate,
    setCurrentTemplate,
    trainingId,
    nameInputRefs,
    isRenaming,
    resetProgress: useCallback(() => {
      setProgressByExercise({});
      setMostRecentDoneByExercise({});
      setDoneTrigger((c) => c + 1);
    }, []),
  });

  const [showBanner, setShowBanner] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowBanner(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useSessionKeyboardShortcuts({
    activeExerciseIndex,
    exerciseCount: exercisesArr.fields.length,
    onToggleNextDone: handleToggleNextDone,
    onNavigateExercise: handleSidebarClick,
  });

  // Expose addSet for mobile — lives outside swipe container
  const addSetCallbacksRef = useRef<Record<number, () => void>>({});
  const handleAddSetMobile = useCallback(() => {
    const cb = addSetCallbacksRef.current[currentExerciseIndex];
    if (cb) cb();
  }, [currentExerciseIndex]);

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
        sessionId,
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
    <div className="space-y-4">
      {/* Header — negative top margin absorbs layout padding so sticky position is seamless */}
      <div className="bg-background/80 border-border/50 sticky top-0 z-40 -mx-4 -mt-6 border-b px-4 pt-6 pb-3 backdrop-blur-xl md:-mx-6 md:px-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{currentTemplate.name}</h1>
            <SaveStatusIndicator status={saveStatus} />
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted/60 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5">
              <Timer className="text-primary h-3.5 w-3.5" />
              <span className="text-sm font-semibold tabular-nums">
                {elapsed}
              </span>
            </div>
            <DiscardSessionButton sessionId={sessionId} />
          </div>
        </div>
      </div>

      {showBanner && (
        isResuming ? (
          <Alert className="border-blue-500/30 bg-blue-500/10 animate-in fade-in duration-200">
            <RotateCcw className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Resuming session</span>{" "}
              <span className="text-muted-foreground" suppressHydrationWarning>
                started{" "}
                {new Date(inProgress!.startAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                . Your progress has been restored.
              </span>
            </AlertDescription>
          </Alert>
        ) : last?.exercises?.some((e) => (e.sets?.length ?? 0) > 0) ? (
          <Alert className="bg-muted/40 border-border animate-in fade-in duration-200">
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
        ) : null
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {isMobile ? (
            <>
              {/* Mobile: progress bar + swipeable cards */}
              <ExerciseProgressDots
                exerciseNames={exerciseNames}
                progressByExercise={progressByExercise}
                currentIndex={currentExerciseIndex}
                onDotClick={setCurrentExerciseIndex}
              />

              {/* Mobile: no drag-and-drop — swipe gestures conflict with drag handles */}
              <SwipeableExerciseNav
                currentIndex={currentExerciseIndex}
                onIndexChange={setCurrentExerciseIndex}
              >
                {exercisesArr.fields.map((field, exIndex) => (
                  <ExerciseCard
                    key={field.id}
                    field={field}
                    exIndex={exIndex}
                    control={form.control}
                    prevSets={prevSetsByExerciseId[field.templateExerciseId ?? ""] ?? []}
                    mostRecentDoneByExercise={mostRecentDoneByExercise}
                    sessionStartAtMs={sessionStartAtMs}
                    onMostRecentChange={onExerciseMostRecentChange}
                    onProgressChange={onExerciseProgressChange}
                    activeExerciseIndex={activeExerciseIndex}
                    isSubmitting={isSubmitting}
                    initialDoneMap={initialDoneMap}
                    updateDoneMapRef={updateDoneMapRef}
                    onRemove={handleRemoveExercise}
                    addSetCallbacksRef={addSetCallbacksRef}
                    onAddSet={handleAddSetMobile}
                    onNameBlur={handleExerciseNameBlur}
                    nameInputRefs={nameInputRefs}
                  />
                ))}
              </SwipeableExerciseNav>
            </>
          ) : (
            /* Desktop/tablet: sidebar + vertical scroll */
            <div className="flex gap-6">
              <ExerciseSidebar
                exercises={exercisesArr.fields}
                progressByExercise={progressByExercise}
                activeExerciseIndex={activeExerciseIndex}
                onExerciseClick={handleSidebarClick}
              >
                <Button
                  className="w-full"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Complete session
                </Button>
              </ExerciseSidebar>
              <DndContext sensors={dndSensors} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={exercisesArr.fields.map((f) => f.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid min-w-0 flex-1 grid-cols-1 items-start gap-4 xl:grid-cols-2">
                    {exercisesArr.fields.map((field, exIndex) => (
                      <SortableExerciseWrapper
                        key={field.id}
                        id={field.id}
                        exIndex={exIndex}
                        exerciseRefs={exerciseRefs}
                      >
                        {(dragListeners) => (
                          <ExerciseCard
                            field={field}
                            exIndex={exIndex}
                            control={form.control}
                            prevSets={prevSetsByExerciseId[field.templateExerciseId ?? ""] ?? []}
                            mostRecentDoneByExercise={mostRecentDoneByExercise}
                            sessionStartAtMs={sessionStartAtMs}
                            onMostRecentChange={onExerciseMostRecentChange}
                            onProgressChange={onExerciseProgressChange}
                            activeExerciseIndex={activeExerciseIndex}
                            isSubmitting={isSubmitting}
                            initialDoneMap={initialDoneMap}
                            updateDoneMapRef={updateDoneMapRef}
                            onRemove={handleRemoveExercise}
                            addSetCallbacksRef={addSetCallbacksRef}
                            onNameBlur={handleExerciseNameBlur}
                            nameInputRefs={nameInputRefs}
                            dragListeners={dragListeners}
                          />
                        )}
                      </SortableExerciseWrapper>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          <div className="sticky bottom-0 z-40 -mx-4 px-4 py-3 lg:hidden">
            <Button
              className="w-full text-center"
              type="submit"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
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

      <RenameExerciseDialog
        open={!!renameConfirm}
        oldName={renameConfirm?.oldName}
        newName={renameConfirm?.newName}
        onDecision={handleRenameDecision}
        onDismiss={handleRenameDismiss}
      />
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span className="text-muted-foreground flex items-center gap-1 text-xs">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving…</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="text-primary h-3 w-3" />
          <span className="text-primary">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff className="h-3 w-3 text-rose-500" />
          <span className="text-rose-500">Save failed</span>
        </>
      )}
      {status === "stale" && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 text-amber-500"
        >
          <RefreshCw className="h-3 w-3" />
          <span>App updated — tap to refresh</span>
        </button>
      )}
    </span>
  );
}

function SortableExerciseWrapper({
  id,
  exIndex,
  exerciseRefs,
  children,
}: {
  id: string;
  exIndex: number;
  exerciseRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  children: (dragListeners: SyntheticListenerMap) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        exerciseRefs.current[exIndex] = el;
      }}
      style={style}
      className={cn(
        "max-w-lg scroll-mt-36",
        isDragging && "z-50 opacity-75",
      )}
      {...attributes}
    >
      {children(listeners ?? ({} as SyntheticListenerMap))}
    </div>
  );
}

function ExerciseCard({
  field,
  exIndex,
  control,
  prevSets,
  mostRecentDoneByExercise,
  sessionStartAtMs,
  onMostRecentChange,
  onProgressChange,
  activeExerciseIndex,
  isSubmitting,
  initialDoneMap,
  updateDoneMapRef,
  onRemove,
  addSetCallbacksRef,
  onAddSet,
  hideAddSet,
  onNameBlur,
  nameInputRefs,
  dragListeners,
}: {
  field: { id: string; name: string; position: number };
  exIndex: number;
  control: ReturnType<typeof useForm<StrengthSessionFormValues>>["control"];
  prevSets: Array<{ reps: number; weight?: number }>;
  mostRecentDoneByExercise: Record<number, number | null>;
  sessionStartAtMs: number;
  onMostRecentChange: (index: number, mostRecent: number | null) => void;
  onProgressChange: (index: number, done: number, total: number) => void;
  activeExerciseIndex: number | null;
  isSubmitting: boolean;
  initialDoneMap: Record<string, Record<number, boolean>> | null;
  updateDoneMapRef: (
    exIndex: number,
    setId: string,
    setIndex: number,
    isDone: boolean,
  ) => void;
  onRemove: (exIndex: number) => void;
  addSetCallbacksRef: React.MutableRefObject<Record<number, () => void>>;
  onAddSet?: () => void;
  hideAddSet?: boolean;
  // Inline editing props
  onNameBlur?: (exIndex: number, newName: string) => void;
  nameInputRefs?: React.MutableRefObject<Record<number, HTMLInputElement | null>>;
  dragListeners?: SyntheticListenerMap;
}) {
  const isActive = activeExerciseIndex === exIndex;
  const localNameRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-4 shadow-sm transition-all sm:p-5",
        isActive && "ring-primary/20 ring-1",
      )}
    >
      {/* Exercise header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span
            className={cn(
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {exIndex + 1}
          </span>
          <input
            ref={(el) => {
              localNameRef.current = el;
              if (nameInputRefs) nameInputRefs.current[exIndex] = el;
            }}
            type="text"
            defaultValue={field.name}
            className="min-w-0 flex-1 truncate border-b border-transparent bg-transparent text-base font-semibold outline-none transition-colors hover:border-border focus:border-primary"
            onBlur={(e) => onNameBlur?.(exIndex, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") localNameRef.current?.blur();
            }}
          />
        </div>
        <div className="flex items-center gap-1">
          {onAddSet && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-8 gap-1 px-2 text-xs"
              disabled={isSubmitting}
              onClick={onAddSet}
            >
              <Plus className="h-3.5 w-3.5" /> Set
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8"
            disabled={isSubmitting}
            onClick={() => onRemove(exIndex)}
            title="Remove exercise"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {dragListeners && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-grab rounded-md p-1"
              {...dragListeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <ExerciseSets
        control={control}
        exIndex={exIndex}
        prevSets={prevSets}
        prevExerciseLastDoneAt={
          exIndex > 0 ? (mostRecentDoneByExercise[exIndex - 1] ?? null) : null
        }
        sessionStartAtMs={sessionStartAtMs}
        onMostRecentChange={onMostRecentChange}
        onProgressChange={onProgressChange}
        isActive={isActive}
        disabled={isSubmitting}
        initialDoneState={initialDoneMap?.[String(field.position)] ?? null}
        onDoneChange={updateDoneMapRef}
        addSetCallbacksRef={addSetCallbacksRef}
        hideAddSet={onAddSet ? true : hideAddSet}
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
  initialDoneState,
  onDoneChange,
  addSetCallbacksRef,
  hideAddSet,
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
  initialDoneState: Record<number, boolean> | null;
  onDoneChange: (
    exIndex: number,
    setId: string,
    setIndex: number,
    isDone: boolean,
  ) => void;
  addSetCallbacksRef: React.MutableRefObject<Record<number, () => void>>;
  hideAddSet?: boolean;
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

  // Register addSet callback for mobile floating button
  useEffect(() => {
    addSetCallbacksRef.current[exIndex] = () => {
      const lastSet = sets?.[sets.length - 1];
      append({
        setIndex: fields.length,
        reps: lastSet?.reps ?? 5,
        weight: lastSet?.weight ?? undefined,
      });
    };
    return () => {
      delete addSetCallbacksRef.current[exIndex];
    };
  }, [exIndex, sets, fields.length, append, addSetCallbacksRef]);

  const [didRestoreDone, setDidRestoreDone] = useState(false);
  useEffect(() => {
    if (didRestoreDone || !initialDoneState || fields.length === 0) return;
    const restored: Record<string, boolean> = {};
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]!;
      if (initialDoneState[i]) {
        restored[field.id] = true;
        onDoneChange(exIndex, field.id, i, true);
      }
    }
    if (Object.keys(restored).length > 0) {
      setDoneMap(restored);
    }
    setDidRestoreDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDoneState, fields, didRestoreDone]);

  useEffect(() => {
    if (!isActive) return;
    const handler = () => {
      for (let i = 0; i < fields.length; i++) {
        if (!doneMap[fields[i]!.id]) {
          handleToggleDone(fields[i]!.id, i, true);
          break;
        }
      }
    };
    document.addEventListener("session:toggle-next-done", handler);
    return () =>
      document.removeEventListener("session:toggle-next-done", handler);
  }, [isActive, fields, doneMap]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onMostRecentChange(exIndex, localMostRecentDoneAt);
  }, [exIndex, localMostRecentDoneAt, onMostRecentChange]);

  useEffect(() => {
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

  useEffect(() => {
    const total = fields.length;
    const done = fields.reduce(
      (acc, field) => acc + (doneMap[field.id] ? 1 : 0),
      0,
    );
    onProgressChange(exIndex, done, total);
  }, [exIndex, fields, doneMap, onProgressChange]);

  const handleToggleDone = (
    id: string,
    setIndex: number,
    nextValue: boolean,
  ) => {
    setDoneMap((prev) => ({ ...prev, [id]: nextValue }));
    onDoneChange(exIndex, id, setIndex, nextValue);
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
    const m = Math.floor(ms / 60000)
      .toString()
      .padStart(2, "0");
    const s = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-2">
      {/* Rest timer — prominent when active */}
      {isActive && (
        <div className="bg-primary/5 dark:bg-primary/10 flex items-center justify-between rounded-lg px-3 py-2">
          <span className="text-primary text-xs font-medium">Rest timer</span>
          <span className="text-primary text-sm font-bold tabular-nums">
            {currentRest}
          </span>
        </div>
      )}

      {/* Set comparison badge */}
      {(() => {
        const prevCount = prevSets.length;
        const currentCount = fields.length;
        if (prevCount === 0) return null;
        if (currentCount === prevCount)
          return (
            <div className="text-muted-foreground text-xs">
              {prevCount} sets — same as last time
            </div>
          );
        if (currentCount > prevCount)
          return (
            <div className="text-xs font-medium text-emerald-500">
              +{currentCount - prevCount} more set
              {currentCount - prevCount > 1 ? "s" : ""} than last time
            </div>
          );
        return (
          <div className="text-xs font-medium text-rose-400">
            {currentCount}/{prevCount} sets vs last time
          </div>
        );
      })()}

      {/* Set rows */}
      {fields.map((f, setIdx) => {
        const isDone = !!doneMap[f.id];
        const restValue = restBySetId[f.id];

        return (
          <div
            key={f.id}
            className={cn(
              "rounded-xl border p-3 transition-all",
              isDone
                ? "border-primary/20 bg-primary/5 dark:bg-primary/10"
                : "border-border bg-muted/30 dark:bg-muted/20",
            )}
          >
            {/* Set header */}
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-xs font-bold",
                    isDone
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {setIdx + 1}
                </span>

                {/* Done toggle button */}
                <button
                  type="button"
                  onClick={() => handleToggleDone(f.id, setIdx, !isDone)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                    isDone
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-sm border border-current opacity-40" />
                  )}
                  {isDone ? "Done" : "Mark done"}
                </button>

                {restValue !== undefined && (
                  <span className="text-muted-foreground text-[11px] tabular-nums">
                    rest {formatMs(restValue)}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="text-muted-foreground/40 hover:text-destructive p-1 transition-colors"
                tabIndex={-1}
                disabled={disabled}
                onClick={() => remove(setIdx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Steppers */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={control}
                name={`exercises.${exIndex}.sets.${setIdx}.reps`}
                render={({ field }) => (
                  <NumberStepper
                    label="Reps"
                    value={
                      typeof field.value === "string"
                        ? field.value === ""
                          ? null
                          : Number(field.value)
                        : (field.value as number | null | undefined)
                    }
                    onChange={(v) => field.onChange(v ?? "")}
                    min={1}
                    step={1}
                    inputMode="numeric"
                    disabled={isDone || disabled}
                    previousValue={prevSets?.[setIdx]?.reps}
                  />
                )}
              />
              <FormField
                control={control}
                name={`exercises.${exIndex}.sets.${setIdx}.weight`}
                render={({ field }) => (
                  <NumberStepper
                    label="Weight"
                    value={typeof field.value === "number" ? field.value : null}
                    onChange={(v) => field.onChange(v)}
                    min={0}
                    step={1}
                    inputMode="decimal"
                    placeholder="BW"
                    disabled={isDone || disabled}
                    previousValue={prevSets?.[setIdx]?.weight}
                  />
                )}
              />
            </div>
          </div>
        );
      })}

      {/* Add set — visible on desktop, hidden on mobile (moved outside swipe container) */}
      {!hideAddSet && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
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
      )}
    </div>
  );
}
