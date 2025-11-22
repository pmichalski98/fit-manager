import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { DeleteTrainingButton } from "../components/delete-training-button";
import { EditTrainingDialog } from "./edit-training-dialog";

type StrengthExercise = {
  id: string;
  position: number;
  name: string;
};

const formatTrainingType = (type: string) =>
  type
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

type TrainingCardProps = {
  training: {
    id: string;
    name: string;
    type: "strength" | "cardio";
    lastSessionAt: Date | null;
    exercises: StrengthExercise[];
  };
};

export function TrainingCard({ training }: TrainingCardProps) {
  const exercises = training.exercises ?? [];
  const isCardio = training.type === "cardio";

  return (
    <li
      className={`border-border/50 bg-card flex flex-col gap-4 rounded-3xl border px-6 py-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl ${
        isCardio
          ? "border-orange-500/30 bg-linear-to-br from-orange-500/5 to-transparent"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold tracking-[0.3em] uppercase ${
              isCardio ? "text-orange-500" : "text-primary"
            }`}
          >
            {formatTrainingType(training.type)}
          </p>
          <h3 className="text-card-foreground text-lg font-semibold">
            {training.name}
          </h3>
          {training.lastSessionAt && (
            <p className="text-chart-4 mt-1 text-xs">
              {formatDistanceToNow(new Date(training.lastSessionAt), {
                addSuffix: true,
              })}
            </p>
          )}
        </div>
        {!isCardio && (
          <div className="text-muted-foreground text-right text-sm font-semibold">
            <span className="text-muted-foreground block text-xs tracking-widest uppercase">
              exercises
            </span>
            <span>{exercises.length}</span>
          </div>
        )}
      </div>

      {!isCardio && (
        <>
          {exercises.length ? (
            <div className="text-muted-foreground space-y-2 text-sm">
              <p className="text-muted-foreground text-xs tracking-[0.4em] uppercase">
                Preview
              </p>
              <div className="flex flex-wrap gap-2">
                {exercises.map((exercise) => (
                  <span
                    key={exercise.id}
                    className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium"
                  >
                    {exercise.position + 1}. {exercise.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No exercises added yet. Add a few to turn this into a real session
              builder.
            </p>
          )}
        </>
      )}

      {isCardio && (
        <p className="text-muted-foreground text-sm">
          Cardio training session ready to start.
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-3">
        <Button asChild>
          <Link
            href={`/training/session/${training.id}`}
            className="w-full flex-1"
          >
            {isCardio ? "Start cardio" : "Start workout"}
          </Link>
        </Button>
        <EditTrainingDialog training={training} />
        <DeleteTrainingButton trainingId={training.id} />
      </div>
    </li>
  );
}
