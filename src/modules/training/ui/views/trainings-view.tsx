import { getAllTrainingsWithExercises } from "@/modules/training/actions";
import { TrainingCard } from "../components/training-card";
import { TrainingsHero } from "../components/trainings-hero";

export async function TrainingsView() {
  const { data: trainings } = await getAllTrainingsWithExercises();

  const strengthTrainings = trainings.filter((t) => t.type === "strength");
  const cardioTrainings = trainings.filter((t) => t.type === "cardio");

  return (
    <div className="space-y-8">
      <TrainingsHero trainingsLength={trainings.length} />

      {trainings.length === 0 ? (
        <div className="border-border/60 rounded-2xl border border-dashed p-8 text-center">
          <p className="text-foreground text-lg font-medium">
            No trainings yet
          </p>
          <p className="text-muted-foreground text-sm">
            Create a training to start building a routine you can repeat
            consistently.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            {strengthTrainings.length > 0 && (
              <>
                <h2 className="text-foreground mb-4 text-sm font-semibold tracking-widest uppercase">
                  Strength
                </h2>
                <ul className="grid grid-cols-1 gap-6">
                  {strengthTrainings.map((training) => (
                    <TrainingCard key={training.id} training={training} />
                  ))}
                </ul>
              </>
            )}
          </div>
          <div>
            {cardioTrainings.length > 0 && (
              <>
                <h2 className="text-foreground mb-4 text-sm font-semibold tracking-widest uppercase">
                  Cardio
                </h2>
                <ul className="grid grid-cols-1 gap-6">
                  {cardioTrainings.map((training) => (
                    <TrainingCard key={training.id} training={training} />
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
