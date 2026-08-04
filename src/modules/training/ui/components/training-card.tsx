import { Button } from "@/components/ui/button";
import { formatDurationMin } from "@/modules/dashboard/utils";
import { formatExerciseTarget } from "@/modules/training/lib/format-target";
import { formatDistanceToNow } from "date-fns";
import { Play } from "lucide-react";
import Link from "next/link";
import { DeleteTrainingButton } from "../components/delete-training-button";
import { EditTrainingDialog } from "./edit-training-dialog";
import { ToggleActiveButton } from "./toggle-active-button";

type StrengthExercise = {
  id: string;
  position: number;
  name: string;
  targetSets: number | null;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
};

type LastCardioStats = {
  durationMin: number;
  distanceKm: string | null;
  kcal: number | null;
  avgSpeedKmh: string | null;
};

type TrainingCardProps = {
  training: {
    id: string;
    name: string;
    type: "strength" | "cardio";
    isActive: boolean;
    lastSessionAt: Date | null;
    exercises: StrengthExercise[];
    lastCardio?: LastCardioStats | null;
  };
};

function CardioStatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2.5 text-xs">
      <span className="text-muted-foreground min-w-0 flex-1 truncate">
        {label}
      </span>
      <span className="shrink-0 font-mono text-[11px]">{value}</span>
    </div>
  );
}

export function TrainingCard({ training }: TrainingCardProps) {
  const exercises = training.exercises ?? [];
  const isCardio = training.type === "cardio";
  const isInactive = !training.isActive;
  const lastCardio = training.lastCardio ?? null;

  const lastCardioSummary = lastCardio
    ? [
        lastCardio.distanceKm != null
          ? `${parseFloat(lastCardio.distanceKm)} km`
          : null,
        formatDurationMin(lastCardio.durationMin),
        lastCardio.kcal != null ? `${lastCardio.kcal} kcal` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  const meta = isCardio
    ? "cardio"
    : `${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"} · strength`;

  return (
    <li
      className={`bg-card hover:border-ring flex min-w-0 flex-col rounded-[10px] border transition-colors ${
        isInactive ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 px-[18px] pt-4 pb-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold tracking-tight">
            {training.name}
          </h3>
          <p className="text-muted-foreground mt-1 text-[10px] font-medium tracking-[0.08em] uppercase">
            {meta}
          </p>
        </div>
        {training.lastSessionAt && (
          <span
            className={`shrink-0 font-mono text-[11px] whitespace-nowrap ${
              isCardio ? "text-cardio" : "text-primary"
            }`}
          >
            {formatDistanceToNow(new Date(training.lastSessionAt), {
              addSuffix: true,
            })}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t px-[18px] py-2.5">
        {isCardio ? (
          lastCardioSummary ? (
            <>
              <CardioStatRow label="Last session" value={lastCardioSummary} />
              {lastCardio?.avgSpeedKmh != null && (
                <CardioStatRow
                  label="Avg speed"
                  value={`${parseFloat(lastCardio.avgSpeedKmh)} km/h`}
                />
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-xs">
              No sessions yet. Stats will show up after the first ride.
            </p>
          )
        ) : exercises.length ? (
          exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-baseline gap-2.5 text-xs"
            >
              <span className="text-faint shrink-0 font-mono text-[10px]">
                {String(exercise.position + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate">{exercise.name}</span>
              <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                {formatExerciseTarget(exercise)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-xs">
            No exercises added yet. Add a few to turn this into a real session
            builder.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t px-[18px] py-3">
        <Button
          asChild
          variant={isCardio ? "outline" : "default"}
          className={
            isCardio
              ? "border-cardio text-cardio hover:border-cardio hover:bg-cardio/10 hover:text-cardio min-w-0 flex-1 font-bold"
              : "min-w-0 flex-1"
          }
        >
          <Link href={`/training/session/${training.id}`}>
            <Play className="size-3 fill-current stroke-none" />
            {isCardio ? "Start cardio" : "Start"}
          </Link>
        </Button>
        <ToggleActiveButton
          trainingId={training.id}
          isActive={training.isActive}
        />
        <EditTrainingDialog training={training} />
        <DeleteTrainingButton trainingId={training.id} />
      </div>
    </li>
  );
}
