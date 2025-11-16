import { Button } from "@/components/ui/button";
import { getAllTrainingsWithExercises } from "@/modules/training/actions";
import { startTrainingSession } from "@/modules/session/actions";
import { DeleteTrainingButton } from "../components/delete-training-button";

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

export async function TrainingsView() {
  const { data: trainings } = await getAllTrainingsWithExercises();

  return (
    <div className="space-y-8">
      <section className="border-border/60 from-primary/10 rounded-3xl border bg-linear-to-br to-transparent p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-foreground text-sm font-semibold">
            Training library
          </p>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Every training template you have created lives here. Start a session
            from the list below or keep refining them so your next workout stays
            purposeful.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold tracking-widest uppercase">
            <span className="bg-primary/10 text-primary rounded-full px-3 py-1">
              {trainings.length} template{trainings.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

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
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trainings.map((training) => {
            const exercises = (training.exercises ?? []) as StrengthExercise[];
            const isCardio = training.type === "cardio";

            return (
              <li
                key={training.id}
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
                        No exercises added yet. Add a few to turn this into a
                        real session builder.
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
                  <form
                    action={startTrainingSession.bind(null, {
                      trainingId: training.id,
                    })}
                    className="flex-1"
                  >
                    <Button type="submit" className="w-full" size="sm">
                      {isCardio ? "Start cardio" : "Start workout"}
                    </Button>
                  </form>
                  <DeleteTrainingButton trainingId={training.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
