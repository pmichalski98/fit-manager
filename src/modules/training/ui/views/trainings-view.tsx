import { getAllTrainingsWithExercises } from "@/modules/training/actions";
import { CreateTrainingDialog } from "../components/create-training-dialog";
import { TrainingCard } from "../components/training-card";

export async function TrainingsView() {
  const { data: trainings } = await getAllTrainingsWithExercises();

  const sortByActive = <T extends { isActive: boolean }>(items: T[]) =>
    [...items].sort((a, b) => Number(b.isActive) - Number(a.isActive));

  const sections = [
    {
      key: "strength",
      label: "Strength",
      accent: "text-primary",
      items: sortByActive(trainings.filter((t) => t.type === "strength")),
    },
    {
      key: "cardio",
      label: "Cardio",
      accent: "text-orange-500",
      items: sortByActive(trainings.filter((t) => t.type === "cardio")),
    },
  ].filter((s) => s.items.length > 0);

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
        <div>
          <p className="text-foreground text-lg font-medium">
            No trainings yet
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a training to start building a routine you can repeat
            consistently.
          </p>
        </div>
        <CreateTrainingDialog />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.key}>
          <h2 className="mb-4 flex items-baseline gap-2">
            <span
              className={`text-sm font-semibold tracking-widest uppercase ${section.accent}`}
            >
              {section.label}
            </span>
            <span className="text-muted-foreground text-xs font-medium">
              {section.items.length}
            </span>
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {section.items.map((training) => (
              <TrainingCard key={training.id} training={training} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
