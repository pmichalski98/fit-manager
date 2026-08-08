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
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Trophy,
  StickyNote,
  Flame,
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
import { Form, FormField } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { NumberStepper } from "@/modules/session/ui/components/number-stepper";
import {
  strengthSessionSchema,
  type StrengthSessionFormValues,
} from "@/modules/session/schemas";
import { completeStrengthSession } from "@/modules/session/actions";
import { addExerciseToTraining } from "@/modules/training/actions";
import { SessionSummaryDialog } from "@/modules/session/ui/components/session-summary-dialog";
import { AddExerciseDialog } from "@/modules/session/ui/components/add-exercise-dialog";
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
import { RestTimer } from "@/modules/session/ui/components/rest-timer";
import { useSessionKeyboardShortcuts } from "@/modules/session/ui/hooks/use-session-keyboard-shortcuts";
import { useExerciseRename } from "@/modules/session/ui/hooks/use-exercise-rename";
import { useExerciseReorder } from "@/modules/session/ui/hooks/use-exercise-reorder";
import { useHorizontalScroll } from "@/modules/session/ui/hooks/use-horizontal-scroll";
import { RenameExerciseDialog } from "@/modules/training/ui/components/rename-exercise-dialog";
import { formatExerciseTarget } from "@/modules/training/lib/format-target";
import {
  getSetProgress,
  isSetRecord,
  type ExerciseRecord,
} from "@/modules/session/lib/set-progress";
import { generateWarmupSets } from "@/modules/session/lib/warmup";
import { cn } from "@/lib/utils";

/** Minimum exercise count before scroll navigation (arrows + dots) is shown */
const MIN_EXERCISES_FOR_SCROLL_NAV = 3;

/** Pause before auto-scrolling on, so the final set's "done" state registers */
const AUTO_ADVANCE_DELAY_MS = 500;

type TemplateExercise = {
  id: string;
  name: string;
  position: number;
  targetSets: number | null;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
};

type Props = {
  template: { id: string; name: string; exercises: TemplateExercise[] };
  last: null | {
    session: { id: string; startAt: string | Date; notes?: string | null };
    exercises: Array<{
      id: string;
      templateExerciseId: string | null;
      name: string;
      position: number;
      notes?: string | null;
      sets: Array<{ setIndex: number; reps: number; weight: string | null }>;
    }>;
  };
  trainingId: string;
  sessionId: string;
  inProgress: InProgressSession | null;
  records: Record<string, ExerciseRecord>;
};

export function StrengthSessionView({
  template,
  last,
  trainingId,
  sessionId,
  inProgress,
  records,
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
        notes: e.notes ?? undefined,
        sets: e.sets.map((s) => ({
          setIndex: s.setIndex,
          reps: s.reps ?? 5,
          weight: s.weight ?? undefined,
        })),
      }));
    }

    return template.exercises.map((e) => {
      const lastEx = last?.exercises.find(
        (le) => le.templateExerciseId === e.id,
      );
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
      if (!ex.templateExerciseId) continue;
      result[ex.templateExerciseId] = (ex.sets ?? []).map((s) => ({
        reps: s.reps,
        weight:
          s.weight != null && s.weight !== "" ? Number(s.weight) : undefined,
      }));
    }
    return result;
  }, [last]);

  // Exercise notes from the previous session, keyed by template exercise ID
  const prevNotesByExerciseId = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    if (!last?.exercises?.length) return result;
    for (const ex of last.exercises) {
      if (!ex.templateExerciseId || !ex.notes) continue;
      result[ex.templateExerciseId] = ex.notes;
    }
    return result;
  }, [last]);

  // Pre-formatted target hint (e.g. "3×8–12") per template exercise ID
  const targetHintByExerciseId = useMemo<Record<string, string | null>>(() => {
    const result: Record<string, string | null> = {};
    for (const ex of currentTemplate.exercises) {
      result[ex.id] = formatExerciseTarget(ex);
    }
    return result;
  }, [currentTemplate.exercises]);

  const form = useForm<StrengthSessionFormValues>({
    resolver: zodResolver(
      strengthSessionSchema,
    ) as Resolver<StrengthSessionFormValues>,
    defaultValues: {
      exercises: defaultExercises,
      trainingId,
      notes: inProgress?.notes ?? undefined,
    },
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
  const showScrollNav =
    exercisesArr.fields.length >= MIN_EXERCISES_FOR_SCROLL_NAV;
  const {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    visibleRange,
    scrollCards,
  } = useHorizontalScroll(!isMobile && showScrollNav);

  const handleSidebarClick = useCallback((index: number) => {
    exerciseRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }, []);

  // Auto-advance on desktop: finishing every set of an exercise scrolls the
  // next one into view. Mobile gets this from the swiper effect above.
  // Forward moves only, so un-checking a set doesn't yank the view backwards.
  const lastAdvancedToRef = useRef<number | null>(null);
  useEffect(() => {
    const prev = lastAdvancedToRef.current;
    lastAdvancedToRef.current = activeExerciseIndex;
    if (isMobile || activeExerciseIndex == null) return;
    if (prev == null || activeExerciseIndex <= prev) return;
    const t = setTimeout(
      () => handleSidebarClick(activeExerciseIndex),
      AUTO_ADVANCE_DELAY_MS,
    );
    return () => clearTimeout(t);
  }, [isMobile, activeExerciseIndex, handleSidebarClick]);

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
  } = useExerciseRename({
    currentTemplate,
    setCurrentTemplate,
    form,
    trainingId,
  });

  const { dndSensors, handleDragEnd, handlePositionSwap } = useExerciseReorder({
    exercisesArr,
    form,
    doneMapRef,
    currentTemplate,
    setCurrentTemplate,
    trainingId,
    isRenaming,
    remapProgress: useCallback(
      (
        oldIndex: number,
        newIndex: number,
        length: number,
        mode: "move" | "swap",
      ) => {
        const remap = (prev: Record<number, unknown>) => {
          const next: Record<number, unknown> = {};
          if (mode === "swap") {
            for (let i = 0; i < length; i++) {
              const src =
                i === oldIndex ? newIndex : i === newIndex ? oldIndex : i;
              if (prev[src] !== undefined) next[i] = prev[src];
            }
          } else {
            for (let i = 0; i < length; i++) {
              let src: number;
              if (i === newIndex) {
                src = oldIndex;
              } else if (oldIndex < newIndex) {
                src = i >= oldIndex && i < newIndex ? i + 1 : i;
              } else {
                src = i > newIndex && i <= oldIndex ? i - 1 : i;
              }
              if (prev[src] !== undefined) next[i] = prev[src];
            }
          }
          return next;
        };
        setProgressByExercise((prev) => remap(prev) as typeof prev);
        setMostRecentDoneByExercise((prev) => remap(prev) as typeof prev);
        setDoneTrigger((c) => c + 1);
      },
      [setProgressByExercise, setMostRecentDoneByExercise, setDoneTrigger],
    ),
  });

  const lastSessionNote = !isResuming ? (last?.session.notes ?? null) : null;
  const [showBanner, setShowBanner] = useState(true);
  useEffect(() => {
    // Give the user time to actually read a note when one is shown
    const t = setTimeout(
      () => setShowBanner(false),
      lastSessionNote ? 8000 : 3000,
    );
    return () => clearTimeout(t);
  }, [lastSessionNote]);

  useSessionKeyboardShortcuts({
    activeExerciseIndex,
    exerciseCount: exercisesArr.fields.length,
    onToggleNextDone: handleToggleNextDone,
    onNavigateExercise: handleSidebarClick,
  });

  // Per-exercise addSet callbacks registered by ExerciseSets; the mobile
  // header button calls its own card's callback by exIndex, never the swipe
  // index (which can drift after auto-advance).
  const addSetCallbacksRef = useRef<Record<number, () => void>>({});

  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const handleAddExercise = useCallback(
    async (name: string, saveToTemplate: boolean) => {
      const position = exercisesArr.fields.length;
      const defaultSets = [{ setIndex: 0, reps: 5, weight: undefined }];

      if (saveToTemplate) {
        try {
          const row = await addExerciseToTraining(trainingId, name);
          setCurrentTemplate((prev) => ({
            ...prev,
            exercises: [
              ...prev.exercises,
              {
                id: row.id,
                name: row.name,
                position: prev.exercises.length,
                targetSets: row.targetSets,
                targetRepsMin: row.targetRepsMin,
                targetRepsMax: row.targetRepsMax,
              },
            ],
          }));
          exercisesArr.append({
            templateExerciseId: row.id,
            name: row.name,
            position,
            sets: defaultSets,
          });
        } catch {
          toast.error("Failed to add exercise to template");
          throw new Error("add-exercise-failed");
        }
      } else {
        exercisesArr.append({
          templateExerciseId: undefined,
          name,
          position,
          sets: defaultSets,
        });
      }

      if (isMobile) {
        setCurrentExerciseIndex(position);
      } else {
        // Card mounts on the next render; scroll once it exists
        setTimeout(() => handleSidebarClick(position), 100);
      }
    },
    [exercisesArr, trainingId, isMobile, handleSidebarClick],
  );

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

      const progressFull =
        values.exercises?.map((ex) => {
          const currentVolume =
            ex.sets?.reduce((sum, s) => {
              const w = s.weight ?? 0;
              const r = s.reps ?? 0;
              return sum + w * r;
            }, 0) ?? 0;
          const prevSets =
            (ex.templateExerciseId
              ? prevSetsByExerciseId[ex.templateExerciseId]
              : undefined) ?? [];
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

  const sessionStats = useMemo(() => {
    let setsDone = 0;
    let setsTotal = 0;
    let exercisesDone = 0;
    for (let i = 0; i < exercisesArr.fields.length; i++) {
      const p = progressByExercise[i];
      if (!p) continue;
      setsDone += p.done;
      setsTotal += p.total;
      if (p.total > 0 && p.done >= p.total) exercisesDone++;
    }
    return { setsDone, setsTotal, exercisesDone };
  }, [exercisesArr.fields.length, progressByExercise]);

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
      <div className="bg-background/85 sticky top-0 z-40 -mx-4 -mt-[calc(var(--safe-top)+1.5rem)] border-b px-4 pt-[calc(var(--safe-top)+1.5rem)] pb-3 backdrop-blur-xl md:-mx-6 md:-mt-6 md:px-6 md:pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            <div className="min-w-0">
              <h1 className="truncate text-[17px] font-bold tracking-tight">
                {currentTemplate.name}
              </h1>
              <SaveStatusIndicator status={saveStatus} />
            </div>
            <div className="text-muted-foreground hidden shrink-0 gap-3.5 border-l pl-3.5 font-mono text-[11px] uppercase md:flex">
              <span>
                Sets{" "}
                <span className="text-foreground">
                  {sessionStats.setsDone}/{sessionStats.setsTotal}
                </span>
              </span>
              <span>
                Ex.{" "}
                <span className="text-foreground">
                  {sessionStats.exercisesDone}/{exercisesArr.fields.length}
                </span>
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="bg-card flex items-center gap-2 rounded-sm border px-3 py-1.5">
              <Timer className="text-primary size-3.5" />
              <span className="font-mono text-sm font-semibold">{elapsed}</span>
            </div>
            <DiscardSessionButton sessionId={sessionId} />
          </div>
        </div>
      </div>

      {showBanner &&
        (isResuming ? (
          <div className="bg-card animate-in fade-in flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-lg border px-3.5 py-2.5 text-xs duration-200">
            <RotateCcw className="text-muted-foreground size-3.5 shrink-0 self-center" />
            <span className="font-semibold">Resuming session</span>
            <span
              className="text-muted-foreground font-mono"
              suppressHydrationWarning
            >
              started{" "}
              {new Date(inProgress!.startAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="text-muted-foreground">
              Your progress has been restored.
            </span>
          </div>
        ) : last?.exercises?.some((e) => (e.sets?.length ?? 0) > 0) ? (
          <div className="bg-card animate-in fade-in flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-lg border px-3.5 py-2.5 text-xs duration-200">
            <History className="text-muted-foreground size-3.5 shrink-0 self-center" />
            <span className="font-semibold">Values from your last session</span>
            <span className="text-muted-foreground font-mono">
              {new Date(last.session.startAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
            {lastSessionNote && (
              <span className="text-muted-foreground italic">
                “{lastSessionNote}”
              </span>
            )}
          </div>
        ) : null)}

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
                    prevSets={
                      prevSetsByExerciseId[field.templateExerciseId ?? ""] ?? []
                    }
                    prevNote={
                      prevNotesByExerciseId[field.templateExerciseId ?? ""] ??
                      null
                    }
                    record={records[field.templateExerciseId ?? ""]}
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
                    onAddSet={() => addSetCallbacksRef.current[exIndex]?.()}
                    targetHint={
                      field.templateExerciseId
                        ? (targetHintByExerciseId[field.templateExerciseId] ??
                          null)
                        : null
                    }
                    onNameBlur={handleExerciseNameBlur}
                    nameInputRefs={nameInputRefs}
                    onPositionSwap={handlePositionSwap}
                    totalExercises={exercisesArr.fields.length}
                  />
                ))}
              </SwipeableExerciseNav>

              <button
                type="button"
                className="border-input text-muted-foreground hover:border-primary hover:text-primary flex h-[34px] w-full items-center justify-center gap-1.5 rounded-sm border border-dashed text-[11px] font-semibold tracking-[0.06em] uppercase transition-colors disabled:pointer-events-none disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => setAddExerciseOpen(true)}
              >
                <Plus className="size-3.5" strokeWidth={2.5} /> Add exercise
              </button>

              <SessionNotesField control={form.control} />
            </>
          ) : (
            /* Desktop/tablet: sidebar + horizontal scroll */
            /* 8rem = sticky header (~5rem) + top padding (~3rem) */
            <div className="flex h-[calc(100svh-8rem)] gap-6">
              <ExerciseSidebar
                exercises={exercisesArr.fields}
                progressByExercise={progressByExercise}
                activeExerciseIndex={activeExerciseIndex}
                onExerciseClick={handleSidebarClick}
              >
                <SessionNotesField control={form.control} className="mb-3" />
                <Button
                  className="w-full"
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
              </ExerciseSidebar>
              <div className="flex min-w-0 flex-1 flex-col">
                <DndContext
                  id="session-exercises"
                  sensors={dndSensors}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={exercisesArr.fields.map((f) => f.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div
                      ref={scrollContainerRef}
                      className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory items-stretch gap-4 overflow-x-auto"
                    >
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
                              prevSets={
                                prevSetsByExerciseId[
                                  field.templateExerciseId ?? ""
                                ] ?? []
                              }
                              prevNote={
                                prevNotesByExerciseId[
                                  field.templateExerciseId ?? ""
                                ] ?? null
                              }
                              record={records[field.templateExerciseId ?? ""]}
                              mostRecentDoneByExercise={
                                mostRecentDoneByExercise
                              }
                              sessionStartAtMs={sessionStartAtMs}
                              onMostRecentChange={onExerciseMostRecentChange}
                              onProgressChange={onExerciseProgressChange}
                              activeExerciseIndex={activeExerciseIndex}
                              isSubmitting={isSubmitting}
                              initialDoneMap={initialDoneMap}
                              updateDoneMapRef={updateDoneMapRef}
                              onRemove={handleRemoveExercise}
                              addSetCallbacksRef={addSetCallbacksRef}
                              targetHint={
                                field.templateExerciseId
                                  ? (targetHintByExerciseId[
                                      field.templateExerciseId
                                    ] ?? null)
                                  : null
                              }
                              onNameBlur={handleExerciseNameBlur}
                              nameInputRefs={nameInputRefs}
                              dragListeners={dragListeners}
                              onPositionSwap={handlePositionSwap}
                              totalExercises={exercisesArr.fields.length}
                            />
                          )}
                        </SortableExerciseWrapper>
                      ))}
                      <button
                        type="button"
                        onClick={() => setAddExerciseOpen(true)}
                        disabled={isSubmitting}
                        className="border-input text-faint hover:border-primary hover:text-primary flex h-full w-[calc(50%-0.5rem)] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed transition-colors"
                      >
                        <Plus className="size-[22px]" />
                        <span className="text-[11px] font-semibold tracking-[0.06em] uppercase">
                          Add exercise
                        </span>
                      </button>
                    </div>
                  </SortableContext>
                </DndContext>

                {/* Scroll navigation */}
                {showScrollNav && (
                  <div className="flex items-center justify-center gap-3 pt-3">
                    <ScrollArrow
                      direction="left"
                      disabled={!canScrollLeft}
                      onClick={() => scrollCards("left")}
                    />
                    <div className="flex items-center gap-1.5">
                      {exercisesArr.fields.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-[5px] rounded-[3px] transition-all duration-300",
                            i >= visibleRange[0] && i <= visibleRange[1]
                              ? "bg-primary w-3.5"
                              : "bg-input w-[5px]",
                          )}
                        />
                      ))}
                    </div>
                    <ScrollArrow
                      direction="right"
                      disabled={!canScrollRight}
                      onClick={() => scrollCards("right")}
                    />
                  </div>
                )}
              </div>
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

      <AddExerciseDialog
        open={addExerciseOpen}
        onOpenChange={setAddExerciseOpen}
        onAdd={handleAddExercise}
      />
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  return (
    <span className="text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
      {status === "saving" && (
        <>
          <Loader2 className="size-3 animate-spin" />
          <span>saving…</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="text-primary size-3" strokeWidth={2.5} />
          <span className="text-primary">saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff className="text-destructive size-3" />
          <span className="text-destructive">save failed</span>
        </>
      )}
      {status === "stale" && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 text-amber-500"
        >
          <RefreshCw className="size-3" />
          <span>app updated — tap to refresh</span>
        </button>
      )}
    </span>
  );
}

function ScrollArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-faint hover:bg-card hover:text-foreground flex size-[26px] items-center justify-center rounded-[4px] transition-colors disabled:opacity-0"
    >
      <Icon className="size-3.5" />
    </button>
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
        // 0.5rem = half of gap-4 (1rem) on the scroll container
        "h-full w-[calc(50%-0.5rem)] shrink-0 snap-start",
        isDragging && "z-50 opacity-75",
      )}
      {...attributes}
      tabIndex={-1}
    >
      {children(listeners ?? ({} as SyntheticListenerMap))}
    </div>
  );
}

function SessionNotesField({
  control,
  className,
}: {
  control: ReturnType<typeof useForm<StrengthSessionFormValues>>["control"];
  className?: string;
}) {
  return (
    <FormField
      control={control}
      name="notes"
      render={({ field }) => (
        <Textarea
          value={field.value ?? ""}
          onChange={field.onChange}
          placeholder="Session notes (optional)"
          rows={2}
          className={cn("bg-card resize-none text-xs", className)}
        />
      )}
    />
  );
}

function ExerciseCard({
  field,
  exIndex,
  control,
  prevSets,
  prevNote,
  record,
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
  targetHint,
  onNameBlur,
  nameInputRefs,
  dragListeners,
  onPositionSwap,
  totalExercises,
}: {
  field: { id: string; name: string; position: number };
  exIndex: number;
  control: ReturnType<typeof useForm<StrengthSessionFormValues>>["control"];
  prevSets: Array<{ reps: number; weight?: number }>;
  prevNote?: string | null;
  record?: ExerciseRecord;
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
  targetHint?: string | null;
  // Inline editing props
  onNameBlur?: (exIndex: number, newName: string) => void;
  nameInputRefs?: React.MutableRefObject<
    Record<number, HTMLInputElement | null>
  >;
  dragListeners?: SyntheticListenerMap;
  onPositionSwap?: (fromIndex: number, toIndex: number) => void;
  totalExercises?: number;
}) {
  const isActive = activeExerciseIndex === exIndex;
  const localNameRef = useRef<HTMLInputElement>(null);
  const posInputRef = useRef<HTMLInputElement>(null);

  const prevExerciseLastDoneAt =
    exIndex > 0 ? (mostRecentDoneByExercise[exIndex - 1] ?? null) : null;
  // Rest runs from this exercise's last completed set, else the previous
  // exercise's, else the start of the session.
  const restStartAt =
    mostRecentDoneByExercise[exIndex] ??
    prevExerciseLastDoneAt ??
    sessionStartAtMs;

  const noteValue = useWatch({ control, name: `exercises.${exIndex}.notes` });
  const hasNote = typeof noteValue === "string" && noteValue.length > 0;
  // Open by default when a note was restored (resume); toggleable afterwards
  const [notesOpen, setNotesOpen] = useState(hasNote);

  const [warmupOpen, setWarmupOpen] = useState(false);
  const setsValue = useWatch({ control, name: `exercises.${exIndex}.sets` });
  // Working weight: first set entered this session, else last session's top set
  const firstSetWeight = setsValue?.[0]?.weight;
  const prevTopWeight = prevSets.reduce(
    (max, s) => Math.max(max, s.weight ?? 0),
    0,
  );
  const workingWeight =
    firstSetWeight != null && firstSetWeight > 0
      ? firstSetWeight
      : prevTopWeight > 0
        ? prevTopWeight
        : null;
  const warmupSets =
    warmupOpen && workingWeight != null
      ? generateWarmupSets(workingWeight)
      : [];

  // Sync displayed position when exIndex changes (e.g. after another card's swap)
  useEffect(() => {
    if (posInputRef.current && document.activeElement !== posInputRef.current) {
      posInputRef.current.value = String(exIndex + 1);
    }
  }, [exIndex]);

  return (
    <div
      className={cn(
        "bg-card flex h-full flex-col rounded-[10px] border transition-all",
        isActive &&
          "border-primary ring-primary/25 shadow-[0_8px_24px_rgba(0,0,0,0.3)] ring-1",
      )}
    >
      {/* Exercise header — fixed at top */}
      <div className="flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <input
            ref={posInputRef}
            type="text"
            inputMode="numeric"
            tabIndex={-1}
            defaultValue={exIndex + 1}
            className={cn(
              "inline-flex size-[26px] shrink-0 items-center justify-center rounded-sm text-center font-mono text-xs font-bold outline-none",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
            onFocus={(e) => e.target.select()}
            onBlur={(e) => {
              const newPos = parseInt(e.target.value, 10);
              if (
                !isNaN(newPos) &&
                newPos >= 1 &&
                newPos <= (totalExercises ?? 1)
              ) {
                onPositionSwap?.(exIndex, newPos - 1);
              }
              e.target.value = String(exIndex + 1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                (e.target as HTMLInputElement).value = String(exIndex + 1);
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          <input
            ref={(el) => {
              localNameRef.current = el;
              if (nameInputRefs) nameInputRefs.current[exIndex] = el;
            }}
            type="text"
            defaultValue={field.name}
            tabIndex={-1}
            className="hover:border-border focus:border-primary min-w-0 flex-1 truncate border-b border-transparent bg-transparent text-[15px] font-bold tracking-tight transition-colors outline-none"
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
              className="text-muted-foreground hover:text-primary h-7 gap-1 px-2 text-[11px]"
              disabled={isSubmitting}
              onClick={onAddSet}
            >
              <Plus className="size-3.5" strokeWidth={2.5} /> Set
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "hover:text-cardio size-7",
              warmupOpen ? "text-cardio" : "text-muted-foreground",
            )}
            tabIndex={-1}
            disabled={isSubmitting}
            onClick={() => setWarmupOpen((v) => !v)}
            title="Warmup sets"
          >
            <Flame className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "size-7",
              hasNote ? "text-primary" : "text-muted-foreground",
            )}
            tabIndex={-1}
            disabled={isSubmitting}
            onClick={() => setNotesOpen((v) => !v)}
            title="Exercise notes"
          >
            <StickyNote className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-7"
            tabIndex={-1}
            disabled={isSubmitting}
            onClick={() => onRemove(exIndex)}
            title="Remove exercise"
          >
            <Trash2 className="size-3.5" />
          </Button>
          {dragListeners && (
            <button
              type="button"
              tabIndex={-1}
              className="text-muted-foreground hover:text-foreground cursor-grab rounded-md p-1"
              {...dragListeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {/* Rest timer — pinned above the scrollable sets so it never scrolls away */}
      {isActive && (
        <div className="px-4 pt-2.5 sm:px-5">
          <RestTimer startAt={restStartAt} />
        </div>
      )}
      {(targetHint || prevSets.length > 0) && (
        <p className="text-muted-foreground px-4 pt-1 font-mono text-[11px] sm:px-5">
          {targetHint ? `target ${targetHint}` : null}
          {targetHint && prevSets.length > 0 ? " · " : null}
          {prevSets.length > 0
            ? `prev ${prevSets.length} ${prevSets.length === 1 ? "set" : "sets"}`
            : null}
        </p>
      )}
      {prevNote && (
        <p className="text-muted-foreground px-4 pt-1 text-[11px] italic sm:px-5">
          Last note: “{prevNote}”
        </p>
      )}
      {warmupOpen && (
        <div className="px-4 pt-2 sm:px-5">
          {workingWeight != null && warmupSets.length > 0 ? (
            <div className="bg-input-bg rounded-lg border px-3 py-2">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.08em] uppercase">
                Warmup for {workingWeight} kg
              </p>
              <ul className="mt-1 space-y-0.5">
                {warmupSets.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-baseline gap-2 font-mono text-xs"
                  >
                    <span className="text-muted-foreground w-9 shrink-0 text-[10px]">
                      {s.label}
                    </span>
                    <span className="font-medium">{s.weightKg} kg</span>
                    <span className="text-muted-foreground">× {s.reps}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Enter a working weight (or finish a previous session) to generate
              warmup sets.
            </p>
          )}
        </div>
      )}
      {notesOpen && (
        <div className="px-4 pt-2 sm:px-5">
          <FormField
            control={control}
            name={`exercises.${exIndex}.notes`}
            render={({ field: noteField }) => (
              <Textarea
                value={noteField.value ?? ""}
                onChange={noteField.onChange}
                placeholder="Notes for this exercise…"
                rows={2}
                disabled={isSubmitting}
                className="resize-none text-sm"
              />
            )}
          />
        </div>
      )}
      {/* Scrollable sets area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-4 sm:px-5 sm:pb-5">
        <ExerciseSets
          control={control}
          exIndex={exIndex}
          prevSets={prevSets}
          record={record}
          prevExerciseLastDoneAt={prevExerciseLastDoneAt}
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
    </div>
  );
}

function ExerciseSets({
  control,
  exIndex,
  prevSets,
  record,
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
  record?: ExerciseRecord;
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
      {/* Set rows */}
      {fields.map((f, setIdx) => {
        const isDone = !!doneMap[f.id];
        const restValue = restBySetId[f.id];

        const watched = sets?.[setIdx];
        const currentSet = {
          reps:
            typeof watched?.reps === "number"
              ? watched.reps
              : watched?.reps
                ? Number(watched.reps)
                : null,
          weight: typeof watched?.weight === "number" ? watched.weight : null,
        };
        const progress = getSetProgress(currentSet, prevSets?.[setIdx]);
        const isPr = isSetRecord(currentSet, record);

        return (
          <div
            key={f.id}
            className={cn(
              "rounded-lg border px-3 py-2.5 transition-all",
              isDone ? "border-primary/25 bg-primary/6" : "bg-input-bg",
            )}
          >
            {/* Set header */}
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[4px] px-1 font-mono text-[11px] font-bold",
                    isDone
                      ? "bg-primary/18 text-primary"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {setIdx + 1}
                </span>

                {/* Done toggle button */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => handleToggleDone(f.id, setIdx, !isDone)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-[3px] text-[11px] font-semibold tracking-[0.04em] uppercase transition-all",
                    isDone
                      ? "bg-primary/18 text-primary border-transparent"
                      : "border-input text-muted-foreground hover:border-primary hover:text-primary",
                  )}
                >
                  {isDone ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : (
                    <div className="size-[11px] rounded-[2px] border border-current opacity-50" />
                  )}
                  {isDone ? "Done" : "Mark done"}
                </button>

                {restValue !== undefined && (
                  <span className="text-muted-foreground font-mono text-[10px]">
                    rest {formatMs(restValue)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isPr && (
                  <span
                    className="inline-flex items-center gap-1 rounded-[4px] bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-500"
                    title="Personal record — best ever for this exercise"
                  >
                    <Trophy className="size-[11px]" /> PR
                  </span>
                )}
                {progress.delta !== "none" && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                      progress.delta === "up"
                        ? "bg-primary/12 text-primary"
                        : progress.delta === "down"
                          ? "bg-destructive/10 text-destructive"
                          : "text-muted-foreground/60",
                    )}
                    title="Estimated 1RM vs same set last session"
                  >
                    {progress.delta === "up" && (
                      <TrendingUp className="size-[11px]" />
                    )}
                    {progress.delta === "down" && (
                      <TrendingDown className="size-[11px]" />
                    )}
                    {progress.label}
                  </span>
                )}
                <button
                  type="button"
                  className="text-faint hover:text-destructive p-1 transition-colors"
                  tabIndex={-1}
                  disabled={disabled}
                  onClick={() => remove(setIdx)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
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
                    value={
                      typeof field.value === "number" && field.value !== 0
                        ? field.value
                        : null
                    }
                    onChange={(v) => field.onChange(v === 0 ? null : v)}
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
        <button
          type="button"
          className="border-input text-muted-foreground hover:border-primary hover:text-primary flex h-[34px] w-full items-center justify-center gap-1.5 rounded-sm border border-dashed text-[11px] font-semibold tracking-[0.06em] uppercase transition-colors disabled:pointer-events-none disabled:opacity-50"
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
          <Plus className="size-3.5" strokeWidth={2.5} /> Add set
        </button>
      )}
    </div>
  );
}
